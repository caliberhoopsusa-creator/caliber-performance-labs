import { GoogleGenAI, Modality } from "@google/genai";

// Prefers Replit AI Integrations env vars when available; otherwise falls back
// to a direct GEMINI_API_KEY against the public Gemini API.
const imageGeminiBaseUrl = process.env.AI_INTEGRATIONS_GEMINI_BASE_URL;
export const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
  ...(imageGeminiBaseUrl
    ? { httpOptions: { apiVersion: "", baseUrl: imageGeminiBaseUrl } }
    : {}),
});

/**
 * Generate an image and return as base64 data URL.
 * Uses gemini-2.5-flash-image model via Replit AI Integrations.
 */
export async function generateImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find(
    (part: { inlineData?: { data?: string; mimeType?: string } }) => part.inlineData
  );

  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

