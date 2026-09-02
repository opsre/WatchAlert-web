import React, { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { Button, Checkbox, Collapse, Form, Input, InputNumber, Select, Space, Typography, message } from "antd"
import { MinusCircleOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons"
import { useNavigate, useParams } from "react-router-dom"
import { getDatasourceList } from "../../api/datasource"
import { ProbingCreate, ProbingSearch, ProbingUpdate } from "../../api/probing"
import { HandleApiError } from "../../utils/lib"
import VSCodeEditor from "../../utils/VSCodeEditor"
import { useAppContext } from "../../context/RuleContext"
import { Breadcrumb } from "../../components/Breadcrumb"
import "./create.css"

const VALIDATION_PATTERNS = {
    url: /^https?:\/\/.+/,
    domainIp: /^([a-zA-Z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/,
    tcp: /^([a-zA-Z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+$/,
    domain: /^([a-zA-Z0-9.-]+)(?::(\d+))?$/
}

const PROTOCOL_OPTIONS = [
    { value: "HTTP", label: "HTTP" },
    { value: "ICMP", label: "ICMP" },
    { value: "TCP", label: "TCP" },
    { value: "SSL", label: "SSL" }
]

const METHOD_OPTIONS = [
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" }
]

const isValidPort = (port) => {
    if (!port) return true
    const portNumber = Number.parseInt(port, 10)
    return portNumber >= 1 && portNumber <= 65535
}

const MyFormItemContext = React.createContext([])
const toArr = (value) => Array.isArray(value) ? value : [value]

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

const SectionHeading = ({ index, title, description }) => (
    <div className="probing-section-heading">
        <div><span className="probing-section-index">{index}</span><h2>{title}</h2></div>
        <p>{description}</p>
    </div>
)

export const CreateProbingRule = ({ type }) => {
    const { appState } = useAppContext()
    const navigate = useNavigate()
    const { id } = useParams()
    const searchParams = useMemo(() => new URLSearchParams(window.location.search), [])
    const [form] = Form.useForm()
    const [selectedRow, setSelectedRow] = useState(null)
    const [enabled, setEnabled] = useState(true)
    const [datasourceOptions, setDatasourceOptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [datasourceLoading, setDatasourceLoading] = useState(false)
    const [protocolType, setProtocolType] = useState("HTTP")
    const [methodType, setMethodType] = useState("GET")
    const [submitLoading, setSubmitLoading] = useState(false)

    useEffect(() => {
        const preventInputNumberWheel = (event) => {
            const target = event.target
            if (!target.classList.contains("ant-input-number-input") && !target.closest(".ant-input-number")) return

            event.preventDefault()
            event.stopPropagation()
            if (document.activeElement?.classList.contains("ant-input-number-input") || document.activeElement?.closest(".ant-input-number")) {
                document.activeElement.blur()
            }
        }

        document.addEventListener("wheel", preventInputNumberWheel, { passive: false, capture: true })
        return () => document.removeEventListener("wheel", preventInputNumberWheel, { capture: true })
    }, [])

    const isValidJson = useCallback((value) => {
        try {
            JSON.parse(value)
            return true
        } catch {
            return false
        }
    }, [])

    const validateJson = useCallback((_, value) => {
        if (value && !isValidJson(value)) return Promise.reject(new Error("请输入有效的 JSON 格式"))
        return Promise.resolve()
    }, [isValidJson])

    const validateEndpoint = useCallback((_, value) => {
        const endpoints = value?.split(",").map((item) => item.trim()).filter(Boolean) || []

        for (const endpoint of endpoints) {
            if (protocolType === "HTTP" && !VALIDATION_PATTERNS.url.test(endpoint)) {
                return Promise.reject(new Error("请输入完整 URL，例如：https://api.example.com/health"))
            }
            if (protocolType === "ICMP" && !VALIDATION_PATTERNS.domainIp.test(endpoint)) {
                return Promise.reject(new Error("请输入域名或 IP，例如：github.com / 192.168.1.1"))
            }
            if (protocolType === "TCP" && !VALIDATION_PATTERNS.tcp.test(endpoint)) {
                return Promise.reject(new Error("请输入域名或 IP 加端口，例如：192.168.1.1:80"))
            }
            if (protocolType === "SSL") {
                const match = VALIDATION_PATTERNS.domain.exec(endpoint)
                if (!match || !isValidPort(match[2])) {
                    return Promise.reject(new Error("请输入域名或域名加端口，例如：example.com:443"))
                }
            }
        }
        return Promise.resolve()
    }, [protocolType])

    const initBasicInfo = useCallback((rule) => {
        if (!rule) return

        const labels = Object.entries(rule.labels || {}).map(([key, value]) => ({ key, value }))
        const headers = rule.probingEndpointConfig?.http?.header
            ? Object.entries(rule.probingEndpointConfig.http.header).map(([key, value]) => ({ key, value }))
            : []

        setProtocolType(rule.ruleType)
        setEnabled(rule.enabled ?? true)
        setMethodType(rule.probingEndpointConfig?.http?.method || "GET")
        form.setFieldsValue({
            ruleName: rule.ruleName,
            ruleType: rule.ruleType,
            labels,
            datasourceId: rule.datasourceId,
            enabled: rule.enabled,
            probingEndpointConfig: {
                endpoint: rule.probingEndpointConfig?.endpoint,
                icmp: {
                    interval: rule.probingEndpointConfig?.icmp?.interval,
                    count: rule.probingEndpointConfig?.icmp?.count
                },
                http: {
                    method: rule.probingEndpointConfig?.http?.method,
                    header: headers,
                    body: rule.probingEndpointConfig?.http?.body
                },
                strategy: {
                    timeout: rule.probingEndpointConfig?.strategy?.timeout,
                    evalInterval: rule.probingEndpointConfig?.strategy?.evalInterval,
                    failure: rule.probingEndpointConfig?.strategy?.failure,
                    operator: rule.probingEndpointConfig?.strategy?.operator,
                    field: rule.probingEndpointConfig?.strategy?.field,
                    expectedValue: rule.probingEndpointConfig?.strategy?.expectedValue
                }
            }
        })
    }, [form])

    const fetchDatasourceOptions = useCallback(async () => {
        try {
            setDatasourceLoading(true)
            const response = await getDatasourceList()
            const options = (response?.data || [])
                .filter((item) => item.type === "Prometheus" && item.write?.enabled === "On")
                .map((item) => ({ label: `${item.name} (${item.type})`, value: item.id }))
            setDatasourceOptions(options)
        } catch (error) {
            HandleApiError(error)
        } finally {
            setDatasourceLoading(false)
        }
    }, [])

    useEffect(() => {
        if (type === "add") {
            form.setFieldsValue({
                ruleType: "HTTP",
                probingEndpointConfig: { strategy: { evalInterval: 10, timeout: 10, failure: 3 } }
            })
            if (searchParams.get("isClone") === "1") initBasicInfo(appState?.cloneProbeRule)
            setLoading(false)
            return
        }

        const fetchRule = async () => {
            try {
                const response = await ProbingSearch({ ruleId: id })
                setSelectedRow(response?.data)
            } catch (error) {
                HandleApiError(error)
            } finally {
                setLoading(false)
            }
        }
        fetchRule()
    }, [appState?.cloneProbeRule, form, id, initBasicInfo, searchParams, type])

    useEffect(() => { fetchDatasourceOptions() }, [fetchDatasourceOptions])
    useEffect(() => { initBasicInfo(selectedRow) }, [initBasicInfo, selectedRow])

    const handleProtocolChange = (nextProtocol) => {
        if (type === "edit") return
        setProtocolType(nextProtocol)
        form.setFieldValue("ruleType", nextProtocol)
        form.validateFields([["probingEndpointConfig", "endpoint"]]).catch(() => {})
    }

    const handleSubmit = async (values) => {
        setSubmitLoading(true)
        try {
            const labels = values.labels?.reduce((result, { key, value }) => {
                if (key) result[key] = value
                return result
            }, {})
            const headers = values.probingEndpointConfig?.http?.header?.reduce((result, item) => {
                if (item?.key?.trim()) result[item.key.trim()] = item.value || ""
                return result
            }, {})

            const params = {
                ...values,
                labels,
                enabled,
                probingEndpointConfig: {
                    ...values.probingEndpointConfig,
                    http: {
                        ...values.probingEndpointConfig?.http,
                        method: methodType,
                        header: headers || {}
                    },
                    strategy: {
                        ...values.probingEndpointConfig?.strategy,
                        ...(protocolType === "TCP" ? { field: "Telnet" } : {})
                    }
                }
            }

            if (type === "edit") {
                await ProbingUpdate({ ...params, ruleId: selectedRow.ruleId })
            } else {
                await ProbingCreate(params)
            }
            navigate("/probing")
        } catch (error) {
            HandleApiError(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    if (loading && type === "edit") {
        return <div className="probing-create-loading"><Typography.Text>正在加载拨测任务...</Typography.Text></div>
    }

    const endpointPlaceholder = protocolType === "HTTP"
        ? "多个 URL 用英文逗号分隔，例如：https://api.example.com/health"
        : protocolType === "TCP"
            ? "多个地址用英文逗号分隔，例如：192.168.1.1:80"
            : protocolType === "ICMP"
                ? "多个地址用英文逗号分隔，例如：github.com,8.8.8.8"
                : "多个地址用英文逗号分隔，例如：example.com,example.com:443"

    return (
        <>
            <Breadcrumb items={["网络分析", "拨测任务", type === "edit" ? "编辑" : "创建"]} />
            <main className="probing-create-page">
                <nav className="probing-create-steps" aria-label="拨测任务配置步骤">
                    <div className="probing-create-step"><span>1</span><div><strong>任务信息</strong><small>名称、协议与标签</small></div></div>
                    <div className="probing-create-step"><span>2</span><div><strong>拨测配置</strong><small>目标端点与执行策略</small></div></div>
                    <div className="probing-create-step"><span>3</span><div><strong>发布任务</strong><small>写入数据源与启用状态</small></div></div>
                </nav>

                <div className="probing-create-workspace">
                    <Form form={form} className="probing-create-form" layout="vertical" onFinish={handleSubmit} preserve={false}>
                        <section className="probing-form-section">
                            <SectionHeading index="01" title="任务信息" />
                            <div className="probing-form-grid">
                                <MyFormItem name="ruleName" label="任务名称" rules={[{ required: true, message: "请输入任务名称" }]}>
                                    <Input placeholder="例如：生产环境 API 健康检查" />
                                </MyFormItem>
                                <MyFormItem name="ruleType" label="拨测协议" rules={[{ required: true, message: "请选择拨测协议" }]}>
                                    <div className="probing-protocol-picker">
                                        {PROTOCOL_OPTIONS.map((protocol) => (
                                            <button
                                                key={protocol.value}
                                                type="button"
                                                disabled={type === "edit"}
                                                onClick={() => handleProtocolChange(protocol.value)}
                                                className={`probing-protocol-option ${protocolType === protocol.value ? "is-selected" : ""}`}
                                            >
                                                {protocol.label}
                                            </button>
                                        ))}
                                    </div>
                                </MyFormItem>
                            </div>
                            <Form.Item label="任务标签">
                                <Form.List name="labels">
                                    {(fields, { add, remove }) => (
                                        <div>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <div key={key} className="probing-label-row">
                                                    <Form.Item {...restField} name={[name, "key"]} rules={[{ required: true, message: "请输入标签键" }]} normalize={(value) => value?.replace(/\s/g, "")}>
                                                        <Input placeholder="标签键，例如：environment" />
                                                    </Form.Item>
                                                    <Form.Item {...restField} name={[name, "value"]} rules={[{ required: true, message: "请输入标签值" }]} normalize={(value) => value?.replace(/\s/g, "")}>
                                                        <Input placeholder="标签值，例如：production" />
                                                    </Form.Item>
                                                    <Button type="text" danger className="probing-remove-item" icon={<MinusCircleOutlined />} aria-label="删除标签" onClick={() => remove(name)} />
                                                </div>
                                            ))}
                                            <Button type="dashed" className="probing-add-item" onClick={() => add()} block icon={<PlusOutlined />} disabled={fields.length >= 10}>添加标签</Button>
                                        </div>
                                    )}
                                </Form.List>
                            </Form.Item>
                        </section>

                        <section className="probing-form-section">
                            <SectionHeading index="02" title="拨测配置" />
                            <MyFormItemGroup prefix={["probingEndpointConfig"]}>
                                <MyFormItem name="endpoint" label="目标端点" rules={[{ required: true, message: "请输入目标端点" }, { validator: validateEndpoint }]} normalize={(value) => value?.replace(/\s/g, "")}>
                                    <Input
                                        className="probing-endpoint-input"
                                        placeholder={endpointPlaceholder}
                                        addonBefore={protocolType === "HTTP" ? <Select className="probing-endpoint-method" value={methodType} onChange={setMethodType} options={METHOD_OPTIONS} style={{ width: 82 }} /> : null}
                                    />
                                </MyFormItem>

                                {protocolType === "ICMP" && (
                                    <MyFormItemGroup prefix={["icmp"]}>
                                        <div className="probing-form-grid">
                                            <MyFormItem name="interval" label="请求间隔" rules={[{ required: true, message: "请输入请求间隔" }]}>
                                                <InputNumber min={1} addonAfter="秒" precision={0} style={{ width: "100%" }} />
                                            </MyFormItem>
                                            <MyFormItem name="count" label="请求总数" rules={[{ required: true, message: "请输入请求总数" }]}>
                                                <InputNumber min={1} addonAfter="个" precision={0} style={{ width: "100%" }} />
                                            </MyFormItem>
                                        </div>
                                    </MyFormItemGroup>
                                )}

                                {protocolType === "HTTP" && (
                                    <Collapse className="probing-advanced" items={[{
                                        key: "advanced",
                                        label: <div className="probing-advanced-title"><strong>高级请求选项</strong><span>按需补充请求头，POST 请求可填写 JSON 请求体。</span></div>,
                                        children: <>
                                            <Form.List name={["probingEndpointConfig", "http", "header"]}>
                                                {(fields, { add, remove }) => (
                                                    <div className="probing-header-list">
                                                        {fields.map(({ key, name, ...restField }) => (
                                                            <div key={key} className="probing-header-row">
                                                                <Form.Item {...restField} name={[name, "key"]} rules={[{ required: true, message: "请输入请求头名称" }]}>
                                                                    <Input placeholder="请求头，例如：Content-Type" />
                                                                </Form.Item>
                                                                <Form.Item {...restField} name={[name, "value"]} rules={[{ required: true, message: "请输入请求头值" }]}>
                                                                    <Input placeholder="请求头值，例如：application/json" />
                                                                </Form.Item>
                                                                <Button type="text" danger className="probing-remove-item" icon={<MinusCircleOutlined />} aria-label="删除请求头" onClick={() => remove(name)} />
                                                            </div>
                                                        ))}
                                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>添加请求头</Button>
                                                    </div>
                                                )}
                                            </Form.List>
                                            {methodType === "POST" && (
                                                <div className="probing-json-editor">
                                                    <strong>JSON 请求体</strong>
                                                    <MyFormItem name={["http", "body"]} rules={[{ validator: validateJson }]}>
                                                        <VSCodeEditor height="260px" />
                                                    </MyFormItem>
                                                </div>
                                            )}
                                        </>
                                    }]} />
                                )}
                            </MyFormItemGroup>

                            <div className="probing-form-grid" style={{ marginTop: 20 }}>
                                <MyFormItemGroup prefix={["probingEndpointConfig", "strategy"]}>
                                    <MyFormItem name="evalInterval" label="执行频率" rules={[{ required: true, message: "请输入执行频率" }]}>
                                        <InputNumber min={1} addonAfter="秒" precision={0} style={{ width: "100%" }} />
                                    </MyFormItem>
                                </MyFormItemGroup>
                                <MyFormItemGroup prefix={["probingEndpointConfig", "strategy"]}>
                                    <MyFormItem name="timeout" label="超时时间" rules={[{ required: true, message: "请输入超时时间" }]}>
                                        <InputNumber min={1} addonAfter="秒" precision={0} style={{ width: "100%" }} />
                                    </MyFormItem>
                                </MyFormItemGroup>
                            </div>
                        </section>

                        <section className="probing-form-section probing-publish-section">
                            <SectionHeading index="03" title="发布任务" />
                            <div className="probing-datasource-row">
                                <MyFormItem name="datasourceId" label="写入数据源" tooltip="仅展示已启用远端写入的 Prometheus 数据源" rules={[{ required: true, message: "请选择数据源" }]}>
                                    <Select allowClear placeholder="请选择 Prometheus 数据源" options={datasourceOptions} showSearch optionFilterProp="label" loading={datasourceLoading} />
                                </MyFormItem>
                                <Button className="probing-refresh-button" icon={<ReloadOutlined />} loading={datasourceLoading} onClick={fetchDatasourceOptions} title="刷新数据源列表" aria-label="刷新数据源列表" />
                            </div>
                            <div className="probing-enable-row">
                                <div className="probing-enable-copy">
                                    <strong>启用任务</strong>
                                    <span>{enabled ? "保存后立即按设定频率执行拨测" : "保存为禁用状态，可稍后在任务列表中启用"}</span>
                                </div>
                                <Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                            </div>
                            <div className="probing-submit-bar">
                                <div className="probing-submit-status"><span className={`probing-status-dot ${enabled ? "is-enabled" : ""}`} /><span>{enabled ? "任务将处于启用状态" : "任务将处于禁用状态"}</span></div>
                                <Space className="probing-submit-actions">
                                    <Button onClick={() => navigate(-1)}>取消</Button>
                                    <Button type="primary" htmlType="submit" loading={submitLoading} className="probing-submit-button">{type === "edit" ? "保存修改" : "创建任务"}</Button>
                                </Space>
                            </div>
                        </section>
                    </Form>
                </div>
            </main>
        </>
    )
}
