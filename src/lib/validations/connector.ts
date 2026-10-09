import { z } from 'zod';

export const InputParameterSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Parameter name is required').regex(/^[a-zA-Z0-9_]+$/, 'Parameter name must contain only letters, numbers, and underscores'),
  type: z.enum(['Text', 'Number', 'Boolean', 'Image', 'File', 'JSON']),
  required: z.boolean().default(false),
  description: z.string().optional().nullable(),
  defaultValue: z.string().optional().nullable(),
  validation: z.string().optional().nullable(),
});

export const ConnectorFormSchema = z.object({
  name: z.string().min(2, 'Connector name must be at least 2 characters'),
  description: z.string().optional().nullable(),
  provider: z.enum(['gemini', 'openai'], {
    errorMap: () => ({ message: 'Please select a valid AI provider (gemini or openai)' }),
  }),
  model: z.string().min(1, 'Model identifier is required'),
  systemPrompt: z.string().optional().nullable(),
  outputSchema: z.string().min(2, 'Output schema JSON is required').refine(
    (val) => {
      try {
        const parsed = JSON.parse(val);
        return typeof parsed === 'object' && parsed !== null;
      } catch {
        return false;
      }
    },
    { message: 'Output schema must be a valid JSON object' }
  ),
  enabled: z.boolean().default(true),
  inputs: z.array(InputParameterSchema).default([]),
});

export type ConnectorFormValues = z.infer<typeof ConnectorFormSchema>;
