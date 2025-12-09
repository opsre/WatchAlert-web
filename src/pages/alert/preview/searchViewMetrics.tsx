import { useEffect, useState } from "react"
import { Spin, Tag, Empty, Card, Typography, Space, Divider, Row, Col, Alert, Tabs, Table } from "antd"
import {
    ClockCircleOutlined,
    TagsOutlined,
    BarChartOutlined,
    FileTextOutlined,
    LineChartOutlined,
    AppstoreOutlined,
} from "@ant-design/icons"
import { EventMetricChart } from '../../chart/eventMetricChart'
import {queryPromMetrics, queryRangePromMetrics} from '../../../api/other'

const { Title, Text } = Typography

interface MetricItem {
    metric: Record<string, string>
    value: [number, string]
}

export type DisplayMode = 'card' | 'chart' | 'both'

interface SearchViewMetricsProps {
    datasourceType: string
    datasourceId: string[]
    promQL: string
    displayMode?: DisplayMode
    startTime?: number
    endTime?: number
    step?: number
}

export const SearchViewMetrics = ({ 
    datasourceType, 
    datasourceId, 
    promQL, 
    displayMode = 'card',
    startTime,
    endTime,
    step = 10
}: SearchViewMetricsProps) => {
    const [metrics, setMetrics] = useState<MetricItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState('card')

    // 处理tab切换
    const handleTabChange = (key: string) => {
        setActiveTab(key)
        // tab切换时会触发useEffect重新获取数据
    }
    const [chartData, setChartData] = useState<any>(null)

    // 获取卡片数据
    const fetchCardData = async () => {
        try {
            setLoading(true)
            setError(null)

            const params = {
                datasourceIds: datasourceId.join(","),
                query: promQL,
            }

            const res = await queryPromMetrics(params)

            if (res.code !== 200) {
                throw new Error(res.msg || "请求失败")
            }

            // 提取所有 result 数据
            const allResults = res.data
                .filter((item: any) => item.status === "success" && item.data?.result?.length > 0)
                .flatMap((item: any) => item.data.result)

            setMetrics(allResults)
        } catch (err) {
            setError(err instanceof Error ? err.message : "网络错误")
            console.error("Fetch card data error:", err)
        } finally {
            setLoading(false)
        }
    }

    // 获取图表数据
    const fetchChartData = async () => {
        try {
            setLoading(true)
            setError(null)

            // 如果没有提供时间范围，使用默认值（最近5分钟）
            const now = Math.floor(Date.now() / 1000)
            const defaultStartTime = startTime || (now - 300) // 5分钟前
            const defaultEndTime = endTime || now

            const params = {
                datasourceIds: datasourceId.join(","),
                query: promQL,
                startTime: defaultStartTime,
                endTime: defaultEndTime,
                step: step,
            }

            const res = await queryRangePromMetrics(params)

            if (res.code !== 200) {
                throw new Error(res.msg || "请求失败")
            }

            setChartData(res.data)
        } catch (err) {
            setError(err instanceof Error ? err.message : "网络错误")
            console.error("Fetch chart data error:", err)
        } finally {
            setLoading(false)
        }
    }

    // 根据显示模式和当前tab获取数据
    useEffect(() => {
        if (datasourceId.length > 0 && promQL) {
            if (displayMode === 'card') {
                fetchCardData()
            } else if (displayMode === 'chart') {
                fetchChartData()
            } else if (displayMode === 'both') {
                if (activeTab === 'card') {
                    fetchCardData()
                } else {
                    fetchChartData()
                }
            }
        }
    }, [datasourceId, promQL, displayMode, activeTab, startTime, endTime, step])

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString("zh-CN")
    }



    // 准备表格数据
    const prepareTableData = () => {
        return metrics.map((item, index) => ({
            key: index,
            metric: `Metric #${index + 1}`,
            value: parseFloat(item.value[1]).toLocaleString(),
            timestamp: formatTimestamp(item.value[0]),
            labels: Object.keys(item.metric)
                .filter(key => key !== '__name__')
                .map(key => ({ key, value: item.metric[key] }))
        }))
    }

    const tableColumns = [
        {
            title: '标签',
            dataIndex: 'labels',
            key: 'labels',
            render: (labels: Array<{key: string, value: string}>) => (
                <Space wrap>
                    {labels.map((label, idx) => (
                        <Tag key={idx} color="blue" style={{ margin: '2px' }}>
                            <Text style={{ fontSize: '12px' }}>
                                <span style={{ fontWeight: 600 }}>{label.key}:</span> {label.value}
                            </Text>
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: '数值',
            dataIndex: 'value',
            key: 'value',
            width: 120,
            render: (value: string) => (
                <Text style={{ 
                    fontSize: '16px', 
                    fontWeight: 'bold',
                    color: parseFloat(value.replace(/,/g, '')) === 0 ? '#52c41a' : '#1890ff'
                }}>
                    {value}
                </Text>
            )
        },
        {
            title: '时间戳',
            dataIndex: 'timestamp',
            key: 'timestamp',
            width: 180,
        },
    ]



    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "400px",
                    background: "#fafafa",
                    borderRadius: "8px",
                }}
            >
                <Spin size="large" />
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                        正在获取最新的 Metric 数据
                    </Text>
                </div>
            </div>
        )
    }

    if (error) {
        return <Alert message="查询失败" description={error} type="error" showIcon style={{ margin: "20px 0" }} />
    }

    if (metrics.length === 0) {
        return (
            <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                    <div>
                        <Text type="secondary" style={{ fontSize: "14px" }}>
                            当前查询条件下没有找到相关的 Metric 数据
                        </Text>
                    </div>
                }
                style={{
                    padding: "60px 20px",
                    background: "#fafafa",
                    borderRadius: "8px",
                    margin: "20px 0",
                }}
            />
        )
    }

    // 卡片视图渲染
    const renderCardView = () => (
        <div>
            <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: "10px" }}>
                {metrics.map((item, index) => {
                    const metricKeys = Object.keys(item.metric).filter((key) => key !== "__name__")
                    return (
                        <div
                            key={index}
                            style={{
                                borderLeft: `4px solid #1890ff`,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                backgroundColor: "#fff",
                                border: "1px solid #f0f0f0",
                                borderRadius: "6px",
                                padding: "16px",
                                marginBottom: "16px",
                            }}
                        >
                            <Row gutter={[16, 16]}>
                                {/* 左侧：Metric 信息 */}
                                <Col span={16}>
                                    <Space direction="vertical" size="small" style={{ width: "100%" }}>
                                        {/* 标题 */}
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <BarChartOutlined style={{ color: "#1890ff", fontSize: "16px" }} />
                                            <Text strong style={{ fontSize: "16px" }}>
                                                Metric #{index + 1}
                                            </Text>
                                        </div>

                                        <Divider style={{ margin: "8px 0" }} />

                                        {/* 标签信息 */}
                                        {metricKeys.length > 0 && (
                                            <div>
                                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                                                    <TagsOutlined style={{ color: "#666", fontSize: "14px" }} />
                                                    <Text type="secondary" style={{ fontSize: "12px", fontWeight: 500 }}>
                                                        标签信息
                                                    </Text>
                                                </div>
                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                                    {metricKeys.map((key) => (
                                                        <Tag key={key} color="blue" style={{ margin: 0 }}>
                                                            <Text style={{ fontSize: "12px" }}>
                                                                <span style={{ fontWeight: 600 }}>{key}:</span> {item.metric[key]}
                                                            </Text>
                                                        </Tag>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </Space>
                                </Col>

                                {/* 右侧：数值和时间 */}
                                <Col span={8}>
                                    <div
                                        style={{
                                            textAlign: "right",
                                            height: "100%",
                                            display: "flex",
                                            flexDirection: "column",
                                            justifyContent: "center",
                                        }}
                                    >
                                        <div style={{ marginBottom: "8px" }}>
                                            <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>
                                                数值
                                            </Text>
                                            <Text
                                                style={{
                                                    fontSize: "24px",
                                                    fontWeight: "bold",
                                                    color: item.value[1] === "0" ? "#52c41a" : "#1890ff",
                                                }}
                                            >
                                                {Number.parseFloat(item.value[1]).toLocaleString()}
                                            </Text>
                                        </div>

                                        <div>
                                            <Text type="secondary" style={{ fontSize: "11px", display: "block" }}>
                                                <ClockCircleOutlined style={{ marginRight: "4px" }} />
                                                时间戳
                                            </Text>
                                            <Text style={{ fontSize: "12px", color: "#666" }}>{formatTimestamp(item.value[0])}</Text>
                                        </div>
                                    </div>
                                </Col>
                            </Row>
                        </div>
                    )
                })}
            </Space>
        </div>
    )

    // 图表视图渲染
    const renderChartView = () => (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div style={{ marginBottom: "20px" }}>
                <Title level={5}>
                    <LineChartOutlined style={{ marginRight: "8px", color: "#1890ff" }} />
                    Metrics 趋势图
                </Title>
            </div>
            <div style={{ marginBottom: "20px" }}>
                <EventMetricChart data={chartData} />
            </div>
            <Divider />
            <div>
                <Table
                    columns={tableColumns}
                    dataSource={prepareTableData()}
                    pagination={false}
                    size="small"
                    scroll={{ x: 800 }}
                />
            </div>
        </Space>
    )

    // 根据显示模式渲染内容
    const renderContent = () => {
        if (displayMode === 'card') {
            return renderCardView()
        } else if (displayMode === 'chart') {
            return renderChartView()
        } else {
            // both 模式，显示 tabs
            const tabItems = [
                {
                    key: 'card',
                    label: (
                        <span>
                            <AppstoreOutlined />
                            卡片视图
                        </span>
                    ),
                    children: renderCardView(),
                },
                {
                    key: 'chart',
                    label: (
                        <span>
                            <LineChartOutlined />
                            图表视图
                        </span>
                    ),
                    children: renderChartView(),
                },
            ]

            return (
                <Tabs
                    activeKey={activeTab}
                    onChange={handleTabChange}
                    items={tabItems}
                    style={{ marginTop: "10px" }}
                />
            )
        }
    }

    return (
        <div style={{ minHeight: "500px" }}>
            {/* Header */}
            <div
                style={{
                    padding: "20px 24px",
                    borderBottom: "1px solid #f0f0f0",
                    background: "linear-gradient(135deg, rgb(0 0 0) 0%, rgb(191 191 191) 100%)",
                    borderRadius: "8px 8px 0 0",
                }}
            >
                <Space align="center">
                    <BarChartOutlined style={{ fontSize: "20px", color: "white" }} />
                    <Title level={4} style={{ margin: 0, color: "white" }}>
                        {datasourceType}
                    </Title>
                </Space>
            </div>

            {/* 内容区域 */}
            {renderContent()}
        </div>
    )
}
