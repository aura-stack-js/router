import { describe, bench } from "vitest"
import { EndpointConfig, RouteEndpoint, RoutePattern } from "../src/types"
import { createRouter } from "../src/router.js"

describe("createRouter benchmark", () => {
    bench("createRouter with 100 endpoints", () => {
        const endpoints = Array.from({ length: 100 }).map<RouteEndpoint>((_, idx) => ({
            method: "GET",
            route: `/endpoint-${idx}` as RoutePattern,
            handler: async () => {
                return Response.json({ message: `Endpoint ${idx}` })
            },
            config: {} as EndpointConfig<`/endpoint-${number}`, {}>,
        }))

        createRouter(endpoints)
    })

    bench("createRouter with 100 endpoints and make a request", async () => {
        const endpoints = Array.from({ length: 100 }).map<RouteEndpoint>((_, idx) => ({
            method: "GET",
            route: `/endpoint-${idx}` as RoutePattern,
            handler: async () => {
                return Response.json({ message: `Endpoint ${idx}` })
            },
            config: {} as EndpointConfig<`/endpoint-${number}`, {}>,
        }))

        const { GET } = createRouter(endpoints)
        await GET(new Request("https://example.com/endpoint-42"))
    })
})
