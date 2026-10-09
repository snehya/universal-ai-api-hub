import { InputParameter } from '@prisma/client';

export interface ValidationResult {
  valid: boolean;
  validatedInput: Record<string, any>;
  files: Array<{ name: string; mimeType: string; data: string }>;
  error?: string;
}

export function validateConnectorInput(
  rawPayload: Record<string, any>,
  configuredInputs: InputParameter[]
): ValidationResult {
  const validatedInput: Record<string, any> = {};
  const files: Array<{ name: string; mimeType: string; data: string }> = [];

  for (const param of configuredInputs) {
    const rawVal = rawPayload[param.name];

    if (param.required && (rawVal === undefined || rawVal === null || rawVal === '')) {
      return {
        valid: false,
        validatedInput: {},
        files: [],
        error: `Missing required field: ${param.name}`,
      };
    }

    if ((rawVal === undefined || rawVal === null || rawVal === '') && param.defaultValue) {
      validatedInput[param.name] = parseDefaultValue(param.defaultValue, param.type);
      continue;
    }

    if (rawVal === undefined || rawVal === null || rawVal === '') {
      continue;
    }

    switch (param.type) {
      case 'Text': {
        if (typeof rawVal !== 'string') {
          return {
            valid: false,
            validatedInput: {},
            files: [],
            error: `Invalid type for field '${param.name}': expected string/text, got ${typeof rawVal}`,
          };
        }
        validatedInput[param.name] = rawVal;
        break;
      }

      case 'Number': {
        const num = Number(rawVal);
        if (isNaN(num)) {
          return {
            valid: false,
            validatedInput: {},
            files: [],
            error: `Invalid type for field '${param.name}': expected number, got ${typeof rawVal}`,
          };
        }
        validatedInput[param.name] = num;
        break;
      }

      case 'Boolean': {
        if (typeof rawVal === 'boolean') {
          validatedInput[param.name] = rawVal;
        } else if (rawVal === 'true' || rawVal === 'false') {
          validatedInput[param.name] = rawVal === 'true';
        } else {
          return {
            valid: false,
            validatedInput: {},
            files: [],
            error: `Invalid type for field '${param.name}': expected boolean`,
          };
        }
        break;
      }

      case 'JSON': {
        if (typeof rawVal === 'object' && rawVal !== null) {
          validatedInput[param.name] = rawVal;
        } else if (typeof rawVal === 'string') {
          try {
            validatedInput[param.name] = JSON.parse(rawVal);
          } catch {
            return {
              valid: false,
              validatedInput: {},
              files: [],
              error: `Invalid JSON string for field '${param.name}'`,
            };
          }
        } else {
          return {
            valid: false,
            validatedInput: {},
            files: [],
            error: `Invalid type for field '${param.name}': expected JSON object`,
          };
        }
        break;
      }

      case 'Image':
      case 'File': {
        if (typeof rawVal === 'object' && rawVal.data) {
          files.push({
            name: param.name,
            mimeType: rawVal.mimeType || (param.type === 'Image' ? 'image/jpeg' : 'application/octet-stream'),
            data: rawVal.data,
          });
          validatedInput[param.name] = `[Attached ${param.type}: ${param.name}]`;
        } else if (typeof rawVal === 'string' && rawVal.startsWith('data:')) {
          const mimeType = rawVal.split(';')[0].replace('data:', '') || 'image/jpeg';
          files.push({
            name: param.name,
            mimeType,
            data: rawVal,
          });
          validatedInput[param.name] = `[Attached ${param.type}: ${param.name}]`;
        } else {
          validatedInput[param.name] = String(rawVal);
        }
        break;
      }

      default:
        validatedInput[param.name] = rawVal;
    }
  }

  return {
    valid: true,
    validatedInput,
    files,
  };
}

function parseDefaultValue(val: string, type: string): any {
  if (type === 'Number') return Number(val) || 0;
  if (type === 'Boolean') return val === 'true';
  if (type === 'JSON') {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
}
