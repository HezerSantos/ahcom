interface ErrorDetails {
    (message: string,
    status: number,
    filename: string,
    json: Record<string, any>): void | HttpError
}

interface HttpErrorDetails {
    message: string,
    status: number,
    filename: string,
    json: Record<string, any>
}

class HttpError extends Error implements HttpErrorDetails{
  status: number
  filename: string
  json: Record<string, any>

  constructor(message: string, status: number, filename: string, json: Record<any, string>) {
    super(message)
    this.status = status
    this.json = json
    this.filename = filename
    Object.setPrototypeOf(this, HttpError.prototype)
  }
}

const throwError: ErrorDetails = (message, status, filename, json) => {
  throw new HttpError(message, status, filename, json)
}

export const returnError: ErrorDetails = (message, status, filename, json) => {
  return new HttpError(message, status, filename, json)
}


export const errorHelpers = {
  networkError: (errorMessage: string, filename: string) => 
    throwError(errorMessage, 500, filename, {
      message: "Oops! Looks like an error occured on our end.",
      code: "INVALID_SERVER_ERROR"
  }),

  authError: (errorMessage: string, filename: string) => 
    throwError(errorMessage, 401, filename, {
      message: "Authentication required. Please log in or provide a valid token.",
      code: "INVALID_AUTHORIZATION_ERROR"
  }),
  genericBadRequestError: (errorMessage: string, filename: string, validationErrors: any[]) =>
    throwError(errorMessage, 400, filename, {
      message: "Invalid request. Please check the data you provided.",
      code: "INVALID_REQUEST",
      validationErrors: validationErrors
    }),
  badRequestBodyError: (errorMessage: string, filename: string, validationErrors?: any[]) => 
    throwError(errorMessage, 400, filename, {
      message: "Invalid request body. Please check the data you provided.",
      code: "INVALID_REQUEST_BODY",
      validationErrors: validationErrors ?? null
    }),

  badRequestParamsError: (errorMessage: string, filename: string, validationErrors?: any[]) => 
    throwError(errorMessage, 400, filename, {
      message: "Invalid URL parameters. Please verify the request path.",
      code: "INVALID_REQUEST_PARAMS",
      validationErrors: validationErrors ?? null
  }),

  badRequestQueryError: (errorMessage: string, filename: string, validationErrors? : any[]) => 
    throwError(errorMessage, 400, filename, {
      message: "Invalid query parameters. Please check your query values.",
      code: "INVALID_REQUEST_QUERY",
      validationErrors: validationErrors ?? []
  }),

  forbiddenError: (errorMessage: string, filename: string) => 
    throwError(errorMessage, 403, filename, {
      message: "Access denied. You do not have permission to perform this action.",
      code: "FORBIDDEN"
  }),
  notFoundError: (errorMessage: string, filename: string) => 
    throwError(errorMessage, 404, filename, {
      message: "The requested resource could not be found.",
      code: "NOT_FOUND"
  })
};
export default throwError