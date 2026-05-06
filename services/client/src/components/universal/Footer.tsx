import { Link } from "react-router-dom"
import { PageSection, PageSectionChild } from "./PageSection"


const Footer: React.FC = () => {
    return(
        <>
            <PageSection>
                <PageSectionChild>
                    <footer className="footer">
                        <p>© 2026 ahcom</p>
                        
                        <ul>
                            <li><Link to={""}>Privacy</Link></li>
                            <li>·</li>
                            <li><Link to={""}>Terms</Link></li>
                            <li>·</li>
                            <li><Link to={""}>Status</Link></li>
                        </ul>
                    </footer>
                </PageSectionChild>
            </PageSection>
        </>
    )
}

export default Footer