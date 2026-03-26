import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import errorMiddleware from './middleware/errorMiddleware'
dotenv.config()
const app = express()

app.use(cookieParser())
app.use(express.json())

app.use(errorMiddleware)
const PORT = Number(process.env.PORT) || 3000
app.listen(PORT, "0.0.0.0", () => {
    console.log(`App running on Port ${PORT}`)
})