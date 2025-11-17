import { createRouter } from "./router.js"
import { GlobalMiddleware, RouterConfig } from "./types.js"

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
