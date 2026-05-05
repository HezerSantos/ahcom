import { MdNavigateNext, MdNavigateBefore } from "react-icons/md";
import React, { useCallback, useRef } from "react"
import '../../assets/styles/carousel.css'


interface CarouselProps {
    name: string
    children: React.ReactNode
}

export const Carousel: React.FC<CarouselProps> = ({name, children}) => {
    const carouselContent = useRef<null | HTMLDivElement>(null)

    const goRight = useCallback(() => {
        carouselContent?.current?.scrollBy({
            left: carouselContent?.current?.offsetWidth * 0.15,
            behavior: 'smooth'
        })
    }, [])
    const goLeft = useCallback(() => {
        carouselContent?.current?.scrollBy({
            left: -carouselContent?.current?.offsetWidth * 0.15,
            behavior: 'smooth'
        })
    }, [])
    return(
        <>
            <div className="carousel">
                <div className="carousel-info">
                    <h1>{name}</h1>
                    <span>
                        <button onClick={() => goLeft()}><MdNavigateBefore /></button>
                        <button onClick={() => goRight()}><MdNavigateNext /></button>
                    </span>
                </div>
                <div className="carousel-content" ref={carouselContent}>
                    {children}
                </div>
            </div>
        </>
    )
}

interface CarouselItemProps {
    children: React.ReactNode
}
export const CarouselItem: React.FC<CarouselItemProps> = ({children}) => {
    return(
        <>
            <div className="carousel-item">
                {children}
            </div>
        </>
    )
}