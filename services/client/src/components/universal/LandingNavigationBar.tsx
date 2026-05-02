import { PageSection, PageSectionChild } from "./PageSection"
import logo from '../../assets/images/logo.svg'
import { Link } from "react-router-dom"
import { IoSearchOutline } from "react-icons/io5";
import { RxHamburgerMenu } from "react-icons/rx";


const LandingNavigationBar: React.FC = () => {
    return(
        <>
            <PageSection>
                <PageSectionChild>
                    <nav className="landing-navigation-bar">
                        <div className="landing-navigation-logo">
                            <div>
                                <img src={logo} alt="ahcom logo" />
                                <h1>ahcom</h1>
                            </div>
                        </div>
                        <div className="landing-navigation-interact">
                            <ul>
                                <li><Link to={""} className="sansation-bold">Home</Link></li>
                                <li><Link to={""} className="sansation-bold">Discover</Link></li>
                                <li><Link to={""} className="sansation-bold">Profile</Link></li>
                            </ul>
                            <div>
                                <div>
                                    <div>
                                        <label className="sansation-bold" htmlFor="destinationName">Where</label>
                                        <input className="sansation-bold" type="text" placeholder="Search destinations" id="destinationName"/>
                                    </div>
                                </div>
                                <div>
                                    <div>
                                        <label className="sansation-bold" htmlFor="categoryName">Category</label>
                                        <select className="sansation-bold" name="categoryName" id="categoryName" defaultValue={"default"}>
                                            <option value="default" disabled hidden>Add category</option>
                                            <option>Food</option>
                                            <option>Food</option>
                                            <option>Food</option>
                                            <option>Food</option>
                                        </select>
                                    </div>

                                    <button><IoSearchOutline /></button>
                                </div>
                            </div>
                        </div>
                        <div className="landing-navigation-base">
                            <label className="switch">
                                <input type="checkbox" />
                                <span className="slider"></span>
                            </label>
                            <button><RxHamburgerMenu /></button>
                        </div>
                    </nav>
                </PageSectionChild>
            </PageSection>
        </>
    )
}

export default LandingNavigationBar