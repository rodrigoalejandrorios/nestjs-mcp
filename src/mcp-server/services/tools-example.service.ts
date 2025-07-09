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
      description: 'Suma dos números.',
      inputSchema: {
        a: {
          type: 'number',
          description: 'Primer numero',
        },
        b: {
          type: 'number',
          description: 'Segundo numero',
        },
      },
    },
  })
  add(a: number, b: number): CalculatorResult {
    /**
     * Suma dos números.
     *
     * Args:
     *     a (number): Primer número
     *     b (number): Segundo número
     *
     * Returns:
     *     CalculatorResult: Resultado de la suma
     */
    this.logger.log(`Sumando ${a} + ${b}`);
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
      description: 'Multiplica dos números.',
      inputSchema: {
        a: {
          type: 'number',
          description: 'Primer numero',
        },
        b: {
          type: 'number',
          description: 'Segundo numero',
        },
      },
    },
  })
  multiply(a: number, b: number): CalculatorResult {
    /**
     * Multiplica dos números.
     *
     * Args:
     *     a (number): Primer número
     *     b (number): Segundo número
     *
     * Returns:
     *     CalculatorResult: Resultado de la multiplicación
     */
    this.logger.log(`Multiplicando ${a} × ${b}`);
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
      description: 'Divide dos números.',
      inputSchema: {
        a: {
          type: 'number',
          description: 'Primer numero',
        },
        b: {
          type: 'number',
          description: 'Segundo numero',
        },
      },
    },
  })
  divide(a: number, b: number): CalculatorResult {
    /**
     * Divide dos números.
     *
     * Args:
     *     a (number): Dividendo
     *     b (number): Divisor
     *
     * Returns:
     *     CalculatorResult: Resultado de la división o error si división por cero
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
      description: 'Resta dos números.',
      inputSchema: {
        a: {
          type: 'number',
          description: 'Primer numero',
        },
        b: {
          type: 'number',
          description: 'Segundo numero',
        },
      },
    },
  })
  subtract(a: number, b: number): CalculatorResult {
    /**
     * Resta dos números.
     *
     * Args:
     *     a (number): Minuendo
     *     b (number): Sustraendo
     *
     * Returns:
     *     CalculatorResult: Resultado de la resta
     */
    this.logger.log(`Restando ${a} - ${b}`);
    const result = a - b;
    return {
      operation: 'subtraction',
      result: result,
      formula: `${a} - ${b} = ${result}`,
    };
  }
}