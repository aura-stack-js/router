# Validation

Schema validation using Zod ensures type-safe request handling with automatic parsing and error handling.

## Overview

`@aura-stack/router` integrates seamlessly with Zod to validate:

- Request bodies
- Query parameters (search params)

When validation fails, an error is thrown automatically.

## Query Parameter Validation

### Basic Query Validation

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
    // ctx.searchParams is typed: { q: string; page: number }
    const { q, page } = ctx.searchParams

    return Response.json({ query: q, page, results: [] })
  },
  searchConfig
)
```

### Advanced Query Validation

```ts
const advancedSearchConfig = createEndpointConfig({
  schemas: {
    searchParams: z.object({
      q: z.string().min(3).max(100),
      category: z.enum(["tech", "science", "arts"]).optional(),
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sortBy: z.enum(["date", "relevance", "popularity"]).default("relevance"),
      sortOrder: z.enum(["asc", "desc"]).default("desc"),
    }),
  },
})
```

## Request Body Validation

### Basic Body Validation

```ts
const createUserConfig = createEndpointConfig({
  schemas: {
    body: z.object({
      name: z.string().min(1),
      email: z.string().email(),
    }),
  },
})

const createUser = createEndpoint(
  "POST",
  "/users",
  async (req, ctx) => {
    // ctx.body is typed: { name: string; email: string }
    const { name, email } = ctx.body

    return Response.json({ id: "new-id", name, email }, { status: 201 })
  },
  createUserConfig
)
```

### Complex Body Validation

```ts
const updateProfileConfig = createEndpointConfig({
  schemas: {
    body: z.object({
      profile: z.object({
        firstName: z.string().min(1),
        lastName: z.string().min(1),
        bio: z.string().max(500).optional(),
      }),
      settings: z.object({
        theme: z.enum(["light", "dark"]).default("light"),
        notifications: z.boolean().default(true),
        language: z.string().length(2).default("en"),
      }),
      tags: z.array(z.string()).min(1).max(10),
    }),
  },
})

const updateProfile = createEndpoint(
  "PATCH",
  "/profile",
  async (req, ctx) => {
    const { profile, settings, tags } = ctx.body
    // All fields are fully typed based on the schema

    return Response.json({ updated: true })
  },
  updateProfileConfig
)
```

## Combined Validation

Validate both body and query parameters in the same endpoint:

```ts
const createPostConfig = createEndpointConfig({
  schemas: {
    body: z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1),
      tags: z.array(z.string()).optional(),
    }),
    searchParams: z.object({
      publish: z.enum(["true", "false"]).default("false"),
      notify: z.enum(["true", "false"]).default("true"),
    }),
  },
})

const createPost = createEndpoint(
  "POST",
  "/posts",
  async (req, ctx) => {
    const { title, content, tags } = ctx.body
    const { publish, notify } = ctx.searchParams

    return Response.json(
      {
        id: "new-post",
        title,
        content,
        tags,
        published: publish === "true",
        notified: notify === "true",
      },
      { status: 201 }
    )
  },
  createPostConfig
)
```

## Validation with Route Parameters

Combine route params with validated schemas:

```ts
const updateUserConfig = createEndpointConfig("/users/:userId", {
  schemas: {
    body: z.object({
      name: z.string().optional(),
      email: z.string().email().optional(),
    }),
  },
  middlewares: [
    async (req, ctx) => {
      // ctx.params is typed: { userId: string }
      const { userId } = ctx.params
      console.log(`Updating user ${userId}`)
      return ctx
    },
  ],
})

const updateUser = createEndpoint(
  "PATCH",
  "/users/:userId",
  async (req, ctx) => {
    const { userId } = ctx.params
    const updates = ctx.body // Typed based on schema

    return Response.json({ id: userId, ...updates })
  },
  updateUserConfig
)
```

## Common Validation Patterns

### Email Validation

```ts
z.string().email()
```

### URL Validation

```ts
z.string().url()
```

### Enum Values

```ts
z.enum(["active", "inactive", "pending"])
```

### Optional Fields

```ts
z.string().optional()
z.string().nullable()
```

### Default Values

```ts
z.string().default("default-value")
z.number().default(0)
```

### Coercion (Query Params)

```ts
// Convert string to number
z.coerce.number()

// Convert string to boolean
z.coerce.boolean()

// Convert string to date
z.coerce.date()
```

### Array Validation

```ts
// Array of strings
z.array(z.string())

// Min/max length
z.array(z.string()).min(1).max(10)

// Non-empty array
z.array(z.string()).nonempty()
```

### Nested Objects

```ts
z.object({
  user: z.object({
    name: z.string(),
    email: z.string().email(),
  }),
  metadata: z.record(z.string()),
})
```

## Error Handling

Validation errors are automatically thrown with descriptive messages:

### Query Parameter Errors

```ts
// Request: GET /search?page=invalid
// Error: Invalid search parameters: Expected number, received string
```

### Body Validation Errors

```ts
// Request: POST /users with { email: "invalid" }
// Error: Invalid request body
```

### Custom Error Handling

```ts
const { POST } = createRouter([createUser])

async function handleRequest(request: Request) {
  try {
    return await POST(request, {})
  } catch (error) {
    if (error instanceof Error) {
      // Validation errors
      if (error.message.includes("Invalid")) {
        return Response.json(
          {
            error: "Validation failed",
            message: error.message,
          },
          { status: 400 }
        )
      }
    }

    return Response.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
```

## Best Practices

### 1. Use Descriptive Schemas

```ts
// ❌ Too loose
z.string()

// ✅ Specific validation
z.string().email().max(255)
```

### 2. Provide Default Values

```ts
const config = createEndpointConfig({
  schemas: {
    searchParams: z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(20),
      sort: z.enum(["asc", "desc"]).default("asc"),
    }),
  },
})
```

### 3. Use Coercion for Query Params

Query parameters are always strings, use coercion:

```ts
z.object({
  page: z.coerce.number(), // Converts "10" to 10
  active: z.coerce.boolean(), // Converts "true" to true
})
```

### 4. Reuse Schemas

```ts
const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const createConfig = createEndpointConfig({
  schemas: { body: userSchema },
})

const updateConfig = createEndpointConfig({
  schemas: { body: userSchema.partial() },
})
```

## See Also

- [Core Concepts](./core-concepts.md)
- [createEndpoint](./create-endpoint.md)
- [Middlewares](./middlewares.md)
