"use client"

import { useState, useEffect, useRef } from "react"
import { Layout, theme, Button, Typography, Spin, Result } from "antd"
import { LeftOutlined, LoadingOutlined } from "@ant-design/icons"
import "./index.css"
import { ComponentSider } from "./sider"
import Auth from "../utils/Auth"

const Components = (props) => {
    const { name, c } = props
    const { Content } = Layout
    const [loading, setLoading] = useState(true)
    const [tenantId, setTenantId] = useState(null)
    const [error, setError] = useState(false)
    const [isRendered, setIsRendered] = useState(false) // 新增状态，表示页面是否完全渲染
    const contentRef = useRef(null)

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    // 检查租户ID
    useEffect(() => {
        const checkTenantId = () => {
            try {
                const storedTenantId = localStorage.getItem("TenantID")

                if (storedTenantId) {
                    setTenantId(storedTenantId)
                    setLoading(false)
                } else {
                    const retryTimeout = setTimeout(() => {
                        const retryTenantId = localStorage.getItem("TenantID")
                        if (retryTenantId) {
                            setTenantId(retryTenantId)
                            setLoading(false)
                        } else {
                            setError(true)
                            setLoading(false)
                        }
                    }, 2000)

                    return () => clearTimeout(retryTimeout)
                }
            } catch (error) {
                console.error("Error accessing localStorage:", error)
                setError(true)
                setLoading(false)
            }
        }

        checkTenantId()
    }, [])

    // 使用MutationObserver监听DOM变化，确认内容完全渲染
    useEffect(() => {
        if (loading || error || !tenantId) return

        const observer = new MutationObserver((mutations) => {
            // 当检测到内容变化时，延迟一小段时间确认渲染完成
            const timer = setTimeout(() => {
                setIsRendered(true)
                observer.disconnect()
            }, 300) // 适当延迟确保渲染完成

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

        // 设置最大等待时间，防止Observer失效
        const maxWaitTimer = setTimeout(() => {
            setIsRendered(true)
            observer.disconnect()
        }, 3000)

        return () => {
            observer.disconnect()
            clearTimeout(maxWaitTimer)
        }
    }, [loading, error, tenantId])

    const goBackPage = () => {
        window.history.back()
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
                {!loading ? "页面渲染中，马上就好..." : "正在获取租户信息..."}
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
                title="无法获取租户信息"
                subTitle="请确保您已登录并选择了有效的租户"
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

    // 如果还在加载或有错误，显示对应状态
    if (loading) {
        return <FullScreenLoading />
    }

    if (error || !tenantId) {
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