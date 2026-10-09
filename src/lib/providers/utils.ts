import { AdapterRequest } from './types';

export function buildPromptInstructions(request: AdapterRequest): {
  systemInstructions: string;
  userPrompt: string;
} {
  const systemInstructionsParts: string[] = [];

  if (request.systemPrompt) {
    systemInstructionsParts.push(request.systemPrompt.trim());
  }

  if (request.outputSchema) {
    systemInstructionsParts.push(
      `CRITICAL REQUIREMENT: You MUST respond ONLY with a valid JSON object matching this exact schema:\n${request.outputSchema}\nDo NOT include markdown formatting or backticks around the JSON. Return valid, parseable JSON.`
    );
  } else {
    systemInstructionsParts.push(
      'CRITICAL REQUIREMENT: You MUST respond ONLY with a valid JSON object. Do not include introductory text.'
    );
  }

  const userPrompt = `USER INPUT PARAMETERS:\n${JSON.stringify(request.userInput, null, 2)}`;

  return {
    systemInstructions: systemInstructionsParts.join('\n\n'),
    userPrompt,
  };
}

export function safeParseJson(text: string): { success: boolean; data: any; rawText: string; error?: string } {
  const rawText = text;
  let cleaned = text.trim();

  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  try {
    const data = JSON.parse(cleaned);
    return { success: true, data, rawText };
  } catch (err: any) {
    return {
      success: false,
      data: null,
      rawText,
      error: `Failed to parse AI response as JSON: ${err.message}. Raw text was: "${rawText.slice(0, 200)}..."`,
    };
  }
}

export function calculateEstimatedCost(
  provider: string,
  model: string,
  inputTokens?: number,
  outputTokens?: number
): number | undefined {
  if (!inputTokens || !outputTokens) return undefined;

  const m = model.toLowerCase();

  if (provider === 'openai') {
    if (m.includes('gpt-4o-mini')) {
      return (inputTokens / 1_000_000) * 0.15 + (outputTokens / 1_000_000) * 0.60;
    }
    if (m.includes('gpt-4o')) {
      return (inputTokens / 1_000_000) * 2.50 + (outputTokens / 1_000_000) * 10.00;
    }
  }

  if (provider === 'gemini') {
    if (m.includes('flash')) {
      return (inputTokens / 1_000_000) * 0.075 + (outputTokens / 1_000_000) * 0.30;
    }
    if (m.includes('pro')) {
      return (inputTokens / 1_000_000) * 1.25 + (outputTokens / 1_000_000) * 5.00;
    }
  }

  return ((inputTokens + outputTokens) / 1_000_000) * 0.50;
}
