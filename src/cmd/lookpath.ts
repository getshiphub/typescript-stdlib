// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported almost directly from Go's src/os/exec
// Copyright (c) 2009 The Go Authors. All rights reserved.
// https://github.com/golang/go/blob/master/LICENSE

import fs from "fs";
import path from "path";

import { Result } from "../global";
import * as errors from "../errors/mod";

export const errNotFound = errors.errorString("executable file not found in PATH");
export const errPermission = errors.errorString("permission denied");
export const errNotExist = errors.errorString("file does not exist");

export class LookUpError {
  fileName: string;
  err: error;

  constructor(fileName: string, err: error) {
    this.fileName = fileName;
    this.err = err;
  }

  error(): string {
    return `LookUpError: ${this.fileName}: ${this.err.error()}`;
  }

  detailedError(): string {
    return `LookUpError: ${this.fileName}: ${this.err.detailedError()}`;
  }

  cause(): error {
    return this.err;
  }
}

function findExecutableUnix(file: string): Result<void, error> {
  return Result.of(() => fs.statSync(file))
    .mapFailure((e) => errors.fromJSError(e))
    .flatMap<void>((s) => {
      // eslint-disable-next-line no-bitwise
      if (!s.isDirectory() && (s.mode & 0o111) !== 0) {
        return Result.success(undefined);
      }

      return Result.failure(errPermission);
    });
}

function lookPathUnix(file: string): Result<string, error> {
  if (file.includes("/")) {
    return findExecutableUnix(file)
      .map(() => file)
      .mapFailure((e) => new LookUpError(file, e));
  }

  const envPath = process.env.PATH ?? "";
  for (let dir of envPath.split(path.delimiter)) {
    if (dir === "") {
      // In unix "" means "."
      dir = ".";
    }

    const p = path.join(dir, file);
    if (findExecutableUnix(p).isSuccess()) {
      return Result.success(p);
    }
  }

  return Result.failure(new LookUpError(file, errNotFound));
}

function chkStatWin(file: string): Result<void, error> {
  return Result.of(() => fs.statSync(file))
    .mapFailure((e) => errors.fromJSError(e))
    .flatMap<void>((s) => {
      if (s.isDirectory()) {
        return Result.failure(errPermission);
      }

      return Result.success(undefined);
    });
}

function findExecutableWin(file: string, exts: string[]): Result<string, error> {
  if (exts.length === 0) {
    return chkStatWin(file).map(() => file);
  }

  if (path.win32.extname(file) !== "" && chkStatWin(file).isSuccess()) {
    return Result.success(file);
  }

  for (const e of exts) {
    const f = file + e;
    if (chkStatWin(f).isSuccess()) {
      return Result.success(f);
    }
  }

  return Result.failure(errNotExist);
}

function lookPathWin(file: string): Result<string, error> {
  let exts: string[] = [];
  const pathExt = process.env.PATHEXT ?? "";

  if (pathExt !== "") {
    for (let e of pathExt.toLowerCase().split(";")) {
      if (e === "") {
        continue;
      }

      if (e[0] !== ".") {
        e = `.${e}`;
      }

      exts.push(e);
    }
  } else {
    exts = [".com", ".exe", ".bat", ".cmd"];
  }

  if ([":", "\\", "/"].some((c) => file.includes(c))) {
    return findExecutableWin(file, exts).mapFailure((e) => new LookUpError(file, e));
  }

  const res = findExecutableWin(path.join(".", file), exts);
  if (res.isSuccess()) {
    return res;
  }

  const envPath = process.env.path ?? "";
  for (const dir of envPath.split(path.delimiter)) {
    const r = findExecutableWin(path.join(dir, file), exts);
    if (r.isSuccess()) {
      return r;
    }
  }

  return Result.failure(new LookUpError(file, errNotFound));
}

/**
 * Searches for an executable in the directories named by the PATH environment variable.
 * On Windows it also takes PATHEXT environment variable into account.
 * @param file The file to get the path of.
 * @returns A Result with the path or an error.
 */
export function lookPath(file: string): Result<string, error> {
  if (/^win/i.test(process.platform)) {
    return lookPathWin(file);
  }

  return lookPathUnix(file);
}

/** Checks if the given command is available to run. */
export function isCommandAvailable(command: string): boolean {
  return lookPath(command).isSuccess();
}
