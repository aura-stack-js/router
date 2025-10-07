export class RouterError extends Error {
    public statusCode: number

    constructor(message: string, statusCode: number = 500) {
        super(message)
        this.name = "RouterError"
        this.statusCode = statusCode
        Object.setPrototypeOf(this, RouterError.prototype)
    }
}

export class MismatchRouteError extends RouterError {
    constructor(message: string) {
        super(message, 400)
        this.name = "MismatchRouteError"
        Object.setPrototypeOf(this, MismatchRouteError.prototype)
    }
}

export class InvalidSearchParamsError extends RouterError {
    constructor(message: string) {
        super(message, 400)
        this.name = "InvalidSearchParamsError"
        Object.setPrototypeOf(this, InvalidSearchParamsError.prototype)
    }
}

export class InvalidRequestBodyError extends RouterError {
    constructor(message: string) {
        super(message, 400)
        this.name = "InvalidRequestBodyError"
        Object.setPrototypeOf(this, InvalidRequestBodyError.prototype)
    }
}

export class UnsupportedHTTPMethodError extends RouterError {
    constructor(message: string) {
        super(message, 405)
        this.name = "UnsupportedHTTPMethodError"
        Object.setPrototypeOf(this, UnsupportedHTTPMethodError.prototype)
    }
}

export class InvalidHandlerError extends RouterError {
    constructor(message: string) {
        super(message, 500)
        this.name = "InvalidHandlerError"
        Object.setPrototypeOf(this, InvalidHandlerError.prototype)
    }
}

export class InvalidRouteError extends RouterError {
    constructor(message: string) {
        super(message, 500)
        this.name = "InvalidRouteError"
        Object.setPrototypeOf(this, InvalidRouteError.prototype)
    }
}
