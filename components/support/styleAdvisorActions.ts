"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { bedrockClient, NOVA_LITE_MODEL_ID } from "@/lib/ai/client";
import { InvokeModelCommand, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { headers } from "next/headers";

/**
 * Analyzes user's style based on order history
 */
export async function analyzeUserStyleAction() {
    const payload = await getPayload({ config });
    const headerStack = await headers();
    const { user } = await payload.auth({ headers: headerStack });

    if (!user) {
        return { error: "Please log in to see your personalized style analysis." };
    }

    try {
        // 1. Get last 10 orders for this user
        const orders = await payload.find({
            collection: 'orders',
            where: {
                user: { equals: user.id }
            },
            sort: '-createdAt',
            limit: 10,
        });

        if (orders.totalDocs === 0) {
            return { 
                analysis: "It looks like you haven't made any orders yet! Once you do, I'll be able to analyze your specific taste. For now, I can suggest some of our most popular trends.",
                recommendations: await getTrendingProducts(payload)
            };
        }

        // 2. Extract unique product IDs and fetch their tags
        const productIds = new Set<string>();
        orders.docs.forEach(order => {
            order.items?.forEach((item: any) => {
                if (item.productId) productIds.add(item.productId);
            });
        });

        const products = await payload.find({
            collection: 'products',
            where: {
                id: { in: Array.from(productIds) }
            },
            depth: 0
        });

        const allTags = new Set<string>();
        products.docs.forEach((product: any) => {
            if (product.tags) {
                product.tags.forEach((t: any) => allTags.add(t.tag.toLowerCase()));
            }
        });

        const tagsList = Array.from(allTags);

        if (tagsList.length === 0) {
            return {
                analysis: "I see your orders, but I'm still learning about the specific styles you like. Check out these curated pieces in the meantime!",
                recommendations: await getTrendingProducts(payload)
            };
        }

        // 3. Send to Nova for analysis
        const analysisPrompt = `
            Analyze this list of fashion tags from a user's purchase history and define their style profile.
            Tags: ${tagsList.join(", ")}
            
            Return a JSON object with:
            1. "analysis": A 2-sentence sophisticated summary of their style (e.g. "You lean towards minimalist urban aesthetics...").
            2. "searchKeywords": Top 3 keywords to search for products they would LOVE (e.g. ["monochrome", "linen", "oversized"]).
            3. "explanation": A very brief explanation of WHY you picked these.
            
            Return ONLY the raw JSON.
        `;

        const aiResponse = await callNova(analysisPrompt);
        
        // 4. Fetch actual recommendations based on AI keywords
        const recommendations = await getActualProductsFromKeywords(payload, aiResponse.searchKeywords || []);

        return {
            analysis: aiResponse.analysis,
            explanation: aiResponse.explanation,
            recommendations: recommendations
        };

    } catch (err) {
        console.error("[StyleAdvisor] Action Error:", err);
        return { error: "I had a bit of trouble analyzing your style. Let's try again in a moment." };
    }
}

/**
 * Gets style recommendations based on a user's text query, chat history, and optional image
 */
export async function getStyleRecommendationsAction(query: string, history: any[] = [], image?: string | null) {
    const payload = await getPayload({ config });
    const headerStack = await headers();
    const { user } = await payload.auth({ headers: headerStack });

    try {
        // Sanitise history to avoid "temporary client reference" dotting errors in Next.js
        const cleanHistory = history.map(m => ({
            role: String(m.role || ""),
            content: String(m.content || "")
        }));

        const historyContext = cleanHistory.slice(-4).map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
        
        const prompt = `
            You are "Nova", a sophisticated AI Fashion Stylist for "TSEW". 
            Your goal is to provide expert, direct fashion advice and orchestrate demo-ready shopping actions.
            
            ${image ? "The user has uploaded a photo of an item. Analyze its color, style, and fit from the image provided." : ""}

            CONTEXT HISTORY:
            ${historyContext}

            CURRENT USER REQUEST: "${query}"
            
            TASK: 
            - If the user wants to "Build an outfit" or "Complete the look", you MUST suggest exactly 3 items: a Top, a Bottom, and Shoes that match perfectly.
            - Respond DIRECTLY to the user with helpful styling advice. 
            
            Return a JSON object with:
            1. "analysis": A CONCISE (max 2 sentences), expert response addressed TO THE USER. Mention if they can "reserve for pickup" if they seem interested in specific items.
            2. "recommendedItems": A list of 2-3 specific property-based product descriptors (e.g., ["black leather boots", "white slim fit shirt"]). 
               IMPORTANT: For "Build Outfit" or "Complete look", provide 3 items (Top, Bottom, Shoes).
            3. "filters": An optional object containing search filters like "maxPrice".
            4. "actions": An optional array of valid action strings. Currently supported: ["reserve_pickup"]. Include this if the user asks for a specific item and might want to pick it up.
            
            Return ONLY the raw JSON.
        `;

        const aiResponse = await callNova(prompt, image);
        const recommendations = await getActualProductsFromKeywords(
            payload, 
            aiResponse.recommendedItems || [], 
            aiResponse.filters
        );

        // Log to product requests if nothing found
        if (recommendations.length === 0) {
            // @ts-ignore - ProductRequests collection is newly added, types may not be updated yet
            await payload.create({
                collection: 'product-requests',
                data: {
                    query: query,
                    user: user?.id || null,
                    history: cleanHistory.slice(-4)
                }
            });
            
            return {
                analysis: aiResponse.analysis + " (We've notified our team they are looking to get this to you)",
                recommendations: [],
                notFound: true,
                actions: aiResponse.actions
            };
        }

        return {
            analysis: aiResponse.analysis,
            recommendations: recommendations,
            actions: aiResponse.actions
        };
    } catch (err) {
        console.error("[StyleAdvisor] Query Error:", err);
        return { analysis: "I'm sorry, I couldn't process that request right now.", recommendations: [] };
    }
}

async function callNova(prompt: string, imageBase64?: string | null) {
    const content: any[] = [{ text: prompt }];

    if (imageBase64) {
        // Handle data URL prefix if present
        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const format = imageBase64.includes('image/png') ? 'png' : 
                      imageBase64.includes('image/gif') ? 'gif' : 
                      imageBase64.includes('image/webp') ? 'webp' : 'jpeg';

        content.push({
            image: {
                format: format,
                source: {
                    bytes: Buffer.from(base64Data, 'base64')
                }
            }
        });
    }

    const command = new ConverseCommand({
        modelId: NOVA_LITE_MODEL_ID,
        messages: [{ role: "user", content }],
        inferenceConfig: { maxTokens: 500, temperature: 0.7 },
    });

    const result = await bedrockClient.send(command);
    const resultText = result.output?.message?.content?.[0]?.text || "{}";
    
    return JSON.parse(resultText.replace(/```json|```/g, "").trim());
}

async function getActualProductsFromKeywords(payload: any, recommendedItems: string[], filters?: any) {
    if (!recommendedItems || recommendedItems.length === 0) return [];

    const allMatchedProducts: any[] = [];
    const productIds = new Set<string>();

    for (const item of recommendedItems) {
        // Strip common search verbs and filler words
        const fillerWords = ['show', 'find', 'me', 'search', 'look', 'for', 'get', 'give', 'the', 'some', 'with'];
        const tokens = item.toLowerCase()
            .split(/\s+/)
            .filter(word => word.length > 2 && !fillerWords.includes(word));
        
        if (tokens.length === 0) continue;

        // Construct base filters
        const andFilters: any[] = [
            { status: { equals: 'live' } }
        ];

        // Apply dynamic filters from AI
        if (filters?.maxPrice) {
            andFilters.push({ basePrice: { less_than_equal: Number(filters.maxPrice) } });
        }

        // Add token matching
        andFilters.push(...tokens.map(token => ({
            or: [
                { name: { contains: token } },
                { 'tags.tag': { contains: token } }
            ]
        })));

        // For each recommended item (e.g., "black boots"), search for products matching ALL tokens + filters
        const products = await payload.find({
            collection: 'products',
            where: {
                and: andFilters
            },
            limit: 2,
            depth: 1
        });

        products.docs.forEach((p: any) => {
            if (!productIds.has(p.id)) {
                allMatchedProducts.push(p);
                productIds.add(p.id);
            }
        });
    }

    return allMatchedProducts.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.basePrice,
        category: typeof p.category === 'object' ? p.category?.title : 'Collection',
        image: p.media?.[0]?.url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
        slug: p.slug
    }));
}

async function getTrendingProducts(payload: any) {
    const products = await payload.find({
        collection: 'products',
        where: { status: { equals: 'live' } },
        limit: 4,
        depth: 1
    });

    return products.docs.map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.basePrice,
        category: typeof p.category === 'object' ? p.category?.title : 'Collection',
        image: p.media?.[0]?.url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=800',
        slug: p.slug
    }));
}
