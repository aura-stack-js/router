# `@aura-stack/router`

A lightweight, `TypeScript-first` router / endpoint library for modern NodeJs. Defines endpoints with full type safety (params, query, body), supports middleware chaining, and returns `Response` objects in the fetch-compatible style.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Defining Endpoints](#defining-endpoints)
- [Validation & Middlewares](#validation--middlewares)
- [API Reference](#api-reference)

## Features

- `Type-safe routing`: only configured HTTP methods are exposed.
- `Declarative`: `createEndpoint` & `createRouter` helpers with full TypeScript inference.
- `Params`: parse path parameters (`/users/:id`) with correct types.
- `Optional`: Zod validation for request bodies and search parameters.
- `Middlewares`: global and per-route middlewares, with short-circuiting.

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

const session = createEndpoint("GET", "/auth/session", async (_req, ctx) => {
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
const config = createEndpointConfig({
  schemas: {
    searchParams: z.object({
      redirect_uri: z.string().url(),
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

**Middlewares.** Supply async middleware functions that can read/augment the context:

```ts
const audit: MiddlewareFunction = async (request, ctx) => {
  ctx.headers.set("x-request-id", crypto.randomUUID());
  return ctx;
};

const router = createRouter([oauth], { middlewares: [audit] });
```

## API Reference

| Function                                          | Description                                                                |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| `createEndpoint(method, route, handler, config?)` | Define a type-safe endpoint with optional validation and middlewares.      |
| `createEndpointConfig(config)`                    | Helper that preserves Zod inference for endpoint schemas.                  |
| `createRouter(endpoints, config?)`                | Build a router that dispatches native Fetch requests to the right handler. |
