// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// Adapted from https://github.com/nodejs/node/blob/master/lib/internal/fs/rimraf.js
// Copyright Node.js contributors. All rights reserved.

/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-ternary */
/* eslint-disable no-restricted-syntax */
/* istanbul ignore file */

/*
This file exists only as a polyfill because recursive removal is only supported by
Node v12.10.0+. Hopefully one day this can be removed.
*/

import { sep } from "path";
import fs from "fs";
import * as time from "../time/mod";

const notEmptyErrorCodes = new Set(["ENOTEMPTY", "EEXIST", "EPERM"]);
const retryErrorCodes = new Set(["EBUSY", "EMFILE", "ENFILE", "ENOTEMPTY", "EPERM"]);
const isWindows = process.platform === "win32";
const retryDelay = 100;
const maxRetries = 3;

export function rimraf(
  path: fs.PathLike,
  callback: (err: NodeJS.ErrnoException | null) => void,
): void {
  let retries = 0;

  _rimraf(path, function cb(err) {
    if (err) {
      if (err.code && retryErrorCodes.has(err.code) && retries < maxRetries) {
        retries++;
        const delay = retries * retryDelay;
        setTimeout(_rimraf, delay, path, cb);
        return;
      }

      // The file is already gone.
      if (err.code === "ENOENT") {
        callback(null);
        return;
      }
    }

    callback(err);
  });
}

function _rimraf(path: fs.PathLike, callback: (err: NodeJS.ErrnoException | null) => void): void {
  // SunOS lets the root user unlink directories. Use lstat here to make sure
  // it's not a directory.
  fs.lstat(path, (err, stats) => {
    if (err) {
      if (err.code === "ENOENT") {
        callback(null);
        return;
      }

      // Windows can EPERM on stat.
      if (isWindows && err.code === "EPERM") {
        fixWinEPERM(path, err, callback);
        return;
      }
    } else if (stats.isDirectory()) {
      _rmdir(path, err, callback);
      return;
    }

    fs.unlink(path, (err1) => {
      if (err1) {
        if (err1.code === "ENOENT") {
          callback(null);
          return;
        } else if (err1.code === "EISDIR") {
          _rmdir(path, err1, callback);
          return;
        } else if (err1.code === "EPERM") {
          if (isWindows) {
            fixWinEPERM(path, err1, callback);
          } else {
            _rmdir(path, err1, callback);
          }
          return;
        }
      }

      callback(err1);
    });
  });
}

function fixWinEPERM(
  path: fs.PathLike,
  originalErr: NodeJS.ErrnoException | null,
  callback: (err: NodeJS.ErrnoException | null) => void,
): void {
  fs.chmod(path, 0o666, (err) => {
    if (err) {
      callback(err.code === "ENOENT" ? null : originalErr);
      return;
    }

    fs.stat(path, (err1, stats) => {
      if (err1) {
        callback(err1.code === "ENOENT" ? null : originalErr);
        return;
      }

      if (stats.isDirectory()) {
        _rmdir(path, originalErr, callback);
      } else {
        fs.unlink(path, callback);
      }
    });
  });
}

function _rmdir(
  path: fs.PathLike,
  originalErr: NodeJS.ErrnoException | null,
  callback: (err: NodeJS.ErrnoException | null) => void,
): void {
  fs.rmdir(path, (err) => {
    if (err) {
      if (err.code && notEmptyErrorCodes.has(err.code)) {
        _rmchildren(path, callback);
        return;
      }
      if (err.code === "ENOTDIR") {
        callback(originalErr);
        return;
      }
    }

    callback(err);
  });
}

function _rmchildren(
  path: fs.PathLike,
  callback: (err: NodeJS.ErrnoException | null) => void,
): void {
  const pathBuf = Buffer.from(path);

  fs.readdir(pathBuf, "buffer", (err, files): void => {
    if (err) {
      callback(err);
      return;
    }

    let numFiles = files.length;
    if (numFiles === 0) {
      fs.rmdir(path, callback);
      return;
    }

    let done = false;
    files.forEach((child) => {
      const childPath = Buffer.concat([pathBuf, Buffer.from(sep), child]);
      rimraf(childPath, (err1) => {
        if (done) {
          return;
        }

        if (err1) {
          done = true;
          callback(err1);
          return;
        }

        numFiles--;
        if (numFiles === 0) {
          fs.rmdir(path, callback);
        }
      });
    });
  });
}

export function rimrafSync(path: fs.PathLike): void {
  let stats;
  try {
    stats = fs.lstatSync(path);
  } catch (err) {
    if (err.code === "ENOENT") {
      return;
    }

    // Windows can EPERM on stat.
    if (isWindows && err.code === "EPERM") {
      fixWinEPERMSync(path, err);
    }
  }

  try {
    // SunOS lets the root user unlink directories.
    if (stats !== undefined && stats.isDirectory()) {
      _rmdirSync(path);
    } else {
      fs.unlinkSync(path);
    }
  } catch (err) {
    if (err.code === "ENOENT") {
      return;
    } else if (err.code === "EPERM") {
      if (isWindows) {
        fixWinEPERMSync(path, err);
      } else {
        _rmdirSync(path, err);
      }
      return;
    } else if (err.code !== "EISDIR") {
      throw err;
    }

    _rmdirSync(path, err);
  }
}

function _rmdirSync(path: fs.PathLike, originalErr?: Error): void {
  try {
    fs.rmdirSync(path);
  } catch (err) {
    if (err.code === "ENOENT") {
      return;
    }
    if (err.code === "ENOTDIR") {
      throw originalErr;
    }

    if (notEmptyErrorCodes.has(err.code)) {
      // Removing failed. Try removing all children and then retrying the
      // original removal. Windows has a habit of not closing handles promptly
      // when files are deleted, resulting in spurious ENOTEMPTY failures. Work
      // around that issue by retrying on Windows.
      const pathBuf = Buffer.from(path);
      fs.readdirSync(pathBuf, "buffer").forEach((child) => {
        const childPath = Buffer.concat([pathBuf, Buffer.from(sep), child]);
        rimrafSync(childPath);
      });

      const tries = maxRetries + 1;
      for (let i = 1; i <= tries; i++) {
        try {
          fs.rmdirSync(path);
          return;
        } catch (err1) {
          // Only sleep if this is not the last try, and the delay is greater
          // than zero, and an error was encountered that warrants a retry.
          if (retryErrorCodes.has(err1.code) && i < tries && retryDelay > 0) {
            time.sleepSync(i * retryDelay * time.millisecond);
          }
        }
      }
    }
  }
}

function fixWinEPERMSync(path: fs.PathLike, originalErr: Error): void {
  try {
    fs.chmodSync(path, 0o666);
  } catch (err) {
    if (err.code === "ENOENT") {
      return;
    }

    throw originalErr;
  }

  let stats;
  try {
    stats = fs.statSync(path);
  } catch (err) {
    if (err.code === "ENOENT") return;

    throw originalErr;
  }

  if (stats.isDirectory()) {
    _rmdirSync(path, originalErr);
  } else {
    fs.unlinkSync(path);
  }
}
