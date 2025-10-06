# `@aura-stack/router`

A modern, **TypeScript-first** router and endpoint definition library for Node.js.  
Build fully-typed APIs with declarative endpoints, automatic parameter inference, and first-class middleware support — all returning native `Response` objects for seamless compatibility with the Fetch API.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Defining Endpoints](#defining-endpoints)
- [Validation & Middlewares](#validation--middlewares)
- [API Reference](#api-reference)

## Features

- `Type-safe routing` — only configured HTTP methods are available at compile time.
- `Declarative API` — define endpoints using `createEndpoint` and group them with `createRouter`.
- `Typed params & queries` — automatic inference of path (`/users/:id`) and search parameters.
- `Schema validation` — built-in support for `zod` to validate request bodies, queries, or params.
- `Middleware chaining` — supports global and per-endpoint middleware execution, with short-circuit control.

## Installation

```bash
pnpm add @aura-stack/router
# or
npm install @aura-stack/router
# or
yarn add @aura-stack/router
```

## Quick Start

```ts
import { createEndpoint, createRouter } from "@aura-stack/router";

const session = createEndpoint("GET", "/auth/session", async (_, ctx) => {
  return Response.json(
    {
      session: {
        userId: "uuid",
        username: "John",
      },
    },
    { headers: ctx.headers },
  );
});

const { GET } = createRouter([session]);
```

## Defining Endpoints

```ts
import { z } from "zod";
import { createEndpoint, createEndpointConfig } from "@aura-stack/router";

const credentialsConfig = createEndpointConfig({
  schemas: {
    body: z.object({
      username: z.string(),
      password: z.string(),
    }),
  },
});

export const signIn = createEndpoint(
  "POST",
  "/auth/credentials",
  async (request, ctx) => {
    const { body, headers } = ctx;
    headers.set("x-login", "success");
    return Response.json({ status: "ok", body }, { headers });
  },
  credentialsConfig,
);
```

## Validation & Middlewares

**Validation.** Provide Zod schemas in `createEndpointConfig`:

```ts
import { createEndpoint, createEndpointConfig } from "@aura-stack/router";

const config = createEndpointConfig({
  schemas: {
    searchParams: z.object({
      redirect_uri: z.string(),
    }),
  },
});

const oauth = createEndpoint(
  "GET",
  "/auth/signin/:provider",
  async (_req, ctx) => {
    const { provider } = ctx.params;
    const { redirect_uri } = ctx.searchParams;
    return Response.json({ provider, redirect_uri }, { status: 302 });
  },
  config,
);
```

If validation fails, the helper throws an informative error before your handler executes.

**Middlewares.** Provide async middleware functions to read or modify the request.

```ts
import { createRouter, type GlobalMiddleware } from "@aura-stack/router";

const audit: GlobalMiddleware = async (request) => {
  request.headers.set("x-request-id", crypto.randomUUID());
  return request;
};

const router = createRouter([oauth], { middlewares: [audit] });
```

## API Reference

| Function                                          | Description                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `createEndpoint(method, route, handler, config?)` | Define a type-safe endpoint with optional validation and middlewares.      |
| `createEndpointConfig(config)`                    | Helper that preserves Zod inference for endpoint schemas.                  |
| `createRouter(endpoints, config?)`                | Build a router that dispatches native Fetch requests to the right handler. |
