import { ErrorRequestHandler } from "express";

//@ts-ignore
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    console.error(`Error ${err.status || 500 }: ${err.message || 'Internal Server Error'} @${__filename}`)
    res.status(err.status || 500).json({
      errors: err.json || {msg: 'Internal Server Error'},
    });
}

export default errorMiddleware