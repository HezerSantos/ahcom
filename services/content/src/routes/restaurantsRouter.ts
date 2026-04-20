import { Router } from "express";
import { deleteSavedRestaurant, getRestaurantPOIs, saveRestaurantPOI } from "../controllers/restaurantsController";
import { passportAuthenticate } from "../helpers/passportHelper";
import { createReview, getReviewsByRestaurantId } from "../controllers/reviewsController";



const restaurantsRouter = Router()

restaurantsRouter.get("/", passportAuthenticate(), getRestaurantPOIs)
restaurantsRouter.post("/:id/saved", passportAuthenticate(), saveRestaurantPOI)
restaurantsRouter.post("/:id/reviews", passportAuthenticate(), createReview)
restaurantsRouter.get("/:id/reviews", passportAuthenticate(), getReviewsByRestaurantId)
restaurantsRouter.delete("/:id/saved", passportAuthenticate(), deleteSavedRestaurant)
export default restaurantsRouter