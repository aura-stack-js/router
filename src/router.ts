import type {
  HTTPMethod,
  InferMethod,
  RequestContext,
  RouteEndpoint,
  RoutePattern,
  RouterConfig,
  MiddlewareFunction,
  EndpointConfig,
} from "./types.js";
import { createRoutePattern } from "./endpoint.js";
import {
  getBody,
  getHeaders,
  getRouteParams,
  getSearchParams,
} from "./context.js";

/**
 * Executes middlewares in sequence, passing the request and context to each middleware.
 *
 * @param request - Original request made from the client
 * @param context - Context object of the endpoint functionality
 * @param middlewares - Array of middleware functions to be executed
 * @returns The modified context after all middlewares have been executed
 */
export const executeMiddlewares = async <
  const RouteParams extends Record<string, string>,
  const Config extends EndpointConfig,
>(
  request: Request,
  context: RequestContext<RouteParams, Config>,
  middlewares: MiddlewareFunction<RouteParams, Config>[] = [],
): Promise<RequestContext<RouteParams, Config>> => {
  let ctx = context;
  for (const middleware of middlewares) {
    if (typeof middleware !== "function") {
      throw new TypeError("Middleware must be a function");
    }
    ctx = await middleware(request, ctx);
  }
  return ctx;
};

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
  config: RouterConfig = {},
): {
  [Method in InferMethod<Endpoints>]: (
    req: Request,
    ctx: RequestContext,
  ) => Promise<Response>;
} => {
  const server = {} as {
    [Method in InferMethod<Endpoints>]: (
      req: Request,
      ctx: RequestContext,
    ) => Promise<Response>;
  };
  const groups: Record<HTTPMethod, RouteEndpoint[]> = {
    GET: [],
    POST: [],
    DELETE: [],
    PUT: [],
    PATCH: [],
  };
  endpoints.forEach((endpoint) => groups[endpoint.method].push(endpoint));
  for (const method in groups) {
    server[method as keyof typeof server] = async (
      request: Request,
      ctx: RequestContext,
    ) => {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const endpoint = groups[method as HTTPMethod].find((endpoint) => {
        const withBasePath = config.basePath
          ? `${config.basePath}${endpoint.route}`
          : endpoint.route;
        const regex = createRoutePattern(withBasePath as RoutePattern);
        return regex.test(pathname);
      });
      if (endpoint) {
        const withBasePath = config.basePath
          ? `${config.basePath}${endpoint.route}`
          : endpoint.route;
        const body = await getBody(request, endpoint.config);
        const params = getRouteParams(withBasePath as RoutePattern, pathname);
        const searchParams = getSearchParams(request.url, endpoint.config);
        const headers = getHeaders(request);
        const context = {
          ...ctx,
          params,
          searchParams,
          headers,
          body,
        } as RequestContext<Record<string, string>, typeof endpoint.config>;
        await executeMiddlewares(request, context, config.middlewares);
        await executeMiddlewares(request, context, endpoint.config.middlewares);
        return endpoint.handler(request, context);
      }
      return Response.json({ message: "Not Found" }, { status: 404 });
    };
  }
  return server;
};
