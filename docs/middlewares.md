# Middlewares

Middlewares are functions that execute before your route handlers, allowing you to add cross-cutting concerns like authentication, logging, and request modification.

## Overview

Middlewares in `@aura-stack/router` can be applied at two levels:

1. **Global** - Applied to all endpoints in a router
2. **Endpoint-specific** - Applied to individual endpoints

## Middleware Function Signature

```ts
type MiddlewareFunction = (request: Request, ctx: RequestContext) => Promise<RequestContext>
```

Middlewares receive the request and context, and must return the (possibly modified) context.

## Endpoint Middlewares

Applied to specific endpoints using `createEndpointConfig`:

### Basic Example

```ts
import { createEndpointConfig } from "@aura-stack/router"

const config = createEndpointConfig({
  middlewares: [
    async (req, ctx) => {
      console.log(`Request to ${req.url}`)
      return ctx
    },
  ],
})

const endpoint = createEndpoint("GET", "/protected", handler, config)
```

### Authentication Middleware

```ts
const authConfig = createEndpointConfig({
  middlewares: [
    async (req, ctx) => {
      const token = req.headers.get("authorization")

      if (!token || !token.startsWith("Bearer ")) {
        throw new Error("Unauthorized")
      }

      // Verify token (simplified)
      const userId = verifyToken(token.slice(7))

      // Add user info to context
      ctx.headers.set("x-user-id", userId)

      return ctx
    },
  ],
})

const getProfile = createEndpoint(
  "GET",
  "/profile",
  async (req, ctx) => {
    const userId = ctx.headers.get("x-user-id")
    return Response.json({ userId, name: "John" })
  },
  authConfig
)
```

### Rate Limiting Middleware

```ts
const rateLimitMap = new Map<string, number>()

const rateLimitConfig = createEndpointConfig({
  middlewares: [
    async (req, ctx) => {
      const ip = req.headers.get("x-forwarded-for") || "unknown"
      const count = rateLimitMap.get(ip) || 0

      if (count > 100) {
        throw new Error("Rate limit exceeded")
      }

      rateLimitMap.set(ip, count + 1)
      ctx.headers.set("x-rate-limit-remaining", String(100 - count))

      return ctx
    },
  ],
})
```

## Global Middlewares

Applied to all endpoints in a router via `createRouter` config:

### Logging Middleware

```ts
const loggingMiddleware = async (req, ctx) => {
  const start = Date.now()
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)

  // You can't modify the response here, but you can add to context
  ctx.headers.set("x-request-time", start.toString())

  return ctx
}

const router = createRouter([...endpoints], {
  middlewares: [loggingMiddleware],
})
```

### CORS Middleware

```ts
const corsMiddleware = async (req, ctx) => {
  ctx.headers.set("Access-Control-Allow-Origin", "*")
  ctx.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
  ctx.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

  return ctx
}

const router = createRouter([...endpoints], {
  middlewares: [corsMiddleware],
})
```

### Request ID Middleware

```ts
const requestIdMiddleware = async (req, ctx) => {
  const requestId = req.headers.get("x-request-id") || crypto.randomUUID()
  ctx.headers.set("x-request-id", requestId)
  return ctx
}
```

## Middleware Chaining

Multiple middlewares execute in order:

```ts
const config = createEndpointConfig({
  middlewares: [
    // 1. First middleware - logging
    async (req, ctx) => {
      console.log("1. Logging request")
      return ctx
    },
    // 2. Second middleware - auth
    async (req, ctx) => {
      console.log("2. Checking auth")
      const token = req.headers.get("authorization")
      if (!token) throw new Error("Unauthorized")
      return ctx
    },
    // 3. Third middleware - add metadata
    async (req, ctx) => {
      console.log("3. Adding metadata")
      ctx.headers.set("x-processed", "true")
      return ctx
    },
  ],
})
```

## Execution Order

When both global and endpoint middlewares are defined:

```
1. Global middlewares (from createRouter)
   ↓
2. Endpoint middlewares (from createEndpointConfig)
   ↓
3. Route handler
```

### Example

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
    console.log("3. Handler")
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

// Output when request is made:
// 1. Global middleware
// 2. Endpoint middleware
// 3. Handler
```

## Typed Middlewares with Route Params

When using the two-argument form of `createEndpointConfig`, middlewares have access to typed route params:

```ts
const config = createEndpointConfig("/users/:userId", {
  middlewares: [
    async (req, ctx) => {
      // ctx.params is typed as { userId: string }
      const { userId } = ctx.params

      console.log(`Request for user ${userId}`)

      // Verify user exists
      const userExists = await checkUserExists(userId)
      if (!userExists) {
        throw new Error("User not found")
      }

      return ctx
    },
  ],
})

const getUser = createEndpoint(
  "GET",
  "/users/:userId",
  async (req, ctx) => {
    const { userId } = ctx.params
    return Response.json({ id: userId })
  },
  config
)
```

## Typed Middlewares with Schemas

Middlewares have access to validated body and searchParams:

```ts
import { z } from "zod"

const config = createEndpointConfig({
  schemas: {
    body: z.object({
      email: z.string().email(),
    }),
  },
  middlewares: [
    async (req, ctx) => {
      // ctx.body is typed as { email: string }
      const { email } = ctx.body

      // Check if email is already registered
      const exists = await emailExists(email)
      if (exists) {
        throw new Error("Email already registered")
      }

      return ctx
    },
  ],
})
```

## Common Patterns

### Authentication

```ts
const authMiddleware = async (req, ctx) => {
  const token = req.headers.get("authorization")?.replace("Bearer ", "")

  if (!token) {
    throw new Error("Unauthorized")
  }

  try {
    const payload = await verifyJWT(token)
    ctx.headers.set("x-user-id", payload.userId)
    ctx.headers.set("x-user-role", payload.role)
  } catch (error) {
    throw new Error("Invalid token")
  }

  return ctx
}
```

### Role-Based Access Control

```ts
const requireRole = (allowedRoles: string[]) => {
  return async (req: Request, ctx: RequestContext) => {
    const userRole = ctx.headers.get("x-user-role")

    if (!userRole || !allowedRoles.includes(userRole)) {
      throw new Error("Forbidden")
    }

    return ctx
  }
}

const adminConfig = createEndpointConfig({
  middlewares: [authMiddleware, requireRole(["admin"])],
})
```

### Request Validation

```ts
const validateContentType = (expectedType: string) => {
  return async (req: Request, ctx: RequestContext) => {
    const contentType = req.headers.get("content-type")

    if (!contentType?.includes(expectedType)) {
      throw new Error(`Expected ${expectedType}`)
    }

    return ctx
  }
}

const jsonConfig = createEndpointConfig({
  middlewares: [validateContentType("application/json")],
})
```

### Caching Headers

```ts
const cacheMiddleware = (maxAge: number) => {
  return async (req: Request, ctx: RequestContext) => {
    ctx.headers.set("Cache-Control", `public, max-age=${maxAge}`)
    return ctx
  }
}

const cachedConfig = createEndpointConfig({
  middlewares: [cacheMiddleware(3600)], // 1 hour
})
```

## Error Handling in Middlewares

When a middleware throws an error, the request stops processing:

```ts
const middleware = async (req, ctx) => {
  if (!isValid(req)) {
    throw new Error("Invalid request")
  }
  return ctx
}

// Handle in your server
try {
  return await router.GET(request, {})
} catch (error) {
  if (error instanceof Error) {
    return Response.json({ error: error.message }, { status: 400 })
  }
}
```

## Best Practices

### 1. Keep Middlewares Focused

Each middleware should do one thing:

```ts
// ✅ Good - single responsibility
const authMiddleware = async (req, ctx) => {
  /* ... */
}
const loggingMiddleware = async (req, ctx) => {
  /* ... */
}

// ❌ Bad - too much responsibility
const everythingMiddleware = async (req, ctx) => {
  // logging, auth, caching, etc...
}
```

### 2. Order Matters

Put authentication before authorization:

```ts
middlewares: [
  loggingMiddleware, // 1. Log first
  authMiddleware, // 2. Then authenticate
  rbacMiddleware, // 3. Then authorize
]
```

### 3. Use Headers for Context Passing

```ts
// ✅ Good - use headers
ctx.headers.set("x-user-id", userId)

// ❌ Bad - modifying request (immutable)
// req.userId = userId;
```

### 4. Return Modified Context

Always return the context:

```ts
// ✅ Good
const middleware = async (req, ctx) => {
  ctx.headers.set("x-custom", "value")
  return ctx
}

// ❌ Bad - forgot to return
const middleware = async (req, ctx) => {
  ctx.headers.set("x-custom", "value")
}
```

## See Also

- [Core Concepts](./core-concepts.md)
- [Validation](./validation.md)
- [createEndpoint](./create-endpoint.md)
- [createRouter](./create-router.md)
