import { Router } from "express";
import { getRestaurantPOIs, saveRestaurantPOI } from "../controllers/restaurantsController";
import { passportAuthenticate } from "../helpers/passportHelper";
import { createReview } from "../controllers/reviewsController";


const restaurantsRouter = Router()

restaurantsRouter.get("/", passportAuthenticate(), getRestaurantPOIs)
restaurantsRouter.post("/save", passportAuthenticate(), saveRestaurantPOI)
restaurantsRouter.post("/:id/review", createReview)
export default restaurantsRouter