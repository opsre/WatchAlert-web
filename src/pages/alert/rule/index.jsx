"use client"

import React, { useEffect, useState } from "react"
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
    Popconfirm
} from "antd"
import {Link, useNavigate} from "react-router-dom"
import { useParams } from "react-router-dom"
import {deleteRule, getRuleList, RuleChangeStatus, RuleImport} from "../../../api/rule"
import { ReactComponent as PrometheusImg } from "./img/Prometheus.svg"
import { ReactComponent as AlicloudImg } from "./img/alicloud.svg"
import { ReactComponent as JaegerImg } from "./img/jaeger.svg"
import { ReactComponent as AwsImg } from "./img/AWSlogo.svg"
import { ReactComponent as LokiImg } from "./img/L.svg"
import { ReactComponent as VMImg } from "./img/victoriametrics.svg"
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
    EditOutlined,
    CopyOutlined, 
    PlusOutlined,
    CheckSquareOutlined,
    CloseSquareOutlined
} from "@ant-design/icons"
import {FaultCenterList} from "../../../api/faultCenter";
import VSCodeEditor from "../../../utils/VSCodeEditor";
import {copyToClipboard} from "../../../utils/copyToClipboard";
import {HandleApiError, HandleShowTotal} from "../../../utils/lib";
import {useAppContext} from "../../../context/RuleContext";
import { TableWithPagination } from '../../../utils/TableWithPagination';
import { RuleGroupSidebar } from './RuleGroupSidebar';

export const AlertRuleList = () => {
    const { setCloneAlertRule } = useAppContext()
    const navigate = useNavigate()
    const { Search } = Input
    const [list, setList] = useState([])
    const [datasourceList, setDatasourceList] = useState([])
    const { id } = useParams()
    const [selectRuleStatus, setSelectRuleStatus] = useState("all")
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    })
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    // 规则组相关状态
    const [selectedRuleGroupId, setSelectedRuleGroupId] = useState(id)
    // 导入相关状态
    const [importDrawerVisible, setImportDrawerVisible] = useState(false)
    const [importType, setImportType] = useState(1) // 1 'watchalert' 或 0 'prometheus'
    const [selectedDatasource, setSelectedDatasource] = useState(null)
    const [selectedDatasourceType, setSelectedDatasourceType] = useState("")
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
    const [faultCenterList, setFaultCenterList] = useState([])
    const [yamlContent, setYamlContent] = useState("")
    const [jsonContent, setJsonContent] = useState("")

    // 行选择配置
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys)
        },
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
                            {text}
                        </div>
                    </Tooltip>
                    <Tooltip title="点击复制 ID">
                        <span
                            style={{
                                color: '#8c8c8c',     // 灰色字体
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
                const severities = GetSeverity(record); // 获取 severity 数组
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
                        {text === "VictoriaMetrics" && <VMImg style={{ height: "25px", width: "25px" }} />}
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
                      .map((name, index) => (
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
            title: "更新人",
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
                            }}
                        >
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
                        const params={
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
            fixed: "right", // 设置操作列固定
            width: 120,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="更新">
                        <Link to={`/ruleGroup/${record.ruleGroupId}/rule/${record.ruleId}/edit`}>
                            <Button
                                type="link"
                                icon={<EditOutlined />}
                                style={{ color: "#1677ff" }}
                            />
                        </Link>
                    </Tooltip>
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
                            onConfirm={() => handleDelete(record.ruleGroupId,record.ruleId)}
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
        handleList(selectedRuleGroupId, pagination.index, pagination.size)
        handleListDatasource()
    }, [])

    useEffect(() => {
        // 当 URL 参数 id 变化时，更新选中的规则组
        setSelectedRuleGroupId(id)
        handleList(id, 1, pagination.size)
    }, [id])

    useEffect(() => {
        onSearch()
    }, [selectRuleStatus])

    const handleListDatasource = async () => {
        try {
            const res = await getDatasourceList()
            setDatasourceList(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    // 切换规则组
    const handleRuleGroupChange = (groupId) => {
        setSelectedRuleGroupId(groupId)
        setPagination({ ...pagination, index: 1 })
        // 直接刷新当前规则组的规则列表，不进行路由跳转
        handleList(groupId, 1, pagination.size)
        navigate(`/ruleGroup/${groupId}/rule/list`)
    }

    const GetSeverity = (data) => {
        // 判断是否为 Prometheus 或 VictoriaMetrics 类型
        const isPrometheusType = data.datasourceType === 'Prometheus' || data.datasourceType === 'VictoriaMetrics';

        // 获取 severity 值
        if (isPrometheusType && data.prometheusConfig?.rules) {
            // 从 prometheusConfig.rules 中提取所有 severity
            return data.prometheusConfig.rules.map((rule) => rule.severity);
        } else {
            // 直接返回 severity 的数组（如果为空则返回空数组）
            return data.severity ? [data.severity] : [];
        }
    };

    const getDatasourceNamesByIds = (datasourceIdList) => {
        if (!Array.isArray(datasourceIdList)) return "Unknown"

        const matchedNames = datasourceIdList.map((id) => {
            const datasource = datasourceList.find((ds) => ds.id === id)
            return datasource ? datasource.name : "Unknown"
        })

        return matchedNames.join(", ") || "Unknown" // Join multiple names with commas
    }

    const handleList = async (id, index, size) => {
        try {
            const params = {
                index: index,
                size: size,
                status: selectRuleStatus,
                ruleGroupId: id,
            }
            const res = await getRuleList(params)

            setPagination({
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            })

            setList(res.data.list)
            setSelectedRowKeys([])
        } catch (error) {
            console.error(error)
        }
    }

    const onSearch = async (value) => {
        try {
            const params = {
                index: pagination.index,
                size: pagination.size,
                ruleGroupId: id,
                status: selectRuleStatus,
                query: value,
            }

            const res = await getRuleList(params)

            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            })

            setList(res.data.list)
            setSelectedRowKeys([])
        } catch (error) {
            console.error(error)
        }
    }

    const changeStatus = async ({ target: { value } }) => {
        setPagination({ ...pagination, index: 1, size: pagination.size })
        setSelectRuleStatus(value)
    }

    const handleClone = (record) => {
        // 实现克隆功能
        console.log("Clone rule:", record)

        // 将规则数据存储到 localStorage，以便在创建页面中获取
        const cloneData = {
            ...record,
            ruleName: `${record.ruleName} - Copy`,
            ruleId: "",
        }

        setCloneAlertRule(cloneData)

        // 跳转到创建页面
        navigate(`/ruleGroup/${id}/rule/add?isClone=1`)
    }

    // 删除单个规则
    const handleDelete = async (ruleGroupId,ruleId) =>{
        try {
            await deleteRule({
                ruleId: ruleId,
                ruleGroupId: ruleGroupId,
            })
        } catch (error) {
            HandleApiError(error)
        }

        handleList(id, pagination.index, pagination.size)
    }

    // 批量删除
    const handleBatchDelete = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要删除的规则")
            return
        }

        const deletePromises = selectedRowKeys.map((key) => {
            const record = list.find((item) => item.ruleId === key)
            if (record) {
                return deleteRule({
                    ruleId: record.ruleId,
                    ruleGroupId: record.ruleGroupId,
                })
            }
            return Promise.resolve()
        })

        await Promise.all(deletePromises)
        setSelectedRowKeys([])
        handleList(id, pagination.index, pagination.size)
    }

    // 批量导出
    const handleBatchExport = () => {
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要导出的规则")
            return
        }

        // 找出所有选中的规则
        const selectedRules = list.filter((item) => selectedRowKeys.includes(item.ruleId))

        // 导出为JSON文件
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

    // 批量改变状态
    const handleBatchChangeStatus = async (status) => {
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要启用的规则")
            return
        }

        const enablePromises = selectedRowKeys.map((key) => {
            const record = list.find((item) => item.ruleId === key)
            if (record) {
                return RuleChangeStatus({
                    tenantId: record.tenantId,
                    ruleGroupId: record.ruleGroupId,
                    ruleId: record.ruleId,
                    faultCenterId: record.faultCenterId,
                    enabled: status,
                });
            }
            return Promise.resolve()
        })

        await Promise.all(enablePromises)
        setSelectedRowKeys([])
        handleList(id, pagination.index, pagination.size)
    }

    // 获取故障中心列表
    const fetchFaultCenterList = async () => {
        try {
            const res = await FaultCenterList()
            const newData = res.data?.map((item) => ({
                label: item.name,
                value: item.id,
            }))

            setFaultCenterList(newData)
        } catch (error) {
            console.error(error)
        }
    }

    // 处理导入按钮点击
    const handleImportClick = () => {
        setImportDrawerVisible(true)
        fetchFaultCenterList()
        // 重置内容
        setJsonContent("")
        setYamlContent("")
    }


    const handleJsonContentChange = (value) => {
        setJsonContent(value)
    }

    const handleYamlContentChange = (value) => {
        setYamlContent(value)
    }

    // 确认导入
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
                datasourceType: selectedDatasourceType || undefined,
                datasourceIdList: [selectedDatasource] || undefined,
                faultCenterId: selectedFaultCenter || undefined,
                importType: importType,
                rules: (importType===0 && yamlContent || jsonContent),
            }
            await RuleImport(params)
            setImportDrawerVisible(false)
            handleList(id, pagination.index, pagination.size)
            message.success("导入成功!")
        } catch (error) {
            HandleApiError(error)
        }
    }

    // 批量操作菜单
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
                key: "batchEnable",
                label: "批量启用",
                icon: <CheckSquareOutlined />,
                onClick: () => {
                    if (selectedRowKeys.length > 0) {
                        Modal.confirm({
                            title: "确认启用",
                            content: `确定要启用选中的 ${selectedRowKeys.length} 条规则吗？`,
                            onOk: () => handleBatchChangeStatus(true),
                        })
                    } else {
                        message.warning("请先选择要启用的规则")
                    }
                },
            },
            {
                key: "batchDisable",
                label: "批量禁用",
                icon: <CloseSquareOutlined />,
                onClick: () => {
                    if (selectedRowKeys.length > 0) {
                        Modal.confirm({
                            title: "确认禁用",
                            content: `确定要禁用选中的 ${selectedRowKeys.length} 条规则吗？`,
                            onOk: () => handleBatchChangeStatus(false),
                        })
                    } else {
                        message.warning("请先选择要禁用的规则")
                    }
                },
            }
        ],
    }

    return (
        <div style={{ display: 'flex' }}>
            {/* 左侧规则组列表 */}
            <div style={{ width: '180px', flexShrink: 0 }}>
                <RuleGroupSidebar
                    selectedRuleGroupId={selectedRuleGroupId}
                    onRuleGroupChange={handleRuleGroupChange}
                />
            </div>

            {/* 右侧内容区域 */}
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
                <div style={{ display: "flex", gap: "10px" }}>
                    <Radio.Group
                        options={[
                            {
                                label: "全部",
                                value: "all",
                            },
                            {
                                label: "开启",
                                value: "enabled",
                            },
                            {
                                label: "禁用",
                                value: "disabled",
                            },
                        ]}
                        defaultValue={selectRuleStatus}
                        onChange={changeStatus}
                        optionType="button"
                    />

                    <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {/* 批量操作按钮 */}
                    <Dropdown menu={batchOperationMenu} disabled={selectedRowKeys.length === 0}>
                        <Button>
                            批量操作 <DownOutlined />
                        </Button>
                    </Dropdown>

                    {/* 导入按钮 */}
                    <Button
                        type="primary"
                        size="default"
                        icon={<ImportOutlined />}
                        onClick={handleImportClick}
                        style={{
                            backgroundColor: "#000000",
                        }}
                    >
                        导入
                    </Button>

                    <Link to={`/ruleGroup/${id}/rule/add`}>
                        <Button
                            type="primary"
                            size="default"
                            style={{
                                backgroundColor: "#000000",
                            }}
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
                    setPagination({ ...pagination, index: page, size: pageSize });
                    handleList(id, page, pageSize);
                }}
                onPageSizeChange={(current, pageSize) => {
                    setPagination({ ...pagination, index: current, size: pageSize });
                    handleList(id, current, pageSize);
                }}
                scrollY={'calc(100vh - 300px)'}  // 动态计算表格高度
                rowKey={record => record.id}
                showTotal={HandleShowTotal}
            />

            {/* 导入抽屉 */}
            <Drawer
                title="导入规则"
                placement="right"
                width={500}
                onClose={() => setImportDrawerVisible(false)}
                open={importDrawerVisible}
                footer={
                    <div style={{ justifyContent: "space-between" }}>
                        <Button
                            style={{
                                backgroundColor: "#000000",
                            }}
                            type="primary"
                            onClick={() => {
                                handleConfirmImport()
                            }}
                        >
                            确认导入
                        </Button>
                    </div>
                }
            >
                <div style={{ marginBottom: 20 }}>
                    <Radio.Group
                        value={importType}
                        onChange={(e) => {
                            setImportType(e.target.value)
                        }}
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
                    <div>
                        <VSCodeEditor
                            height="75vh"
                            language="Json"
                            value={jsonContent}
                            onChange={handleJsonContentChange}
                        />
                    </div>
                )}

                {importType === 0 && (
                    <div>
                        <div style={{marginBottom: 16}}>
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
                        <div style={{marginBottom: 16}}>
                            <div style={{marginBottom: 8}}>选择数据源类型：</div>
                            <Select
                                placeholder="请选择数据源类型"
                                style={{width: "100%"}}
                                onChange={(value) => setSelectedDatasourceType(value)}
                                options={[
                                    {
                                        label: "Prometheus",
                                        value: "Prometheus",
                                    },
                                    {
                                        label: "VictoriaMetrics",
                                        value: "VictoriaMetrics",
                                    }
                                ]}
                            />
                        </div>

                        <div style={{marginBottom: 16}}>
                            <div style={{marginBottom: 8}}>选择数据源：</div>
                            <Select
                                placeholder="请选择数据源"
                                style={{width: "100%"}}
                                onChange={(value) => setSelectedDatasource(value)}
                                options={datasourceList
                                    .filter((ds) => ds.type === selectedDatasourceType)
                                    .map((ds) => ({
                                        label: ds.name,
                                        value: ds.id,
                                    }))}
                            />
                        </div>

                        <div style={{marginBottom: 16}}>
                            <div style={{marginBottom: 8}}>选择故障中心：</div>
                            <Select
                                placeholder="请选择故障中心"
                                style={{width: "100%"}}
                                onChange={(value) => setSelectedFaultCenter(value)}
                                options={faultCenterList}
                            />
                        </div>
                    </div>
                )}
            </Drawer>
                </div>
            </div>
        </div>
    )
}

