# Contributing

Please read the [style guide](style_guide.md).

### Prerequesites

- [Node.js](https://nodejs.org/en/download/) - must be a supported LTS version
- [Yarn 1](https://classic.yarnpkg.com/en/docs/install)
- [Deno](https://deno.land/manual/getting_started/installation)

Install development dependencies:

```
yarn install
```

Perform any additional required setup:

```
yarn setup
```

## Building

To build for all targets:

```
yarn build
```

To build only for node:

```
yarn build:node
```

To build only for deno:

```
yarn build:deno
```

## Testing

To run tests for all targets:

```
yarn test
```

To run only the node tests:

```
yarn test:node
```

To run only the deno tests:

```
yarn test:deno
```

To run e2e tests run:

```
yarn e2e
```

## Linting

To lint all files:

```
yarn lint
```

This uses [eslint](https://eslint.org) for all files except `test/deno` which uses [deno lint](https://deno.land/manual/tools/linter).

You can run only eslint by running:

```
yarn lint:node
```

Or only `deno lint`:

```
yarn lint:deno
```

## Formatting code

All code is formatted using [prettier](https://prettier.io).

```
yarn fmt
```
