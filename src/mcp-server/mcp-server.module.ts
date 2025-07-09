import { Module } from '@nestjs/common';
import { ToolsExampleService } from './services/tools-example.service';
import { McpHttpController } from './controllers/mcp.controller';
import { McpServerService } from './services/mcp-server-service.service';
import { McpHttpService } from './services/mc-http-service.service';
import { ResourcesExampleService } from './services/resources-example.service';
import { PromptsExampleService } from './services/prompts-example.service';

@Module({
  providers: [
    McpServerService,
    McpHttpService,
    ToolsExampleService,
    ResourcesExampleService,
    PromptsExampleService,
  ],
  controllers: [McpHttpController],
})
export class McpServerModule {}
