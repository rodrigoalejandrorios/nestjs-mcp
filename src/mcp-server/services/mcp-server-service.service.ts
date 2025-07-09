import { Injectable, Logger } from '@nestjs/common';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ToolsExampleService } from './tools-example.service';
import { z } from 'zod';
import { inputSchemaToZodSchema } from '../utils/tool-register';
import {
  MCP_PROMPT_KEY,
  MCP_PROMPTS_LIST_KEY,
  MCP_RESOURCE_KEY,
  MCP_RESOURCES_LIST_KEY,
  MCP_TOOL_KEY,
  MCP_TOOLS_LIST_KEY,
} from 'src/decorators/constants';
import { Reflector } from '@nestjs/core';
import { ResourcesExampleService } from './resources-example.service';
import { PromptsExampleService } from './prompts-example.service';

@Injectable()
export class McpServerService {
  private readonly logger = new Logger(McpServerService.name);
  private server: McpServer;

  constructor(
    private toolsService: ToolsExampleService,
    private resourcesService: ResourcesExampleService,
    private promptsService: PromptsExampleService,
    private readonly reflector: Reflector,
  ) {
    this.server = new McpServer({
      name: 'calculator-server',
      version: '1.0.0',
    });

    this.setupTools();
    this.setupResources();
    this.setupPrompts();
  }

  private setupTools() {
    const toolMethods =
      this.reflector.get<string[]>(
        MCP_TOOLS_LIST_KEY,
        this.toolsService.constructor,
      ) || [];

    for (const methodName of toolMethods) {
      const toolOptions = this.reflector.get(
        MCP_TOOL_KEY,
        this.toolsService[methodName],
      );

      if (toolOptions) {
        const zodSchema = inputSchemaToZodSchema(
          toolOptions.params.inputSchema,
        );

        this.server.registerTool(
          toolOptions.name,
          {
            title: toolOptions.params.title,
            description: toolOptions.params.description,
            inputSchema: zodSchema,
          },
          async (params: any) => {
            try {
              console.log(`🔧 Executing ${methodName} with:`, params);

              const parameterNames = Object.keys(
                toolOptions.params.inputSchema,
              );
              const orderedParams = parameterNames.map((name) => params[name]);

              console.log(`Parameter order: ${parameterNames.join(', ')}`);
              console.log(`Ordered values:`, orderedParams);

              // Verificar que todos los parámetros están presentes
              for (let i = 0; i < parameterNames.length; i++) {
                if (
                  orderedParams[i] === undefined ||
                  orderedParams[i] === null
                ) {
                  throw new Error(`Missing parameter: ${parameterNames[i]}`);
                }
              }

              // Llamar al método con los parámetros en el orden correcto
              const result = this.toolsService[methodName](...orderedParams);

              console.log(`✅ Result:`, result);

              if (result === undefined || result === null) {
                throw new Error(`Method ${methodName} returned undefined/null`);
              }

              return {
                content: [
                  {
                    type: 'text',
                    text:
                      typeof result === 'string'
                        ? result
                        : JSON.stringify(result, null, 2),
                  },
                ],
              };
            } catch (error) {
              console.error(`❌ Error in ${methodName}:`, error);

              return {
                content: [
                  {
                    type: 'text',
                    text: `Error executing ${methodName}: ${error.message}`,
                  },
                ],
                isError: true,
              };
            }
          },
        );

        this.logger.log(`✅ Registered tool: ${toolOptions.name}`);
      }
    }
  }

  private setupResources() {
    const resourceMethods =
      this.reflector.get<string[]>(
        MCP_RESOURCES_LIST_KEY,
        this.resourcesService.constructor,
      ) || [];

    for (const methodName of resourceMethods) {
      const resourceOptions = this.reflector.get(
        MCP_RESOURCE_KEY,
        this.resourcesService[methodName],
      );

      if (resourceOptions) {
        this.server.registerResource(
          resourceOptions.name,
          resourceOptions.uri,
          {
            title: resourceOptions.title,
            description: resourceOptions.description,
            mimeType: resourceOptions.mimeType,
          },
          async (uri: any) => {
            try {
              console.log(
                `📄 Reading resource ${resourceOptions.name} at URI: ${uri}`,
              );

              const content = await this.resourcesService[methodName]();

              console.log(
                `✅ Resource content loaded, length: ${content.length}`,
              );

              return {
                contents: [
                  {
                    uri: uri,
                    mimeType: resourceOptions.mimeType || 'text/plain',
                    text: content,
                  },
                ],
              };
            } catch (error) {
              console.error(
                `❌ Error reading resource ${resourceOptions.name}:`,
                error,
              );

              return {
                contents: [
                  {
                    uri: uri,
                    mimeType: 'text/plain',
                    text: `Error reading resource: ${error.message}`,
                  },
                ],
                isError: true,
              };
            }
          },
        );

        this.logger.log(
          `✅ Registered resource: ${resourceOptions.name} (${resourceOptions.uri})`,
        );
      }
    }
  }

  private setupPrompts() {
    const promptMethods =
      this.reflector.get<string[]>(
        MCP_PROMPTS_LIST_KEY,
        this.promptsService.constructor,
      ) || [];

    console.log('🎯 Prompt methods found:', promptMethods);

    for (const methodName of promptMethods) {
      const promptOptions = this.reflector.get(
        MCP_PROMPT_KEY,
        this.promptsService[methodName],
      );

      if (promptOptions) {
        console.log(`🎯 Registering prompt: ${promptOptions.name}`);

        this.server.registerPrompt(
          promptOptions.name,
          {
            title: promptOptions.title,
            description: promptOptions.description,
            argsSchema: promptOptions.argsSchema,
          },
          async (params: any) => {
            try {
              console.log(`🎯 Executing prompt ${methodName} with:`, params);

              const result = await this.promptsService[methodName](params);

              console.log(`✅ Prompt result generated`);

              return result;
            } catch (error) {
              console.error(`❌ Error in prompt ${methodName}:`, error);

              return {
                messages: [
                  {
                    role: 'assistant',
                    content: {
                      type: 'text',
                      text: `Error executing prompt ${methodName}: ${error.message}`,
                    },
                  },
                ],
                isError: true,
              };
            }
          },
        );

        this.logger.log(`✅ Registered prompt: ${promptOptions.name}`);
      }
    }
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    this.logger.log('Calculator MCP Server started successfully');
  }
}
