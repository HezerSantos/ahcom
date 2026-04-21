import express from 'express'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import errorMiddleware from './middleware/errorMiddleware'
import contentRouter from './routes/contentRouter'
dotenv.config()
const app = express()

app.use(cookieParser())
app.use(express.json())

app.use("/content", contentRouter)

app.use((req, res) => {
  console.error(`Error ${404 }:`)
  console.error(`   Path: @${req.url}`)
  console.error(`   Filename: @${__filename}`)
  console.error(`   Message: ${"PATH ON CONTENT NOT FOUND"}`)
  res.status(404).json({
    "code":"NOT_FOUND",
    "message":"The requested resource could not be found.",
    "success":false
  });
});

app.use(errorMiddleware)
const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, "0.0.0.0", () => {
    console.log(`App running on Port ${PORT}`)
})