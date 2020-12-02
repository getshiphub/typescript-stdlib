// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { Result } from "../global";
import * as errors from "../errors/mod";
import * as io from "../io/mod";

/** The available log levels for a logger. */
export enum Level {
  error,
  warn,
  info,
  debug,
}

/** All available log levels. */
export const allLevels: readonly Level[] = [Level.error, Level.warn, Level.info, Level.debug];

/**
 * A collection of key value pairs that can be attached
 * to logs.
 */
export type Fields = Record<string, unknown>;

/** Represents any logger type that can create logs. */
export interface Logger {
  addFields(fields: Fields): void;

  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
}

/** Represents a log created by a logger. */
export interface Log {
  data: Fields;
  date: Date;
  level: Level;
  msg: string;
  out?: io.WriterSync;
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
    default:
      return Result.failure(errors.errorString(`not a valid log level: ${level}`));
  }
}
