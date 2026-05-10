import {
  SnowflakeGenerator,
  createSnowflakeGenerator,
} from "../../src/services/snowflake";

describe("SnowflakeGenerator", () => {
  it("should generate a bigint value", () => {
    const gen = new SnowflakeGenerator(1);
    const id = gen.generate();
    expect(typeof id).toBe("bigint");
  });

  it("should generate unique IDs in rapid succession", () => {
    const gen = new SnowflakeGenerator(1);
    const ids = new Set<bigint>();
    const count = 1000;
    for (let i = 0; i < count; i++) {
      ids.add(gen.generate());
    }
    expect(ids.size).toBe(count);
  });

  it("should generate unique IDs with generateBatch", () => {
    const gen = new SnowflakeGenerator(1);
    const ids = gen.generateBatch(500);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(500);
  });

  it("should produce positive bigint values", () => {
    const gen = new SnowflakeGenerator(1);
    for (let i = 0; i < 100; i++) {
      const id = gen.generate();
      expect(id > 0n).toBe(true);
    }
  });

  it("should produce IDs that fit in 64 bits", () => {
    const gen = new SnowflakeGenerator(1);
    const maxBigInt64 = (1n << 63n) - 1n; // max signed 64-bit
    for (let i = 0; i < 100; i++) {
      const id = gen.generate();
      expect(id <= maxBigInt64).toBe(true);
      expect(id >= 0n).toBe(true);
    }
  });

  it("should encode machine ID in generated IDs", () => {
    const machineId = 42;
    const gen = new SnowflakeGenerator(machineId);
    const id = gen.generate();
    // Extract machine ID: bits 12-21
    const extractedMachineId = Number((id >> 12n) & 0x3ffn);
    expect(extractedMachineId).toBe(machineId);
  });

  it("should throw on invalid machine ID (negative)", () => {
    expect(() => new SnowflakeGenerator(-1)).toThrow(
      "Machine ID must be between 0 and 1023",
    );
  });

  it("should throw on invalid machine ID (> 1023)", () => {
    expect(() => new SnowflakeGenerator(1024)).toThrow(
      "Machine ID must be between 0 and 1023",
    );
  });

  it("should accept machine ID at boundary 0", () => {
    const gen = new SnowflakeGenerator(0);
    const id = gen.generate();
    expect(typeof id).toBe("bigint");
  });

  it("should accept machine ID at boundary 1023", () => {
    const gen = new SnowflakeGenerator(1023);
    const id = gen.generate();
    expect(typeof id).toBe("bigint");
  });

  it("should use fingerprint to derive machine ID", () => {
    const gen1 = new SnowflakeGenerator(undefined, "device-abc");
    const gen2 = new SnowflakeGenerator(undefined, "device-xyz");
    // Different fingerprints should produce different machine IDs
    const id1 = gen1.generate();
    const id2 = gen2.generate();
    // Extract machine IDs
    const mid1 = Number((id1 >> 12n) & 0x3ffn);
    const mid2 = Number((id2 >> 12n) & 0x3ffn);
    // At minimum they should be valid (0-1023) and different
    expect(mid1).toBeGreaterThanOrEqual(0);
    expect(mid1).toBeLessThanOrEqual(1023);
    expect(mid2).toBeGreaterThanOrEqual(0);
    expect(mid2).toBeLessThanOrEqual(1023);
    // Different fingerprints should produce different machine IDs
    expect(mid1).not.toBe(mid2);
  });

  it("same fingerprint should produce consistent machine IDs", () => {
    const gen1 = new SnowflakeGenerator(undefined, "device-consistent");
    const gen2 = new SnowflakeGenerator(undefined, "device-consistent");
    const id1 = gen1.generate();
    const id2 = gen2.generate();
    const mid1 = Number((id1 >> 12n) & 0x3ffn);
    const mid2 = Number((id2 >> 12n) & 0x3ffn);
    expect(mid1).toBe(mid2);
  });

  it("generateBatch should return empty array for count=0", () => {
    const gen = new SnowflakeGenerator(1);
    const ids = gen.generateBatch(0);
    expect(ids).toEqual([]);
  });

  it("generateBatch should throw for negative count", () => {
    const gen = new SnowflakeGenerator(1);
    expect(() => gen.generateBatch(-1)).toThrow("Count must be non-negative");
  });

  it("generateBatch should produce correct number of IDs", () => {
    const gen = new SnowflakeGenerator(1);
    const ids = gen.generateBatch(10);
    expect(ids.length).toBe(10);
  });

  it("generated IDs should be roughly time-ordered (monotonically increasing)", () => {
    const gen = new SnowflakeGenerator(1);
    const ids: bigint[] = [];
    for (let i = 0; i < 100; i++) {
      ids.push(gen.generate());
    }
    for (let i = 1; i < ids.length; i++) {
      expect(ids[i] > ids[i - 1]).toBe(true);
    }
  });
});

describe("createSnowflakeGenerator", () => {
  it("should create a generator with machine ID", () => {
    const gen = createSnowflakeGenerator(1);
    const id = gen.generate();
    expect(typeof id).toBe("bigint");
  });

  it("should create a generator with fingerprint", () => {
    const gen = createSnowflakeGenerator(undefined, "fingerprint");
    const id = gen.generate();
    expect(typeof id).toBe("bigint");
  });

  it("should create a generator with defaults", () => {
    const gen = createSnowflakeGenerator();
    const id = gen.generate();
    expect(typeof id).toBe("bigint");
  });
});
