import { Router } from "express";
import restaurantsRouter from "./restaurantsRouter";


const contentRouter = Router()

contentRouter.use("/restaurants", restaurantsRouter)

export default contentRouter