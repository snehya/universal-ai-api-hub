import { AIProviderAdapter } from './types';
import { GeminiAdapter } from './gemini';
import { OpenAIAdapter } from './openai';

export * from './types';
export * from './utils';
export { GeminiAdapter } from './gemini';
export { OpenAIAdapter } from './openai';

const adapters: Record<string, AIProviderAdapter> = {
  gemini: new GeminiAdapter(),
  google: new GeminiAdapter(),
  openai: new OpenAIAdapter(),
};

export function getProviderAdapter(provider: string): AIProviderAdapter {
  const normalizedKey = provider.toLowerCase().trim();
  const adapter = adapters[normalizedKey];

  if (!adapter) {
    return {
      providerName: normalizedKey,
      async execute(request) {
        return {
          success: false,
          data: null,
          provider: normalizedKey,
          model: request.model,
          error: {
            type: 'UNKNOWN_PROVIDER',
            message: `Unsupported AI provider "${provider}". Supported providers are: ${Object.keys(adapters).join(', ')}.`,
          },
        };
      },
    };
  }

  return adapter;
}
