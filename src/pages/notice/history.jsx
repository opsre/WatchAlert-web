"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Table, message, Tag, Button, Drawer, Divider, Input, Select, Space } from "antd"
import { noticeRecordList, noticeRecordMetric } from "../../api/notice"
import * as echarts from "echarts"
import Editor from "@monaco-editor/react"
import { NotificationTypeIcon } from "./notification-type-icon"

// Constants
const SEVERITY_COLORS = {
    P0: "red",
    P1: "orange",
    P2: "yellow",
}

const ITEMS_PER_PAGE = 10

export const NoticeRecords = () => {
    const { Search } = Input
    const chartRef = useRef(null)
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
            },
            {
                title: "告警等级",
                dataIndex: "severity",
                key: "severity",
                render: (text) => (
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <div
                            style={{
                                width: "8px",
                                height: "8px",
                                backgroundColor: SEVERITY_COLORS[text],
                                borderRadius: "50%",
                                marginRight: "8px",
                            }}
                        />
                        {text}
                    </div>
                ),
            },
            {
                title: "通知类型",
                dataIndex: "nType",
                key: "nType",
                render: (type) => <NotificationTypeIcon type={type} />,
            },
            {
                title: "通知对象",
                dataIndex: "nObj",
                key: "nObj",
            },
            {
                title: "状态",
                dataIndex: "status",
                key: "status",
                render: (status) => (status === 0 ? <Tag color="success">发送成功</Tag> : <Tag color="error">发送失败</Tag>),
            },
            {
                title: "通知时间",
                dataIndex: "createAt",
                key: "createAt",
                render: (text) => {
                    const date = new Date(text * 1000)
                    return date.toLocaleString()
                },
            },
            {
                title: "内容详情",
                width: 120,
                render: (_, record) => (
                    <Button type="link" onClick={() => showDrawer(record)}>
                        详情
                    </Button>
                ),
            },
        ],
        [],
    )

    // Initialize chart and fetch data
    useEffect(() => {
        let myChart = null

        const initChart = () => {
            const chartDom = chartRef.current
            if (!chartDom) return

            myChart = echarts.init(chartDom)
            fetchMetricData(myChart)
        }

        const handleResize = () => {
            setHeight(window.innerHeight)
            myChart?.resize()
        }

        initChart()
        fetchRecords(pagination.pageIndex, pagination.pageSize)

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
            myChart?.dispose()
        }
    }, [])

    // Fetch records when filters change
    useEffect(() => {
        fetchRecords(1, pagination.pageSize)
    }, [filters])

    // Fetch metric data for the chart
    const fetchMetricData = async (chart) => {
        try {
            const res = await noticeRecordMetric()
            const { date, series } = res.data

            const option = {
                grid: {
                    left: "10px",
                    right: "10px",
                    top: "25px",
                    bottom: "10px",
                    containLabel: true,
                },
                tooltip: {
                    trigger: "axis",
                    axisPointer: { type: "cross" },
                },
                legend: {
                    data: ["P0", "P1", "P2"],
                    left: 35,
                },
                xAxis: {
                    type: "category",
                    data: date,
                },
                yAxis: {
                    type: "value",
                },
                series: [
                    { name: "P0", data: series.p0, type: "line", itemStyle: { color: SEVERITY_COLORS.P0 } },
                    { name: "P1", data: series.p1, type: "line", itemStyle: { color: SEVERITY_COLORS.P1 } },
                    { name: "P2", data: series.p2, type: "line", itemStyle: { color: SEVERITY_COLORS.P2 } },
                ],
            }

            chart.setOption(option)
        } catch (error) {
            message.error("加载图表数据失败")
            console.error("Failed to load metric data:", error)
        }
    }

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

    // Monaco editor component
    const CodeEditor = ({ value, language = "json" }) => (
        <Editor
            height="250px"
            defaultLanguage={language}
            value={value || "null"}
            options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: true,
                formatOnType: true,
                formatOnPaste: true,
            }}
        />
    )

    return (
        <>
            {/* Filters */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                gap: '10px'}}>
                    <Space style={{ marginBottom: 16 }} wrap>
                        <Select
                            placeholder="告警等级"
                            allowClear
                            style={{ width: 120 }}
                            value={filters.severity}
                            onChange={(value) => handleFilterChange("severity", value)}
                            options={[
                                { value: "P0", label: "P0级告警" },
                                { value: "P1", label: "P1级告警" },
                                { value: "P2", label: "P2级告警" },
                            ]}
                        />

                        <Select
                            placeholder="发送状态"
                            allowClear
                            style={{ width: 120 }}
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
                            style={{ width: 250 }}
                        />
                    </Space>
            </div>

            {/* Chart */}
            <div
                ref={chartRef}
                style={{
                    marginTop: "5px",
                    width: "100%",
                    height: "200px",
                    border: "1px solid #eee",
                    borderRadius: "8px",
                    padding: "0",
                }}
            />

            {/* Records Table */}
            <div style={{ marginTop: "16px" }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    loading={loading}
                    scroll={{
                        y: height - 600,
                        x: "max-content",
                    }}
                    pagination={{
                        current: pagination.pageIndex,
                        pageSize: pagination.pageSize,
                        total: pagination.pageTotal,
                        showTotal: handleShowTotal,
                        showSizeChanger: true,
                    }}
                    onChange={handlePageChange}
                    bordered
                    style={{ backgroundColor: "#fff" }}
                    rowKey={(record) => record.id}
                />
            </div>

            {/* Detail Drawer */}
            <Drawer title="事件详情" size="large" onClose={() => setDrawerOpen(false)} open={drawerOpen}>
                {selectedRecord && (
                    <>
                        <h3>告警消息体</h3>
                        <CodeEditor value={selectedRecord.alarmMsg} />

                        <Divider />

                        <h3>错误消息体</h3>
                        <CodeEditor value={selectedRecord.errMsg || "null"} />
                    </>
                )}
            </Drawer>
        </>
    )
}

