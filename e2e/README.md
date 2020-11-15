# End-to-end Tests

Basic end-to-end tests to verify the standard library works properly. These are all simple scripts that can be run with either `deno` or `node`.

These can be run by running `yarn e2e`.

### `smoke_deno.ts`

This tests two things:
1. There are no compile errors when importing the library into deno.
2. The import has no side effects that requires permissions.

In order for `2.` to be check this script must be run without any permissions, i.e. `deno run e2e smoke_deno.ts`.
