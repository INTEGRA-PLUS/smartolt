import { logger } from '../../shared/utils/logger';
import { SmartOLTCircuitOpenError } from '../../shared/errors/SmartOLTError';
import { circuitBreakerConfig } from '../../config';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitStats {
  failures: number;
  successes: number;
  lastFailureAt?: number;
  state: CircuitState;
  openedAt?: number;
  halfOpenAttempts: number;
}

export class CircuitBreaker {
  private circuits = new Map<string, CircuitStats>();
  private readonly threshold: number;
  private readonly timeout: number;
  private readonly halfOpenRequests: number;

  constructor(config = circuitBreakerConfig) {
    this.threshold = config.threshold;
    this.timeout = config.timeout;
    this.halfOpenRequests = config.halfOpenRequests;
  }

  async execute<T>(key: string, fn: () => Promise<T>, tenantId?: string): Promise<T> {
    const circuit = this.getCircuit(key);

    if (circuit.state === 'OPEN') {
      if (this.shouldAttemptReset(circuit)) {
        circuit.state = 'HALF_OPEN';
        circuit.halfOpenAttempts = 0;
        logger.info({ key, state: 'HALF_OPEN' }, 'Circuit entering half-open state');
      } else {
        throw new SmartOLTCircuitOpenError(tenantId);
      }
    }

    if (circuit.state === 'HALF_OPEN' && circuit.halfOpenAttempts >= this.halfOpenRequests) {
      throw new SmartOLTCircuitOpenError(tenantId);
    }

    try {
      if (circuit.state === 'HALF_OPEN') {
        circuit.halfOpenAttempts++;
      }

      const result = await fn();
      this.onSuccess(key, circuit);
      return result;
    } catch (error) {
      this.onFailure(key, circuit);
      throw error;
    }
  }

  private getCircuit(key: string): CircuitStats {
    if (!this.circuits.has(key)) {
      this.circuits.set(key, {
        failures: 0,
        successes: 0,
        state: 'CLOSED',
        halfOpenAttempts: 0,
      });
    }
    return this.circuits.get(key)!;
  }

  private onSuccess(key: string, circuit: CircuitStats): void {
    circuit.successes++;
    if (circuit.state === 'HALF_OPEN') {
      circuit.state = 'CLOSED';
      circuit.failures = 0;
      circuit.halfOpenAttempts = 0;
      logger.info({ key }, 'Circuit closed after successful half-open attempt');
    }
  }

  private onFailure(key: string, circuit: CircuitStats): void {
    circuit.failures++;
    circuit.lastFailureAt = Date.now();

    if (circuit.state === 'HALF_OPEN') {
      circuit.state = 'OPEN';
      circuit.openedAt = Date.now();
      logger.warn({ key }, 'Circuit re-opened after half-open failure');
      return;
    }

    if (circuit.failures >= this.threshold) {
      circuit.state = 'OPEN';
      circuit.openedAt = Date.now();
      logger.warn({ key, failures: circuit.failures }, 'Circuit opened');
    }
  }

  private shouldAttemptReset(circuit: CircuitStats): boolean {
    return !!circuit.openedAt && Date.now() - circuit.openedAt >= this.timeout;
  }

  getState(key: string): CircuitState {
    return this.getCircuit(key).state;
  }

  getStats(key: string): CircuitStats {
    return { ...this.getCircuit(key) };
  }

  getAllStats(): Record<string, CircuitStats> {
    const result: Record<string, CircuitStats> = {};
    this.circuits.forEach((stats, key) => {
      result[key] = { ...stats };
    });
    return result;
  }

  reset(key: string): void {
    this.circuits.delete(key);
    logger.info({ key }, 'Circuit reset manually');
  }
}

export const circuitBreaker = new CircuitBreaker();
