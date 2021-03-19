// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* istanbul ignore file */

/*
This file resultifies and exports all functions from the node `fs` module.
This allows this module to serve as a replacement for node's fs.
*/

import fs from "fs";
import { Result } from "../global";

const { resultify, resultifyPromise } = Result;

export type PathLike = fs.PathLike;
export type FileHandle = fs.promises.FileHandle;
export type Stats = fs.Stats;

export const access = resultifyPromise(fs.promises.access);
export const accessSync = resultify(fs.accessSync);

export const appendFile = resultifyPromise(fs.promises.appendFile);
export const appendFileSync = resultify(fs.appendFileSync);

export const chmod = resultifyPromise(fs.promises.chmod);
export const chmodSync = resultify(fs.chmodSync);

export const chown = resultifyPromise(fs.promises.chown);
export const chownSync = resultify(fs.chownSync);

export const close = (fd: number): Promise<Result<void, Error>> =>
  new Promise((resolve) => {
    fs.close(fd, (err) => {
      if (err != null) {
        resolve(Result.failure(err));
        return;
      }
      resolve(Result.success(undefined));
    });
  });
export const closeSync = resultify(fs.close);

export const copyFile = resultifyPromise(fs.promises.copyFile);
export const copyFileSync = resultify(fs.copyFileSync);

export const createReadStream = fs.createReadStream;
export const createWriteStream = fs.createWriteStream;

export const fchmod = resultifyPromise(fs.promises.fchmod);
export const fchmodSync = resultify(fs.fchmodSync);

export const fchown = resultifyPromise(fs.promises.fchown);
export const fchownSync = resultify(fs.fchownSync);

export const fdatasync = resultifyPromise(fs.promises.fdatasync);
export const fdatasyncSync = resultify(fs.fdatasyncSync);

export const fstat = (fd: number): Promise<Result<Stats, Error>> =>
  new Promise((resolve) => {
    fs.fstat(fd, (err, stats) => {
      if (err != null) {
        resolve(Result.failure(err));
        return;
      }
      resolve(Result.success(stats));
    });
  });
export const fstatSync = resultify(fs.fstatSync);

export const fsync = resultifyPromise(fs.promises.fsync);
export const fsyncSync = resultify(fs.fsyncSync);

export const ftruncate = resultifyPromise(fs.promises.ftruncate);
export const ftruncateSync = resultify(fs.ftruncateSync);

export const futimes = resultifyPromise(fs.promises.futimes);
export const futimesSync = resultify(fs.futimesSync);

export const lchmod = resultifyPromise(fs.promises.lchmod);
export const lchmodSync = resultify(fs.lchmodSync);

export const lchown = resultifyPromise(fs.promises.lchown);
export const lchownSync = resultify(fs.lchownSync);

export const link = resultifyPromise(fs.promises.link);
export const linkSync = resultify(fs.linkSync);

export const lstat = resultifyPromise(fs.promises.lstat);
export const lstatSync = resultify(fs.lstatSync);

export const mkdir = resultifyPromise(fs.promises.mkdir);
export const mkdirSync = resultify(fs.mkdirSync);

export const mkdtemp: {
  (prefix: string, options?: { encoding?: BufferEncoding | null } | BufferEncoding | null): Promise<
    Result<string, Error>
  >;
  (prefix: string, options: { encoding: "buffer" } | "buffer"): Promise<Result<Buffer, Error>>;
  (prefix: string, options?: { encoding?: string | null } | string | null): Promise<
    Result<string | Buffer, Error>
  >;
} = resultifyPromise(fs.promises.mkdtemp) as any;

export const mkdtempSync: {
  (prefix: string, options?: { encoding?: BufferEncoding | null } | BufferEncoding | null): Result<
    string,
    Error
  >;
  (prefix: string, options: { encoding: "buffer" } | "buffer"): Result<Buffer, Error>;
  (prefix: string, options?: { encoding?: string | null } | string | null): Result<
    string | Buffer,
    Error
  >;
} = resultify(fs.mkdtempSync) as any;

export const open = resultifyPromise(fs.promises.open);
export const openSync = resultify(fs.openSync);

export const opendir = resultifyPromise(fs.promises.opendir);
export const opendirSync = resultify(fs.opendirSync);

export const read = resultifyPromise(fs.promises.read);
export const readSync = resultify(fs.readSync);

export const readdir: {
  (
    path: PathLike,
    options?: { encoding?: BufferEncoding | null; withFileTypes?: false } | BufferEncoding | null,
  ): Promise<Result<string[], Error>>;
  (path: PathLike, options: { encoding: "buffer"; withFileTypes?: false } | "buffer"): Promise<
    Result<Buffer[], Error>
  >;
  (
    path: PathLike,
    options?: { encoding?: string | null; withFileTypes?: false } | string | null,
  ): Promise<Result<string[] | Buffer[], Error>>;
  (path: PathLike, options: { encoding?: string | null; withFileTypes: true }): Promise<
    Result<fs.Dirent[], Error>
  >;
} = resultifyPromise(fs.promises.readdir) as any;

export const readdirSync: {
  (
    path: PathLike,
    options?: { encoding: BufferEncoding | null; withFileTypes?: false } | BufferEncoding | null,
  ): Result<string[], Error>;
  (path: PathLike, options: { encoding: "buffer"; withFileTypes?: false } | "buffer"): Result<
    Buffer[],
    Error
  >;
  (
    path: PathLike,
    options?: { encoding?: string | null; withFileTypes?: false } | string | null,
  ): Result<string[] | Buffer[], Error>;
  (path: PathLike, options: { encoding?: string | null; withFileTypes: true }): Result<
    fs.Dirent[],
    Error
  >;
} = resultify(fs.readdirSync) as any;

export const readFile: {
  (
    path: PathLike | FileHandle,
    options?: { encoding?: null; flag?: string | number } | null,
  ): Promise<Result<Buffer, Error>>;
  (
    path: PathLike | FileHandle,
    options: { encoding: BufferEncoding; flag?: string | number } | BufferEncoding,
  ): Promise<Result<string, Error>>;
  (
    path: PathLike | FileHandle,
    options?: { encoding?: string | null; flag?: string | number } | string | null,
  ): Promise<Result<string | Buffer, Error>>;
} = resultifyPromise(fs.promises.readFile) as any;

export const readFileSync: {
  (path: PathLike | number, options?: { encoding?: null; flag?: string } | null): Result<
    Buffer,
    Error
  >;
  (path: PathLike | number, options: { encoding: string; flag?: string } | string): Result<
    string,
    Error
  >;
  (
    path: PathLike | number,
    options?: { encoding?: string | null; flag?: string } | string | null,
  ): Result<string | Buffer, Error>;
} = resultify(fs.readFileSync) as any;

export const readlink: {
  (path: PathLike, options?: { encoding?: BufferEncoding | null } | BufferEncoding | null): Promise<
    Result<string, Error>
  >;
  (path: PathLike, options: { encoding: "buffer" } | "buffer"): Promise<Result<Buffer, Error>>;
  (path: PathLike, options?: { encoding?: string | null } | string | null): Promise<
    Result<string | Buffer, Error>
  >;
} = resultifyPromise(fs.promises.readlink) as any;

export const readlinkSync: {
  (path: PathLike, options?: { encoding?: BufferEncoding | null } | BufferEncoding | null): Result<
    string,
    Error
  >;
  (path: PathLike, options: { encoding: "buffer" } | "buffer"): Result<Buffer, Error>;
  (path: PathLike, options?: { encoding?: string | null } | string | null): Result<
    string | Buffer,
    Error
  >;
} = resultify(fs.readlinkSync) as any;

export const realpath: {
  (path: PathLike, options?: { encoding?: BufferEncoding | null } | BufferEncoding | null): Promise<
    Result<string, Error>
  >;
  (path: PathLike, options: { encoding: "buffer" } | "buffer"): Promise<Result<Buffer, Error>>;
  (path: PathLike, options?: { encoding?: string | null } | string | null): Promise<
    Result<string | Buffer, Error>
  >;
} = resultifyPromise(fs.promises.realpath) as any;

export const realpathSync: {
  (path: PathLike, options?: { encoding?: BufferEncoding | null } | BufferEncoding | null): Result<
    string,
    Error
  >;
  (path: PathLike, options: { encoding: "buffer" } | "buffer"): Result<Buffer, Error>;
  (path: PathLike, options?: { encoding?: string | null } | string | null): Result<
    string | Buffer,
    Error
  >;
} = resultify(fs.realpathSync) as any;

export const rename = resultifyPromise(fs.promises.rename);
export const renameSync = resultify(fs.renameSync);

export const rmdir = resultifyPromise(fs.promises.rmdir);
export const rmdirSync = resultify(fs.rmdirSync);

export const stat = resultifyPromise(fs.promises.stat);
export const statSync = resultify<(path: PathLike) => Stats>(fs.statSync);

export const symlink = resultifyPromise(fs.promises.symlink);
export const symlinkSync = resultify(fs.symlinkSync);

export const truncate = resultifyPromise(fs.promises.truncate);
export const truncateSync = resultify(fs.truncateSync);

export const unlink = resultifyPromise(fs.promises.unlink);
export const unlinkSync = resultify(fs.unlinkSync);

export const unwatchFile = fs.unwatchFile;

export const utimes = resultifyPromise(fs.promises.utimes);
export const utimesSync = resultify(fs.utimesSync);

export const watch = fs.watch;
export const watchFile = fs.watchFile;

export const write: {
  <TBuffer extends Uint8Array>(
    handle: FileHandle,
    buffer: TBuffer,
    offset?: number | null,
    length?: number | null,
    position?: number | null,
  ): Promise<Result<{ bytesWritten: number; buffer: TBuffer }, Error>>;
  (handle: FileHandle, string: any, position?: number | null, encoding?: string | null): Promise<
    Result<{ bytesWritten: number; buffer: string }, Error>
  >;
} = resultifyPromise(fs.promises.write) as any;

export const writeSync: {
  (
    fd: number,
    buffer: NodeJS.ArrayBufferView,
    offset?: number | null,
    length?: number | null,
    position?: number | null,
  ): Result<number, Error>;
  (fd: number, string: any, position?: number | null, encoding?: string | null): Result<
    number,
    Error
  >;
} = resultify(fs.writeSync) as any;

export const writeFile = resultifyPromise(fs.promises.writeFile);
export const writeFileSync = resultify(fs.writeFileSync);
