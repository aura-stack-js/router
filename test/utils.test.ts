import { describe, test, expect } from "vitest"
import { sanitizer } from "../src/utils.js"

describe("sanitizer", () => {
    const testCases = [
        {
            description: "should decode percent-encoded characters",
            input: `/users/${encodeURIComponent("john doe")}/profile`,
            expected: "/users/john doe/profile",
        },
        {
            description: "should replace multiple slashes with a single slash",
            input: "/api//v1///users",
            expected: "/api/v1/users",
        },
        {
            description: "should remove trailing slash",
            input: "/products/electronics/",
            expected: "/products/electronics",
        },
        {
            description: "should handle multiple leading and trailing slashes",
            input: "//api//users///",
            expected: "/api/users",
        },
        {
            description: "remove fragment identifiers",
            input: "/api/users#page=1",
            expected: "/api/users",
        },
        {
            description: "remove trailing spaces",
            input: " /users ",
            expected: "/users",
        },
        {
            description: "remove spaces within the string",
            input: "/users         /",
            expected: "/users",
        },
    ]

    for (const { description, input, expected } of testCases) {
        test(description, () => {
            const result = sanitizer(input)
            expect(result).toBe(expected)
        })
    }
})
