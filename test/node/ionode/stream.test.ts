import { PassThrough } from "stream";
import os from "os";
import path from "path";
import { bytes, fs, io, ionode } from "../../../src";

describe("ionode/stream.ts", () => {
  test("ionode.StreamReader", async () => {
    const mockStream = new PassThrough();
    const r = new ionode.StreamReader(mockStream);
    mockStream.push("hello");
    mockStream.push(null);

    const p = new Uint8Array(5);
    const res = await r.read(p);
    expect(res.unwrap()).toBe(5);
    expect(p).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]));

    const p2 = new Uint8Array(5);
    const res2 = await r.read(p2);
    expect(res2.unwrapFailure()).toBe(io.eof);
  });

  test("ionode.StreamReader: all available data", async () => {
    const mockStream = new PassThrough();
    const r = new ionode.StreamReader(mockStream);
    mockStream.push("hello");

    const p = new Uint8Array(15);
    const res = await r.read(p);
    expect(res.unwrap()).toBe(5);
    expect(p.subarray(0, 5)).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]));

    mockStream.push(null);
  });

  test("ionode.StreamReader: string encoding", async () => {
    const mockStream = new PassThrough({ encoding: "utf-8" });
    const r = new ionode.StreamReader(mockStream);
    mockStream.push("hello");

    const p = new Uint8Array(5);
    const res = await r.read(p);
    expect(res.unwrap()).toBe(5);
    expect(p).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]));

    mockStream.push(null);
  });

  test("ionode.StreamReader: returns eof", async () => {
    const mockStream = new PassThrough();
    const r = new ionode.StreamReader(mockStream);
    mockStream.push(null);

    const res1 = await r.read(new Uint8Array(5));
    const res2 = await r.read(new Uint8Array(5));
    const res3 = await r.read(new Uint8Array(5));

    expect(res1.unwrapFailure()).toBe(io.eof);
    expect(res2.unwrapFailure()).toBe(io.eof);
    expect(res3.unwrapFailure()).toBe(io.eof);
  });

  test("ionode.StreamReader: error", async () => {
    const mockStream = new PassThrough();
    const r = new ionode.StreamReader(mockStream);
    setImmediate(() => {
      mockStream.emit("error", new Error("boom"));
    });

    const p = new Uint8Array(5);
    const res = await r.read(p);
    expect(res.unwrapFailure().error()).toBe("Error: boom");
  });

  test("ionode.StreamReader: error before read", async () => {
    const mockStream = new PassThrough();
    const r = new ionode.StreamReader(mockStream);
    mockStream.emit("error", new Error("boom"));

    const p = new Uint8Array(5);
    const res = await r.read(p);
    expect(res.unwrapFailure().error()).toBe("Error: boom");
  });

  test("ionode.StreamReader: stream destroyed", async () => {
    const mockStream = new PassThrough();
    const r = new ionode.StreamReader(mockStream);
    setImmediate(() => {
      mockStream.destroy();
    });

    const p = new Uint8Array(5);
    const res = await r.read(p);
    expect(res.unwrapFailure()).toBe(io.eof);
  });

  test("ionode.StreamWriter", async () => {
    const chunks: Buffer[] = [];
    const mockStream = new PassThrough();
    mockStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const w = new ionode.StreamWriter(mockStream);
    const res = await w.write(new Uint8Array([0x32, 0x33, 0x34]));
    await w.end();

    expect(res.unwrap()).toBe(3);
    expect(chunks).toEqual([Buffer.from([0x32, 0x33, 0x34])]);
  });

  test("ionode.StreamWriter: back pressure", async () => {
    const chunks: Buffer[] = [];
    // Force back pressure by setting highWaterMark to 0
    const mockStream = new PassThrough({ highWaterMark: 0 });
    mockStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const w = new ionode.StreamWriter(mockStream);
    const res = await w.write(new Uint8Array([0x32, 0x33, 0x34]));
    await w.end();

    expect(res.unwrap()).toBe(3);
    expect(chunks).toEqual([Buffer.from([0x32, 0x33, 0x34])]);
  });

  test("ionode.StreamWriter: write string", async () => {
    const chunks: Buffer[] = [];
    const mockStream = new PassThrough();
    mockStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const w = new ionode.StreamWriter(mockStream);
    const res = await io.writeString(w, "abc");
    await w.end();

    expect(res.unwrap()).toBe(3);
    expect(chunks).toEqual([Buffer.from("abc")]);
  });

  test("ionode.StreamWriter: writer closed", async () => {
    const chunks: Buffer[] = [];
    const mockStream = new PassThrough();
    mockStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const w = new ionode.StreamWriter(mockStream);
    await w.end();
    const res = await w.write(new Uint8Array([0x32, 0x33, 0x34]));

    expect(res.unwrapFailure()).toBe(io.errClosed);
    expect(chunks).toEqual([]);
  });

  test("ionode.StreamWriter: stream closed", async () => {
    const chunks: Buffer[] = [];
    const mockStream = new PassThrough();
    mockStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const w = new ionode.StreamWriter(mockStream);
    mockStream.end();
    const res = await w.write(new Uint8Array([0x32, 0x33, 0x34]));

    expect(res.unwrapFailure()).toBe(io.errClosed);
    expect(chunks).toEqual([]);
  });

  test("ionode.StreamWriter: error before writing", async () => {
    const chunks: Buffer[] = [];
    const mockStream = new PassThrough();
    mockStream.on("data", (chunk: Buffer) => {
      chunks.push(chunk);
    });

    const w = new ionode.StreamWriter(mockStream);
    mockStream.emit("error", new Error("oops"));
    const res = await w.write(new Uint8Array([0x32, 0x33, 0x34]));

    expect(res.unwrapFailure().error()).toBe("Error: oops");
    expect(chunks).toEqual([]);
  });

  test("ionode.StreamWriter: multiple calls to end", async () => {
    const mockStream = new PassThrough();
    const w = new ionode.StreamWriter(mockStream);
    const r1 = await w.end();
    const r2 = await w.end();
    const r3 = await w.end();

    expect(r1).toBeSuccess();
    expect(r2).toBeSuccess();
    expect(r3).toBeSuccess();
  });

  // More involved integration tests, use real streams not just toy ones

  test("ionode: read file", async () => {
    const fp = path.resolve(__dirname, "testdata", "testfile.txt");
    const rs = fs.createReadStream(fp);
    const r = new ionode.StreamReader(rs);
    const p = new Uint8Array(56);
    const result = await r.read(p);
    rs.close();

    const b = new bytes.DynamicBuffer(p);
    expect(result.unwrap()).toBe(56);
    expect(b.toString()).toBe("Lorem ipsum dolor sit amet, consectetur adipiscing elit.");
  });

  describe("ionode: writing files", () => {
    let tmpDir: string;

    beforeEach(async () => {
      const r = await fs.mkdtemp(`${os.tmpdir()}${path.sep}`);
      tmpDir = r.unwrap();
    });

    afterEach(async () => {
      await fs.removeAll(tmpDir);
    });

    test("write to file", async () => {
      const fp = path.join(tmpDir, "out.txt");
      const ws = fs.createWriteStream(fp);
      const w = new ionode.StreamWriter(ws);
      const content = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
      const result = await w.writeString(content);
      const endResult = await w.end();

      expect(result.unwrap()).toBe(56);
      expect(endResult).toBeSuccess();

      const fileResult = await fs.readFile(fp);
      const b = new bytes.DynamicBuffer(fileResult.unwrap());
      expect(b.toString()).toBe(content);
    });

    test("stream file", async () => {
      const srcPath = path.resolve(__dirname, "testdata", "testfile.txt");
      const dstPath = path.join(tmpDir, "out.txt");
      const rs = fs.createReadStream(srcPath);
      const ws = fs.createWriteStream(dstPath);
      const r = new ionode.StreamReader(rs);
      const w = new ionode.StreamWriter(ws);

      // Set buf to make sure the file is read in multiple chunks
      const result = await io.copy(w, r, { buf: new Uint8Array(1024) });
      const endResult = await w.end();

      expect(result.unwrap()).toBe(3100);
      expect(endResult).toBeSuccess();

      const srcResult = await fs.readFile(srcPath);
      const srcData = new bytes.DynamicBuffer(srcResult.unwrap());
      const dstResult = await fs.readFile(dstPath);
      const dstData = new bytes.DynamicBuffer(dstResult.unwrap());
      expect(dstData.bytes()).toEqual(srcData.bytes());
    });
  });
});
