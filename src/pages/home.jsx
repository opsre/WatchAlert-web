"use client"

import { useState, useEffect, useRef } from "react"
import ReactECharts from "echarts-for-react"
import { Card, List, Row, Col, Statistic, Select, message, Typography, Badge, Spin, Empty } from "antd"
import { getDashboardInfo } from "../api/other"
import { FaultCenterList } from "../api/faultCenter"
import * as echarts from "echarts"
import { noticeRecordMetric } from "../api/notice"
import { AlertTriangle, BarChart2, Users, Bell, Activity, Server } from "lucide-react"

const { Option } = Select
const { Title, Text } = Typography

export const Home = () => {
    const contentMaxHeight = "calc(100vh)"
    const [dashboardInfo, setDashboardInfo] = useState({})
    const [faultCenters, setFaultCenters] = useState([])
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
    const [loading, setLoading] = useState(true)
    const noticeChartRef = useRef(null)

    // Get fault center list
    const fetchFaultCenters = async () => {
        try {
            setLoading(true)
            const res = await FaultCenterList()
            setFaultCenters(res.data)
            // Select first one by default
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

    // Get dashboard data
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

    useEffect(() => {
        fetchFaultCenters()
    }, [])

    useEffect(() => {
        fetchDashboardInfo(selectedFaultCenter)
    }, [selectedFaultCenter])

    // Constants
    const SEVERITY_COLORS = {
        P0: '#ff4d4f',
        P1: '#faad14',
        P2: '#b0e1fb'
    }

    const alarmDistributionOption = {
        tooltip: {
            trigger: "item",
            formatter: "{a} <br/>{b}: {c} ({d}%)",
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

    // Initialize chart and fetch data
    useEffect(() => {
        let myChart = null

        const initChart = () => {
            const chartDom = noticeChartRef.current
            if (!chartDom) return

            myChart = echarts.init(chartDom)
            fetchMetricData(myChart)
        }

        initChart()

        // Resize handler
        const handleResize = () => {
            if (myChart) {
                myChart.resize()
            }
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            if (myChart) {
                myChart.dispose()
            }
        }
    }, [])

    const fetchMetricData = async (chart) => {
        try {
            const res = await noticeRecordMetric()
            const { date, series } = res.data

            const option = {
                grid: {
                    left: "30px",
                    right: "30px",
                    top: "50px",
                    bottom: "30px",
                    containLabel: true,
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: { type: "shadow" },
                    backgroundColor: "rgba(255, 255, 255, 0.9)",
                    borderColor: "#ccc",
                    borderWidth: 1,
                    textStyle: {
                        color: "#333",
                    },
                },
                legend: {
                    data: ["P0", "P1", "P2"],
                    top: 10,
                    textStyle: {
                        fontSize: 12,
                    },
                },
                xAxis: {
                    type: "category",
                    data: date,
                    axisLine: {
                        lineStyle: {
                            color: "#ddd",
                        },
                    },
                    axisLabel: {
                        fontSize: 10,
                        rotate: 30,
                    },
                },
                yAxis: {
                    type: "value",
                    splitLine: {
                        lineStyle: {
                            type: "dashed",
                            color: "#eee",
                        },
                    },
                },
                series: [
                    {
                        name: "P0",
                        data: series.p0,
                        type: "line",
                        smooth: true,
                        symbolSize: 6,
                        lineStyle: { width: 3 },
                        itemStyle: { color: SEVERITY_COLORS.P0 },
                        areaStyle: {
                            color: {
                                type: "linear",
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    { offset: 0, color: SEVERITY_COLORS.P0 + "AA" },
                                    { offset: 1, color: SEVERITY_COLORS.P0 + "11" },
                                ],
                            },
                        },
                    },
                    {
                        name: "P1",
                        data: series.p1,
                        type: "line",
                        smooth: true,
                        symbolSize: 6,
                        lineStyle: { width: 3 },
                        itemStyle: { color: SEVERITY_COLORS.P1 },
                        areaStyle: {
                            color: {
                                type: "linear",
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    { offset: 0, color: SEVERITY_COLORS.P1 + "AA" },
                                    { offset: 1, color: SEVERITY_COLORS.P1 + "11" },
                                ],
                            },
                        },
                    },
                    {
                        name: "P2",
                        data: series.p2,
                        type: "line",
                        smooth: true,
                        symbolSize: 6,
                        lineStyle: { width: 3 },
                        itemStyle: { color: SEVERITY_COLORS.P2 },
                        areaStyle: {
                            color: {
                                type: "linear",
                                x: 0,
                                y: 0,
                                x2: 0,
                                y2: 1,
                                colorStops: [
                                    { offset: 0, color: SEVERITY_COLORS.P2 + "AA" },
                                    { offset: 1, color: SEVERITY_COLORS.P2 + "11" },
                                ],
                            },
                        },
                    },
                ],
            }

            chart.setOption(option)
        } catch (error) {
            message.error("加载图表数据失败")
            console.error("Failed to load metric data:", error)
        }
    }

    // Render card title with selector
    const renderCardTitle = (title) => (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0 8px",
            }}
        >
            <Title level={5} style={{ margin: 0 }}>
                {title}
            </Title>
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
                    <Option key={center.id} value={center.id}>
                        {center.name}
                    </Option>
                ))}
            </Select>
        </div>
    )

    // Get severity badge
    const getSeverityBadge = (text) => {
        if (text.includes("P0")) return <Badge color={SEVERITY_COLORS.P0} text={text} />
        if (text.includes("P1")) return <Badge color={SEVERITY_COLORS.P1} text={text} />
        if (text.includes("P2")) return <Badge color={SEVERITY_COLORS.P2} text={text} />
        return text
    }

    return (
        <div
            style={{
                alignItems: "flex-start",
                textAlign: "start",
                maxHeight: contentMaxHeight,
                overflowY: "auto",
                padding: "5px",
                paddingTop: "15px",
            }}
        >
            {/* First row: Statistics */}
            <Row gutter={[24, 24]} style={{ marginBottom: "24px" }}>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            height: "100%",
                        }}
                        bodyStyle={{ padding: "24px" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                            <div
                                style={{
                                    backgroundColor: "rgba(24, 144, 255, 0.1)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                    marginRight: "16px",
                                }}
                            >
                                <AlertTriangle size={24} color="#1890ff" />
                            </div>
                            <Text type="secondary">当前规则总数</Text>
                        </div>
                        <Statistic
                            value={dashboardInfo?.countAlertRules || 0}
                            valueStyle={{ fontSize: "36px", fontWeight: "bold", color: "#1890ff" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            height: "100%",
                        }}
                        bodyStyle={{ padding: "24px" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                            <div
                                style={{
                                    backgroundColor: "rgba(255, 77, 79, 0.1)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                    marginRight: "16px",
                                }}
                            >
                                <Server size={24} color="#ff4d4f" />
                            </div>
                            <Text type="secondary">故障中心总数</Text>
                        </div>
                        <Statistic
                            value={dashboardInfo?.faultCenterNumber || 0}
                            valueStyle={{ fontSize: "36px", fontWeight: "bold", color: "#ff4d4f" }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        bordered={false}
                        style={{
                            borderRadius: "12px",
                            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
                            height: "100%",
                        }}
                        bodyStyle={{ padding: "24px" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", marginBottom: "16px" }}>
                            <div
                                style={{
                                    backgroundColor: "rgba(114, 46, 209, 0.1)",
                                    borderRadius: "12px",
                                    padding: "12px",
                                    marginRight: "16px",
                                }}
                            >
                                <Users size={24} color="#722ed1" />
                            </div>
                            <Text type="secondary">系统用户总数</Text>
                        </div>
                        <Statistic
                            value={dashboardInfo?.userNumber || 0}
                            valueStyle={{ fontSize: "36px", fontWeight: "bold", color: "#722ed1" }}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Trend Chart */}
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
                    marginBottom: "24px",
                }}
                bodyStyle={{ padding: "12px" }}
            >
                <div
                    ref={noticeChartRef}
                    style={{
                        width: "100%",
                        height: "280px",
                        padding: "0",
                    }}
                />
            </Card>

            {/* Second row: Alert list and distribution */}
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
                            {dashboardInfo?.curAlertList?.length > 0 ? (
                                <List
                                    dataSource={dashboardInfo?.curAlertList ?? []}
                                    style={{
                                        height: "350px",
                                        overflow: "auto",
                                        borderRadius: "0 0 12px 12px",
                                    }}
                                    renderItem={(item) => (
                                        <List.Item
                                            style={{
                                                padding: "12px 24px",
                                                borderBottom: "1px solid #f0f0f0",
                                                transition: "background-color 0.3s",
                                            }}
                                            className="hover:bg-gray-50"
                                        >
                                            <div
                                                style={{
                                                    overflowX: "auto",
                                                    whiteSpace: "nowrap",
                                                    width: "100%",
                                                }}
                                            >
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
