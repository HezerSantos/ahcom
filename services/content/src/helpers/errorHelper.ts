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
export default throwError