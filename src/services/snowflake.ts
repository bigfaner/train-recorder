// Snowflake ID Generator
// 64-bit ID: 41-bit timestamp + 10-bit machine-id + 12-bit sequence
// Produces globally unique bigint values for biz_key fields.

export interface SnowflakeIdGenerator {
  generate(): bigint;
  generateBatch(count: number): bigint[];
}

// Custom epoch: 2024-01-01T00:00:00.000Z
const CUSTOM_EPOCH = 1704067200000n;

// Bit lengths
const TIMESTAMP_BITS = 41n;
const MACHINE_ID_BITS = 10n;
const SEQUENCE_BITS = 12n;

// Max values
const MAX_MACHINE_ID = (1n << MACHINE_ID_BITS) - 1n; // 1023
const MAX_SEQUENCE = (1n << SEQUENCE_BITS) - 1n; // 4095

// Shifts
const MACHINE_ID_SHIFT = SEQUENCE_BITS; // 12
const TIMESTAMP_SHIFT = MACHINE_ID_BITS + SEQUENCE_BITS; // 22

/**
 * Derive a 10-bit machine ID from a device fingerprint string.
 * Uses a simple hash to produce a consistent value within 0-1023.
 */
function deriveMachineId(fingerprint: string): number {
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % Number(MAX_MACHINE_ID);
}

export class SnowflakeGenerator implements SnowflakeIdGenerator {
  private machineId: bigint;
  private sequence: bigint = 0n;
  private lastTimestamp: bigint = -1n;

  constructor(machineId?: number, fingerprint?: string) {
    if (machineId !== undefined) {
      if (machineId < 0 || machineId > Number(MAX_MACHINE_ID)) {
        throw new Error(
          `Machine ID must be between 0 and ${Number(MAX_MACHINE_ID)}`,
        );
      }
      this.machineId = BigInt(machineId);
    } else if (fingerprint) {
      this.machineId = BigInt(deriveMachineId(fingerprint));
    } else {
      // Default: use a random machine ID for single-device usage
      this.machineId = BigInt(Math.floor(Math.random() * Number(MAX_MACHINE_ID)));
    }
  }

  /**
   * Get the current timestamp in milliseconds since custom epoch.
   */
  private currentTimestamp(): bigint {
    return BigInt(Date.now()) - CUSTOM_EPOCH;
  }

  /**
   * Wait until the next millisecond if the clock hasn't advanced.
   */
  private waitNextMillis(lastTimestamp: bigint): bigint {
    let timestamp = this.currentTimestamp();
    while (timestamp <= lastTimestamp) {
      timestamp = this.currentTimestamp();
    }
    return timestamp;
  }

  /**
   * Generate a single unique bigint ID.
   */
  generate(): bigint {
    let timestamp = this.currentTimestamp();

    if (timestamp === this.lastTimestamp) {
      // Same millisecond: increment sequence
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // Sequence exhausted, wait for next millisecond
        timestamp = this.waitNextMillis(this.lastTimestamp);
      }
    } else {
      // New millisecond: reset sequence
      this.sequence = 0n;
    }

    // Guard against clock going backwards
    if (timestamp < this.lastTimestamp) {
      throw new Error(
        `Clock moved backwards. Refusing to generate ID for ${this.lastTimestamp - timestamp}ms`,
      );
    }

    this.lastTimestamp = timestamp;

    return (
      (timestamp << TIMESTAMP_SHIFT) |
      (this.machineId << MACHINE_ID_SHIFT) |
      this.sequence
    );
  }

  /**
   * Generate a batch of unique bigint IDs.
   */
  generateBatch(count: number): bigint[] {
    if (count < 0) {
      throw new Error('Count must be non-negative');
    }
    const ids: bigint[] = [];
    for (let i = 0; i < count; i++) {
      ids.push(this.generate());
    }
    return ids;
  }
}

/**
 * Create a SnowflakeGenerator instance.
 */
export function createSnowflakeGenerator(
  machineId?: number,
  fingerprint?: string,
): SnowflakeIdGenerator {
  return new SnowflakeGenerator(machineId, fingerprint);
}
