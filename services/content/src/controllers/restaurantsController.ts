import { RequestHandler } from "express";
import { fetchPOIs } from "../helpers/restaurantPOIHelper";

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