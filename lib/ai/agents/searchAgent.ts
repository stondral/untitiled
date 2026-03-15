import { bedrockClient, NOVA_LITE_MODEL_ID } from "../client";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export interface SearchIntent {
  q: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  translatedText?: string;
  detectedLanguage?: string;
}

export async function processUserTranscript(transcript: string): Promise<SearchIntent> {
  const prompt = `
You are a master search agent for an e-commerce store called Stond Emporium.
Analyze the following user transcript and extract search parameters.

User Transcript: "${transcript}"

Return ONLY a JSON object with the following fields:
- q (string): The search query (e.g., "shirt", "watch").
- category (string, optional): The product category if mentioned.
- minPrice (number, optional): Minimum price if mentioned.
- maxPrice (number, optional): Maximum price if mentioned.
- translatedText (string, optional): If the transcript is not in English, translate it to English.
- detectedLanguage (string, optional): The ISO language code of the detected language.

Example: "show me shirts under 3000" -> { "q": "shirt", "maxPrice": 3000 }
Example: "mujhe 5000 se kam ke shoes dikhao" -> { "q": "shoes", "maxPrice": 5000, "translatedText": "show me shoes under 5000", "detectedLanguage": "hi" }

JSON Result:`;

  const input = {
    modelId: NOVA_LITE_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify({
      inferenceConfig: {
        max_new_tokens: 1000,
        temperature: 0,
      },
      messages: [
        {
          role: "user",
          content: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }),
  };

  try {
    const command = new InvokeModelCommand(input);
    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // Extracting text from Nova's response format
    const resultText = responseBody.output?.message?.content?.[0]?.text || "{}";
    const cleanedJson = resultText.replace(/```json|```/g, "").trim();
    
    try {
      return JSON.parse(cleanedJson);
    } catch (parseError) {
      console.error("Failed to parse AI response:", cleanedJson);
      // Try to find JSON block manually if parsing failed
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error("AI Search Agent Error:", error);
    return { q: transcript }; // Fallback to raw transcript as query
  }
}
