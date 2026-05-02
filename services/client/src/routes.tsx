import App from "./App";
import LandingPage from "./pages/LandingPage";
const routes = [
    {
        path: "/",
        element: <App/>,
        errorElement: null,
        children: [
            {
                index: true,
                element: <LandingPage />
            },
        ]
    }
]

export default routes