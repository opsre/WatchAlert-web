"use client"

import React, { useEffect, useState } from "react"
import {Button, Input, Table, Radio, Tag, Dropdown, message, Modal, Drawer, Select, Tooltip, Space} from "antd"
import { Link } from "react-router-dom"
import { useParams } from "react-router-dom"
import {createRule, deleteRule, getRuleList} from "../../../api/rule"
import { ReactComponent as PrometheusImg } from "./img/Prometheus.svg"
import { ReactComponent as AlicloudImg } from "./img/alicloud.svg"
import { ReactComponent as JaegerImg } from "./img/jaeger.svg"
import { ReactComponent as AwsImg } from "./img/AWSlogo.svg"
import { ReactComponent as LokiImg } from "./img/L.svg"
import { ReactComponent as VMImg } from "./img/victoriametrics.svg"
import { ReactComponent as K8sImg } from "./img/Kubernetes.svg"
import { ReactComponent as ESImg } from "./img/ElasticSearch.svg"
import { ReactComponent as VLogImg } from "./img/victorialogs.svg"
import { getDatasourceList } from "../../../api/datasource"
import {
    DeleteOutlined,
    ExportOutlined,
    DownOutlined,
    ImportOutlined,
    EditOutlined,
    CopyOutlined
} from "@ant-design/icons"
import {FaultCenterList} from "../../../api/faultCenter";
import Editor from '@monaco-editor/react';

export const AlertRuleList = () => {
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
    // 导入相关状态
    const [importDrawerVisible, setImportDrawerVisible] = useState(false)
    const [importType, setImportType] = useState("watchalert") // 'watchalert' 或 'prometheus'
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [importedRules, setImportedRules] = useState([])
    const [selectedDatasource, setSelectedDatasource] = useState(null)
    const [selectedDatasourceType, setSelectedDatasourceType] = useState('Prometheus')
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
    const [faultCenterList, setFaultCenterList] = useState([])
    const [yamlContent, setYamlContent] = useState("")
    const [convertedRules, setConvertedRules] = useState([])
    const [isConverting, setIsConverting] = useState(false)
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
            title: "状态",
            dataIndex: "enabled",
            key: "enabled",
            width: "auto",
            render: (enabled) => (
                <div className="status-container">
                    <div className={`status-dot ${enabled ? "status-enabled" : "status-disabled"}`} />
                    <span>{enabled ? "启用" : "禁用"}</span>
                </div>
            ),
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
        handleList(id, pagination.index, pagination.size)
        handleListDatasource()
    }, [])

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

    const handlePageChange = (page) => {
        setPagination({ ...pagination, index: page.current, size: page.size })
        handleList(id, page.current, page.size)
    }

    const handleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

    const handleClone = (record) => {
        // 实现克隆功能
        console.log("Clone rule:", record)

        // 将规则数据存储到 localStorage，以便在创建页面中获取
        const cloneData = {
            ...record,
            ruleName: `${record.ruleName} - Copy`,
            ruleId: "",
        }
        localStorage.setItem(`RuleDataCopy`, JSON.stringify(cloneData))

        // 跳转到创建页面
        window.location.href = `/ruleGroup/${id}/rule/add?isClone=1`
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
        setConvertedRules([])
    }

    // 修改 convertPrometheusToWatchAlert 函数，实现 Prometheus YAML 到 WatchAlert JSON 的转换
    const convertPrometheusToWatchAlert = async () => {
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

        setIsConverting(true)

        try {
            const parsedRules = parsePrometheusYaml(yamlContent)

            // 将Prometheus规则转换为WatchAlert格式
            const converted = parsedRules.map((rule, index) => ({
                ruleGroupId: id,
                datasourceType: selectedDatasourceType,
                datasourceId: Array.isArray(selectedDatasource) ? selectedDatasource : [selectedDatasource],
                ruleName: rule.alert || `未命名规则-${index}`,
                evalInterval: 10,
                evalTimeType: "second",
                description: "",
                effectiveTime: {
                    week: null,
                    startTime: 0,
                    endTime: 86340,
                },
                prometheusConfig: {
                    promQL: rule.expr || "",
                    annotations: rule.annotations?.description || rule.annotations?.summary || "",
                    forDuration: parseForDuration(rule.for),
                    rules: [
                        {
                            severity: "P0", // 默认严重级别
                            expr: "> 0", // 默认表达式
                        },
                    ],
                },
                faultCenterId: selectedFaultCenter,
                enabled: false,
            }))

            setConvertedRules(converted)
            setImportedRules(converted)
            setIsConverting(false)
            message.success("转换成功")
        } catch (error) {
            setIsConverting(false)
            message.error("转换失败: " + (error.message || "未知错误"))
            console.error("转换错误:", error)
        }
    }

    // 添加解析Prometheus YAML的函数
    const parsePrometheusYaml = (yamlContent) => {
        try {
            // 这是一个简化的解析实现，实际项目中应使用专业的YAML解析库
            // 这里我们尝试从文本中提取关键信息

            const rules = []
            const lines = yamlContent.split("\n")

            let currentRule = null
            let inAnnotations = false

            for (let line of lines) {
                line = line.trim()

                // 新规则开始
                if (line.startsWith("- alert:")) {
                    if (currentRule) {
                        rules.push(currentRule)
                    }
                    currentRule = {
                        alert: line.substring("- alert:".length).trim(),
                        annotations: {},
                    }
                    inAnnotations = false
                }
                // 表达式
                else if (line.startsWith("expr:") && currentRule) {
                    currentRule.expr = line.substring("expr:".length).trim()
                }
                // for 持续时间
                else if (line.startsWith("for:") && currentRule) {
                    currentRule.for = line.substring("for:".length).trim()
                }
                // 注解开始
                else if (line.startsWith("annotations:") && currentRule) {
                    inAnnotations = true
                }
                // 注解内容
                else if (inAnnotations && currentRule) {
                    if (line.startsWith("summary:")) {
                        currentRule.annotations.summary = line.substring("summary:".length).trim()
                    } else if (line.startsWith("description:")) {
                        currentRule.annotations.description = line.substring("description:".length).trim()
                    }
                }
            }

            // 添加最后一个规则
            if (currentRule) {
                rules.push(currentRule)
            }

            return rules
        } catch (error) {
            console.error("YAML解析错误:", error)
            throw new Error("YAML格式错误，无法解析")
        }
    }

    // 添加解析for持续时间的函数
    const parseForDuration = (forString) => {
        if (!forString) return 0

        try {
            // 解析形如 "5m", "1h", "30s" 的持续时间
            const value = Number.parseInt(forString)
            if (isNaN(value)) return 0

            if (forString.includes("s")) {
                return value // 秒
            } else if (forString.includes("m")) {
                return value * 60 // 分钟转秒
            } else if (forString.includes("h")) {
                return value * 3600 // 小时转秒
            } else {
                return value // 默认按秒处理
            }
        } catch (error) {
            console.error("持续时间解析错误:", error)
            return 0
        }
    }

    const handleJsonContentChange = (value) => {
        setJsonContent(value)
    }

    const handleYamlContentChange = (value) => {
        setYamlContent(value)
    }

    // 处理JSON内容解析
    const parseJsonContent = () => {
        if (!jsonContent.trim()) {
            message.error("请输入JSON内容")
            return
        }

        try {
            const rules = JSON.parse(jsonContent)
            if (!Array.isArray(rules)) {
                message.error("输入的JSON格式不正确，应为规则数组")
                return
            }

            // 确保所有规则都有正确的ruleGroupId
            const rulesWithGroupId = rules.map((rule) => ({
                ...rule,
                ruleGroupId: id, // 使用当前的组ID
            }))

            setImportedRules(rulesWithGroupId)
            setImportModalVisible(true)
        } catch (error) {
            message.error("解析失败：JSON格式错误")
            console.error("JSON解析错误:", error)
        }
    }

    // 确认导入
    const handleConfirmImport = async () => {
        try {
            console.log("导入结果:", importedRules)

            const importPromises = importedRules.map((rule) => {
                // 检查是否已存在相同名称的模板
                const exists = list.some(
                    (item) => item.ruleName === rule.ruleName && item.ruleId === rule.ruleId,
                )

                if (exists) {
                    message.warning(`规则 ${rule.ruleName} 已存在,跳过导入`)
                } else {
                    // 如果不存在，则创建新的
                    return createRule(rule)
                }
            })

            await Promise.all(importPromises)
            message.success(`成功导入 ${importedRules.length} 条规则`)
            setImportModalVisible(false)
            setImportDrawerVisible(false)
            handleList(id, pagination.index, pagination.size) // 刷新规则列表
        } catch (error) {
            message.error("导入失败")
            console.error("导入错误:", error)
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
        ],
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
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
                    <Button icon={<ImportOutlined />} onClick={handleImportClick}>
                        导入
                    </Button>

                    <Link to={`/ruleGroup/${id}/rule/add`}>
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: "#000000",
                            }}
                        >
                            创 建
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 导入确认模态框 */}
            <Modal
                title="确认导入"
                open={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onOk={handleConfirmImport}
                okText="确认导入"
                cancelText="取消"
            >
                <p>即将导入 {importedRules.length} 条规则：</p>
                <ul style={{ maxHeight: "300px", overflow: "auto" }}>
                    {importedRules.map((rule, index) => (
                        <li key={index}>
                            {rule.ruleName} ({rule.datasourceType})
                        </li>
                    ))}
                </ul>
                <p>已存在的规则将跳过，不存在的将被创建。确认继续？</p>
            </Modal>

            <div style={{ marginTop: 10 }}>
                <Table
                    rowSelection={rowSelection}
                    columns={columns}
                    dataSource={list}
                    pagination={{
                        index: pagination.index ?? 1,
                        size: pagination.size ?? 10,
                        total: pagination?.total ?? 0,
                        showTotal: handleShowTotal,
                    }}
                    onChange={handlePageChange}
                    scroll={{
                        y: height - 350, // 动态设置滚动高度
                        x: "max-content", // 水平滚动
                    }}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                    rowKey={(record) => record.ruleId} // 设置行唯一键
                    rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                />
            </div>
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
                                if (importType === "watchalert") {
                                    parseJsonContent()
                                } else if (importType === "prometheus" && convertedRules.length > 0) {
                                    setImportModalVisible(true)
                                } else if (importType === "prometheus") {
                                    convertPrometheusToWatchAlert()
                                }
                            }}
                            loading={isConverting}
                        >
                            {importType === "watchalert" ? "解析JSON" : convertedRules.length > 0 ? "确认导入" : "转换并导入"}
                        </Button>
                    </div>
                }
            >
                <div style={{ marginBottom: 20 }}>
                    <Radio.Group
                        value={importType}
                        onChange={(e) => {
                            setImportType(e.target.value)
                            setConvertedRules([])
                        }}
                        style={{ marginBottom: 16, display: "flex", width: "100%" }}
                        buttonStyle="solid"
                    >
                        <Radio.Button value="watchalert" style={{ flex: 1, textAlign: "center" }}>
                            WatchAlert JSON
                        </Radio.Button>
                        <Radio.Button value="prometheus" style={{ flex: 1, textAlign: "center" }}>
                            Prometheus Rule YAML
                        </Radio.Button>
                    </Radio.Group>
                </div>

                {importType === "watchalert" && (
                    <div>
                        <Editor
                            height="90vh"
                            defaultLanguage="json"
                            value={jsonContent}
                            onChange={handleJsonContentChange}
                        />
                    </div>
                )}

                {importType === "prometheus" && (
                    <div>
                        <div style={{marginBottom: 16}}>
                            <Editor
                                height="55vh"
                                defaultLanguage="yaml"
                                value={jsonContent}
                                defaultValue={`groups:
- name: NodeStatus
  rules:
  - alert: Exporter Componen is Down
    expr: up == 0
    for: 2m
    labels:
      severity: serious
    annotations:
      summary: 节点 Exporter Componen is Down
      description: 节点 Exporter Componen is Down
                                `}
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
        </>
    )
}

