import z from "zod"
import { describe, test } from "vitest"
import { createRouter } from "../src/router.js"
import { createEndpoint, createRoutePattern } from "../src/endpoint.js"
import type { HTTPMethod, RoutePattern } from "../src/types.js"

describe("createRoutePattern", () => {
    const testCases = [
        {
            description: "Converts route without parameters to regex",
            route: "/about",
            expected: /^\/about$/,
        },
        {
            description: "Converts root route to regex",
            route: "/",
            expected: /^\/$/,
        },
        {
            description: "Converts route with one parameter to regex",
            route: "/users/:userId/books",
            expected: /^\/users\/([^\\/]+)\/books$/,
        },
        {
            description: "Converts route with two parameters to regex",
            route: "/users/:userId/books/:bookId",
            expected: /^\/users\/([^\\/]+)\/books\/([^\\/]+)$/,
        },
    ]
    for (const { description, route, expected } of testCases) {
        test.concurrent(description, ({ expect }) => {
            const regex = createRoutePattern(route as RoutePattern)
            expect(regex).toEqual(expected)
        })
    }
})

describe("createEndpoint", () => {
    describe("With valid configuration", () => {
        const testCases = [
            {
                description: "Create GET endpoint with route",
                method: "GET",
                route: "/users/:userId",
                expected: {
                    method: "GET",
                    route: "/users/:userId",
                    config: {},
                },
            },
            {
                description: "Create POST endpoint with route",
                method: "POST",
                route: "/users",
                expected: {
                    method: "POST",
                    route: "/users",
                    config: {},
                },
            },
            {
                description: "Create DELETE endpoint with route",
                method: "DELETE",
                route: "/users/:userId",
                expected: {
                    method: "DELETE",
                    route: "/users/:userId",
                    config: {},
                },
            },
        ]

        for (const { description, method, route, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const handler: any = () => {}
                const endpoint = createEndpoint(method as HTTPMethod, route as Lowercase<RoutePattern>, handler)
                expect(endpoint).toEqual({ ...expected, handler })
            })
        }
    })

    describe("With invalid configuration", () => {
        const testCases = [
            {
                description: "Throws error for unsupported HTTP method",
                method: "FETCH",
                route: "/users",
                expected: /Unsupported HTTP method: FETCH/,
            },
        ]

        for (const { description, method, route, expected } of testCases) {
            test.concurrent(description, ({ expect }) => {
                const handler: any = () => {}
                expect(() => createEndpoint(method as HTTPMethod, route as Lowercase<RoutePattern>, handler, {})).toThrowError(
                    expected
                )
            })
        }
    })

    describe("With schemas", () => {
        describe("With body schema", () => {
            const endpoint = createEndpoint(
                "POST",
                "/auth/credentials",
                async (_, ctx) => {
                    return Response.json({ body: ctx.body })
                },
                {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                }
            )
            const { POST } = createRouter([endpoint])

            test("With valid body", async ({ expect }) => {
                const post = await POST(
                    new Request("https://example.com/auth/credentials", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: "John", password: "secret" }),
                    })
                )
                expect(post.ok).toBe(true)
                expect(await post.json()).toEqual({
                    body: { username: "John", password: "secret" },
                })
            })

            test("With invalid body", async ({ expect }) => {
                const post = await POST(
                    new Request("https://example.com/auth/credentials", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ username: "John" }),
                    })
                )
                expect(post.status).toBe(422)
                expect(await post.json()).toEqual({ message: "Invalid request body" })
                expect(post.statusText).toBe("UNPROCESSABLE_ENTITY")
            })
        })

        describe("With searchParams schema", () => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                async (_, ctx) => {
                    return Response.json({ searchParams: ctx.searchParams })
                },
                {
                    schemas: {
                        searchParams: z.object({
                            state: z.string(),
                            code: z.string(),
                        }),
                    },
                }
            )
            const { GET } = createRouter([endpoint])

            test("With valid searchParams", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/auth/google?state=123abc&code=123"))
                expect(get.ok).toBe(true)
                expect(await get.json()).toEqual({
                    searchParams: { state: "123abc", code: "123" },
                })
            })

            test("With invalid searchParams", async ({ expect }) => {
                const get = await GET(new Request("https://example.com/auth/google?state=123abc", { method: "GET" }))
                expect(await get.json()).toEqual({ message: "Invalid search parameters" })
                expect(get.status).toBe(422)
                expect(get.statusText).toBe("UNPROCESSABLE_ENTITY")
            })
        })
    })

    describe("With middlewares", () => {
        test("Update params context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                async (_, ctx) => {
                    const oauth = ctx.params.oauth
                    return Response.json({ oauth })
                },
                {
                    middlewares: [
                        async (_, ctx) => {
                            ctx.params = { oauth: "google" }
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/github"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({ oauth: "google" })
        })

        test("Update searchParams context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/google",
                async (_, ctx) => {
                    const searchParams = Object.fromEntries(ctx.searchParams.entries())
                    return Response.json({ searchParams })
                },
                {
                    middlewares: [
                        async (_, ctx) => {
                            ctx.searchParams.set("state", "123abc")
                            ctx.searchParams.set("code", "123")
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/google"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                searchParams: { state: "123abc", code: "123" },
            })
        })

        test("Update headers context in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/headers",
                async (_, ctx) => {
                    const headers = Object.fromEntries(ctx.headers.entries())
                    return Response.json({ headers })
                },
                {
                    middlewares: [
                        async (_, ctx) => {
                            ctx.headers.set("Authorization", "Bearer token")
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/headers"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                headers: { authorization: "Bearer token" },
            })
        })
    })

    describe("With schemas and middlewares", () => {
        test("Override body in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "POST",
                "/auth/credentials",
                async (_, ctx) => {
                    return Response.json({ body: ctx.body })
                },
                {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                    middlewares: [
                        async (_, ctx) => {
                            const body = ctx.body as any
                            body.userId = 12
                            return ctx
                        },
                    ],
                }
            )
            const { POST } = createRouter([endpoint])

            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: "John", password: "secret" }),
                })
            )
            expect(post.ok).toBe(true)
            expect(await post.json()).toEqual({
                body: { username: "John", password: "secret", userId: 12 },
            })
        })

        test("Override searchParams in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/google",
                async (_, ctx) => {
                    return Response.json({ searchParams: ctx.searchParams })
                },
                {
                    schemas: {
                        searchParams: z.object({
                            redirect_uri: z.string(),
                        }),
                    },
                    middlewares: [
                        async (_, ctx) => {
                            const searchParams = ctx.searchParams as any
                            searchParams.state = "123abc"
                            searchParams.code = "123"
                            return ctx
                        },
                    ],
                }
            )
            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/google?redirect_uri=https://app.com/callback"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                searchParams: {
                    state: "123abc",
                    code: "123",
                    redirect_uri: "https://app.com/callback",
                },
            })
        })

        test("Override params in middleware", async ({ expect }) => {
            const endpoint = createEndpoint(
                "GET",
                "/auth/:oauth",
                async (_, ctx) => {
                    return Response.json({ params: ctx.params })
                },
                {
                    schemas: {},
                    middlewares: [
                        async (_, ctx) => {
                            const params = ctx.params as any
                            params.oauth = "google"
                            return ctx
                        },
                    ],
                }
            )

            const { GET } = createRouter([endpoint])
            const get = await GET(new Request("https://example.com/auth/github"))
            expect(get.ok).toBe(true)
            expect(await get.json()).toEqual({
                params: { oauth: "google" },
            })
        })
    })
})
