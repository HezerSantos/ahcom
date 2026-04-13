import { RequestHandler } from "express";
import { createReviewValidator, getReviewsByRestaurantIdValidator } from "../validators/reviewValidator";
import { validationResult } from "express-validator";
import throwError from "../helpers/errorHelper";
import { validate } from "uuid";
import { AttributeValue, PutItemCommand, PutItemCommandInput, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { v7 } from 'uuid'
import dynamodbClient from "../services/dynamodbService";
import { fetchRestaurantPOI } from "../helpers/restaurantPOIHelper";
import { UUID } from "node:crypto";

interface RestaurantInfoType {
    info: {
        M: {
            [key: string]: AttributeValue
        }
    }
}

export const createReview: RequestHandler[] = [
    ...createReviewValidator,
    async(req, res, next) => {
        try{
            //Checkst express-validator for errors
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                throwError("REQUEST BODY INVALID", 400, __filename, {code:"INVALID_BODY", msg:"Bad Request", validationErrors: errors.array()})
                return
            }

            //Base variable to save req.content.restaurant
            let restaurantInfoBase: RestaurantInfoType | null = req.content?.restaurant

            //Final variable to overwrite that is type asserted
            let typedRestaurantInfo: RestaurantInfoType
            //Creates the restaurant record if it does not exist to attatch review
            if (restaurantInfoBase === null) { //SHOULD NEVER RUN IF UUID DOES NOT EXIST OR IF HEREID GSI PK DOES EXIST
                console.log("HERE API RAN")    //MAKE SURE VALIDATION STEPS HANDLE THIS PROPERLY
                //Use helper function to lookup with HERE ID with HERE API
                const fetchPOIResult = await fetchRestaurantPOI(String(req.params.id), __filename) //Potentially creates duplicate
                //It returns RestaurantInfoType | undefined                                        //Important to check if HEREID GSI PK Exists BEFORE RUNNING
                if (fetchPOIResult !== undefined) {
                    //If it is not undefined then overwrite asserted variable
                    typedRestaurantInfo = fetchPOIResult

                    //Create METADATA Record for Restaurant
                    const putRestaurantItemInput: PutItemCommandInput = {
                        TableName: "AHCOM",
                        Item: {
                            "PK": { S: `RESTAURANT#${typedRestaurantInfo.info.M.id.S}`},
                            "SK": { S: `METADATA` },
                            "GSI1_PK": { S: `HERE#${typedRestaurantInfo.info.M.hereId.S}`},
                            "GSI1_SK": { S: `TIMESTAMP#${typedRestaurantInfo.info.M.id.S}` },
                            "info": { M: {...typedRestaurantInfo.info.M} }
                        },
                        ConditionExpression: "attribute_not_exists(PK)" //Probably never run cause the uuid will always be unique
                    }

                    try {
                        const putRestaurantItemCommand = new PutItemCommand(putRestaurantItemInput);
                        await dynamodbClient.send(putRestaurantItemCommand);
                    } catch (error: any) {
                        console.log(error)
                        // If it already exists, that's fine! Just move on to posting the review.
                        if (error.name !== "ConditionalCheckFailedException") {
                            throw error; // Rethrow if it's a real error (like a 500 or network issue)
                        }
                    }
                } else {
                    //This will probably never run
                    //The catch block is guaranteed to throw an error
                    throwError("RESTAURANT INFO RETURNED UNDEFINED", 500, __filename, {"message": "INTERNAL SERVER ERROR", code:"INVALID_SERVER"})
                    return
                }
            } else {
                //If restaurantInfoBase is not null, assert then overwrite asserted variable
                typedRestaurantInfo = restaurantInfoBase
            }
        
            //Verify user id is UUID
            const userId = String(req.user?.id)
            const verifiedUserId = validate(userId)
            if (!verifiedUserId) {
                throwError("USERID NOT UUID", 401, __filename, {code:"INVALID_USER", msg:"UNAUTHORIZED"})
                return
            }
            //STOP GETTING CONFUSED:
            //THE SK FETCHES ALL REVIEWS FOR SPECIFIC RESTAURANT
            //THE GSI FETCHES EVERY SINGLE REVIEW EVER IN BUCKETS
            const newReviewId = v7()
            const shardNumber = Math.floor(Math.random() * 10) + 1
            const putReviewItemInput: PutItemCommandInput = {
                TableName: "AHCOM",
                Item: {
                    "PK": { S: `RESTAURANT#${typedRestaurantInfo.info.M.id.S}`},    //PK UUID
                    "SK": { S: `REVIEW#${newReviewId}`},                            //SK UUID
                    "GSI1_PK": { S: `REVIEWSHARD#${shardNumber}`},                  //PK Shard Buckets: Fetch ALL Reviews
                    "GSI1_SK": { S: `REVIEW#${newReviewId}`},                       //SK TIMESTAMP UUID V7
                    "GSI2_PK": { S: `USER#${userId}`},                              //PK UUID
                    "GSI2_SK": { S: `REVIEW#${newReviewId}`},                       //SK TIMESTAMP UUID V7
                    "rating": { N: String(req.body.rating) },   
                    "review": { S: String(req.body.reviewMessage) },
                    "userId": { S: userId }
                }
            }

            const putReviewItemCommand = new PutItemCommand(putReviewItemInput)
            await dynamodbClient.send(putReviewItemCommand)

            res.status(201).json({
                "success": true,
                "message": `Created Review For Restaurant ${typedRestaurantInfo.info.M.id.S}`,
                "reviewMessage": req.body.reviewMessage,
                "rating": req.body.rating
            })
        } catch(error) {
            next(error)
        }
    }
]

export const getReviewsByRestaurantId: RequestHandler[] = [
    ...getReviewsByRestaurantIdValidator,
    async(req, res, next) => {
        try{
            //Validation Errors Only Occur IF Restaurant ID is not valid (MISSING OR NON EXISTENT)
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                throwError("PARAM INVALID", 400, __filename, {code:"INVALID_BODY", msg:"Bad Request", validationErrors: errors.array()})
                return
            }

            //VALIDATION SETS RESTAURANT ID AND ATTATCHES TO CONTENT
            //Probably will never be null because validation error runs
            const restaurantId = req.content?.restaurantId as UUID | null
            let queryInput: QueryCommandInput | null
            //Query by UUID because if there are reviews then
            //UUID is Guaranteed to exist
            if (restaurantId) {
                queryInput = {
                    TableName: "AHCOM",
                    KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
                    ExpressionAttributeValues: {
                        ":pk": { S: `RESTAURANT#${restaurantId}` },
                        ":skPrefix": { S: `REVIEW#` }
                    },
                    ScanIndexForward: false
                }
            } else {
                queryInput = null
            }

            //Safety check. Probably Will never run
            if (!queryInput) {
                throwError("QUERY INPUT NULL", 500, __filename, {code:"INVALID_SERVER", msg:"Internal Server Error"})
                return
            }

            //AWS query
            const restaurantReviews = await dynamodbClient.send(new QueryCommand(queryInput))

            //IF No Reviews
            if (!restaurantReviews.Items?.length) {
                res.status(200).json({
                    "success": true,
                    "restaurantReviews": [],
                    "message": "No Reviews Found",
                    "id": restaurantId
                })
                return
            } else {
                //IF Reviews
                //Map it to remove gsi keys
                const mappedReviews = restaurantReviews.Items.map(review => {
                    return {
                        "id": review.SK.S,
                        "rating": review.rating.S,
                        "review": review.review.S,
                        "userId": review.userId.S
                    }
                })

                res.status(200).json({
                    "success": true,
                    "restaurantReviews": mappedReviews,
                    "message": "Restaurant Reviews Found",
                    "id": restaurantId
                })
                return
            }
        } catch (error) {
            next(error)
        }
    }
]