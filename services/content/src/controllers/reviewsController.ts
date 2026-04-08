import { RequestHandler } from "express";
import { createReviewValidator } from "../validators/reviewValidator";
import { validationResult } from "express-validator";
import throwError from "../helpers/errorHelper";
import { validate } from "uuid";

export const createReview: RequestHandler[] = [
    ...createReviewValidator,
    async(req, res, next) => {
        try{
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                throwError("REQUEST BODY INVALID", 400, __filename, {code:"INVALID_BODY", msg:"Bad Request", validationErrors: errors.array()})
                return
            }

            const userId = String(req.user?.id)
            const verifiedUserId = validate(userId)
            if (!verifiedUserId) {
                throwError("USERID NOT UUID", 401, __filename, {code:"INVALID_USER", msg:"UNAUTHORIZED"})
                return
            }

            


        } catch(error) {
            next(error)
        }
    }
]