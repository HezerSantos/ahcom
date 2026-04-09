import { GetItemCommand, GetItemCommandInput } from "@aws-sdk/client-dynamodb";
import { body, param } from "express-validator";
import { validate } from "uuid";
import dynamodbClient from "../services/dynamodbService";

const isHereId = (id: string): boolean => {
  // Matches 'here:pds:place:' followed by exactly 32 alphanumeric/dash characters
  const hereIdRegex = /^here:pds:place:[a-z0-9-]{32}$/i;
  return hereIdRegex.test(id);
};

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
            if (validId) {
                return true
            }
            if (isHereId(restaurantId)) {
                return true
            }
            throw new Error("INVALID RESTAURANT ID")
        })
        .bail()
        .custom( async(restaurantId, {req}) => {
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
                req.content.restaurant = res.Item
            } else {
                req.content.restaurant = null
            }
            return true
        })
]