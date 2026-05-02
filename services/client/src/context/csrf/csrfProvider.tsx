import { ReactNode, useState } from "react";
import CsrfContext from "./csrfContext";
import { jwtDecode } from 'jwt-decode'
import axios from "axios";
import api from "../../app.config";

interface CsrfProviderProps {
    children: ReactNode
}

interface GetCookieType {
    (cookie: string): string | undefined
}

interface DecodeCookieType {
    (cookie: string): string
}

interface DecodedType {
    csrfToken: string,
    key: number
}

const encodedTokens = [
  'OWQxZmM3Y2I3NDJiMGE4YTBiMDRiYmNiNGQzYzhjOTMxNGExZjRiYmEzMzI1ODllY2YyM2JlNDBhYmY4N2QzYg==',
  'ZDJmZGY1ZTU4YzYxNzRiNjQ3MjFmNzdmODE0ODIzYTI1Y2Q1NGQyMzgyZTJjNWZhMTEyZGYyYzBkMDBiYjY4Nw==',
  'YmQ5ZWJkOGUzNTA0ZjlkOGNiZDg2YjMxZDRlNjBlOWQ1ZTZjZjkxN2YzNTE3YWU3YjFmNWFiZjg3ODVkMzE1ZQ==',
  'YTJjM2Q1ZjJhYTUwOWQ1YTI3MTQ3OGYwYmJhNjZjMzdhMmMxODVmOTAyNjgzNmJiMGQ2NjIyMzA0ODkwZTJlYQ==',
  'YjdlNmYzZDRkNjZjOGFjMzUyZjEyMmI0OGRjN2UzYThmZmJlZWIzZjI5MWIzODI4ZjU2ZmQ2MzliYTBhOGJlNA==',
  'NjgyOTJjNmEzZmRjMmI5YWJiYjRiOTQ5YjM5ZDU0MWYxZDFiZmE1NjVlYjI0ODVlYTcyNWQ0YWRmOTZmZTk5NA==',
  'MGY3ZjhiNDE3NzFmOWYyNjUzZDIzOGE1NTk0NWQxZjNhMTNmMmY1NGExMmQ0M2RmOWNlNWYzMzQxYWVlZDRlMQ==',
  'ZjFhOGE3NGI2MDFhMWU2ZWNiMTJlMmUwODMyOWNmMmYwOGFiMWZlNDBlMDU5OTdiOTRjNDNkNTljNzA3N2JmYQ==',
  'NzBlZGM4NGM0MWRjOTFhM2YwYjhhNmQ1YTI2YTUzYjAwNTExYzg1YzA1YzRlMTNlMDY0YjRhOTZiMzdkZjk4YQ==',
  'MjBlNGE2ZmU4ZTZmMTY0YmFmMDFlOTZmODBhMmQyNWIxMTBkODg1NzRkNDFjZGU3OWY1Y2U4NmViMmYwZjcxMQ=='
];

const tokens = encodedTokens.map(t => atob(t));


type TransformCookieType = (csrfToken: string, key: number) => string

const transformCookie: TransformCookieType = (csrfToken, key) => {
    const mappedToken = Array.from(csrfToken)
    
    const transformedToken = mappedToken.map((char, index) => {
        return char + tokens[key][index]
    })
    
    return transformedToken.join("")
}   

const CsrfProvider:React.FC<CsrfProviderProps> = ({children}) => {
    const [ csrfToken, setCsrfToken ] = useState<string | null>(null)

    const getCookie: GetCookieType = (cookie) => {
        const cookies: string[] = document.cookie.split(";")
        const cookieMap: Map<string, string> = new Map(
        cookies
            .map(cookie => cookie.split("=").map(str => str.trim())) // Split and trim
            .filter(([key, value]) => key && value) // Ensure both key and value are present
            .map(([key, value]) => [key, value] as [string, string]) // Type cast to [string, string] for safety
        );
        return cookieMap.get(cookie)
    }

    const decodeCookie: DecodeCookieType = (cookie) => {
        const targetCookie: string | undefined = getCookie(cookie)
        const decoded: DecodedType = jwtDecode(String(targetCookie))
        const newCsrf = transformCookie(decoded.csrfToken, decoded.key)
        setCsrfToken(newCsrf)
        return newCsrf
    }

    const getCsrf = async() => {
        try{
            await axios.get(`${api.url}/api/csrf`)
            const btoa = 'X19TZWN1cmUtYXV0aC5jc3Jm' //__Secure-auth.csrf
            const newCsrf = decodeCookie(atob(btoa))
            return newCsrf
        } catch(error){
            console.error(error)
        }
    }

    return(
        <CsrfContext.Provider value={{csrfToken, decodeCookie, getCsrf}}>
            {children}
        </CsrfContext.Provider>
    )
}

export default CsrfProvider