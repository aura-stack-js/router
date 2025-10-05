import { describe, test } from "vitest";
import { createEndpoint, createRoutePattern } from "../src/endpoint.js";
import type { HTTPMethod, RoutePattern } from "../src/types.js";

describe("createRoutePattern", () => {
  const testCases = [
    {
      description: "Converts route without parameters to regex",
      route: "/about",
      expected: /^\/about$/,
    },
    {
      description: "Converts root route to regex",
      route: "/",
      expected: /^\/$/,
    },
    {
      description: "Converts route with one parameter to regex",
      route: "/users/:userId/books",
      expected: /^\/users\/([^\/]+)\/books$/,
    },
    {
      description: "Converts route with two parameters to regex",
      route: "/users/:userId/books/:bookId",
      expected: /^\/users\/([^\/]+)\/books\/([^\/]+)$/,
    },
  ];
  testCases.forEach(({ description, route, expected }) => {
    test.concurrent(description, ({ expect }) => {
      const regex = createRoutePattern(route as RoutePattern);
      expect(regex).toEqual(expected);
    });
  });
});

describe("createEndpoint", () => {
  describe("With valid configuration", () => {
    const testCases = [
      {
        description: "Create GET endpoint with route",
        method: "GET",
        route: "/users/:userId",
        expected: {
          method: "GET",
          route: "/users/:userId",
          config: {},
        },
      },
      {
        description: "Create POST endpoint with route",
        method: "POST",
        route: "/users",
        expected: {
          method: "POST",
          route: "/users",
          config: {},
        },
      },
      {
        description: "Create DELETE endpoint with route",
        method: "DELETE",
        route: "/users/:userId",
        expected: {
          method: "DELETE",
          route: "/users/:userId",
          config: {},
        },
      },
    ];

    testCases.forEach(({ description, method, route, expected }) => {
      test.concurrent(description, ({ expect }) => {
        const handler: any = () => {};
        const endpoint = createEndpoint(
          method as HTTPMethod,
          route as Lowercase<RoutePattern>,
          handler,
          {},
        );
        expect(endpoint).toEqual({ ...expected, handler });
      });
    });
  });

  describe("With invalid configuration", () => {
    const testCases = [
      {
        description: "Throws error for unsupported HTTP method",
        method: "FETCH",
        route: "/users",
        expected: /Unsupported HTTP method: FETCH/,
      },
    ];

    testCases.forEach(({ description, method, route, expected }) => {
      test.concurrent(description, ({ expect }) => {
        const handler: any = () => {};
        expect(() =>
          createEndpoint(
            method as HTTPMethod,
            route as Lowercase<RoutePattern>,
            handler,
            {},
          ),
        ).toThrowError(expected);
      });
    });
  });
});
