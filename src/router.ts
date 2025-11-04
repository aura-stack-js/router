import type { HTTPMethod, RequestContext, RouteEndpoint, RoutePattern, RouterConfig, GetHttpHandlers } from "./types.js"
import { createRoutePattern } from "./endpoint.js"
import { getBody, getHeaders, getRouteParams, getSearchParams } from "./context.js"
import { executeGlobalMiddlewares, executeMiddlewares } from "./middlewares.js"
import { AuraStackRouterError } from "./error.js"

/**
 * Creates the entry point for the server, handling the endpoints defined in the router.
 * It groups endpoints by HTTP method and matches incoming requests to the appropriate endpoint.
 * It accepts an optional configuration object to set a base path and middlewares for all endpoints.
 *
 * @param endpoints - Array of route endpoints to be handled by the router
 * @param config - Optional configuration object for the router
 * @returns An object with methods corresponding to HTTP methods, each handling requests for that method
 */
export const createRouter = <const Endpoints extends RouteEndpoint[]>(
    endpoints: Endpoints,
    config: RouterConfig = {}
): GetHttpHandlers<Endpoints> => {
    const server = {} as GetHttpHandlers<Endpoints>
    const groups = new Map<HTTPMethod, RouteEndpoint[]>()
    for (const endpoint of endpoints) {
        if (!groups.has(endpoint.method)) {
            groups.set(endpoint.method, [])
        }
        groups.get(endpoint.method)?.push(endpoint)
    }
    for (const method of groups.keys()) {
        server[method as keyof typeof server] = async (request: Request) => {
            try {
                const globalRequest = await executeGlobalMiddlewares(request, config.middlewares)
                if (globalRequest instanceof Response) {
                    return globalRequest
                }
                const url = new URL(globalRequest.url)
                const pathname = url.pathname
                const endpoint = groups.get(method)?.find((endpoint) => {
                    const withBasePath = config.basePath ? `${config.basePath}${endpoint.route}` : endpoint.route
                    const regex = createRoutePattern(withBasePath as RoutePattern)
                    return regex.test(pathname)
                })
                if (endpoint) {
                    const withBasePath = config.basePath ? `${config.basePath}${endpoint.route}` : endpoint.route
                    const body = await getBody(globalRequest, endpoint.config)
                    const params = getRouteParams(withBasePath as RoutePattern, pathname, endpoint.config)
                    const searchParams = getSearchParams(globalRequest.url, endpoint.config)
                    const headers = getHeaders(globalRequest)
                    const context = {
                        params,
                        searchParams,
                        headers,
                        body,
                    } as RequestContext<Record<string, string>, typeof endpoint.config>
                    await executeMiddlewares(globalRequest, context, endpoint.config.middlewares)
                    return endpoint.handler(globalRequest, context)
                }
                return Response.json({ message: "Not Found" }, { status: 404 })
            } catch (error) {
                if (error instanceof AuraStackRouterError) {
                    const { message, status, statusText } = error
                    return Response.json({ message }, { status, statusText })
                }
                return Response.json({ message: "Internal Server Error" }, { status: 500 })
            }
        }
    }
    return server
}
