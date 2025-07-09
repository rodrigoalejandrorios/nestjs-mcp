import 'reflect-metadata';
import { Injectable, Logger } from '@nestjs/common';
import { CalculatorResult } from '../../interfaces/calculator';
import { Tool } from 'src/decorators/tool-decorator';

@Injectable()
export class ToolsExampleService {
  private readonly logger = new Logger(ToolsExampleService.name);

  @Tool({
    name: 'add',
    params: {
      title: 'Addition Tool',
      description: 'This tool adds two numbers',
      inputSchema: {
        a: {
          type: 'number',
          description: 'First number',
        },
        b: {
          type: 'number',
          description: 'Second number',
        },
      },
    },
  })
  add(a: number, b: number): CalculatorResult {
    /**
     * This tool adds two numbers.
     *
     * Args:
     *     a (number): First number
     *     b (number): Second number
     *
     * Returns:
     *     CalculatorResult: Result of the sum
     */
    this.logger.log(`Adding ${a} + ${b}`);
    const result = a + b;
    return {
      operation: 'addition',
      result: result,
      formula: `${a} + ${b} = ${result}`,
    };
  }

  @Tool({
    name: 'multiply',
    params: {
      title: 'Multiplication Tool',
      description: 'This tool multiplies two numbers.',
      inputSchema: {
        a: {
          type: 'number',
          description: 'First number',
        },
        b: {
          type: 'number',
          description: 'Second number',
        },
      },
    },
  })
  multiply(a: number, b: number): CalculatorResult {
    /**
     * This function multiplies two numbers.
     *
     * Args:
     *     a (number): First number
     *     b (number): Second number
     *
     * Returns:
     *     CalculatorResult: Result of multiplication
     */
    this.logger.log(`Multiplying ${a} × ${b}`);
    const result = a * b;
    return {
      operation: 'multiplication',
      result: result,
      formula: `${a} × ${b} = ${result}`,
    };
  }

  @Tool({
    name: 'divide',
    params: {
      title: 'Divition Tool',
      description: 'This tool divides two numbers.',
      inputSchema: {
        a: {
          type: 'number',
          description: 'First number',
        },
        b: {
          type: 'number',
          description: 'Second number',
        },
      },
    },
  })
  divide(a: number, b: number): CalculatorResult {
    /**
     * This tool divides two numbers.
     *
     * Args:
     *     a (number): Dividend
     *     b (number): Divider
     *
     * Returns:
     *     CalculatorResult: Result of division or error if division by zero
     */
    this.logger.log(`Dividiendo ${a} ÷ ${b}`);

    if (b === 0) {
      return {
        operation: 'division',
        error: 'No se puede dividir por cero',
        result: undefined,
      };
    }

    const result = a / b;
    return {
      operation: 'division',
      result: result,
      formula: `${a} ÷ ${b} = ${result}`,
    };
  }

  @Tool({
    name: 'subtract',
    params: {
      title: 'Subtraction Tool',
      description: 'This tool subtracts two numbers.',
      inputSchema: {
        a: {
          type: 'number',
          description: 'First number',
        },
        b: {
          type: 'number',
          description: 'Second number',
        },
      },
    },
  })
  subtract(a: number, b: number): CalculatorResult {
    /**
     * This tool subtracts two numbers.
     *
     * Args:
     *     a (number): minuend
     *     b (number): Subtracting
     *
     * Returns:
     *     CalculatorResult: Result of the subtraction
     */
    this.logger.log(`Subtracting ${a} - ${b}`);
    const result = a - b;
    return {
      operation: 'subtraction',
      result: result,
      formula: `${a} - ${b} = ${result}`,
    };
  }
}