# typescript-stdlib

A standard library for TypeScript.

This library aims to have a set of baseline functionality that can be used by any program for a wide variety of use cases.

This library has **zero** dependencies.

## Supported targets

This library is primarily intended for use with Node.js. However, large parts of it are also available for use with deno.

## Usage

**Disclaimer:** This library is not yet stable. This means minor versions will likely have breaking changes. We recommend pinning a patch version which will not contain breaking changes.

### Node.js

Install the package using npm:
```
npm install typescript-stdlib
```

Or use yarn:
```
yarn add typescript-stdlib
```

Import the desired modules:
```ts
import { Result, errors } from "typescript-stdlib";
```

### Deno

Currently the deno version can be grabbed directly from GitHub. For each release a `deno/<VERSION>` tag is created.

This can be used like so:
```ts
import { Result, errors } from "https://raw.githubusercontent.com/getshiphub/typescript-stdlib/deno/0.1.0/mod.ts"
```

## Why was this created?

See [rational](docs/rational.md) for details on why this library was created.

## Contributing

Contributions are welcome!

See [constributing](docs/contributing.md) for instructions.
