# Getting Started

This guide will help you install and set up `@aura-stack/router` in your project.

## Prerequisites

- Node.js 18+ or any runtime with Fetch API support (Bun, Deno, Cloudflare Workers)
- TypeScript 5.0+ (recommended for full type inference)

## Installation

Install the package and its peer dependency:

```bash
pnpm add @aura-stack/router zod
```

Or using npm:

```bash
npm install @aura-stack/router zod
```

Or using yarn:

```bash
yarn add @aura-stack/router zod
```

> **Note:** `zod` is a peer dependency required for schema validation features.

## Your First Endpoint

Create a simple endpoint:

```ts
import { createEndpoint } from "@aura-stack/router"

const hello = createEndpoint("GET", "/hello", async (req, ctx) => {
  return Response.json({ message: "Hello, World!" })
})
```

## Creating a Router

Group your endpoints into a router:

```ts
import { createRouter } from "@aura-stack/router"

const { GET } = createRouter([hello])
```

## Integration with Your Server

### Bun

```ts
import { createRouter, createEndpoint } from "@aura-stack/router"

const hello = createEndpoint("GET", "/hello", async (req, ctx) => {
  return Response.json({ message: "Hello from Bun!" })
})

const { GET } = createRouter([hello])

Bun.serve({
  port: 3000,
  fetch: async (request) => {
    if (request.method === "GET") {
      return GET(request, {})
    }
    return new Response("Not Found", { status: 404 })
  },
})

console.log("Server running on http://localhost:3000")
```

### Node.js (with native fetch)

```ts
import { createServer } from "node:http"
import { createRouter, createEndpoint } from "@aura-stack/router"

const hello = createEndpoint("GET", "/hello", async (req, ctx) => {
  return Response.json({ message: "Hello from Node.js!" })
})

const { GET } = createRouter([hello])

createServer(async (req, res) => {
  const request = new Request(`http://localhost:3000${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
  })

  let response
  if (req.method === "GET") {
    response = await GET(request, {})
  } else {
    response = new Response("Method Not Allowed", { status: 405 })
  }

  res.statusCode = response.status
  response.headers.forEach((value, key) => {
    res.setHeader(key, value)
  })
  res.end(await response.text())
}).listen(3000)

console.log("Server running on http://localhost:3000")
```

### Cloudflare Workers

```ts
import { createRouter, createEndpoint } from "@aura-stack/router"

const hello = createEndpoint("GET", "/hello", async (req, ctx) => {
  return Response.json({ message: "Hello from Cloudflare!" })
})

const { GET } = createRouter([hello])

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (request.method === "GET") {
      return GET(request, {})
    }
    return new Response("Method Not Allowed", { status: 405 })
  },
}
```

## Next Steps

- Learn about [Core Concepts](./core-concepts.md)
- Explore [Validation with Zod](./validation.md)
- Understand [Middlewares](./middlewares.md)
- See [Complete Examples](./examples.md)
