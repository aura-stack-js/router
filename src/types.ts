import { type ZodObject, z } from "zod"

/**
 * Route pattern must start with a slash and can contain parameters prefixed with a colon.
 * @example
 * const getUser:RoutePattern = "/users/:userId"
 * const getPostsComments:RoutePattern = "/posts/:postId/comments/:commentId"
 */
export type RoutePattern = `/${string}` | `/${string}/:${string}`

/**
 * HTTP methods supported by the router.
 */
export type HTTPMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH"

/**
 * Content types supported by the router.
 */
export type ContentType = "application/json" | "application/x-www-form-urlencoded" | "text/plain"

export type Prettify<Obj extends object> = {
    [Key in keyof Obj]: Obj[Key]
} & {}

/**
 * Extracts route parameters from a given route pattern through colon-prefixed segments.
 * Returns an object type where keys are parameter names and values are strings.
 * If no parameters are found, returns an empty object type.
 *
 * @example
 * // Expected: { userId: string }
 * type UserParams = Params<"/users/:userId">;
 *
 * // Expected: { postId: string; commentId: string }
 * type PostCommentParams = Params<"/posts/:postId/comments/:commentId">;
 *
 * // Expected: {}
 * type NoParams = Params<"/about">;
 */
export type Params<Route extends RoutePattern> = Route extends `/${string}/:${infer Param}/${infer Str}`
    ? Prettify<{ [K in Param]: string } & Params<`/${Str}`>>
    : Route extends `/${string}/:${infer Param}`
      ? Prettify<{ [K in Param]: string }>
      : Route extends `/:${infer Param}`
        ? Prettify<{ [K in Param]: string }>
        : {}

export type GetRouteParams<T extends RoutePattern> = Params<T>

/**
 * Available schemas validation for an endpoint. It can include body and searchParams schemas.
 */
export interface EndpointSchemas {
    body?: ZodObject<any>
    searchParams?: ZodObject<any>
}

/**
 * Configuration for an endpoint, including optional schemas for request validation and middlewares.
 */
export type EndpointConfig<
    RouteParams extends RoutePattern = RoutePattern,
    Schemas extends EndpointSchemas = EndpointSchemas,
> = Prettify<{
    schemas?: Schemas
    middlewares?: MiddlewareFunction<GetRouteParams<RouteParams>, { schemas: Schemas }>[]
}>

/**
 * Infer the type of search parameters from the provided value in the `EndpointConfig`.
 */
export type ContextSearchParams<Schemas extends EndpointConfig["schemas"]> = Schemas extends { searchParams: ZodObject }
    ? { searchParams: z.infer<Schemas["searchParams"]> }
    : { searchParams: URLSearchParams }

/**
 * Infer the type of body from the provided value in the `EndpointConfig`.
 */
export type ContextBody<Schemas extends EndpointConfig["schemas"]> = Schemas extends { body: ZodObject }
    ? { body: z.infer<Schemas["body"]> }
    : { body: undefined }

/**
 * Context object passed to route handlers and middlewares defined in the
 * `createEndpoint/createEndpointConfig` function or globally in the `createRouter` function.
 */
export interface RequestContext<RouteParams = Record<string, string>, Config extends EndpointConfig = EndpointConfig> {
    params: RouteParams
    headers: Headers
    body: ContextBody<Config["schemas"]>["body"]
    searchParams: ContextSearchParams<Config["schemas"]>["searchParams"]
}

/**
 * Global middleware function type that represent a function that runs before the route matching.
 */
export type GlobalMiddleware = (request: Request) => Promise<Request | Response>

/**
 * Middleware function type that represent a function that runs before the route handler
 * defined in the `createEndpoint/createEndpointConfig` function or globally in the `createRouter` function.
 */
export type MiddlewareFunction<RouteParams = Record<string, string>, Config extends EndpointConfig = EndpointConfig> = (
    request: Request,
    ctx: Prettify<RequestContext<RouteParams, Config>>
) => Promise<RequestContext<RouteParams, Config>>

/**
 * Defines a route handler function that processes an incoming request and returns a response.
 * The handler receives the request object and a context containing route parameters, headers,
 * and optionally validated body and search parameters based on the endpoint configuration.
 */
export type RouteHandler<Route extends RoutePattern, Config extends EndpointConfig> = (
    request: Request,
    ctx: Prettify<RequestContext<GetRouteParams<Route>, Config>>
) => Promise<Response>

/**
 * Represents a route endpoint definition, specifying the HTTP method, route pattern,
 * handler function with inferred context types, and associated configuration.
 */
export interface RouteEndpoint<
    Method extends HTTPMethod = HTTPMethod,
    Route extends RoutePattern = RoutePattern,
    Config extends EndpointConfig = EndpointConfig,
> {
    method: Method
    route: Route
    handler: RouteHandler<Route, Config>
    config: Config
}

/**
 * Infer the HTTP methods defined in the provided array of route endpoints.
 */
export type InferMethod<Endpoints extends RouteEndpoint[]> = Endpoints extends unknown[] ? Endpoints[number]["method"] : "unknown"

/**
 * Generates an object with HTTP methods available by the router from `createRouter` function.
 * Each method is a function that takes a request and context, returning a promise of a response.
 */
export type GetHttpHandlers<Endpoints extends RouteEndpoint[]> = {
    [Method in InferMethod<Endpoints>]: (req: Request) => Promise<Response>
}

/**
 * Configuration options for `createRouter` function.
 */
export interface RouterConfig {
    basePath?: RoutePattern
    middlewares?: GlobalMiddleware[]
}
