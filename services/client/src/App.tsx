import { useContext, useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import CsrfContext from './context/csrf/csrfContext'
import api from './app.config'
function App() {
  const csrfContext = useContext(CsrfContext)
  const [ isLoading, setIsLoading ] = useState(true)
  useEffect(() => {
    if (import.meta.env.MODE === 'production') {
      console.warn = () => {}
      console.error = () => {}
      console.info = () => {}
      console.debug = () => {}
    }
  }, [])

  useEffect(() => {
    const getCredentials = async() => {
      try{
        await api.get(`/api/auth/public`)
        await api.get(`/api/csrf`)
        csrfContext?.decodeCookie("__Secure-auth.csrf")
        setIsLoading(false)
      } catch(e){
        console.error(e)
      }
    }

    // getCredentials()
  }, [])

  return (
    <>
      {isLoading && (
        <Outlet />
      )}
    </>
  )
}

export default App