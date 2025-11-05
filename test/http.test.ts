import { describe, test, expect } from "vitest"
import { createRouter } from "../src/router.js"
import { createEndpoint } from "../src/endpoint.js"

describe("Router", () => {
    const getUsers = createEndpoint("GET", "/users", async () => {
        return Response.json({ message: "List of users" }, { status: 200 })
    })

    const getUser = createEndpoint("GET", "/users/:userId", async (_, ctx) => {
        return Response.json({ message: `User ID: ${ctx.params.userId}` }, { status: 200 })
    })
    const createUser = createEndpoint("POST", "/users", async () => {
        return Response.json({ message: "User created" }, { status: 201 })
    })

    const deleteUser = createEndpoint("DELETE", "/users/:userId", async (_, ctx) => {
        return Response.json({ message: `User ID: ${ctx.params.userId} deleted` }, { status: 200 })
    })

    const errorEndpoint = createEndpoint("GET", "/faulty", async () => {
        throw new Error("Unexpected error")
    })

    const { DELETE, GET, POST } = createRouter([getUsers, getUser, createUser, deleteUser, errorEndpoint])

    test("GET /users", async () => {
        const response = await GET(new Request("https://example.com/users", { method: "GET" }))
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ message: "List of users" })
    })

    test("GET /users/:userId", async () => {
        const response = await GET(new Request("https://example.com/users/123", { method: "GET" }))
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ message: "User ID: 123" })
    })

    test("POST /users", async () => {
        const response = await POST(new Request("https://example.com/users", { method: "POST" }))
        expect(response.status).toBe(201)
        expect(await response.json()).toEqual({ message: "User created" })
    })

    test("DELETE /users/:userId", async () => {
        const response = await DELETE(new Request("https://example.com/users/123", { method: "DELETE" }))
        expect(response.status).toBe(200)
        expect(await response.json()).toEqual({ message: "User ID: 123 deleted" })
    })

    test("GET /faulty - Internal Server Error handling", async () => {
        const response = await GET(new Request("https://example.com/faulty", { method: "GET" }))
        expect(response.status).toBe(500)
        expect(await response.json()).toEqual({ message: "Internal Server Error" })
    })

    test("Unsupported HTTP method in dynamic route", async () => {
        const response = await GET(new Request("https://example.com/users/123", { method: "PATCH" }))
        expect(response.status).toBe(405)
        expect(await response.json()).toEqual({ message: "The HTTP method 'PATCH' is not allowed" })
    })

    test("Unsupported HTTP method in static route", async () => {
        const response = await POST(new Request("https://example.com/users", { method: "PATCH" }))
        expect(response.status).toBe(405)
        expect(await response.json()).toEqual({ message: "The HTTP method 'PATCH' is not allowed" })
    })

    test("Not Found route", async () => {
        const response = await GET(new Request("https://example.com/unknown", { method: "GET" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })

    test("Invalid HTTP method", async () => {
        const response = await GET(new Request("https://example.com/users/123", { method: "INVALID" }))
        expect(response.status).toBe(405)
        expect(await response.json()).toEqual({ message: "The HTTP method 'INVALID' is not supported" })
    })

    test("Case sensitivity of routes", async () => {
        const response = await GET(new Request("https://example.com/USERS/123", { method: "GET" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })

    test("Injection attack prevention", async () => {
        const response = await GET(new Request("https://example.com/users/%3Cscript%3Ealert(1)%3C/script%3E", { method: "GET" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })

    test("Remove parent directory references", async () => {
        const response = await GET(new Request("https://example.com/users/123/..", { method: "GET" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })

    test("Remove parent directory references", async () => {
        const response = await GET(new Request("https://example.com/users/../123", { method: "DELETE" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })

    test("Remove current directory references", async () => {
        const response = await GET(new Request("https://example.com/users/.", { method: "GET" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })

    test("Remove current directory references", async () => {
        const response = await GET(new Request("https://example.com/users/./123", { method: "GET" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })

    test("Remove current directory references x3", async () => {
        const response = await GET(new Request("https://example.com/users/././123", { method: "GET" }))
        expect(response.status).toBe(404)
        expect(await response.json()).toEqual({ message: "Not Found" })
    })
})
