import type { EndpointConfig, EndpointSchemas, HTTPMethod, RouteEndpoint, RouteHandler, RoutePattern } from "./types.js"
import { isSupportedMethod, isValidHandler, isValidRoute } from "./assert.js"

/**
 * Create a RegExp pattern from a route string. This function allows segment the
 * dynamic params in the route. For example, the route `/users/:id` will be
 * converted to a regex pattern that captures the `id` parameter.
 *
 * @param route - The route pattern string
 * @returns A RegExp object that matches the route pattern
 * @example
 * // Expected: /^\/users\/([^/]+)$/
 * const pattern = createRoutePattern("/users/:id");
 */
export const createRoutePattern = (route: RoutePattern): RegExp => {
    const pattern = route.replace(/:[^/]+/g, "([^/]+)").replace(/\//g, "\\/")
    return new RegExp(`^${pattern}$`)
}

/**
 * Defines an API endpoint for the router by specifying the HTTP method, route pattern,
 * handler function, and optional configuration such as validation schemas or middlewares.
 * Validates all parameters for correctness. The resulting endpoint should be passed
 * to the `createRouter` function.
 *
 * @param method - The HTTP method (e.g., GET, POST, PUT, DELETE, PATCH)
 * @param route - The route pattern to associate with the endpoint (supports dynamic params)
 * @param handler - The function to handle requests matching the method and route
 * @param config - Optional configuration including validation schemas, middlewares, etc.
 * @returns An object representing the configured endpoint
 * @example
 * const signIn = createEndpoint("POST", "/auth/signin", async (req, ctx) => {
 *   return new Response("Signed in");
 * });
 */
export const createEndpoint = <
    const Method extends Uppercase<HTTPMethod>,
    const Route extends Lowercase<RoutePattern>,
    const Schemas extends EndpointSchemas,
>(
    method: Method,
    route: Route,
    handler: RouteHandler<Route, { schemas: Schemas }>,
    config: EndpointConfig<Route, Schemas> = {}
): RouteEndpoint<Method, Route, {}> => {
    if (!isSupportedMethod(method)) {
        throw new Error(`Unsupported HTTP method: ${method}`)
    }
    if (!isValidRoute(route)) {
        throw new Error(`Invalid route format: ${route}`)
    }
    if (!isValidHandler(handler)) {
        throw new Error("Handler must be a function")
    }
    return { method, route, handler, config }
}

/**
 * Create an endpoint configuration to be passed to the `createEndpoint` function.
 * This function is primarily for type inference and does not perform any runtime checks.
 *
 * @experimental
 * @param config - The endpoint configuration object
 * @returns The same configuration object, typed as EndpointConfig
 * @example
 * const config = createEndpointConfig({
 *   middlewares: [myMiddleware],
 *   schemas: {
 *     searchParams: z.object({
 *       q: z.string().min(3),
 *     })
 *   }
 * })
 *
 * const search = createEndpoint("GET", "/search", async (request, ctx) => {
 *   return new Response("Search results");
 * }, config);
 */
export function createEndpointConfig<Schemas extends EndpointSchemas>(
    config: EndpointConfig<RoutePattern, Schemas>
): EndpointConfig<RoutePattern, Schemas>

export function createEndpointConfig<Route extends RoutePattern, S extends EndpointSchemas>(
    route: Route,
    config: EndpointConfig<Route, S>
): EndpointConfig<Route, S>
export function createEndpointConfig(...args: unknown[]) {
    if (typeof args[0] === "string") return args[1]
    return args[0]
}
