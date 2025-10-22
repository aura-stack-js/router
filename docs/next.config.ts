import { createMDX } from "fumadocs-mdx/next"
import { NextConfig } from "next"

const withMDX = createMDX({})

const config: NextConfig = {
    reactStrictMode: true,
    serverExternalPackages: ["typescript", "twoslash"],
}

export default withMDX(config)
