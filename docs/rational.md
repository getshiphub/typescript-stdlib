# Rational

## Why?

The main inspiration for this has been Go's standard library which is extremely rich and contains a lot of useful functionality.
Because of this there isn't nearly as frequently a need to reach for 3rd party libraries to accomplish tasks as there is when using JavaScript.
When a third party library is needed, it is for something non-trival and contains a lot of functionality.
Examples are `cobra`(https://github.com/spf13/cobra) for building CLIs or the [Docker Go SDK](https://github.com/moby/moby/tree/master/client).
As a result the package explosion that is often common in the node ecosystem doesn't occur.

After working with Go so much, we became more and more frustrated with npm and `node_modules`. Specifically the culture around having tons of small packages and preferring to `npm install` to get 2 lines of code instead of writing it yourself. We got tired of `node_modules` always exploding and becoming massive, and `yarn.lock` having thousands of lines for all the transitive dependencies.

`ts-stdlib` is an attempted solution to this problem by bringing the Go mentality to node. This library has **zero** dependencies and provides a rich set of core functionality that can be used for a wide variety of tasks. The goal is to add this one dependency instead of installing a multitude of small packages.

This is also largly inspired by [deno](https://deno.land/) as it is copying a lot of what Go does great (in our opinion) and has its own standard library.

Since this was so heavily inspired by Go, a lot of the APIs provided by this library are ported from the Go standard library.

## Doesn't Deno already have a standard library?

Yes it does and this is one of the many great things about deno, and was a huge inspiration for this (a desire to bring that to node).

However, as this library developed it become clear that a lot of the functionality in here was orthogonal.

For example, a core part of this library is the way error handling is done through the use of the `Result` type and `error` interface.
This was primarily inspired by Go's error handling model, but also through the error handling models of Swift and Rust.
The deno standard library uses normal JavaScript errors through the use of `throw` and `try/catch`.

We realized it would be valiable to have this functionality available to deno as well, not just node.
The library is meant to be used alongside deno's standard library, not compete with it.
