import { Router } from "express";
import { deleteSavedRestaurant, getRestaurantPOIs, saveRestaurantPOI } from "../controllers/restaurantsController";
import { passportAuthenticate } from "../helpers/passportHelper";
import { createReview, getReviewsByRestaurantId, updateReviewByRestaurantId } from "../controllers/reviewsController";



const restaurantsRouter = Router()

restaurantsRouter.get("/", getRestaurantPOIs)
restaurantsRouter.post("/:id/saved", passportAuthenticate(), saveRestaurantPOI)
restaurantsRouter.post("/:id/reviews", passportAuthenticate(), createReview)
restaurantsRouter.get("/:id/reviews", passportAuthenticate(), getReviewsByRestaurantId)
restaurantsRouter.delete("/:id/saved", passportAuthenticate(), deleteSavedRestaurant)
restaurantsRouter.patch("/:restaurantId/reviews/:reviewId", passportAuthenticate(), updateReviewByRestaurantId)
export default restaurantsRouter