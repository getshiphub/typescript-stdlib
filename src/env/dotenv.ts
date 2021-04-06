// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This code has been ported largely from the Go library joho/godotenv
// Copyright (c) 2013 John Barton
// All rights reserved. MIT License.
// https://github.com/joho/godotenv/blob/master/LICENCE

import { runtime } from "../_runtime/runtime";
import { Result } from "../global";
import * as errors from "../errors/mod";
import * as strings from "../strings/mod";
import { lookup as lookupEnv, set as setEnv } from "./env";

const exportRegex = /^\s*(?:export\s+)?(.*?)\s*$/;
const singleQuotesRegex = /^'(.*)'$/;
const doubleQuotesRegex = /^"(.*)"$/;
const escapeRegex = /\\./;
const unescapeCharsRegex = /\\([^$])/;
const expandVarAllRegex = /(\\)?(\$)(\()?\{?([A-Z0-9_]+)?\}?/g;
const expandVarRegex = /(\\)?(\$)(\()?\{?([A-Z0-9_]+)?\}?/;

function parseValue(value: string, envMap: Map<string, string>): string {
  let v = value.trim();

  // check if we've got quoted values or possible escapes
  if (value.length > 1) {
    const singleQuotes = v.match(singleQuotesRegex);
    const doubleQuotes = v.match(doubleQuotesRegex);
    if (singleQuotes != null || doubleQuotes != null) {
      // pull the quotes off the edges
      v = v.slice(1, -1);
    }

    if (doubleQuotes != null) {
      // v = v.replace(/\\n/g, "\n");
      // v = v.replace(/\\r/g, "\r");
      // expand newlines
      v = v.replace(escapeRegex, (match: string): string => {
        const c = strings.trimPrefix(match, "\\");
        switch (c) {
          case "n":
            return "\n";
          case "r":
            return "\r";
          default:
            return match;
        }
      });
      // unescape characters
      v = v.replace(unescapeCharsRegex, "$1");
      // value = unescapeCharsRegex.ReplaceAllString(value, "$1");
    }
    if (singleQuotes == null) {
      // expand variables
      v = v.replace(expandVarAllRegex, (s) => {
        const submatch = s.match(expandVarRegex);
        if (submatch == null) {
          return s;
        }
        if (submatch[1] === "\\" || submatch[2] === "(") {
          return submatch[0].slice(1);
        } else if (submatch[4] !== undefined) {
          return envMap.get(submatch[4]) ?? "";
        }
        return s;
      });
    }
  }

  return v;
}

function parseLine(
  line: string,
  envMap: Map<string, string>,
): Result<[key: string, value: string], error> {
  if (line.length === 0) {
    return Result.failure(errors.errorString("zero length string"));
  }

  // ditch the comments (but keep quoted hashes)
  if (line.includes("#")) {
    const segmentsBetweenHashes = line.split("#");
    let quotesAreOpen = false;
    const segmentsToKeep: string[] = [];
    for (const segment of segmentsBetweenHashes) {
      if (strings.count(segment, `"`) === 1 || strings.count(segment, "'") === 1) {
        if (quotesAreOpen) {
          quotesAreOpen = false;
          segmentsToKeep.push(segment);
        } else {
          quotesAreOpen = true;
        }
      }

      if (segmentsToKeep.length === 0 || quotesAreOpen) {
        segmentsToKeep.push(segment);
      }
    }

    // eslint-disable-next-line no-param-reassign
    line = segmentsToKeep.join("#");
  }

  const i = line.indexOf("=");
  if (i === -1) {
    return Result.failure(errors.errorString("can't separate key from value"));
  }
  const splitString = [line.slice(0, i), line.slice(i + 1)];
  // const splitString = line.split("=", 2);
  // if (splitString.length !== 2) {
  //   return Result.failure(errors.errorString("can't separate key from value"));
  // }

  // Parse the key
  // let key = splitString[0];
  // if (key.startsWith("export")) {
  // 	key = strings.trimPrefix(key, "export");
  // }
  // key = key.trim();
  const key = splitString[0].replace(exportRegex, "$1");

  // Parse the value
  const value = parseValue(splitString[1], envMap);
  return Result.success([key, value]);
}

function isIgnoredLine(line: string): boolean {
  const trimmedLine = line.trim();
  return trimmedLine.length === 0 || trimmedLine.startsWith("#");
}

/** parse reads an env file from a string, returning a map of keys and values. */
export function parse(s: string): Result<Map<string, string>, error> {
  const envMap = new Map<string, string>();
  const lines = s.split("\n");
  for (const fullLine of lines) {
    if (isIgnoredLine(fullLine)) {
      continue;
    }
    const result = parseLine(fullLine, envMap);
    if (result.isFailure()) {
      return Result.failure(result.failure());
    }
    const [key, value] = result.success();
    envMap.set(key, value);
  }
  return Result.success(envMap);
}

function readFile(filename: string): Result<Map<string, string>, error> {
  // eslint-disable-next-line no-restricted-syntax
  try {
    return parse(runtime.readTextFileSync(filename));
  } catch (e) {
    return Result.failure(errors.fromJSError(e));
  }
}

function filenamesOrDefault(filenames: string[]): string[] {
  if (filenames.length === 0) {
    return [".env"];
  }
  return filenames;
}

function loadFile(filename: string, shouldOverload: boolean): error | undefined {
  const result = readFile(filename);
  if (result.isFailure()) {
    return result.failure();
  }

  for (const [key, value] of result.success()) {
    if (shouldOverload || lookupEnv(key) === undefined) {
      setEnv(key, value);
    }
  }
  return undefined;
}

/**
 * read reads all env files and returns the values as a map.
 * It does not modify the env.
 */
export function read(...filenames: string[]): Result<Map<string, string>, error> {
  const names = filenamesOrDefault(filenames);
  const envMap = new Map<string, string>();

  for (const filename of names) {
    const result = readFile(filename);
    if (result.isFailure()) {
      return result;
    }

    for (const [key, value] of result.success()) {
      envMap.set(key, value);
    }
  }

  return Result.success(envMap);
}

/**
 * load will read all the specified env files and load them into the env for this process.
 * If no filenames are specified, load will look for a `.env` file in the current working directory.
 *
 * **NOTE:** load WILL NOT OVERRIDE an env var that already exists.
 */
export function load(...filenames: string[]): error | undefined {
  const names = filenamesOrDefault(filenames);

  for (const filename of names) {
    const err = loadFile(filename, false);
    if (err !== undefined) {
      return err;
    }
  }

  return undefined;
}

/**
 * overload will read all the specified env files and load them into the env for this process.
 * If no filenames are specified, load will look for a `.env` file in the current working directory.
 *
 * **NOTE:** overload WILL OVERRIDE an env var that already exists.
 */
export function overload(...filenames: string[]): error | undefined {
  const names = filenamesOrDefault(filenames);

  for (const filename of names) {
    const err = loadFile(filename, true);
    if (err !== undefined) {
      return err;
    }
  }

  return undefined;
}
