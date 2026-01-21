"use client"

import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { message } from "antd"
import axios from "axios"
import { getCookieConvertToken } from "../api/user"

// Create a Higher-Order Component (HOC) instead of a hook
const Auth = (WrappedComponent) => {
    // Return a new component
    return function WithAuthComponent(props) {
        const navigate = useNavigate()
        
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

        // Set global request headers and response interceptor
        useEffect(() => {
            const token = localStorage.getItem("Authorization")
            if (token) {
                axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
            }
            
            const interceptor = axios.interceptors.response.use(
                (response) => response,
                (error) => {
                    if (error.response?.status === 401) {
                        // Clear local storage and redirect to login
                        localStorage.clear()
                        navigate("/login")
                        message.error("登录已过期，请重新登录")
                    }
                    return Promise.reject(error)
                }
            )

            return () => {
                axios.interceptors.response.eject(interceptor) // Clean up interceptor
            }
        }, [navigate])

        // Render the wrapped component with all props
        return <WrappedComponent {...props} />
    }
}

export default Auth
