"use client"

import React, { useState, useEffect, useContext, useMemo } from "react"
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
    Checkbox
} from "antd" // Added message
import { MinusCircleOutlined, PlusOutlined } from "@ant-design/icons"
import { useParams, useNavigate } from "react-router-dom"
import { getNoticeList } from "../../api/notice"
import { ProbingCreate, ProbingSearch, ProbingUpdate } from "../../api/probing"
import TextArea from "antd/es/input/TextArea"
import {HandleApiError} from "../../utils/lib";
import VSCodeEditor from "../../utils/VSCodeEditor";
import {useAppContext} from "../../context/RuleContext";

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
    const searchParams = new URLSearchParams(window.location.search);
    const [form] = Form.useForm()
    const { id } = useParams()
    const [selectedRow, setSelectedRow] = useState(null)
    const [enabled, setEnabled] = useState(true)
    const [recoverNotify, setRecoverNotify] = useState(true)
    const [noticeOptions, setNoticeOptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [protocolType, setProtocolType] = useState(searchParams.get('type'))
    const [methodType, setMethodType] = useState("GET")
    const [calculate, setCalculate] = useState(">")
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

    const httpOptions = [
        {
            value: "StatusCode",
            label: "状态码",
        },
        {
            value: "Latency",
            label: "响应延迟",
        },
    ]
    const icmpOptions = [
        {
            value: "PacketLoss",
            label: "丢包率",
        },
        {
            value: "MinRtt",
            label: "最小耗时",
        },
        {
            value: "MaxRtt",
            label: "最大耗时",
        },
        {
            value: "AvgRtt",
            label: "平均耗时",
        },
    ]
    const tcpOptions = [
        {
            value: "IsSuccessful",
            label: "",
        },
    ]
    const sslOptions = [
        {
            value: "TimeRemaining",
            label: "证书有效时间",
        },
    ]

    useEffect(() => {
        // Set initial default values for new rule creation
        if (type === "add") {
            form.setFieldsValue({
                ruleType: "HTTP",
                repeatNoticeInterval: 60,
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
        handleGetNoticeData()
    }, [id, type, form]) // Added form to dependencies

    useEffect(() => {
        initBasicInfo(selectedRow)
    }, [selectedRow, form])

    const initBasicInfo = (selectedRow) => {
        if (selectedRow) {
            setProtocolType(selectedRow.ruleType)
            setRecoverNotify(selectedRow.recoverNotify)
            setEnabled(selectedRow.enabled)
            setMethodType(selectedRow.probingEndpointConfig.http?.method || "GET")
            setCalculate(selectedRow.probingEndpointConfig.strategy?.operator || ">")

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
                repeatNoticeInterval: selectedRow.repeatNoticeInterval,
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
                noticeId: selectedRow.noticeId,
                annotations: selectedRow.annotations,
                recoverNotify: selectedRow.recoverNotify,
                enabled: selectedRow.enabled,
            })
        }
    }

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
                recoverNotify: recoverNotify,
                probingEndpointConfig: {
                    ...values.probingEndpointConfig,
                    http: {
                        ...values.probingEndpointConfig.http,
                        method: methodType,
                    },
                    strategy: {
                        ...values.probingEndpointConfig.strategy,
                        operator: calculate,
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
            
            navigate(`/probing?view=${searchParams.get("type")}`)
        } catch (error) {
            HandleApiError(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleGetNoticeData = async () => {
        try {
            const res = await getNoticeList()
            const newData = res.data.map((item) => ({
                label: item.name,
                value: item.uuid,
            }))
            setNoticeOptions(newData)
        } catch (error) {
            HandleApiError(error)
        }
    }

    const urlPattern = /^(https?:\/\/)[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s]*)?$/
    const domainIpPattern = /^(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})$/
    const tcpPattern = /^(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3}):\d+$/
    const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

    const optionsMap = {
        HTTP: httpOptions,
        ICMP: icmpOptions,
        TCP: tcpOptions,
        SSL: sslOptions,
    }
    const options = optionsMap[protocolType] || []

    const validateJson = (_, value) => {
        if (value && !isValidJson(value)) {
            return Promise.reject("请输入有效的 JSON 格式")
        }
        return Promise.resolve()
    }

    const isValidJson = (str) => {
        try {
            JSON.parse(str)
            return true
        } catch (e) {
            return false
        }
    }

    if (loading && type === "edit") {
        return <div>Loading...</div>
    }

    return (
        <div
            style={{
                textAlign: "left",
                width: "100%",
                alignItems: "flex-start",
                marginTop: "-20px",
                maxHeight: "calc(-120px + 100vh)",
                overflowY: "auto",
            }}
        >
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <Divider orientation="left">基础配置</Divider>
                <div style={{display: "flex", gap: "10px"}}>
                    <MyFormItem name="ruleName" label="任务名称" style={{width: "100%"}} rules={[{required: true}]}>
                        <Input placeholder="请输入任务名称" style={{flex: 1}} onWheel={(e) => e.target.blur()}/>
                    </MyFormItem>
                    <MyFormItem name="ruleType" label="拨测协议" style={{width: "100%"}} rules={[{required: true}]}>
                        <Select
                            placeholder="选择拨测协议"
                            style={{flex: 1}}
                            options={[
                                {value: "HTTP", label: "HTTP"},
                                {value: "ICMP", label: "ICMP"},
                                {value: "TCP", label: "TCP"},
                                {value: "SSL", label: "SSL"},
                            ]}
                            defaultValue={protocolType}
                            value={protocolType}
                            onChange={(value) => setProtocolType(value)}
                            disabled={type === "edit"}
                        />
                    </MyFormItem>
                </div>
                <MyFormItemGroup prefix={["probingEndpointConfig"]}>
                    <div style={{display: "flex", gap: "10px"}}>
                        <MyFormItem
                            name="endpoint"
                            label="端点"
                            style={{width: "100%"}}
                            rules={[
                                {required: true, message: "请输入端点"},
                                {
                                    validator: (_, value) => {
                                        switch (protocolType) {
                                            case "HTTP":
                                                return urlPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject("请输入有效的完整URL, 例如: http(s)://github.com")
                                            case "ICMP":
                                                return domainIpPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject("请输入有效的域名或IP地址, 例如: github.com / 1.1.1.1")
                                            case "TCP":
                                                return tcpPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject("请输入有效的 IP/域名:端口, 例如: 1.1.1.1:80")
                                            case "SSL":
                                                return domainPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject("请输入有效的域名, 例如: github.com")
                                            default:
                                                return Promise.resolve()
                                        }
                                    },
                                },
                            ]}
                            normalize={(value) => value.replace(/\s/g, "")}
                        >
                            {protocolType === "HTTP" ? (
                                <Input
                                    addonBefore={
                                        <Select
                                            defaultValue="GET"
                                            style={{flex: 1}}
                                            options={[
                                                {value: "GET", label: "GET"},
                                                {value: "POST", label: "POST"},
                                            ]}
                                            value={methodType}
                                            onChange={setMethodType}
                                        />
                                    }
                                />
                            ) : (
                                <Input/>
                            )}
                        </MyFormItem>
                    </div>
                    {/* ICMP Ping Settings */}
                    {protocolType === "ICMP" && (
                        <MyFormItemGroup prefix={["icmp"]}>
                            <div style={{display: "flex", gap: "10px"}}>
                                <MyFormItem name="interval" label="请求间隔(s)" style={{width: "100%"}}
                                            rules={[{required: true}]}>
                                    <InputNumber 
                                        type="number" 
                                        min={1} 
                                        placeholder="1" 
                                        style={{width: "100%"}} 
                                        onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                                    />
                                </MyFormItem>
                                <MyFormItem name="count" label="请求总数(个)" style={{width: "100%"}}
                                            rules={[{required: true}]}>
                                    <InputNumber 
                                        type="number" 
                                        min={1} 
                                        placeholder="1" 
                                        style={{width: "100%"}} 
                                        onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                                    />
                                </MyFormItem>
                            </div>
                        </MyFormItemGroup>
                    )}
                    {/* HTTP Request Settings */}
                    {protocolType === "HTTP" && (
                        <>
                            <Typography.Text style={{marginBottom: 10, display: "block"}}>
                                请求头
                            </Typography.Text>
                            <div
                                style={{
                                    border: "1px solid #d9d9d9",
                                    borderRadius: "6px",
                                    padding: "16px",
                                    marginBottom: "24px",
                                }}
                            >
                                {/* Corrected: Use 'header' here to match the backend structure and initial form value */}
                                <Form.List name={["probingEndpointConfig", "http", "header"]}>
                                    {(fields, {add, remove}) => (
                                        <>
                                            {fields.map(({key, name, ...restField}) => (
                                                <Space key={key} style={{display: "flex", marginBottom: 8}}
                                                       align="baseline">
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
                                                <Button type="dashed" onClick={() => add()} block
                                                        icon={<PlusOutlined/>}>
                                                    添加请求头
                                                </Button>
                                            </Form.Item>
                                        </>
                                    )}
                                </Form.List>
                            </div>

                            {methodType === "POST" && (
                                <MyFormItem name={["http", "body"]} label="请求体" rules={[{validator: validateJson}]}>
                                    <VSCodeEditor height={"300px"}/>
                                </MyFormItem>
                            )}
                        </>
                    )}
                    <Divider orientation="left">策略配置</Divider>
                    <MyFormItemGroup prefix={["strategy"]}>
                        <div style={{display: "flex", gap: "10px"}}>
                            <MyFormItem
                                name="evalInterval"
                                label="执行频率(s)"
                                style={{
                                    width: "100%",
                                }}
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <InputNumber 
                                    type={"number"} 
                                    min={1} 
                                    style={{width: "100%"}} 
                                    onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                                />
                            </MyFormItem>
                            <MyFormItem
                                name="timeout"
                                label="超时时间(s)"
                                style={{
                                    width: "100%",
                                }}
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <InputNumber 
                                    type={"number"} 
                                    min={1} 
                                    style={{width: "100%"}} 
                                    onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                                />
                            </MyFormItem>
                        </div>
                        <MyFormItem
                            name="failure"
                            label="失败次数"
                            style={{
                                width: "100%",
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <InputNumber 
                                type={"number"} 
                                min={1} 
                                placeholder="1" 
                                style={{width: "100%"}} 
                                onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                            />
                        </MyFormItem>
                        {protocolType !== "TCP" && (
                            <div style={{display: "flex", gap: "10px"}}>
                                <MyFormItem name="field" label="字段" style={{width: "50%"}} rules={[{required: true}]}>
                                    <Select
                                        placeholder="选择需要评估的字段"
                                        style={{
                                            width: "100%",
                                            borderRadius: "0",
                                        }}
                                        options={options}
                                    />
                                </MyFormItem>
                                <MyFormItem name="expectedValue" label="告警条件" style={{width: "50%"}}
                                            rules={[{required: true}]}>
                                    <InputNumber
                                        type="number"
                                        min={1}
                                        placeholder="1"
                                        style={{width: "100%", borderRadius: "0"}}
                                        onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                                        addonBefore={
                                            <Select
                                                placeholder="运算"
                                                style={{
                                                    width: "100px",
                                                    borderRadius: "0",
                                                }}
                                                defaultValue={">"}
                                                value={calculate}
                                                options={[
                                                    {value: ">", label: "大于"},
                                                    {value: ">=", label: "大于等于"},
                                                    {value: "<", label: "小于"},
                                                    {value: "<=", label: "小于等于"},
                                                    {value: "==", label: "等于"},
                                                    {value: "!=", label: "不等于"},
                                                ]}
                                                onChange={setCalculate}
                                            />
                                        }
                                        addonAfter={"时触发告警"}
                                    />
                                </MyFormItem>
                            </div>
                        )}
                        {protocolType === "TCP" && (
                            <Typography.Text type="secondary" style={{marginTop: "5px", fontSize: "12px"}}>
                                {"> 在对端点执行 TCP 探测时，如果探测失败，将触发相应的告警。"}
                            </Typography.Text>
                        )}
                    </MyFormItemGroup>
                </MyFormItemGroup>
                <Divider orientation="left">通知配置</Divider>
                <div>
                    <MyFormItem
                        name="annotations"
                        label="告警详情"
                        tooltip="${address}：获取端点信息，${value}：获取数据结果"
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <TextArea
                            rows={2}
                            placeholder="输入告警事件的详细消息内容，如：站点: ${address}，请求不可达请紧急排查!"
                            maxLength={10000}
                        />
                    </MyFormItem>
                </div>
                <div style={{display: "flex"}}>
                    <MyFormItem
                        name="noticeId"
                        label="通知对象"
                        tooltip="默认通知对象"
                        style={{
                            marginRight: "10px",
                            width: "50%",
                        }}
                        rules={[{required: true}]}
                    >
                        <Select style={{width: "100%"}} allowClear placeholder="选择通知对象" options={noticeOptions}/>
                    </MyFormItem>
                    <MyFormItem
                        name="repeatNoticeInterval"
                        label="重复通知"
                        style={{width: "50%"}}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <InputNumber 
                            style={{width: "100%"}} 
                            addonAfter={<span>分钟</span>} 
                            min={1} 
                            onWheel={(e) => { e.preventDefault(); e.currentTarget.blur(); }}
                        />
                    </MyFormItem>
                </div>

                <div>
                    <MyFormItem
                        style={{marginBottom: 0}}
                        name="recoverNotify"
                        valuePropName="checked"
                    >
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{marginRight: 8}}>恢复通知</span>
                            <Checkbox
                                style={{marginTop: '0', marginRight: '10px'}}
                                checked={recoverNotify}
                                onChange={(e) => setRecoverNotify(e.target.checked)}
                            />
                        </div>
                    </MyFormItem>

                    <MyFormItem
                        style={{marginBottom: 0}}
                        name="enabled"
                        valuePropName="checked"
                    >
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{marginRight: 8}}>启用规则</span>
                            <Checkbox
                                style={{marginTop: '0', marginRight: '10px'}}
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                        </div>
                    </MyFormItem>
                </div>

                <div style={{display: "flex", justifyContent: "flex-end"}}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitLoading}
                        style={{
                            backgroundColor: "#000000",
                        }}
                    >
                        提交
                    </Button>
                </div>
            </Form>
        </div>
    )
}