import type {
  EndpointConfig,
  MiddlewareFunction,
  RequestContext,
  RouterConfig,
} from "./types.js";

/**
 * Executes the middlewares in sequence, passing the request to each middleware.
 *
 * @param request - Original request made from the client
 * @param middlewares - Array of global middleware functions to be executed
 * @returns - The modified request after all middlewares have been executed
 */
export const executeGlobalMiddlewares = async (
  request: Request,
  middlewares: RouterConfig["middlewares"],
) => {
  if (!middlewares) return request;
  for (const middleware of middlewares) {
    if (typeof middleware !== "function") {
      throw new TypeError("Middleware must be a function");
    }
    const executed = await middleware(request);
    if (executed instanceof Response) {
      return executed;
    }
    request = executed;
  }
  return request;
};

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
