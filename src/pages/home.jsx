"use client"

import { useState, useEffect, useRef } from "react"
import ReactECharts from "echarts-for-react"
import { Card, List, Row, Col, Statistic, Select, message, Typography, Badge, Spin, Empty } from "antd"
import { getDashboardInfo } from "../api/other"
import { FaultCenterList } from "../api/faultCenter"
import { noticeRecordMetric } from "../api/notice"
import { AlertTriangle, BarChart2, Users, Bell, Activity, Server } from "lucide-react"
import {NoticeMetricChart} from "./chart/noticeMetricChart";

const { Option } = Select
const { Title, Text } = Typography

export const Home = () => {
    const contentMaxHeight = "calc(100vh)"
    const [dashboardInfo, setDashboardInfo] = useState({})
    const [faultCenters, setFaultCenters] = useState([])
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
    const [loading, setLoading] = useState(true)
    const [metricData, setMetricData] = useState({})

    // 获取故障中心列表
    const fetchFaultCenters = async () => {
        try {
            setLoading(true)
            const res = await FaultCenterList()
            setFaultCenters(res.data)
            if (res.data.length > 0) {
                setSelectedFaultCenter(res.data[0].id)
            }
        } catch (error) {
            console.error(error)
            message.error("获取故障中心列表失败")
        } finally {
            setLoading(false)
        }
    }

    // 获取仪表盘信息
    const fetchDashboardInfo = async (faultCenterId) => {
        if (!faultCenterId) return
        try {
            setLoading(true)
            const params = { faultCenterId }
            const res = await getDashboardInfo(params)
            setDashboardInfo(res.data)
        } catch (error) {
            console.error(error)
            message.error("获取仪表盘数据失败")
        } finally {
            setLoading(false)
        }
    }

    // 获取图表数据
    const fetchMetricData = async () => {
        try {
            const res = await noticeRecordMetric()
            setMetricData(res.data)
        } catch (error) {
            message.error("加载图表数据失败")
            console.error("Failed to load metric data:", error)
        }
    }

    // 初始化加载
    useEffect(() => {
        fetchFaultCenters()
    }, [])

    useEffect(() => {
        fetchDashboardInfo(selectedFaultCenter)
    }, [selectedFaultCenter])

    useEffect(() => {
        fetchMetricData()
    }, [])

    // 告警等级颜色
    const SEVERITY_COLORS = {
        P0: '#ff4d4f',
        P1: '#faad14',
        P2: '#b0e1fb'
    }

    // 渲染卡片标题
    const renderCardTitle = (title) => (
        <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 8px"
        }}>
            <Title level={5} style={{ margin: 0 }}>{title}</Title>
            <Select
                style={{ width: 200 }}
                placeholder="选择故障中心"
                value={selectedFaultCenter}
                onChange={setSelectedFaultCenter}
                showSearch
                optionFilterProp="children"
                loading={loading}
                dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
            >
                {faultCenters.length === 0 && <Option disabled>暂无可用故障中心</Option>}
                {faultCenters.map((center) => (
                    <Option key={center.id} value={center.id}>{center.name}</Option>
                ))}
            </Select>
        </div>
    )

    // 渲染告警级别 badge
    const getSeverityBadge = (text) => {
        if (text.includes("P0")) return <Badge color={SEVERITY_COLORS.P0} text={text} />
        if (text.includes("P1")) return <Badge color={SEVERITY_COLORS.P1} text={text} />
        if (text.includes("P2")) return <Badge color={SEVERITY_COLORS.P2} text={text} />
        return text
    }

    const alarmDistributionOption = {
        tooltip: {
            trigger: "item",
            formatter: "{a} <br/>{b}: {c} ({d}%)",
            backgroundColor: "#000000", // 黑色背景
            borderColor: "#333",         // 边框颜色
            textStyle: {
                color: "#ffffff",           // 白色文字
                fontSize: 12,
            },
        },
        legend: {
            orient: "vertical",
            right: 10,
            top: "center",
            data: ["P0", "P1", "P2"],
        },
        series: [
            {
                name: "告警级别",
                type: "pie",
                radius: ["50%", "70%"],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: "#fff",
                    borderWidth: 2,
                },
                label: {
                    show: false,
                    position: "center",
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: "18",
                        fontWeight: "bold",
                    },
                },
                labelLine: {
                    show: false,
                },
                data: [
                    {
                        value: dashboardInfo?.alarmDistribution?.P0 ?? 0,
                        name: "P0",
                        itemStyle: { color: SEVERITY_COLORS.P0 },
                    },
                    {
                        value: dashboardInfo?.alarmDistribution?.P1 ?? 0,
                        name: "P1",
                        itemStyle: { color: SEVERITY_COLORS.P1 },
                    },
                    {
                        value: dashboardInfo?.alarmDistribution?.P2 ?? 0,
                        name: "P2",
                        itemStyle: { color: SEVERITY_COLORS.P2 },
                    },
                ],
            },
        ],
    }


    return (
        <div style={{
            alignItems: "flex-start",
            textAlign: "start",
            maxHeight: contentMaxHeight,
            overflowY: "auto",
            padding: "5px",
            paddingTop: "15px"
        }}>
            {/* 第一行统计 */}
            <Row gutter={[24, 24]} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} style={{
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                        height: "100%"
                    }} bodyStyle={{ padding: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{
                                backgroundColor: "#000000",
                                borderRadius: "12px",
                                padding: "12px",
                                marginRight: "16px"
                            }}>
                                <AlertTriangle size={24} color="#FFFFFFFF" />
                            </div>
                            <Text type="secondary">当前规则总数</Text>
                        </div>
                        <Statistic
                            value={dashboardInfo?.countAlertRules || 0}
                            valueStyle={{ fontSize: "36px", fontWeight: "bold", color: "#000000" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} style={{
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                        height: "100%"
                    }} bodyStyle={{ padding: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{
                                backgroundColor: "#000000",
                                borderRadius: "12px",
                                padding: "12px",
                                marginRight: "16px"
                            }}>
                                <Server size={24} color="#FFFFFFFF" />
                            </div>
                            <Text type="secondary">故障中心总数</Text>
                        </div>
                        <Statistic
                            value={dashboardInfo?.faultCenterNumber || 0}
                            valueStyle={{ fontSize: "36px", fontWeight: "bold", color: "#000000" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card bordered={false} style={{
                        borderRadius: "12px",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                        height: "100%"
                    }} bodyStyle={{ padding: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                            <div style={{
                                backgroundColor: "#000000",
                                borderRadius: "12px",
                                padding: "12px",
                                marginRight: "16px"
                            }}>
                                <Users size={24} color="#FFFFFFFF" />
                            </div>
                            <Text type="secondary">系统用户总数</Text>
                        </div>
                        <Statistic
                            value={dashboardInfo?.userNumber || 0}
                            valueStyle={{ fontSize: "36px", fontWeight: "bold", color: "#000000" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* 告警趋势图 */}
            <Card
                title={
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <Activity size={18} style={{ marginRight: "8px" }} />
                        <span>告警通知趋势</span>
                    </div>
                }
                bordered={false}
                style={{
                    borderRadius: "12px",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                    marginBottom: "24px"
                }}
                bodyStyle={{ padding: "12px" }}
            >
                <Spin spinning={loading}>
                    {metricData.date && metricData.date.length > 0 ? (
                        <NoticeMetricChart data={metricData} />
                    ) : (
                        <div style={{ textAlign: "center", padding: "80px 0" }}>
                            <Empty description="暂无告警趋势数据" />
                        </div>
                    )}
                </Spin>
            </Card>

            {/* 告警列表 & 分布图 */}
            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card
                        title={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <Bell size={18} style={{ marginRight: "8px" }} />
                                <span>最近告警列表</span>
                            </div>
                        }
                        extra={renderCardTitle("")}
                        bordered={false}
                        style={{
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            height: "100%",
                        }}
                        bodyStyle={{ padding: "0" }}
                    >
                        <Spin spinning={loading}>
                            {dashboardInfo.curAlertList?.length > 0 ? (
                                <List
                                    dataSource={dashboardInfo.curAlertList ?? []}
                                    style={{
                                        height: "350px",
                                        overflow: "auto",
                                        borderRadius: "0 0 12px 12px"
                                    }}
                                    renderItem={(item) => (
                                        <List.Item
                                            style={{
                                                padding: "12px 24px",
                                                borderBottom: "1px solid #f0f0f0",
                                                transition: "background-color 0.3s"
                                            }}
                                        >
                                            <div style={{
                                                overflowX: "auto",
                                                whiteSpace: "nowrap",
                                                width: "100%"
                                            }}>
                                                {getSeverityBadge(item)}
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无告警数据" style={{ padding: "80px 0" }} />
                            )}
                        </Spin>
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <BarChart2 size={18} style={{ marginRight: "8px" }} />
                                <span>告警分布</span>
                            </div>
                        }
                        extra={renderCardTitle("")}
                        bordered={false}
                        style={{
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            height: "100%",
                        }}
                        bodyStyle={{ padding: "12px" }}
                    >
                        <Spin spinning={loading}>
                            <ReactECharts
                                option={alarmDistributionOption}
                                style={{ width: "100%", height: "350px" }}
                                opts={{ renderer: "canvas" }}
                            />
                        </Spin>
                    </Card>
                </Col>
            </Row>
        </div>
    )
}