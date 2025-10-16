# `createEndpoint`

Creates a type-safe API endpoint with automatic parameter inference, optional schema validation, and middleware support. This is the primary building block for defining routes in your application.

## Signature

```ts
function createEndpoint<Method extends HTTPMethod, Route extends RoutePattern, Schemas extends EndpointSchemas>(
  method: Method,
  route: Route,
  handler: RouteHandler<Route, { schemas: Schemas }>,
  config?: EndpointConfig<Route, Schemas>
): RouteEndpoint<Method, Route, {}>
```

## Parameters

| Parameter | Type                                                      | Description                                                        |
| --------- | --------------------------------------------------------- | ------------------------------------------------------------------ |
| `method`  | `"GET"` \| `"POST"` \| `"PUT"` \| `"PATCH"` \| `"DELETE"` | HTTP method for the endpoint                                       |
| `route`   | `RoutePattern`                                            | URL pattern with optional dynamic segments (e.g., `/users/:id`)    |
| `handler` | `RouteHandler`                                            | Async function that processes the request and returns a `Response` |
| `config`  | `EndpointConfig`                                          | Optional configuration for schemas and middlewares                 |

## Basic Usage

```ts
import { createEndpoint } from "@aura-stack/router"

const getSession = createEndpoint("GET", "/auth/session", async (request, ctx) => {
  return Response.json({
    session: {
      userId: "uuid-123",
      username: "john_doe",
    },
  })
})
```

> **Note:** Only `GET`, `POST`, `PUT`, `PATCH`, and `DELETE` methods are supported. Using other HTTP methods will result in TypeScript errors.

## Request Context

Every route handler receives a `RequestContext` object as the second parameter. This context provides parsed and typed access to request data:

```ts
interface RequestContext<RouteParams, Config> {
  params: RouteParams // Route parameters
  searchParams: URLSearchParams // Query string (or typed object with schema)
  body: unknown // Request body (or typed object with schema)
  headers: Headers // Request headers
}
```

### Route Parameters (`ctx.params`)

Dynamic segments in your route pattern are automatically extracted and typed:

```ts
// Single parameter
const getUser = createEndpoint("GET", "/users/:userId", async (req, ctx) => {
  const { userId } = ctx.params // TypeScript knows userId exists
  return Response.json({ id: userId })
})

// Multiple parameters
const getBookmark = createEndpoint("GET", "/users/:userId/books/:bookId", async (req, ctx) => {
  const { userId, bookId } = ctx.params // Both are typed as string
  return Response.json({ userId, bookId })
})
```

### Search Parameters (`ctx.searchParams`)

Query string parameters are available through `ctx.searchParams`:

**Without schema** (returns `URLSearchParams`):

```ts
const searchUsers = createEndpoint("GET", "/users/search", async (req, ctx) => {
  const query = ctx.searchParams.get("q")
  const page = ctx.searchParams.get("page")

  return Response.json({ query, page })
})
```

**With Zod schema** (returns typed object):

```ts
import { createEndpointConfig } from "@aura-stack/router"
import { z } from "zod"

const searchConfig = createEndpointConfig({
  schemas: {
    searchParams: z.object({
      q: z.string().min(1),
      page: z.coerce.number().int().positive().default(1),
    }),
  },
})

const searchUsers = createEndpoint(
  "GET",
  "/users/search",
  async (req, ctx) => {
    // ctx.searchParams is typed as { q: string; page: number }
    const { q, page } = ctx.searchParams
    return Response.json({ query: q, page })
  },
  searchConfig
)
```

### Request Body (`ctx.body`)

For `POST`, `PUT`, and `PATCH` requests, the body is parsed and available in the context:

**Without schema** (type: `unknown`):

```ts
const createPost = createEndpoint("POST", "/posts", async (req, ctx) => {
  const body = ctx.body // Type: unknown
  return Response.json({ data: body })
})
```

**With Zod schema** (returns typed object):

```ts
const createPostConfig = createEndpointConfig({
  schemas: {
    body: z.object({
      title: z.string().min(1),
      content: z.string(),
      tags: z.array(z.string()).optional(),
    }),
  },
})

const createPost = createEndpoint(
  "POST",
  "/posts",
  async (req, ctx) => {
    // ctx.body is typed as { title: string; content: string; tags?: string[] }
    const { title, content, tags } = ctx.body

    return Response.json({ id: "new-post", title, content, tags }, { status: 201 })
  },
  createPostConfig
)
```

### Headers (`ctx.headers`)

Access and modify request headers using the standard `Headers` interface:

```ts
const protectedEndpoint = createEndpoint("GET", "/protected", async (req, ctx) => {
  const authHeader = ctx.headers.get("authorization")

  // Modify headers
  ctx.headers.set("x-processed-by", "api")

  return Response.json({ authenticated: !!authHeader }, { headers: ctx.headers })
})
```

## Advanced Configuration

The fourth parameter of `createEndpoint` accepts an optional configuration object that enables schema validation and middleware execution. Use `createEndpointConfig` for better type inference.

### Validation Schemas

Add Zod schemas to validate and type request data:

```ts
import { createEndpointConfig } from "@aura-stack/router"
import { z } from "zod"

const config = createEndpointConfig({
  schemas: {
    body: z.object({
      email: z.string().email(),
      password: z.string().min(8),
    }),
    searchParams: z.object({
      redirect: z.string().url().optional(),
    }),
  },
})

const signIn = createEndpoint(
  "POST",
  "/auth/signin",
  async (req, ctx) => {
    // Both body and searchParams are fully typed!
    const { email, password } = ctx.body
    const { redirect } = ctx.searchParams

    return Response.json({ token: "jwt-token" })
  },
  config
)
```

### Endpoint Middlewares

Middlewares execute before the route handler and have access to the parsed context:

```ts
const protectedConfig = createEndpointConfig({
  middlewares: [
    // Authentication middleware
    async (req, ctx) => {
      const token = req.headers.get("authorization")

      if (!token) {
        throw new Error("Unauthorized")
      }

      // Add user info to headers for the handler
      ctx.headers.set("x-user-id", "user-123")
      return ctx
    },
  ],
})

const getProfile = createEndpoint(
  "GET",
  "/profile",
  async (req, ctx) => {
    const userId = ctx.headers.get("x-user-id")
    return Response.json({ userId })
  },
  protectedConfig
)
```

### Multiple Middlewares

Chain multiple middlewares for complex logic:

```ts
const config = createEndpointConfig({
  middlewares: [
    // Logging
    async (req, ctx) => {
      console.log(`Request to ${req.url}`)
      return ctx
    },
    // Rate limiting
    async (req, ctx) => {
      // Check rate limit logic
      ctx.headers.set("x-rate-limit", "100")
      return ctx
    },
    // Authentication
    async (req, ctx) => {
      const token = req.headers.get("authorization")
      if (!token) throw new Error("Unauthorized")
      return ctx
    },
  ],
})
```

## Using `createEndpointConfig`

The `createEndpointConfig` helper provides two overloads for better type inference:

### Overload 1: Config Only

When you only pass a configuration object, route params default to an empty object:

```ts
const config = createEndpointConfig({
  schemas: {
    body: z.object({ name: z.string() }),
  },
  middlewares: [
    /* ... */
  ],
})

// Use with any endpoint
const endpoint = createEndpoint("POST", "/users", handler, config)
```

### Overload 2: Route + Config

Pass the route pattern first to get typed params in your middlewares:

```ts
const config = createEndpointConfig("/users/:userId", {
  middlewares: [
    async (req, ctx) => {
      // ctx.params is typed as { userId: string }
      const { userId } = ctx.params
      console.log(`Processing request for user ${userId}`)
      return ctx
    },
  ],
})

const endpoint = createEndpoint(
  "GET",
  "/users/:userId",
  async (req, ctx) => {
    const { userId } = ctx.params
    return Response.json({ id: userId })
  },
  config
)
```

## Complete Example

Here's a comprehensive example combining all features:

```ts
import { createEndpoint, createEndpointConfig } from "@aura-stack/router"
import { z } from "zod"

// Define configuration with route for typed params in middleware
const updateUserConfig = createEndpointConfig("/users/:userId", {
  schemas: {
    body: z.object({
      name: z.string().min(1).optional(),
      email: z.string().email().optional(),
      age: z.number().int().positive().optional(),
    }),
    searchParams: z.object({
      notify: z.enum(["true", "false"]).default("true"),
    }),
  },
  middlewares: [
    // Authorization
    async (req, ctx) => {
      const authUser = req.headers.get("x-user-id")
      const { userId } = ctx.params

      if (authUser !== userId) {
        throw new Error("Forbidden")
      }

      return ctx
    },
    // Audit logging
    async (req, ctx) => {
      console.log(`User ${ctx.params.userId} is updating their profile`)
      return ctx
    },
  ],
})

const updateUser = createEndpoint(
  "PATCH",
  "/users/:userId",
  async (req, ctx) => {
    const { userId } = ctx.params
    const updates = ctx.body
    const { notify } = ctx.searchParams

    // Apply updates...

    return Response.json({
      id: userId,
      ...updates,
      notified: notify === "true",
    })
  },
  updateUserConfig
)
```

## Error Handling

Validation errors are thrown automatically when schemas don't match:

```ts
// If request body doesn't match schema:
// Error: Invalid request body

// If search params don't match schema:
// Error: Invalid search parameters: <details>
```

Handle errors in your server implementation:

```ts
const { PATCH } = createRouter([updateUser])

async function handleRequest(request: Request) {
  try {
    return await PATCH(request, {})
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 400 })
    }
    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

## See Also

- [`createRouter`](./create-router.md) - Group endpoints into a router
- [Main README](../README.md) - Getting started guide
