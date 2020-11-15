# Scripts

This directory contains scripts for performing various tasks.

These scripts run directly on node (no transpiling). As a result they must be pure JavaScript, use CommonJS modules, and not use any ECMAScript features not supported by node.

These scripts are still type checked using TypeScript's `checkJs` feature.
In places where the type checker cannot infer the types properly they must be explicitly provided using JSDoc.

These scripts must not import the standard library. This is to prevent a chicken or the egg situtation where the library must be built to run the scripts but the scripts must be run to build the library. Dev dependencies can be imported and used.

### `check_deno_runtime`

This script checks that `_runtime/runtime_deno.ts` has no type errors, i.e. it implements the `Runtime` interface properly.

It does this by first running `deno types` and saving the output to `_runtime/deno.d.ts`. It will then run the TypeScript type checker against `_runtime/runtime_deno.ts` and report any type errors.

### `deno_release`

This script creates a new release of the deno version of the library on GitHub.

There are two actions that can be performed:

#### prepare

```
node scripts/deno_release prepare <VERSION>
```

This will do the following:
1. Cloning the `deno-latest` branch of the repo to `.deno-release`.
2. Copy `dist/deno` to `.deno-release`.
3. Commit the changes.
4. Create a tag called `deno/<VERSION>`.

#### release

```
node scripts/deno_release release
```

This will push the commit and tag created by the `prepare` action.

### `ensure_no_deps`

This script checks the `package.json` to make sure there is no `dependencies` field since this library is not allowed to have dependencies.

### `target_generator`

This script is responsible for building the library for a given target. Targets are configured in `targets.json`.

The scripts takes one argument which is the target to build.
Ex:
```
node scripts/target_generator.js deno
```
