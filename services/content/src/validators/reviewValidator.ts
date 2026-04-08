import { body } from "express-validator";

export const createReviewValidator = [
    body("reviewMessage")
        .exists()
        .trim()
        .isLength({min: 1}).withMessage("Review must exist"),
    body("rating")
        .exists()
        .trim()
        .isNumeric().withMessage("Rating must be numeric")
]