import { Link } from "react-router-dom"
interface RestaurantItemProps {
    name: string
    distance: number
    image: string
    rating?: number
}
const RestaurantItem: React.FC<RestaurantItemProps> = ({name, distance, rating, image}) => {
    return(
        <>
            <div className="restaurant-item">
                <div className="restaurant-image">
                    <img src={image} alt="" />
                </div>
                <div className="restaurant-info">
                    <p className="restaurant-name">{name}</p>
                    <p className="restaurant-distance">{distance} miles</p>
                    <Link to="" className="restaurant-directions">Get Directions</Link>
                    <p className="restaurant-rating">Rating:{rating?? "-"}</p>
                </div>
            </div>
        </>
    )
}

export default RestaurantItem