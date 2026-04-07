import { Router } from "express";
import { getRestaurantPOIs } from "../controllers/restaurantsController";


const restaurantsRouter = Router()

restaurantsRouter.get("/", getRestaurantPOIs)

export default restaurantsRouter