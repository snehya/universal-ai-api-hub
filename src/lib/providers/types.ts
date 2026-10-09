export interface FileInput {
  name: string;
  mimeType: string;
  data: string;
}

export interface AdapterRequest {
  model: string;
  systemPrompt?: string | null;
  userInput: Record<string, unknown>;
  outputSchema?: string | null;
  files?: FileInput[];
}

export interface AdapterError {
  type: 
    | 'CONFIG_ERROR'
    | 'MISSING_API_KEY'
    | 'INVALID_MODEL'
    | 'PROVIDER_API_ERROR'
    | 'MALFORMED_OUTPUT'
    | 'TIMEOUT'
    | 'UNKNOWN_PROVIDER';
  message: string;
}

export interface AdapterResponse {
  success: boolean;
  data: any;
  rawText?: string;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCost?: number;
  provider: string;
  model: string;
  error: AdapterError | null;
}

export interface AIProviderAdapter {
  providerName: string;
  execute(request: AdapterRequest): Promise<AdapterResponse>;
}
