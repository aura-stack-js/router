import { ZodObject, ZodString } from "zod"
import { createEndpoint } from "./endpoint.js"
import { createRouter } from "./router.js"
import { GlobalMiddleware, RouteEndpoint, RouterConfig, GetHttpHandlers, RouteHandler } from "./types.js"

const globalMiddleware: GlobalMiddleware = async (request) => {
    const url = new URL(request.url)
    if (url.pathname === "/api/v1") {
        return Response.redirect("https://unstable.aura-stack.com", 302)
    }
    return request
}

const authorizationMiddleware: GlobalMiddleware = async (request) => {
    const headers = new Headers(request.headers)
    if (!headers.has("Authorization")) {
        return Response.json({ message: "Unauthorized" }, { status: 401 })
    }
    return request
}
const onError: RouterConfig["onError"] = (error, request) => {
    console.error("Router error:", error)
    return Response.json({ message: "Internal Server Error" }, { status: 500 })
}

export const router = createRouter([], {
    middlewares: [globalMiddleware],
    onError: (error, request) => {
        console.error("Router error:", error)
        return Response.json({ message: "Internal Server Error" }, { status: 500 })
    },
})

type createRouter = <const Endpoints extends RouteEndpoint[]>(
    endpoints: Endpoints,
    config: RouterConfig
) => GetHttpHandlers<Endpoints>

export type OnErrorHandler = (error: unknown, request: Request) => Response | Promise<Response>

const nose = createRouter([
    createEndpoint("GET", "/users/me", () => Response.json({ message: "User me" })),
    createEndpoint("GET", "/users/:id", () => Response.json({ message: "User by id" })),
])

const end: RouteHandler<
    "/auth/:oauth",
    {
        schemas: {
            searchParams: ZodObject<{ state: ZodString }>
        }
    }
> = (request, ctx) => {
    const { oauth } = ctx.params
    const { state } = ctx.searchParams
    return Response.json({ message: `OAuth: ${oauth}, State: ${state}` })
}
