export interface MCPToolOptions {
  name: string;
  params: {
    title: string;
    description: string;
    inputSchema: Record<string, { type: string; description: string }>;
  };
}
