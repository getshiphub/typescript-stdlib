// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { Result } from "../global";
import * as errors from "../errors/mod";

/** The available log levels for a logger. */
export enum Level {
  panic,
  fatal,
  error,
  warn,
  info,
  debug,
}

/** All available log levels. */
export const allLevels: readonly Level[] = [
  Level.panic,
  Level.fatal,
  Level.error,
  Level.warn,
  Level.info,
  Level.debug,
];

/**
 * A collection of key value pairs that can be attached
 * to logs.
 */
export type Fields = Record<string, unknown>;

/** Represents any logger type that can create logs. */
export interface Logger {
  addField(key: string, value: unknown): void;
  addFields(fields: Fields): void;

  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  fatal(msg: string, fields?: Fields): void;
  panic(msg: string, fields?: Fields): void;
}

/**
 * Represents a type that can be written to.
 * Generally implemented by a Stream or Buffer.
 */
export interface Writable {
  write(buffer: Uint8Array): void;
}

/** Represents a log created by a logger. */
export interface Log {
  data: Fields;
  date: Date;
  level: Level;
  msg: string;
  out?: Writable;
}

/** Returns a string representation of the given log level. */
export function levelString(level: Level): string {
  switch (level) {
    case Level.debug:
      return "debug";
    case Level.info:
      return "info";
    case Level.warn:
      return "warn";
    case Level.error:
      return "error";
    case Level.fatal:
      return "fatal";
    case Level.panic:
      return "panic";
    /* istanbul ignore next */
    default:
      return "unknown";
  }
}

/** Parses the log level string and returns the matching log level. */
export function parseLevel(level: string): Result<Level, error> {
  switch (level.toLowerCase()) {
    case "debug":
      return Result.success(Level.debug);
    case "info":
      return Result.success(Level.info);
    case "warn":
      return Result.success(Level.warn);
    case "error":
      return Result.success(Level.error);
    case "fatal":
      return Result.success(Level.fatal);
    case "panic":
      return Result.success(Level.panic);
    default:
      return Result.failure(errors.errorString(`not a valid log level: ${level}`));
  }
}
