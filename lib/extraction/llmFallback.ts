/**
 * LLM Fallback Chain for structured extraction.
 * Order: Gemini → OpenRouter (multiple free models) → Groq
 *
 * Each provider receives OCR text + extraction prompt and returns structured JSON.
 * Falls back to next provider on: empty key, auth failure, rate limit, or any error.
 * Logs request/response and token usage for each call.
 */

import { GoogleGenAI } from '@google/genai'

// --- Provider Configuration ---
const GEMINI_MODEL = 'gemini-2.0-flash'

// Multiple OpenRouter free models to try (in order)
const OPENROUTER_MODELS = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'nvidia/nemotron-3-ultra:free',
  'meta-llama/llama-3.3-8b-instruct:free',
]
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1/chat/completions'

const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions'

export interface LLMExtractionResult {
  data: object
  provider: string
}

// --- Logger ---
function logRequest(provider: string, model: string, promptLength: number) {
  console.log(`[LLM] ➡️  REQUEST | provider=${provider} | model=${model} | prompt_length=${promptLength} chars`)
}

function logResponse(provider: string, model: string, success: boolean, responseBody: string | undefined, tokens?: { input?: number; output?: number; total?: number }, durationMs?: number) {
  const tokenInfo = tokens
    ? `input_tokens=${tokens.input ?? '?'} | output_tokens=${tokens.output ?? '?'} | total_tokens=${tokens.total ?? '?'}`
    : 'tokens=N/A'
  const status = success ? '✅ SUCCESS' : '❌ FAILED'
  console.log(`[LLM] ⬅️  RESPONSE | provider=${provider} | model=${model} | ${status} | ${tokenInfo} | duration=${durationMs ?? '?'}ms`)
  if (responseBody) {
    console.log(`[LLM] 📝 RAW OUTPUT | provider=${provider} | model=${model}:`)
    console.log(responseBody)
  }
}

/**
 * Attempts structured extraction through the fallback chain.
 * Throws if ALL providers fail.
 */
export async function extractWithLLMFallback(
  prompt: string,
  ocrText: string
): Promise<LLMExtractionResult> {
  const fullPrompt = prompt + '\n\nOCR TEXT:\n' + ocrText
  const errors: string[] = []

  // 1. Try Gemini
  try {
    const data = await callGemini(fullPrompt)
    return { data, provider: 'Gemini' }
  } catch (e) {
    const msg = (e as Error).message
    console.warn('[LLM Fallback] Gemini failed:', msg)
    errors.push(`Gemini: ${msg}`)
  }

  // 2. Try OpenRouter (multiple models)
  const openRouterKey = process.env.OPENROUTER_API_KEY
  if (openRouterKey) {
    for (const model of OPENROUTER_MODELS) {
      try {
        const data = await callOpenRouter(fullPrompt, model, openRouterKey)
        return { data, provider: `OpenRouter (${model})` }
      } catch (e) {
        const msg = (e as Error).message
        console.warn(`[LLM Fallback] OpenRouter ${model} failed:`, msg)
        errors.push(`OpenRouter/${model}: ${msg}`)
      }
    }
  } else {
    errors.push('OpenRouter: OPENROUTER_API_KEY is not configured')
  }

  // 3. Try Groq
  try {
    const data = await callGroq(fullPrompt)
    return { data, provider: 'Groq' }
  } catch (e) {
    const msg = (e as Error).message
    console.warn('[LLM Fallback] Groq failed:', msg)
    errors.push(`Groq: ${msg}`)
  }

  throw new Error('All LLM providers failed. Please try again later.')
}

// --- Gemini ---
async function callGemini(prompt: string): Promise<object> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  logRequest('Gemini', GEMINI_MODEL, prompt.length)
  const start = Date.now()

  const ai = new GoogleGenAI({ apiKey })
  const result = await ai.models.generateContent({
    model: GEMINI_MODEL,
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
  })

  const durationMs = Date.now() - start
  const text = result.text
  const usage = result.usageMetadata
  const tokens = usage ? {
    input: usage.promptTokenCount,
    output: usage.candidatesTokenCount,
    total: usage.totalTokenCount,
  } : undefined

  logResponse('Gemini', GEMINI_MODEL, !!text, text ?? undefined, tokens, durationMs)

  if (!text) {
    throw new Error('Empty response')
  }

  return parseJsonFromLLM(text)
}

// --- OpenRouter ---
async function callOpenRouter(prompt: string, model: string, apiKey: string): Promise<object> {
  logRequest('OpenRouter', model, prompt.length)
  const start = Date.now()

  const response = await fetch(OPENROUTER_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Trade Finance Document Extraction',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
  })

  const durationMs = Date.now() - start

  if (!response.ok) {
    const body = await response.text()
    logResponse('OpenRouter', model, false, body, undefined, durationMs)
    throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`)
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }

  const tokens = json.usage ? {
    input: json.usage.prompt_tokens,
    output: json.usage.completion_tokens,
    total: json.usage.total_tokens,
  } : undefined

  const content = json.choices?.[0]?.message?.content
  logResponse('OpenRouter', model, !!content, content ?? undefined, tokens, durationMs)

  if (!content) {
    throw new Error('Empty response')
  }

  return parseJsonFromLLM(content)
}

// --- Groq ---
async function callGroq(prompt: string): Promise<object> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  logRequest('Groq', GROQ_MODEL, prompt.length)
  const start = Date.now()

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

  const durationMs = Date.now() - start

  if (!response.ok) {
    const body = await response.text()
    logResponse('Groq', GROQ_MODEL, false, body, undefined, durationMs)
    throw new Error(`HTTP ${response.status}: ${body.substring(0, 200)}`)
  }

  const json = (await response.json()) as {
    choices?: { message?: { content?: string } }[]
    usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number }
  }

  const tokens = json.usage ? {
    input: json.usage.prompt_tokens,
    output: json.usage.completion_tokens,
    total: json.usage.total_tokens,
  } : undefined

  const content = json.choices?.[0]?.message?.content
  logResponse('Groq', GROQ_MODEL, !!content, content ?? undefined, tokens, durationMs)

  if (!content) {
    throw new Error('Empty response')
  }

  return parseJsonFromLLM(content)
}

// --- JSON Parser ---
function parseJsonFromLLM(responseText: string): object {
  let cleaned = responseText.trim()

  // Strip markdown code blocks
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  try {
    return JSON.parse(cleaned)
  } catch (e) {
    throw new Error(
      `Failed to parse JSON: ${(e as Error).message}`
    )
  }
}
