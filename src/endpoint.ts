import type {
  EndpointConfig,
  EndpointSchemas,
  HTTPMethod,
  RouteEndpoint,
  RouteHandler,
  RoutePattern,
} from "./types.js";
import { isSupportedMethod, isValidHandler, isValidRoute } from "./assert.js";

/**
 *
 * @param route -
 * @returns
 */
export const createRoutePattern = (route: RoutePattern): RegExp => {
  const pattern = route.replace(/:[^/]+/g, "([^/]+)").replace(/\//g, "\\/");
  return new RegExp(`^${pattern}$`);
};

/**
 *
 * @param method -
 * @param route -
 * @param handler -
 * @param config -
 * @returns -
 */
export const createEndpoint = <
  const Method extends Uppercase<HTTPMethod>,
  const Route extends Lowercase<RoutePattern>,
  const Config extends EndpointConfig,
>(
  method: Method,
  route: Route,
  handler: RouteHandler<Route, Config>,
  config: Config = {} as Config,
): RouteEndpoint<Method, Route, Config> => {
  if (!isSupportedMethod(method)) {
    throw new Error(`Unsupported HTTP method: ${method}`);
  }
  if (!isValidRoute(route)) {
    throw new Error(`Invalid route format: ${route}`);
  }
  if (!isValidHandler(handler)) {
    throw new Error("Handler must be a function");
  }
  return { method, route, handler, config };
};

/**
 *
 * @experimental
 * @param config -
 * @returns
 */
export const createEndpointConfig = <Schemas extends EndpointSchemas>(
  config: EndpointConfig<Schemas>,
) => {
  return config;
};
