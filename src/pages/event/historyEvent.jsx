"use client"

import React, { useState, useEffect } from "react"
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
    Checkbox,
    Radio,
    Descriptions, Menu, Dropdown, Tooltip, Divider, Typography, Card, List, Avatar, Popconfirm
} from "antd"
import {DownloadOutlined, EllipsisOutlined, ReloadOutlined} from "@ant-design/icons"
import dayjs from "dayjs"
import {AddEventComment, DeleteEventComment, getHisEventList, ListEventComments} from "../../api/event"
import TextArea from "antd/es/input/TextArea"
import {AlertTriangle, Clock} from "lucide-react";
import {useLocation, useNavigate} from "react-router-dom";
import {exportAlarmRecordToHTML} from "../../utils/exportAlarmRecordToHTML";
import {
    FormatDuration, FormatTime,
    GetBlockColor,
    GetDurationGradient, HandleApiError,
    HandleShowTotal,
    RenderTruncatedText
} from "../../utils/lib";

const { Title, Text } = Typography


export const AlertHistoryEvent = (props) => {
    const { id } = props
    const navigate = useNavigate();
    const location = useLocation();
    const { RangePicker } = DatePicker
    const { Search } = Input

    // 状态管理
    const [historyEventList, setHistoryEventList] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
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
    const [comments, setComments] = useState( [])
    const [newComment, setNewComment] = useState("")

    // 导出相关状态
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
        P0: '#ff4d4f',
        P1: '#faad14',
        P2: '#b0e1fb'
    }

    const SEVERITY_LABELS = {
        P0: "P0",
        P1: "P1",
        P2: "P2",
    }

    // 表格列定义
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
                let contentString;
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
                                    acc[key] = value;
                                    return acc;
                                }, {})
                            : {},
                        null,
                        2,
                    );
                } else {
                    contentString = record.annotations;
                }

                const maxLength = 100;
                const displayContent = contentString.length > maxLength
                    ? contentString.substring(0, maxLength) + '...'
                    : contentString;

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
                            <span style={{ cursor: contentString.length > maxLength ? 'help' : 'default' }}>
                                {displayContent}
                            </span>
                            </Tooltip>
                        </div>
                    </div>
                );
            },
        },
        {
            title: "告警时间",
            key: "trigger_and_recover_time",
            width: "130px",
            render: (text, record) => {
                const triggerTime = new Date(record.first_trigger_time * 1000).toLocaleString();
                const recoverTime = new Date(record.recover_time * 1000).toLocaleString();

                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        fontSize: '13px',
                        lineHeight: '1.4'
                    }}>
                        <div>
                            {triggerTime}
                        </div>
                        <div>
                            {recoverTime}
                        </div>
                    </div>
                );
            },
        },
        {
            title: "持续时长",
            dataIndex: "first_trigger_time",
            key: "duration",
            width: "160px",
            render: (_, record) => {
                const durationText = FormatDuration(record.first_trigger_time,record.recover_time)
                const gradientStyle = GetDurationGradient(record.first_trigger_time,record.recover_time)
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
                return  <Tag color={"green"}>{"已恢复"}</Tag>
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
                        {text.whoAreConfirm === text.whoAreHandle && (
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
                        ) || (
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
                        <Menu.Item onClick={() => showDrawer(record)}>
                            查看详情
                        </Menu.Item>
                    </Menu>
                );

                return (
                    <Dropdown overlay={menu} trigger={['click']}>
                        <EllipsisOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
                    </Dropdown>
                );
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

    // 副作用
    useEffect(() => {
        // 处理窗口大小变化
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        const url = new URL(window.location)
        const queryParam = url.searchParams.get("query")
        if (queryParam) {
            setSearchQuery(queryParam)
        }
    }, [])

    useEffect(() => {
        handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)
    }, [
        selectedDataSource,
        selectedAlertLevel,
        startTimestamp,
        endTimestamp,
        searchQuery,
        historyPagination.pageIndex,
        historyPagination.pageSize,
    ])

    // 事件处理函数
    const showDrawer = (record) => {
        setSelectedEvent(record)
        setDrawerOpen(true)
    }

    const onCloseDrawer = () => {
        setDrawerOpen(false)
    }

    const handleDataSourceChange = (value) => {
        setSelectedDataSource(value)
    }

    const handleHistoryEventList = async (pageIndex, pageSize) => {
        try {
            const params = {
                faultCenterId: id,
                index: pageIndex,
                size: pageSize,
                query: searchQuery || undefined,
                datasourceType: selectedDataSource || undefined,
                severity: selectedAlertLevel || undefined,
                startAt: startTimestamp || undefined,
                endAt: endTimestamp || undefined,
            }
            setLoading(true)
            const res = await getHisEventList(params)
            setLoading(false)
            setHistoryEventList(res.data.list)
            setHistoryPagination({
                ...historyPagination,
                pageIndex: res.data.index,
                pageTotal: res.data.total,
            })
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    const handleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

    const handleHistoryPageChange = (page) => {
        setHistoryPagination({ ...historyPagination, pageIndex: page.current, pageSize: page.pageSize })
        handleHistoryEventList(page.current, page.pageSize)
    }

    const handleSearch = (value) => {
        setSearchQuery(value)
        handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)
    }

    const handleSeverityChange = (value) => {
        setSelectedAlertLevel(value)
    }

    const onChange = (dates) => {
        if (dates && dates.length === 2) {
            onOk(dates)
        }
    }

    const onOk = (dates) => {
        if (dates && dates[0] && dates[1]) {
            setStartTimestamp(dates[0].unix())
            setEndTimestamp(dates[1].unix())
        }
    }

    // 打开导出对话框
    const openExportModal = () => {
        // 使用当前筛选条件作为默认值
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

    // 导出相关函数
    const fetchExportData = async () => {
        try {
            // 构建导出参数
            const params = {
                faultCenterId: id,
                index: 1,
                size: 10000, // 获取足够多的数据用于导出
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

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = searchParams.get('query');
        if (query) {
            setSearchQuery(query);
        }
    }, [location.search]);

    const onSearchChange = (key) => {
        setSearchQuery(key);
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('query', key);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    };

    async function handleExportClick() {
        const data = await fetchExportData(); // 保持这个函数在你的组件中获取数据
        if (data.length === 0) return;

        exportAlarmRecordToHTML("历史告警报表", data, {
            ruleName: searchQuery,
            ruleType: selectedDataSource,
            alertLevel: selectedAlertLevel,
        }, exportTimeRange);
    }


    const handleListComments = async () => {
        if (!selectedEvent) {
            return;
        }

        try {
            const comment = {
                tenantId: selectedEvent.tenantId,
                fingerprint: selectedEvent.fingerprint,
            };
            const res = await ListEventComments(comment);
            setComments(res.data);
        } catch (error) {
            HandleApiError(error)
        }
    };

    // 新增评论
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

    // 处理回车键
    const handleKeyPress = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleAddComment()
        }
    }

    // 删除评论
    const handleDeleteComment = async (commentId) => {
        try {
            const comment = {
                tenantId: selectedEvent.tenantId,
                commentId: commentId
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
            handleListComments();
        }
    }, [drawerOpen, selectedEvent]);


    // 渲染JSX
    return (
        <React.Fragment>
            {/* 筛选和操作区域 */}
            <Space style={{ marginBottom: 16 }} wrap>
                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={handleSearch}
                    value={searchQuery}
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
                <RangePicker showTime format="YYYY-MM-DD HH:mm:ss" onChange={onChange} onOk={onOk} presets={rangePresets} />
                <Button icon={<ReloadOutlined />} onClick={() => handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)}>
                    刷新
                </Button>
                <Button icon={<DownloadOutlined />} onClick={openExportModal}>
                    导出
                </Button>
            </Space>

            {/* 数据表格 */}
            <Table
                columns={columns}
                dataSource={historyEventList}
                loading={loading}
                pagination={{
                    current: historyPagination.pageIndex,
                    pageSize: historyPagination.pageSize,
                    total: historyPagination.pageTotal,
                    showTotal: HandleShowTotal,
                    pageSizeOptions: ['10'],
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

            {/* 详情抽屉 */}
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
                            style={{marginBottom: "24px"}}
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
                                    children: <Tag
                                        color={SEVERITY_COLORS[selectedEvent.severity]}>{selectedEvent.severity}</Tag>,
                                },
                                {
                                    key: "status",
                                    label: "事件状态",
                                    children: (
                                        <Tag color={"green"}>{"已恢复"}</Tag>
                                    ),
                                },
                                {
                                    key: "value",
                                    label: "恢复时值",
                                    children: RenderTruncatedText(selectedEvent?.labels["recover_value"] || 0),
                                },
                                {
                                    key: "handle",
                                    label: "处理人",
                                    children: (
                                        <>
                                            {selectedEvent?.upgradeState?.whoAreConfirm === selectedEvent?.upgradeState?.whoAreHandle && (
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
                                            ) || (
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

                        <Divider/>

                        <div style={{marginBottom: "16px"}}>
                            <Title level={4} style={{margin: 0, fontSize: "16px"}}>
                                事件标签
                            </Title>
                            <div style={{display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "15px"}}>
                                {Object.entries(selectedEvent?.labels).map(([key, value]) => (
                                    <Tag color="processing" key={key}>{`${key}: ${value}`}</Tag>
                                ))}
                            </div>
                        </div>

                        <Divider/>

                        <div>
                            <Title level={4} style={{margin: 0, fontSize: "16px"}}>
                                事件详情
                            </Title>
                            {(selectedEvent.datasource_type === "AliCloudSLS"
                                || selectedEvent.datasource_type === "Loki"
                                || selectedEvent.datasource_type === "ElasticSearch"
                                || selectedEvent.datasource_type === "VictoriaLogs"
                                || selectedEvent.datasource_type === "ClickHouse"
                            ) && (
                                <TextArea
                                    value={JSON.stringify(
                                        selectedEvent?.labels
                                            ? Object.entries(selectedEvent.labels)
                                                .filter(([key]) => !['value', 'rule_name', 'severity', 'fingerprint'].includes(key))
                                                .reduce((acc, [key, value]) => {
                                                    acc[key] = value;
                                                    return acc;
                                                }, {})
                                            : {},
                                        null,
                                        2
                                    )}
                                    style={{
                                        height: 400,
                                        resize: "none",
                                        marginTop: "15px",
                                    }}
                                    readOnly
                                />
                            ) || (
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

                        <Divider/>

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
                                <Title level={4} style={{margin: 0, fontSize: "16px"}}>
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
                                        <List.Item
                                            style={{borderBlockEnd: "none"}}
                                            key={comment.commentId}
                                        >
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
                                                    <Space style={{marginTop: "3px"}}>
                                                        <Text strong type="secondary">{comment.username}</Text>

                                                    </Space>
                                                }
                                                description={
                                                    <>
                                                        <Text>{comment.content}</Text>
                                                        <div>
                                                            <Text type="secondary" style={{fontSize: "12px"}}>
                                                                {FormatTime(comment.time)}
                                                            </Text>
                                                            {localStorage.getItem('Username') === comment.username && (
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
                                                                            marginLeft: "8px"
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

                            {/* 新增评论输入区 */}
                            <div style={{marginTop: "16px"}}>
                                <div style={{marginBottom: "12px"}}>
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
                                <div style={{textAlign: "right"}}>
                                    {newComment.trim() && (
                                        <Button
                                            type="primary"
                                            onClick={handleAddComment}
                                            style={{marginTop: "10px", backgroundColor: "#000000"}}
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

            {/* 导出配置对话框 */}
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
                <div style={{marginBottom: 16}}>
                    <div style={{marginTop: 8}}>
                        <span style={{marginRight: 8}}>每页显示条数:</span>
                        <Select
                            value={exportOptions.itemsPerPage}
                            onChange={(value) => handleExportOptionsChange("itemsPerPage", value)}
                            style={{width: 120}}
                            options={[
                                {value: 10, label: "10条/页"},
                                {value: 20, label: "20条/页"},
                                {value: 50, label: "50条/页"},
                                {value: 100, label: "100条/页"},
                            ]}
                        />
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    )
}

