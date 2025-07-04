"use client"

import { useState, useEffect, useMemo } from "react"
import {
    Table,
    message,
    Tag,
    Button,
    Drawer,
    Divider,
    Input,
    Select,
    Space,
    Typography,
    Card,
    Tooltip,
    Empty,
    Skeleton,
} from "antd"
import { noticeRecordList } from "../../api/notice"
import VSCodeEditor from "../../utils/VSCodeEditor";
import { NotificationTypeIcon } from "./notification-type-icon"
import { SearchIcon, FilterIcon, AlertTriangle, CheckCircle, XCircle, Clock, FileText, RefreshCw } from "lucide-react"
import {HandleShowTotal} from "../../utils/lib";

const { Title, Text } = Typography
const { Search } = Input

// Constants
const SEVERITY_COLORS = {
    P0: '#ff4d4f',
    P1: '#faad14',
    P2: '#b0e1fb'
}

const SEVERITY_LABELS = {
    P0: "P0",
    P1: "P1",
    P2: "P2",
}

const ITEMS_PER_PAGE = 10

export const NoticeRecords = () => {
    const [height, setHeight] = useState(window.innerHeight)
    const [loading, setLoading] = useState(false)
    const [list, setList] = useState([])
    const [selectedRecord, setSelectedRecord] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [filters, setFilters] = useState({
        severity: undefined,
        status: undefined,
        query: "",
    })
    const [pagination, setPagination] = useState({
        pageIndex: 1,
        pageSize: ITEMS_PER_PAGE,
        pageTotal: 0,
    })

    // Table columns definition
    const columns = useMemo(
        () => [
            {
                title: "规则名称",
                dataIndex: "ruleName",
                key: "ruleName",
                ellipsis: true,
                render: (text) => (
                    <Tooltip title={text}>
                        <span>{text}</span>
                    </Tooltip>
                ),
            },
            {
                title: "告警等级",
                dataIndex: "severity",
                key: "severity",
                width: 120,
                render: (text) => (
                    <Tag
                        color={SEVERITY_COLORS[text]}
                        style={{
                            borderRadius: "12px",
                            padding: "0 10px",
                            fontSize: "12px",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        <AlertTriangle size={12} />
                        {SEVERITY_LABELS[text] || text}
                    </Tag>
                ),
            },
            {
                title: "通知类型",
                dataIndex: "nType",
                key: "nType",
                width: 120,
                render: (type) => (
                    <div style={{ display: "flex" }}>
                        <NotificationTypeIcon type={type} />
                    </div>
                ),
            },
            {
                title: "通知对象",
                dataIndex: "nObj",
                key: "nObj",
                ellipsis: true,
                render: (text) => (
                    <Tooltip title={text}>
                        <span>{text}</span>
                    </Tooltip>
                ),
            },
            {
                title: "状态",
                dataIndex: "status",
                key: "status",
                width: 120,
                render: (status) =>
                    status === 0 ? (
                        <Tag
                            icon={<CheckCircle size={12} />}
                            color="success"
                            style={{
                                borderRadius: "12px",
                                padding: "0 10px",
                                fontSize: "12px",
                                fontWeight: "500",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            发送成功
                        </Tag>
                    ) : (
                        <Tag
                            icon={<XCircle size={12} />}
                            color="error"
                            style={{
                                borderRadius: "12px",
                                padding: "0 10px",
                                fontSize: "12px",
                                fontWeight: "500",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            发送失败
                        </Tag>
                    ),
            },
            {
                title: "通知时间",
                dataIndex: "createAt",
                key: "createAt",
                width: 180,
                render: (text) => {
                    const date = new Date(text * 1000)
                    return (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={14} />
                            <span>{date.toLocaleString()}</span>
                        </div>
                    )
                },
            },
            {
                title: "内容详情",
                width: 100,
                render: (_, record) => (
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => showDrawer(record)}
                        style={{
                            backgroundColor: "#000",
                            borderRadius: "6px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            padding: "0 12px",
                            height: "28px",
                        }}
                    >
                        <FileText size={14} />
                        详情
                    </Button>
                ),
            },
        ],
        [],
    )

    // Initialize chart and fetch data
    useEffect(() => {
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        fetchRecords(pagination.pageIndex, pagination.pageSize)

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    // Fetch records when filters change
    useEffect(() => {
        fetchRecords(1, pagination.pageSize)
    }, [filters])

    // Fetch notification records
    const fetchRecords = async (pageIndex, pageSize) => {
        try {
            setLoading(true)
            const params = {
                index: pageIndex,
                size: pageSize,
                severity: filters.severity,
                status: filters.status,
                query: filters.query || undefined,
            }

            const res = await noticeRecordList(params)

            setList(res.data.list || [])
            setPagination({
                pageIndex: res.data.index,
                pageSize,
                pageTotal: res.data.total,
            })
        } catch (error) {
            console.error("Failed to load records:", error)
            message.error("加载通知记录失败，请稍后重试")
        } finally {
            setLoading(false)
        }
    }

    // Handle page change
    const handlePageChange = (page) => {
        const newPagination = {
            ...pagination,
            pageIndex: page.current,
            pageSize: page.pageSize,
        }
        setPagination(newPagination)
        fetchRecords(page.current, page.pageSize)
    }

    // Format pagination display
    const handleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

    // Show drawer with record details
    const showDrawer = (record) => {
        setSelectedRecord(record)
        setDrawerOpen(true)
    }

    // Handle filter changes
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }))
    }

    // Handle refresh
    const handleRefresh = () => {
        fetchRecords(pagination.pageIndex, pagination.pageSize)
    }

    return (
        <div style={{ minHeight: "80vh" }}>
            {/* Filters */}
            <div
                style={{
                    marginTop: '-10px',
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                    marginBottom: "20px",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <FilterIcon size={16} />
                    <Text strong>筛选：</Text>
                </div>

                <Select
                    placeholder="告警等级"
                    allowClear
                    style={{ width: 140 }}
                    value={filters.severity}
                    onChange={(value) => handleFilterChange("severity", value)}
                    options={[
                        { value: "P0", label: "P0级告警" },
                        { value: "P1", label: "P1级告警" },
                        { value: "P2", label: "P2级告警" },
                    ]}
                    suffixIcon={<AlertTriangle size={14} />}
                />

                <Select
                    placeholder="发送状态"
                    allowClear
                    style={{ width: 140 }}
                    value={filters.status}
                    onChange={(value) => handleFilterChange("status", value)}
                    options={[
                        { value: "0", label: "发送成功" },
                        { value: "1", label: "发送失败" },
                    ]}
                />

                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    value={filters.query}
                    onChange={(e) => handleFilterChange("query", e.target.value)}
                    onSearch={() => fetchRecords(1, pagination.pageSize)}
                    style={{ width: 300 }}
                    prefix={<SearchIcon size={14} />}
                />

                <Button type="default" icon={<RefreshCw size={14} />} onClick={handleRefresh} loading={loading}>
                    刷新
                </Button>
            </div>

            {/* Records Table */}
            <Table
                columns={columns}
                dataSource={list}
                loading={loading}
                scroll={{
                    y: height - 280,
                    x: "max-content",
                }}
                pagination={{
                    current: pagination.pageIndex,
                    pageSize: pagination.pageSize,
                    total: pagination.pageTotal,
                    showTotal: HandleShowTotal,
                    showSizeChanger: true,
                    pageSizeOptions: ["10"],
                    style: { marginTop: "16px" },
                }}
                onChange={handlePageChange}
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
                rowKey={(record) => record.id}
                locale={{
                    emptyText: <Empty description="暂无通知记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                }}
                rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
            />

            {/* Detail Drawer */}
            <Drawer
                title={
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <FileText size={18} />
                        <span>通知详情</span>
                    </div>
                }
                size="large"
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                styles={{
                    header: { borderBottom: "1px solid #f0f0f0", padding: "16px 24px" },
                    body: { padding: "24px" },
                }}
                extra={
                    selectedRecord && (
                        <Space>
                            <Tag
                                color={SEVERITY_COLORS[selectedRecord.severity]}
                                style={{
                                    borderRadius: "12px",
                                    padding: "0 10px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                }}
                            >
                                {selectedRecord.severity}
                            </Tag>
                            {selectedRecord.status === 0 ? (
                                <Tag color="success" style={{ borderRadius: "12px" }}>
                                    发送成功
                                </Tag>
                            ) : (
                                <Tag color="error" style={{ borderRadius: "12px" }}>
                                    发送失败
                                </Tag>
                            )}
                        </Space>
                    )
                }
            >
                {selectedRecord ? (
                    <>
                        <div style={{ marginBottom: "24px" }}>
                            <Title level={5}>基本信息</Title>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "120px 1fr",
                                    gap: "12px",
                                    backgroundColor: "#f9f9f9",
                                    padding: "16px",
                                    borderRadius: "8px",
                                }}
                            >
                                <Text type="secondary">规则名称：</Text>
                                <Text strong>{selectedRecord.ruleName}</Text>

                                <Text type="secondary">通知对象：</Text>
                                <Text>{selectedRecord.nObj}</Text>

                                <Text type="secondary">通知时间：</Text>
                                <Text>{new Date(selectedRecord.createAt * 1000).toLocaleString()}</Text>
                            </div>
                        </div>

                        <Title level={5}>告警消息体</Title>
                        <VSCodeEditor value={selectedRecord.alarmMsg} />

                        <Divider style={{ margin: "24px 0" }} />

                        <Title level={5}>错误消息体</Title>
                        <VSCodeEditor value={selectedRecord.errMsg || "null"} />
                    </>
                ) : (
                    <Skeleton active paragraph={{ rows: 10 }} />
                )}
            </Drawer>
        </div>
    )
}
