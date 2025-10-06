import z from "zod"
import { describe, expectTypeOf, test } from "vitest"
import { getRouteParams, getSearchParams, getHeaders, getBody } from "../src/context.js"
import type { RoutePattern } from "../src/types.js"

describe("getRouteParams", () => {
    const testCases = [
        {
            description: "Empty route and path",
            route: "",
            path: "",
            expected: {},
        },
        {
            description: "Extracts only userId from the path",
            route: "/users/:userId/books",
            path: "/users/123/books",
            expected: {
                userId: "123",
            },
        },
        {
            description: "Extracts userId and bookId from the path",
            route: "/users/:userId/books/:bookId",
            path: "/users/123/books/456",
            expected: {
                userId: "123",
                bookId: "456",
            },
        },
        {
            description: "No parameters in the route",
            route: "/about",
            path: "/about",
            expected: {},
        },
        {
            description: "Mismatched route and path",
            route: "/users/:userId/books",
            path: "/users/123/books/456",
            expected: {},
        },
        {
            description: "Mismatched with path with extra segments",
            route: "/users/:userId",
            path: "/users/123/books",
            expected: {},
        },
        {
            description: "Mismatched with path with missing segments",
            route: "/users/:userId/books/:bookId",
            path: "/users/123/books",
            expected: {},
        },
        {
            description: "Parameters with special characters",
            route: "/search/:query",
            path: "/search/hello%20world",
            expected: {
                query: "hello world",
            },
        },
    ]

    testCases.forEach(({ description, route, path, expected }) => {
        test.concurrent(description, ({ expect }) => {
            expect(getRouteParams(route as RoutePattern, path)).toEqual(expected)
        })
    })
})

describe("getSearchParams", () => {
    describe("Without schema validation", () => {
        const testCases = [
            {
                description: "No search parameters",
                url: "http://example.com",
                config: {},
                expected: {},
            },
            {
                description: "Single search parameter",
                url: "http://example.com?name=John",
                config: {},
                expected: { name: "John" },
            },
            {
                description: "Multiple search parameters",
                url: "http://example.com?name=John&age=30",
                config: {},
                expected: { name: "John", age: "30" },
            },
            {
                description: "Encoded search parameters",
                url: "http://example.com?query=hello%20world",
                config: {},
                expected: { query: "hello world" },
            },
        ]

        testCases.forEach(({ description, url, config, expected }) => {
            test.concurrent(description, ({ expect }) => {
                const searchParams = getSearchParams(url, config)
                expect(searchParams instanceof URLSearchParams).toBe(true)
                expect(searchParams).toBeDefined()
                expect(searchParams).toBeInstanceOf(URLSearchParams)
                expect(searchParams).toEqual(new URLSearchParams(expected as Record<string, string>))
                expect(searchParams).not.toEqual(expected)
            })
        })

        test("Check return type is URLSearchParams", () => {
            const withoutParams = {
                url: "http://example.com",
                config: { schemas: {} },
            }
            expectTypeOf(getSearchParams(withoutParams.url, withoutParams.config)).toEqualTypeOf<URLSearchParams>()
        })
    })

    describe("With schema validation", () => {
        const testCases = [
            {
                description: "No search parameters",
                url: "http://example.com",
                config: {
                    schemas: {
                        searchParams: z.object({}),
                    },
                },
                expected: {},
            },
            {
                description: "Single search parameter",
                url: "http://example.com?name=John",
                config: {
                    schemas: {
                        searchParams: z.object({
                            name: z.string(),
                        }),
                    },
                },
                expected: {
                    name: "John",
                },
            },
            {
                description: "Multiple search parameters",
                url: "http://example.com?name=John&age=30",
                config: {
                    schemas: {
                        searchParams: z.object({
                            name: z.string(),
                            age: z.string(),
                        }),
                    },
                },
                expected: {
                    name: "John",
                    age: "30",
                },
            },
            {
                description: "Encoded search parameters",
                url: "http://example.com?query=hello%20world",
                config: {
                    schemas: {
                        searchParams: z.object({
                            query: z.string(),
                        }),
                    },
                },
                expected: {
                    query: "hello world",
                },
            },
            {
                description: "Extra unexpected search parameter",
                url: "http://example.com?name=John&age=30",
                config: {
                    schemas: {
                        searchParams: z.object({
                            name: z.string(),
                        }),
                    },
                },
                expected: {
                    name: "John",
                },
            },
            {
                description: "Without schema definition",
                url: "http://example.com?name=John",
                config: {
                    schemas: {
                        searchParams: z.object({}),
                    },
                },
                expected: {},
            },
        ]
        testCases.forEach(({ description, url, config, expected }) => {
            test.concurrent(description, ({ expect }) => {
                const searchParams = getSearchParams(url, config)
                expect(searchParams instanceof Object).toBe(true)
                expect(searchParams).toBeDefined()
                expect(searchParams).toBeInstanceOf(Object)
                expect(searchParams).toEqual(expected)
                expect(searchParams).not.toBeInstanceOf(URLSearchParams)
            })
        })
    })

    describe("With invalid parameters", () => {
        const testCases = [
            {
                description: "Invalid search parameters",
                url: "http://example.com?age=thirty",
                config: {
                    schemas: {
                        searchParams: z.object({
                            age: z.number(),
                        }),
                    },
                },
                expected: /Invalid search parameters/,
            },
            {
                description: "Missing required search parameter",
                url: "http://example.com",
                config: {
                    schemas: {
                        searchParams: z.object({
                            name: z.string(),
                        }),
                    },
                },
                expected: /Invalid search parameters/,
            },
            {
                description: "Invalid type for search parameter",
                url: "http://example.com?isAdmin=notABoolean",
                config: {
                    schemas: {
                        searchParams: z.object({
                            isAdmin: z.boolean(),
                        }),
                    },
                },
                expected: /Invalid search parameters*/,
            },
        ]

        testCases.forEach(({ description, url, config, expected }) => {
            test.concurrent(description, ({ expect }) => {
                expect(() => getSearchParams(url, config)).toThrowError(expected)
            })
        })

        describe("Check return type is Object", () => {
            test("No search params", () => {
                const withoutParams = {
                    url: "http://example.com?name=John",
                    config: {
                        schemas: {
                            searchParams: z.object({
                                name: z.string(),
                            }),
                        },
                    },
                }
                expectTypeOf(getSearchParams(withoutParams.url, withoutParams.config)).toEqualTypeOf<{
                    name: string
                }>()
            })

            test("No search params", () => {
                const withParams = {
                    url: "http://example.com?name=John",
                    config: {
                        schemas: {
                            searchParams: z.object({
                                name: z.string(),
                            }),
                        },
                    },
                }
                expectTypeOf(getSearchParams(withParams.url, withParams.config)).toEqualTypeOf<{
                    name: string
                }>()
            })

            test("Without schema definition", () => {
                const withoutSchema = {
                    url: "http://example.com?name=John",
                    config: {
                        schemas: {
                            searchParams: z.object({}),
                        },
                    },
                }
                expectTypeOf(getSearchParams(withoutSchema.url, withoutSchema.config)).not.toEqualTypeOf<URLSearchParams>()
                expectTypeOf(getSearchParams(withoutSchema.url, withoutSchema.config)).toEqualTypeOf<Record<string, never>>()
            })
        })
    })

    describe("Infer types", () => {
        test("Infer types from zod schema", () => {
            const config = {
                schemas: {
                    searchParams: z.object({
                        name: z.string(),
                    }),
                },
            }
            const searchParams = getSearchParams("http://example.com?name=John", config)
            expectTypeOf(searchParams).toEqualTypeOf<{ name: string }>()
            expectTypeOf(searchParams.name).toBeString()
        })
    })
})

describe("getHeaders", () => {
    const testCases = [
        {
            description: "No headers",
            request: new Request("http://example.com"),
            expected: new Headers({}),
        },
        {
            description: "Single header",
            request: new Request("http://example.com", {
                headers: { Authorization: "Bearer token" },
            }),
            expected: new Headers({ Authorization: "Bearer token" }),
        },
        {
            description: "Multiple headers",
            request: new Request("http://example.com", {
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
            }),
            expected: new Headers({
                "Content-Type": "application/json",
                Accept: "application/json",
            }),
        },
    ]
    testCases.forEach(({ description, request, expected }) => {
        test.concurrent(description, ({ expect }) => {
            const headers = getHeaders(request)
            expect(headers instanceof Headers).toBe(true)
            expect(headers).toBeDefined()
            expect(headers).toBeInstanceOf(Headers)
            expect(headers).toEqual(expected)
        })
    })
})

describe("getBody", () => {
    describe("Valid body", () => {
        const testCases = [
            {
                description: "Text body",
                request: new Request("http://example.com/echo", {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: "Hello, World!",
                }),
                config: {},
                expected: "Hello, World!",
            },
            {
                description: "JSON body with content-type missing",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    body: JSON.stringify({
                        username: "John",
                        password: "secret",
                    }),
                }),
                config: {},
                expected: JSON.stringify({
                    username: "John",
                    password: "secret",
                }),
            },
            {
                description: "JSON body without schema",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "John",
                        password: "secret",
                    }),
                }),
                config: {},
                expected: {
                    username: "John",
                    password: "secret",
                },
            },
            {
                description: "JSON body with schema",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "John",
                        password: "secret",
                    }),
                }),
                config: {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                },
                expected: { username: "John", password: "secret" },
            },
        ]

        testCases.forEach(({ description, request, config, expected }) => {
            test.concurrent(description, async ({ expect }) => {
                const body = await getBody(request, config)
                expect(body).toBeDefined()
                expect(body).toEqual(expected)
            })
        })
    })

    describe("Invalid body", () => {
        const testCases = [
            {
                description: "Invalid JSON body with schema",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "John",
                        password: 123,
                    }),
                }),
                config: {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                },
                expected: /Invalid request body/,
            },
            {
                description: "Invalid JSON body missing required field",
                request: new Request("http://example.com/auth/credentials", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        username: "John",
                    }),
                }),
                config: {
                    schemas: {
                        body: z.object({
                            username: z.string(),
                            password: z.string(),
                        }),
                    },
                },
                expected: /Invalid request body/,
            },
        ]

        testCases.forEach(({ description, request, config, expected }) => {
            test.concurrent(description, async ({ expect }) => {
                await expect(getBody(request, config)).rejects.toThrowError(expected)
            })
        })
    })
})
