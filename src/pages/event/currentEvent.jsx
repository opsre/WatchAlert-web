import React, { useState, useEffect } from "react"
import { Table, Button, Drawer, Tag, Select, Space, Input } from "antd"
import { getCurEventList } from "../../api/event"
import TextArea from "antd/es/input/TextArea";

export const AlertCurrentEvent = (props) => {
    const { id } = props
    const { Search } = Input
    const [currentEventList, setCurrentEventList] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDataSource, setSelectedDataSource] = useState("")
    const [selectedAlertLevel, setSelectedAlertLevel] = useState("")
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [currentPagination, setCurrentPagination] = useState({
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
            title: "初次触发时间",
            dataIndex: "first_trigger_time",
            key: "first_trigger_time",
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: "最近评估时间",
            dataIndex: "last_eval_time",
            key: "last_eval_time",
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: "事件状态",
            dataIndex: "status",
            key: "status",
            render: (text) => {
                const statusMap = {
                    0: { color: 'black', text: '未知'},
                    1: { color: 'red', text: '告警中' },
                    2: { color: 'grey', text: '静默中' },
                    3: { color: 'orange', text: '待恢复' },
                };
                const status = statusMap[text];
                return status ? <Tag color={status.color}>{status.text}</Tag> : '-';
            },
        },
        {
            title: "操作",
            key: "action",
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
        handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize)
    }, [selectedDataSource, selectedAlertLevel, searchQuery, currentPagination.pageIndex]) // Added currentPagination.pageIndex to dependencies

    const showDrawer = (record) => {
        setSelectedEvent(record)
        setDrawerOpen(true)
    }

    const onCloseDrawer = () => {
        setDrawerOpen(false)
    }

    const handleCurrentEventList = async (pageIndex, pageSize) => {
        try {
            const params = {
                faultCenterId: id,
                index: pageIndex,
                size: pageSize,
                query: searchQuery || undefined,
                datasourceType: selectedDataSource || undefined,
                severity: selectedAlertLevel || undefined,
            }
            setLoading(true)
            const res = await getCurEventList(params)
            setLoading(false)
            const sortedList = res?.data?.list?.sort((a, b) => b.first_trigger_time - a.first_trigger_time) || []
            setCurrentEventList(sortedList)
            setCurrentPagination({
                ...currentPagination,
                pageIndex: res.data.index,
                pageTotal: res.data.total,
            })
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    const handleDataSourceChange = (value) => {
        setSelectedDataSource(value)
    }

    const handleSeverityChange = (value) => {
        setSelectedAlertLevel(value)
    }

    const handleSearch = (value) => {
        setSearchQuery(value)
    }

    const severityColors = {
        P0: "red",
        P1: "orange",
        P2: "yellow",
    }

    const handleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

    const handleCurrentPageChange = (page) => {
        setCurrentPagination({ ...currentPagination, pageIndex: page.current, pageSize: page.pageSize })
        handleCurrentEventList(page.current, page.pageSize)
    }

    return (
        <div>
            <Space style={{ marginBottom: 16 }}>
                <Search allowClear placeholder="输入搜索关键字" onSearch={handleSearch} style={{ width: 200 }} />
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
                <Button onClick={() => handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize)}>
                    刷新
                </Button>
            </Space>

            <Table
                columns={columns}
                dataSource={currentEventList}
                loading={loading}
                pagination={{
                    current: currentPagination.pageIndex,
                    pageSize: currentPagination.pageSize,
                    total: currentPagination.pageTotal,
                    showTotal: handleShowTotal,
                }}
                onChange={handleCurrentPageChange}
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
                        <h4>事件状态:</h4>
                        <p>{
                            <Tag
                                color={
                                    selectedEvent.status === 1 ? 'red' :
                                        selectedEvent.status === 2 ? 'gray' :
                                            selectedEvent.status === 3 ? 'orange' : 'black'
                                }>
                                {
                                    selectedEvent.status === 1 ? '告警中' :
                                        selectedEvent.status === 2 ? '静默中' :
                                            selectedEvent.status === 3 ? '待恢复' : '未知'
                                }
                            </Tag>
                        }
                        </p>
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

