// Copyright (c) 2020 Christopher Szatmary <cs@christopherszatmary.com>
// All rights reserved. MIT License.

// This file contains the Deno specific implementation of the runtime API.
// The Deno implementation does not actually include this runtime. The API
// has been designed such that the Deno namespace can be inlined directly.
// The file merely exists as a way to check that the Runtime interface is satisfied.

import type { Runtime } from "./runtime";

interface DenoRuntime extends Runtime {
  // TS doesn't like assigning a unique symbol
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly customInspect: any;
}

export const runtime: DenoRuntime = Deno;
