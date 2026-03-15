import { bedrockClient, NOVA_LITE_MODEL_ID } from "../client";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export async function generateTagsFromImage(imageUrl: string): Promise<string[]> {
  console.log(`[AI Tagger] Processing image: ${imageUrl}`);

  try {
    // 1. Fetch image from URL
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    
    // Detect format from URL or response
    let format: "png" | "jpeg" | "webp" = "jpeg";
    if (imageUrl.toLowerCase().endsWith(".png")) format = "png";
    if (imageUrl.toLowerCase().endsWith(".webp")) format = "webp";

    const prompt = `
      Analyze this product image and generate 10 highly relevant, descriptive search tags.
      Focus on color, material, category, and style.
      Return ONLY a JSON array of strings.
      Example: ["red shirt", "cotton", "casual", "men's fashion"]
    `;

    const input = {
      modelId: NOVA_LITE_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        inferenceConfig: {
          max_new_tokens: 500,
          temperature: 0,
        },
        messages: [
          {
            role: "user",
            content: [
              {
                image: {
                  format: format,
                  source: {
                    bytes: base64Image,
                  },
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    };

    const command = new InvokeModelCommand(input);
    const result = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(result.body));
    
    const resultText = responseBody.output?.message?.content?.[0]?.text || "[]";
    const cleanedJson = resultText.replace(/```json|```/g, "").trim();
    
    try {
      const tags = JSON.parse(cleanedJson);
      if (Array.isArray(tags)) {
        return tags.map(t => t.toLowerCase().trim()).filter(Boolean);
      }
      return [];
    } catch (parseError) {
      console.error("[AI Tagger] Failed to parse tags:", cleanedJson);
      // Fallback: try to regex out the tags
      const matches = cleanedJson.match(/"([^"]+)"/g);
      if (matches) {
        return matches.map((m: any) => m.replace(/"/g, "").toLowerCase().trim());
      }
      return [];
    }
  } catch (error) {
    console.error("[AI Tagger] Error:", error);
    return [];
  }
}
