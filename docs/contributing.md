# Contributing

Please read the [style guide](style_guide.md).

### Prerequesites

- [Node.js](https://nodejs.org/en/download/) - must be version 20+
- [pnpm](https://pnpm.io/installation)
- [Deno](https://deno.land/manual/getting_started/installation)

Install development dependencies:

```
pnpm install
```

Perform any additional required setup:

```
pnpm run setup
```

## Building

To build for all targets:

```
pnpm run build
```

To build only for node:

```
pnpm run build:node
```

To build only for deno:

```
pnpm run build:deno
```

## Testing

To run tests for all targets:

```
pnpm run test
```

To run only the node tests:

```
pnpm run test:node
```

To run only the deno tests:

```
pnpm run test:deno
```

To run e2e tests run:

```
pnpm run e2e
```

## Linting

To lint all files:

```
pnpm run lint
```

This uses [eslint](https://eslint.org) for all files except `test/deno` which uses [deno lint](https://deno.land/manual/tools/linter).

You can run only eslint by running:

```
pnpm run lint:node
```

Or only `deno lint`:

```
pnpm run lint:deno
```

## Formatting code

All code is formatted using [prettier](https://prettier.io).

```
pnpm run fmt
```
