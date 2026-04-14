import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv'
import redisClient from '../services/redisService';
import throwError from './errorHelper';
import { v5 } from 'uuid';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
dotenv.config()

type GetTileType = (lat: number, lon: number) => [number, number]
type HaverSineType = (lat1: number, lon1: number, lat2: number, lon2: number) => number
type FetchPOIsType = (
    lat: number,
    lon: number,
    radius?: number,
    categories?: string,
    limit?: number
) => Promise<[boolean, any]>
interface POIResult {
    id: string;
    title: string;
    address: any;
    position: { lat: number, lng: number };
    distance: number;
    [key: string]: any;
}

const LAT_TILE_SIZE = 0.09; 
const LON_TILE_SIZE = 0.11;
const CACHE_THRESHOLD_METERS = 2500;

const getTile: GetTileType = (lat, lon) => {
    const x = Math.floor(lon / LON_TILE_SIZE);
    const y = Math.floor(lat / LAT_TILE_SIZE);
    return [x,y];
}

const haversine: HaverSineType = (lat1, lon1, lat2, lon2) => {
    const R = 6371000; // meters
    const toRad = (deg: number) => deg * Math.PI / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat/2)**2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // meters
}

/**
 * Fetch POIs from HERE with grid-based caching
 */
export const fetchPOIs: FetchPOIsType = async(lat, lon, radius = 1000, categories = '100-1000', limit = 20) => {
    // Get tile coordinates
    const [x, y] = getTile(lat, lon)
    const allNearbyResults = [];
    let foundAnyAnchor = false;
    // Gather points in 9 surrounding tiles
    for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
            const key = `${x+dx}:${y+dy}`;
            let tileEntriesCached = await redisClient.lRange(key, 0, -1);
            const tileEntries = tileEntriesCached.map(item => JSON.parse(item))
            if (tileEntries) {
                for (const entry of tileEntries) {
                    if (haversine(lat, lon, entry.lat, entry.lon) <= CACHE_THRESHOLD_METERS) {
                        allNearbyResults.push(...entry.results);
                        foundAnyAnchor = true;
                    }
                }
            }
        }
    }

    if (foundAnyAnchor) {
        const uniqueMap = new Map<string, POIResult>();

        for (const item of allNearbyResults) {
            // Only add if not seen, OR if this version of the item is somehow 'better'
            if (!uniqueMap.has(item.id)) {
                // Update the distance property to be relative to the CURRENT location
                const actualDistance = haversine(lat, lon, item.position.lat, item.position.lng);
                
                uniqueMap.set(item.id, { 
                    ...item, 
                    distance: actualDistance // Overwrite the stale API distance
                });
            }
        }

        const sorted = Array.from(uniqueMap.values()).sort((a, b) => a.distance - b.distance);
        console.log("CACHE HIT")
        return [true, sorted.slice(0, limit)];
    }

    // Not found → call API
    console.log(lat)
    console.log(lon)
    const params = new URLSearchParams();
    params.append('at', `${lat},${lon}`);
    params.append('radius', `${radius}`);
    params.append('categories', categories);
    params.append('limit', `${limit}`);
    params.append('apiKey', String(process.env.HERE_SECRET)); // replace locally

    try {
        const res = await axios.get('https://browse.search.hereapi.com/v1/browse', { params });
        const results = res.data.items;

        // Cache it
        const tileKey = `${x}:${y}`;
        const newAnchor = JSON.stringify({ lat, lon, radius, results });
        
        await redisClient.rPush(tileKey, newAnchor);
        await redisClient.expire(tileKey, 3600)

        return [true, results];
    } catch (e) {
        const axiosError = e as AxiosError
        return [false, axiosError];
    }
}


interface RestaurantInfoType {
    info: {
        M: {
            [key: string]: AttributeValue
        }
    }
}
type FetchRestaurantPOIType = (restaurantId: string, filename: string) => Promise<RestaurantInfoType | undefined>

export const fetchRestaurantPOI: FetchRestaurantPOIType = async(restaurantId, filename) => {
    try{
        const urlParams = new URLSearchParams()
        urlParams.append("id", restaurantId)
        urlParams.append("apiKey", String(process.env.HERE_SECRET))
        const restaurantQuery = await axios.get("https://lookup.search.hereapi.com/v1/lookup", { params: urlParams })
        const restaurantInfo = restaurantQuery.data
        console.log(restaurantInfo)
        const parsedCategories = restaurantInfo.categories.map((item:{name: string}) => {
            return {S: item.name}
        })

        const MY_NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

        const newRestaurantId = v5(restaurantInfo.id, MY_NAMESPACE)
        return {
            info: {
                M: {
                    id: {S:newRestaurantId},
                    hereId: {S: restaurantInfo.id},
                    lat: {S:restaurantInfo.position.lat ?? "0"},
                    lng: {S:restaurantInfo.position.lng ?? "0"},
                    name: {S:restaurantInfo.title},
                    address: {S:restaurantInfo.address.label},
                    categories: {L: parsedCategories}
                }
            }
        }
    } catch (e) {
        const axiosError = e as AxiosError
        if (axiosError.status === 404){
            throwError("ERROR FINDING UNKNOWN RESTAURANT", 404, filename, {code:"NOT_FOUND", msg:"Restaurant Not Found"})
        } else {
            throwError("AXIOS NETWORK ERROR", axiosError.status || 500, filename, {code:"INVALID_SERVER", msg:"Error fetching restaurant"})
        }
    }
}