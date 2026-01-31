"use client"
import React, { useEffect, useState, useCallback, useRef } from "react"
import {
    Button,
    Input,
    Radio,
    Tag,
    Dropdown,
    message,
    Modal,
    Drawer,
    Select,
    Tooltip,
    Space,
    Switch,
    Popconfirm,
    Form
} from "antd"
import { Link, useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import { deleteRule, getRuleList, RuleImport, RuleChange, RuleChangeStatus } from "../../../api/rule"
import { ReactComponent as PrometheusImg } from "./img/Prometheus.svg"
import { ReactComponent as AlicloudImg } from "./img/alicloud.svg"
import { ReactComponent as JaegerImg } from "./img/jaeger.svg"
import { ReactComponent as AwsImg } from "./img/AWSlogo.svg"
import { ReactComponent as LokiImg } from "./img/L.svg"
import { ReactComponent as K8sImg } from "./img/Kubernetes.svg"
import { ReactComponent as ESImg } from "./img/ElasticSearch.svg"
import { ReactComponent as VLogImg } from "./img/victorialogs.svg"
import { ReactComponent as CkImg } from "./img/clickhouse.svg"
import { getDatasourceList } from "../../../api/datasource"
import {
    DeleteOutlined,
    ExportOutlined,
    DownOutlined,
    ImportOutlined,
    CopyOutlined,
    PlusOutlined,
    EditOutlined
} from "@ant-design/icons"
import { FaultCenterList } from "../../../api/faultCenter";
import VSCodeEditor from "../../../utils/VSCodeEditor";
import { copyToClipboard } from "../../../utils/copyToClipboard";
import { HandleApiError, HandleShowTotal } from "../../../utils/lib";
import { useAppContext } from "../../../context/RuleContext";
import { TableWithPagination } from '../../../utils/TableWithPagination';
import { RuleGroupSidebar } from './RuleGroupSidebar';
import { getRuleGroupList } from "../../../api/rule"
import { Breadcrumb } from "../../../components/Breadcrumb";

export const AlertRuleList = () => {
    const { setCloneAlertRule } = useAppContext()
    const navigate = useNavigate()
    const { Search } = Input
    const { Option } = Select;
    const [list, setList] = useState([])
    const [datasourceList, setDatasourceList] = useState([])
    const { id } = useParams()
    const [selectRuleStatus, setSelectRuleStatus] = useState("all")

    // 从 sessionStorage 恢复页码状态
    const getStoredPagination = useCallback(() => {
        const stored = sessionStorage.getItem(`alertRule_pagination_${id}`)
        if (stored) {
            try {
                return JSON.parse(stored)
            } catch (e) {
                console.error('Failed to parse stored pagination:', e)
            }
        }
        return { index: 1, size: 10, total: 0 }
    }, [id])

    const [pagination, setPagination] = useState(() => getStoredPagination())
    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    // 规则组相关状态
    const [selectedRuleGroupId, setSelectedRuleGroupId] = useState(id)
    const isInitialMount = useRef(true)

    // 导入相关状态
    const [importDrawerVisible, setImportDrawerVisible] = useState(false)
    const [importType, setImportType] = useState(1)
    const [selectedDatasource, setSelectedDatasource] = useState(null)
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
    const [faultCenterList, setFaultCenterList] = useState([])
    const [yamlContent, setYamlContent] = useState("")
    const [jsonContent, setJsonContent] = useState("")


    // 批量修改相关状态
    const [batchModifyVisible, setBatchModifyVisible] = useState(false)
    const [batchModifyForm, setBatchModifyForm] = useState({
        rule_group_id: null,
        datasource_ids: null,
        datasource_type: null, // 新增：数据源类型
        eval_interval: null,
        eval_time_type: null,
        severity: null,
        fault_center_id: null,
        enabled: null
    })
    const [batchModifyFields, setBatchModifyFields] = useState(null)
    const [ruleGroupList, setRuleGroupList] = useState([])

    // 行选择变化处理
    const handleSelectChange = (selectedKeys, selectedRows) => {
        setSelectedRowKeys(selectedKeys)
    }

    const columns = [
        {
            title: "规则名称",
            dataIndex: "ruleName",
            key: "ruleName",
            width: "auto",
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Tooltip title={text} placement="topLeft">
                        <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px'
                        }}>
                            <Link
                                style={{
                                    color: "#1677ff",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                to={`/ruleGroup/${record.ruleGroupId}/rule/${record.ruleId}/edit`}
                            >
                                {text}
                            </Link>
                        </div>
                    </Tooltip>
                    <Tooltip title="点击复制 ID">
                        <span
                            style={{
                                color: '#8c8c8c',
                                fontSize: '12px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                display: 'inline-block',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={() => copyToClipboard(record.ruleId)}
                        >
                            {record.ruleId}
                            <CopyOutlined style={{ marginLeft: 8 }} />
                        </span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: "告警等级",
            dataIndex: "severity",
            key: "severity",
            width: "150px",
            render: (text, record) => {
                const severities = GetSeverity(record);
                return (
                    <span>
                        {severities.map((severity, index) => (
                            <Tag color={severity === "P0" ? "red" : severity === "P1" ? "gold" : severity === "P2" ? "cyan" : "purple"} key={index}>
                                {severity}
                            </Tag>
                        ))}
                    </span>
                );
            }
        },
        {
            title: "数据源类型",
            dataIndex: "datasourceType",
            key: "datasourceType",
            width: "auto",
            render: (text, record) => {
                return (
                    <div style={{ display: "flex" }}>
                        {text === "Prometheus" && <PrometheusImg style={{ height: "25px", width: "25px" }} />}
                        {text === "CloudWatch" && <AwsImg style={{ height: "25px", width: "25px" }} />}
                        {text === "Loki" && <LokiImg style={{ height: "25px", width: "25px" }} />}
                        {text === "Jaeger" && <JaegerImg style={{ height: "25px", width: "25px" }} />}
                        {text === "AliCloudSLS" && <AlicloudImg style={{ height: "25px", width: "25px" }} />}
                        {text === "VictoriaLogs" && <VLogImg style={{ height: "25px", width: "25px" }} />}
                        {text === "KubernetesEvent" && <K8sImg style={{ height: "25px", width: "25px" }} />}
                        {text === "ElasticSearch" && <ESImg style={{ height: "25px", width: "25px" }} />}
                        {text === "ClickHouse" && <CkImg style={{ height: "25px", width: "25px" }} />}
                        <div style={{ marginLeft: "5px", marginTop: "3px", fontSize: "12px" }}>{text}</div>
                    </div>
                )
            },
        },
        {
            title: "数据源",
            dataIndex: "datasourceId",
            key: "datasourceId",
            width: "auto",
            render: (text, record) => (
                <span>
                    {getDatasourceNamesByIds(record.datasourceId)
                        .split(", ")
                        ?.map((name, index) => (
                            <Tag color="processing" key={index}>
                                {name}
                            </Tag>
                        ))}
                </span>
            ),
        },
        {
            title: "描述",
            dataIndex: "description",
            key: "description",
            width: "auto",
            render: (text, record, index) => {
                if (!text) {
                    return "没有留下任何描述~"
                }
                return text
            },
        },
        {
            title: "更新时间",
            dataIndex: "updateAt",
            key: "updateAt",
            width: "auto",
            render: (text) => {
                const date = new Date(text * 1000)
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{date.toLocaleString()}</span>
                    </div>
                )
            },
        },
        {
            title: "操作人",
            dataIndex: "updateBy",
            key: "updateBy",
            width: "auto",
            render: (text) => {
                return <Tag style={{
                    borderRadius: "12px",
                    padding: "0 10px",
                    fontSize: "12px",
                    fontWeight: "500",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                }}>
                    {text || "未知用户"}
                </Tag>
            },
        },
        {
            title: "状态",
            dataIndex: "enabled",
            key: "enabled",
            width: "100px",
            render: (enabled, record) => {
                const handleStatusChange = async (checked) => {
                    try {
                        const params = {
                            tenantId: record.tenantId,
                            ruleGroupId: record.ruleGroupId,
                            ruleId: record.ruleId,
                            faultCenterId: record.faultCenterId,
                            enabled: checked,
                        }
                        await RuleChangeStatus(params)
                        message.success(`「${record.ruleName}」状态已更新为: ${checked ? "启用" : "禁用"}`);
                        handleList(id, pagination.index, pagination.size)
                    } catch (error) {
                        HandleApiError(error)
                    }
                };
                return (
                    <Switch
                        checked={enabled}
                        onChange={handleStatusChange}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                        loading={false}
                    />
                );
            },
        },
        {
            title: "操作",
            dataIndex: "operation",
            fixed: "right",
            width: 50,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="克隆">
                        <Button
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => handleClone(record)}
                            style={{ color: "#615454" }}
                        />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Popconfirm
                            title="确定要删除此规则吗?"
                            onConfirm={() => handleDelete(record.ruleGroupId, record.ruleId)}
                            okText="确定"
                            cancelText="取消"
                            placement="left"
                        >
                            <Button
                                type="text"
                                icon={<DeleteOutlined />}
                                style={{ color: "red" }}
                            />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ]

    const savePaginationToStorage = useCallback((newPagination) => {
        sessionStorage.setItem(`alertRule_pagination_${id}`, JSON.stringify(newPagination))
    }, [id])

    const updatePagination = useCallback((newPagination) => {
        setPagination(newPagination)
        savePaginationToStorage(newPagination)
    }, [savePaginationToStorage])

    const handleList = useCallback(async (ruleGroupId, index, size) => {
        try {
            const params = {
                index: index,
                size: size,
                status: selectRuleStatus,
                ruleGroupId: ruleGroupId,
            }
            const res = await getRuleList(params)
            const newPagination = {
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            }
            updatePagination(newPagination)
            setList(res?.data?.list)
            setSelectedRowKeys([])
        } catch (error) {
            console.error(error)
        }
    }, [selectRuleStatus, updatePagination])

    useEffect(() => {
        const initializeData = async () => {
            await handleListDatasource()
            handleList(selectedRuleGroupId, pagination.index, pagination.size)
        }
        if (isInitialMount.current) {
            initializeData()
            isInitialMount.current = false
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const onSearch = useCallback(async (value) => {
        try {
            const params = {
                index: pagination.index,
                size: pagination.size,
                ruleGroupId: id,
                status: selectRuleStatus,
                query: value,
            }
            const res = await getRuleList(params)
            const newPagination = {
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            }
            updatePagination(newPagination)
            setList(res?.data?.list)
            setSelectedRowKeys([])
        } catch (error) {
            console.error(error)
        }
    }, [pagination.index, pagination.size, id, selectRuleStatus, updatePagination])

    useEffect(() => {
        setSelectedRuleGroupId(id)
        const storedPagination = getStoredPagination()
        updatePagination(storedPagination)
        handleList(id, storedPagination.index, storedPagination.size)
    }, [id, getStoredPagination, updatePagination, handleList])

    useEffect(() => {
        if (!isInitialMount.current) {
            onSearch()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectRuleStatus])

    const handleListDatasource = async () => {
        try {
            const res = await getDatasourceList()
            setDatasourceList(res?.data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleRuleGroupChange = (groupId) => {
        setSelectedRuleGroupId(groupId)
        const newPagination = { ...pagination, index: 1 }
        updatePagination(newPagination)
        handleList(groupId, 1, pagination.size)
        navigate(`/ruleGroup/${groupId}/rule/list`)
    }

    const GetSeverity = (data) => {
        const isPrometheusType = data.datasourceType === 'Prometheus';
        if (isPrometheusType && data.prometheusConfig?.rules) {
            return data?.prometheusConfig?.rules?.map((rule) => rule.severity);
        } else {
            return data?.severity ? [data?.severity] : [];
        }
    };

    const getDatasourceNamesByIds = (datasourceIdList) => {
        if (!Array.isArray(datasourceIdList)) return "Unknown"
        const matchedNames = datasourceIdList.map((id) => {
            const datasource = datasourceList.find((ds) => ds.id === id)
            return datasource ? datasource.name : "Unknown"
        })
        return matchedNames.join(", ") || "Unknown"
    }

    const changeStatus = async ({ target: { value } }) => {
        const newPagination = { ...pagination, index: 1, size: pagination.size }
        updatePagination(newPagination)
        setSelectRuleStatus(value)
    }

    const handleClone = (record) => {
        const cloneData = {
            ...record,
            ruleName: `${record.ruleName} - Copy`,
            ruleId: "",
        }
        setCloneAlertRule(cloneData)
        navigate(`/ruleGroup/${id}/rule/add?isClone=1`)
    }

    const handleDelete = async (ruleGroupId, ruleId) => {
        try {
            await deleteRule({ ruleId, ruleGroupId })
        } catch (error) {
            HandleApiError(error)
        }
        handleList(id, pagination.index, pagination.size)
    }

    const handleBatchDelete = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要删除的规则")
            return
        }
        const deletePromises = selectedRowKeys.map((key) => {
            const record = list.find((item) => item.ruleId === key)
            if (record) {
                return deleteRule({ ruleId: record.ruleId, ruleGroupId: record.ruleGroupId })
            }
            return Promise.resolve()
        })
        await Promise.all(deletePromises)
        setSelectedRowKeys([])
        handleList(id, pagination.index, pagination.size)
    }

    const handleBatchExport = () => {
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要导出的规则")
            return
        }
        const selectedRules = list.filter((item) => selectedRowKeys.includes(item.ruleId))
        const data = JSON.stringify(selectedRules, null, 2)
        const blob = new Blob([data], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `rules_export_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        message.success(`已导出 ${selectedRules.length} 条规则`)
    }

    const fetchFaultCenterList = async () => {
        try {
            const res = await FaultCenterList()
            const newData = res?.data?.map((item) => ({
                label: item.name,
                value: item.id,
            }))
            setFaultCenterList(newData)
        } catch (error) {
            console.error(error)
        }
    }

    const fetchRuleGroupList = async () => {
        try {
            const params = {
                index: 1,
                size: 9999,
            }
            const res = await getRuleGroupList(params)
            const newData = res?.data?.list?.map((item) => ({
                label: item.name,
                value: item.id,
            }))
            setRuleGroupList(newData)
        } catch (error) {
            console.error(error)
        }
    }

    const handleImportClick = () => {
        setImportDrawerVisible(true)
        fetchFaultCenterList()
        setJsonContent("")
        setYamlContent("")
    }

    const handleJsonContentChange = (value) => {
        setJsonContent(value)
    }

    const handleYamlContentChange = (value) => {
        setYamlContent(value)
    }

    const handleConfirmImport = async () => {
        if (importType === 1) {
            if (!jsonContent.trim()) {
                message.error("请输入JSON内容")
                return
            }
        } else if (importType === 0) {
            if (!yamlContent.trim()) {
                message.error("请输入Prometheus规则YAML内容")
                return
            }
            if (!selectedDatasource) {
                message.error("请选择数据源")
                return
            }
            if (!selectedFaultCenter) {
                message.error("请选择故障中心")
                return
            }
        }
        try {
            const params = {
                ruleGroupId: id,
                datasourceType: "Prometheus",
                datasourceIdList: [selectedDatasource] || undefined,
                faultCenterId: selectedFaultCenter || undefined,
                importType: importType,
                rules: (importType === 0 ? yamlContent : jsonContent),
            }
            await RuleImport(params)
            setImportDrawerVisible(false)
            handleList(id, pagination.index, pagination.size)
            message.success("导入成功!")
        } catch (error) {
            HandleApiError(error)
        }
    }

    const handleBatchModify = () => {
        setBatchModifyForm({
            rule_group_id: null,
            datasource_ids: null,
            eval_interval: null,
            eval_time_type: null,
            severity: null,
            fault_center_id: null,
            enabled: null
        })
        setBatchModifyFields(null) // 重置为 null
        fetchRuleGroupList()
        fetchFaultCenterList()
        setBatchModifyVisible(true)
    }

    const handleBatchModifyFieldChange = (field, value) => {
        setBatchModifyForm(prev => ({
            ...prev,
            [field]: value
        }))
    }

    const handleConfirmBatchModify = async () => {
        if (!batchModifyFields) {
            message.warning("请选择要修改的字段")
            return
        }

        const field = batchModifyFields
        const value = batchModifyForm[field]

        if (value === null || value === undefined || value === '') {
            message.warning("请填写要修改的值")
            return
        }

        // 特殊处理：当修改数据源时，检查类型匹配
        if (field === 'datasource_ids' && batchModifyForm.datasource_type) {
            // 获取选中的规则
            const selectedRules = list.filter(item => selectedRowKeys.includes(item.ruleId));
            
            // 检查是否存在类型不匹配的规则
            const mismatchedRules = selectedRules.filter(rule => 
                rule.datasourceType !== batchModifyForm.datasource_type
            );
            
            if (mismatchedRules.length > 0) {
                // 显示警告信息
                Modal.confirm({
                    title: '数据源类型不匹配',
                    content: (
                        <div>
                            <p>以下规则的数据源类型与选择的类型不匹配，修改将不生效：</p>
                            <ul style={{ maxHeight: '200px', overflowY: 'auto', paddingLeft: '20px' }}>
                                {mismatchedRules.map(rule => (
                                    <li key={rule.ruleId} style={{ marginBottom: '4px' }}>
                                        <strong>{rule.ruleName}</strong> (当前类型: {rule.datasourceType})
                                    </li>
                                ))}
                            </ul>
                            <p style={{ marginTop: '10px' }}>是否继续修改其他匹配的规则？</p>
                        </div>
                    ),
                    okText: '继续修改',
                    cancelText: '取消',
                    okType: 'default',
                    onOk: async () => {
                        // 继续执行修改，只对类型匹配的规则进行修改
                        await performBatchModify();
                    },
                    onCancel: () => {
                        return; // 取消操作
                    }
                });
                return;
            }
        }

        // 执行修改操作
        await performBatchModify();

        async function performBatchModify() {
            try {
                // 构建 change 对象
                let changeParams = {}
                if (field === 'datasource_ids') {
                    // 如果指定了数据源类型，验证选中的数据源是否与类型匹配
                    if (batchModifyForm.datasource_type && Array.isArray(value)) {
                        // 过滤出与指定类型匹配的数据源ID
                        const filteredDatasourceIds = datasourceList
                            .filter(ds => value.includes(ds.id) && ds.type === batchModifyForm.datasource_type)
                            .map(ds => ds.id);
                        
                        if (filteredDatasourceIds.length !== value.length) {
                            message.warning(`部分选择的数据源类型与指定类型不匹配，仅修改匹配的数据源`);
                        }
                        
                        changeParams[field] = filteredDatasourceIds.length > 0 ? filteredDatasourceIds : value;
                    } else if (batchModifyForm.datasource_type && typeof value === 'string') {
                        // 单个数据源ID的情况
                        const datasourceInfo = datasourceList.find(ds => ds.id === value);
                        if (datasourceInfo && datasourceInfo.type === batchModifyForm.datasource_type) {
                            changeParams[field] = [value];
                        } else {
                            message.warning(`选择的数据源类型与指定类型不匹配`);
                            return;
                        }
                    } else {
                        changeParams[field] = Array.isArray(value) ? value : [value];
                    }
                } else {
                    changeParams[field] = value
                }

                const firstRule = list.find(item => selectedRowKeys.includes(item.ruleId))
                const tenantId = firstRule?.tenantId || 'default'
                const params = {
                    tenantId,
                    rule_ids: selectedRowKeys,
                    change: changeParams
                }

                await RuleChange(params)
                message.success(`成功修改了 ${selectedRowKeys.length} 条规则`)
                setBatchModifyVisible(false)
                setSelectedRowKeys([])
                handleList(id, pagination.index, pagination.size)
            } catch (error) {
                HandleApiError(error)
            }
        }
    }

    const batchOperationMenu = {
        items: [
            {
                key: "batchDelete",
                label: "批量删除",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => {
                    if (selectedRowKeys.length > 0) {
                        Modal.confirm({
                            title: "确认删除",
                            content: `确定要删除选中的 ${selectedRowKeys.length} 条规则吗？`,
                            onOk: handleBatchDelete,
                        })
                    } else {
                        message.warning("请先选择要删除的规则")
                    }
                },
            },
            {
                key: "batchExport",
                label: "批量导出",
                icon: <ExportOutlined />,
                onClick: handleBatchExport,
            },
            {
                key: "batchModify",
                label: "批量修改",
                icon: <EditOutlined />,
                onClick: handleBatchModify,
            },
        ],
    }

    return (
        <>
        <Breadcrumb items={['告警管理', '规则']} />
        <div style={{ display: 'flex' }}>
            <div style={{ width: '180px', flexShrink: 0 }}>
                <RuleGroupSidebar
                    selectedRuleGroupId={selectedRuleGroupId}
                    onRuleGroupChange={handleRuleGroupChange}
                />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: '20px' }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}>
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "20px",
                        alignItems: "center"
                    }}>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <Radio.Group
                                options={[
                                    { label: "全部", value: "all" },
                                    { label: "开启", value: "enabled" },
                                    { label: "禁用", value: "disabled" },
                                ]}
                                defaultValue={selectRuleStatus}
                                onChange={changeStatus}
                                optionType="button"
                            />
                            <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                            {selectedRowKeys.length > 0 && (
                                <div style={{ color: '#1677ff', fontSize: '14px' }}>
                                    已选择 {selectedRowKeys.length} 项
                                </div>
                            )}
                        </div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <Dropdown menu={batchOperationMenu} disabled={selectedRowKeys.length === 0}>
                                <Button>
                                    批量操作 <DownOutlined />
                                </Button>
                            </Dropdown>
                            <Button
                                type="primary"
                                size="default"
                                icon={<ImportOutlined />}
                                onClick={handleImportClick}
                                style={{ backgroundColor: "#000000" }}
                            >
                                导入
                            </Button>
                            <Link to={`/ruleGroup/${id}/rule/add`}>
                                <Button
                                    type="primary"
                                    size="default"
                                    style={{ backgroundColor: "#000000" }}
                                    icon={<PlusOutlined />}
                                >
                                    创建
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <TableWithPagination
                        columns={columns}
                        dataSource={list}
                        pagination={pagination}
                        onPageChange={(page, pageSize) => {
                            const newPagination = { ...pagination, index: page, size: pageSize }
                            updatePagination(newPagination)
                            handleList(id, page, pageSize)
                        }}
                        onPageSizeChange={(current, pageSize) => {
                            const newPagination = { ...pagination, index: current, size: pageSize }
                            updatePagination(newPagination)
                            handleList(id, current, pageSize)
                        }}
                        scrollY={'calc(100vh - 270px)'}
                        rowKey="ruleId"
                        showTotal={HandleShowTotal}
                        selectedRowKeys={selectedRowKeys}
                        onSelectChange={handleSelectChange}
                        selectAll={true}
                    />

                    {/* 导入抽屉 */}
                    <Drawer
                        title="导入规则"
                        placement="right"
                        width={500}
                        onClose={() => setImportDrawerVisible(false)}
                        open={importDrawerVisible}
                        footer={
                            <div style={{ textAlign: 'right' }}>
                                <Button
                                    type="primary"
                                    style={{ backgroundColor: "#000000" }}
                                    onClick={handleConfirmImport}
                                >
                                    确认导入
                                </Button>
                            </div>
                        }
                    >
                        <div style={{ marginBottom: 20 }}>
                            <Radio.Group
                                value={importType}
                                onChange={(e) => setImportType(e.target.value)}
                                style={{ marginBottom: 16, display: "flex", width: "100%" }}
                                buttonStyle="solid"
                            >
                                <Radio.Button value={1} style={{ flex: 1, textAlign: "center" }}>
                                    WatchAlert JSON
                                </Radio.Button>
                                <Radio.Button value={0} style={{ flex: 1, textAlign: "center" }}>
                                    Prometheus Rule YAML
                                </Radio.Button>
                            </Radio.Group>
                        </div>
                        {importType === 1 && (
                            <VSCodeEditor
                                height="75vh"
                                language="Json"
                                value={jsonContent}
                                onChange={handleJsonContentChange}
                            />
                        )}
                        {importType === 0 && (
                            <div>
                                <div style={{ marginBottom: 16 }}>
                                    <VSCodeEditor
                                        height="60vh"
                                        language="Yaml"
                                        value={`# 示例:
rules:
- alert: Exporter Componen is Down
  expr: up == 0
  for: 2m
  labels:
    severity: serious
  annotations:
    summary: 节点 Exporter Componen is Down
    description: 节点 Exporter Componen is Down`}
                                        onChange={handleYamlContentChange}
                                    />
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ marginBottom: 8 }}>选择数据源：</div>
                                    <Select
                                        placeholder="请选择数据源"
                                        style={{ width: "100%" }}
                                        onChange={(value) => setSelectedDatasource(value)}
                                        options={datasourceList
                                            .filter((ds) => ds.type === "Prometheus")
                                            .map((ds) => ({ label: ds.name, value: ds.id }))}
                                    />
                                </div>
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ marginBottom: 8 }}>选择故障中心：</div>
                                    <Select
                                        placeholder="请选择故障中心"
                                        style={{ width: "100%" }}
                                        onChange={(value) => setSelectedFaultCenter(value)}
                                        options={faultCenterList}
                                    />
                                </div>
                            </div>
                        )}
                    </Drawer>

                    {/* 批量修改模态框 */}
                    <Modal
                        title="批量修改规则"
                        open={batchModifyVisible}
                        onOk={handleConfirmBatchModify}
                        onCancel={() => setBatchModifyVisible(false)}
                        width={600}
                        okText="确认修改"
                        cancelText="取消"
                        okType="default"
                    >
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            <Form layout="vertical">
                                {/* 字段选择器 —— 单选 */}
                                <Form.Item label="请选择要修改的字段">
                                    <Select
                                        placeholder="选择一个字段进行批量修改"
                                        value={batchModifyFields} // 现在是字符串，如 'enabled'
                                        onChange={(value) => {
                                            // 重置表单值，只保留当前字段
                                            setBatchModifyForm(prev => ({
                                                rule_group_id: null,
                                                datasource_ids: null,
                                                eval_interval: null,
                                                eval_time_type: null,
                                                severity: null,
                                                fault_center_id: null,
                                                enabled: null,
                                                [value]: prev[value] // 保留之前填的值（可选优化）
                                            }));
                                            setBatchModifyFields(value); // 字符串
                                        }}
                                        allowClear
                                        options={[
                                            { label: '规则组', value: 'rule_group_id' },
                                            { label: '数据源', value: 'datasource_ids' },
                                            { label: '故障中心', value: 'fault_center_id' },
                                            { label: '规则状态', value: 'enabled' },
                                        ]}
                                    />
                                </Form.Item>

                                {/* 动态渲染：仅当选中某个字段时显示 */}
                                {batchModifyFields === 'rule_group_id' && (
                                    <Form.Item label="规则组">
                                        <Select
                                            placeholder="选择新的规则组"
                                            allowClear
                                            value={batchModifyForm.rule_group_id}
                                            onChange={(value) => handleBatchModifyFieldChange('rule_group_id', value)}
                                            options={ruleGroupList}
                                        />
                                    </Form.Item>
                                )}

                                {batchModifyFields === 'datasource_ids' && (
                                    <div>
                                        <Form.Item label="数据源">
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <Select
                                                        placeholder="选择数据源类型"
                                                        allowClear
                                                        value={batchModifyForm.datasource_type}
                                                        onChange={(value) => {
                                                            handleBatchModifyFieldChange('datasource_type', value);
                                                            // 当数据源类型改变时，清空已选择的数据源
                                                            handleBatchModifyFieldChange('datasource_ids', null);
                                                        }}
                                                        options={
                                                            [
                                                                {
                                                                    label: 'Prometheus',
                                                                    value: 'Prometheus'
                                                                },
                                                                {
                                                                    label: 'Loki',
                                                                    value: 'Loki'
                                                                },
                                                                {
                                                                    label: 'ElasticSearch',
                                                                    value: 'ElasticSearch'
                                                                },
                                                                {
                                                                    label: 'VictoriaLogs',
                                                                    value: 'VictoriaLogs'
                                                                },
                                                                {
                                                                    label: 'ClickHouse',
                                                                    value: 'ClickHouse'
                                                                },
                                                                {
                                                                    label: 'AliCloudSLS',
                                                                    value: 'AliCloudSLS'
                                                                },
                                                                {
                                                                    label: 'Jaeger',
                                                                    value: 'Jaeger'
                                                                },
                                                                {
                                                                    label: 'Kubernetes',
                                                                    value: 'Kubernetes'
                                                                },
                                                            ]
                                                        }
                                                    />
                                                </div>
                                                <div style={{ flex: 2 }}>
                                                    <Select
                                                        mode="multiple"
                                                        placeholder="选择新的数据源"
                                                        allowClear
                                                        value={batchModifyForm.datasource_ids}
                                                        onChange={(value) => handleBatchModifyFieldChange('datasource_ids', value)}
                                                        options={datasourceList
                                                            .filter(ds => batchModifyForm.datasource_type ? ds.type === batchModifyForm.datasource_type : true)
                                                            .map(ds => ({
                                                                label: ds.name,
                                                                value: ds.id
                                                            }))
                                                        }
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#ff4d4f' }}>
                                                注意：如果当前规则的数据源类型与选择的类型不匹配，修改将不生效
                                            </div>
                                        </Form.Item>
                                    </div>
                                )}

                                {batchModifyFields === 'fault_center_id' && (
                                    <Form.Item label="故障中心">
                                        <Select
                                            placeholder="选择故障中心"
                                            allowClear
                                            value={batchModifyForm.fault_center_id}
                                            onChange={(value) => handleBatchModifyFieldChange('fault_center_id', value)}
                                            options={faultCenterList}
                                        />
                                    </Form.Item>
                                )}

                                {batchModifyFields === 'enabled' && (
                                    <Form.Item label="规则状态">
                                        <Select
                                            placeholder="选择启用状态"
                                            allowClear
                                            value={batchModifyForm.enabled}
                                            onChange={(value) => handleBatchModifyFieldChange('enabled', value)}
                                        >
                                            <Option value={true}>启用</Option>
                                            <Option value={false}>禁用</Option>
                                        </Select>
                                    </Form.Item>
                                )}
                            </Form>
                        </div>
                    </Modal>
                </div>
            </div>
        </div>
        </>
    )
}