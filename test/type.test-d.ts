import { describe, expectTypeOf } from "vitest";
import type {
  RoutePattern,
  GetRouteParams,
  MiddlewareFunction,
  RequestContext,
  EndpointConfig,
  ContextSearchParams,
  ContextBody,
  RouteHandler,
  RouteEndpoint,
  InferMethod,
  EndpointSchemas,
} from "../src/types.js";
import type { ZodObject, ZodString } from "zod";

/**
 * @todo: implement runtime tests for the types
 */
describe("RoutePattern", () => {
  expectTypeOf<"/users/:userId/books/:bookId">().toExtend<RoutePattern>();
  expectTypeOf<"/users/:userId/:bookId">().toExtend<RoutePattern>();
  // @ts-expect-error
  expectTypeOf<"-users/:userId/books/:bookId">().toExtend<RoutePattern>();
  // @ts-expect-error
  expectTypeOf<"users/:userId/books/:bookId">().toExtend<RoutePattern>();

  /**
   * @todo: improve pattern matching
   */
  // @ts-expect-error
  expectTypeOf<"/users/-userId">().toExtend<RoutePattern>();
  // @ts-expect-error
  expectTypeOf<"/users/:userId:bookId">().toExtend<RoutePattern>();
});

describe("GetRouteParams", () => {
  expectTypeOf<GetRouteParams<"/users/:userId/books/:bookId">>().toEqualTypeOf<{
    userId: string;
    bookId: string;
  }>();
  expectTypeOf<GetRouteParams<"/users/:userId/:bookId">>().toEqualTypeOf<{
    userId: string;
    bookId: string;
  }>();
  /**
   * @todo: improve the getting of params
   */
  expectTypeOf<GetRouteParams<"/users/:userId:bookId">>().toEqualTypeOf<{}>();
});

describe("MiddlewareFunction", () => {
  expectTypeOf<MiddlewareFunction>().toEqualTypeOf<
    (request: Request, ctx: RequestContext) => Promise<RequestContext>
  >();

  expectTypeOf<MiddlewareFunction<{ oauth: string }>>().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<{ oauth: string }>,
    ) => Promise<RequestContext<{ oauth: string }>>
  >();

  expectTypeOf<
    MiddlewareFunction<{ oauth: string; provider: string }>
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<{ oauth: string; provider: string }>,
    ) => Promise<RequestContext<{ oauth: string; provider: string }>>
  >();

  type Body = ZodObject<{ username: ZodString; password: ZodString }>;
  type SearchParams = ZodObject<{ code: ZodString; state: ZodString }>;
  expectTypeOf<
    MiddlewareFunction<
      {},
      {
        schemas: {
          body: Body;
        };
      }
    >
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<
        {},
        {
          schemas: {
            body: Body;
          };
        }
      >,
    ) => Promise<
      RequestContext<
        {},
        {
          schemas: {
            body: Body;
          };
        }
      >
    >
  >();

  expectTypeOf<
    MiddlewareFunction<
      {},
      {
        schemas: {
          searchParams: SearchParams;
        };
      }
    >
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<
        {},
        {
          schemas: {
            searchParams: SearchParams;
          };
        }
      >,
    ) => Promise<
      RequestContext<
        {},
        {
          schemas: {
            searchParams: SearchParams;
          };
        }
      >
    >
  >();

  expectTypeOf<
    MiddlewareFunction<
      {},
      {
        schemas: {
          body: Body;
          searchParams: SearchParams;
        };
      }
    >
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<
        {},
        {
          schemas: {
            body: Body;
            searchParams: SearchParams;
          };
        }
      >,
    ) => Promise<
      RequestContext<
        {},
        {
          schemas: {
            body: Body;
            searchParams: SearchParams;
          };
        }
      >
    >
  >();

  expectTypeOf<
    MiddlewareFunction<
      {},
      {
        middlewares: [];
      }
    >
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<{}, { middlewares: [] }>,
    ) => Promise<RequestContext<{}, { middlewares: [] }>>
  >();

  expectTypeOf<
    MiddlewareFunction<
      {},
      {
        middlewares: [
          (
            request: Request,
            ctx: RequestContext,
          ) => Promise<RequestContext<{}, { middlewares: [] }>>,
        ];
      }
    >
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<{}, { middlewares: [] }>,
    ) => Promise<RequestContext<{}, { middlewares: [] }>>
  >();

  /**
   * @todo: fix the error inference on nested middlewares
   */
  expectTypeOf<
    MiddlewareFunction<GetRouteParams<"/auth/:oauth">>
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<{ oauth: string }, { middlewares: [] }>,
    ) => Promise<RequestContext<{ oauth: string }, { middlewares: [] }>>
  >();

  expectTypeOf<
    MiddlewareFunction<
      GetRouteParams<"/auth/:oauth">,
      {
        schemas: { searchParams: ZodObject<{ state: ZodString }> };
        middlewares: [];
      }
    >
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<
        GetRouteParams<"/auth/:oauth">,
        { schemas: { searchParams: ZodObject<{ state: ZodString }> } }
      >,
    ) => Promise<RequestContext<GetRouteParams<"/auth/:oauth">, {}>>
  >();
});

describe("ContextSearchParams", () => {
  describe("URLSearchParams instance", () => {
    expectTypeOf<ContextSearchParams<undefined>>().toEqualTypeOf<{
      searchParams: URLSearchParams;
    }>();
    expectTypeOf<ContextSearchParams<{}>>().toEqualTypeOf<{
      searchParams: URLSearchParams;
    }>();
  });

  describe("ZodObject instance", () => {
    expectTypeOf<
      ContextSearchParams<{
        searchParams: ZodObject<{
          code: ZodString;
        }>;
      }>
    >().toEqualTypeOf<{ searchParams: { code: string } }>();

    expectTypeOf<
      ContextSearchParams<{
        searchParams: ZodObject<{
          code: ZodString;
          state: ZodString;
        }>;
      }>
    >().toEqualTypeOf<{ searchParams: { code: string; state: string } }>();
  });
});

describe("ContextBody", () => {
  describe("undefined body", () => {
    expectTypeOf<ContextBody<undefined>>().toEqualTypeOf<{ body: undefined }>();
    expectTypeOf<ContextBody<{}>>().toEqualTypeOf<{ body: undefined }>();
  });

  describe("ZodObject instance", () => {
    expectTypeOf<
      ContextBody<{
        body: ZodObject<{
          username: ZodString;
          password: ZodString;
        }>;
      }>
    >().toEqualTypeOf<{ body: { username: string; password: string } }>();

    expectTypeOf<
      ContextBody<{
        body: ZodObject<{
          oauth: ZodString;
        }>;
      }>
    >().toEqualTypeOf<{ body: { oauth: string } }>();
  });
});

describe("RequestContext", () => {
  expectTypeOf<RequestContext>().toEqualTypeOf<{
    params: Record<string, string>;
    headers: Headers;
    body: undefined;
    searchParams: URLSearchParams;
  }>();

  expectTypeOf<RequestContext<{ oauth: string }>>().toEqualTypeOf<{
    params: { oauth: string };
    headers: Headers;
    body: undefined;
    searchParams: URLSearchParams;
  }>();

  expectTypeOf<
    RequestContext<{ oauth: string; provider: string }>
  >().toEqualTypeOf<{
    params: { oauth: string; provider: string };
    headers: Headers;
    body: undefined;
    searchParams: URLSearchParams;
  }>();

  expectTypeOf<
    RequestContext<
      {},
      {
        schemas: {
          body: ZodObject<{ username: ZodString; password: ZodString }>;
        };
      }
    >
  >().toEqualTypeOf<{
    params: {};
    headers: Headers;
    body: { username: string; password: string };
    searchParams: URLSearchParams;
  }>();

  expectTypeOf<
    RequestContext<
      {},
      {
        schemas: {
          searchParams: ZodObject<{ code: ZodString; state: ZodString }>;
        };
      }
    >
  >().toEqualTypeOf<{
    params: {};
    headers: Headers;
    body: undefined;
    searchParams: { code: string; state: string };
  }>();

  expectTypeOf<
    RequestContext<
      {},
      {
        schemas: {
          body: ZodObject<{ username: ZodString; password: ZodString }>;
          searchParams: ZodObject<{ code: ZodString; state: ZodString }>;
        };
      }
    >
  >().toEqualTypeOf<{
    params: {};
    headers: Headers;
    body: { username: string; password: string };
    searchParams: { code: string; state: string };
  }>();

  expectTypeOf<
    RequestContext<
      { oauth: string },
      {
        schemas: {
          body: ZodObject<{ username: ZodString; password: ZodString }>;
          searchParams: ZodObject<{ code: ZodString; state: ZodString }>;
        };
      }
    >
  >().toEqualTypeOf<{
    params: { oauth: string };
    headers: Headers;
    body: { username: string; password: string };
    searchParams: { code: string; state: string };
  }>();
});

describe("EndpointConfig", () => {
  expectTypeOf<EndpointConfig>().toEqualTypeOf<{
    schemas?: EndpointSchemas;
    middlewares?: MiddlewareFunction<
      GetRouteParams<"/">,
      {
        schemas: EndpointSchemas;
      }
    >[];
  }>();

  expectTypeOf<
    EndpointConfig<
      "/",
      {
        body: ZodObject<{ username: ZodString; password: ZodString }>;
      }
    >
  >().toEqualTypeOf<{
    schemas?: { body: ZodObject<{ username: ZodString; password: ZodString }> };
    middlewares?: MiddlewareFunction<
      GetRouteParams<"/">,
      {
        schemas: {
          body: ZodObject<{ username: ZodString; password: ZodString }>;
        };
      }
    >[];
  }>();
});

describe("RouteHandler", () => {
  expectTypeOf<RouteHandler<"/auth/:oauth", {}>>().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<GetRouteParams<"/auth/:oauth">, {}>,
    ) => Promise<Response>
  >();
  expectTypeOf<RouteHandler<"/auth/session", {}>>().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<GetRouteParams<"/auth/session">, {}>,
    ) => Promise<Response>
  >();
  expectTypeOf<
    RouteHandler<
      "/auth/:oauth",
      {
        schemas: {
          searchParams: ZodObject<{ state: ZodString }>;
        };
      }
    >
  >().toEqualTypeOf<
    (
      request: Request,
      ctx: RequestContext<
        GetRouteParams<"/auth/:oauth">,
        {
          schemas: {
            searchParams: ZodObject<{ state: ZodString }>;
          };
        }
      >,
    ) => Promise<Response>
  >();
});

describe("RouteEndpoint", () => {
  expectTypeOf<RouteEndpoint<"GET", "/auth/:oauth", {}>>().toEqualTypeOf<{
    method: "GET";
    route: "/auth/:oauth";
    config: {};
    handler: RouteHandler<"/auth/:oauth", {}>;
  }>();

  // @ts-expect-error
  expectTypeOf<RouteEndpoint<"GET", "auth/:oauth", {}>>().toEqualTypeOf<{
    method: "GET";
    route: "/auth/:oauth";
    config: {};
    handler: RouteHandler<"/auth/:oauth", {}>;
  }>();

  expectTypeOf<
    RouteEndpoint<
      "GET",
      "/auth/:oauth",
      {
        schemas: {
          searchParams: ZodObject<{ state: ZodString }>;
        };
      }
    >
  >().toEqualTypeOf<{
    method: "GET";
    route: "/auth/:oauth";
    config: {
      schemas: { searchParams: ZodObject<{ state: ZodString }> };
    };
    handler: RouteHandler<
      "/auth/:oauth",
      {
        schemas: {
          searchParams: ZodObject<{ state: ZodString }>;
        };
      }
    >;
  }>();
});

describe("InferMethod", () => {
  expectTypeOf<
    InferMethod<[RouteEndpoint<"GET", "/auth/:oauth", {}>]>
  >().toEqualTypeOf<"GET">();
  expectTypeOf<
    InferMethod<
      [
        RouteEndpoint<"GET", "/auth/:oauth", {}>,
        RouteEndpoint<"GET", "/auth/session", {}>,
      ]
    >
  >().toEqualTypeOf<"GET">();
  expectTypeOf<
    InferMethod<
      [
        RouteEndpoint<"GET", "/auth/:oauth", {}>,
        RouteEndpoint<"POST", "/auth/signOut", {}>,
      ]
    >
  >().toEqualTypeOf<"GET" | "POST">();
  expectTypeOf<
    InferMethod<
      [
        RouteEndpoint<"GET", "/auth/:oauth", {}>,
        RouteEndpoint<"POST", "/auth/signOut", {}>,
        RouteEndpoint<"PUT", "/auth/session", {}>,
      ]
    >
  >().toEqualTypeOf<"GET" | "POST" | "PUT">();
});
