"use client"

import React, { useState, useEffect, useContext, useMemo, useCallback } from "react"
import {
    Form,
    Input,
    Button,
    Divider,
    Select,
    InputNumber,
    Typography,
    Space,
    message,
    Checkbox,
    Collapse,
    Card
} from "antd"
import { MinusCircleOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons"
import { useParams, useNavigate } from "react-router-dom"
import { getDatasourceList } from "../../api/datasource"
import { ProbingCreate, ProbingSearch, ProbingUpdate } from "../../api/probing"
import { HandleApiError } from "../../utils/lib"
import VSCodeEditor from "../../utils/VSCodeEditor"
import { useAppContext } from "../../context/RuleContext"

// Constants
const VALIDATION_PATTERNS = {
    url: /^https?:\/\/.+/,
    domainIp: /^([a-zA-Z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/,
    tcp: /^([a-zA-Z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/,
    domain: /^[a-zA-Z0-9.-]+$/
}

const PROTOCOL_OPTIONS = [
    { value: "HTTP", label: "HTTP" },
    { value: "ICMP", label: "ICMP" },
    { value: "TCP", label: "TCP" },
    { value: "SSL", label: "SSL" }
]

const METHOD_OPTIONS = [
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "DELETE", label: "DELETE" }
]

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = useContext(MyFormItemContext)
    const concatPath = useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

export const CreateProbingRule = ({ type }) => {
    const { appState } = useAppContext()
    const navigate = useNavigate()
    const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
    const [form] = Form.useForm()
    const { id } = useParams()
    const [selectedRow, setSelectedRow] = useState(null)
    const [enabled, setEnabled] = useState(true)
    const [datasourceOptions, setDatasourceOptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [datasourceLoading, setDatasourceLoading] = useState(false)
    const [protocolType, setProtocolType] = useState('HTTP')
    const [methodType, setMethodType] = useState("GET")
    const [submitLoading, setSubmitLoading] = useState(false)

    // 禁用所有 InputNumber 的滚轮事件
    useEffect(() => {
        const handleWheel = (e) => {
            // 检查是否在 InputNumber 输入框内
            const target = e.target;
            if (target.classList.contains('ant-input-number-input') || 
                target.closest('.ant-input-number')) {
                e.preventDefault();
                e.stopPropagation();
                // 让输入框失焦
                if (document.activeElement && 
                    (document.activeElement.classList.contains('ant-input-number-input') ||
                     document.activeElement.closest('.ant-input-number'))) {
                    document.activeElement.blur();
                }
            }
        };
        
        // 使用捕获阶段监听，优先级更高
        document.addEventListener('wheel', handleWheel, { passive: false, capture: true });
        
        return () => {
            document.removeEventListener('wheel', handleWheel, { capture: true });
        };
    }, []);

    // Utility functions
    const isValidJson = useCallback((str) => {
        try {
            JSON.parse(str)
            return true
        } catch (e) {
            return false
        }
    }, [])

    const validateJson = useCallback((_, value) => {
        if (value && !isValidJson(value)) {
            return Promise.reject("请输入有效的 JSON 格式")
        }
        return Promise.resolve()
    }, [isValidJson])

    const validateEndpoint = useCallback((_, value) => {
        switch (protocolType) {
            case "HTTP":
                return VALIDATION_PATTERNS.url.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的完整URL, 例如: http(s)://github.com")
            case "ICMP":
                return VALIDATION_PATTERNS.domainIp.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的域名或IP地址, 例如: github.com / 1.1.1.1")
            case "TCP":
                return VALIDATION_PATTERNS.tcp.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的 IP/域名:端口, 例如: 1.1.1.1:80")
            case "SSL":
                return VALIDATION_PATTERNS.domain.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的域名, 例如: github.com")
            default:
                return Promise.resolve()
        }
    }, [protocolType])

    const initBasicInfo = useCallback((selectedRow) => {
        if (selectedRow) {
            setProtocolType(selectedRow.ruleType)
            setEnabled(selectedRow.enabled)
            setMethodType(selectedRow.probingEndpointConfig.http?.method || "GET")

            // Transform header object into an array of {key, value} for Form.List
            const initialHeader = selectedRow.probingEndpointConfig.http?.header
                ? Object.entries(selectedRow.probingEndpointConfig.http.header).map(([key, value]) => ({
                    key,
                    value,
                }))
                : []

            form.setFieldsValue({
                ruleName: selectedRow.ruleName,
                ruleType: selectedRow.ruleType,
                probingEndpointConfig: {
                    endpoint: selectedRow?.probingEndpointConfig?.endpoint,
                    icmp: {
                        interval: selectedRow?.probingEndpointConfig?.icmp?.interval,
                        count: selectedRow?.probingEndpointConfig?.icmp?.count,
                    },
                    http: {
                        method: selectedRow?.probingEndpointConfig?.http?.method,
                        header: initialHeader, // Corrected: Use 'header' here to match the backend structure and `Form.List` name
                        body: selectedRow?.probingEndpointConfig?.http?.body,
                    },
                    strategy: {
                        timeout: selectedRow?.probingEndpointConfig?.strategy?.timeout,
                        evalInterval: selectedRow?.probingEndpointConfig?.strategy?.evalInterval,
                        failure: selectedRow?.probingEndpointConfig?.strategy?.failure,
                        operator: selectedRow?.probingEndpointConfig?.strategy?.operator,
                        field: selectedRow?.probingEndpointConfig?.strategy?.field,
                        expectedValue: selectedRow?.probingEndpointConfig?.strategy?.expectedValue,
                    },
                },
                datasourceId: selectedRow.datasourceId,
                enabled: selectedRow.enabled,
            })
        }
    }, [form])

    // Define handleGetDatasourceData before useEffect
    const handleGetDatasourceData = useCallback(async () => {
        try {
            setDatasourceLoading(true)
            const res = await getDatasourceList()
            // Filter for Prometheus and VictoriaMetrics data sources
            const filteredData = res.data.filter(item => 
                (item.type === "Prometheus" || item.type === "VictoriaMetrics") && item.write.enabled === "On"
            )
            const newData = filteredData.map((item) => ({
                label: `${item.name} (${item.type})`,
                value: item.id,
                type: item.type,
            }))
            setDatasourceOptions(newData)
        } catch (error) {
            HandleApiError(error)
        } finally {
            setDatasourceLoading(false)
        }
    }, [])

    useEffect(() => {
        // Set initial default values for new rule creation
        if (type === "add") {
            form.setFieldsValue({
                ruleType: "HTTP",
                probingEndpointConfig: {
                    strategy: {
                        evalInterval: 10,
                        timeout: 10,
                        failure: 3,
                    },
                },
            })

            if (searchParams.get("isClone") === "1"){
                const copyData = appState?.cloneProbeRule
                initBasicInfo(copyData)
            }
        }

        const handleSearchRuleInfo = async () => {
            try {
                const params = {
                    ruleId: id,
                }
                const res = await ProbingSearch(params)
                setSelectedRow(res?.data)
            } catch (error) {
                HandleApiError(error)
            } finally {
                setLoading(false)
            }
        }

        if (type === "edit") {
            handleSearchRuleInfo()
        } else {
            setLoading(false)
        }
    }, [id, type, form, initBasicInfo, searchParams, appState?.cloneProbeRule]) // Added form to dependencies

    // Separate useEffect for datasource data - only runs once
    useEffect(() => {
        handleGetDatasourceData()
    }, [handleGetDatasourceData])

    useEffect(() => {
        initBasicInfo(selectedRow)
    }, [selectedRow, initBasicInfo])

    const handleCreate = async (params) => {
        try {
            await ProbingCreate(params)
        } catch (error) {
            console.error(error)
            message.error("创建失败：" + error.message) // Added error message
            throw error // Re-throw to be caught by handleFormSubmit
        }
    }

    const handleUpdate = async (params) => {
        try {
            const newParams = {
                ...params,
                ruleId: selectedRow.ruleId,
            }
            await ProbingUpdate(newParams)
        } catch (error) {
            console.error(error)
            message.error("更新失败：" + error.message) // Added error message
            throw error // Re-throw to be caught by handleFormSubmit
        }
    }

    const handleFormSubmit = async (values) => {
        setSubmitLoading(true)
        try {
            const finalParams = {
                ...values,
                enabled: enabled,
                probingEndpointConfig: {
                    ...values.probingEndpointConfig,
                    http: {
                        ...values.probingEndpointConfig.http,
                        method: methodType,
                    },
                },
            }
            // Corrected: Check for 'header' (plural) as this is what the Form.List outputs
            if (protocolType === "HTTP" && finalParams.probingEndpointConfig.http.header) {
                const headerObject = {}
                finalParams.probingEndpointConfig.http.header.forEach((headerItem) => {
                    if (
                        headerItem &&
                        typeof headerItem.key === "string" &&
                        headerItem.key.trim() !== "" &&
                        Object.prototype.hasOwnProperty.call(headerItem, "value")
                    ) {
                        headerObject[headerItem.key.trim()] = headerItem.value || ""
                    }
                })
                // Corrected: Assign back to 'header' (plural)
                finalParams.probingEndpointConfig.http.header = headerObject
            }

            if (protocolType === "TCP") {
                finalParams.probingEndpointConfig.strategy.field = "Telnet"
            }

            if (type === "add") {
                await handleCreate(finalParams)
            } else if (type === "edit") {
                await handleUpdate(finalParams)
            }
            
            navigate(`/probing`)
        } catch (error) {
            HandleApiError(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    if (loading && type === "edit") {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <Typography.Text>加载中...</Typography.Text>
            </div>
        )
    }

    return (
        <div>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                <Divider orientation="left">基础配置</Divider>
                <div style={{ display: "flex", gap: "24px", alignItems: "start" }}>
                    <div style={{ flex: 1 }}>
                        <MyFormItem name="ruleName" label="任务名称" rules={[{required: true}]}>
                            <Input placeholder="请输入任务名称" />
                        </MyFormItem>
                    </div>
                    <div style={{ flex: 1 }}>
                        <MyFormItem name="ruleType" label="拨测协议" rules={[{required: true}]}>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                {PROTOCOL_OPTIONS.map((protocol) => (
                                    <Card
                                        key={protocol.value}
                                        size="small"
                                        hoverable
                                        onClick={() => {
                                            if (type !== "edit") {
                                                setProtocolType(protocol.value)
                                                form.setFieldValue("ruleType", protocol.value)
                                            }
                                        }}
                                        style={{
                                            cursor: type === "edit" ? "not-allowed" : "pointer",
                                            border: protocolType === protocol.value ? "2px solid #1890ff" : "1px solid #d9d9d9",
                                            backgroundColor: protocolType === protocol.value ? "#f0f8ff" : "#fff",
                                            opacity: type === "edit" ? 0.6 : 1,
                                            minWidth: "50px",
                                            height: "32px",
                                            textAlign: "center",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center"
                                        }}
                                        bodyStyle={{ padding: "4px 8px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                    >
                                        <Typography.Text 
                                            style={{ 
                                                fontWeight: protocolType === protocol.value ? "600" : "400",
                                                color: protocolType === protocol.value ? "#1890ff" : "#666",
                                                fontSize: "14px",
                                                lineHeight: "1"
                                            }}
                                        >
                                            {protocol.label}
                                        </Typography.Text>
                                    </Card>
                                ))}
                            </div>
                        </MyFormItem>
                    </div>
                </div>

                <Divider orientation="left">端点配置</Divider>
                <MyFormItemGroup prefix={["probingEndpointConfig"]}>
                    <MyFormItem
                        name="endpoint"
                        label="端点"
                        rules={[
                            { required: true, message: "请输入端点" },
                            { validator: validateEndpoint }
                        ]}
                        normalize={(value) => value?.replace(/\s/g, "")}
                    >
                        {protocolType === "HTTP" ? (
                            <Input
                                addonBefore={
                                    <Select
                                        value={methodType}
                                        onChange={setMethodType}
                                        options={METHOD_OPTIONS}
                                        style={{ width: 80 }}
                                    />
                                }
                            />
                        ) : (
                            <Input />
                        )}
                    </MyFormItem>

                    {/* ICMP Settings */}
                    {protocolType === "ICMP" && (
                        <MyFormItemGroup prefix={["icmp"]}>
                            <MyFormItem name="interval" label="请求间隔(s)" rules={[{required: true}]}>
                                <InputNumber 
                                    min={1} 
                                    placeholder="1" 
                                    style={{width: "100%"}} 
                                    onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                                />
                            </MyFormItem>
                            <MyFormItem name="count" label="请求总数(个)" rules={[{required: true}]}>
                                <InputNumber 
                                    min={1} 
                                    placeholder="1" 
                                    style={{width: "100%"}} 
                                    onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                                />
                            </MyFormItem>
                        </MyFormItemGroup>
                    )}

                    {/* HTTP Advanced Settings */}
                    {protocolType === "HTTP" && (
                        <Collapse
                            style={{ marginTop: 16 }}
                            items={[
                                {
                                    key: 'advanced',
                                    label: (
                                        <Typography.Text style={{ fontSize: "14px", fontWeight: "500" }}>
                                            高级选项
                                        </Typography.Text>
                                    ),
                                    children: (
                                        <>
                                            <Typography.Text style={{marginBottom: 10, display: "block", fontWeight: "500"}}>
                                                请求头
                                            </Typography.Text>
                                            <div
                                                style={{
                                                    border: "1px solid #f0f0f0",
                                                    borderRadius: "6px",
                                                    padding: "16px",
                                                    marginBottom: "24px",
                                                    backgroundColor: "#fafafa"
                                                }}
                                            >
                                                <Form.List name={["probingEndpointConfig", "http", "header"]}>
                                                    {(fields, {add, remove}) => (
                                                        <>
                                                            {fields.map(({key, name, ...restField}) => (
                                                                <Space key={key} style={{display: "flex", marginBottom: 8}} align="baseline">
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, "key"]}
                                                                        rules={[{required: true, message: "缺少键"}]}
                                                                        style={{flex: 1, width: "300px"}}
                                                                    >
                                                                        <Input placeholder="键 (例如: Content-Type)"/>
                                                                    </Form.Item>
                                                                    <Form.Item
                                                                        {...restField}
                                                                        name={[name, "value"]}
                                                                        rules={[{required: true, message: "缺少值"}]}
                                                                        style={{flex: 1, width: "300px"}}
                                                                    >
                                                                        <Input placeholder="值 (例如: application/json)"/>
                                                                    </Form.Item>
                                                                    <MinusCircleOutlined onClick={() => remove(name)}/>
                                                                </Space>
                                                            ))}
                                                            <Form.Item>
                                                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined/>}>
                                                                    添加请求头
                                                                </Button>
                                                            </Form.Item>
                                                        </>
                                                    )}
                                                </Form.List>
                                            </div>

                                            {methodType === "POST" && (
                                                <>
                                                    <Typography.Text style={{marginBottom: 10, display: "block", fontWeight: "500"}}>
                                                        请求体
                                                    </Typography.Text>
                                                    <MyFormItem name={["http", "body"]} rules={[{validator: validateJson}]}>
                                                        <VSCodeEditor height={"300px"}/>
                                                    </MyFormItem>
                                                </>
                                            )}
                                        </>
                                    )
                                }
                            ]}
                        />
                    )}
                </MyFormItemGroup>

                <Divider orientation="left">策略配置</Divider>
                <MyFormItemGroup prefix={["probingEndpointConfig", "strategy"]}>
                    <MyFormItem name="evalInterval" label="执行频率(s)" rules={[{required: true}]}>
                        <InputNumber 
                            min={1} 
                            style={{width: "100%"}} 
                            onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                        />
                    </MyFormItem>
                    <MyFormItem name="timeout" label="超时时间(s)" rules={[{required: true}]}>
                        <InputNumber 
                            min={1} 
                            style={{width: "100%"}} 
                            onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                        />
                    </MyFormItem>
                </MyFormItemGroup>

                <Divider orientation="left">写入配置</Divider>
                <div style={{ display: "flex", gap: "8px", alignItems: "end" }}>
                    <div style={{ flex: 1 }}>
                        <MyFormItem
                            name="datasourceId"
                            label="数据源"
                            tooltip="选择用于存储拨测数据的数据源"
                            rules={[{required: true, message: "请选择数据源"}]}
                        >
                            <Select 
                                allowClear 
                                placeholder="选择数据源 (支持 Prometheus 和 VictoriaMetrics)" 
                                options={datasourceOptions}
                                showSearch
                                optionFilterProp="label"
                                loading={datasourceLoading}
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                            />
                        </MyFormItem>
                    </div>
                    <Button
                        type="default"
                        icon={<ReloadOutlined />}
                        loading={datasourceLoading}
                        onClick={handleGetDatasourceData}
                        title="刷新数据源列表"
                        style={{ marginBottom: "24px" }}
                    />
                </div>

                <MyFormItem name="enabled" valuePropName="checked">
                    <Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>
                        启用规则
                    </Checkbox>
                </MyFormItem>

                <div style={{ textAlign: "right", marginTop: 24 }}>
                    <Space>
                        <Button onClick={() => navigate(-1)}>
                            取消
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitLoading}
                            style={{ backgroundColor: "#000000" }}
                        >
                            {type === "edit" ? "更新" : "创建"}
                        </Button>
                    </Space>
                </div>
            </Form>
        </div>
    )
}