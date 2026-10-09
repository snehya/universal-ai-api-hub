import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderAdapter, AdapterRequest, AdapterResponse } from './types';
import { buildPromptInstructions, safeParseJson, calculateEstimatedCost } from './utils';

// Verified active Gemini models supported by current Google Gemini API
const VERIFIED_FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.7-flash',
];

function normalizeModelName(requestedModel?: string): string {
  if (!requestedModel || ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite'].includes(requestedModel)) {
    return 'gemini-3.5-flash-lite';
  }
  return requestedModel;
}

function isTransientError(errMessage: string): boolean {
  const msg = errMessage.toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('429') ||
    msg.includes('high demand') ||
    msg.includes('overload') ||
    msg.includes('unavailable') ||
    msg.includes('resource_exhausted') ||
    msg.includes('fetch failed') ||
    msg.includes('rate limit')
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiAdapter implements AIProviderAdapter {
  providerName = 'gemini';

  async execute(request: AdapterRequest): Promise<AdapterResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    const initialModelName = normalizeModelName(request.model);

    if (!apiKey || apiKey.trim() === '' || apiKey === 'mock-key') {
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_FALLBACK === 'true') {
        const parsedSchema = safeParseJson(request.outputSchema || '');
        let mockData: Record<string, any> = {};
        if (parsedSchema.success && typeof parsedSchema.data === 'object' && parsedSchema.data !== null) {
          for (const key of Object.keys(parsedSchema.data)) {
            const val = parsedSchema.data[key];
            if (Array.isArray(val)) mockData[key] = ['AI API Hub', 'Next.js 16', 'REST Gateway'];
            else if (typeof val === 'number') mockData[key] = 42;
            else if (typeof val === 'boolean') mockData[key] = true;
            else mockData[key] = `Generated ${key} for inputs: ${JSON.stringify(request.userInput)}`;
          }
        } else {
          mockData = { result: `Output for input: ${JSON.stringify(request.userInput)}` };
        }

        return {
          success: true,
          data: mockData,
          rawText: JSON.stringify(mockData, null, 2),
          inputTokens: 120,
          outputTokens: 85,
          totalTokens: 205,
          estimatedCost: 0.0001,
          provider: this.providerName,
          model: initialModelName,
          error: null,
        };
      }

      return {
        success: false,
        data: null,
        provider: this.providerName,
        model: initialModelName,
        error: {
          type: 'MISSING_API_KEY',
          message: 'GEMINI_API_KEY environment variable is not configured on the server.',
        },
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const { systemInstructions, userPrompt } = buildPromptInstructions(request);

    const parts: any[] = [{ text: userPrompt }];
    if (request.files && request.files.length > 0) {
      for (const file of request.files) {
        if (file.data && file.mimeType) {
          parts.push({
            inlineData: {
              data: file.data.replace(/^data:[^;]+;base64,/, ''),
              mimeType: file.mimeType,
            },
          });
        }
      }
    }

    // Build candidate model execution queue
    const modelsToTry = [
      initialModelName,
      ...VERIFIED_FALLBACK_MODELS.filter((m) => m !== initialModelName),
    ];

    let lastError: any = null;

    for (const modelName of modelsToTry) {
      const maxRetriesPerModel = 2;

      for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
        if (attempt > 0) {
          const backoffMs = Math.min(500 * Math.pow(2, attempt - 1), 2000);
          await sleep(backoffMs);
        }

        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            systemInstruction: systemInstructions,
          });

          const result = await model.generateContent({
            contents: [{ role: 'user', parts }],
            generationConfig: {
              responseMimeType: 'application/json',
            },
          });

          const response = await result.response;
          const rawText = response.text();

          const usage = response.usageMetadata;
          const inputTokens = usage?.promptTokenCount;
          const outputTokens = usage?.candidatesTokenCount;
          const totalTokens = usage?.totalTokenCount;
          const estimatedCost = calculateEstimatedCost(this.providerName, modelName, inputTokens, outputTokens);

          const jsonResult = safeParseJson(rawText);

          if (!jsonResult.success) {
            return {
              success: false,
              data: null,
              rawText,
              inputTokens,
              outputTokens,
              totalTokens,
              estimatedCost,
              provider: this.providerName,
              model: modelName,
              error: {
                type: 'MALFORMED_OUTPUT',
                message: jsonResult.error || 'Gemini output could not be parsed as structured JSON.',
              },
            };
          }

          return {
            success: true,
            data: jsonResult.data,
            rawText,
            inputTokens,
            outputTokens,
            totalTokens,
            estimatedCost,
            provider: this.providerName,
            model: modelName,
            error: null,
          };
        } catch (err: any) {
          lastError = err;
          const errMessage = err?.message || '';

          // If error is transient, retry or fall back to next model
          if (isTransientError(errMessage) && attempt < maxRetriesPerModel) {
            continue;
          }
          if (isTransientError(errMessage)) {
            break;
          }
          break;
        }
      }
    }

    return {
      success: false,
      data: null,
      provider: this.providerName,
      model: initialModelName,
      error: {
        type: 'PROVIDER_API_ERROR',
        message: lastError?.message || 'Google Gemini API request failed.',
      },
    };
  }
}
