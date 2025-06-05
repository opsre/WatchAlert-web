import { useEffect, useState } from "react"
import { Spin, Tag, Empty, Card, Typography, Space, Divider, Row, Col, Alert } from "antd"
import {
    ClockCircleOutlined,
    TagsOutlined,
    BarChartOutlined,
    FileTextOutlined,
} from "@ant-design/icons"
import {queryPromMetrics} from '../../../api/other'

const { Title, Text } = Typography

interface MetricItem {
    metric: Record<string, string>
    value: [number, string]
}

interface SearchViewMetricsProps {
    datasourceType: string
    datasourceId: string[]
    promQL: string
}

export const SearchViewMetrics = ({ datasourceType, datasourceId, promQL }: SearchViewMetricsProps) => {
    const [metrics, setMetrics] = useState<MetricItem[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchMetrics = async () => {
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
                    .filter((item) => item.status === "success" && item.data?.result?.length > 0)
                    .flatMap((item) => item.data.result)

                setMetrics(allResults)
            } catch (err) {
                setError(err instanceof Error ? err.message : "网络错误")
                console.error("Fetch error:", err)
            } finally {
                setLoading(false)
            }
        }

        if (datasourceId.length > 0 && promQL) {
            fetchMetrics()
        }
    }, [datasourceId, promQL])

    const formatTimestamp = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString("zh-CN")
    }

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

            {/* Metrics 列表 */}
            <div>
                <Space direction="vertical" size="middle" style={{ width: "100%", marginTop: "10px" }}>
                    {metrics.map((item, index) => {
                        const metricKeys = Object.keys(item.metric).filter((key) => key !== "__name__")

                        return (
                            <Card
                                key={index}
                                hoverable
                                style={{
                                    borderLeft: `4px solid`,
                                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
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
                            </Card>
                        )
                    })}
                </Space>
            </div>
        </div>
    )
}
