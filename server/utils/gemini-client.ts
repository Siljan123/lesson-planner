// server/utils/gemini-client.ts
// Google Gemini API caller — supports Gemini 3.x Flash and Flash Lite models

import { GoogleGenAI, type GenerateContentResponse } from '@google/genai'

export type GeminiModel =
  | 'gemini-3.7-flash'
  | 'gemini-3.6-flash'
  | 'gemini-3.5-flash-lite'
  | 'gemini-3.1-flash-lite'

export interface GeminiCallOptions {
  systemInstruction?: string
  userPrompt: string
  model: GeminiModel
  maxOutputTokens?: number
  timeoutMs?: number
  /** 'json' = JSON output mode, 'text' = plain text */
  responseFormat?: 'json' | 'text'
  /** Optional JSON schema for structured output */
  jsonSchema?: {
    name: string
    schema: Record<string, any>
  }
}

export interface GeminiCallResult {
  text: string
  model: string
  modelLabel: string
  usage: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  } | null
  raw: any
}

export const GEMINI_MODEL_LABELS: Record<GeminiModel, string> = {
  'gemini-3.7-flash': 'Gemini 3.7 Flash',
  'gemini-3.6-flash': 'Gemini 3.6 Flash',
  'gemini-3.5-flash-lite': 'Gemini 3.5 Flash Lite',
  'gemini-3.1-flash-lite': 'Gemini 3.1 Flash Lite',
}

export async function callGemini(options: GeminiCallOptions): Promise<GeminiCallResult> {
  const apiKey = process.env.GOOGLE_API_KEY
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'Google API Key is not configured. Please set GOOGLE_API_KEY in the environment.',
    })
  }

  const ai = new GoogleGenAI({ apiKey })
  const label = GEMINI_MODEL_LABELS[options.model] ?? options.model

  console.log(`[gemini] Requesting ${options.model} (${label}) with format: ${options.responseFormat ?? 'text'}...`)

  const MAX_RETRIES = 2
  const RETRY_DELAYS = [3000, 8000] // ms — wait before each retry

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Build generation config
      const generationConfig: Record<string, any> = {
        maxOutputTokens: options.maxOutputTokens ?? 8192,
      }

      if (options.responseFormat === 'json') {
        generationConfig.responseMimeType = 'application/json'
        if (options.jsonSchema) {
          generationConfig.responseSchema = options.jsonSchema.schema
        }
      }

      // Build contents
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = []
      if (options.systemInstruction) {
        contents.push({
          role: 'user',
          parts: [{ text: `[System Instructions]\n${options.systemInstruction}\n\n[User Request]\n${options.userPrompt}` }]
        })
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: options.userPrompt }]
        })
      }

      const response = await ai.models.generateContent({
        model: options.model,
        contents,
        config: {
          maxOutputTokens: generationConfig.maxOutputTokens,
          responseMimeType: generationConfig.responseMimeType,
          responseSchema: generationConfig.responseSchema,
        },
      })

      const text = response.text ?? ''

      if (!text) {
        const finishReason = response.candidates?.[0]?.finishReason
        if (finishReason === 'MAX_TOKENS') {
          throw createError({
            statusCode: 502,
            message: 'The generated content was too long and exceeded the maximum AI token limit. Please try generating fewer sessions (e.g., 1-2 days) at a time.',
          })
        }
        console.error('[gemini] EMPTY RESPONSE. Response:', JSON.stringify(response, null, 2))
        throw createError({
          statusCode: 502,
          message: `Gemini (${label}) returned an empty response.`,
        })
      }

      const usageMetadata = response.usageMetadata
      const usage = usageMetadata
        ? {
            promptTokenCount: usageMetadata.promptTokenCount,
            candidatesTokenCount: usageMetadata.candidatesTokenCount,
            totalTokenCount: usageMetadata.totalTokenCount,
          }
        : null

      console.log(`[gemini] Success with model ${options.model} (${usage?.totalTokenCount ?? '?'} tokens)`)

      return {
        text,
        model: options.model,
        modelLabel: label,
        usage,
        raw: response,
      }
    } catch (err: any) {
      if (err?.statusCode) throw err // re-throw createError (our own errors)

      // Parse the actual error details from Gemini's JSON error format
      let errorCode: number | undefined
      let errorMessage = err?.message || 'Google Gemini request failed.'
      try {
        const parsed = typeof err?.message === 'string' ? JSON.parse(err.message) : null
        if (parsed?.error) {
          errorCode = parsed.error.code
          errorMessage = parsed.error.message || errorMessage
        }
      } catch {
        // err.message wasn't JSON — check for status in the error object
        errorCode = err?.status || err?.code
      }

      const isRetryable = errorCode === 503 || errorCode === 429
      if (isRetryable && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt]!
        console.warn(`[gemini] ${errorCode} on attempt ${attempt + 1}/${MAX_RETRIES + 1} — retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }

      console.error(`[gemini] Request failed (attempt ${attempt + 1}): ${errorMessage}`)
      throw createError({
        statusCode: errorCode ?? 502,
        message: isRetryable
          ? `Gemini (${label}) is currently experiencing high demand. Please try again in a few minutes, or switch to a different model.`
          : errorMessage,
      })
    }
  }

  // Should never reach here, but TypeScript needs it
  throw createError({ statusCode: 502, message: 'Gemini request failed after retries.' })
}
