import path from "path"

/**
 * Sanitizes a given string by decoding URL-encoded characters, replacing multiple
 * consecutive slashes with a single slash and removing any trailing slash.
 *
 * @param str - The input string to be sanitized.
 * @returns The sanitized string.
 */
export const sanitizer = (str: string): string => {
    const decodedUrl = decodeURIComponent(str).replace(/[^a-zA-Z0-9/_-]/g, "")
    return decodedUrl.replace(/\/{2,}/g, "/").replace(/\/$/, "")
}
