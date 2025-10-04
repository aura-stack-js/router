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
 *
 * @param method -
 * @returns
 */
export const isSupportedMethod = (method: string): method is HTTPMethod => {
  return supportedMethods.includes(method as HTTPMethod);
};

export const isSupportedBodyMethod = (method: string): method is HTTPMethod => {
  return supportedBodyMethods.includes(method as HTTPMethod);
};

/**
 *
 * @param route -
 * @returns
 */
export const isValidRoute = (route: string): route is RoutePattern => {
  const routePattern = /^\/[a-zA-Z0-9/_:-]*$/;
  return routePattern.test(route);
};

/**
 *
 * @param handler -
 * @returns
 */
export const isValidHandler = (
  handler: unknown,
): handler is RouteHandler<any, any> => {
  return typeof handler === "function";
};
