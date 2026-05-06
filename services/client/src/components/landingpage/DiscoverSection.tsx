import { PageSection, PageSectionChild } from "../universal/PageSection"
import { Carousel, CarouselItem } from "../universal/Carousel"
import RestaurantItem from "./RestaurantItem"
import PoiResultsType from "../../types/poiResultsType"

interface DiscoverSectionProps {
    restaurantData: PoiResultsType | null
}
const DiscoverSection: React.FC<DiscoverSectionProps> = ({restaurantData}) => {
    return(
        <PageSection>
            <PageSectionChild>
                <div className="discover-section">
                    <Carousel name="Best Near You">
                        {restaurantData?.best.map((item, i) => {
                            return(
                                <CarouselItem key={i}>
                                    <RestaurantItem 
                                        name={item[1].title}
                                        distance={item[1].distance * 0.000621371}
                                        rating={undefined}
                                        position={item[1].position}
                                    />
                                </CarouselItem>
                            )
                        })}
                    </Carousel>
                    <Carousel name="Quickest Eats">
                        {restaurantData?.quick.map((item, i) => {
                            return(
                                <CarouselItem key={i}>
                                    <RestaurantItem 
                                        name={item[1].title}
                                        distance={item[1].distance * 0.000621371}
                                        rating={undefined}
                                        position={item[1].position}
                                    />
                                </CarouselItem>
                            )
                        })}
                    </Carousel>
                    <Carousel name="Explore New">
                        {restaurantData?.explore.map((item, i) => {
                            return(
                                <CarouselItem key={i}>
                                    <RestaurantItem 
                                        name={item[1].title}
                                        distance={item[1].distance * 0.000621371}
                                        rating={undefined}
                                        position={item[1].position}
                                    />
                                </CarouselItem>
                            )
                        })}
                    </Carousel>
                </div>
            </PageSectionChild>
        </PageSection>
    )
}

export default DiscoverSection