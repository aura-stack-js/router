import { describe, test, expect } from "vitest"
import { unstable_sanitizer as sanitizer } from "../src/utils.js"

describe("sanitizer", () => {
    const testCases = [
        {
            description: "should decode percent-encoded characters",
            input: `https://example.com/users/john doe/profile`,
            expected: "https://example.com/users/john doe/profile",
        },
        {
            description: "should replace multiple slashes with a single slash",
            input: "https://example.com/api//v1///users",
            expected: "https://example.com/api/v1/users",
        },
        {
            description: "should remove trailing slash",
            input: "https://example.com/products/electronics/",
            expected: "https://example.com/products/electronics",
        },
        {
            description: "should handle multiple leading and trailing slashes",
            input: "https://example.com//api//users///",
            expected: "https://example.com/api/users",
        },
        {
            description: "remove fragment identifiers",
            input: "https://example.com/api/users#page=1",
            expected: "https://example.com/api/users",
        },
        {
            description: "remove fragment",
            input: "https://example.com/api/users?search=john#section2",
            expected: "https://example.com/api/users?search=john",
        },
        {
            description: "remove spaces around slashes",
            input: "https://example.com / api / users / ",
            expected: "https://example.com/api/users",
        },
        {
            description: "remove trailing spaces",
            input: "https://example.com /users ",
            expected: "https://example.com/users",
        },
        {
            description: "remove spaces within the string",
            input: "https://example.com/users         /",
            expected: "https://example.com/users",
        },
        {
            description: "remove leading spaces",
            input: "https://example.com/users/",
            expected: "https://example.com/users",
        },
        {
            description: "20",
            input: "https://example.com/users/%20/profile",
            expected: "https://example.com/users/profile",
        },
        {
            description: "2f",
            input: "https://example.com/users/%2f",
            expected: "https://example.com/users",
        },
        {
            description: "remove parent directory references",
            input: "https://example.com/users/../",
            expected: "https://example.com/users",
        },
        {
            description: "remove current directory references",
            input: "https://example.com/users/./profile/",
            expected: "https://example.com/users/profile",
        },
        {
            description: "complex case with multiple issues",
            input: "https://example.com//api/./v1//users/%20john%20doe/../profile/?search=john#section",
            expected: "https://example.com/api/v1/users/%20john%20doe/profile?search=john",
        },
        {
            description: "handle parent directory references in query parameters",
            input: "https://example.com/users?search=../",
            expected: "https://example.com/users",
        },
        {
            description: "handle current directory references in query parameters",
            input: "https://example.com/users?search=./profile",
            expected: "https://example.com/users?search=profile",
        },
        {
            description: "",
            input: "https://example.com/users?query=alert(XSS)",
            expected: "https://example.com/users?query=alertXSS",
        },
    ]

    for (const { description, input, expected } of testCases) {
        test(description, () => {
            const result = sanitizer(input)
            expect(result).toBe(expected)
        })
    }
})
