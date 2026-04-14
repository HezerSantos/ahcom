import { Router } from "express";
import { deleteReviewById } from "../controllers/reviewsController";

const reviewsRouter = Router()

reviewsRouter.delete("/:id", deleteReviewById)

export default reviewsRouter