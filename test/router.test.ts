import z from "zod"
import { describe, expect, expectTypeOf, test } from "vitest"
import { createRouter } from "../src/router.js"
import { createEndpoint, createEndpointConfig } from "../src/endpoint.js"

describe("createRouter", () => {
    describe("OAuth endpoints", () => {
        const signInConfig = createEndpointConfig("/auth/signin/:oauth", {
            schemas: {
                searchParams: z.object({
                    redirect_uri: z.string(),
                }),
            },
        })
        const sessionConfig = createEndpointConfig({
            middlewares: [
                async (_, ctx) => {
                    ctx.headers.set("session-token", "123abc-token")
                    return ctx
                },
            ],
        })

        const signIn = createEndpoint(
            "GET",
            "/auth/signin/:oauth",
            async () => {
                return Response.json({ message: "Redirect to OAuth provider" }, { status: 302 })
            },
            signInConfig
        )

        const callback = createEndpoint("GET", "/auth/callback", async () => {
            return Response.json({ message: "Handle OAuth callback" }, { status: 200 })
        })

        const session = createEndpoint(
            "GET",
            "/auth/session",
            async (_, ctx) => {
                const headers = ctx.headers
                return Response.json({ message: "Get user session" }, { status: 200, headers })
            },
            sessionConfig
        )

        const credentialsConfig = createEndpointConfig({
            schemas: {
                body: z.object({
                    username: z.string(),
                    password: z.string(),
                }),
            },
        })

        const credentials = createEndpoint(
            "POST",
            "/auth/credentials",
            async (_, ctx) => {
                const body = ctx.body
                return Response.json({ message: "Sign in with credentials", credentials: body }, { status: 200 })
            },
            credentialsConfig
        )

        const router = createRouter([signIn, callback, session, credentials])

        test("Callback handler", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/callback", { method: "GET" }))
            expect(get.status).toBe(200)
            expect(get.ok).toBeTruthy()
            expect(await get.json()).toEqual({ message: "Handle OAuth callback" })
        })

        test("Sign-in handler", async () => {
            const { GET } = router
            const get = await GET(
                new Request("https://example.com/auth/signin/google?redirect_uri=url_to_redirect", { method: "GET" })
            )
            expect(get.status).toBe(302)
            expect(await get.json()).toEqual({
                message: "Redirect to OAuth provider",
            })
        })

        test("Sign-in handler with missing search params", async () => {
            const { GET } = router
            const get = await GET(
                new Request("https://example.com/auth/signin/google", {
                    method: "GET",
                })
            )
            expect(get.status).toBe(422)
            expect(await get.json()).toEqual({ message: "Invalid search parameters" })
        })

        test("Sign-in handler with missing route param", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/signin?redirect_uri=url_to_redirect", { method: "GET" }))
            expect(get.status).toBe(404)
            expect(get.ok).toBeFalsy()
            expect(await get.json()).toEqual({ message: "Not Found" })
        })

        test("Session handler with middleware", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/auth/session", { method: "GET" }))
            expect(get.status).toBe(200)
            expect(get.ok).toBeTruthy()
            expect(await get.json()).toEqual({ message: "Get user session" })
            expect(get.headers.get("session-token")).toBe("123abc-token")
        })

        test("Credentials handler", async () => {
            const { POST } = router
            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: "John",
                        password: "secret",
                    }),
                })
            )
            expect(post.status).toBe(200)
            expect(post.ok).toBeTruthy()
            expect(await post.json()).toEqual({
                message: "Sign in with credentials",
                credentials: { username: "John", password: "secret" },
            })
        })

        test("Credentials handler with missing content-type", async () => {
            const { POST } = router
            const body = JSON.stringify({
                username: "John",
                password: "secret",
            })
            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    body,
                })
            )
            expect(post.status).toBe(200)
            expect(post.ok).toBeTruthy()
            expect(await post.json()).toEqual({
                message: "Sign in with credentials",
                credentials: body,
            })
        })

        test("Credentials handler with invalid body", async () => {
            const { POST } = router
            const post = await POST(
                new Request("https://example.com/auth/credentials", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        username: "John",
                    }),
                })
            )
            expect(await post.json()).toEqual({ message: "Invalid request body" })
            expect(post.status).toBe(422)
        })
    })

    describe("Invalid endpoints", () => {
        test("No HTTP handlers defined", async () => {
            const router = createRouter([])
            const cast = router as any
            expect(cast).not.toHaveProperty("POST")
            expect(cast).not.toHaveProperty("PUT")
        })

        test("No HTTP handlers defined but accessing GET", async () => {
            const get = createEndpoint("GET", "/session", async () => {
                return Response.json({ message: "Get user session" }, { status: 200 })
            })
            const router = createRouter([get])
            const cast = router as any
            expect(cast).not.toHaveProperty("POST")
            expect(cast).not.toHaveProperty("PUT")
            expect(cast.GET).toBeInstanceOf(Function)
            expect(router.GET).toBeInstanceOf(Function)
            expectTypeOf(router).toHaveProperty("GET")
            expectTypeOf(router).not.toHaveProperty("POST")
            expectTypeOf(router).not.toHaveProperty("PUT")
        })
    })

    describe("With base path", () => {
        const session = createEndpoint("GET", "/session", async () => {
            return Response.json({ message: "Get user session" }, { status: 200 })
        })

        const router = createRouter([session], { basePath: "/api/auth" })

        test("Session handler with base path", async () => {
            const { GET } = router
            const get = await GET(
                new Request("https://example.com/api/auth/session", {
                    method: "GET",
                })
            )
            expect(get.status).toBe(200)
            expect(get.ok).toBeTruthy()
            expect(await get.json()).toEqual({ message: "Get user session" })
        })

        test("Session handler with missing base path", async () => {
            const { GET } = router
            const get = await GET(new Request("https://example.com/session", { method: "GET" }))
            expect(get.status).toBe(404)
            expect(get.ok).toBeFalsy()
            expect(await get.json()).toEqual({ message: "Not Found" })
        })
    })

    describe("With global middlewares", () => {
        const session = createEndpoint("GET", "/session", async (_, ctx) => {
            return Response.json({ message: "Get user session" }, { status: 200, headers: ctx.headers })
        })

        const signIn = createEndpoint("POST", "/auth/:oauth", async (_, ctx) => {
            return Response.json({ message: "Sign in with OAuth" }, { status: 200, headers: ctx.headers })
        })

        describe("Add headers middleware", async () => {
            const router = createRouter([session, signIn], {
                middlewares: [
                    async (request) => {
                        request.headers.set("x-powered-by", "@aura-stack")
                        return request
                    },
                ],
            })
            const { GET, POST } = router

            test("Add header in GET request", async () => {
                const get = await GET(new Request("https://example.com/session", { method: "GET" }))
                expect(get.status).toBe(200)
                expect(get.ok).toBeTruthy()
                expect(get.headers.get("x-powered-by")).toBe("@aura-stack")
                expect(await get.json()).toEqual({ message: "Get user session" })
            })

            test("Add header in POST request", async () => {
                const post = await POST(new Request("https://example.com/auth/google", { method: "POST" }))
                expect(post.status).toBe(200)
                expect(post.ok).toBeTruthy()
                expect(post.headers.get("x-powered-by")).toBe("@aura-stack")
                expect(await post.json()).toEqual({ message: "Sign in with OAuth" })
            })
        })

        describe("Block request middleware", async () => {
            const router = createRouter([session], {
                middlewares: [
                    async (request) => {
                        if (!request.headers.get("authorization")) {
                            return new Response(JSON.stringify({ message: "Forbidden" }), {
                                status: 403,
                            })
                        }
                        return request
                    },
                ],
            })
            const { GET } = router

            test("Block request without authorization header", async () => {
                const get = await GET(new Request("https://example.com/session", { method: "GET" }))
                expect(get).toBeInstanceOf(Response)
                expect(get.status).toBe(403)
                expect(await get.json()).toEqual({ message: "Forbidden" })
            })
        })
    })
})
