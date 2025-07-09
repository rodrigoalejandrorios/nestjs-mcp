import { Injectable } from '@nestjs/common';
import { Prompt } from 'src/decorators/prompt-decorator';
import { completable } from '@modelcontextprotocol/sdk/server/completable.js';
import z from 'zod';

@Injectable()
export class PromptsExampleService {
  @Prompt({
    name: 'review-code',
    title: 'Code Review',
    description: 'Review code for best practices and potential issues',
    argsSchema: {
      code: z.string().describe('The code to review'),
    },
  })
  async reviewCode(params: { code: string }) {
    const { code } = params;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review this code for best practices, potential issues, and improvements:\n\n\`\`\`\n${code}\n\`\`\``,
          },
        },
      ],
    };
  }

  // Prompt con context-aware completion
  @Prompt({
    name: 'team-greeting',
    title: 'Team Greeting',
    description: 'Generate a greeting for team members',
    argsSchema: {
      department: completable(
        z.string().describe('Department name'),
        (value) => {
          // Department suggestions
          return [
            'engineering',
            'sales',
            'marketing',
            'support',
            'design',
            'product',
          ].filter((d) => d.toLowerCase().startsWith(value.toLowerCase()));
        },
      ),
      name: completable(
        z.string().describe('Team member name'),
        (value, context) => {
          // Name suggestions based on selected department
          const department = context?.arguments?.['department'];

          const namesByDepartment = {
            engineering: ['Alice', 'Bob', 'Charlie', 'Diana', 'Edward'],
            sales: ['David', 'Eve', 'Frank', 'Grace', 'Helen'],
            marketing: ['Grace', 'Henry', 'Iris', 'Jack', 'Karen'],
            support: ['Linda', 'Mike', 'Nancy', 'Oscar', 'Paula'],
            design: ['Quinn', 'Rachel', 'Sam', 'Tina', 'Victor'],
            product: ['Walter', 'Xara', 'Yuki', 'Zane', 'Anna'],
          };

          const names = namesByDepartment[
            department as keyof typeof namesByDepartment
          ] || ['Guest'];
          return names.filter((n) =>
            n.toLowerCase().startsWith(value.toLowerCase()),
          );
        },
      ),
    },
  })
  async teamGreeting(params: { department: string; name: string }) {
    const { department, name } = params;

    return {
      messages: [
        {
          role: 'assistant',
          content: {
            type: 'text',
            text: `Hello ${name}! 👋 Welcome to the ${department} team! We're excited to have you on board.`,
          },
        },
      ],
    };
  }

  // Prompt adicional para generar documentación
  @Prompt({
    name: 'generate-docs',
    title: 'Generate Documentation',
    description: 'Generate documentation for code or API endpoints',
    argsSchema: {
      type: completable(
        z.string().describe('Type of documentation'),
        (value) => {
          return ['API', 'Function', 'Class', 'Module', 'README'].filter((t) =>
            t.toLowerCase().includes(value.toLowerCase()),
          );
        },
      ),
      code: z.string().describe('Code or API to document'),
      format: completable(z.string().describe('Output format'), (value) => {
        return ['Markdown', 'JSDoc', 'OpenAPI', 'Plain Text'].filter((f) =>
          f.toLowerCase().includes(value.toLowerCase()),
        );
      }),
    },
  })
  async generateDocs(params: { type: string; code: string; format: string }) {
    const { type, code, format } = params;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate ${format} documentation for this ${type}:\n\n\`\`\`\n${code}\n\`\`\`\n\nPlease include:\n- Purpose and functionality\n- Parameters and return values\n- Usage examples\n- Any important notes or warnings`,
          },
        },
      ],
    };
  }

  // Prompt para análisis de código con contexto
  @Prompt({
    name: 'analyze-performance',
    title: 'Performance Analysis',
    description:
      'Analyze code for performance issues and optimization opportunities',
    argsSchema: {
      language: completable(
        z.string().describe('Programming language'),
        (value) => {
          return [
            'JavaScript',
            'TypeScript',
            'Python',
            'Java',
            'C#',
            'Go',
            'Rust',
          ].filter((l) => l.toLowerCase().includes(value.toLowerCase()));
        },
      ),
      code: z.string().describe('Code to analyze'),
      context: completable(
        z.string().describe('Application context'),
        (value) => {
          return [
            'Web Application',
            'API Server',
            'Database Query',
            'Frontend Component',
            'Background Job',
          ].filter((c) => c.toLowerCase().includes(value.toLowerCase()));
        },
      ),
    },
  })
  async analyzePerformance(params: {
    language: string;
    code: string;
    context: string;
  }) {
    const { language, code, context } = params;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Analyze this ${language} code for performance issues in the context of a ${context}:\n\n\`\`\`${language.toLowerCase()}\n${code}\n\`\`\`\n\nFocus on:\n- Time complexity\n- Memory usage\n- Potential bottlenecks\n- Optimization suggestions\n- Best practices for ${context}`,
          },
        },
      ],
    };
  }

  // Prompt para generación de tests
  @Prompt({
    name: 'generate-tests',
    title: 'Generate Unit Tests',
    description: 'Generate comprehensive unit tests for code',
    argsSchema: {
      framework: completable(
        z.string().describe('Testing framework'),
        (value) => {
          return [
            'Jest',
            'Mocha',
            'Jasmine',
            'Vitest',
            'PyTest',
            'JUnit',
          ].filter((f) => f.toLowerCase().includes(value.toLowerCase()));
        },
      ),
      code: z.string().describe('Code to test'),
      coverage: completable(
        z.string().describe('Test coverage level'),
        (value) => {
          return ['Basic', 'Comprehensive', 'Edge Cases', 'Integration'].filter(
            (c) => c.toLowerCase().includes(value.toLowerCase()),
          );
        },
      ),
    },
  })
  async generateTests(params: {
    framework: string;
    code: string;
    coverage: string;
  }) {
    const { framework, code, coverage } = params;

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Generate ${coverage.toLowerCase()} unit tests using ${framework} for this code:\n\n\`\`\`\n${code}\n\`\`\`\n\nInclude:\n- Happy path tests\n- Error cases\n- Edge cases\n- Mock setups if needed\n- Test descriptions and assertions`,
          },
        },
      ],
    };
  }

  // Prompt para refactoring
  @Prompt({
    name: 'refactor-code',
    title: 'Code Refactoring',
    description: 'Suggest refactoring improvements for better code quality',
    argsSchema: {
      focus: completable(z.string().describe('Refactoring focus'), (value) => {
        return [
          'Clean Code',
          'SOLID Principles',
          'Design Patterns',
          'Performance',
          'Maintainability',
        ].filter((f) => f.toLowerCase().includes(value.toLowerCase()));
      }),
      code: z.string().describe('Code to refactor'),
      constraints: z
        .string()
        .optional()
        .describe('Any constraints or requirements'),
    },
  })
  async refactorCode(params: {
    focus: string;
    code: string;
    constraints?: string;
  }) {
    const { focus, code, constraints } = params;

    const constraintsText = constraints
      ? `\n\nConstraints: ${constraints}`
      : '';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Refactor this code focusing on ${focus}:\n\n\`\`\`\n${code}\n\`\`\`${constraintsText}\n\nProvide:\n- Refactored code\n- Explanation of changes\n- Benefits of the refactoring\n- Any trade-offs or considerations`,
          },
        },
      ],
    };
  }
}
