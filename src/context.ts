import type { EndpointConfig, Params, RoutePattern, ContextSearchParams, ContentType } from "./types.js"
import { createRoutePattern } from "./endpoint.js"
import { isSupportedBodyMethod } from "./assert.js"

/**
 * Extracts route parameters from a given path using the specified route pattern.
 *
 * This function matches the provided path against the route pattern
 * (e.g., "/users/:userId/posts/:postId") and returns an object mapping parameter
 * names to their decoded values.
 *
 * @param route - The route pattern, typically defined in the endpoint configuration.
 * @param path - The actual request path to extract parameters from.
 * @returns An object containing the extracted route parameters as key-value pairs.
 *
 * @example
 * const route = "/users/:userId/posts/:postId";
 * const path = "/users/123/posts/456";
 *
 * // Expected: { userId: "123", postId: "456" }
 * const params = getRouteParams(route, path);
 */
export const getRouteParams = <Route extends RoutePattern>(route: Route, path: string): Params<Route> => {
    const routeRegex = createRoutePattern(route)
    if (!routeRegex.test(path)) {
        return {} as Params<Route>
    }
    const params = routeRegex
        .exec(route)
        ?.slice(1)
        .map((seg) => seg.replace(":", ""))
    if (!params) return {} as Params<Route>
    const values = routeRegex.exec(path)?.slice(1)
    return params.reduce(
        (previous, now, idx) => ({
            ...previous,
            [now]: decodeURIComponent(values?.[idx] ?? ""),
        }),
        {} as Params<Route>
    )
}

/**
 * Extracts and validates search parameters from a given URL from the request.
 *
 * If a schema is provided in the endpoint configuration, the search parameters
 * are validated against it using Zod and returned the parsed data. If validation
 * fails, an error is thrown. Otherwise, a URLSearchParams object is returned.
 *
 * @param url - The actual request URL to extract search parameters from.
 * @param config - Configuration object that may include a schema for validation.
 * @returns Either a URLSearchParams object or a parsed object based on the provided schema.
 * @example
 * // With schema
 * const url = "https://example.com/api?search=test&page=2";
 * const config: EndpointConfig = {
 *   schemas: {
 *     searchParams: z.object({
 *       search: z.string(),
 *       page: z.number().optional(),
 *     }),
 *   },
 * }
 *
 * // Expected: { search: "test", page: 2 }
 * const searchParams = getSearchParams(url, config);
 *
 * // Without schema
 * const url2 = "https://example.com/api?query=example";
 *
 * // Expected: URLSearchParams { 'query' => 'example' }
 * const searchParams2 = getSearchParams(url2, {} as EndpointConfig);
 */
export const getSearchParams = <Config extends EndpointConfig>(
    url: string,
    config: Config
): ContextSearchParams<Config["schemas"]>["searchParams"] => {
    const route = new URL(url)
    if (config.schemas?.searchParams) {
        const parsed = config.schemas.searchParams.safeParse(Object.fromEntries(route.searchParams.entries()))
        if (!parsed.success) {
            throw new Error(`Invalid search parameters: ${parsed.error.message}`)
        }
        return parsed.data
    }
    return new URLSearchParams(route.searchParams.toString())
}

/**
 * Extracts headers from the given Request object and returns them as a Headers instance.
 *
 * @param request - The Request object from which to extract headers.
 * @returns A Headers instance containing all headers from the request.
 * @example
 * const request = new Request("https://example.com/api", {
 *   headers: {
 *     "Content-Type": "application/json",
 *     "Authorization": "Bearer token",
 *   },
 * });
 * const headers = getHeaders(request);
 */
export const getHeaders = (request: Request): Headers => {
    return new Headers(request.headers)
}

/**
 * Extracts and parses the body of a Request object based on its Content-Type header.
 *
 * If a schema is provided in the endpoint configuration, the body is validated against
 * it using Zod and returned the parsed data. If validation fails, an error is thrown.
 *
 * In some cases, the browser includes text/plain;charset=UTF-8 as the default Content-Type
 *
 * @param request - The Request object from which to extract the body.
 * @param config - Configuration object that may include a schema for validation.
 * @returns The parsed body of the request or an error if validation fails.
 */
export const getBody = async <Config extends EndpointConfig>(request: Request, config: Config) => {
    if (!isSupportedBodyMethod(request.method)) {
        return undefined
    }
    const contentType = request.headers.get("Content-Type") ?? ("" as ContentType)
    if (contentType.includes("application/json")) {
        const json = await request.json()
        if (config.schemas?.body) {
            const parsed = config.schemas.body.safeParse(json)
            if (!parsed.success) {
                throw new Error("Invalid request body")
            }
            return parsed.data
        }
        return json
    }
    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
        return await request.formData()
    }
    if (contentType.includes("text/")) {
        return await request.text()
    }
    if (contentType.includes("application/octet-stream")) {
        return await request.arrayBuffer()
    }
    if (contentType.includes("image/") || contentType.includes("video/") || contentType.includes("audio/")) {
        return await request.blob()
    }
    /**
     * @todo: Handle other content types
     * throw new Error(`Unsupported Content-Type: ${contentType}`);
     */
    return null
}
