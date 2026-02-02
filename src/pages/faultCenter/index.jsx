import { useState, useEffect } from "react"
import { Button, Input, Card, Row, Col, Dropdown, Menu, Modal, Empty, Typography } from "antd"
import { useNavigate } from "react-router-dom"
import { FaultCenterDelete, FaultCenterList } from "../../api/faultCenter"
import { MoreOutlined, DeleteOutlined, ExclamationCircleOutlined, PlusOutlined } from "@ant-design/icons"
import { CreateFaultCenter } from "./create"
import { Breadcrumb } from "../../components/Breadcrumb";


const { confirm } = Modal
const { Title } = Typography

export const FaultCenter = () => {
    const { Search } = Input
    const [list, setList] = useState([])
    const [hoveredCard, setHoveredCard] = useState(null)
    const navigate = useNavigate()
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        handleList()
    }, [])

    const handleList = async () => {
        try {
            const res = await FaultCenterList()
            setList(res?.data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (record) => {
        try {
            const params = { id: record.id }
            await FaultCenterDelete(params)
            handleList() // 删除后刷新列表
        } catch (error) {
            console.error(error)
        }
    }

    const onSearch = async (value) => {
        try {
            const params = { query: value }
            const res = await FaultCenterList(params)
            setList(res?.data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleCardClick = (id) => {
        navigate(`/faultCenter/detail/${id}`)
    }

    // 显示删除确认弹窗
    const showDeleteConfirm = (record) => {
        confirm({
            title: "确认删除",
            icon: <ExclamationCircleOutlined />,
            content: `确定删除故障中心 ${record.name} 吗？`,
            okText: "确定",
            okType: "danger",
            cancelText: "取消",
            onOk() {
                handleDelete(record)
            },
        })
    }

    // 三个点的下拉菜单
    const renderMenu = (record) => (
        <Menu>
            <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                    e.domEvent.stopPropagation() // 阻止事件冒泡
                    showDeleteConfirm(record) // 显示删除确认弹窗
                }}
            >
                删除
            </Menu.Item>
        </Menu>
    )

    // 定义样式常量
    const styles = {
        pageContainer: {
            display: "flex",
            flexDirection: "column",
            height: "70vh", // 使用视口高度
            overflow: "hidden", // 防止整个页面滚动
        },
        headerSection: {
            backgroundColor: "#fff",
            zIndex: 10,
        },
        scrollContainer: {
            flex: 1,
            overflowY: "auto", // 启用垂直滚动
        },
        cardTitle: {
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "8px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#1f2d3d",
        },
        value: (color) => ({
            color: color,
            fontWeight: "bold",
            marginLeft: "8px",
            fontSize: "16px",
        }),
        cardHover: {
            transform: "translateY(-5px) scale(1.02)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 4px 25px rgba(0,0,0,0.15)",
        },
        cardContainer: {
            margin: "4px",
            transition: "all 0.3s ease",
        },
        card: {
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            border: "1px solid #f0f0f0",
            transition: "all 0.3s ease",
            height: "160px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "16px",
            position: "relative",
            overflow: "hidden",
        },
        statsContainer: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "10px",
            flex: 1,
        },
        statItem: {
            textAlign: "center",
            flex: 1,
        },
        statValue: (color) => ({
            fontSize: "20px",
            fontWeight: "700",
            color: color,
            lineHeight: 1.2,
        }),
        statLabel: {
            fontSize: "12px",
            color: "#6b7280",
            marginTop: "4px",
        },
        footer: {
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            borderTop: "1px solid #f5f5f5",
            paddingTop: "12px",
            marginTop: "8px",
        },
        createTime: {
            fontSize: "12px",
            color: "#9ca3af",
        },
        moreIcon: {
            fontSize: "16px",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            transition: "background-color 0.2s",
        },
        moreIconHover: {
            backgroundColor: "#f5f5f5",
        },
    }

    const handleModalClose = () => {
        setVisible(false)
    }

    // 格式化时间
    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000) // 将秒转换为毫秒
        const year = date.getFullYear() // 获取年份
        const month = date.getMonth() + 1 // 获取月份（0-11，需要加1）
        const day = date.getDate() // 获取日期
        const hours = date.getHours() // 获取小时
        const minutes = date.getMinutes() // 获取分钟

        // 补零函数，确保月份、日期、小时、分钟、秒为两位数
        const padZero = (num) => (num < 10 ? `0${num}` : num)

        // 返回格式化后的时间字符串
        return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hours)}:${padZero(minutes)}`
    }

    return (
        <>
            <Breadcrumb items={['故障中心']} />
            <div style={styles.pageContainer}>
                {/* 固定在顶部的搜索和创建按钮 */}
                <div style={styles.headerSection}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                        </div>

                        <div>
                            <Button type="primary" style={{ backgroundColor: "#000000" }} onClick={() => setVisible(true)} icon={<PlusOutlined />}>
                                创建
                            </Button>
                        </div>
                    </div>
                </div>

                <CreateFaultCenter visible={visible} onClose={handleModalClose} handleList={handleList} type="create" />

                {/* 可滚动的内容区域 */}
                <div style={styles.scrollContainer}>
                    {/* 空状态展示 */}
                    {list?.length === 0 && (
                        <div
                            style={{
                                height: "70vh",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "center",
                                alignItems: "center",
                                marginTop: -40,
                            }}
                        >
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={"暂无故障中心数据"} style={{ marginBottom: 32 }}>
                                <Title level={4} style={{ marginBottom: 16 }}>
                                    开始创建第一个故障中心
                                </Title>
                                <span style={{ marginBottom: 24 }}>通过创建故障中心来统一管理您的告警信息</span>
                            </Empty>
                        </div>
                    )}

                    <Row gutter={[10, 10]} style={{ display: "flex", flexWrap: "wrap", marginTop: "20px" }}>
                        {list?.map((item) => (
                            <Col key={item.id} xs={24} sm={24} md={8} lg={8} style={{ flex: "320px" }}>
                                <div
                                    style={styles.cardContainer}
                                    onClick={() => handleCardClick(item.id)}
                                    onMouseEnter={() => setHoveredCard(item.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <Card 
                                        style={{
                                            ...styles.card,
                                            ...(hoveredCard === item.id ? styles.cardHover : {})
                                        }}
                                        bodyStyle={{ padding: 0, height: '100%' }}
                                    >
                                        {/* 标题部分 */}
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                                            <span style={{ fontSize: "15px", fontWeight: "500", color: "#1f2d3d", flex: 1 }}>{item.name}</span>
                                            <Dropdown overlay={renderMenu(item)} trigger={"click"} overlayStyle={{ zIndex: 9999 }}>
                                                <MoreOutlined
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                    }}
                                                    style={styles.moreIcon}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                                />
                                            </Dropdown>
                                        </div>

                                        <div style={styles.statsContainer}>
                                            {/* 预告警 */}
                                            <div style={styles.statItem}>
                                                <div style={styles.statValue(item.currentPreAlertNumber > 0 ? "#ffe465" : "#10b981")}>
                                                    {item.currentPreAlertNumber ? item.currentPreAlertNumber : 0}
                                                </div>
                                                <div style={styles.statLabel}>预告警</div>
                                            </div>

                                            {/* 待处理 */}
                                            <div style={styles.statItem}>
                                                <div style={styles.statValue(item.currentAlertNumber > 0 ? "#ef4444" : "#10b981")}>
                                                    {item.currentAlertNumber ? item.currentAlertNumber : 0}
                                                </div>
                                                <div style={styles.statLabel}>待处理</div>
                                            </div>

                                            {/* 待恢复 */}
                                            <div style={styles.statItem}>
                                                <div style={styles.statValue(item.currentRecoverNumber > 0 ? "#f97316" : "#10b981")}>
                                                    {item.currentRecoverNumber ? item.currentRecoverNumber : 0}
                                                </div>
                                                <div style={styles.statLabel}>待恢复</div>
                                            </div>
                                        </div>

                                        <div style={styles.footer}>
                                            <span style={styles.createTime}>{formatDate(item.createAt)}</span>
                                        </div>
                                    </Card>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
        </>
    )
}

