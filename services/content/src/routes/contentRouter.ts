import { Router } from "express";
import restaurantsRouter from "./restaurantsRouter";
import reviewsRouter from "./reviewsRouter";


const contentRouter = Router()

contentRouter.use("/restaurants", restaurantsRouter)
contentRouter.use("/reviews", reviewsRouter)
export default contentRouter