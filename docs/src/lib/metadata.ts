import { Metadata } from "next"

const title = "@aura-stack/router"
const description = "It is a modern, TypeScript-first router and endpoint definition library for TypeScript backend applications."

const url = process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://aura-stack.dev"

export const metadata: Metadata = {
    title: {
        template: `%s | ${title}`,
        default: title,
    },
    description,
    openGraph: {
        title,
        description,
    },
    twitter: {
        title,
        description,
    },
    metadataBase: new URL(url),
}
