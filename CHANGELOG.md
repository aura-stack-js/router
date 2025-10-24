# CHANGELOG

All notable changes to this project will be documented in this file.

This changelog follows the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format and reflects changes across the entire monorepo.  
Per-package version history is maintained inside each package’s own `CHANGELOG.md`.

---

## [Unreleased]

---

## [0.2.0] - 2025-10-23

### Changed

- Router now only exposes HTTP handlers that are defined via `createRouter`. Undefined HTTP handlers are not exposed, preventing TypeScript errors when accessing non-existent methods. [#8](https://github.com/aura-stack-js/router/pull/8)

- Removed the second `context` argument from the HTTP handler functions returned by `createRouter`. Handlers now accept a single `Request` parameter and return a `Response`. [#6](https://github.com/aura-stack-js/router/pull/6)

---

## [0.1.0] - 2025-10-08

### Added

- Added standardized error responses for unexpected errors thrown within core functions. These responses include detailed information such as `statusCode`, `statusText`, and a descriptive `message``. [#4](https://github.com/aura-stack-js/router/pull/4)

- Added support for middlewares in route handlers via `createEndpoint.config.middlewares` or `createEndpointConfig.middlewares`. Middlewares receive Zod schemas defined in `createEndpoint.config.schemas` for `body` and `searchParams`, providing inferred types in the context for router handlers and global middlewares in `createRouter` functions. [#2](https://github.com/aura-stack-js/router/pull/2)

- Introduced core modules for the package, including `createRouter` to create the main router, `createEndpoint` to define endpoints within the router, and `createEndpointConfig` to define config options for `createEndpoint`. [#1](https://github.com/aura-stack-js/router/pull/1)
