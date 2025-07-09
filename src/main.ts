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

    // Configurar el logger basado en el modo
    const loggerOptions: any = isStdioMode
      ? false
      : ['log', 'error', 'warn', 'debug'];

    logger.log('🚀 Iniciando aplicación NestJS...');

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
        logger.log('Servidor MCP STDIO iniciado correctamente');
      }
    } else {
      // Modo HTTP o mixto
      const httpPort = configService.get('PORT', 3000);

      app.enableCors({
        origin: true,
        credentials: true,
      });

      await app.listen(httpPort);
      logger.log(`Servidor HTTP ejecutándose en puerto ${httpPort}`);
      logger.log(`API disponible en: http://localhost:${httpPort}`);
      logger.log(`MCP HTTP endpoint: http://localhost:${httpPort}/mcp`);

      if (mcpMode === 'http') {
        const mcpHttpService = app.get(McpHttpService);
        logger.log('Servidor MCP HTTP disponible en /mcp endpoint');
        logger.log(
          `Sesiones activas: ${mcpHttpService.getActiveSessionsCount()}`,
        );
      } else if (mcpMode === 'both') {
        // Iniciar ambos servidores
        const mcpStdioServer = app.get(McpServerService);
        await mcpStdioServer.start();
        logger.log('Servidor MCP STDIO iniciado correctamente');

        const mcpHttpService = app.get(McpHttpService);
        logger.log('Servidor MCP HTTP disponible en /mcp endpoint');
        logger.log(
          `Sesiones activas: ${mcpHttpService.getActiveSessionsCount()}`,
        );
      }

      // Configurar limpieza de sesiones solo para HTTP
      if (mcpMode === 'http' || mcpMode === 'both') {
        const mcpHttpService = app.get(McpHttpService);

        setInterval(
          () => {
            mcpHttpService.cleanupInactiveSessions();
            logger.debug(
              `Sesiones MCP HTTP activas: ${mcpHttpService.getActiveSessionsCount()}`,
            );
          },
          5 * 60 * 1000,
        );
      }
    }

    const gracefulShutdown = async (signal: string) => {
      if (!isStdioMode) {
        logger.log(`Recibida señal ${signal}, cerrando aplicación...`);
      }

      try {
        await app.close();
        if (!isStdioMode) {
          logger.log('Aplicación cerrada correctamente');
        }
        process.exit(0);
      } catch (error) {
        if (!isStdioMode) {
          logger.error('Error durante el cierre:', error);
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
      logger.log('✅ Aplicación iniciada completamente');
      logger.log('>> Configuración actual:');
      logger.log(`   - Modo MCP: ${mcpMode}`);

      if (mcpMode !== 'stdio') {
        const httpPort = configService.get('PORT', 3000);
        logger.log(`   - Puerto HTTP: ${httpPort}`);
        logger.log(`   - Endpoints disponibles:`);
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
      logger.error('❌ Error iniciando aplicación:', error);
    }

    if (app) {
      await app.close();
    }
    process.exit(1);
  }
}

bootstrap();
