import { ErrorRequestHandler } from "express";

const errorMiddleware: ErrorRequestHandler = (err, _, res) => {
    console.error(`Error ${err.status || 500 }: ${err.message || 'Internal Server Error'} @${__filename}`)
    res.status(err.status || 500).json({
      errors: err.json || {msg: 'Internal Server Error'},
    });
}

export default errorMiddleware