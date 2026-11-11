import { useEffect, useState } from "react";
import { getGeminiModels } from "../services/aiService";
import { GEMINI_MODELS, DEFAULT_GEMINI_MODEL } from "../constants/geminiModels";

const CACHE_KEY = "gemini-models-v1";
const CACHE_TTL_MS = 60 * 60 * 1000;
const RETRY_AFTER_FAILURE_MS = 60 * 1000;

const FALLBACK = {
  models: GEMINI_MODELS,
  defaultModel: DEFAULT_GEMINI_MODEL,
  isFallback: true,
};

let lastFailureAt = 0;
let pendingRequest = null;

const readCache = () => {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, value } = JSON.parse(raw);
    return Date.now() - at < CACHE_TTL_MS ? value : null;
  } catch {
    return null;
  }
};

const writeCache = (value) => {
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), value }),
    );
  } catch {
    // storage non disponibile: pazienza, niente cache
  }
};

const loadModels = () => {
  if (!pendingRequest) {
    pendingRequest = getGeminiModels()
      .then((data) => {
        const value = { ...data, isFallback: false };
        writeCache(value);
        return value;
      })
      .finally(() => {
        pendingRequest = null;
      });
  }
  return pendingRequest;
};

export const useGeminiModels = () => {
  const [state, setState] = useState(() => readCache() ?? FALLBACK);

  useEffect(() => {
    if (readCache()) return;
    if (Date.now() - lastFailureAt < RETRY_AFTER_FAILURE_MS) return;

    let cancelled = false;
    loadModels()
      .then((value) => {
        if (!cancelled) setState(value);
      })
      .catch(() => {
        // senza chiave valida resta l'elenco di ripiego
        lastFailureAt = Date.now();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state; // { models, defaultModel, isFallback }
};
