import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase";

// Traduce gli errori delle Cloud Functions negli stessi messaggi del vecchio backend
export const getAiErrorMessage = (error) => {
  const reason = error?.details?.reason;

  switch (reason) {
    case "RATE_LIMIT":
      return "You've reached the limit of 5 AI requests per minute on this app. Please wait a moment and try again.";
    case "NO_KEY":
      return "Gemini API Key not configured. Add it in Settings > AI Integrations.";
    case "GEMINI_QUOTA":
      return "The Gemini API quota has been exceeded (external service limit). Please try again later.";
    case "GEMINI_KEY_INVALID":
      return "Your Gemini API Key is not valid. Check it in Settings > AI Integrations.";
    case "GEMINI_ERROR":
      return "The AI service is temporarily unavailable. Please try again later.";
    default:
      break;
  }

  switch (error?.code) {
    case "functions/not-found":
      return "Snippet not found.";
    case "functions/invalid-argument":
      return error.message;
    case "functions/unauthenticated":
      return "You must be logged in.";
    default:
      return "Connection error. Please try again.";
  }
};

export const askAboutSnippet = async (snippetId, question, model) => {
  const result = await httpsCallable(
    functions,
    "askAboutSnippet",
  )({ snippetId, question, model });
  return result.data.answer;
};

export const generateSnippetFromPrompt = async (
  description,
  language,
  model,
) => {
  const result = await httpsCallable(
    functions,
    "generateSnippetFromPrompt",
  )({ description, language, model });
  return result.data.generatedCode;
};

// Elenco dei modelli Gemini disponibili per la chiave dell'utente, già ordinato
export const getGeminiModels = async () => {
  const result = await httpsCallable(functions, "getGeminiModels")();
  return result.data; // { models: [{ value, label }], defaultModel }
};
