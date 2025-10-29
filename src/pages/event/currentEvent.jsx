"use client"

import React, { useRef } from "react"
import { useState, useEffect } from "react"
import {
    Table,
    Button,
    Drawer,
    Tag,
    Select,
    Space,
    Input,
    Modal,
    Descriptions,
    Divider,
    Spin,
    Dropdown,
    message,
    Empty,
    Menu, Radio, Checkbox, Tooltip, Typography,
    List,
    Form,
    Card, Avatar, Popconfirm,
} from "antd"
import {
    AddEventComment,
    DeleteEventComment,
    getCurEventList,
    ListEventComments,
    ProcessAlertEvent
} from "../../api/event"
import TextArea from "antd/es/input/TextArea"
import { ReqAiAnalyze } from "../../api/ai"
import MarkdownRenderer from "../../utils/MarkdownRenderer"
import { AlertTriangle, Clock } from "lucide-react"
import {
    DownOutlined,
    ReloadOutlined,
    SearchOutlined,
    FilterOutlined,
    EllipsisOutlined,
    DownloadOutlined
} from "@ant-design/icons"
import { CreateSilenceModal } from "../silence/SilenceRuleCreateModal";
import { useLocation, useNavigate } from "react-router-dom";
import {exportAlarmRecordToHTML} from "../../utils/exportAlarmRecordToHTML";
import {
    FormatDuration, FormatTime,
    GetBlockColor,
    GetDurationGradient, HandleApiError,
    HandleShowTotal,
    RenderTruncatedText
} from "../../utils/lib";
import { ReactComponent as PrometheusImg } from "../alert/rule/img/Prometheus.svg"
import { ReactComponent as AlicloudImg } from "../alert/rule/img/alicloud.svg"
import { ReactComponent as JaegerImg } from "../alert/rule/img/jaeger.svg"
import { ReactComponent as AwsImg } from "../alert/rule/img/AWSlogo.svg"
import { ReactComponent as LokiImg } from "../alert/rule/img/L.svg"
import { ReactComponent as VMImg } from "../alert/rule/img/victoriametrics.svg"
import { ReactComponent as K8sImg } from "../alert/rule/img/Kubernetes.svg"
import { ReactComponent as ESImg } from "../alert/rule/img/ElasticSearch.svg"
import { ReactComponent as VLogImg } from "../alert/rule/img/victorialogs.svg"
import { ReactComponent as CkImg } from "../alert/rule/img/clickhouse.svg"

const { Title, Text } = Typography

export const AlertCurrentEvent = (props) => {
    const { id } = props
    const navigate = useNavigate();
    const location = useLocation();
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
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [batchProcessing, setBatchProcessing] = useState(false)
    // 添加一个状态来跟踪是否正在进行过滤操作
    const [isFiltering, setIsFiltering] = useState(false)
    const [selectedSilenceRow, setSelectedSilenceRow] = useState(null)
    const [silenceVisible, setSilenceVisible] = useState(false)
    // 导出相关状态
    const [exportModalVisible, setExportModalVisible] = useState(false)
    const [exportOptions, setExportOptions] = useState({
        timeRange: "all", // all, custom
        filterOptions: [], // ruleName, ruleType, alertLevel
        itemsPerPage: 10, // 导出HTML的每页项目数
    })
    // 选中的告警状态
    const [selectedStatus, setSelectedStatus] = useState(null);
    const [comments, setComments] = useState( [])
    const [newComment, setNewComment] = useState("")
    const [sortOrder,setSortOrder] = useState(null)

    // Constants
    const SEVERITY_COLORS = {
        P0: "#ff4d4f",
        P1: "#faad14",
        P2: "#b0e1fb",
    }

    const statusMap = {
        "pre_alert": { color: "#ffe465", text: "预告警" },
        "alerting": { color: "red", text: "告警中" },
        "silenced": { color: "grey", text: "静默中" },
        "pending_recovery": { color: "orange", text: "待恢复" },
        "recovered": { color: "green", text: "已恢复" },
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys)
        },
    }

    const logoMap = {
        Prometheus: <PrometheusImg style={{ width: 16, height: 16 }} />,
        VictoriaMetrics: <VMImg style={{ width: 16, height: 16 }} />,
        AliCloudSLS: <AlicloudImg style={{ width: 16, height: 16 }} />,
        Jaeger: <JaegerImg style={{ width: 16, height: 16 }} />,
        CloudWatch: <AwsImg style={{ width: 16, height: 16 }} />,
        Loki: <LokiImg style={{ width: 16, height: 16 }} />,
        ElasticSearch: <ESImg style={{ width: 16, height: 16 }} />,
        VictoriaLogs: <VLogImg style={{ width: 16, height: 16 }} />,
        ClickHouse: <CkImg style={{ width: 16, height: 16 }} />,
        Kubernetes: <K8sImg style={{ width: 16, height: 16 }} />,
    }

    const columns = [
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
                        {/* 规则名称（可点击打开详情） */}
                        <div
                            style={{
                                fontSize: "11px",
                                fontWeight: "500",
                                lineHeight: "1.2",
                                display: "flex", 
                                gap: "4px" 
                            }}
                        >
                            {logoMap[record.datasource_type]} <span
                                role="button"
                                tabIndex={0}
                                onClick={(e) => { e.stopPropagation(); showDrawer(record); }}
                                onKeyPress={(e) => { if (e.key === 'Enter') { e.stopPropagation(); showDrawer(record); } }}
                                style={{ cursor: 'pointer', color: 'rgba(22, 119, 255, 0.83)', textDecoration: 'none', marginTop: '1px' }}
                            >
                                {record.rule_name}
                            </span>
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
            title: "触发时间",
            dataIndex: "first_trigger_time",
            key: "first_trigger_time",
            width: "160px",
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
                }
        },
        {
            title: "持续时长",
            dataIndex: "first_trigger_time",
            key: "duration",
            width: "160px",
            sorter: true,
            render: (startTime) => {
                const durationText = FormatDuration(startTime)
                const gradientStyle = GetDurationGradient(startTime)
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
            title: "告警状态",
            dataIndex: "status",
            key: "status",
            width: "100px",
            render: (text) => {
                const status = statusMap[text]
                return status ? <Tag color={status.color}>{status.text}</Tag> : "未知"
            },
        },
        {
            title: "认领人",
            dataIndex: "upgradeState",
            key: "upgradeState",
            width: "100px",
            render: (text) => {
                return (
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
                        {text.whoAreConfirm || "未认领"}
                    </Tag>
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
                        <Menu.Item onClick={() => {handleClaimOne(record)}} >
                            去认领
                        </Menu.Item>
                        <Menu.Item onClick={() => {handleProcessOne(record)}} >
                            去处理
                        </Menu.Item>
                        {record.status !== "silenced" && (
                            <Menu.Item onClick={() => {handleSilenceModalOpen(record)}} >
                                去静默
                            </Menu.Item>
                        )}
                        <Menu.Item onClick={() => openAiAnalyze(record)} disabled={analyzeLoading}>
                            {analyzeLoading ? "Ai 分析中" : "Ai 分析"}
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

    const [height, setHeight] = useState(window.innerHeight)

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        // 监听窗口的resize事件
        window.addEventListener("resize", handleResize)

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        // 当过滤条件改变时，重置到第一页并获取数据
        if (isFiltering) {
            setCurrentPagination((prev) => ({
                ...prev,
                pageIndex: 1, // 重置到第一页
            }))
            handleCurrentEventList(1, currentPagination.pageSize)
            setIsFiltering(false) // 重置过滤状态
        } else {
            // 正常分页或初始加载
            handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize)
        }
    }, [searchQuery, id, isFiltering, currentPagination.pageIndex, currentPagination.pageSize, sortOrder])

    const handleSilenceModalOpen = (record) => {
        const excludeKeys = ['value']; // 要排除的 key 列表

        // 如果 record.labels 中包含 fingerprint，就只取 fingerprint
        if (record.labels && 'fingerprint' in record.labels) {
            setSelectedSilenceRow({
                labels: [{
                    key: 'fingerprint',
                    operator: '=',
                    value: record.labels.fingerprint,
                }]
            });
        } else {
            // 否则，继续原来逻辑：过滤掉 excludeKeys 的字段
            const labelsArray = Object.entries(record.labels || {})
                .filter(([key]) => !excludeKeys.includes(key))
                .map(([key, value]) => ({
                    key,
                    operator: "=",
                    value,
                }));

            setSelectedSilenceRow({ labels: labelsArray });
        }

        setSilenceVisible(true);
    };

    const handleSilenceModalClose = () => {
        setSilenceVisible(false);
    };

    const showDrawer = (record) => {
        setSelectedEvent(record)
        setDrawerOpen(true)
    }

    const onCloseDrawer = () => {
        setDrawerOpen(false)
    }

    const handleCurrentEventList = async (pageIndex, pageSize) => {
        try {
            setLoading(true)
            const params = {
                faultCenterId: id,
                index: pageIndex,
                size: pageSize,
                query: searchQuery || undefined,
                status: selectedStatus || undefined,
                datasourceType: selectedDataSource || undefined,
                severity: selectedAlertLevel || undefined,
                sortOrder: sortOrder || undefined,
            }
            const res = await getCurEventList(params)
            if (res?.data?.list) {
                setCurrentEventList(res.data.list)

                // 更新分页信息
                setCurrentPagination({
                    ...currentPagination,
                    pageIndex: res.data.index,
                    pageTotal: res.data.total,
                })

                // 检查是否有数据但当前页为空
                if (res.data.total > 0 && res.data.list.length === 0 && pageIndex > 1) {
                    // 自动跳转到第一页
                    setCurrentPagination((prev) => ({
                        ...prev,
                        pageIndex: 1,
                    }))
                    handleCurrentEventList(1, pageSize)
                }
            }
        } catch (error) {
            HandleApiError(error)
        } finally {
            setLoading(false)
        }
    }

    const handleDataSourceChange = (value) => {
        setSelectedDataSource(value)
        setIsFiltering(true) // 标记正在过滤
    }

    const handleSeverityChange = (value) => {
        setSelectedAlertLevel(value)
        setIsFiltering(true) // 标记正在过滤
    }

    const handleSearch = (value) => {
        setSearchQuery(value)
        setIsFiltering(true) // 标记正在过滤
    }

    const handleStatusChange = (value) => {
        setSelectedStatus(value)
        setIsFiltering(true) // 标记正在过滤
    }

    const handleCurrentPageChange = (page,_,sort) => {
        setSortOrder(sort.order)
        setCurrentPagination({ ...currentPagination, pageIndex: page.current, pageSize: page.pageSize })
    }

    const handleRefresh = () => {
        handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize)
    }

    const handleCloseAiAnalyze = () => {
        setAiAnalyze(false)
    }

    const openAiAnalyze = async (record) => {
        setAiAnalyze(true)
        setAnalyzeLoading(true)

        // 创建 FormData 对象
        const formData = new FormData()

        let content = ""
        if (record.datasource_type === "AliCloudSLS"
            || record.datasource_type === "Loki"
            || record.datasource_type === "ElasticSearch"
            || record.datasource_type === "VictoriaLogs"){
            content = JSON.stringify(record.log, null, 2)
        } else {
            content = record.annotations
        }

        // 添加表单字段
        formData.append("rule_name", record.rule_name)
        formData.append("rule_id", record.rule_id)
        formData.append("content", content)
        formData.append("search_ql", record.searchQL)
        formData.append("deep", "false")


        const params = {
            ruleId: record.rule_id,
            ruleName: record.rule_name,
            datasourceType: record.datasource_type,
            searchQL: record.searchQL,
            fingerprint: record.fingerprint,
            annotations: content,
        }
        setAiAnalyzeContent(params)

        try {
            const res = await ReqAiAnalyze(formData)
            setAiAnalyzeContent({
                ...params,
                content: res.data,
            })
        } catch (error) {
            message.error("AI分析请求失败: " + error.message)
            setAiAnalyzeContent({
                ...params,
                content: "分析失败，请稍后重试。",
            })
        } finally {
            setAnalyzeLoading(false)
        }
    }

    const AiDeepAnalyze = async (params) => {
        let content = ""
        if (params.datasource_type === "AliCloudSLS"
            || params.datasource_type === "Loki"
            || params.datasource_type === "ElasticSearch"
            || params.datasource_type === "VictoriaLogs"){
            content = JSON.stringify(params.log, null, 2)
        } else {
            content = params.annotations
        }

        const formData = new FormData()
        formData.append("rule_name", params.ruleName)
        formData.append("rule_id", params.ruleId)
        formData.append("content", content)
        formData.append("search_ql", params.searchQL)
        formData.append("deep", "true")

        setAiAnalyzeContent({
            ...params,
            content: "",
        })

        setAnalyzeLoading(true)
        try {
            const res = await ReqAiAnalyze(formData)
            setAiAnalyzeContent({
                ...params,
                content: res.data,
            })
        } catch (error) {
            message.error("深度分析请求失败: " + error.message)
            setAiAnalyzeContent({
                ...params,
                content: "深度分析失败，请稍后重试。",
            })
        } finally {
            setAnalyzeLoading(false)
        }
    }

    const handleAiDeepAnalyze = () => {
        AiDeepAnalyze(aiAnalyzeContent)
    }

    const [percent, setPercent] = useState(-50)
    const timerRef = useRef(null)

    useEffect(() => {
        timerRef.current = setTimeout(() => {
            setPercent((v) => {
                const nextPercent = v + 5
                return nextPercent > 150 ? -50 : nextPercent
            })
        }, 100)
        return () => clearTimeout(timerRef.current)
    }, [percent])

    // 批量操作菜单
    const batchOperationMenu = {
        items: [
            {
                key: "batchClaim",
                label: "批量认领",
                onClick: () => handleBatchClaim(),
            },
            {
                key: "batchProcess",
                label: "批量处理",
                onClick: () => handleBatchProcess(),
            },
        ],
    }

    // 批量操作处理函数
    const handleBatchClaim = () => {
        setBatchProcessing(true)
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要认领的事件")
            setBatchProcessing(false)
            return
        }

        Modal.confirm({
            title: "确认批量认领",
            content: `确定要认领选中的 ${selectedRowKeys.length} 个事件吗？`,
            onOk: async () => {
                try {
                    const params = {
                        state: 1,
                        faultCenterId: id,
                        fingerprints: selectedRowKeys
                    }
                    await ProcessAlertEvent(params)
                    message.success(`成功认领 ${selectedRowKeys.length} 个事件`)
                    setSelectedRowKeys([]) // 清空选择
                    handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize) // 刷新列表
                } catch (error) {
                    message.error("认领失败: " + error.message)
                } finally {
                    setBatchProcessing(false)
                }
            },
            onCancel: () => {
                setBatchProcessing(false)
            },
        })
    }

    const handleBatchProcess = () => {
        setBatchProcessing(true)
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要处理的事件")
            setBatchProcessing(false)
            return
        }

        Modal.confirm({
            title: "确认批量处理",
            content: `确定要处理选中的 ${selectedRowKeys.length} 个事件吗？`,
            onOk: async () => {
                try {
                    const params = {
                        state: 2,
                        faultCenterId: id,
                        fingerprints: selectedRowKeys
                    }
                    await ProcessAlertEvent(params)

                    message.success(`成功处理 ${selectedRowKeys.length} 个事件`)
                    setSelectedRowKeys([]) // 清空选择
                    handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize) // 刷新列表
                } catch (error) {
                    message.error("处理失败: " + error.message)
                } finally {
                    setBatchProcessing(false)
                }
            },
            onCancel: () => {
                setBatchProcessing(false)
            },
        })
    }

    // 单条去认领
    const handleClaimOne = (record) => {
        Modal.confirm({
            title: "确认认领",
            content: `确定要认领规则 "${record.rule_name}" 的该事件吗？`,
            onOk: async () => {
                try {
                    setBatchProcessing(true)
                    const params = {
                        state: 1,
                        faultCenterId: id,
                        fingerprints: [record.fingerprint],
                    }
                    await ProcessAlertEvent(params)
                    message.success("认领成功")
                    handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize)
                } catch (error) {
                    message.error("认领失败: " + error.message)
                } finally {
                    setBatchProcessing(false)
                }
            },
        })
    }

    // 单条去处理
    const handleProcessOne = (record) => {
        Modal.confirm({
            title: "确认处理",
            content: `确定要将该事件标记为已处理吗？`,
            onOk: async () => {
                try {
                    setBatchProcessing(true)
                    const params = {
                        state: 2,
                        faultCenterId: id,
                        fingerprints: [record.fingerprint],
                    }
                    await ProcessAlertEvent(params)
                    message.success("处理成功")
                    handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize)
                } catch (error) {
                    message.error("处理失败: " + error.message)
                } finally {
                    setBatchProcessing(false)
                }
            },
        })
    }

    // 清除所有过滤条件
    const clearAllFilters = () => {
        setSearchQuery("")
        setSelectedDataSource("")
        setSelectedAlertLevel("")
        setIsFiltering(true) // 标记正在过滤
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

    // 打开导出对话框
    const openExportModal = () => {
        setExportOptions({
            ...exportOptions,
            filterOptions: [
                ...(searchQuery ? ["ruleName"] : []),
                ...(selectedDataSource ? ["ruleType"] : []),
                ...(selectedAlertLevel ? ["alertLevel"] : []),
            ],
        })
        setExportModalVisible(true)
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
        console.log("123")
        if (currentEventList.length === 0) {
            message.warning("当前告警列表中没有事件!")
            return
        };

        let event  = []
        try {
            setLoading(true)
            const params = {
                faultCenterId: id,
                index: 1,
                size: 1000,
                query: searchQuery || undefined,
                status: selectedStatus || undefined,
                datasourceType: selectedDataSource || undefined,
                severity: selectedAlertLevel || undefined,
            }
            const res = await getCurEventList(params)
            if (res?.data?.list) {
                event = res.data.list.sort((a, b) => b.first_trigger_time - a.first_trigger_time)
            }
        } catch (error) {
            HandleApiError(error)
        } finally {
            setLoading(false)
        }

        exportAlarmRecordToHTML("活跃告警报表", event, {
            ruleName: searchQuery,
            ruleType: selectedDataSource,
            alertLevel: selectedAlertLevel,
        });

        setExportModalVisible(false)
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
                        height: "700px", // 固定高度
                        overflowY: "auto", // 支持垂直滚动
                        padding: "20px",
                        backgroundColor: "#f9f9f9", // 灰色背景
                        borderRadius: "8px", // 圆角
                    },
                }}
            >
                <div style={{ marginTop: "10px" }}>
                    <Descriptions
                        labelStyle={{ width: '100px' }}
                        items={[
                            {
                                key: "1",
                                label: "规则名称",
                                children: aiAnalyzeContent.ruleName,
                            },
                            {
                                key: "2",
                                label: "规则类型",
                                children: aiAnalyzeContent.datasourceType,
                            },
                            {
                                key: "3",
                                label: "告警指纹",
                                children: aiAnalyzeContent.fingerprint,
                            },
                        ]}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            type="primary"
                            onClick={handleAiDeepAnalyze}
                            disabled={analyzeLoading}
                            style={{ background: "#000", color: 'white' }}
                        >
                            深度分析
                        </Button>
                    </div>
                </div>
                <Divider />
                {analyzeLoading ? (
                    <div style={{ alignItems: "center", marginTop: "100px", textAlign: "center" }}>
                        <Spin tip="Ai 分析中..." percent={percent}>
                            <br />
                        </Spin>
                    </div>
                ) : (
                    <MarkdownRenderer data={aiAnalyzeContent.content} />
                )}
            </Modal>

            <div style={{ marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Space wrap>
                        <Search
                            allowClear
                            placeholder="输入搜索关键字"
                            onSearch={handleSearch}
                            style={{ width: 200 }}
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            prefix={<SearchOutlined />}
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
                                { value: "ClickHouse", label: "ClickHouse" },
                            ]}
                        />
                        <Select
                            placeholder="告警等级"
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
                        <Select
                            placeholder="告警状态"
                            style={{ width: 150 }}
                            allowClear
                            value={selectedStatus || null}
                            onChange={handleStatusChange}
                            options={[
                                { value: "pre_alert", label: "预告警" },
                                { value: "alerting", label: "告警中" },
                                { value: "silenced", label: "静默中" },
                                { value: "pending_recovery", label: "待恢复" },
                            ]}
                        />
                        <Button onClick={handleRefresh} icon={<ReloadOutlined />} loading={loading}>
                            刷新
                        </Button>
                        {(searchQuery || selectedDataSource || selectedAlertLevel) && (
                            <Button onClick={clearAllFilters} icon={<FilterOutlined />}>
                                清除筛选
                            </Button>
                        )}
                        <Button icon={<DownloadOutlined />} onClick={openExportModal}>
                            导出
                        </Button>
                    </Space>
                    <Space>
                        <Dropdown menu={batchOperationMenu} disabled={selectedRowKeys.length === 0 || batchProcessing}>
                            <Button loading={batchProcessing}>
                                批量操作 <DownOutlined />
                            </Button>
                        </Dropdown>
                    </Space>
                </div>
            </div>

            <Table
                columns={columns}
                dataSource={currentEventList}
                loading={loading}
                rowSelection={rowSelection}
                pagination={{
                    current: currentPagination.pageIndex,
                    pageSize: currentPagination.pageSize,
                    total: currentPagination.pageTotal,
                    showTotal: HandleShowTotal,
                    showSizeChanger: true,
                    pageSizeOptions: ["10", "20", "50", "100"],
                }}
                onChange={handleCurrentPageChange}
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
                rowKey={(record) => record.fingerprint}
                scroll={{
                    y: height - 250,
                    x: "max-content", // 水平滚动
                }}
                locale={{
                    emptyText: <Empty description="暂无告警事件" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                }}
                rowClassName={(record) => `severity-row-${record.severity}`}
            />
            <style>{`
                .severity-row-P0 td:first-child {
                    border-left: 6px solid #ff4d4f !important;
                    padding-left: 10px !important;
                }
                .severity-row-P1 td:first-child {
                    border-left: 6px solid #faad14 !important;
                    padding-left: 10px !important;
                }
                .severity-row-P2 td:first-child {
                    border-left: 6px solid #b0e1fb !important;
                    padding-left: 10px !important;
                }
            `}</style>

            <CreateSilenceModal visible={silenceVisible} onClose={handleSilenceModalClose} type="create"
                                selectedRow={selectedSilenceRow} faultCenterId={id}/>

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
                            column={1}
                            style={{ marginBottom: '24px' }}
                            labelStyle={{ width: '120px' }}
                            items={[
                                {
                                    key: 'rule_name',
                                    label: '规则名称',
                                    children: selectedEvent.rule_name,
                                },
                                {
                                    key: 'fingerprint',
                                    label: '告警指纹',
                                    children: selectedEvent.fingerprint,
                                },
                                {
                                    key: 'datasource',
                                    label: '数据源',
                                    children: selectedEvent.datasource_id
                                },
                                {
                                    key: 'severity',
                                    label: '告警等级',
                                    children: <Tag color={SEVERITY_COLORS[selectedEvent.severity]}>{selectedEvent.severity}</Tag>,
                                },
                                {
                                    key: 'status',
                                    label: '事件状态',
                                    children: (
                                        <Tag color={statusMap[selectedEvent.status].color}>{statusMap[selectedEvent.status].text}</Tag>
                                    ),
                                },
                                {
                                    key: 'value',
                                    label: '触发时值',
                                    children: selectedEvent?.labels["first_value"] || 0,
                                },
                                {
                                    key: 'confirm',
                                    label: '认领人',
                                    children: (
                                        <Tag
                                            style={{
                                                borderRadius: '12px',
                                                padding: '0 10px',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                            }}
                                        >
                                            {RenderTruncatedText(selectedEvent?.upgradeState?.whoAreConfirm || '未认领')}
                                        </Tag>
                                    ),
                                },
                                {
                                    key: 'labels',
                                    label: '事件标签',
                                    children: (
                                        <div style={{ display: "flex", flexWrap: "wrap", gap: "3px" }}>
                                            {Object.entries(selectedEvent?.labels).map(([key, value]) => (
                                                <Tag color="processing" key={key}>{`${key}: ${value}`}</Tag>
                                            ))}
                                        </div>
                                    ),
                                },
                            ]}
                        />

                        <Divider/>

                        <div>
                            <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                                事件详情
                            </Title>
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
                            ) }
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
                                            style={{ borderBlockEnd: "none" }}
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
                                                            <Text type="secondary" style={{ fontSize: "12px" }}>
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
                                                                        style={{ color: "#ff4d4f", fontSize: "12px", marginLeft: "8px" }}
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
                                <div style={{ textAlign: "right"}}>
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

            {/* 导出配置对话框 */}
            <Modal
                title="导出活跃告警"
                open={exportModalVisible}
                onCancel={() => setExportModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setExportModalVisible(false)}>
                        取消
                    </Button>,
                    <Button key="export" type="primary" onClick={handleExportClick}>
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
        </div>
    )
}
