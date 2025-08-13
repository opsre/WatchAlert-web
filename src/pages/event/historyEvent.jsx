"use client"
import React, { useState, useEffect, useCallback } from "react"
import {
    Table,
    Button,
    Drawer,
    Tag,
    Select,
    Space,
    DatePicker,
    Input,
    message,
    Modal,
    Descriptions,
    Menu,
    Dropdown,
    Tooltip,
    Divider,
    Typography,
    Card,
    List,
    Avatar,
    Popconfirm,
} from "antd"
import { DownloadOutlined, EllipsisOutlined, ReloadOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { AddEventComment, DeleteEventComment, getHisEventList, ListEventComments } from "../../api/event"
import TextArea from "antd/es/input/TextArea"
import { AlertTriangle, Clock } from "lucide-react"
import { useLocation, useNavigate } from "react-router-dom"
import { exportAlarmRecordToHTML } from "../../utils/exportAlarmRecordToHTML"
import {
    FormatDuration,
    FormatTime,
    GetBlockColor,
    GetDurationGradient,
    HandleApiError,
    HandleShowTotal,
    RenderTruncatedText,
} from "../../utils/lib"

const { Title, Text } = Typography
const { RangePicker } = DatePicker
const { Search } = Input

export const AlertHistoryEvent = (props) => {
    const { id } = props
    const navigate = useNavigate()
    const location = useLocation()

    // State Management
    const [historyEventList, setHistoryEventList] = useState([])
    const [searchQuery, setSearchQuery] = useState("") // State for the actual search query used in API
    const [selectedDataSource, setSelectedDataSource] = useState("")
    const [selectedAlertLevel, setSelectedAlertLevel] = useState("")
    const [startTimestamp, setStartTimestamp] = useState(null)
    const [endTimestamp, setEndTimestamp] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [historyPagination, setHistoryPagination] = useState({
        pageIndex: 1,
        pageSize: 10,
        pageTotal: 0,
    })
    const [loading, setLoading] = useState(true)
    const [height, setHeight] = useState(window.innerHeight)
    const [comments, setComments] = useState([])
    const [newComment, setNewComment] = useState("")
    const [sortOrder, setSortOrder] = useState(null)

    // Export related states
    const [exportModalVisible, setExportModalVisible] = useState(false)
    const [exportTimeRange, setExportTimeRange] = useState([null, null])
    const [exportFilters, setExportFilters] = useState({
        ruleName: "",
        ruleType: "",
        alertLevel: "",
    })
    const [exportLoading, setExportLoading] = useState(false)
    const [exportOptions, setExportOptions] = useState({
        timeRange: "all", // all, custom
        filterOptions: [], // ruleName, ruleType, alertLevel
        itemsPerPage: 10, // 导出HTML的每页项目数
    })

    // Constants
    const SEVERITY_COLORS = {
        P0: "#ff4d4f",
        P1: "#faad14",
        P2: "#b0e1fb",
    }
    const SEVERITY_LABELS = {
        P0: "P0",
        P1: "P1",
        P2: "P2",
    }

    // Table Column Definitions
    const columns = [
        {
            title: "告警等级",
            dataIndex: "severity",
            key: "severity",
            width: "100px",
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
            title: "事件信息",
            key: "rule_info",
            width: "300px",
            ellipsis: true,
            render: (_, record) => {
                let contentString
                // Determine the full content string based on datasource_type
                if (
                    record.datasource_type === "AliCloudSLS" ||
                    record.datasource_type === "Loki" ||
                    record.datasource_type === "ElasticSearch" ||
                    record.datasource_type === "VictoriaLogs" ||
                    record.datasource_type === "ClickHouse"
                ) {
                    contentString = JSON.stringify(
                        record?.labels
                            ? Object.entries(record.labels)
                                .filter(([key]) => !["value", "rule_name", "severity", "fingerprint"].includes(key))
                                .reduce((acc, [key, value]) => {
                                    acc[key] = value
                                    return acc
                                }, {})
                            : {},
                        null,
                        2,
                    )
                } else {
                    contentString = record.annotations
                }
                const maxLength = 80
                const displayContent =
                    contentString.length > maxLength ? contentString.substring(0, maxLength) + "..." : contentString
                return (
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        {/* 规则名称 */}
                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: "500",
                                lineHeight: "1.2",
                            }}
                        >
                            {record.datasource_type} / {record.rule_name}
                        </div>
                        {/* 事件详情 */}
                        <div
                            style={{
                                fontSize: "12px",
                                color: "#999",
                                lineHeight: "1.4",
                            }}
                        >
                            <Tooltip title={contentString} placement="topLeft">
                                <span style={{ cursor: contentString.length > maxLength ? "help" : "default" }}>{displayContent}</span>
                            </Tooltip>
                        </div>
                    </div>
                )
            },
        },
        {
            title: "告警时间",
            key: "trigger_and_recover_time",
            width: "130px",
            render: (text, record) => {
                const triggerTime = new Date(record.first_trigger_time * 1000).toLocaleString()
                const recoverTime = new Date(record.recover_time * 1000).toLocaleString()
                return (
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                            fontSize: "13px",
                            lineHeight: "1.4",
                        }}
                    >
                        <div>{triggerTime}</div>
                        <div>{recoverTime}</div>
                    </div>
                )
            },
        },
        {
            title: "持续时长",
            dataIndex: "first_trigger_time",
            key: "duration",
            width: "160px",
            sorter: true,
            render: (_, record) => {
                const durationText = FormatDuration(record.first_trigger_time, record.recover_time)
                const gradientStyle = GetDurationGradient(record.first_trigger_time, record.recover_time)
                const totalBlocks = 10
                return (
                    <div>
                        {/* 时间文本 */}
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#262626",
                                fontFamily: "monospace",
                                marginBottom: "6px",
                            }}
                        >
                            <Clock size={12} style={{ color: "#8c8c8c" }} />
                            <span>{durationText}</span>
                        </div>
                        {/* 一行方块 */}
                        <div
                            style={{
                                display: "flex",
                                gap: "2px",
                                width: "100%",
                                justifyContent: "flex-start",
                            }}
                        >
                            {[...Array(totalBlocks)].map((_, blockIndex) => {
                                const blockColor = GetBlockColor(blockIndex, totalBlocks, gradientStyle.intensity)
                                const isActive = blockColor !== "#e8e8e8"
                                return (
                                    <div
                                        key={blockIndex}
                                        style={{
                                            width: "10px",
                                            height: "8px",
                                            borderRadius: "2px",
                                            backgroundColor: blockColor,
                                            transition: "all 0.3s ease",
                                            boxShadow: isActive ? `0 0 3px ${blockColor}` : "none",
                                            opacity: isActive ? 1 : 0.3,
                                        }}
                                    />
                                )
                            })}
                        </div>
                    </div>
                )
            },
        },
        {
            title: "事件状态",
            dataIndex: "status",
            key: "status",
            width: "100px",
            render: () => {
                return <Tag color={"green"}>{"已恢复"}</Tag>
            },
        },
        {
            title: "处理人",
            dataIndex: "upgradeState",
            key: "upgradeState",
            width: "100px",
            render: (text) => {
                return (
                    <>
                        {(text.whoAreConfirm === text.whoAreHandle && (
                            <Tag
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
                                {text.whoAreHandle || "无"}
                            </Tag>
                        )) || (
                            <>
                                {text.whoAreConfirm !== "" && (
                                    <Tag
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
                                        {text.whoAreConfirm}
                                    </Tag>
                                )}
                                {text.whoAreHandle !== "" && (
                                    <Tag
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
                                        {text.whoAreHandle}
                                    </Tag>
                                )}
                            </>
                        )}
                    </>
                )
            },
        },
        {
            title: "操作",
            key: "action",
            width: "100px",
            render: (_, record) => {
                const menu = (
                    <Menu>
                        <Menu.Item onClick={() => showDrawer(record)}>查看详情</Menu.Item>
                    </Menu>
                )
                return (
                    <Dropdown overlay={menu} trigger={["click"]}>
                        <EllipsisOutlined style={{ fontSize: 20, cursor: "pointer" }} />
                    </Dropdown>
                )
            },
        },
    ]

    const rangePresets = [
        {
            label: "Last 7 Days",
            value: [dayjs().subtract(7, "d"), dayjs()],
        },
        {
            label: "Last 14 Days",
            value: [dayjs().subtract(14, "d"), dayjs()],
        },
        {
            label: "Last 30 Days",
            value: [dayjs().subtract(30, "d"), dayjs()],
        },
        {
            label: "Last 90 Days",
            value: [dayjs().subtract(90, "d"), dayjs()],
        },
    ]

    // Effects
    useEffect(() => {
        // Handle window resize
        const handleResize = () => {
            setHeight(window.innerHeight)
        }
        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('query');
        if (query) {
            setSearchQuery(query);
        }
    }, [location.search]);

    // Centralized data fetching function
    const fetchHistoryEvents = async () => {
        try {
            const params = {
                faultCenterId: id,
                index: historyPagination.pageIndex,
                size: historyPagination.pageSize,
                query: searchQuery || undefined,
                datasourceType: selectedDataSource || undefined,
                severity: selectedAlertLevel || undefined,
                startAt: startTimestamp || undefined,
                endAt: endTimestamp || undefined,
                sortOrder: sortOrder || undefined,
            }
            setLoading(true)
            const res = await getHisEventList(params)
            if (res?.data?.list) {
                setHistoryEventList(res.data.list)
                setHistoryPagination((prev) => ({
                    ...prev,
                    pageTotal: res.data.total,
                }))
                // If current page has no data but total > 0 and not page 1, reset to page 1
                if (res.data.total > 0 && res.data.list.length === 0 && historyPagination.pageIndex > 1) {
                    setHistoryPagination((prev) => ({
                        ...prev,
                        pageIndex: 1, // This will trigger the main useEffect again
                    }))
                }
            }
        } catch (error) {
            HandleApiError(error)
        } finally {
            setLoading(false)
        }
    }

    // Main data fetching effect: triggers on dependency changes
    useEffect(() => {
        fetchHistoryEvents()
    }, [
        selectedDataSource,
        selectedAlertLevel,
        startTimestamp,
        endTimestamp,
        searchQuery, // This is updated by input and URL sync
        historyPagination.pageIndex, // This is updated by table pagination and search reset
        historyPagination.pageSize,
        sortOrder,
    ])

    // Event Handlers
    const showDrawer = (record) => {
        setSelectedEvent(record)
        setDrawerOpen(true)
    }

    const onCloseDrawer = () => {
        setDrawerOpen(false)
    }

    const handleDataSourceChange = (value) => {
        setSelectedDataSource(value)
        setHistoryPagination((prev) => ({ ...prev, pageIndex: 1 })) // Reset page on filter change
    }

    const handleHistoryPageChange = (pagination, filters, sorter) => {
        setSortOrder(sorter.order) // Update sort order
        setHistoryPagination({
            ...historyPagination,
            pageIndex: pagination.current,
            pageSize: pagination.pageSize,
        })
        // The useEffect will now trigger the data fetch
    }

    const onSearchChange = (key) => {
        setSearchQuery(key);
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('query', key);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    };

    // Function to handle search submission (Enter or search button)
    const handleSearchSubmit = (value) => {
        // When search is submitted, reset page to 1
        setHistoryPagination((prev) => ({ ...prev, pageIndex: 1 }))
        // The `searchQuery` is already updated by `handleSearchInputChange`
        // and the `useEffect` above will handle URL update and trigger data fetch.
    }

    const handleSeverityChange = (value) => {
        setSelectedAlertLevel(value)
        setHistoryPagination((prev) => ({ ...prev, pageIndex: 1 })) // Reset page on filter change
    }

    const onDateRangeChange = (dates) => {
        if (dates && dates.length === 2) {
            setStartTimestamp(dates[0] ? dates[0].unix() : null)
            setEndTimestamp(dates[1] ? dates[1].unix() : null)
            setHistoryPagination((prev) => ({ ...prev, pageIndex: 1 })) // Reset page on date change
        } else {
            setStartTimestamp(null)
            setEndTimestamp(null)
            setHistoryPagination((prev) => ({ ...prev, pageIndex: 1 })) // Reset page on date clear
        }
    }

    // Open export modal
    const openExportModal = () => {
        // Use current filter conditions as default values for export
        setExportFilters({
            ruleName: searchQuery,
            ruleType: selectedDataSource,
            alertLevel: selectedAlertLevel,
        })
        setExportTimeRange([
            startTimestamp ? dayjs.unix(startTimestamp) : null,
            endTimestamp ? dayjs.unix(endTimestamp) : null,
        ])
        setExportOptions({
            ...exportOptions,
            timeRange: startTimestamp && endTimestamp ? "custom" : "all",
            filterOptions: [
                ...(searchQuery ? ["ruleName"] : []),
                ...(selectedDataSource ? ["ruleType"] : []),
                ...(selectedAlertLevel ? ["alertLevel"] : []),
            ],
        })
        setExportModalVisible(true)
    }

    // Export related functions
    const fetchExportData = async () => {
        try {
            // Build export parameters
            const params = {
                faultCenterId: id,
                index: 1,
                size: 10000, // Get enough data for export
                query: exportFilters.ruleName || undefined,
                datasourceType: exportFilters.ruleType || undefined,
                severity: exportFilters.alertLevel || undefined,
                startAt: exportOptions.timeRange === "custom" && exportTimeRange[0] ? exportTimeRange[0].unix() : undefined,
                endAt: exportOptions.timeRange === "custom" && exportTimeRange[1] ? exportTimeRange[1].unix() : undefined,
            }
            setExportLoading(true)
            const res = await getHisEventList(params)
            setExportLoading(false)
            return res.data.list
        } catch (error) {
            console.error(error)
            setExportLoading(false)
            message.error("获取导出数据失败")
            return []
        }
    }

    const handleExportOptionsChange = (type, value) => {
        if (type === "timeRange") {
            setExportOptions({
                ...exportOptions,
                timeRange: value,
            })
        } else if (type === "filterOptions") {
            setExportOptions({
                ...exportOptions,
                filterOptions: value,
            })
        } else if (type === "itemsPerPage") {
            setExportOptions({
                ...exportOptions,
                itemsPerPage: value,
            })
        }
    }

    async function handleExportClick() {
        const data = await fetchExportData() // Keep this function in your component to get data
        if (data.length === 0) {
            message.info("没有数据可供导出")
            return
        }
        exportAlarmRecordToHTML(
            "历史告警报表",
            data,
            {
                ruleName: searchQuery,
                ruleType: selectedDataSource,
                alertLevel: selectedAlertLevel,
            },
            exportTimeRange,
        )
    }

    const handleListComments = async () => {
        if (!selectedEvent) {
            return
        }
        try {
            const comment = {
                tenantId: selectedEvent.tenantId,
                fingerprint: selectedEvent.fingerprint,
            }
            const res = await ListEventComments(comment)
            setComments(res.data)
        } catch (error) {
            HandleApiError(error)
        }
    }

    // Add new comment
    const handleAddComment = async () => {
        if (!newComment.trim()) {
            message.warning("请输入评论内容")
            return
        }
        try {
            const comment = {
                tenantId: selectedEvent.tenantId,
                faultCenterId: selectedEvent.faultCenterId,
                fingerprint: selectedEvent.fingerprint,
                content: newComment.trim(),
            }
            await AddEventComment(comment)
            await handleListComments()
            setNewComment("")
            message.success("评论添加成功")
        } catch (error) {
            HandleApiError(error)
        }
    }

    // Handle Enter key press for comments
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleAddComment()
        }
    }

    // Delete comment
    const handleDeleteComment = async (commentId) => {
        try {
            const comment = {
                tenantId: selectedEvent.tenantId,
                commentId: commentId,
            }
            await DeleteEventComment(comment)
            await handleListComments()
            message.success("评论删除成功")
        } catch (error) {
            HandleApiError(error)
        }
    }

    useEffect(() => {
        if (drawerOpen && selectedEvent) {
            handleListComments()
        }
    }, [drawerOpen, selectedEvent]) // Fetch comments when drawer opens or selected event changes

    // Render JSX
    return (
        <React.Fragment>
            {/* Filter and Action Area */}
            <Space style={{ marginBottom: 16 }} wrap>
                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={handleSearchSubmit} // On search button click or Enter
                    value={searchQuery} // Controlled component
                    onChange={(e) => onSearchChange(e.target.value)}
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="选择类型"
                    style={{ width: 150 }}
                    allowClear
                    value={selectedDataSource || null}
                    onChange={handleDataSourceChange}
                    options={[
                        { value: "Prometheus", label: "Prometheus" },
                        { value: "VictoriaMetrics", label: "VictoriaMetrics" },
                        { value: "AliCloudSLS", label: "AliCloudSLS" },
                        { value: "Jaeger", label: "Jaeger" },
                        { value: "Loki", label: "Loki" },
                        { value: "ElasticSearch", label: "ElasticSearch" },
                        { value: "VictoriaLogs", label: "VictoriaLogs" },
                        { value: "ClickHouse", labels: "ClickHouse" },
                    ]}
                />
                <Select
                    placeholder="选择告警等级"
                    style={{ width: 150 }}
                    allowClear
                    value={selectedAlertLevel || null}
                    onChange={handleSeverityChange}
                    options={[
                        { value: "P0", label: "P0级告警" },
                        { value: "P1", label: "P1级告警" },
                        { value: "P2", label: "P2级告警" },
                    ]}
                />
                <RangePicker
                    showTime
                    format="YYYY-MM-DD HH:mm:ss"
                    onChange={onDateRangeChange}
                    onOk={onDateRangeChange}
                    presets={rangePresets}
                />
                <Button icon={<ReloadOutlined />} onClick={() => fetchHistoryEvents()}>
                    刷新
                </Button>
                <Button icon={<DownloadOutlined />} onClick={openExportModal}>
                    导出
                </Button>
            </Space>

            {/* Data Table */}
            <Table
                columns={columns}
                dataSource={historyEventList}
                loading={loading}
                pagination={{
                    current: historyPagination.pageIndex,
                    pageSize: historyPagination.pageSize,
                    total: historyPagination.pageTotal,
                    showTotal: HandleShowTotal,
                    pageSizeOptions: ["10"],
                }}
                onChange={handleHistoryPageChange}
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
                rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                rowKey={(record) => record.id}
                scroll={{
                    y: height - 480,
                    x: "max-content",
                }}
            />

            {/* Detail Drawer */}
            <Drawer
                title="事件详情"
                placement="right"
                onClose={onCloseDrawer}
                open={drawerOpen}
                width={1000}
                styles={{
                    body: { padding: "16px" },
                }}
            >
                {selectedEvent && (
                    <div>
                        <Descriptions
                            title="基本信息"
                            bordered
                            column={2}
                            style={{ marginBottom: "24px" }}
                            items={[
                                {
                                    key: "rule_name",
                                    label: "规则名称",
                                    children: RenderTruncatedText(selectedEvent.rule_name),
                                },
                                {
                                    key: "fingerprint",
                                    label: "告警指纹",
                                    children: RenderTruncatedText(selectedEvent.fingerprint),
                                },
                                {
                                    key: "datasource",
                                    label: "数据源",
                                    children: RenderTruncatedText(`${selectedEvent.datasource_type} (${selectedEvent.datasource_id})`),
                                },
                                {
                                    key: "severity",
                                    label: "告警等级",
                                    children: <Tag color={SEVERITY_COLORS[selectedEvent.severity]}>{selectedEvent.severity}</Tag>,
                                },
                                {
                                    key: "status",
                                    label: "事件状态",
                                    children: <Tag color={"green"}>{"已恢复"}</Tag>,
                                },
                                {
                                    key: "value",
                                    label: "恢复时值",
                                    children: RenderTruncatedText(selectedEvent?.labels["value"] || 0),
                                },
                                {
                                    key: "handle",
                                    label: "处理人",
                                    children: (
                                        <>
                                            {(selectedEvent?.upgradeState?.whoAreConfirm === selectedEvent?.upgradeState?.whoAreHandle && (
                                                <Tag
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
                                                    {RenderTruncatedText(selectedEvent?.upgradeState?.whoAreHandle || "无")}
                                                </Tag>
                                            )) || (
                                                <>
                                                    {selectedEvent?.upgradeState?.whoAreConfirm !== "" && (
                                                        <Tag
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
                                                            {RenderTruncatedText(selectedEvent?.upgradeState?.whoAreConfirm)}
                                                        </Tag>
                                                    )}
                                                    {selectedEvent?.upgradeState?.whoAreHandle !== "" && (
                                                        <Tag
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
                                                            {RenderTruncatedText(selectedEvent?.upgradeState?.whoAreHandle)}
                                                        </Tag>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    ),
                                },
                            ]}
                        />
                        <Divider />
                        <div style={{ marginBottom: "16px" }}>
                            <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                                事件标签
                            </Title>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "15px" }}>
                                {Object.entries(selectedEvent?.labels).map(([key, value]) => (
                                    <Tag color="processing" key={key}>{`${key}: ${value}`}</Tag>
                                ))}
                            </div>
                        </div>
                        <Divider />
                        <div>
                            <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                                事件详情
                            </Title>
                            {((selectedEvent.datasource_type === "AliCloudSLS" ||
                                selectedEvent.datasource_type === "Loki" ||
                                selectedEvent.datasource_type === "ElasticSearch" ||
                                selectedEvent.datasource_type === "VictoriaLogs" ||
                                selectedEvent.datasource_type === "ClickHouse") && (
                                <TextArea
                                    value={JSON.stringify(
                                        selectedEvent?.labels
                                            ? Object.entries(selectedEvent.labels)
                                                .filter(([key]) => !["value", "rule_name", "severity", "fingerprint"].includes(key))
                                                .reduce((acc, [key, value]) => {
                                                    acc[key] = value
                                                    return acc
                                                }, {})
                                            : {},
                                        null,
                                        2,
                                    )}
                                    style={{
                                        height: 400,
                                        resize: "none",
                                        marginTop: "15px",
                                    }}
                                    readOnly
                                />
                            )) || (
                                <TextArea
                                    value={selectedEvent.annotations}
                                    style={{
                                        height: 400,
                                        resize: "none",
                                        marginTop: "15px",
                                    }}
                                    readOnly
                                />
                            )}
                        </div>
                        <Divider />
                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    marginBottom: "16px",
                                    marginTop: "15px",
                                }}
                            >
                                <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                                    事件评论
                                </Title>
                            </div>
                            {comments.length === 0 ? (
                                <Card>
                                    <div
                                        style={{
                                            textAlign: "center",
                                            padding: "40px 0",
                                            color: "#999",
                                        }}
                                    >
                                        暂无评论，在下方输入框添加第一条评论
                                    </div>
                                </Card>
                            ) : (
                                <List
                                    style={{
                                        marginTop: "16px",
                                        padding: "16px",
                                        border: "1px solid #f0f0f0",
                                        borderRadius: "8px",
                                        marginBottom: "12px",
                                    }}
                                    dataSource={comments}
                                    renderItem={(comment) => (
                                        <List.Item style={{ borderBlockEnd: "none" }} key={comment.commentId}>
                                            <List.Item.Meta
                                                avatar={
                                                    <Avatar
                                                        style={{
                                                            backgroundColor: "#7265e6",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                        size="default"
                                                    >
                                                        {comment.username ? comment.username.charAt(0).toUpperCase() : ""}
                                                    </Avatar>
                                                }
                                                title={
                                                    <Space style={{ marginTop: "3px" }}>
                                                        <Text strong type="secondary">
                                                            {comment.username}
                                                        </Text>
                                                    </Space>
                                                }
                                                description={
                                                    <>
                                                        <Text>{comment.content}</Text>
                                                        <div>
                                                            <Text type="secondary" style={{ fontSize: "12px" }}>
                                                                {FormatTime(comment.time)}
                                                            </Text>
                                                            {localStorage.getItem("Username") === comment.username && (
                                                                <Popconfirm
                                                                    title="确定要删除这条评论吗？"
                                                                    onConfirm={() => handleDeleteComment(comment.commentId)}
                                                                    okText="删除"
                                                                    cancelText="取消"
                                                                    placement="topRight"
                                                                >
                                                                    <Button
                                                                        key="delete-comment"
                                                                        type="text"
                                                                        style={{
                                                                            color: "#ff4d4f",
                                                                            fontSize: "12px",
                                                                            marginLeft: "8px",
                                                                        }}
                                                                    >
                                                                        删除
                                                                    </Button>
                                                                </Popconfirm>
                                                            )}
                                                        </div>
                                                    </>
                                                }
                                            />
                                        </List.Item>
                                    )}
                                />
                            )}
                            {/* New Comment Input Area */}
                            <div style={{ marginTop: "16px" }}>
                                <div style={{ marginBottom: "12px" }}>
                                    <TextArea
                                        placeholder="请输入你想说的内容，按回车发送"
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        rows={3}
                                        maxLength={1000}
                                        showCount
                                    />
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    {newComment.trim() && (
                                        <Button
                                            type="primary"
                                            onClick={handleAddComment}
                                            style={{ marginTop: "10px", backgroundColor: "#000000" }}
                                        >
                                            发送评论
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Drawer>

            {/* Export Configuration Modal */}
            <Modal
                title="导出历史告警"
                open={exportModalVisible}
                onCancel={() => setExportModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setExportModalVisible(false)}>
                        取消
                    </Button>,
                    <Button key="export" type="primary" loading={exportLoading} onClick={handleExportClick}>
                        导出
                    </Button>,
                ]}
                width={600}
            >
                <div style={{ marginBottom: 16 }}>
                    <div style={{ marginTop: 8 }}>
                        <span style={{ marginRight: 8 }}>每页显示条数:</span>
                        <Select
                            value={exportOptions.itemsPerPage}
                            onChange={(value) => handleExportOptionsChange("itemsPerPage", value)}
                            style={{ width: 120 }}
                            options={[
                                { value: 10, label: "10条/页" },
                                { value: 20, label: "20条/页" },
                                { value: 50, label: "50条/页" },
                                { value: 100, label: "100条/页" },
                            ]}
                        />
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    )
}
