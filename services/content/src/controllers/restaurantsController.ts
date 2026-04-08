import { RequestHandler } from "express";
import { fetchPOIs } from "../helpers/restaurantPOIHelper";
import { GetItemCommand, GetItemCommandInput, PutItemCommandInput, TransactionCanceledException, TransactWriteItem, TransactWriteItemsCommand, TransactWriteItemsInput } from "@aws-sdk/client-dynamodb";
import { validate } from 'uuid'
import throwError, { returnError } from "../helpers/errorHelper";
import axios, { AxiosError } from "axios";
import dotenv from 'dotenv'
import dynamodbClient from "../services/dynamodbService";
dotenv.config()

export const getRestaurantPOIs: RequestHandler = async(req, res, next) => {
    try{
        if (req.query.lat === undefined || req.query.lon === undefined){
            throwError("ERROR BINDING BODY LAT AND LON", 400, __filename, {code:"INVALID_BODY", msg:"Bad Request"})
            return
        }
        const lat = parseFloat(String(req.query.lat))
        const lon = parseFloat(String(req.query.lon))

        const poiResults = await fetchPOIs(lat, lon)

        if (!poiResults[0]) {
            next(poiResults[1])
            return
        }
        console.log(poiResults[1].length)
        res.status(200).json({poiResults: poiResults[1]})
    } catch (error) {
        next(error)
    }


}


export const saveRestaurantPOI: RequestHandler = async(req, res, next) => {
    try{
        //Checks to see if the uuid on USER OBJECT is valid
        //Probably is and redundant but checks
        if (!validate (req.user?.id)) {
            throwError("ERROR VALIDATING USER ID ON SAVE RESTAURANT", 401, __filename, {code: "INVALID_USER", msg:"Unauthorized"})
            return
        }

        const restaurantId = req.body.restaurantId



        let runHEREQuery = true         //Flag check to see whether to run the HERE API
        let parsedRestaurantInfo = null //Placeholder to overwrite with HERE API Data or DYNAMODB

        //Get restaurant item input from Dynamodb
        const getRestaurantItemInput: GetItemCommandInput = {
            TableName: "AHCOM",
            Key: {
                "PK": {S: `RESTAURANT#${restaurantId}`},
                "SK": {S: `METADATA`}
            }
        }

        //Dynamodb Query to GET Restaurant Info
        const getRestaurantItemCommand = new GetItemCommand(getRestaurantItemInput)
        const getRestaurantInfo = await dynamodbClient.send(getRestaurantItemCommand)
    
        //Condition Check to see if restaurant EXISTS in DynamoDB
        if (getRestaurantInfo.Item !== undefined) {
            parsedRestaurantInfo = getRestaurantInfo.Item
            runHEREQuery = false
        }
        
        //If runHereQuery === true; RUN HERE API
        if (runHEREQuery) {
            try{
                const urlParams = new URLSearchParams()
                urlParams.append("id", restaurantId)
                urlParams.append("apiKey", String(process.env.HERE_SECRET))
                const restaurantQuery = await axios.get("https://lookup.search.hereapi.com/v1/lookup", { params: urlParams })
                const restaurantInfo = restaurantQuery.data

                const parsedCategories = restaurantInfo.categories.map((item:{name: string}) => {
                    return {S: item.name}
                })
                parsedRestaurantInfo = {
                    info: {
                        M: {
                            id: {S:restaurantInfo.id},
                            lat: {S:restaurantInfo.position.lat},
                            lng: {S:restaurantInfo.position.lng},
                            name: {S:restaurantInfo.title},
                            address: {S:restaurantInfo.address.label},
                            categories: {L: parsedCategories}
                        }
                    }
                }
            } catch (e) {
                const axiosError = e as AxiosError
                console.log(axiosError)
                if (axiosError.status === 404){
                    throwError("ERROR FINDING UNKNOWN RESTAURANT", 404, __filename, {code:"INVALID_BODY", msg:"Restaurant Not Found"})
                } else {
                    throwError("AXIOS NETWORK ERROR", axiosError.status || 500, __filename, {code:"INVALID_SERVER", msg:"Error fetching restaurant"})
                }
            }
        }

        //Type Check to ENSURE that parsedRestaurantInfo is populated
        if (!parsedRestaurantInfo) {
            throwError("ERROR PARSING RESTAURANT INFO", 500, __filename, {code:"INVALID_SERVER", msg:"Internal Server Error"})
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
                progress: `${runHEREQuery? "HERE API" : "DYNAMODB"} Ran`,
                msg: `${parsedRestaurantInfo.info.M?.name.S} has been added to your list`,
                id: parsedRestaurantInfo.info.M?.id.S
            }
        )
        
    } catch(error) {
        if (error instanceof TransactionCanceledException) {
            if (error.CancellationReasons && error.CancellationReasons.length > 0){
                if (error.CancellationReasons[0].Code === 'ConditionalCheckFailed'){
                    const newError = returnError(`The conditional request failed`, 400, __filename, {code:"INVALID_BODY", msg:"Restaurant already saved"})
                    next(newError)
                    return
                }
            }
        }
        console.error(error)
        next(error)
    }
}