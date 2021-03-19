// Copyright (c) 2020-2021 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This file describes the common runtime API exposed to this library.
// This allows these APIs to be used independently of what environment
// the code is running in, either Node or Deno.

// In Node most of these APIs will map to the global `process` object.
// In Deno most of these APIs will map to the global `Deno` object.

interface Env {
  get(key: string): string | undefined;
  set(key: string, value: string): void;
  delete(key: string): void;
}

interface InspectOptions {
  colors?: boolean;
  compact?: boolean;
  depth?: number;
  showProxy?: boolean;
  sorted?: boolean;
  getters?: boolean;
}

export interface Runtime {
  readonly build: {
    os: string;
  };
  readonly customInspect: unique symbol;
  readonly env: Env;
  readonly noColor: boolean;
  exit(code?: number): never;
  inspect(value: unknown, options?: InspectOptions): string;
  isatty(rid: number): boolean;
}

export declare const runtime: Runtime;
