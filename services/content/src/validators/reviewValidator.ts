import { GetItemCommand, GetItemCommandInput } from "@aws-sdk/client-dynamodb";
import { body, param } from "express-validator";
import { validate } from "uuid";
import dynamodbClient from "../services/dynamodbService";

export const createReviewValidator = [
    body("reviewMessage")
        .trim()
        .notEmpty()
        .isLength({min: 1}).withMessage("Review must exist"),
    body("rating")
        .notEmpty()
        .isInt({min: 1, max: 5}).withMessage("Rating must be numeric"),
    param("restaurantId")
        .exists()
        .trim()
        .custom( restaurantId => {
            const validId = validate(restaurantId)
            if (!validId) {
                throw new Error("INVALID RESTAURANT ID")
            } else {
                return true
            }
        })
        .bail()
        .custom( async(restaurantId) => {
            const getRestaurantItemInput: GetItemCommandInput = {
                TableName: "AHCOM",
                Key: {
                    "PK": {S: `RESTAURANT#${restaurantId}`},
                    "SK": {S: "METADATA"}
                }
            }

            const getRestaurantItemCommand = new GetItemCommand(getRestaurantItemInput)
            const res = await dynamodbClient.send(getRestaurantItemCommand)

            if (res.Item !== undefined) {
                return true
            } else {
                throw new Error("RESTAURANT DOES NOT EXIST")
            }
        })
]