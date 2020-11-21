// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

import { runtime } from "../_runtime/runtime";
import { Formatter, TextFormatter } from "./formatter";
import { Logger, Level, Fields, Log, Writable } from "./log";

/** A basic logger that writes logs to a `Writable` object. */
export class StandardLogger implements Logger {
  #fields: Fields = {};
  /** A `Writable` object to write the logs to. */
  out: Writable;
  /** The Formatter used to format logs. */
  formatter: Formatter;
  /**
   * The minimum level to log at. Logs greater than and equal
   * to this level will be logged.
   */
  level: Level;

  constructor(opts?: { out?: Writable; formatter?: Formatter; level?: Level }) {
    this.out = opts?.out ?? runtime.stderr;
    this.formatter = opts?.formatter ?? new TextFormatter();
    this.level = opts?.level ?? Level.info;
  }

  #log = (level: Level, msg: string, fields?: Fields): void => {
    if (!this.isLevelEnabled(level)) {
      return;
    }

    const data = { ...this.#fields, ...fields };
    const log: Log = {
      data,
      date: new Date(),
      level,
      msg,
      out: this.out,
    };

    const result = this.formatter.format(log);
    if (result.isFailure()) {
      console.error(`Failed to format log: ${result.failure().error()}`);
      return;
    }

    const serialized = result.success();
    this.out.write(serialized);
  };

  /** Checks if the given log level is enabled for the logger. */
  isLevelEnabled(level: Level): boolean {
    return this.level >= level;
  }

  /**
   * Adds given fields to the logger's global
   * fields which will be included in all logs.
   */
  addFields(fields: Fields): void {
    for (const [k, v] of Object.entries(fields)) {
      this.#fields[k] = v;
    }
  }

  /**
   * Writes a log with the given messages and fields
   * at debug level.
   */
  debug(msg: string, fields?: Fields): void {
    this.#log(Level.debug, msg, fields);
  }

  /**
   * Writes a log with the given messages and fields
   * at info level.
   */
  info(msg: string, fields?: Fields): void {
    this.#log(Level.info, msg, fields);
  }

  /**
   * Writes a log with the given messages and fields
   * at warn level.
   */
  warn(msg: string, fields?: Fields): void {
    this.#log(Level.warn, msg, fields);
  }

  /**
   * Writes a log with the given messages and fields
   * at error level.
   */
  error(msg: string, fields?: Fields): void {
    this.#log(Level.error, msg, fields);
  }
}

/** The default logger provided by the `log` module. */
export const std = new StandardLogger();
