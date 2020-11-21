// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { Result } from "../global";
import * as util from "../util/mod";
import * as fs from "./fs";
import { rimraf, rimrafSync } from "./_rm";

/** Asynchronously checks if the given path exists. */
export async function fileExists(path: fs.PathLike): Promise<boolean> {
  const r = await fs.access(path);
  return r.isSuccess();
}

/** Synchronously checks if the given path exists. */
export function fileExistsSync(path: fs.PathLike): boolean {
  return fs.accessSync(path).isSuccess();
}

/** Asynchronously removes the file or empty directory at the given path. */
export async function remove(path: fs.PathLike): Promise<Result<void, Error>> {
  const unlinkRes = await fs.unlink(path);
  if (unlinkRes.isSuccess()) {
    return unlinkRes;
  }

  const rmdirRes = await fs.rmdir(path);
  if (rmdirRes.isSuccess()) {
    return rmdirRes;
  }

  // Both failed, figure out which error to return
  const rmdirErr = rmdirRes.failure() as NodeJS.ErrnoException;
  if (rmdirErr.code !== "ENOTDIR") {
    return rmdirRes;
  }

  return unlinkRes;
}

/** Synchronously removes the file or empty directory at the given path. */
export function removeSync(path: fs.PathLike): Result<void, Error> {
  const unlinkRes = fs.unlinkSync(path);
  if (unlinkRes.isSuccess()) {
    return unlinkRes;
  }

  const rmdirRes = fs.rmdirSync(path);
  if (rmdirRes.isSuccess()) {
    return rmdirRes;
  }

  // Both failed, figure out which error to return
  const rmdirErr = rmdirRes.failure() as NodeJS.ErrnoException;
  if (rmdirErr.code !== "ENOTDIR") {
    return rmdirRes;
  }

  return unlinkRes;
}

/**
 * Asynchronously removes path and any children it contains.
 * It removes everything it can but returns the first error it encounters.
 * If the path does not exist, `removeAll` does nothing.
 */
export async function removeAll(path: fs.PathLike): Promise<Result<void, Error>> {
  // Try remove, if it works we're done.
  const removeRes = await remove(path);
  if (removeRes.isSuccess()) {
    // That was easy
    return removeRes;
  }

  const removeErr = removeRes.failure() as NodeJS.ErrnoException;
  if (removeErr.code === "ENOENT") {
    // If path doesn't exist that is considered success based on the semantics of removeAll
    return Result.success(undefined);
  } else if (removeErr.code !== "ENOTEMPTY") {
    return removeRes;
  }

  // The minimum node version required for native rm support.
  const rmRequiredVersion = new util.SemVer(12, 10, 0);
  const nodeVersion = util.SemVer.mustParse(process.versions.node);

  if (nodeVersion.compare(rmRequiredVersion) >= 0) {
    // We can use the builtin recursive removal
    return fs.rmdir(path, { recursive: true });
  }

  // Node version is less than min required, need to use the polyfill
  return new Promise((resolve) => {
    rimraf(path, (e) => {
      if (e != null) {
        resolve(Result.failure(e));
      }

      resolve(Result.success(undefined));
    });
  });
}

/**
 * Synchronously removes path and any children it contains.
 * It removes everything it can but returns the first error it encounters.
 * If the path does not exist, `removeAll` does nothing.
 */
export function removeAllSync(path: fs.PathLike): Result<void, Error> {
  // Try remove, if it works we're done.
  const removeRes = removeSync(path);
  if (removeRes.isSuccess()) {
    // That was easy
    return removeRes;
  }

  const removeErr = removeRes.failure() as NodeJS.ErrnoException;
  if (removeErr.code === "ENOENT") {
    // If path doesn't exist that is considered success based on the semantics of removeAll
    return Result.success(undefined);
  } else if (removeErr.code !== "ENOTEMPTY") {
    return removeRes;
  }

  // The minimum node version required for native rm support.
  const rmRequiredVersion = new util.SemVer(12, 10, 0);
  const nodeVersion = util.SemVer.mustParse(process.versions.node);

  if (nodeVersion.compare(rmRequiredVersion) >= 0) {
    // We can use the builtin recursive removal
    return fs.rmdirSync(path, { recursive: true });
  }

  // Node version is less than min required, need to use the polyfill
  return Result.of(() => rimrafSync(path));
}
