import React, { useState, useEffect } from "react"
import {Table, Button, Drawer, Tag, Select, Space, Input, Modal, Descriptions, Divider, Spin} from "antd"
import { getCurEventList } from "../../api/event"
import TextArea from "antd/es/input/TextArea";
import {ReqAiAnalyze} from "../../api/ai";
import MarkdownRenderer from "../../utils/MarkdownRenderer";

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
    const [aiAnalyze, setAiAnalyze] = useState(false)
    const [aiAnalyzeContent, setAiAnalyzeContent] = useState({})
    const [analyzeLoading, setAnalyzeLoading] = useState(false)

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
                    0: { color: '#ffe465', text: '预告警'},
                    1: { color: 'red', text: '告警中' },
                    2: { color: 'grey', text: '静默中' },
                    3: { color: 'orange', text: '待恢复' },
                };
                const status = statusMap[text];
                return status ? <Tag color={status.color}>{status.text}</Tag> : '未知';
            },
        },
        {
            title: "操作",
            key: "action",
            width: '100px',
            render: (_, record) => {
                return (
                    <div style={{display:'flex', gap: '10px'}}>
                        <Button onClick={() => showDrawer(record)}>详情</Button>
                        <Button
                            onClick={() => openAiAnalyze(record)}
                            disabled={analyzeLoading}
                        >
                            {analyzeLoading ? 'Ai 分析中' : 'Ai 分析'}
                        </Button>
                    </div>
                )
            },
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
        P0: '#ff4d4f',
        P1: '#faad14',
        P2: '#b0e1fb'
    }

    const handleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

    const handleCurrentPageChange = (page) => {
        setCurrentPagination({ ...currentPagination, pageIndex: page.current, pageSize: page.pageSize })
        handleCurrentEventList(page.current, page.pageSize)
    }

    const handleCloseAiAnalyze = () =>{
        setAiAnalyze(false)
    }

    const openAiAnalyze = async(record) =>{
        setAiAnalyze(true)
        setAnalyzeLoading(true)

        // 创建 FormData 对象
        const formData = new FormData();

        // 添加表单字段
        formData.append('rule_name', record.rule_name);
        formData.append('rule_id', record.rule_id);
        formData.append('content', record.annotations);
        formData.append('search_ql', record.searchQL);
        formData.append('deep', "false")

        const params = {
            ruleId: record.rule_id,
            ruleName: record.rule_name,
            datasourceType: record.datasource_type,
            searchQL: record.searchQL,
            fingerprint: record.fingerprint,
            annotations: record.annotations
        }
        setAiAnalyzeContent(params)

        const res = await ReqAiAnalyze(formData)
        setAiAnalyzeContent({
            ...params,
            content: res.data,
        })
        setAnalyzeLoading(false)
    }

    const AiDeepAnalyze = async  (params) => {
        const formData = new FormData();
        formData.append('rule_name', params.ruleName);
        formData.append('rule_id', params.ruleId);
        formData.append('content', params.annotations);
        formData.append('search_ql', params.searchQL);
        formData.append('deep', "true")

        setAiAnalyzeContent({
            ...params,
            content: "",
        })

        setAnalyzeLoading(true)
        const res = await ReqAiAnalyze(formData)
        setAiAnalyzeContent({
            ...params,
            content: res.data,
        })
        setAnalyzeLoading(false)
    }

    const handleAiDeepAnalyze = ()=>{
        AiDeepAnalyze(aiAnalyzeContent)
    }

    const [percent, setPercent] = React.useState(-50);
    const timerRef = React.useRef(null);
    React.useEffect(() => {
        timerRef.current = setTimeout(() => {
            setPercent((v) => {
                const nextPercent = v + 5;
                return nextPercent > 150 ? -50 : nextPercent;
            });
        }, 100);
        return () => clearTimeout(timerRef.current);
    }, [percent]);

    return (
        <div>
            <Modal
                centered
                open={aiAnalyze}
                onCancel={handleCloseAiAnalyze}
                width={1000}
                footer={null} // 不显示底部按钮
                styles={{
                    body: {
                        height: '700px', // 固定高度
                        overflowY: 'auto', // 支持垂直滚动
                        padding: '20px',
                        backgroundColor: '#f9f9f9', // 灰色背景
                        borderRadius: '8px', // 圆角
                    },
                }}
            >
                <div style={{marginTop: '10px'}}>
                    <Descriptions items={[
                        {
                            key: '1',
                            label: '规则名称',
                            children: aiAnalyzeContent.ruleName,
                        },
                        {
                            key: '2',
                            label: '规则类型',
                            children: aiAnalyzeContent.datasourceType,
                        },
                        {
                            key: '3',
                            label: '告警指纹',
                            children: aiAnalyzeContent.fingerprint,
                        },
                    ]}/>
                    <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                        <Button type="link" onClick={handleAiDeepAnalyze}>
                            深度分析
                        </Button>
                    </div>
                </div>
                <Divider/>
                {analyzeLoading ? (
                        <div style={{alignItems: 'center', marginTop: '100px'}}>
                            <Spin tip="Ai 分析中..." percent={percent}>
                                <br/>
                            </Spin>
                        </div>
                    ):
                    <MarkdownRenderer
                        data={aiAnalyzeContent.content}
                    />
                }

            </Modal>

            <Space style={{marginBottom: 16}}>
                <Search allowClear placeholder="输入搜索关键字" onSearch={handleSearch} style={{width: 200 }} />
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
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
                rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
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
                                    selectedEvent.status === 0 ? '#ffe465' :
                                        selectedEvent.status === 1 ? 'red' :
                                            selectedEvent.status === 2 ? 'gray' :
                                                selectedEvent.status === 3 ? 'orange' : 'black'
                                }>
                                {
                                    selectedEvent.status === 0 ? '预告警' :
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

