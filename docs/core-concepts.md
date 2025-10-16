# Core Concepts

Understanding the fundamental concepts of `@aura-stack/router` will help you build type-safe APIs efficiently.

## Endpoints

Endpoints are the building blocks of your API. Each endpoint represents a single route with a specific HTTP method.

### Creating Endpoints

Use `createEndpoint` to define an endpoint:

```ts
import { createEndpoint } from "@aura-stack/router"

const getUser = createEndpoint(
  "GET", // HTTP method
  "/users/:userId", // Route pattern
  async (req, ctx) => {
    // Handler function
    const { userId } = ctx.params
    return Response.json({ id: userId, name: "John" })
  }
)
```

### Supported HTTP Methods

- `GET` - Retrieve resources
- `POST` - Create resources
- `PUT` - Replace resources
- `PATCH` - Update resources
- `DELETE` - Delete resources

## Route Patterns

Routes use a simple pattern syntax for dynamic segments:

### Static Routes

```ts
const endpoint = createEndpoint("GET", "/about", handler)
```

### Dynamic Parameters

Use `:paramName` to define dynamic segments:

```ts
// Single parameter
const getUser = createEndpoint("GET", "/users/:userId", handler)

// Multiple parameters
const getComment = createEndpoint("GET", "/posts/:postId/comments/:commentId", handler)
```

Parameters are automatically extracted and typed in `ctx.params`.

## Request Context

Every handler receives a `RequestContext` object with parsed request data:

```ts
interface RequestContext<RouteParams, Config> {
  params: RouteParams // Route parameters
  searchParams: URLSearchParams | ParsedObject // Query parameters
  body: unknown | ParsedObject // Request body
  headers: Headers // HTTP headers
}
```

### Accessing Context

```ts
const handler = async (req, ctx) => {
  // Route parameters
  const { userId } = ctx.params

  // Query parameters
  const page = ctx.searchParams.get("page")

  // Request body
  const data = ctx.body

  // Headers
  const auth = ctx.headers.get("authorization")

  return Response.json({ userId, page, data })
}
```

## Routers

Routers group endpoints and provide type-safe HTTP handlers.

### Creating Routers

```ts
import { createRouter } from "@aura-stack/router"

const router = createRouter([endpoint1, endpoint2, endpoint3])
```

### Type-Safe Method Extraction

Only methods used in your endpoints are available:

```ts
const getUser = createEndpoint("GET", "/users/:id", handler)
const createUser = createEndpoint("POST", "/users", handler)

// ✅ Only GET and POST are available
const { GET, POST } = createRouter([getUser, createUser])

// ❌ TypeScript error - DELETE not defined
const { DELETE } = createRouter([getUser, createUser])
```

## Router Configuration

### Base Path

Prefix all routes with a base path:

```ts
const router = createRouter([...endpoints], {
  basePath: "/api/v1",
})

// Routes become:
// /api/v1/users
// /api/v1/posts
```

### Global Middlewares

Apply middlewares to all endpoints:

```ts
const router = createRouter([...endpoints], {
  middlewares: [loggingMiddleware, authMiddleware],
})
```

## Response Handling

All handlers must return a standard `Response` object:

### JSON Responses

```ts
return Response.json({ data: "value" })
return Response.json({ error: "Not found" }, { status: 404 })
```

### Text Responses

```ts
return new Response("Hello, World!")
return new Response("Created", { status: 201 })
```

### Redirects

```ts
return Response.redirect("https://example.com")
return Response.redirect("/login", 302)
```

### Custom Headers

```ts
return Response.json(
  { data: "value" },
  {
    headers: {
      "Cache-Control": "max-age=3600",
      "X-Custom-Header": "value",
    },
  }
)
```

## Type Inference

The library provides automatic type inference throughout:

### Route Parameters

```ts
const endpoint = createEndpoint("GET", "/users/:userId/posts/:postId", async (req, ctx) => {
  // TypeScript knows params shape:
  // { userId: string; postId: string }
  const { userId, postId } = ctx.params
})
```

### Schema-Based Typing

When using Zod schemas, body and searchParams are fully typed:

```ts
import { z } from "zod"

const config = createEndpointConfig({
  schemas: {
    body: z.object({
      email: z.string().email(),
      age: z.number(),
    }),
  },
})

const endpoint = createEndpoint(
  "POST",
  "/users",
  async (req, ctx) => {
    // TypeScript knows: { email: string; age: number }
    const { email, age } = ctx.body
  },
  config
)
```

## Error Handling

Errors thrown in handlers should be caught in your server layer:

```ts
const { GET } = createRouter([...endpoints])

async function handleRequest(request: Request) {
  try {
    return await GET(request, {})
  } catch (error) {
    if (error instanceof Error) {
      return Response.json({ error: error.message }, { status: 500 })
    }
    return Response.json({ error: "Unknown error" }, { status: 500 })
  }
}
```

## Next Steps

- Learn about [Validation with Zod](./validation.md)
- Understand [Middlewares](./middlewares.md)
- Explore [Complete Examples](./examples.md)
- Read the [API Reference](./api-reference.md)
