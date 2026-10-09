import OpenAI from 'openai';
import { AIProviderAdapter, AdapterRequest, AdapterResponse } from './types';
import { buildPromptInstructions, safeParseJson, calculateEstimatedCost } from './utils';

export class OpenAIAdapter implements AIProviderAdapter {
  providerName = 'openai';

  async execute(request: AdapterRequest): Promise<AdapterResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    const isGroq = Boolean(apiKey && Boolean(apiKey && apiKey.startsWith('gsk_'))); const modelName = (isGroq && (!request.model || request.model === 'gpt-4o-mini')) ? 'openai/gpt-oss-120b' : (request.model || 'gpt-4o-mini');

    if (!apiKey || apiKey.trim() === '' || apiKey === 'mock-key') {
      if (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MOCK_FALLBACK === 'true') {
        const parsedSchema = safeParseJson(request.outputSchema || '');
        let mockData: Record<string, any> = {};
        if (parsedSchema.success && typeof parsedSchema.data === 'object' && parsedSchema.data !== null) {
          for (const key of Object.keys(parsedSchema.data)) {
            const val = parsedSchema.data[key];
            if (Array.isArray(val)) mockData[key] = ['AI API Hub', 'OpenAI', 'REST Endpoint'];
            else if (typeof val === 'number') mockData[key] = 100;
            else if (typeof val === 'boolean') mockData[key] = true;
            else mockData[key] = `OpenAI generated ${key} for inputs: ${JSON.stringify(request.userInput)}`;
          }
        } else {
          mockData = { result: `Output for input: ${JSON.stringify(request.userInput)}` };
        }

        return {
          success: true,
          data: mockData,
          rawText: JSON.stringify(mockData, null, 2),
          inputTokens: 150,
          outputTokens: 90,
          totalTokens: 240,
          estimatedCost: 0.0002,
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
          message: 'OPENAI_API_KEY environment variable is not configured on the server.',
        },
      };
    }

    try {
      const baseURL = process.env.OPENAI_BASE_URL || (apiKey.startsWith('gsk_') ? 'https://api.groq.com/openai/v1' : undefined); const openai = new OpenAI({ apiKey, baseURL });
      const { systemInstructions, userPrompt } = buildPromptInstructions(request);

      const userContentParts: any[] = [
        { type: 'text', text: userPrompt }
      ];

      if (request.files && request.files.length > 0) {
        for (const file of request.files) {
          if (file.data && file.mimeType.startsWith('image/')) {
            const base64Data = file.data.startsWith('data:')
              ? file.data
              : `data:${file.mimeType};base64,${file.data}`;
            userContentParts.push({
              type: 'image_url',
              image_url: { url: base64Data },
            });
          }
        }
      }

      const response = await openai.chat.completions.create({
        model: modelName,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstructions },
          { role: 'user', content: userContentParts.length === 1 ? userPrompt : userContentParts },
        ],
      });

      const rawText = response.choices[0]?.message?.content || '';

      const usage = response.usage;
      const inputTokens = usage?.prompt_tokens;
      const outputTokens = usage?.completion_tokens;
      const totalTokens = usage?.total_tokens;
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
            message: jsonResult.error || 'OpenAI output could not be parsed as structured JSON.',
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
          message: err.message || 'OpenAI API request failed.',
        },
      };
    }
  }
}
