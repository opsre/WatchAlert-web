"use client"

import { useState, useEffect, useRef } from "react"
import {Layout, theme, Button, Typography, Spin, Result} from "antd"
import { LeftOutlined, LoadingOutlined } from "@ant-design/icons"
import "./index.css"
import { ComponentSider } from "./sider"
import Auth from "../utils/Auth"
import {getTenantList} from "../api/tenant";
import {getUserInfo} from "../api/user";

const Components = (props) => {
    const { name, c } = props
    const { Content } = Layout
    const [loading, setLoading] = useState(true)
    const [authorization, setAuthorization] = useState(null)
    const [tenantId, setTenantId] = useState(null)
    const [error, setError] = useState(false)
    const [isRendered, setIsRendered] = useState(false)
    const contentRef = useRef(null)

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    // 检查认证和租户信息
    useEffect(() => {
        let isMounted = true

        const checkAuthAndTenant = async () => {
            try {
                const auth = localStorage.getItem("Authorization")
                const tenant = localStorage.getItem("TenantID")

                if (!auth) {
                    setError(true)
                    setLoading(false)
                    return
                }

                // 如果有认证信息但没有租户信息，尝试获取用户信息
                if (auth && !tenant) {
                    try {
                        const userRes = await getUserInfo()
                        if (userRes.data?.userid) {
                            await fetchTenantList(userRes.data.userid)
                        }
                    } catch (err) {
                        console.error("Failed to fetch user info:", err)
                        setError(true)
                    }
                }

                // 再次检查租户信息
                const updatedTenant = localStorage.getItem("TenantID")
                if (isMounted) {
                    setAuthorization(auth)
                    setTenantId(updatedTenant)
                    setLoading(false)
                    setError(!updatedTenant)
                }
            } catch (error) {
                console.error("Error accessing localStorage:", error)
                if (isMounted) {
                    setError(true)
                    setLoading(false)
                }
            }
        }

        // 延迟检查逻辑
        const delayCheck = setTimeout(() => {
            checkAuthAndTenant()
        }, 500) // 延迟 500 毫秒

        return () => {
            isMounted = false
            clearTimeout(delayCheck)
        }
    }, [])

    // 监听渲染完成
    useEffect(() => {
        if (loading || error || !authorization || !tenantId) return

        const observer = new MutationObserver(() => {
            const timer = setTimeout(() => {
                setIsRendered(true)
                observer.disconnect()
            }, 300)

            return () => clearTimeout(timer)
        })

        if (contentRef.current) {
            observer.observe(contentRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                characterData: true
            })
        }

        const maxWaitTimer = setTimeout(() => {
            setIsRendered(true)
            observer.disconnect()
        }, 1500)

        return () => {
            observer.disconnect()
            clearTimeout(maxWaitTimer)
        }
    }, [loading, error, authorization, tenantId])

    const goBackPage = () => {
        window.history.back()
    }

    const fetchTenantList = async (userid) => {
        const auth = localStorage.getItem("Authorization")
        if (!auth) {
            console.error("Authorization token is missing")
            setError(true)
            return
        }

        try {
            const res = await getTenantList({ userId: userid })

            if (!res?.data || !Array.isArray(res.data) || res.data.length === 0) {
                console.error("No tenant data available")
                setError(true)
                return
            }

            const tenantOptions = res.data.map((tenant, index) => ({
                label: tenant.name,
                value: tenant.id,
                index: index,
            }))

            // 设置第一个租户为默认
            const firstTenant = tenantOptions[0]
            localStorage.setItem("TenantName", firstTenant.label)
            localStorage.setItem("TenantID", firstTenant.value)
            localStorage.setItem("TenantIndex", firstTenant.index)

            return tenantOptions
        } catch (error) {
            console.error("Failed to fetch tenant list:", error)
            setError(true)
            throw error
        }
    }

    // 全屏加载组件
    const FullScreenLoading = () => (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
                backgroundColor: 'white',
                zIndex: 9999,
                transition: 'opacity 0.3s ease-out'
            }}
        >
            <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} size="large" />
            <Typography.Text type="secondary" style={{ marginTop: 16 }}>
                {loading ? "正在验证用户信息..." : "页面准备中..."}
            </Typography.Text>
        </div>
    )

    // 错误组件
    const ErrorScreen = () => (
        <div
            style={{
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#f0f2f5",
            }}
        >
            <Result
                status="error"
                title={!authorization ? "用户无效" : "租户无效"}
                subTitle={!authorization ? "请先登录系统" : "未获取到有效的租户"}
                extra={[
                    <Button
                        type="primary"
                        key="login"
                        onClick={() => {
                            localStorage.clear()
                            window.location.href = "/login"
                        }}
                    >
                        返回登录
                    </Button>,
                ]}
            />
        </div>
    )

    // 状态检查优先级：加载中 > 错误/认证失败 > 渲染内容
    if (loading) {
        return <FullScreenLoading />
    }

    if (error || !authorization || !tenantId) {
        return <ErrorScreen />
    }

    // 主内容区域
    return (
        <>
            {/* 只有当内容完全渲染后才隐藏加载界面 */}
            {!isRendered && <FullScreenLoading />}

            <Layout
                style={{
                    height: "100vh",
                    overflow: "hidden",
                    background: "#000000",
                    opacity: isRendered ? 1 : 0, // 添加淡入效果
                    transition: 'opacity 0.3s ease-in'
                }}
                ref={contentRef}
            >
                <Layout style={{ background: "transparent", marginTop: "16px" }}>
                    {/* 侧边栏 */}
                    <div
                        style={{
                            width: "220px",
                            borderRadius: borderRadiusLG,
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                            height: "100%",
                            background: "#000000",
                        }}
                    >
                        <div style={{ height: "100%", overflow: "auto", padding: "16px 0", marginLeft: "15px" }}>
                            <ComponentSider />
                        </div>
                    </div>

                    {/* 内容区域 */}
                    <Layout style={{ background: "transparent", padding: "0 16px 0px 16px" }}>
                        <Content
                            style={{
                                background: colorBgContainer,
                                borderRadius: borderRadiusLG,
                                padding: "0",
                                height: "calc(100vh - 32px)",
                                overflow: "hidden",
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                            }}
                        >
                            {/* 页面头部 */}
                            {name !== "off" && (
                                <div
                                    style={{
                                        padding: "16px 24px",
                                        borderBottom: "1px solid #f0f0f0",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                    }}
                                >
                                    <Button type="text" icon={<LeftOutlined />} onClick={goBackPage} style={{ padding: "4px" }} />
                                    <Typography.Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                                        {name}
                                    </Typography.Title>
                                </div>
                            )}

                            {/* 主内容 */}
                            <div
                                style={{
                                    padding: name !== "off" ? "24px" : "0",
                                    height: name !== "off" ? "calc(100% - 53px)" : "100%",
                                    overflow: "auto",
                                }}
                            >
                                {c}
                            </div>
                        </Content>

                        {/* 页脚 */}
                        <div
                            style={{
                                textAlign: "center",
                                color: "#B1B1B1",
                                fontSize: "12px",
                            }}
                        >
                            WatchAlert 提供轻量级一站式监控报警服务!
                        </div>
                    </Layout>
                </Layout>
            </Layout>
        </>
    )
}

export const ComponentsContent = Auth(Components)