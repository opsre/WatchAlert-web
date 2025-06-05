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
    Descriptions
} from "antd"
import {DownloadOutlined, ReloadOutlined} from "@ant-design/icons"
import dayjs from "dayjs"
import { getHisEventList } from "../../api/event"
import TextArea from "antd/es/input/TextArea"
import {AlertTriangle} from "lucide-react";
import {useLocation, useNavigate} from "react-router-dom";
import {exportAlarmRecordToHTML} from "../../utils/exportAlarmRecordToHTML";

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
            title: "规则名称",
            dataIndex: "rule_name",
            key: "rule_name",
        },
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
            title: "事件详情",
            dataIndex: "annotations",
            key: "annotations",
            width: "auto",
            ellipsis: true,
            render: (text, record) => (
                <span>
                    { (record.datasource_type === "AliCloudSLS"
                        || record.datasource_type === "Loki"
                        || record.datasource_type === "ElasticSearch"
                        || record.datasource_type === "VictoriaLogs"
                        || record.datasource_type === "ClickHouse"
                    ) && (
                        <span>
                            {JSON.stringify(
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
                            ).substring(0, 50)}...
                        </span>
                    ) || (
                        <span>
                            {record.annotations.substring(0, 50)}...
                        </span>
                    ) }
                </span>
            ),
        },
        {
            title: "触发时间",
            dataIndex: "first_trigger_time",
            key: "first_trigger_time",
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: "恢复时间",
            dataIndex: "recover_time",
            key: "recover_time",
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: "事件状态",
            dataIndex: "status",
            key: "status",
            render: () => {
                return  <Tag color={"green"}>{"已恢复"}</Tag>
            },
        },
        {
            title: "处理人",
            dataIndex: "upgradeState",
            key: "upgradeState",
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
            width: "50px",
            render: (_, record) => <Button onClick={() => showDrawer(record)}>详情</Button>,
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
                    showTotal: handleShowTotal,
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
                width={520}
                styles={{
                    body: { padding: "16px" },
                }}
            >
                {selectedEvent && (
                    <div>
                        <Descriptions
                            title="基本信息"
                            bordered
                            column={1}
                            style={{ marginBottom: "24px" }}
                            items={[
                                {
                                    key: "rule_name",
                                    label: "规则名称",
                                    children: selectedEvent.rule_name,
                                },
                                {
                                    key: "fingerprint",
                                    label: "告警指纹",
                                    children: selectedEvent.fingerprint,
                                },
                                {
                                    key: "datasource",
                                    label: "数据源",
                                    children: `${selectedEvent.datasource_type} (${selectedEvent.datasource_id})`,
                                },
                                {
                                    key: "severity",
                                    label: "告警等级",
                                    children: <Tag color={SEVERITY_COLORS[selectedEvent.severity]}>{selectedEvent.severity}</Tag>,
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
                                    children: selectedEvent?.labels["recover_value"] || 0,
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
                                                    {selectedEvent?.upgradeState?.whoAreHandle || "无"}
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
                                                            {selectedEvent?.upgradeState?.whoAreConfirm}
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
                                                            {selectedEvent?.upgradeState?.whoAreHandle}
                                                        </Tag>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    ),
                                },
                            ]}
                        />

                        <div style={{ marginBottom: "16px" }}>
                            <h4>事件标签:</h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {Object.entries(selectedEvent?.labels).map(([key, value]) => (
                                    <Tag color="processing" key={key}>{`${key}: ${value}`}</Tag>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4>事件详情:</h4>
                            { (selectedEvent.datasource_type === "AliCloudSLS"
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
                                        marginTop: "8px",
                                    }}
                                    readOnly
                                />
                            ) || (
                                <TextArea
                                    value={selectedEvent.annotations}
                                    style={{
                                        height: 400,
                                        resize: "none",
                                        marginTop: "8px",
                                    }}
                                    readOnly
                                />
                            ) }
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
                <div style={{ marginBottom: 16 }}>
                    <h4>时间范围</h4>
                    <Radio.Group
                        value={exportOptions.timeRange}
                        onChange={(e) => handleExportOptionsChange("timeRange", e.target.value)}
                    >
                        <Radio value="all">全部时间</Radio>
                        <Radio value="custom">自定义时间范围</Radio>
                    </Radio.Group>

                    {exportOptions.timeRange === "custom" && (
                        <div style={{ marginTop: 8 }}>
                            <RangePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                value={exportTimeRange}
                                onChange={(dates) => setExportTimeRange(dates)}
                                style={{ width: "100%" }}
                                presets={rangePresets}
                            />
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <h4>筛选条件</h4>
                    <Checkbox.Group
                        value={exportOptions.filterOptions}
                        onChange={(values) => handleExportOptionsChange("filterOptions", values)}
                    >
                        <Space direction="vertical">
                            <Checkbox value="ruleName">按规则名称筛选</Checkbox>
                            {exportOptions.filterOptions.includes("ruleName") && (
                                <Input
                                    placeholder="输入规则名称关键字"
                                    value={exportFilters.ruleName}
                                    onChange={(e) => setExportFilters({ ...exportFilters, ruleName: e.target.value })}
                                    style={{ width: 300, marginLeft: 24 }}
                                />
                            )}

                            <Checkbox value="ruleType">按规则类型筛选</Checkbox>
                            {exportOptions.filterOptions.includes("ruleType") && (
                                <Select
                                    placeholder="选择规则类型"
                                    style={{ width: 300, marginLeft: 24 }}
                                    allowClear
                                    value={exportFilters.ruleType || null}
                                    onChange={(value) => setExportFilters({ ...exportFilters, ruleType: value })}
                                    options={[
                                        { value: "Prometheus", label: "Prometheus" },
                                        { value: "VictoriaMetrics", label: "VictoriaMetrics" },
                                        { value: "AliCloudSLS", label: "AliCloudSLS" },
                                        { value: "Jaeger", label: "Jaeger" },
                                        { value: "Loki", label: "Loki" },
                                    ]}
                                />
                            )}

                            <Checkbox value="alertLevel">按告警等级筛选</Checkbox>
                            {exportOptions.filterOptions.includes("alertLevel") && (
                                <Select
                                    placeholder="选择告警等级"
                                    style={{ width: 300, marginLeft: 24 }}
                                    allowClear
                                    value={exportFilters.alertLevel || null}
                                    onChange={(value) => setExportFilters({ ...exportFilters, alertLevel: value })}
                                    options={[
                                        { value: "P0", label: "P0级告警" },
                                        { value: "P1", label: "P1级告警" },
                                        { value: "P2", label: "P2级告警" },
                                    ]}
                                />
                            )}
                        </Space>
                    </Checkbox.Group>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <h4>分页设置</h4>
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

