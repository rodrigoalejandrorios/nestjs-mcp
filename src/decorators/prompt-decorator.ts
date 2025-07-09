import { SetMetadata } from '@nestjs/common';
import { MCP_PROMPT_KEY, MCP_PROMPTS_LIST_KEY } from './constants';
import { McpPromptOptions } from 'src/interfaces/prompt.interface';

export function Prompt(options: McpPromptOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata(MCP_PROMPT_KEY, options)(target, propertyKey, descriptor);

    const existingPrompts =
      Reflect.getMetadata(MCP_PROMPTS_LIST_KEY, target.constructor) || [];
    existingPrompts.push(propertyKey);
    Reflect.defineMetadata(
      MCP_PROMPTS_LIST_KEY,
      existingPrompts,
      target.constructor,
    );

    console.log(
      `🎯 Prompt decorator applied: ${options.name} -> ${propertyKey}`,
    );
  };
}
