// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported largely from the Go library logrus
// Copyright (c) 2014 Simon Eskildsen
// https://github.com/sirupsen/logrus/blob/master/LICENSE

import { runtime } from "../_runtime/runtime";
import { Result } from "../global";
import * as bytes from "../bytes/mod";
import * as colors from "../colors/mod";
import * as errors from "../errors/mod";
import * as util from "../util/mod";
import { Fields, Log, Level, levelString, allLevels } from "./log";

/** The key names for the default fields. */
export enum FieldKey {
  msg = "msg",
  level = "level",
  time = "time",
}

/** Represents a type that can format logs. */
export interface Formatter {
  format(log: Log): Result<Uint8Array, error>;
}

function resolveKey(key: string, f: Map<string, string>): string {
  return f.get(key) ?? key;
}

// This prevents silently overwriting default fields.
function prefixFieldClashes(data: Fields, fieldMap: Map<string, string>): void {
  const msgKey = resolveKey(FieldKey.msg, fieldMap);
  const msg = data[msgKey];
  if (msg !== undefined) {
    data[`fields.${msgKey}`] = msg;
    delete data[msgKey];
  }

  const levelKey = resolveKey(FieldKey.level, fieldMap);
  const level = data[levelKey];
  if (level !== undefined) {
    data[`fields.${levelKey}`] = level;
    delete data[levelKey];
  }

  const timeKey = resolveKey(FieldKey.time, fieldMap);
  const time = data[timeKey];
  if (time !== undefined) {
    data[`fields.${timeKey}`] = time;
    delete data[timeKey];
  }
}

/** A `Formatter` that formats logs as `JSON`. */
export class JSONFormatter {
  #textEncoder = new TextEncoder();
  disableTimestamp: boolean;
  /** Allows for putting the log fields into a nested dictionary using this key. */
  dataKey: string;
  /** Indents all JSON logs using 2 spaces. */
  prettyPrint: boolean;
  /** Allows for customizing the names of keys for default fields. */
  fieldMap: Map<string, string>;

  constructor(opts?: {
    disableTimestamp?: boolean;
    dataKey?: string;
    prettyPrint?: boolean;
    fieldMap?: Map<string, string>;
  }) {
    this.disableTimestamp = opts?.disableTimestamp ?? false;
    this.dataKey = opts?.dataKey ?? "";
    this.prettyPrint = opts?.prettyPrint ?? false;
    this.fieldMap = opts?.fieldMap ?? new Map();
  }

  format(log: Log): Result<Uint8Array, error> {
    let data: Fields = {};
    for (const [k, v] of Object.entries(log.data)) {
      // Handle errors specially so they get stringified properly
      if (errors.isError(v)) {
        data[k] = v.error();
        continue;
      }

      data[k] = v;
    }

    if (this.dataKey !== "") {
      const newData: Fields = {
        [this.dataKey]: data,
      };
      data = newData;
    }

    prefixFieldClashes(data, this.fieldMap);

    if (!this.disableTimestamp) {
      const timeKey = resolveKey(FieldKey.time, this.fieldMap);
      data[timeKey] = log.date.toISOString();
    }

    const msgKey = resolveKey(FieldKey.msg, this.fieldMap);
    data[msgKey] = log.msg;
    const levelKey = resolveKey(FieldKey.level, this.fieldMap);
    data[levelKey] = levelString(log.level);

    let indent: number | undefined;
    if (this.prettyPrint) {
      indent = 2;
    }

    return Result.of(() => JSON.stringify(data, null, indent))
      .map((json) => this.#textEncoder.encode(json))
      .mapFailure((err) => errors.fromJSError(err));
  }
}

const baseTimestamp = new Date();

/** A `Formatter` that formats logs as text. */
export class TextFormatter {
  #isTerminal = false;
  #initCalled = false;
  #levelTextMaxLength = 0;
  forceColors: boolean;
  disableColors: boolean;
  forceQuote: boolean;
  disableQuote: boolean;
  disableTimestamp: boolean;
  fullTimestamp: boolean;
  disableSorting: boolean;
  sortFn?: (a: string, b: string) => number;
  disableLevelTruncation: boolean;
  padLevelText: boolean;
  quoteEmptyFields: boolean;
  /** Allows for customizing the names of keys for default fields. */
  fieldMap: Map<string, string>;

  constructor(opts?: {
    forceColors?: boolean;
    disableColors?: boolean;
    forceQuote?: boolean;
    disableQuote?: boolean;
    disableTimestamp?: boolean;
    fullTimestamp?: boolean;
    disableSorting?: boolean;
    sortFn?: (a: string, b: string) => number;
    disableLevelTruncation?: boolean;
    padLevelText?: boolean;
    quoteEmptyFields?: boolean;
    fieldMap?: Map<string, string>;
  }) {
    this.forceColors = opts?.forceColors ?? false;
    this.disableColors = opts?.disableColors ?? false;
    this.forceQuote = opts?.forceQuote ?? false;
    this.disableQuote = opts?.disableQuote ?? false;
    this.disableTimestamp = opts?.disableTimestamp ?? false;
    this.fullTimestamp = opts?.fullTimestamp ?? false;
    this.disableSorting = opts?.disableSorting ?? false;
    this.sortFn = opts?.sortFn;
    this.disableLevelTruncation = opts?.disableLevelTruncation ?? false;
    this.padLevelText = opts?.padLevelText ?? false;
    this.quoteEmptyFields = opts?.quoteEmptyFields ?? false;
    this.fieldMap = opts?.fieldMap ?? new Map();
  }

  #init = (log: Log): void => {
    if (log.out !== undefined) {
      // Deno uses rid (resource id) while Node uses fd (file descriptor)
      // This is a hack to make this work cross target

      // Need to use any because we are checking for runtime properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const out = log.out as any;
      if (typeof out.rid === "number") {
        // Deno will throw if an invalid rid is used
        // Do this to be safe
        const r = Result.of(() => runtime.isatty(out.rid));
        this.#isTerminal = r.success() ?? false;
      } else if (typeof out.fd === "number") {
        this.#isTerminal = runtime.isatty(out.fd);
      }
    }

    for (const level of allLevels) {
      const l = levelString(level).length;
      if (l > this.#levelTextMaxLength) {
        this.#levelTextMaxLength = l;
      }
    }

    this.#initCalled = true;
  };

  #isColored = (): boolean => {
    const isColored = this.forceColors || (this.#isTerminal && runtime.build.os !== "windows");
    return isColored && !this.disableColors;
  };

  #needsQuoting = (text: string): boolean => {
    if (this.forceQuote) {
      return true;
    }

    if (this.quoteEmptyFields && text.length === 0) {
      return true;
    }

    if (this.disableQuote) {
      return false;
    }

    for (const c of text) {
      if (
        !(
          (c >= "0" && c <= "9") ||
          (c >= "A" && c <= "Z") ||
          (c >= "a" && c <= "z") ||
          c === "-" ||
          c === "." ||
          c === "_" ||
          c === "/" ||
          c === "@" ||
          c === "^" ||
          c === "+"
        )
      ) {
        return true;
      }
    }

    return false;
  };

  #appendValue = (b: bytes.DynamicBuffer, value: unknown): void => {
    let str: string;
    if (typeof value === "string") {
      str = value;
    } else {
      str = util.toString(value);
    }

    if (!this.#needsQuoting(str)) {
      b.writeStringSync(str);
    } else {
      b.writeStringSync(`"${str}"`);
    }
  };

  #appendKeyValue = (b: bytes.DynamicBuffer, key: string, value: unknown): void => {
    if (b.length > 0) {
      b.writeStringSync(" ");
    }

    b.writeStringSync(`${key}=`);
    this.#appendValue(b, value);
  };

  #printColored = (b: bytes.DynamicBuffer, log: Log, keys: string[], data: Fields): void => {
    let colorFn: (str: string) => string;
    switch (log.level) {
      case Level.debug:
        colorFn = colors.white;
        break;
      case Level.warn:
        colorFn = colors.yellow;
        break;
      case Level.error:
        colorFn = colors.red;
        break;
      default:
        colorFn = colors.blue;
        break;
    }

    let levelText = levelString(log.level).toUpperCase();
    if (!this.disableLevelTruncation && !this.padLevelText) {
      levelText = levelText.slice(0, 4);
    }

    if (this.padLevelText) {
      const diff = this.#levelTextMaxLength - levelText.length;
      levelText = `${levelText}${" ".repeat(diff)}`;
    }

    // Remove a single newline if it already exists in the message
    // since a newline is added at the end
    log.msg = log.msg.replace(/\n$/, "");

    if (this.disableTimestamp) {
      b.writeStringSync(`${colorFn(levelText)} ${log.msg}`);
    } else if (!this.fullTimestamp) {
      const timestamp = Math.floor((log.date.getTime() - baseTimestamp.getTime()) / 1000);
      b.writeStringSync(`${colorFn(levelText)} [${timestamp}] ${log.msg}`);
    } else {
      b.writeStringSync(`${colorFn(levelText)} [${log.date.toISOString()}] ${log.msg}`);
    }

    for (const k of keys) {
      b.writeStringSync(` ${colorFn(k)}=`);
      this.#appendValue(b, data[k]);
    }
  };

  format(log: Log): Result<Uint8Array, error> {
    const data = { ...log.data };
    prefixFieldClashes(data, this.fieldMap);

    const keys: string[] = [];
    for (const k of Object.keys(data)) {
      keys.push(k);
    }

    const fixedKeys: string[] = [];
    if (!this.disableTimestamp) {
      const timeKey = resolveKey(FieldKey.time, this.fieldMap);
      fixedKeys.push(timeKey);
    }

    const levelKey = resolveKey(FieldKey.level, this.fieldMap);
    fixedKeys.push(levelKey);

    if (log.msg !== "") {
      const msgKey = resolveKey(FieldKey.msg, this.fieldMap);
      fixedKeys.push(msgKey);
    }

    if (!this.disableSorting) {
      if (this.sortFn === undefined) {
        keys.sort();
        fixedKeys.push(...keys);
      } else if (!this.#isColored()) {
        fixedKeys.push(...keys);
        fixedKeys.sort(this.sortFn);
      } else {
        keys.sort(this.sortFn);
      }
    } else {
      fixedKeys.push(...keys);
    }

    const b = new bytes.DynamicBuffer();

    if (!this.#initCalled) {
      this.#init(log);
    }

    if (this.#isColored()) {
      this.#printColored(b, log, keys, data);
    } else {
      for (const key of fixedKeys) {
        let value: unknown;

        if (key === resolveKey(FieldKey.time, this.fieldMap)) {
          value = log.date.toISOString();
        } else if (key === resolveKey(FieldKey.level, this.fieldMap)) {
          value = levelString(log.level);
        } else if (key === resolveKey(FieldKey.msg, this.fieldMap)) {
          value = log.msg;
        } else {
          value = data[key];
        }

        this.#appendKeyValue(b, key, value);
      }
    }

    b.writeStringSync("\n");
    return Result.success(b.bytes());
  }
}
