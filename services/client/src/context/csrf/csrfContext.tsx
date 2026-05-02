import { createContext } from "react";

interface CsrfContextType {
    csrfToken: string | null
    decodeCookie: (cookie: string) => void
    getCsrf: () => Promise<string | undefined>
}

const CsrfContext = createContext<CsrfContextType | null>(null)

export default CsrfContext