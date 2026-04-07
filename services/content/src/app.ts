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

app.use((_, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use(errorMiddleware)
const PORT = Number(process.env.PORT) || 3001
app.listen(PORT, "0.0.0.0", () => {
    console.log(`App running on Port ${PORT}`)
})