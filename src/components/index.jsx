"use client"

import { useEffect, useState } from "react"
import { Layout, theme, Avatar, Button, Popover, Spin, Menu, Typography, Dropdown, Space, message } from "antd"
import { TeamOutlined, DownOutlined, LeftOutlined, LogoutOutlined, UserOutlined } from "@ant-design/icons"
import logoIcon from "../img/logo.jpeg"
import { getUserInfo } from "../api/user"
import Auth from "../utils/Auth"
import { getTenantList } from "../api/tenant"
import "./index.css"
import { ComponentSider } from "./sider"
import { Link, useNavigate } from "react-router-dom"

export const ComponentsContent = (props) => {
    const { name, c } = props
    const navigate = useNavigate()
    const { Header, Content } = Layout
    const [userInfo, setUserInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tenantList, setTenantList] = useState([])
    const [getTenantStatus, setTenantStatus] = useState(null)

    Auth()

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    const handleLogout = () => {
        localStorage.clear()
        navigate("/login")
    }

    const userMenu = (
        <Menu mode="vertical">
            <Menu.Item key="profile" icon={<UserOutlined />}>
                <Link to="/profile">个人信息</Link>
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} danger>
                退出登录
            </Menu.Item>
        </Menu>
    )

    const fetchUserInfo = async () => {
        try {
            const res = await getUserInfo()
            setUserInfo(res.data)

            if (res.data.userid) {
                await fetchTenantList(res.data.userid)
            }

            setLoading(false)
        } catch (error) {
            console.error("Failed to fetch user info:", error)
            window.localStorage.removeItem("Authorization")
            navigate("/login")
        }
    }

    const getTenantName = () => {
        return localStorage.getItem("TenantName")
    }

    const getTenantIndex = () => {
        return localStorage.getItem("TenantIndex")
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

            setTenantList(opts)

            if (getTenantName() === null && opts.length > 0) {
                localStorage.setItem("TenantName", opts[0].label)
                localStorage.setItem("TenantID", opts[0].value)
                localStorage.setItem("TenantIndex", opts[0].index)
            }

            setTenantStatus(true)
        } catch (error) {
            console.error("Failed to fetch tenant list:", error)
            localStorage.clear()
            message.error("获取租户错误, 退出登录")
        }
    }

    useEffect(() => {
        fetchUserInfo()
    }, [])

    if (loading || !getTenantStatus) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: colorBgContainer,
                }}
            >
                <Spin tip="加载中..." size="large" />
            </div>
        )
    }

    const goBackPage = () => {
        window.history.back()
    }

    const changeTenant = (c) => {
        localStorage.setItem("TenantIndex", c.key)
        if (c.item.props.name) {
            localStorage.setItem("TenantName", c.item.props.name)
        }
        if (c.item.props.value) {
            localStorage.setItem("TenantID", c.item.props.value)
        }
        window.location.reload()
    }

    const tenantMenu = (
        <Menu selectable defaultSelectedKeys={[getTenantIndex()]} onSelect={changeTenant}>
            {tenantList.map((item) => (
                <Menu.Item key={item.index} name={item.label} value={item.value}>
                    {item.label}
                </Menu.Item>
            ))}
        </Menu>
    )

    return (
        <Layout style={{ height: "100vh", overflow: "hidden", background: "#f0f2f5" }}>
            {/* Header */}
            <Header
                style={{
                    margin: "16px 16px 0",
                    padding: "0 24px",
                    background: colorBgContainer,
                    borderRadius: borderRadiusLG,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    height: "64px",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                }}
            >
                {/* Logo and Brand */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ marginTop: "25px" }}>
                        <img
                            src={logoIcon || "/placeholder.svg"}
                            alt="WatchAlert Logo"
                            style={{ width: "36px", height: "36px", borderRadius: "8px" }}
                        />
                    </div>
                    <Typography.Title level={4} style={{ margin: 0, fontSize: "18px" }}>
                        WatchAlert
                    </Typography.Title>
                </div>

                {/* User and Tenant Info */}
                <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
                    {/* Tenant Selector */}
                    <Dropdown overlay={tenantMenu} trigger={["click"]}>
                        <Typography.Link style={{ fontSize: "14px", color: "#404142" }}>
                            <Space>
                                <TeamOutlined />
                                <span>当前租户: {getTenantName()}</span>
                                <DownOutlined style={{ fontSize: "12px" }} />
                            </Space>
                        </Typography.Link>
                    </Dropdown>

                    {/* Divider */}
                    <div
                        style={{
                            width: "1px",
                            height: "24px",
                            backgroundColor: "#e0e0e0",
                        }}
                    />

                    {/* User Avatar */}
                    {userInfo && (
                        <Popover content={userMenu} trigger="click" placement="bottomRight">
                            <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                <Avatar
                                    style={{
                                        backgroundColor: "#7265e6",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                    size="default"
                                >
                                    {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : ""}
                                </Avatar>
                            </div>
                        </Popover>
                    )}
                </div>
            </Header>

            {/* Main Layout */}
            <Layout style={{ background: "transparent", marginTop: "16px" }}>
                {/* Sidebar with margin and rounded corners */}
                <div
                    style={{
                        margin: "0 0 0 16px",
                        width: "220px",
                        background: colorBgContainer,
                        borderRadius: borderRadiusLG,
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                        height: "calc(100vh - 112px)",
                    }}
                >
                    <div style={{ height: "100%", overflow: "auto", padding: "16px 0", marginLeft: "10px" }}>
                        <ComponentSider userInfo={userInfo} />
                    </div>
                </div>

                {/* Content Area */}
                <Layout style={{ background: "transparent", padding: "0 16px 0px 16px" }}>
                    <Content
                        style={{
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                            padding: "0",
                            height: "calc(100vh - 112px)",
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                        }}
                    >
                        {/* Page Header with Back Button */}
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

                        {/* Main Content */}
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

                    {/* Footer */}
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
    )
}
