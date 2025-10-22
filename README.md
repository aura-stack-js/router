# `@aura-stack/router`

A modern, **TypeScript-first** router and endpoint definition library for Node.js.  
Build fully-typed APIs with declarative endpoints, automatic parameter inference, and first-class middleware support — all returning native `Response` objects for seamless compatibility with the Fetch API.

[![npm version](https://img.shields.io/npm/v/@aura-stack/router.svg)](https://www.npmjs.com/package/@aura-stack/router)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✨ **Type-safe routing** — Only configured HTTP methods are available at compile time  
🎯 **Declarative API** — Define endpoints using `createEndpoint` and group them with `createRouter`  
🔍 **Typed params & queries** — Automatic inference of path (`/users/:id`) and search parameters  
✅ **Schema validation** — Built-in support for `zod` to validate request bodies and query parameters  
⚡ **Middleware chaining** — Supports global and per-endpoint middleware execution  
🌐 **Fetch API compatible** — Works with Node.js 18+, Bun, Cloudflare Workers, and more

## Installation

```bash
pnpm add @aura-stack/router zod
# or
npm install @aura-stack/router zod
```

## Quick Start

```ts
import { createEndpoint, createRouter } from "@aura-stack/router"

// Define an endpoint
const getSession = createEndpoint("GET", "/auth/session", async (req, ctx) => {
  return Response.json({
    userId: ctx.params.userId,
    username: "john_doe",
  })
})

// Create and use the router
const { GET } = createRouter([getSession])

// In your server
const response = await GET(request, {})
```

## Documentation

- [Getting Started Guide](./web/src/content/docs/getting-started.mdx) - Installation and setup
- [Core Concepts](./web/src/content/docs/core-concepts.mdx) - Learn the fundamentals
- [API Reference](/web/src/content/docs) - Coming soon
  - [`createEndpoint`](./web/src/content/docs/create-endpoint.mdx) - Define endpoints
  - [`createEndpointConfig`](./web/src/content/docs/create-endpoint.mdx#using-createendpointconfig) - Configure endpoints
  - [`createRouter`](./web/src/content/docs/create-router.mdx) - Build routers
- [Validation](./web/src/content/docs/validation.mdx) - Schema validation with Zod
- [Middlewares](./web/src/content/docs/middlewares.mdx) - Global and endpoint middlewares
- [Examples](/web/src/content/docs) - Coming soon

## Basic Example

```ts
import { createEndpoint, createEndpointConfig, createRouter } from "@aura-stack/router"
import { z } from "zod"

// Define endpoint with validation
const createUserConfig = createEndpointConfig({
  schemas: {
    body: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
  },
})

const createUser = createEndpoint(
  "POST",
  "/users",
  async (req, ctx) => {
    const { name, email } = ctx.body // Fully typed!
    return Response.json({ id: "new-id", name, email }, { status: 201 })
  },
  createUserConfig
)

const getUser = createEndpoint("GET", "/users/:userId", async (req, ctx) => {
  const { userId } = ctx.params // Automatically typed
  return Response.json({ id: userId, name: "John" })
})

// Build router with type-safe methods
const { GET, POST } = createRouter([getUser, createUser], {
  basePath: "/api/v1",
})
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For detailed guidelines, see our [Contributing Guide](./CONTRIBUTING.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Learn More:**

- 📖 [Full Documentation](./docs/)
- 💡 [Examples & Recipes](./docs/examples.md)
- 🐛 [Report Issues](https://github.com/aura-stack-js/router/issues)
- 💬 [Discussions](https://github.com/aura-stack-js/router/discussions)
