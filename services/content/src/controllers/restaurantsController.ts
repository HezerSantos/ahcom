import { RequestHandler } from "express";
import { fetchPOIs } from "../helpers/restaurantPOIHelper";
import { GetItemCommand, GetItemCommandInput, PutItemCommand, PutItemCommandInput, TransactWriteItem, TransactWriteItemsCommand, TransactWriteItemsInput } from "@aws-sdk/client-dynamodb";
import uuid from 'uuid'
import throwError from "../helpers/errorHelper";
import axios, { AxiosError } from "axios";
import dotenv from 'dotenv'
import dynamodbClient from "../services/dynamodbService";
dotenv.config()

const poiCache = new Map<string, any>()

export const getRestaurantPOIs: RequestHandler = async(req, res, next) => {
    try{
        console.log("RUN")
        const lat = parseFloat(req.body.lat)
        const lon = parseFloat(req.body.lon)

        const poiResults = await fetchPOIs(poiCache, lat, lon)

        if (!poiResults[0]) {
            next(poiResults[1])
            return
        }
        console.log(poiResults[1].length)
        res.status(200).json({poiResults: poiResults[1]})
    } catch (error) {
        console.error(error)
        next(error)
    }


}


export const saveRestaurantPOI: RequestHandler = async(req, res, next) => {
    try{
        //Checks to see if the uuid on USER OBJECT is valid
        //Probably is and redundant but checks
        if (!uuid.validate(req.user?.id)) {
            throwError("ERROR VALIDATING USER ID ON SAVE RESTAURANT @ /restaurant/save", 401, {code: "INVALID_USER", msg:"Unauthorized"})
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
                "SK": {S: `RESTAURANT`}
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
                
                parsedRestaurantInfo = {
                    id: {S:restaurantInfo.id},
                    lat: {S:restaurantInfo.position.lat},
                    lng: {S:restaurantInfo.position.lng},
                    name: {S:restaurantInfo.title},
                    address: {S:restaurantInfo.address.label},
                    operationHours: {S:restaurantInfo.openingHours[1].text},
                    categories: {S:restaurantInfo.categories}
                }
            } catch (e) {
                const axiosError = e as AxiosError
                if (axiosError.status === 404){
                    throwError("ERROR FINDING UNKNOWN RESTAURANT @ /restaurant/save", 404, {code:"INVALID_BODY", msg:"Restaurant Not Found"})
                } else {
                    throwError("AXIOS NETWORK ERROR @ /restaurant/save", 500, {code:"INVALID_SERVER", msg:"Error fetching restaurant"})
                }
            }
        }

        //Type Check to ENSURE that parsedRestaurantInfo is populated
        if (!parsedRestaurantInfo) {
            throwError("ERROR PARSING RESTAURANT INFO", 500, {code:"INVALID_SERVER", msg:"Internal Server Error"})
            return
        }
        
        const transactItemsList: TransactWriteItem[] = []

        //ADD the Restaurant ID to User in DynamoDB
        const putUserItemInput: PutItemCommandInput = {
            TableName: "AHCOM",
            Item: {
                "PK": {S: `USER#${req.user?.id}`},
                "SK": {S: `RESTAURANT#${parsedRestaurantInfo.id.S}`}
            }
        }

        transactItemsList.push({Put: putUserItemInput})

        //If HERE API Ran; Create the record in DB
        if (runHEREQuery) {
            const putRestaurantItemInput: PutItemCommandInput = {
                TableName: "AHCOM",
                Item: {
                    "PK": {S: `RESTAURANT#${parsedRestaurantInfo.id.S}`},
                    "SK": {S: `RESTAURANT`},
                    "info": {M: {...parsedRestaurantInfo} }
                }
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
                msg: `${parsedRestaurantInfo.name.S} has been added to your list`,
                id: parsedRestaurantInfo.id.S
            }
        )
        
    } catch(error) {
        next(error)
    }
}