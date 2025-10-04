import type {
  EndpointConfig,
  Params,
  RoutePattern,
  ContextSearchParams,
  ContentType,
} from "./types.js";
import { createRoutePattern } from "./endpoint.js";
import { isSupportedBodyMethod } from "./assert.js";

/**
 *
 * @param route -
 * @param path -
 * @returns
 */
export const getRouteParams = <Route extends RoutePattern>(
  route: Route,
  path: string,
): Params<Route> => {
  const routeRegex = createRoutePattern(route);
  if (!routeRegex.test(path)) {
    return {} as Params<Route>;
  }
  const params = routeRegex
    .exec(route)
    ?.slice(1)
    .map((seg) => seg.replace(":", ""));
  if (!params) return {} as Params<Route>;
  const values = routeRegex.exec(path)?.slice(1);
  return params.reduce(
    (previous, now, idx) => ({
      ...previous,
      [now]: decodeURIComponent(values?.[idx] ?? ""),
    }),
    {} as Params<Route>,
  );
};

/**
 *
 * @param url -
 * @param config -
 * @returns
 */
export const getSearchParams = <Config extends EndpointConfig>(
  url: string,
  config: Config,
): ContextSearchParams<Config["schemas"]>["searchParams"] => {
  const route = new URL(url);
  if (config.schemas?.searchParams) {
    const parsed = config.schemas.searchParams.safeParse(
      Object.fromEntries(route.searchParams.entries()),
    );
    if (!parsed.success) {
      throw new Error(`Invalid search parameters: ${parsed.error.message}`);
    }
    return parsed.data;
  }
  return new URLSearchParams(route.searchParams.toString());
};

/**
 *
 * @param request -
 * @returns
 */
export const getHeaders = (request: Request): Headers => {
  return new Headers(request.headers);
};

/**
 * By default the Content-Type is text/plain;charset=UTF-8
 *
 * @param request -
 * @param config -
 * @returns
 */
export const getBody = async <Config extends EndpointConfig>(
  request: Request,
  config: Config,
) => {
  if (!isSupportedBodyMethod(request.method)) {
    return undefined;
  }
  const contentType =
    request.headers.get("Content-Type") ?? ("" as ContentType);
  if (contentType.includes("application/json")) {
    const json = await request.json();
    if (config.schemas?.body) {
      const parsed = config.schemas.body.safeParse(json);
      if (!parsed.success) {
        throw new Error("Invalid request body");
      }
      return parsed.data;
    }
    return json;
  }
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    return await request.formData();
  }
  if (contentType.includes("text/")) {
    return await request.text();
  }
  if (contentType.includes("application/octet-stream")) {
    return await request.arrayBuffer();
  }
  if (
    contentType.includes("image/") ||
    contentType.includes("video/") ||
    contentType.includes("audio/")
  ) {
    return await request.blob();
  }
  throw new Error(`Unsupported Content-Type: ${contentType}`);
};
