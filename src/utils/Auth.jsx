"use client"

import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { message } from "antd"
import axios from "axios"
import { getCookieConvertToken } from "../api/user"

// Create a Higher-Order Component (HOC) instead of a hook
const Auth = (WrappedComponent) => {
    // Return a new component
    return function WithAuthComponent(props) {
        const navigate = useNavigate()
        const [errorCount, setErrorCount] = useState(0)

        // Check if user is logged in
        useEffect(() => {
            const checkUser = async () => {
                const token = localStorage.getItem("Authorization")
                if (!token) {
                    const res = await getCookieConvertToken()
                    if (res.code !== 200) {
                        localStorage.clear()
                        navigate("/login")
                    } else {
                        localStorage.setItem("Authorization", res.data.token)
                        localStorage.setItem("Username", res.data.username)
                        localStorage.setItem("UserId", res.data.userId)
                        navigate("/")
                    }
                }
            }

            checkUser()
        }, [navigate])

        // Set global request headers
        useEffect(() => {
            const token = localStorage.getItem("Authorization")
            if (token) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
            }
        }, [])

        // Response interceptor
        useEffect(() => {
            const interceptor = axios.interceptors.response.use(
                (response) => response,
                (error) => {
                    if (error.response?.status === 401) {
                        setErrorCount((prevCount) => prevCount + 1)
                    }
                    return Promise.reject(error)
                }
            )

            return () => {
                axios.interceptors.response.eject(interceptor) // Clean up interceptor
            }
        }, [])

        // Check error count and show message
        useEffect(() => {
            if (errorCount > 0) {
                localStorage.clear()
                navigate("/login") // Redirect to login page
                message.error("登录已过期，请重新登录")
            }
        }, [errorCount, navigate])

        // Render the wrapped component with all props
        return <WrappedComponent {...props} />
    }
}

export default Auth
