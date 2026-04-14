import { RequestHandler } from "express";
import { createReviewValidator, getReviewsByRestaurantIdValidator } from "../validators/reviewValidator";
import { validationResult } from "express-validator";
import { errorHelpers } from "../helpers/errorHelper";
import { validate } from "uuid";
import { AttributeValue, DeleteItemCommand, DeleteItemCommandInput, PutItemCommand, PutItemCommandInput, QueryCommand, QueryCommandInput } from "@aws-sdk/client-dynamodb";
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
                errorHelpers.genericBadRequestError("REQUEST BODY INVALID", __filename, errors.array())
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
                    errorHelpers.networkError("RESTAURANT INFOR RETURNED UNDEFINED", __filename)
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
                errorHelpers.authError("USERID NOT UUID", __filename)
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
                    "GSI3_PK": { S: `REVIEW#${newReviewId}`},                       //PK to fetch specific review
                    "GSI3_SK": { S: `USER#${userId}`},                              //SK for more ownership validation
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


export const deleteReviewById: RequestHandler[] = [

    async(req, res, next) => {
        try{
            //Additional check to ensure that userid is UUID
            const userId = String(req.user?.id)
            if (!validate(userId)) {
                errorHelpers.authError("USERID NOT UUID", __filename)
                return
            }

            //Convert reviewID to string from potential undefined
            const reviewId = String(req.params.id)

            //QUERY COMMAND INPUT
            //Finds the review with GSI3-index where PK is REVIEW#<reviewId>
            const reviewQueryInput: QueryCommandInput = {
                TableName: "AHCOM",
                IndexName: "GSI3-index",
                KeyConditionExpression: "GSI3_PK = :reviewId",
                ExpressionAttributeValues: {
                    ":reviewId": { S: `REVIEW#${reviewId}` }
                }
            }

            const reviewResponse = await dynamodbClient.send(new QueryCommand(reviewQueryInput))

            //Check to see if the review exists
            if (!reviewResponse.Items?.length) {
                errorHelpers.notFoundError("REVIEW NOT FOUND", __filename)
                return
            }
            
            //Parses the intitial response SK
            const parsedReviewUserId = reviewResponse.Items[0]['GSI3_SK'].S?.split("#")

            //Type assertion to check if it was formatted right
            const typedParsedReviewUserId = parsedReviewUserId ?? []

            //Check to avoid runtime error
            if (typedParsedReviewUserId.length > 1) {
                if (typedParsedReviewUserId[1] !== userId) {                                          //Index 1 is the reviewUserId
                    errorHelpers.forbiddenError("USERID DOES NOT MATCH REVIEW USER ID", __filename)   //Error if they dont match
                    return
                }
            } else {
                errorHelpers.networkError("GSI3_SK IS NOT OF RIGHT FORMAT", __filename)               //Should only run if the GSI3_SK is not the right format
            }
            


            const deleteReviewCommandInput: DeleteItemCommandInput = {
                TableName: "AHCOM",
                Key: {
                    "PK": { S: reviewResponse.Items[0].PK.S ?? "NOTFOUND"},
                    "SK": { S: reviewResponse.Items[0].SK.S ?? "NOTFOUND"}
                },
                ReturnValues: "ALL_OLD"
            }

            const deleteResponse = await dynamodbClient.send(new DeleteItemCommand(deleteReviewCommandInput))

            if (deleteResponse.Attributes !== undefined) {
                res.status(200).json({
                    "success": true,
                    "message": "Review successfully deleted",
                    "attributes": deleteResponse.Attributes
                })
                return
            } else {
                errorHelpers.networkError("ERROR DELETING REVIEW", __filename)
                return
            }
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
                errorHelpers.badRequestParamsError("RESTAURANT ID NOT VALID", __filename, errors.array())
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
                errorHelpers.networkError("ERROR IN VALIDATION HANDLER. QUERY INPUT NULL", __filename)
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