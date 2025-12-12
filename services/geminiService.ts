import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  let apiKey = '';
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        // @ts-ignore
        apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("process.env is not accessible via global scope.");
  }
  
  if (!apiKey) {
      console.warn("Gemini API Key is missing.");
      return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateThankYouMessage = async (
  committeeName: string, 
  tone: 'formal' | 'warm' | 'urgent' = 'warm'
): Promise<string> => {
  const ai = getAiClient();
  
  if (!ai) {
    console.error("Gemini API Key is missing.");
    // Return a fallback instead of crashing
    return "Thank you so much for your support! Your contribution makes a real difference.";
  }

  const prompt = `
    Write a short, sincere thank you message (max 50 words) for a postcard to a political donor.
    The committee name is "${committeeName}".
    The tone should be ${tone}.
    Do not include placeholders like "[Donor Name]", just the message body.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Thank you so much for your support!";
  } catch (error) {
    console.error("Gemini generation error:", error);
    // Return fallback on error
    return "Thank you so much for your support! Your contribution is vital to our campaign.";
  }
};