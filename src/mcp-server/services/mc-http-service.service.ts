import { Injectable, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { ToolsExampleService } from './tools-example.service';
import { inputSchemaToZodSchema } from '../utils/tool-register';
import { Reflector } from '@nestjs/core';
import {
  MCP_PROMPT_KEY,
  MCP_PROMPTS_LIST_KEY,
  MCP_RESOURCE_KEY,
  MCP_RESOURCES_LIST_KEY,
  MCP_TOOL_KEY,
  MCP_TOOLS_LIST_KEY,
} from 'src/decorators/constants';
import { ResourcesExampleService } from './resources-example.service';
import { PromptsExampleService } from './prompts-example.service';

@Injectable()
export class McpHttpService {
  private readonly logger = new Logger(McpHttpService.name);
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } =
    {};

  constructor(
    private toolsService: ToolsExampleService,
    private resourcesService: ResourcesExampleService,
    private promptsService: PromptsExampleService,
    private readonly reflector: Reflector,
  ) {}

  async handleRequest(
    req: Request,
    res: Response,
    body: any,
    sessionId?: string,
  ) {
    let transport: StreamableHTTPServerTransport;

    if (sessionId && this.transports[sessionId]) {
      // Reuse existing transport
      transport = this.transports[sessionId];
      this.logger.debug(`Reusing transport for session: ${sessionId}`);
    } else if (!sessionId && isInitializeRequest(body)) {
      // New initialization request
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (newSessionId) => {
          // Store the transport by session ID
          this.transports[newSessionId] = transport;
          this.logger.log(`New session initialized: ${newSessionId}`);
        },
        // DNS rebinding protection is disabled by default for backwards compatibility
        // If you are running this server locally, make sure to set:
        // enableDnsRebindingProtection: true,
        // allowedHosts: ['127.0.0.1'],
      });

      // Clean up transport when closed
      transport.onclose = () => {
        if (transport.sessionId) {
          delete this.transports[transport.sessionId];
          this.logger.log(`Session closed: ${transport.sessionId}`);
        }
      };

      const server = new McpServer({
        name: 'calculator-server',
        version: '1.0.0',
      });

      // Set up server tools
      this.setupTools(server);

      // Set up server resources
      this.setupResources(server);

      // Set up server prompts
      this.setupPrompts(server)

      // Connect to the MCP server
      await server.connect(transport);
      this.logger.log('MCP Server connected with new transport');
    } else {
      // Invalid request
      res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Bad Request: No valid session ID provided',
        },
        id: null,
      });
      return;
    }

    // Handle the request
    await transport.handleRequest(req, res, body);
  }

  async handleSessionRequest(req: Request, res: Response, sessionId?: string) {
    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send('Invalid or missing session ID');
      return;
    }

    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
  }

  private setupTools(server: McpServer) {
    const toolMethods: string[] =
      this.reflector.get<string[]>(
        MCP_TOOLS_LIST_KEY,
        this.toolsService.constructor,
      ) || [];

    this.logger.log(`Found ${toolMethods.length} tool methods`);

    for (const methodName of toolMethods) {
      const toolOptions = this.reflector.get(
        MCP_TOOL_KEY,
        this.toolsService[methodName],
      );

      if (toolOptions) {
        const zodSchema = inputSchemaToZodSchema(
          toolOptions.params.inputSchema,
        );

        server.registerTool(
          toolOptions.name,
          {
            title: toolOptions.params.title,
            description: toolOptions.params.description,
            inputSchema: zodSchema,
          },
          async (params: any) => {
            try {
              this.logger.debug(`Executing ${methodName} with:`, params);

              const parameterNames = Object.keys(
                toolOptions.params.inputSchema,
              );
              const orderedParams = parameterNames.map((name) => params[name]);

              for (let i = 0; i < parameterNames.length; i++) {
                if (
                  orderedParams[i] === undefined ||
                  orderedParams[i] === null
                ) {
                  throw new Error(`Missing parameter: ${parameterNames[i]}`);
                }
              }

              // Llamar al método con los parámetros en el orden correcto
              const result = this.toolsService[methodName](
                ...orderedParams,
              );

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
              this.logger.error(`Error in ${methodName}:`, error);

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

        this.logger.log(`Registered tool: ${toolOptions.name}`);
      }
    }
  }

  private setupResources(server: McpServer) {
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
        server.registerResource(
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

  private setupPrompts(server: McpServer) {
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

        server.registerPrompt(
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

  getActiveSessionsCount(): number {
    return Object.keys(this.transports).length;
  }

  cleanupInactiveSessions() {
    const sessionIds = Object.keys(this.transports);
    for (const sessionId of sessionIds) {
      const transport = this.transports[sessionId];
      if (transport && transport.onclose) {
        // Here you could implement logic to detect inactive sessions
        // For example, based on the last activity timestamp
      }
    }
  }
}
