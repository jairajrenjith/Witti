
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

let ai: GoogleGenAI | null = null;
let apiKeyInitializationError: Error | null = null;

try {
  // Per guidelines, API_KEY is obtained exclusively from process.env.API_KEY.
  // Assume process.env.API_KEY is pre-configured, valid, and accessible.
  // We explicitly check its existence and type here for robustness within this module.
  const apiKeyFromEnv = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : undefined;

  if (typeof apiKeyFromEnv !== 'string' || apiKeyFromEnv.trim() === '') {
    // Set the error and throw it to be caught by the catch block.
    apiKeyInitializationError = new Error("Gemini API Key (process.env.API_KEY) is missing, not a string, or empty. Please ensure it is configured in the environment.");
    throw apiKeyInitializationError;
  }
  
  ai = new GoogleGenAI({ apiKey: apiKeyFromEnv });

} catch (e: any) {
  // If the error wasn't the one we specifically threw, assign/wrap it.
  if (e !== apiKeyInitializationError) {
    apiKeyInitializationError = e instanceof Error ? e : new Error(String(e.message || "An unexpected error occurred during GoogleGenAI initialization."));
  }
  // Ensure console logging happens if an error was indeed set.
  if (apiKeyInitializationError) {
    console.error("Failed to initialize GoogleGenAI:", apiKeyInitializationError.message);
  }
}

const createShortHumorousPrompt = (question: string): string => {
  return `
You are an AI that specializes in delivering extremely short, punchy, and hilariously absurd "quick quips" in response to questions. Your answers should be 5 words or less. They should sound confident but be outrageously funny, often by being blatantly false, misleading, or a complete non-sequitur, yet delivered as if it's a profound, albeit brief, truth. The humor should be sharp and unexpected. Lean heavily towards comedic falsehoods.

User's question: "${question}"

Deliver your quick quip (5 words or less, hilariously absurd/false, confident tone) as plain text:
  `;
};

const callGeminiAPI = async (promptContent: string): Promise<string> => {
  if (apiKeyInitializationError) {
    throw apiKeyInitializationError; // This is an Error object
  }
  if (!ai) {
     // This case should ideally be covered by apiKeyInitializationError,
     // but as a fallback if ai is null for other reasons.
     throw new Error("Gemini AI client is not initialized. This may be due to a missing or invalid API key, or an initialization error.");
  }

  try {
    const model = 'gemini-2.5-flash-preview-04-17';
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: model,
      contents: promptContent,
    });
    
    const text = response.text;
    if (typeof text === 'string') {
      return text.trim();
    } else {
      console.warn("Received non-string response from AI, text was:", text);
      throw new Error("The AI's response was not in the expected text format.");
    }
  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    if (error.message) {
      if (error.message.toLowerCase().includes('api key not valid') || error.message.toLowerCase().includes('permission denied')) {
        throw new Error('Gemini API Key is invalid or lacks permissions. Please check your API_KEY and project settings.');
      }
      if (error.message.toLowerCase().includes('quota')) {
        throw new Error('API quota exceeded. Please check your Gemini project quota or try again later.');
      }
      if (error.message.toLowerCase().includes('model not found')) {
         throw new Error('The specified AI model was not found. Please check the model name.');
      }
      // Re-throw the original error message if it's not one of the specific cases handled above
      // or if it provides more context than our generic messages.
      throw new Error(error.message);
    }
    throw new Error('Failed to generate answer due to an API communication error.');
  }
};

export const generateShortWittiHumorousAnswer = async (question: string): Promise<string> => {
  const promptContent = createShortHumorousPrompt(question);
  return callGeminiAPI(promptContent);
};
