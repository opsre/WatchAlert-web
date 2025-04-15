"use client"

import { useState, useEffect, useRef } from "react"
import {Layout, theme, Button, Typography, Spin, Result, message} from "antd"
import { LeftOutlined, LoadingOutlined } from "@ant-design/icons"
import "./index.css"
import { ComponentSider } from "./sider"
import Auth from "../utils/Auth"
import {getTenantList} from "../api/tenant";

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

    // 统一检查认证和租户信息
    useEffect(() => {
        fetchTenantList()

        let isMounted = true
        let retryTimeout

        const checkAuthAndTenant = async () => {
            try {
                // 第一次检查
                const auth = localStorage.getItem("Authorization")
                const tenant = localStorage.getItem("TenantID")

                if (auth && tenant) {
                    if (isMounted) {
                        setAuthorization(auth)
                        setTenantId(tenant)
                        setLoading(false)
                    }
                    return
                }

                // 如果没有找到，延迟后再次检查
                retryTimeout = setTimeout(() => {
                    const retryAuth = localStorage.getItem("Authorization")
                    const retryTenant = localStorage.getItem("TenantID")

                    if (isMounted) {
                        if (retryAuth && retryTenant) {
                            setAuthorization(retryAuth)
                            setTenantId(retryTenant)
                            setLoading(false)
                        } else {
                            console.log("出错啦,",retryAuth,retryTenant)
                            setError(true)
                            setLoading(false)
                        }
                    }
                }, 1000)
            } catch (error) {
                console.error("Error accessing localStorage:", error)
                if (isMounted) {
                    setError(true)
                    setLoading(false)
                }
            }
        }

        checkAuthAndTenant()

        return () => {
            isMounted = false
            clearTimeout(retryTimeout)
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
        try {
            const params = {
                userId: userid,
            }
            const res = await getTenantList(params)

            if (res.data === null || res.data.length === 0) {
                message.error("该用户没有可用租户")
                return
            }

            const opts = res.data.map((key, index) => ({
                label: key.name,
                value: key.id,
                index: index,
            }))

            if (getTenantName() === null && opts.length > 0) {
                localStorage.setItem("TenantName", opts[0].label)
                localStorage.setItem("TenantID", opts[0].value)
                localStorage.setItem("TenantIndex", opts[0].index)
            }

        } catch (error) {
            console.error("Failed to fetch tenant list:", error)
            localStorage.clear()
            message.error("获取租户错误, 退出登录")
        }
    }

    const getTenantName = () => {
        return localStorage.getItem("TenantName")
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
                {!loading ? "页面准备中..." : "正在验证用户信息..."}
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
                title="无法获取认证信息"
                subTitle={!authorization ? "请先登录系统" : "请选择有效的租户"}
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

    if (error || authorization === "" || tenantId === "") {
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
                    background: "#f0f2f5",
                    opacity: isRendered ? 1 : 0, // 添加淡入效果
                    transition: 'opacity 0.3s ease-in'
                }}
                ref={contentRef}
            >
                <Layout style={{ background: "transparent", marginTop: "16px" }}>
                    {/* 侧边栏 */}
                    <div
                        style={{
                            margin: "0 0 0 16px",
                            width: "220px",
                            borderRadius: borderRadiusLG,
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                            height: "calc(100vh - 32px)",
                            background: "#000000",
                        }}
                    >
                        <div style={{ height: "100%", overflow: "auto", padding: "16px 0", marginLeft: "10px" }}>
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