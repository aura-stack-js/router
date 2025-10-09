/**
 * The HTTP status codes used in AuraStack Router.
 */
const statusCode = {
    OK: 200,
    CREATED: 201,
    ACCEPTED: 202,
    NO_CONTENT: 204,
    MULTIPLE_CHOICES: 300,
    MOVED_PERMANENTLY: 301,
    FOUND: 302,
    SEE_OTHER: 303,
    NOT_MODIFIED: 304,
    TEMPORARY_REDIRECT: 307,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    NOT_ACCEPTABLE: 406,
    PROXY_AUTHENTICATION_REQUIRED: 407,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    HTTP_VERSION_NOT_SUPPORTED: 505,
}

/**
 * Reverse mapping of status codes to their corresponding status text.
 */
const statusText = Object.entries(statusCode).reduce(
    (previous, [status, code]) => {
        return { ...previous, [code]: status as keyof typeof statusCode }
    },
    {} as Record<number, keyof typeof statusCode>
)

/**
 * Defines the errors used in AuraStack Router. Includes HTTP status code and
 * status text.
 */
export class AuraStackRouterError extends Error {
    public readonly status: number
    public readonly statusText: keyof typeof statusCode

    constructor(type: keyof typeof statusCode, message: string, name?: string) {
        super(message)
        this.name = name ?? "AuraStackRouterError"
        this.status = statusCode[type]
        this.statusText = statusText[this.status]
    }
}
