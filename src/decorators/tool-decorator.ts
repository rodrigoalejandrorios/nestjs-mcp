import { SetMetadata } from '@nestjs/common';
import { MCP_TOOL_KEY, MCP_TOOLS_LIST_KEY } from './constants';
import { MCPToolOptions } from 'src/interfaces/tool.interface';

export function Tool(options: MCPToolOptions): MethodDecorator {
  return (target, propertyKey, descriptor) => {
   

    SetMetadata(MCP_TOOL_KEY, options)(target, propertyKey, descriptor);

    const existingTools =
      Reflect.getMetadata(MCP_TOOLS_LIST_KEY, target.constructor) || [];

    Reflect.defineMetadata(
      MCP_TOOLS_LIST_KEY,
      [...new Set([...existingTools, propertyKey])],
      target.constructor,
    );
  };
}
