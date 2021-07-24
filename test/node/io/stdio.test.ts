import { bytes, io } from "../../../src";

class MockStdio {
  #originalWrite: NodeJS.WritableStream["write"];
  stream: NodeJS.WritableStream;
  data: Buffer[] = [];

  constructor(stream: NodeJS.WritableStream) {
    this.#originalWrite = stream.write;
    this.stream = stream;
    this.stream.write = this.#write;
  }

  #write(
    chunk: Buffer | string,
    encodingOrCb?: BufferEncoding | ((err?: Error | null) => void),
    cb?: (err?: Error | null) => void,
  ): boolean {
    if (typeof chunk === "string") {
      let encoding: BufferEncoding | undefined;
      if (typeof encodingOrCb === "string") {
        encoding = encodingOrCb;
      }

      this.data.push(Buffer.from(chunk, encoding));
    } else {
      this.data.push(chunk);
    }

    if (typeof encodingOrCb === "function") {
      encodingOrCb();
    } else if (typeof cb === "function") {
      cb();
    }

    return true;
  }

  restore(): void {
    this.stream.write = this.#originalWrite;
  }
}

describe("io/io.ts", () => {
  test("io: stdio: fd", () => {
    const stdout = io.stdout as unknown as { fd: number };
    const stderr = io.stderr as unknown as { fd: number };
    expect(stdout.fd).toBe(1);
    expect(stderr.fd).toBe(2);
  });

  test("io: stdio: write", async () => {
    const mockStdout = new MockStdio(process.stdout);
    const mockStderr = new MockStdio(process.stderr);

    const data = new Uint8Array([0x61, 0x62, 0x63]);
    const resultStdout = await io.stdout.write(data);
    const resultStderr = await io.stderr.write(data);

    mockStdout.restore();
    mockStderr.restore();

    expect(resultStdout.unwrap()).toBe(3);
    expect(resultStderr.unwrap()).toBe(3);
    expect(bytes.equal(mockStdout.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
    expect(bytes.equal(mockStderr.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
  });

  test("io: stdio: writeSync", () => {
    const mockStdout = new MockStdio(process.stdout);
    const mockStderr = new MockStdio(process.stderr);

    const data = new Uint8Array([0x61, 0x62, 0x63]);
    const resultStdout = io.stdout.writeSync(data);
    const resultStderr = io.stderr.writeSync(data);

    mockStdout.restore();
    mockStderr.restore();

    expect(resultStdout.unwrap()).toBe(3);
    expect(resultStderr.unwrap()).toBe(3);
    expect(bytes.equal(mockStdout.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
    expect(bytes.equal(mockStderr.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
  });

  test("io: stdio: writeString", async () => {
    const mockStdout = new MockStdio(process.stdout);
    const mockStderr = new MockStdio(process.stderr);

    const resultStdout = await io.writeString(io.stdout, "abc");
    const resultStderr = await io.writeString(io.stderr, "abc");

    mockStdout.restore();
    mockStderr.restore();

    expect(resultStdout.unwrap()).toBe(3);
    expect(resultStderr.unwrap()).toBe(3);
    expect(bytes.equal(mockStdout.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
    expect(bytes.equal(mockStderr.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
  });

  test("io: stdio: writeStringSync", () => {
    const mockStdout = new MockStdio(process.stdout);
    const mockStderr = new MockStdio(process.stderr);

    const resultStdout = io.writeStringSync(io.stdout, "abc");
    const resultStderr = io.writeStringSync(io.stderr, "abc");

    mockStdout.restore();
    mockStderr.restore();

    expect(resultStdout.unwrap()).toBe(3);
    expect(resultStderr.unwrap()).toBe(3);
    expect(bytes.equal(mockStdout.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
    expect(bytes.equal(mockStderr.data[0], new Uint8Array([0x61, 0x62, 0x63]))).toBe(true);
  });
});
