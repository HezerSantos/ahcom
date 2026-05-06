import { RequestHandler } from "express";
import { fetchPOIs, fetchRestaurantPOI } from "../helpers/restaurantPOIHelper";
import { DeleteItemCommand, DeleteItemCommandInput, PutItemCommandInput, QueryCommand, QueryCommandInput, TransactionCanceledException, TransactWriteItem, TransactWriteItemsCommand, TransactWriteItemsInput } from "@aws-sdk/client-dynamodb";
import { validate } from 'uuid'
import { errorHelpers, returnError } from "../helpers/errorHelper";
import dotenv from 'dotenv'
import dynamodbClient from "../services/dynamodbService";
import { deleteSavedRestaurantValidator, saveRestaurantValidator } from "../validators/restaurantValidator";
import { validationResult } from "express-validator";
dotenv.config()


const SCORE_MAP = new Map<string, number>([
  // Dining (core food)

  ["100-1000-0002", 120], // Fine Dining
  ["100-1000-0001", 100], // Casual Dining
  ["100-1000-0008", 95],  // Bistro
  ["100-1000-0005", 95],  // Taqueria
  ["100-1000-0006", 85],  // Deli
  ["100-1000-0000", 80],  // Restaurant (generic)

  // Fast / convenience food
  ["100-1000-0009", 90],  // Fast Food
  ["100-1000-0003", 90],  // Take Out and Delivery Only
  ["100-1000-0007", 75],  // Cafeteria
  ["100-1000-0004", 85],  // Food Market-Stall

  // Drinks / light food
  ["100-1100-0010", 60],  // Coffee Shop
  ["100-1100-0331", 55],  // Tea House
  ["100-1100-0000", 60],  // Coffee-Tea (generic)
]);

// function latLngToTile(lat: number, lng: number, zoom: number) {
//   const n = Math.pow(2, zoom);

//   const x = Math.floor(((lng + 180) / 360) * n);

//   const latRad = lat * Math.PI / 180;
//   const y = Math.floor(
//     (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n
//   );

//   return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`
// }

const calculatePOIScore = (item: any, mode: 'best' | 'quick' | 'explore') => {
    const distance = item.distance as number
    // Normalize distance. If you don't divide by 1000, 
    // the distance penalty swallows the category score whole.
    const distKm = distance / 1000; 

    const categories = item.categories as any[]
    const primaryCategory = categories.find(c => c.primary) || categories[0] || { id: 'default' };

    let score = SCORE_MAP.get(primaryCategory.id) ?? 50;

    // Quality boosts
    if (item.references?.length > 1) score += 15; 
    if (item.contacts?.[0]?.www) score += 5;

    switch (mode) {
        case 'quick':
            // High penalty for distance, bonus for fast food
            score -= (distKm * 40); 
            if (["100-1000-0009", "100-1000-0003"].includes(primaryCategory.id)) score += 20;
            break;

        case 'explore':
            // Low penalty for distance, bonus for fine dining
            score -= (distKm * 10);
            if (primaryCategory.id === "100-1000-0002") score += 25; 
            break;

        case 'best':
        default:
            // Medium penalty
            score -= (distKm * 20);
            break;
    }

    return [score, item]
}

const processPOIResults = (results: any[]): Record<string, any[]> => {
    const best = results.map(item => calculatePOIScore(item, 'best')) as any []
    const quick = results.map(item => calculatePOIScore(item, 'quick')) as any[]
    const explore = results.map(item => calculatePOIScore(item, 'explore')) as any[]

    return {
        "best": best.sort((a, b) => b[0] - a[0]).slice(0,20),
        "quick": quick.sort((a, b) => b[0] - a[0]).slice(0,15),
        "explore": explore.sort((a, b) => b[0] - a[0]).slice(0,30)
    }
}

export const getRestaurantPOIs: RequestHandler = async(req, res, next) => {
    try{
        if (req.query.lat === undefined || req.query.lon === undefined){
            errorHelpers.badRequestQueryError("ERROR BINDING QUERY LAT AND LON", __filename)
            return
        }
        const lat = parseFloat(String(req.query.lat))
        const lon = parseFloat(String(req.query.lon))

        const poiResults = await fetchPOIs(lat, lon)

        if (!poiResults[0]) {
            next(poiResults[1])
            return
        }

        const processedPOIResults = processPOIResults(poiResults[1])
        res.status(200).json({
            success: true,
            message: "Restaurants retrieved successfully",
            poiResults: processedPOIResults
        } as ResponseJSON)
    } catch (error) {
        next(error)
    }


}


export const saveRestaurantPOI: RequestHandler[] = [
    ...saveRestaurantValidator,
    async(req, res, next) => {
        try{
            //Checkst express-validator for errors
            const errors = validationResult(req)
            if (!errors.isEmpty()) {
                errorHelpers.badRequestParamsError("INVALID REQUEST PARAMS RESTAURANT ID", __filename)
                return
            }
            //Checks to see if the uuid on USER OBJECT is valid
            //Probably is and redundant but checks
            if (!validate(req.user?.id)) {
                errorHelpers.authError("USER ID NOT UUID", __filename)
                return
            }

            const restaurantHEREId = String(req.params.id)



            let runHEREQuery = true         //Flag check to see whether to run the HERE API
            let parsedRestaurantInfo = null //Placeholder to overwrite with HERE API Data or DYNAMODB

            //Get restaurant item input from Dynamodb
            const queryRestaurantItemInput: QueryCommandInput = {
                TableName: "AHCOM",
                IndexName: "GSI1-index",
                KeyConditionExpression: "GSI1_PK = :hereId",
                ExpressionAttributeValues: {
                    ":hereId": {S: `HERE#${restaurantHEREId}`}
                }
            }
            

            //Dynamodb Query to GET Restaurant Info
            const queryRestaurantItemCommand = new QueryCommand(queryRestaurantItemInput)
            const queryRestaurantInfo = await dynamodbClient.send(queryRestaurantItemCommand)
        
            //Condition Check to see if restaurant EXISTS in DynamoDB
            if (queryRestaurantInfo.Items?.length) {
                parsedRestaurantInfo = queryRestaurantInfo.Items[0]
                runHEREQuery = false
            }
            
            //If runHereQuery === true; RUN HERE API
            if (runHEREQuery) {
                const parsedRestaurantInfoResult = await fetchRestaurantPOI(restaurantHEREId, __filename)
                if (parsedRestaurantInfoResult !== undefined) {
                    parsedRestaurantInfo = parsedRestaurantInfoResult
                }
            }

            //Type Check to ENSURE that parsedRestaurantInfo is populated
            if (!parsedRestaurantInfo) {
                errorHelpers.networkError("ERROR PARSING RESTAURANT INFO", __filename)
                return
            }

            const transactItemsList: TransactWriteItem[] = []
            //ADD the Restaurant ID to User in DynamoDB
            const putUserItemInput: PutItemCommandInput = {
                TableName: "AHCOM",
                Item: {
                    "PK": {S: `USER#${req.user?.id}`},
                    "SK": {S: `RESTAURANT#${parsedRestaurantInfo.info.M?.id.S}`}
                },
                ConditionExpression: "attribute_not_exists(PK)"
            }

            transactItemsList.push({Put: putUserItemInput})

            //If HERE API Ran; Create the record in DB
            if (runHEREQuery) {
                const putRestaurantItemInput: PutItemCommandInput = {
                    TableName: "AHCOM",
                    Item: {
                        "PK": {S: `RESTAURANT#${parsedRestaurantInfo.info.M?.id.S}`},
                        "SK": {S: `METADATA`},
                        "GSI1_PK": {S: `HERE#${parsedRestaurantInfo.info.M?.hereId.S}`},
                        "GSI1_SK": {S: `TIMESTAMP#${parsedRestaurantInfo.info.M?.id.S}`},
                        "info": {M: {...parsedRestaurantInfo.info.M} }
                    },
                    ConditionExpression: "attribute_not_exists(PK)"
                }
                transactItemsList.push({Put: putRestaurantItemInput})
            }

            const transactItemInput: TransactWriteItemsInput = {
                TransactItems: transactItemsList
            }

            const transactWriteItemsCommand = new TransactWriteItemsCommand(transactItemInput)
            await dynamodbClient.send(transactWriteItemsCommand)

            res.status(200).json(
                {
                    success: true,
                    progress: `${runHEREQuery? "HERE API" : "DYNAMODB"} Ran`,
                    message: `${parsedRestaurantInfo.info.M?.name.S} has been added to your list`,
                    id: parsedRestaurantInfo.info.M?.id.S
                } as ResponseJSON
            )
            
        } catch(error) {
            if (error instanceof TransactionCanceledException) {
                if (error.CancellationReasons && error.CancellationReasons.length > 0){
                    if (error.CancellationReasons[0].Code === 'ConditionalCheckFailed'){
                        const newError = returnError(`The conditional request failed`, 400, __filename, {code:"INVALID_REQUEST_PARAMS", msg:"Restaurant already saved"})
                        next(newError)
                        return
                    }
                }
            }
            next(error)
        }
    }
]

export const deleteSavedRestaurant: RequestHandler[] = [
    ...deleteSavedRestaurantValidator,
    async(req, res, next) => {
        try{
            const errors = validationResult(req)

            if (!errors.isEmpty()) {
                errorHelpers.badRequestParamsError("RESTAURANT ID INVALID", __filename, errors.array())
                return
            }
            if (!validate(req.user?.id)) {
                console.log(req.user?.id)
                errorHelpers.authError("USER ID NOT UUID", __filename)
                return
            }

            const deleteSavedRestaurantInput: DeleteItemCommandInput = {
                TableName: "AHCOM",
                Key: {
                    "PK": { S: `USER#${req.user?.id}`},
                    "SK": { S: `RESTAURANT#${req.params.id}`}
                },
                ReturnValues: "ALL_OLD"
            }

            const deletedSavedRestaurant = await dynamodbClient.send(new DeleteItemCommand(deleteSavedRestaurantInput))
            if (!deletedSavedRestaurant.Attributes) {
                res.status(404).json({
                    "success": true,
                    "errors": {
                        "message": "Item deleted did not exist.",
                        "code": "NOT_FOUND"
                    }
                })
                return
            } else {
                res.status(200).json({
                    "success": true,
                    "message": "Item successfully deleted.",
                    "attributes": deletedSavedRestaurant.Attributes
                })
            }
        } catch(error) {
            next(error)
        }
    }
]