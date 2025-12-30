import { supabase } from './supabaseClient';

export const generateThankYouMessage = async (
  committeeName: string,
  tone: 'formal' | 'warm' | 'urgent' = 'warm'
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-message', {
      body: { committeeName, tone }
    });

    if (error) {
      console.error("Edge Function Error:", error);
      throw error;
    }

    return data?.message || "Thank you so much for your support! Your contribution makes a real difference.";
  } catch (error) {
    console.error("Gemini generation error:", error);
    // Return fallback on error
    return "Thank you so much for your support! Your contribution is vital to our campaign.";
  }
};