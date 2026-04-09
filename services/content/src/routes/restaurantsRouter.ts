import { Router } from "express";
import { getRestaurantPOIs, saveRestaurantPOI } from "../controllers/restaurantsController";
import { passportAuthenticate } from "../helpers/passportHelper";
import { createReview } from "../controllers/reviewsController";


const restaurantsRouter = Router()

restaurantsRouter.get("/", passportAuthenticate(), getRestaurantPOIs)
restaurantsRouter.post("/:id/save", passportAuthenticate(), saveRestaurantPOI)
restaurantsRouter.post("/:id/review", passportAuthenticate(), createReview)
export default restaurantsRouter