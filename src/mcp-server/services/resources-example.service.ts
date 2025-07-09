import 'reflect-metadata';
import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Resource } from 'src/decorators/resource-decorator';

@Injectable()
export class ResourcesExampleService {
  private readonly logger = new Logger(ResourcesExampleService.name);

  @Resource({
    name: 'file://read',
    title: 'Package JSON',
    uri: 'file://read/package.json',
    description: 'Package.json file',
    mimeType: 'application/json',
  })
  async getPackageJson(): Promise<string> {
    const packagePath = path.join(process.cwd(), 'package.json');
    this.logger.log('Checking file in:', packagePath);

    try {
      await fs.promises.access(packagePath, fs.constants.F_OK);

      const content = await fs.promises.readFile(packagePath, 'utf-8');
      return content;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${packagePath}`);
      }
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }

  @Resource({
    name: 'file://logs',
    title: 'File Logs',
    uri: 'file://logs/app.log',
    description: 'Application log file',
    mimeType: 'text/plain',
  })
  async getLogFile(): Promise<string> {
    const logPath = path.join(process.cwd(), 'logs', 'app.log');
    try {
      const content = await fs.promises.readFile(logPath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read log file: ${error.message}`);
    }
  }

  @Resource({
    name: 'data://users',
    title: 'Data Users',
    uri: 'data://users/list',
    description: 'List of system users',
    mimeType: 'application/json',
  })
  async getUsersList(): Promise<string> {
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];
    return JSON.stringify(users, null, 2);
  }
}