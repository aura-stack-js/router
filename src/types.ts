import { type ZodObject, z } from "zod";

export type RoutePattern = `/${string}`;

export type HTTPMethod = "GET" | "POST" | "DELETE" | "PUT" | "PATCH";
export type ContentType =
  | "application/json"
  | "application/x-www-form-urlencoded"
  | "text/plain";

export interface RouterConfig {
  basePath?: RoutePattern;
  middlewares?: MiddlewareFunction[];
}

export type Prettify<Obj extends object> = {
  [Key in keyof Obj]: Obj[Key];
} & {};

export type Params<Route extends RoutePattern> =
  Route extends `/${string}/:${infer Param}/${infer Str}`
    ? Prettify<{ [K in Param]: string } & Params<`/${Str}`>>
    : Route extends `/${string}/:${infer Param}`
      ? { [K in Param]: string }
      : Route extends `/:${infer Param}`
        ? { [K in Param]: string }
        : {};

export type GetRouteParams<T extends RoutePattern> = Params<T>;

/**
 *
 */
export type EndpointSchemas = {
  body?: ZodObject<any>;
  searchParams?: ZodObject<any>;
};

export type MiddlewareFunction<
  RouteParams = Record<string, string>,
  Config extends EndpointConfig = EndpointConfig,
> = (
  request: Request,
  ctx: RequestContext<RouteParams, Config>,
) => Promise<RequestContext<RouteParams, Config>>;

export type EndpointConfig<Schemas extends EndpointSchemas = EndpointSchemas> =
  {
    schemas?: Schemas;
    middlewares?: MiddlewareFunction<
      Record<string, string>,
      { schemas: Schemas }
    >[];
  };

/**
 *
 */
export type ContextSearchParams<Schemas extends EndpointConfig["schemas"]> =
  Schemas extends { searchParams: ZodObject }
    ? { searchParams: z.infer<Schemas["searchParams"]> }
    : { searchParams: URLSearchParams };

export type ContextBody<Schemas extends EndpointConfig["schemas"]> =
  Schemas extends { body: ZodObject }
    ? { body: z.infer<Schemas["body"]> }
    : { body: undefined };

export type RequestContext<
  RouteParams = Record<string, string>,
  Config extends EndpointConfig = EndpointConfig,
> = Prettify<
  {
    params: RouteParams;
    headers: Headers;
  } & ContextBody<Config["schemas"]> &
    ContextSearchParams<Config["schemas"]>
>;

/**
 *
 */
export type RouteHandler<
  Route extends RoutePattern,
  Config extends EndpointConfig,
> = (
  request: Request,
  ctx: RequestContext<GetRouteParams<Route>, Config>,
) => Promise<Response>;

export type RouteEndpoint<
  Method extends HTTPMethod = HTTPMethod,
  Route extends RoutePattern = RoutePattern,
  Config extends EndpointConfig = EndpointConfig,
> = {
  method: Method;
  route: Route;
  handler: RouteHandler<Route, Config>;
  config: Config;
};

export type InferMethod<T extends RouteEndpoint[]> = T extends unknown[]
  ? T[number]["method"]
  : false;
