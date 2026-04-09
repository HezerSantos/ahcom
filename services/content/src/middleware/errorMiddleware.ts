import { ErrorRequestHandler } from "express";

//@ts-ignore
const errorMiddleware: ErrorRequestHandler = (err, req, res, next) => {
    // console.log(err)
    console.error(`Error ${err.status || 500 }:`)
    console.error(`   Path: @${req.path}`)
    console.error(`   Filename: @${err.filename}`)
    console.error(`   Message: ${err.message || 'Internal Server Error'}`)


    res.status(err.status || 500).json({
      success: false,
      message: "An Error Has Occured",
      errors: err.json || {msg: 'Internal Server Error'},
    } as ResponseJSON);
}

export default errorMiddleware