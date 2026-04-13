import { GetItemCommand, GetItemCommandInput, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { body, param } from "express-validator";
import { validate } from "uuid";
import dynamodbClient from "../services/dynamodbService";

const isHereId = (id: string): boolean => {
  // Matches 'here:pds:place:' followed by exactly 32 alphanumeric/dash characters
  const hereIdRegex = /^here:pds:place:[a-z0-9-]+$/i;
  return hereIdRegex.test(id);
};

export const createReviewValidator = [
    body("reviewMessage")
        .trim()
        .notEmpty()
        .isLength({min: 1}).withMessage("Review must exist"),
    body("rating")
        .notEmpty(),
    param("id")
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
            if (!req.content) {
                req.content = {}
            }
            const validUuid = validate(restaurantId)
            if (validUuid) {
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
                    //Dont set to null because HERE ID is needed to create Restaurant Record
                    //HERE ID does not exist at this point
                    throw new Error("RESTAURANT DOES NOT EXIST")
                }
            } else {
                const queryRestaurantItemInput: QueryCommandInput = {
                    TableName: "AHCOM",
                    IndexName: "GSI1-index",
                    KeyConditionExpression: "GSI1_PK = :hereId",
                    ExpressionAttributeValues: {
                        ":hereId": {S: `HERE#${restaurantId}`}
                    }
                }

                const queryRestaurantItemCommand = new QueryCommand(queryRestaurantItemInput)

                const res = await dynamodbClient.send(queryRestaurantItemCommand)

                if (res.Items !== undefined){
                    if (res.Items.length > 1){
                        throw new Error("DUPLICATE RESTAURANT FOUND")
                    }
                    if (res.Items.length){
                        req.content.restaurant = res.Items[0]
                    } else {
                        req.content.restaurant = null
                    }
                } else {
                    req.content.restaurant = null
                }
            }
            return true
        })
]

export const getReviewsByRestaurantIdValidator = [
    param("id")
        .isString()
        .custom( async(id, {req}) => {
            if (!req.content) {
                req.content = {}
            }
            const isUuid = validate(id)
            const isHEREId = isHereId(id)

            //Check for if UUID
            if (isUuid) {
                const getItemCommandInput: GetItemCommandInput = {
                    TableName: "AHCOM",
                    Key: {
                        "PK": { S: `RESTAURANT#${id}`},
                        "SK": { S: `METADATA`}
                    }
                }
                const res = await dynamodbClient.send(new GetItemCommand(getItemCommandInput))
                if (res.Item !== undefined) {
                    req.content.restaurantId = id //SETS ID FOR CONTROLLER
                    return true
                } else {
                    req.content.restaurantId = null
                }
            }
            //Check to see if Here Id
            if (isHEREId) {
                const queryItemCommandInput: QueryCommandInput = {
                    TableName: "AHCOM",
                    IndexName: "GSI1-index",
                    KeyConditionExpression: "GSI1_PK = :hereId",
                    ExpressionAttributeValues: {
                        ":hereId": { S: `HERE#${id}`}
                    }
                }

                const res = await dynamodbClient.send(new QueryCommand(queryItemCommandInput))

                if (res.Items?.length) {
                    req.content.restaurantId = res.Items[0].info.M?.id.S //SETS ID FOR CONTROLLER
                    return true
                } else {
                    req.content.restaurantId = null
                }
            }

            req.content.restaurantId = null
            throw new Error("Restaurant Does Not Exist")
        })
]