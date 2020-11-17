# Style Guide

This document describes the styleguide conventions of the `typescript-stdlib` repo.

This is heavily inspired by the [deno style guide](https://deno.land/std/style_guide.md) and a lot of the rules are taken from there.

## Keep filenames short and descriptive.

Filenames should generally be one word and clearly explain what the file contains.

## Use underscores in filenames.

In the rare event a filename is more than one word, use underscores to separate the words.
Example: `dynamic_buffer.ts`.

## Use TypeScript instead of JavaScript.

Always use TypeScript unless absolutely necessary. The exception to this rule is `scripts/` which must be pure JavaScript.

## JavaScript code should use JSDoc type annotations.

For JavaScript files in `scripts/` types should be declared using JSDoc where they cannot be inferred. These files are still type checked.

## This library must have zero dependencies.

`typescript-stdlib` is intended to have baseline functionality that all TypeScript programs can rely on. Any additional functionality needed to implement something should also be implemented.

In rare cases where a 3rd party library really should be used instead of reimplemented, copy the code into the project (make sure to include the appropriate copyright header).
An example of this is `src/fs/rm.ts`.

## Organize code into modules.

A module is directory containing a collection of TypeScript files. Each module should serve a single clear purpose.
If it serves multiple purposes it should be broken up into separate modules for each purpose.

## Modules should have a `mod.ts` file

This will serve as the module's entrypoint and should re-export all exports from each TypeScript file in the module.

## Do not use `index.ts` files

No `index.ts` files should exist except for `src/index.ts`. Instead `mod.ts` should be used as described above.
This is to avoid the magicalness of `index.ts` and to make it easier to support deno.

## Put global cross cutting functionality in `src/global.ts`.

If some functionality is truly global and required by many modules it should be put in `src/global.ts`. Good examples are `panic` and `Result`.

## Avoid adding to `src/global.ts`.

The number of exports from `src/global.ts` should be kept as small as possible. This is reserved for truly global functionality.
Always consider if the functionality you are adding can go into it's own, or another existing module before adding it to `src/global.ts`.

## Minimize dependencies between modules; do not make circular imports.

Keep the dependency graph simple and manageable. If only a small piece of functionality is required from another module consider inlining it instead of importing the module.

## `src/global.ts` must not import other modules.

`src/global.ts` is meant to be global and importable by any module. Therefore, it cannot import other modules as circular imports are not allowed (see above).
If functionality from a module is required it must be inlined.

## Separate source code and tests

Source code goes in `src` and tests go in `test`. This is to make it easier to exclude tests from the outputted JavaScript source as well as have separate tests per target.

## Create tests for each target.

Test musts be created for each target to ensure that the module works on all targets.

Deno tests go in `test/deno`, node tests go in `test/node`.

## Create tests for each module.

Every module should have an associated test module.
If the module is supported by multiple targets, each target must have a test module.

Ex: `src/bytes`, `test/deno/bytes`, `test/node/bytes`.

## Prefer table driven testing.

In cases where a function needs to be tested with multiple inputs and outputs table driven testing should be used.
Instead of creating a separate test function for each test case, create a single test function and an array of test cases.

In node tests, Jest's `test.each` can be used. In deno, simply create an array of test cases and use a `for` loop to run each.

## Test should be self contained.

For node tests avoid the use of `beforeEach/beforeAll/afterEach/afterAll`. A test should contain all the information about the test.
If multiple tests require the same boilerplate, consider using table driven testing as mentioned above.

This also has the added benefit of making tests easier to port to deno, since deno does not have these mechanisms.

## Jest tests must use `test` not `it`.

Using `test` is more straightforward and makes the tests more similar to the deno tests.

## Try to make modules that are supported by all targets.

Where possible, modules should be supported by every target. This means minimizing the use of target specific APIs as much as possible.

## Cross target modules must not use target specific APIs.

Modules that are available for all targets must not use target specific APIs or they will not work on different targets.

If a target specific API is required it should be used through the `_runtime` API which provides a facade that works on all targets.

## Avoid adding to `_runtime`.

The runtime API should be kept as small and minimal as possible. Don't add to it unless absolutely necessary.

## `_runtime` must match deno's builtin API.

It is a lot easier to make node support deno's API, than to make deno support node's API.
Also by making the runtime API match deno's API, it allows runtime to be removed at build time.

## Do not use `try/catch/throw`.

Using `try/catch/throw` leads to convoluted code.
It also causes many ordinary errors to be treated as exceptional and when everything is exceptional, nothing is exceptional.
This is inline with Go's beliefs on exceptions and error handling: https://golang.org/doc/faq#exceptions.

Errors should be treated as values and returned from functions just like any other value. Return `error` types to indicate an error occurred.

If a function can succeed or fail the `Result` type should be used.
This makes it very clear in the API contract that this function can fail and must be handled accordingly.
This then makes it easy to reason about how a function will behave instead of wondering where an error might be thrown.

In most cases `Result` should be combined with `error`. If a function fails it should return a result with an error.

In the event where something truly exceptional happens the `panic` function should be used.

## Do not use JavaScript's `Error` type.

`Error` implies `throw` and `try/catch` which should be avoided as described above.

### Prefer top level functions over static methods.

JavaScript allows top level functions therefore, static methods aren't as important as they are in languages that don't have top level functions.
In most cases it is better to have a top level method that is exported by a module, then to have a static method.

If static methods are required to scope functionality in a module, it might be a red flag that the functionality should be extracted into its own module.

### Top level functions should not use array syntax.

Always use the `function` keyword for top level syntax. Arrow functions should be limited to closures and anonymous functions.

### Document exports with JSDoc.

Every exported value should be well document. The documentation should be concise but explicit.

If possible use a single line for JSDoc.

Generally `@param` and `@returns` should not be used.
Function arguments and return values should be obvious from their intent or the description of the function.
If the arguments or return values are not obvious, it is likely a red flag that it is not a good API.

An occasional exception to this rule is arguments that have default values.
It can be useful to use `@param` to document what the default value is and how this affects the function.

### Follow Go best practices.

This standard library is heavily inspired by Go's standard library. It also uses a lot of Go's best practices.
When in doubt, follow Go conventions.
