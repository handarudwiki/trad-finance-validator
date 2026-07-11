/**
 * Unified LLM text generation with fallback chain.
 * Gemini → OpenRouter → Groq
 * Used by both extraction and validation (interpretive checks).
 */

import { GoogleGenAI } from '@google/genai'

const GEMINI_MODEL = 'gemini-2.0-flash'

const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-ultra:free',
  'meta-llama/llama-3.3-8b-instruct:free',
]
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Generate text using the LLM fallback chain.
 * Returns the raw text response from the first successful provider.
 */
export async function generateText(prompt: string): Promise<string> {
  const errors: string[] = []

  // 1. Try Gemini
  try {
    const text = await callGemini(prompt)
    console.log(`[LLM generateText] ✅ Gemini succeeded`)
    return text
  } catch (e) {
    const msg = (e as Error).message
    console.warn('[LLM generateText] Gemini failed:', msg)
    errors.push(`Gemini: ${msg}`)
  }

  // 2. Try OpenRouter
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    for (const model of OPENROUTER_MODELS) {
      try {
        const text = await callOpenRouter(prompt, model, openRouterKey)
        console.log(`[LLM generateText] ✅ OpenRouter (${model}) succeeded`)
        return text
      } catch (e) {
        const msg = (e as Error).message
        console.warn(`[LLM generateText] OpenRouter ${model} failed:`, msg)
        errors.push(`OpenRouter/${model}: ${msg}`)
      }
    }
  } else {
    errors.push('OpenRouter: OPENROUTER_API_KEY not configured')
  }

  // 3. Try Groq
  try {
    const text = await callGroq(prompt)
    console.log(`[LLM generateText] ✅ Groq succeeded`)
    return text
  } catch (e) {
    const msg = (e as Error).message
    console.warn('[LLM generateText] Groq failed:', msg)
    errors.push(`Groq: ${msg}`)
  }

  throw new Error('All LLM providers failed for text generation.')
}

// --- Gemini ---
async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const ai = new GoogleGenAI({ apiKey })
  const result = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  const text = result.text
  if (!text) throw new Error('Empty response')
  return text
}

// --- OpenRouter ---
async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<string> {
  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Trade Finance Validation',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`)
  }

  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response')
  return content
}

// --- Groq ---
async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('GROQ_API_KEY not configured')

  const response = await fetch(GROQ_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`)
  }

  const json = (await response.json()) as { choices?: { message?: { content?: string } }[] }
  const content = json.choices?.[0]?.message?.content
  if (!content) throw new Error('Empty response')
  return content
}
