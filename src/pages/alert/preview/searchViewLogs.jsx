"use client"

import { useEffect, useState } from "react"
import { Spin, Tag, Empty, Pagination, Typography, Space } from "antd"
import { FileTextOutlined, MessageOutlined } from "@ant-design/icons"
import { SearchViewLogsContent } from "../../../api/datasource"

const { Title, Text } = Typography

export const SearchViewLogs = ({ type, datasourceId, index, query }) => {
    const [logs, setLogs] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const pageSize = 10

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true)
                setError(null)
                const { code, data, msg } = await SearchViewLogsContent({
                    type,
                    datasourceId,
                    index,
                    query,
                })

                if (code === 200) {
                    setLogs(data || null)
                } else {
                    setError(msg || "Failed to load logs")
                }
            } catch (err) {
                setError("Network error occurred")
                console.error("Fetch error:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
    }, [type, datasourceId, index, query])

    const handlePageChange = (page) => {
        setCurrentPage(page)
    }

    const renderLogMessage = (message, index) => {
        try {
            const prettyJson = JSON.stringify(message, null, 2)
            return (
                <div
                    key={index}
                    style={{
                        marginBottom: "16px",
                        borderLeft: "4px solid",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                        padding: "12px"
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px", marginLeft: "10px", marginTop: "10px" }}>
                        <MessageOutlined style={{ color: "#1890ff", marginRight: "8px" }} />
                        <Text strong style={{ fontSize: "16px" }}>
                            Message #{index + 1}
                        </Text>
                    </div>
                    <pre
                        style={{
                            background: "#f8f9fa",
                            borderRadius: "6px",
                            whiteSpace: "pre-wrap",
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            fontSize: "12px",
                            margin: 0,
                            border: "1px solid #e8e8e8",
                            marginLeft: "10px"
                        }}
                    >
                        {prettyJson}
                    </pre>
                </div>
            )
        } catch (e) {
            return (
                <div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                        <MessageOutlined style={{ color: "#ff7875", marginRight: "8px" }} />
                        <Text strong>Message {index + 1}</Text>
                        <Tag color="orange" style={{ marginLeft: "8px" }}>
                            Invalid Format
                        </Tag>
                    </div>
                    <pre
                        style={{
                            background: "#fff2f0",
                            padding: "12px",
                            borderRadius: "6px",
                            whiteSpace: "pre-wrap",
                            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                            fontSize: "12px",
                            margin: 0,
                            border: "1px solid #ffccc7",
                            // maxHeight: "300px",
                            overflowY: "auto",
                        }}
                    >
                        {String(message)}
                    </pre>
                </div>
            )
        }
    }

    const renderPaginatedMessages = () => {
        if (!logs?.Message || logs.Message.length === 0) {
            return (
                <div style={{ textAlign: "center", padding: "40px" }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">No messages available</Text>}
                    />
                </div>
            )
        }

        const startIndex = (currentPage - 1) * pageSize
        const endIndex = startIndex + pageSize
        const currentMessages = logs.Message.slice(startIndex, endIndex)

        return (
            <div>
                <div style={{ marginBottom: "24px" }}>
                    {currentMessages.map((msg, i) => renderLogMessage(msg, startIndex + i))}
                </div>

                {logs.Message.length > pageSize && (
                    <div
                        style={{
                            display: "flex",
                            justifyContent: "center",
                            padding: "20px 0",
                            borderTop: "1px solid #f0f0f0",
                            background: "#fafafa",
                            borderRadius: "0 0 8px 8px",
                        }}
                    >
                        <Pagination
                            current={currentPage}
                            pageSize={pageSize}
                            total={logs.Message.length}
                            onChange={handlePageChange}
                            showSizeChanger={false}
                            showQuickJumper
                            showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} messages`}
                            style={{ margin: 0 }}
                        />
                    </div>
                )}
            </div>
        )
    }

    return (
        <div>
            {loading ? (
                <div
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <Spin tip="Loading logs..." size="large" />
                    <Text type="secondary" style={{ marginTop: "16px" }}>
                        Please wait while we fetch the logs...
                    </Text>
                </div>
            ) : error ? (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        // height: "100%",
                        background: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <Empty
                        description={
                            <div>
                                <Text type="danger" strong>
                                    {error}
                                </Text>
                                <br />
                                <Text type="secondary">Please try again later</Text>
                            </div>
                        }
                    />
                </div>
            ) : !logs ? (
                <div
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                    }}
                >
                    <Empty description={<Text type="secondary">No logs available</Text>} />
                </div>
            ) : (
                <>
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
                            <FileTextOutlined style={{ fontSize: "20px", color: "white" }} />
                            <Title level={4} style={{ margin: 0, color: "white" }}>
                                {logs.ProviderName}
                            </Title>
                            <Tag
                                color="white"
                                style={{
                                    color: "#667eea",
                                    border: "1px solid white",
                                    fontWeight: "500",
                                }}
                            >
                                {logs.Message?.length || 0} messages
                            </Tag>
                        </Space>
                    </div>

                    {/* Content */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: "auto",
                            marginTop: "10px",
                        }}
                    >
                        {renderPaginatedMessages()}
                    </div>
                </>
            )}
        </div>
    )
}
