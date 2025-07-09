import 'reflect-metadata';
import { z } from 'zod';


export function inputSchemaToZodSchema(inputSchema: Record<string, {type: string, description: string}>) {
  const zodSchema: Record<string, z.ZodTypeAny> = {};

  for (const [key, obj] of Object.entries(inputSchema)) {
    let zodType: z.ZodTypeAny;

    switch (obj.type) {
      case 'string':
        zodType = z.string().describe(obj.description);
        break;
      case 'number':
        zodType = z.number().describe(obj.description);
        break;
      case 'boolean':
        zodType = z.boolean().describe(obj.description);
        break;
      case 'array':
        zodType = z.array(z.any()).describe(obj.description);
        break;
      default:
        zodType = z.any().describe(obj.description);
    }

    zodSchema[key] = zodType;
  }
  return zodSchema;
}
