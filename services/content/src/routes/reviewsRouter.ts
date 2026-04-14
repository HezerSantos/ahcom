import { Router } from "express";
import { deleteReviewById } from "../controllers/reviewsController";
import { passportAuthenticate } from "../helpers/passportHelper";

const reviewsRouter = Router()

reviewsRouter.delete("/:id", passportAuthenticate(), deleteReviewById)

export default reviewsRouter