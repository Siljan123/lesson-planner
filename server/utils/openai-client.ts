// server/utils/openai-client.ts
// OpenAI GPT caller — supports gpt-6-luna and gpt-5.6-luna

import OpenAI from 'openai'

export type OpenAIModel = 'gpt-6-luna' | 'gpt-5.6-luna'

export interface OpenAICallOptions {
  systemInstruction?: string
  userPrompt: string
  model: OpenAIModel
  maxOutputTokens?: number
  timeoutMs?: number
  /** 'json_object' = unstructured JSON, 'json_schema' = strict schema enforcement, 'text' = plain text */
  responseFormat?: 'json_object' | 'json_schema' | 'text'
  /** Required when responseFormat is 'json_schema'. Passed directly as the JSON Schema object. */
  jsonSchema?: {
    name: string
    schema: Record<string, any>
    strict?: boolean
  }
}

export interface OpenAICallResult {
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

export const OPENAI_MODEL_LABELS: Record<OpenAIModel, string> = {
  'gpt-6-luna': 'GPT-6 Luna',
  'gpt-5.6-luna': 'GPT-5.6 Luna',
}

export async function callOpenAI(options: OpenAICallOptions): Promise<OpenAICallResult> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'OpenAI API Key is not configured. Please set OPENAI_API_KEY in the environment.',
    })
  }

  const client = new OpenAI({
    apiKey,
    timeout: options.timeoutMs ?? 60000,
  })

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = []

  if (options.systemInstruction) {
    messages.push({ role: 'system', content: options.systemInstruction })
  }
  messages.push({ role: 'user', content: options.userPrompt })

  const label = OPENAI_MODEL_LABELS[options.model] ?? options.model

  // Build response_format
  let responseFormat: OpenAI.Chat.Completions.ChatCompletionCreateParams['response_format']
  if (options.responseFormat === 'json_schema' && options.jsonSchema) {
    responseFormat = {
      type: 'json_schema',
      json_schema: {
        name: options.jsonSchema.name,
        schema: options.jsonSchema.schema,
        strict: options.jsonSchema.strict ?? false,
      },
    } as any
  } else if (options.responseFormat === 'json_object') {
    responseFormat = { type: 'json_object' }
  } else {
    responseFormat = { type: 'text' }
  }

  console.log(`[openai] Requesting ${options.model} (${label}) with format: ${options.responseFormat ?? 'text'}...`)

  try {
    const response = await client.chat.completions.create({
      model: options.model,
      messages,
      // temperature is intentionally omitted — gpt-6-luna and gpt-5.6-luna
      // only support the default value (1) and reject any other value with a 400.
      max_completion_tokens: options.maxOutputTokens ?? 8192,
      response_format: responseFormat,
    })

    const choice = response.choices?.[0]
    const text = choice?.message?.content ?? ''

    if (!text) {
      if (choice?.finish_reason === 'length') {
        throw createError({
          statusCode: 502,
          message: 'The generated lesson plan was too long and exceeded the maximum AI token limit. Please try generating fewer sessions (e.g., 1-2 days) at a time.',
        })
      }
      console.error("[openai] EMPTY RESPONSE. Choice:", JSON.stringify(choice, null, 2));
      throw createError({
        statusCode: 502,
        message: `OpenAI (${label}) returned an empty response.`,
      })
    }

    const usage = response.usage
      ? {
          promptTokenCount: response.usage.prompt_tokens,
          candidatesTokenCount: response.usage.completion_tokens,
          totalTokenCount: response.usage.total_tokens,
        }
      : null

    console.log(`[openai] Success with model ${options.model} (${usage?.totalTokenCount ?? '?'} tokens)`)

    return {
      text,
      model: options.model,
      modelLabel: label,
      usage,
      raw: response,
    }
  } catch (err: any) {
    if (err?.statusCode) throw err // re-throw createError
    console.error(`[openai] Request failed: ${err?.message || err}`)
    throw createError({
      statusCode: err?.status ?? 502,
      message: err?.message || 'OpenAI request failed. Please try again.',
    })
  }
}
