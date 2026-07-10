/**
 * Google Generative AI client initialization.
 * Exports configured model instances for vision extraction and text embedding.
 * Satisfies: Requirements 3.1 (extraction), 8.1 (interpretive), 12.1 (embeddings)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { env } from '@/lib/config'

export const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY)

/** Gemini 1.5 Pro for vision-based document extraction and interpretive validation */
export const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' })

/** Returns the Gemini 1.5 Pro vision model instance */
export function getVisionModel() {
  return visionModel
}

/** text-embedding-004 for generating embeddings used in RAG retrieval */
export const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' })
