import { Router } from "express";
import { getRestaurantPOIs, saveRestaurantPOI } from "../controllers/restaurantsController";
import { passportAuthenticate } from "../helpers/passportHelper";


const restaurantsRouter = Router()

restaurantsRouter.get("/", passportAuthenticate(), getRestaurantPOIs)
restaurantsRouter.post("/save", passportAuthenticate(), saveRestaurantPOI)

export default restaurantsRouter