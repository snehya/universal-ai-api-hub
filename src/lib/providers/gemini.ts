import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProviderAdapter, AdapterRequest, AdapterResponse } from './types';
import { buildPromptInstructions, safeParseJson, calculateEstimatedCost } from './utils';

export class GeminiAdapter implements AIProviderAdapter {
  providerName = 'gemini';

  async execute(request: AdapterRequest): Promise<AdapterResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = (!request.model || request.model === 'gemini-1.5-flash' || request.model === 'gemini-2.0-flash') ? 'gemini-3.5-flash-lite' : request.model;

    if (!apiKey || apiKey.trim() === '' || apiKey === 'mock-key') {
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_FALLBACK === 'true') {
        const parsedSchema = safeParseJson(request.outputSchema || '');
        let mockData: Record<string, any> = {};
        if (parsedSchema.success && typeof parsedSchema.data === 'object' && parsedSchema.data !== null) {
          for (const key of Object.keys(parsedSchema.data)) {
            const val = parsedSchema.data[key];
            if (Array.isArray(val)) mockData[key] = ['AI API Hub', 'Next.js 15', 'REST Gateway'];
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
          model: modelName,
          error: null,
        };
      }

      return {
        success: false,
        data: null,
        provider: this.providerName,
        model: modelName,
        error: {
          type: 'MISSING_API_KEY',
          message: 'GEMINI_API_KEY environment variable is not configured on the server.',
        },
      };
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const { systemInstructions, userPrompt } = buildPromptInstructions(request);

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstructions,
      });

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
      return {
        success: false,
        data: null,
        provider: this.providerName,
        model: modelName,
        error: {
          type: 'PROVIDER_API_ERROR',
          message: err.message || 'Google Gemini API request failed.',
        },
      };
    }
  }
}
