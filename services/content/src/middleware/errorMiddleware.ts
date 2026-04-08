import { ErrorRequestHandler } from "express";

//@ts-ignore
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    console.error(`Error ${err.status || 500 }:`)
    console.error(`   Path: @${req.path}`)
    console.error(`   Filename: @${err.filename}`)
    console.error(`   Message: ${err.message || 'Internal Server Error'}`)


    res.status(err.status || 500).json({
      errors: err.json || {msg: 'Internal Server Error'},
    });
}

export default errorMiddleware