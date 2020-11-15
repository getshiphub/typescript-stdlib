// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import type { Stream } from "stream";
import { spawn, spawnSync } from "child_process";
import { Result } from "../global";

export type Stdio = "inherit" | "ignore" | "pipe" | Stream;

export interface ExecOptions {
  dir?: string;
  env?: Record<string, string>;
  stdout?: Stdio | number;
  stderr?: Stdio | number;
  stdin?: Stdio | number;
}

export interface ExecResult {
  stdout?: Buffer;
  stderr?: Buffer;
  status?: number;
  signal?: NodeJS.Signals;
}

export function exec(
  cmd: string,
  args: string[],
  opts?: ExecOptions,
): Promise<Result<ExecResult, NodeJS.ErrnoException>> {
  return new Promise((resolve) => {
    const cp = spawn(cmd, args, {
      cwd: opts?.dir,
      env: { ...process.env, ...opts?.env },
      stdio: [opts?.stdin ?? "pipe", opts?.stdout ?? "pipe", opts?.stderr ?? "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    // Collect stdout chunks if stdout was `pipe`
    if (cp.stdout != null) {
      cp.stdout.on("data", (data) => {
        if (!Buffer.isBuffer(data)) {
          stdoutChunks.push(Buffer.from(data));
        } else {
          stdoutChunks.push(data);
        }
      });
    }

    // Collect stderr chunks if stdout was `pipe`
    if (cp.stderr != null) {
      cp.stderr.on("data", (data) => {
        if (!Buffer.isBuffer(data)) {
          stderrChunks.push(Buffer.from(data));
        } else {
          stderrChunks.push(data);
        }
      });
    }

    cp.on("error", (err) => {
      resolve(Result.failure(err));
    });

    cp.on("close", (code: number | null, signal: NodeJS.Signals | null) => {
      const execResult: ExecResult = {};

      // Combine stdout and stderr chunks into single buffers if they exist
      if (cp.stdout != null) {
        execResult.stdout = Buffer.concat(stdoutChunks);
      }

      if (cp.stderr != null) {
        execResult.stderr = Buffer.concat(stderrChunks);
      }

      if (signal !== null) {
        execResult.signal = signal;
      } else if (code !== null) {
        execResult.status = code;
      }

      resolve(Result.success(execResult));
    });
  });
}

export function execSync(
  cmd: string,
  args: string[],
  opts?: ExecOptions,
): Result<ExecResult, NodeJS.ErrnoException> {
  const res = spawnSync(cmd, args, {
    cwd: opts?.dir,
    env: { ...process.env, ...opts?.env },
    stdio: [opts?.stdin ?? "pipe", opts?.stdout ?? "pipe", opts?.stderr ?? "pipe"],
  });

  if (res.error != null) {
    return Result.failure(res.error);
  }

  const execResult: ExecResult = {};

  if (res.stdout != null) {
    execResult.stdout = res.stdout;
  }

  if (res.stderr != null) {
    execResult.stderr = res.stderr;
  }

  if (res.signal !== null) {
    execResult.signal = res.signal;
  } else if (res.status !== null) {
    execResult.status = res.status;
  }

  return Result.success(execResult);
}
