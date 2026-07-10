/**
 * Google GenAI client initialization.
 * Exports configured client for vision extraction, text generation, and embeddings.
 * Satisfies: Requirements 3.1 (extraction), 8.1 (interpretive), 12.1 (embeddings)
 */

import { GoogleGenAI } from '@google/genai'

const apiKey = process.env.GEMINI_API_KEY
if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set')
}

export const ai = new GoogleGenAI({ apiKey: apiKey })

/** Model name for vision/text generation */
export const VISION_MODEL = 'gemini-2.5-flash-preview-05-20'

/** Model name for text embeddings */
export const EMBEDDING_MODEL = 'text-embedding-004'
