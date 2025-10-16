# `createRouter`

Creates the main router that groups your endpoints and provides type-safe HTTP method handlers. The router automatically dispatches incoming requests to the correct endpoint based on the HTTP method and URL pattern.

## Signature

```ts
function createRouter<Endpoints extends RouteEndpoint[]>(endpoints: Endpoints, config?: RouterConfig): GetHttpHandlers<Endpoints>
```

## Parameters

| Parameter   | Type              | Description                                                 |
| ----------- | ----------------- | ----------------------------------------------------------- |
| `endpoints` | `RouteEndpoint[]` | Array of endpoints created with `createEndpoint`            |
| `config`    | `RouterConfig`    | Optional configuration for base path and global middlewares |

### RouterConfig

```ts
interface RouterConfig {
  basePath?: RoutePattern // Prefix for all routes
  middlewares?: MiddlewareFunction[] // Global middlewares
}
```

## Basic Usage

```ts
import { createRouter, createEndpoint } from "@aura-stack/router"

const getUsers = createEndpoint("GET", "/users", async (req, ctx) => {
  return Response.json({ users: [] })
})

const createUser = createEndpoint("POST", "/users", async (req, ctx) => {
  return Response.json({ id: "new-user" }, { status: 201 })
})

const router = createRouter([getUsers, createUser])

// Use the router handlers
const { GET, POST } = router
```

## Type Inference

The router provides powerful type inference based on your defined endpoints. Only HTTP methods actually used in your endpoints are available:

```ts
import { createRouter, createEndpoint } from "@aura-stack/router"

const oauth = createEndpoint("GET", "/auth/signin/:provider", async (req, ctx) => {
  const { provider } = ctx.params
  return Response.json({ provider })
})

const signIn = createEndpoint("POST", "/auth/credentials", async (req, ctx) => {
  return Response.json({ token: "jwt-token" })
})

// Type-safe destructuring - only GET and POST are available
const { GET, POST } = createRouter([oauth, signIn])

// ❌ TypeScript error - DELETE is not available
const { DELETE } = createRouter([oauth, signIn])
```

### Using Router Handlers

Each handler is a function that takes a `Request` and a `RequestContext`:

```ts
const router = createRouter([oauth, signIn])

// In your server
async function handleRequest(request: Request) {
  const url = new URL(request.url)

  if (request.method === "GET") {
    return router.GET(request, {})
  }

  if (request.method === "POST") {
    return router.POST(request, {})
  }

  return new Response("Method Not Allowed", { status: 405 })
}
```

### Extract All Methods at Once

```ts
const router = createRouter([getUsers, createUser, deleteUser])

// Get all available methods
export const { GET, POST, DELETE } = router

// Use in different framework adapters
export default {
  fetch: async (request: Request) => {
    switch (request.method) {
      case "GET":
        return GET(request, {})
      case "POST":
        return POST(request, {})
      case "DELETE":
        return DELETE(request, {})
      default:
        return new Response("Not Found", { status: 404 })
    }
  },
}
```

## Configuration Options

### Base Path

Add a prefix to all routes in the router. This is useful for API versioning or namespacing:

```ts
const router = createRouter([getUsers, createUser], {
  basePath: "/api/v1",
})

// Routes become:
// GET  /api/v1/users
// POST /api/v1/users
```

> **Important:** The `basePath` is prepended to all endpoint routes. When making requests, include the full path including the base.

**Example with different base paths:**

```ts
// Public API
const publicRouter = createRouter([...publicEndpoints], {
  basePath: "/api/v1/public",
})

// Admin API
const adminRouter = createRouter([...adminEndpoints], {
  basePath: "/api/v1/admin",
})

// Internal API
const internalRouter = createRouter([...internalEndpoints], {
  basePath: "/api/v1/internal",
})
```

### Global Middlewares

Global middlewares run before any endpoint-specific middleware and the route handler. They're executed for every request that matches an endpoint:

```ts
import { createRouter } from "@aura-stack/router"

const auditMiddleware = async (request, ctx) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${request.method} ${request.url}`)

  // Add request ID to all responses
  ctx.headers.set("x-request-id", crypto.randomUUID())

  return ctx
}

const corsMiddleware = async (request, ctx) => {
  ctx.headers.set("Access-Control-Allow-Origin", "*")
  ctx.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE")

  return ctx
}

const router = createRouter([...endpoints], {
  middlewares: [auditMiddleware, corsMiddleware],
})
```

## Middleware Execution Order

Middlewares execute in a specific order:

1. **Global middlewares** (from `createRouter` config)
2. **Endpoint middlewares** (from `createEndpointConfig`)
3. **Route handler** (the main endpoint function)

```ts
const endpointConfig = createEndpointConfig({
  middlewares: [
    async (req, ctx) => {
      console.log("2. Endpoint middleware")
      return ctx
    },
  ],
})

const endpoint = createEndpoint(
  "GET",
  "/test",
  async (req, ctx) => {
    console.log("3. Route handler")
    return Response.json({ ok: true })
  },
  endpointConfig
)

const router = createRouter([endpoint], {
  middlewares: [
    async (req, ctx) => {
      console.log("1. Global middleware")
      return ctx
    },
  ],
})
```

## Complete Examples

### REST API with Authentication

```ts
import { createRouter, createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { z } from "zod"

// Authentication middleware
const authMiddleware = async (req, ctx) => {
  const token = req.headers.get("authorization")

  if (!token || !token.startsWith("Bearer ")) {
    throw new Error("Unauthorized")
  }

  // Verify token and add user info
  ctx.headers.set("x-user-id", "user-123")
  return ctx
}

// Protected endpoint configuration
const protectedConfig = createEndpointConfig({
  middlewares: [authMiddleware],
})

// Public endpoints
const login = createEndpoint("POST", "/auth/login", async (req, ctx) => {
  return Response.json({ token: "jwt-token-here" })
})

const register = createEndpoint("POST", "/auth/register", async (req, ctx) => {
  return Response.json({ message: "User registered" }, { status: 201 })
})

// Protected endpoints
const getProfile = createEndpoint(
  "GET",
  "/profile",
  async (req, ctx) => {
    const userId = ctx.headers.get("x-user-id")
    return Response.json({ id: userId, name: "John Doe" })
  },
  protectedConfig
)

// Create router with global logging
const { GET, POST } = createRouter([login, register, getProfile], {
  basePath: "/api/v1",
  middlewares: [
    async (req, ctx) => {
      console.log(`[API] ${req.method} ${req.url}`)
      ctx.headers.set("x-api-version", "1.0")
      return ctx
    },
  ],
})
```

### Integration with Bun

```ts
import { createRouter } from "@aura-stack/router"

const { GET, POST, PUT, DELETE } = createRouter([...endpoints], {
  basePath: "/api",
})

Bun.serve({
  port: 3000,
  fetch: async (request) => {
    switch (request.method) {
      case "GET":
        return GET(request, {})
      case "POST":
        return POST(request, {})
      case "PUT":
        return PUT(request, {})
      case "DELETE":
        return DELETE(request, {})
      default:
        return new Response("Not Found", { status: 404 })
    }
  },
})
```

### Error Handling Pattern

```ts
const { GET, POST } = createRouter([...endpoints])

async function handleRequest(request: Request) {
  try {
    switch (request.method) {
      case "GET":
        return await GET(request, {})
      case "POST":
        return await POST(request, {})
      default:
        return new Response("Method Not Allowed", { status: 405 })
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Invalid")) {
        return Response.json({ error: error.message }, { status: 400 })
      }
      if (error.message === "Unauthorized") {
        return Response.json({ error: "Unauthorized" }, { status: 401 })
      }
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

## Route Matching

The router matches requests using this priority:

1. **Method matching** - Only endpoints with the correct HTTP method
2. **Pattern matching** - Routes matched via regex patterns
3. **First match wins** - Order matters for overlapping routes

```ts
// ✅ Specific routes before dynamic ones
const router = createRouter([createEndpoint("GET", "/users/me", handler), createEndpoint("GET", "/users/:id", handler)])
```

## 404 Responses

When no endpoint matches, the router returns:

```json
{ "message": "Not Found" }
```

Customize 404 handling in your server layer if needed.

## See Also

- [`createEndpoint`](./create-endpoint.md) - Define individual endpoints
- [Main README](../README.md) - Getting started guide
