import React, { SetStateAction, useEffect, useState } from "react"
import LandingNavigationBar from "../components/universal/LandingNavigationBar"
import DiscoverSection from "../components/landingpage/DiscoverSection"
import axios from "axios"
import PoiResultsType from "../types/poiResultsType"
import Footer from "../components/universal/Footer"

const fetchRestaurantPOIs = async(setRestaurantData: React.Dispatch<SetStateAction<any>>) => {
    try{
        const res = await axios.get("http://localhost:8080/api/content/restaurants?lat=35.22038824078856&lon=-89.77516194987392")
        const restaurantData = res.data.poiResults as PoiResultsType
        console.log(restaurantData)
        setRestaurantData(restaurantData)
    } catch (error) {
        console.error(error)
    }
}

const LandingPage: React.FC = () => {
    const [ restaurantData, setRestaurantData ] = useState<PoiResultsType | null>(null)
    useEffect(() => {
       fetchRestaurantPOIs(setRestaurantData)
    }, [])
    return(
        <>
            <LandingNavigationBar />
            <DiscoverSection restaurantData={restaurantData}/>
            <Footer />
        </>
    )
}

export default LandingPage