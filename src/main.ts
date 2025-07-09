import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { McpHttpService } from './mcp-server/services/mc-http-service.service';
import { McpServerService } from './mcp-server/services/mcp-server-service.service';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  let app;
  const transport = process.env.MCP_TRANSPORT || 'http';
  try {
    const isStdioMode =
      transport === 'stdio' || process.argv.includes('--stdio');

    const loggerOptions: any = isStdioMode
      ? false
      : ['log', 'error', 'warn', 'debug'];

    logger.log('🚀 Starting NestJS application...');

    app = await NestFactory.create(AppModule, {
      logger: loggerOptions ?? false,
    });

    const configService = app.get(ConfigService);
    const mcpMode = configService.get(
      'MCP_TRANSPORT',
      isStdioMode ? 'stdio' : 'http',
    );

    if (mcpMode === 'stdio' || isStdioMode) {
      const mcpStdioServer = app.get(McpServerService);
      await mcpStdioServer.start();

      if (!isStdioMode) {
        logger.log('MCP STDIO server started successfully');
      }
    } else {
      const httpPort = configService.get('PORT', 3000);

      app.enableCors({
        origin: true,
        credentials: true,
      });

      await app.listen(httpPort);
      logger.log(`HTTP server running on port ${httpPort}`);
      logger.log(`API available at: http://localhost:${httpPort}`);
      logger.log(`MCP HTTP endpoint: http://localhost:${httpPort}/mcp`);

      if (mcpMode === 'http') {
        const mcpHttpService = app.get(McpHttpService);
        logger.log('MCP HTTP Server available at /mcp endpoint');
        logger.log(
          `Active sessions: ${mcpHttpService.getActiveSessionsCount()}`,
        );
      } else if (mcpMode === 'both') {
        const mcpStdioServer = app.get(McpServerService);
        await mcpStdioServer.start();
        logger.log('MCP STDIO server started successfully');

        const mcpHttpService = app.get(McpHttpService);
        logger.log('MCP HTTP Server available at /mcp endpoint');
        logger.log(
          `Active sessions: ${mcpHttpService.getActiveSessionsCount()}`,
        );
      }

      if (mcpMode === 'http' || mcpMode === 'both') {
        const mcpHttpService = app.get(McpHttpService);

        setInterval(
          () => {
            mcpHttpService.cleanupInactiveSessions();
            logger.debug(
              `Active HTTP MCP sessions: ${mcpHttpService.getActiveSessionsCount()}`,
            );
          },
          5 * 60 * 1000,
        );
      }
    }

    const gracefulShutdown = async (signal: string) => {
      if (!isStdioMode) {
        logger.log(`Received signal ${signal}, closing application...`);
      }

      try {
        await app.close();
        if (!isStdioMode) {
          logger.log('Successfully closed application');
        }
        process.exit(0);
      } catch (error) {
        if (!isStdioMode) {
          logger.error('Error during shutdown:', error);
        }
        process.exit(1);
      }
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    process.on('unhandledRejection', (reason, promise) => {
      if (!isStdioMode) {
        logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      }
    });

    process.on('uncaughtException', (error) => {
      if (!isStdioMode) {
        logger.error('❌ Uncaught Exception:', error);
      }
      process.exit(1);
    });

    if (!isStdioMode) {
      logger.log('✅ Application started completely');
      logger.log('>> Current configuration:');
      logger.log(`   - MCP Mode: ${mcpMode}`);

      if (mcpMode !== 'stdio') {
        const httpPort = configService.get('PORT', 3000);
        logger.log(`   - HTTP Port: ${httpPort}`);
        logger.log(`   - Available endpoints:`);
        logger.log(`     * GET /health - Health check`);
        logger.log(`     * POST /mcp - MCP HTTP requests`);
        logger.log(`     * GET /mcp - MCP HTTP SSE notifications`);
        logger.log(`     * DELETE /mcp - MCP HTTP session termination`);
      }
    }
  } catch (error) {
    const isStdioMode =
      transport === 'stdio' ||
      process.argv.includes('--stdio') ||
      !process.stdout.isTTY;

    if (!isStdioMode) {
      logger.error('❌ Error starting application:', error);
    }

    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

bootstrap();
