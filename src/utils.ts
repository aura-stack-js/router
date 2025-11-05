import { supportedProtocols } from "./assert.js"
import { AuraStackRouterError } from "./error.js"

/**
 * Sanitizes a given string by decoding URL-encoded characters, replacing multiple
 * consecutive slashes with a single slash and removing any trailing slash.
 *
 * @param str - The input string to be sanitized.
 * @returns The sanitized string.
 */
export const unstable_sanitizer = (str: string): string => {
    const decodedUrl = decodeURIComponent(str)
        .replace(/\/{2,}/g, "/")
        .replace(/\/(\.\/|\/)+/g, "/")
        .replace(/\/\.\.\//g, "/")
        .replace(/\s*\/\s*/g, "/")
    try {
        const url = new URL(decodedUrl)
        if (!supportedProtocols.has(url.protocol)) {
            throw new AuraStackRouterError("BAD_REQUEST", `The URL protocol '${url.protocol}' is not supported`)
        }
        const segments = url.pathname
            .split("/")
            .map((segment) => sanitizeSegment(segment.trim()))
            .filter((segment) => segment.length > 0 && segment !== "." && segment !== "..")
        url.pathname = segments.join("/")

        const searchParams = getSearchParams(url)
        url.search = new URLSearchParams(searchParams).toString()
        url.hash = ""
        return url.toString()
    } catch {
        throw new AuraStackRouterError("BAD_REQUEST", `The URL '${decodedUrl}' is not valid`)
    }
}

const getSearchParams = (url: URL): URLSearchParams => {
    const searchParams = new URLSearchParams()
    for (const [key, value] of url.searchParams.entries()) {
        const sanitizedKey = sanitizeQueryKey(key)
        const sanitizedValue = sanitizeQueryValue(value)
        if (sanitizedKey !== "" && sanitizedValue !== "") {
            searchParams.set(sanitizedKey, sanitizedValue)
        }
    }
    return searchParams
}

const sanitizeSegment = (str: string): string => {
    return str
        .replace(/[<>:"'|?*&]/g, "") // elimina caracteres peligrosos
        .replace(/%/g, "") // elimina restos de codificación parcial
        .replace(/\s{2,}/g, " ") // normaliza espacios
        .trim() // mantiene espacios válidos dentro
}

const sanitizeQueryKey = (str: string): string => {
    return str.replace(/[^a-z0-9\-_]/gi, "")
}

const sanitizeQueryValue = (str: string): string => {
    return str
        .replace(/[<>"'&]/g, "")
        .replace(/\.\.|[./\\]/g, "")
        .trim()
}
