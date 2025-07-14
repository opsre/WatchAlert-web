"use client"

import React, { useEffect, useState, useContext, useMemo } from "react"
import {Alert, Tabs, Form, Input, Select, Button, Collapse, Table, Tag, Progress, Spin, Typography, Space} from "antd"
import Marquee from "react-fast-marquee"
import { ProbingOnce } from "../../api/probing"
import moment from "moment/moment"
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";

const { Panel } = Collapse
const { Title } = Typography

// Context for managing nested form item names
const MyFormItemContext = React.createContext([])

// Component to provide a prefix path for nested Form.Items
const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = useContext(MyFormItemContext)
    const concatPath = useMemo(() => [...prefixPath, ...(Array.isArray(prefix) ? prefix : [prefix])], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

// Custom Form.Item that respects the MyFormItemContext prefix
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...(Array.isArray(name) ? name : [name])] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const OnceProbing = () => {
    const [probingType, setProbingType] = useState("HTTP")
    const [methodType, setMethodType] = useState("GET")
    const [responseData, setResponseData] = useState(null)
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    const tabs = [
        { key: "1", label: "HTTP" },
        { key: "2", label: "ICMP" },
        { key: "3", label: "TCP" },
        { key: "4", label: "SSL" },
    ]

    const [height, setHeight] = useState(window.innerHeight)

    useEffect(() => {
        const handleResize = () => setHeight(window.innerHeight)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    const handleChangeProbingType = (key) => {
        const types = { 1: "HTTP", 2: "ICMP", 3: "TCP", 4: "SSL" }
        setProbingType(types[key])
        // Reset form fields relevant to the previous probing type to avoid stale data
        form.resetFields([
            ['probingEndpointConfig', 'http', 'header'],
            ['probingEndpointConfig', 'http', 'body'],
            ['probingEndpointConfig', 'icmp', 'count'],
            ['probingEndpointConfig', 'icmp', 'interval']
        ]);
        if (types[key] !== "HTTP") {
            setMethodType("GET"); // Reset method type if not HTTP
        }
    }

    const validateInput = (_, value) => {
        const urlPattern = /^(https?:\/\/)[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s]*)?$/
        const domainIpPattern = /^(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})$/
        const tcpPattern = /^(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3}):\d+$/
        const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/

        if (!value) {
            return Promise.reject("请输入端点")
        }

        switch (probingType) {
            case "HTTP":
                return urlPattern.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的 http(s)://URL")
            case "ICMP":
                return domainIpPattern.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的 域名或IP")
            case "TCP":
                return tcpPattern.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的 IP/域名:port")
            case "SSL":
                return domainPattern.test(value)
                    ? Promise.resolve()
                    : Promise.reject("请输入有效的 域名")
            default:
                return Promise.resolve()
        }
    }

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

    const handleSubmit = async () => {
        try {
            setLoading(true)
            const values = await form.validateFields() // Validate all fields, including advanced options

            const params = {
                ruleType: probingType,
                probingEndpointConfig: {
                    endpoint: values.probingEndpointConfig.endpoint,
                    strategy: {
                        timeout: Number.parseInt(values.probingEndpointConfig.strategy.timeout, 10),
                    },
                },
            }

            // Conditionally add HTTP specific configurations
            if (probingType === "HTTP") {
                params.probingEndpointConfig.http = {
                    method: methodType,
                }

                // Process header
                if (values.probingEndpointConfig.http.header) {
                    const headerObject = {};
                    values.probingEndpointConfig.http.header.forEach((headerItem) => {
                        if (
                            headerItem &&
                            typeof headerItem.key === 'string' &&
                            headerItem.key.trim() !== '' &&
                            Object.prototype.hasOwnProperty.call(headerItem, 'value')
                        ) {
                            headerObject[headerItem.key.trim()] = headerItem.value || "";
                        }
                    });
                    // Corrected: Assign back to 'header' (plural)
                    params.probingEndpointConfig.http.header = headerObject;
                }

                if (methodType === "POST" && values.probingEndpointConfig.http.body) {
                    params.probingEndpointConfig.http.body = values.probingEndpointConfig.http.body;
                }
            }

            // Conditionally add ICMP specific configurations
            if (probingType === "ICMP") {
                params.probingEndpointConfig.icmp = {
                    interval: Number.parseInt(values.probingEndpointConfig.icmp.interval, 10),
                    count: Number.parseInt(values.probingEndpointConfig.icmp.count, 10),
                }
            }

            const res = await ProbingOnce(params)
            setResponseData(res.data)
        } catch (errorInfo) {
            console.error("请求失败:", errorInfo)
        } finally {
            setLoading(false)
        }
    }

    const HTTPColumns = [
        {
            title: "端点",
            key: "endpoint",
            width: "auto",
            render: () => <div>{responseData.address || "-"}</div>,
        },
        {
            title: "状态码",
            key: "statusCode",
            width: "auto",
            render: () => {
                const statusCode = responseData.StatusCode
                const isSuccess = statusCode >= 200 && statusCode < 300
                return (
                    <span
                        style={{
                            color: isSuccess ? "green" : "red",
                            fontWeight: "bold",
                        }}
                    >
            {statusCode || "-"}
          </span>
                )
            },
        },
        {
            title: "响应延迟",
            key: "latency",
            width: "auto",
            render: () => <>{(responseData.Latency && responseData.Latency + "ms") || "-"}</>,
        },
    ]

    const ICMPColumns = [
        {
            title: "端点",
            key: "endpoint",
            width: "auto",
            render: () => <div>{responseData.address || "-"}</div>,
        },
        {
            title: "丢包率",
            key: "packetLoss",
            width: "auto",
            render: () => {
                const packetLoss = responseData.PacketLoss
                if (packetLoss === undefined || packetLoss === null || packetLoss === "") {
                    return <Tag color="gray">未知</Tag>
                }
                return <Tag color={packetLoss < 80 ? "green" : "red"}>{`${packetLoss}%`}</Tag>
            },
        },
        {
            title: "最短 RT",
            key: "minRtt",
            width: "auto",
            render: () => <>{(responseData.MinRtt && responseData.MinRtt + "ms") || "-"}</>,
        },
        {
            title: "最长 RTT",
            key: "maxRtt",
            width: "auto",
            render: () => <>{(responseData.MaxRtt && responseData.MaxRtt + "ms") || "-"}</>,
        },
        {
            title: "平均 RTT",
            key: "avgRtt",
            width: "auto",
            render: () => <>{(responseData.AvgRtt && responseData.AvgRtt + "ms") || "-"}</>,
        },
    ]

    const TCPColumns = [
        {
            title: "端点",
            key: "endpoint",
            width: "auto",
            render: () => <div>{responseData.address || "-"}</div>,
        },
        {
            title: "探测状态",
            key: "isSuccessful",
            width: "auto",
            render: () => {
                const status = responseData.IsSuccessful
                const statusTag =
                    status === true ? (
                        <Tag color="green">成功</Tag>
                    ) : status === false ? (
                        <Tag color="red">失败</Tag>
                    ) : (
                        <Tag color="gray">未知</Tag>
                    )
                return statusTag
            },
        },
        {
            title: "错误信息",
            key: "errorMessage",
            width: "auto",
            render: () => <>{responseData.ErrorMessage || "-"}</>,
        },
    ]

    const SSLColumns = [
        {
            title: "端点",
            key: "endpoint",
            width: "auto",
            render: () => <div>{responseData.address || "-"}</div>,
        },
        {
            title: "签发时间",
            key: "startTime",
            width: "auto",
            render: () => <>{responseData.StartTime || "-"}</>,
        },
        {
            title: "结束时间",
            key: "expireTime",
            width: "auto",
            render: () => <>{responseData.ExpireTime || "-"}</>,
        },
        {
            title: "有效时间",
            key: "timeProgress",
            width: "auto",
            render: () => {
                const startTime = responseData.StartTime
                const endTime = responseData.ExpireTime
                if (!startTime || !endTime) {
                    return "-"
                }
                const totalDays = moment(endTime).diff(moment(startTime), "days")
                const remainingDays = moment(endTime).diff(moment(), "days")
                const progress = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100))
                return (
                    <div>
                        <Progress
                            percent={Number.parseFloat(progress.toFixed(2))}
                            status={progress > 20 ? "active" : "exception"}
                            strokeColor={progress > 20 ? "#52c41a" : "#ff4d4f"}
                            showInfo={false}
                        />
                        <div style={{ textAlign: "center", fontSize: 12 }}>
                            剩余 {remainingDays > 0 ? remainingDays : 0} 天 / 总共 {totalDays} 天
                        </div>
                    </div>
                )
            },
        },
        {
            title: "响应延迟",
            key: "avgRtt",
            width: "auto",
            render: () => <>{responseData.ResponseTime + "ms" || "-"}</>,
        },
    ]

    const cols = { HTTP: HTTPColumns, ICMP: ICMPColumns, TCP: TCPColumns, SSL: SSLColumns }

    const initialFormValues = {
        probingEndpointConfig: {
            strategy: {
                timeout: 5, // Default timeout to 5 seconds
            },
            icmp: {
                count: 10,
                interval: 1,
            },
        },
    }

    const message = {
        HTTP: "请输入端点，如：https://github.com",
        ICMP: "请输入端点，如：127.0.0.1 / github.com",
        TCP: "请输入端点，如：127.0.0.1:80",
        SSL: "请输入端点，如：github.com",
    }

    return (
        <Spin spinning={loading} tip="加载中...">
            <div style={{ marginTop: "-15px" }}>
                <Alert
                    banner
                    type="info"
                    message={
                        <Marquee pauseOnHover gradient={false}>
                            模拟真实用户从不同网络条件访问在线服务，持续对网络质量、网站性能、文件传输等场景进行可用性监测和性能监测。
                        </Marquee>
                    }
                />
                <Tabs defaultActiveKey="1" items={tabs} onChange={handleChangeProbingType} />
            </div>
            <div
                style={{
                    textAlign: "left",
                    marginTop: "-15px",
                    maxHeight: height - 300,
                    overflow: "auto",
                    padding: "10px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#fff",
                }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: "10px" }} initialValues={initialFormValues}>
                    {/* All form items related to probingEndpointConfig are nested here */}
                    <MyFormItemGroup prefix={["probingEndpointConfig"]}>
                        <MyFormItem
                            name="endpoint"
                            label=""
                            rules={[{ required: true, message: message[probingType] }, { validator: validateInput }]}
                        >
                            <Input
                                addonBefore={
                                    probingType === "HTTP" ? (
                                        <Select
                                            value={methodType}
                                            options={[
                                                { value: "GET", label: "GET" },
                                                { value: "POST", label: "POST" },
                                            ]}
                                            onChange={setMethodType}
                                        />
                                    ) : null
                                }
                                placeholder={message[probingType]}
                                addonAfter={
                                    <Button
                                        type="link"
                                        onClick={handleSubmit}
                                        style={{
                                            borderLeft: "none",
                                            borderTopRightRadius: "0px",
                                            borderBottomRightRadius: "0px",
                                            height: "100%",
                                            fontSize: "13px",
                                        }}
                                    >
                                        拨测一下 ➡️
                                    </Button>
                                }
                                style={{
                                    borderTopRightRadius: "0px",
                                    borderBottomRightRadius: "0px",
                                }}
                            />
                        </MyFormItem>

                        <Collapse style={{ marginTop: "10px" }}>
                            <Panel header="高级选项" key="1">
                                {/* Strategy configuration */}
                                <MyFormItemGroup prefix={["strategy"]}>
                                    <MyFormItem name="timeout" label="超时时间 (秒)">
                                        <Input type="number" placeholder="请输入超时时间" />
                                    </MyFormItem>
                                </MyFormItemGroup>

                                {/* HTTP specific options */}
                                {probingType === "HTTP" && (
                                    <MyFormItemGroup prefix={["http"]}>
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
                                            <MyFormItem name={["body"]} label="请求体" rules={[{ validator: validateJson }]}>
                                                <Input.TextArea placeholder='请输入请求体，格式为 JSON，例如 {"key": "value"}' rows={5} />
                                            </MyFormItem>
                                        )}
                                    </MyFormItemGroup>
                                )}
                                {/* ICMP specific options */}
                                {probingType === "ICMP" && (
                                    <MyFormItemGroup prefix={["icmp"]}>
                                        <MyFormItem name="count" label="请求包数量">
                                            <Input type="number" min={1} placeholder="请输入请求包数量"/>
                                        </MyFormItem>
                                        <MyFormItem name="interval" label="请求间隔">
                                            <Input type="number" min={1} placeholder="请输入请求间隔时间"/>
                                        </MyFormItem>
                                    </MyFormItemGroup>
                                )}
                            </Panel>
                        </Collapse>
                    </MyFormItemGroup>

                    {responseData && (
                        <div style={{marginTop: "20px"}}>
                            <Table
                                columns={cols[probingType]}
                                dataSource={[responseData]}
                                pagination={false}
                                bordered
                                showHeader={true}
                                rowKey="key"
                                size="small"
                            />
                        </div>
                    )}
                </Form>
            </div>
        </Spin>
    );
};