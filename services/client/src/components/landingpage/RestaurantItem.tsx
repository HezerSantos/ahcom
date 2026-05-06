import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

interface RestaurantItemProps {
    name: string
    distance: number
    position: {
        lat: number
        lng: number
    }
    rating?: number
}

const MAPBOX_PK = import.meta.env.VITE_MAPBOX_PK

const RestaurantItem: React.FC<RestaurantItemProps> = ({name, distance, rating, position}) => {
    const [ imageUrl, setImageUrl ] = useState("")
    useEffect(() => {
        if(position){
            const geoJson = {
            "type": "Feature",
            "properties": {
                "marker-color": "#FF6B6B",
                "marker-symbol": "marker",
                "marker-size": "large"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [position.lng, position.lat]
            }
            }

        const encoded = encodeURIComponent(JSON.stringify(geoJson))
        const final = `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/geojson(${encoded})/${position.lng},${position.lat},16/500x500?access_token=${MAPBOX_PK}`
        setImageUrl(final)
        }
    }, [position])
    return(
        <>
            <div className="restaurant-item">
                <div className="restaurant-image">
                    <img src={imageUrl} alt="" />
                </div>
                <div className="restaurant-info">
                    <p className="restaurant-name">{name}</p>
                    <p className="restaurant-distance">{distance.toFixed(2)} miles</p>
                    <Link to="" className="restaurant-directions">Get Directions</Link>
                    <p className="restaurant-rating">Rating:{rating?? "-"}</p>
                </div>
            </div>
        </>
    )
}

export default RestaurantItem