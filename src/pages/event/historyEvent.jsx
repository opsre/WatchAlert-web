import React, { useState, useEffect } from "react"
import { Table, Button, Drawer, Tag, Select, Space, DatePicker, Input } from "antd"
import dayjs from "dayjs"
import { getHisEventList } from "../../api/event"
import TextArea from "antd/es/input/TextArea";

export const AlertHistoryEvent = (props) => {
    const { id } = props
    const { RangePicker } = DatePicker
    const { Search } = Input
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
            width: '100px',
            render: (text) => (
                <div style={{ display: "flex", alignItems: "center" }}>
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            backgroundColor: severityColors[text],
                            borderRadius: "50%",
                            marginRight: "8px",
                        }}
                    />
                    {text}
                </div>
            ),
        },
        {
            title: '事件详情',
            dataIndex: 'annotations',
            key: 'annotations',
            width: 'auto',
            render: (text, record) => (
                <span>
                    {record.annotations && (
                        <span>
                            {record.annotations.substring(0, 50)}
                        </span>
                    )}
                </span>
            )
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
            title: "操作",
            key: "action",
            width: '50px',
            render: (_, record) => <Button onClick={() => showDrawer(record)}>详情</Button>,
        },
    ]

    const [height, setHeight] = useState(window.innerHeight);

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight);
        };

        // 监听窗口的resize事件
        window.addEventListener('resize', handleResize);

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

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

    const severityColors = {
        P0: "red",
        P1: "orange",
        P2: "yellow",
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

    return (
        <div>
            <Space style={{ marginBottom: 16 }} wrap>
                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={handleSearch}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
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
                <Button onClick={() => handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)}>
                    刷新
                </Button>
            </Space>

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
                bordered
                style={{ backgroundColor: "#fff" }}
                rowKey={(record) => record.id}
                scroll={{
                    y: height - 550,
                    x: 'max-content', // 水平滚动
                }}
            />

            <Drawer title="事件详情" placement="right" onClose={onCloseDrawer} open={drawerOpen} width={520}>
                {selectedEvent && (
                    <div>
                        <h4>规则名称:</h4>
                        <p>{selectedEvent.rule_name}</p>
                        <h4>告警指纹:</h4>
                        <p>{selectedEvent.fingerprint}</p>
                        <h4>数据源:</h4>
                        <p>
                            {selectedEvent.datasource_type} ({selectedEvent.datasource_id})
                        </p>
                        <h4>告警等级:</h4>
                        <p>{selectedEvent.severity}</p>
                        <h4>事件标签:</h4>
                        {Object.entries(selectedEvent.metric).map(([key, value]) => (
                            <Tag color="processing" key={key}>{`${key}: ${value}`}</Tag>
                        ))}
                        <h4>触发时值:</h4>
                        <p>{selectedEvent.metric["value"]}</p>
                        <h4>事件详情:</h4>
                        <p>{
                            <TextArea
                                value={selectedEvent.annotations}
                                style={{
                                    height: 300,
                                    resize: 'none',
                                }}
                            />
                        }</p>
                    </div>
                )}
            </Drawer>
        </div>
    )
}

