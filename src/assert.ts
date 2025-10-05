import type { RouteHandler, HTTPMethod, RoutePattern } from "./types.js";

const supportedMethods: HTTPMethod[] = [
  "GET",
  "POST",
  "DELETE",
  "PUT",
  "PATCH",
];

const supportedBodyMethods: HTTPMethod[] = ["POST", "PUT", "PATCH"];

/**
 * Checks if the provided method is a supported HTTP method.
 *
 * @param method - The HTTP method to check.
 * @returns True if the method is supported, false otherwise.
 */
export const isSupportedMethod = (method: string): method is HTTPMethod => {
  return supportedMethods.includes(method as HTTPMethod);
};

/**
 * Check if the provided method can includes a body as per HTTP specification.
 * @param method - The HTTP method to check.
 * @returns True if the method can include a body, false otherwise.
 */
export const isSupportedBodyMethod = (method: string): method is HTTPMethod => {
  return supportedBodyMethods.includes(method as HTTPMethod);
};

/**
 * Checks if the provided route is a valid route pattern.
 *
 * @param route - The route pattern to check.
 * @returns True if the route is valid, false otherwise.
 */
export const isValidRoute = (route: string): route is RoutePattern => {
  const routePattern = /^\/[a-zA-Z0-9/_:-]*$/;
  return routePattern.test(route);
};

/**
 * Checks if the provided handler is a valid route handler function.
 *
 * @param handler - The handler to check.
 * @returns True if the handler is valid, false otherwise.
 */
export const isValidHandler = (
  handler: unknown,
): handler is RouteHandler<any, any> => {
  return typeof handler === "function";
};
