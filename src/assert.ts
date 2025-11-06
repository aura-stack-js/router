import { AuraStackRouterError } from "./error.js"
import type { RouteHandler, HTTPMethod, RoutePattern } from "./types.js"

const supportedMethods = new Set<HTTPMethod>(["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS", "HEAD", "TRACE", "CONNECT"])

const supportedBodyMethods = new Set<HTTPMethod>(["POST", "PUT", "PATCH"])

export const supportedProtocols = new Set(["http:", "https:"])

/**
 * Checks if the provided method is a supported HTTP method.
 *
 * @param method - The HTTP method to check.
 * @returns True if the method is supported, false otherwise.
 */
export const isSupportedMethod = (method: string): method is HTTPMethod => {
    return supportedMethods.has(method as HTTPMethod)
}

/**
 * Check if the provided method can includes a body as per HTTP specification.
 * @param method - The HTTP method to check.
 * @returns True if the method can include a body, false otherwise.
 */
export const isSupportedBodyMethod = (method: string): method is HTTPMethod => {
    return supportedBodyMethods.has(method as HTTPMethod)
}

/**
 * Checks if the provided route is a valid route pattern.
 *
 * @param route - The route pattern to check.
 * @returns True if the route is valid, false otherwise.
 */
export const isValidRoute = (route: string): route is RoutePattern => {
    const routePattern = /^\/[a-zA-Z0-9/_:-]*$/
    return routePattern.test(route)
}

/**
 * Checks if the provided handler is a valid route handler function.
 *
 * @param handler - The handler to check.
 * @returns True if the handler is valid, false otherwise.
 */
export const isValidHandler = (handler: unknown): handler is RouteHandler<any, any> => {
    return typeof handler === "function"
}

/**
 * Asserts that the error is an instance of AuraStackRouterError. It is useful if you want
 * to check if the error thrown by the router is an AuraStackRouterError or by other sources.
 *
 * @param error - The error to check
 * @returns True if the error is an instance of AuraStackRouterError, false otherwise.
 * @example
 * import { isRouterError } from "aura-stack/router";
 *
 * try {
 *   // Some router operation that may throw an error
 * } catch (error) {
 *  if (isRouterError(error)) {
 *    // Handle AuraStackRouterError
 *  }
 * }
 */
export const isRouterError = (error: unknown): error is AuraStackRouterError => {
    return error instanceof AuraStackRouterError
}
