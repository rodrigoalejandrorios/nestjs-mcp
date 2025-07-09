import {
  Controller,
  Post,
  Get,
  Delete,
  Req,
  Res,
  Headers,
  Body,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { McpHttpService } from '../services/mc-http-service.service';

@Controller('mcp')
export class McpHttpController {
  private readonly logger = new Logger(McpHttpController.name);

  constructor(private readonly mcpHttpService: McpHttpService) {}

  @Post()
  async handlePost(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('mcp-session-id') sessionId: string | undefined,
    @Body() body: any,
  ) {
    try {
      await this.mcpHttpService.handleRequest(req, res, body, sessionId);
    } catch (error) {
      this.logger.error('Error handling POST request:', error);
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Internal Server Error',
        },
        id: null,
      });
    }
  }

  @Get()
  async handleGet(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('mcp-session-id') sessionId: string | undefined,
  ) {
    try {
      await this.mcpHttpService.handleSessionRequest(req, res, sessionId);
    } catch (error) {
      this.logger.error('Error handling GET request:', error);
      res.status(HttpStatus.BAD_REQUEST).send('Error handling request');
    }
  }

  @Delete()
  async handleDelete(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('mcp-session-id') sessionId: string | undefined,
  ) {
    try {
      await this.mcpHttpService.handleSessionRequest(req, res, sessionId);
    } catch (error) {
      this.logger.error('Error handling DELETE request:', error);
      res.status(HttpStatus.BAD_REQUEST).send('Error handling request');
    }
  }
}
