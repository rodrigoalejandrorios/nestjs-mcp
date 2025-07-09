import { SetMetadata } from '@nestjs/common';
import { MCP_RESOURCE_KEY, MCP_RESOURCES_LIST_KEY } from './constants';
import { McpResourceOptions } from 'src/interfaces/resource.interface';

export function Resource(options: McpResourceOptions) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    SetMetadata(MCP_RESOURCE_KEY, options)(target, propertyKey, descriptor);

    const existingResources =
      Reflect.getMetadata(MCP_RESOURCES_LIST_KEY, target.constructor) || [];
    existingResources.push(propertyKey);
    Reflect.defineMetadata(
      MCP_RESOURCES_LIST_KEY,
      existingResources,
      target.constructor,
    );
  };
}
