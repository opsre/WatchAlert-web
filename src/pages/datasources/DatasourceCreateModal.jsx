import { createDatasource, DatasourcePing, updateDatasource } from "../../api/datasource"
import {Form, Input, Button, Checkbox, Alert, Drawer, Steps, Card, Row, Col, Typography, Divider, Radio} from "antd"
import React, { useState, useEffect } from "react"
import {
    MinusCircleOutlined,
    PlusOutlined,
    DatabaseOutlined,
    CloudOutlined,
    ApartmentOutlined, CloseOutlined, CheckOutlined,
} from "@ant-design/icons"
import VSCodeEditor from "../../utils/VSCodeEditor";
const { TextArea } = Input
const { Title, Text } = Typography
const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatPath = React.useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

// 数据源类型配置
const datasourceTypes = [
    {
        value: "Prometheus",
        label: "Prometheus",
        icon: <DatabaseOutlined />,
        description: "Prometheus 监控系统和时间序列数据库",
    },
    {
        value: "AliCloudSLS",
        label: "阿里云SLS",
        icon: <CloudOutlined />,
        description: "阿里云日志服务",
    },
    {
        value: "Jaeger",
        label: "Jaeger",
        icon: <ApartmentOutlined />,
        description: "分布式追踪系统",
    },
    {
        value: "Loki",
        label: "Loki",
        icon: <DatabaseOutlined />,
        description: "日志聚合系统",
    },
    {
        value: "CloudWatch",
        label: "CloudWatch",
        icon: <CloudOutlined />,
        description: "AWS 监控和可观测性服务",
    },
    {
        value: "VictoriaMetrics",
        label: "VictoriaMetrics",
        icon: <DatabaseOutlined />,
        description: "高性能时间序列数据库",
    },
    {
        value: "Kubernetes",
        label: "Kubernetes",
        icon: <ApartmentOutlined />,
        description: "容器编排平台",
    },
    {
        value: "ElasticSearch",
        label: "ElasticSearch",
        icon: <DatabaseOutlined />,
        description: "分布式搜索和分析引擎",
    },
    {
        value: "VictoriaLogs",
        label: "VictoriaLogs",
        icon: <DatabaseOutlined />,
        description: "轻量级日志分析系统",
    },
    {
        value: "ClickHouse",
        label: "ClickHouse",
        icon: <DatabaseOutlined />,
        description: "高性能列式存储数据库",
    },
]

export const CreateDatasourceModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const [enabled, setEnabled] = useState(true)
    const [selectedType, setSelectedType] = useState(null)
    const [submitLoading, setSubmitLoading] = useState(false)
    const [testLoading, setTestLoading] = useState(false)
    const [currentStep, setCurrentStep] = useState(0)
    const [spaceValue, setSpaceValue] = useState("")
    const [disableStep, setDisableStep] = useState(false)
    const [authState, setAuthState] = useState("Off")

    const handleInputChange = (e) => {
        const newValue = e.target.value.replace(/\s/g, "")
        setSpaceValue(newValue)
    }

    const handleKeyPress = (e) => {
        if (e.key === " ") {
            e.preventDefault()
        }
    }

    useEffect(() => {
        if (selectedRow) {
            const labelsArray = Object.entries(selectedRow.labels || {}).map(([key, value]) => ({
                key,
                value,
            }));

            setSelectedType(selectedRow.type)
            form.setFieldsValue({
                name: selectedRow.name,
                type: selectedRow.type,
                labels: labelsArray,
                http: {
                    url: selectedRow.http.url,
                    timeout: Number(selectedRow.http.timeout)
                },
                alicloudEndpoint: selectedRow.alicloudEndpoint,
                alicloudAk: selectedRow.alicloudAk,
                alicloudSk: selectedRow.alicloudSk,
                awsCloudwatch: selectedRow.awsCloudwatch,
                description: selectedRow.description,
                kubeConfig: selectedRow.kubeConfig,
                elasticSearch: selectedRow.elasticSearch,
                enabled: selectedRow.enabled
            })

            // 如果是编辑模式，直接跳到第二步
            setCurrentStep(1)
            setDisableStep(true)
        }
    }, [selectedRow, form])

    const handleCreate = async (params) => {
        try {
            await createDatasource(params)
            handleList()
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleUpdate = async (params) => {
        try {
            await updateDatasource(params)
            handleList()
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleFormSubmit = async (values) => {
        const formattedLabels = values.labels?.reduce((acc, { key, value }) => {
            if (key) {
                acc[key] = value
            }
            return acc
        }, {})

        const params = {
            ...values,
            labels: formattedLabels,
            clickhouseConfig: {
                addr: values?.clickhouseConfig?.addr,
                timeout: Number(values?.clickhouseConfig?.timeout),
            },
            http: {
                url: values?.http?.url,
                timeout: Number(values?.http?.timeout),
            },
            enabled: enabled,
        }

        if (type === "create") {
            await handleCreate(params)
        }

        if (type === "update") {
            params.id = selectedRow.id
            await handleUpdate(params)
        }

        onClose()
    }

    const handleSelectType = (type) => {
        setSelectedType(type)
        form.setFieldsValue({ type })
        setCurrentStep(1)
    }

    const handleSubmit = async () => {
        setSubmitLoading(true)
        const values = form.getFieldsValue()
        await form.validateFields()
        await handleFormSubmit(values)
        setSubmitLoading(false)
    }

    const handleTestConnection = async () => {
        setTestLoading(true)
        const values = await form.validateFields().catch((err) => null)
        if (!values) {
            setTestLoading(false)
            return
        }

        const formattedLabels = values.labels?.reduce((acc, { key, value }) => {
            if (key) {
                acc[key] = value
            }
            return acc
        }, {})

        try {
            const params = {
                ...values,
                labels: formattedLabels,
                clickhouseConfig: {
                    addr: values?.clickhouseConfig?.addr,
                    timeout: Number(values?.clickhouseConfig?.timeout),
                },
                http: {
                    url: values?.http?.url,
                    timeout: Number(values?.http?.timeout),
                },
            }
            await DatasourcePing(params)
        } catch (error) {
            console.error("连接测试失败:", error)
        }
        setTestLoading(false)
    }

    const handlePrevStep = () => {
        setCurrentStep(0)
    }

    const radioOptions = [
        {
            label: '认证',
            value: 'On',
        },
        {
            label: '不认证',
            value: 'Off',
        },
    ];

    // 渲染数据源类型选择卡片
    const renderDatasourceTypeCards = () => {
        return (
            <div style={{ padding: "20px 0" }}>
                <Row gutter={[16, 16]}>
                    {datasourceTypes.map((dsType) => (
                        <Col xs={24} sm={12} md={8} key={dsType.value}>
                            <Card
                                hoverable
                                onClick={() => handleSelectType(dsType.value)}
                                style={{
                                    height: "100%",
                                    borderColor: selectedType === dsType.value ? "#1890ff" : undefined,
                                    boxShadow: selectedType === dsType.value ? "0 0 0 2px rgba(24,144,255,0.2)" : undefined,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <div
                                        style={{
                                            fontSize: "24px",
                                            marginRight: "12px",
                                            width: "40px",
                                            height: "40px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            background: "#f0f5ff",
                                            borderRadius: "8px",
                                            color: "#1890ff",
                                        }}
                                    >
                                        {dsType.icon}
                                    </div>
                                    <div>
                                        <Title level={5} style={{ margin: 0 }}>
                                            {dsType.label}
                                        </Title>
                                        <Text type="secondary">{dsType.description}</Text>
                                    </div>
                                </div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        )
    }

    // 渲染数据源配置表单
    const renderDatasourceConfigForm = () => {
        return (
            <Form form={form} name="form_item_path" layout="vertical">
                <MyFormItem name="name" label="数据源名称" rules={[{ required: true }]}>
                    <Input
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                    />
                </MyFormItem>

                <label>标签</label>
                <Alert
                    message="提示：可添加外部标签(external labels), 它将会添加到事件当中用于区分数据来源。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 20, marginTop: "10px" }}
                />

                <Form.List name="labels">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <div
                                    key={key}
                                    style={{
                                        display: "flex",
                                        marginBottom: 8,
                                        gap: "8px",
                                        alignItems: "center",
                                    }}
                                >
                                    <Form.Item
                                        {...restField}
                                        name={[name, "key"]}
                                        style={{ flex: 3 }}
                                        rules={[{ required: true, message: "请输入标签键（key）" }]}
                                    >
                                        <Input placeholder="键（key）" />
                                    </Form.Item>

                                    <Form.Item
                                        {...restField}
                                        name={[name, "value"]}
                                        style={{ flex: 3 }}
                                        rules={[{ required: true, message: "请输入标签值（value）" }]}
                                    >
                                        <Input placeholder="值（value）" />
                                    </Form.Item>

                                    <MinusCircleOutlined
                                        style={{
                                            marginTop: "-25px",
                                            display: "flex",
                                            justifyContent: "center",
                                            alignItems: "center",
                                            cursor: "pointer",
                                        }}
                                        onClick={() => remove(name)}
                                    />
                                </div>
                            ))}

                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    disabled={fields.length >= 10}
                                >
                                    添加标签
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

                <MyFormItem name="type" label="数据源类型" hidden rules={[{ required: true }]} />

                {(selectedType === "Prometheus" ||
                    selectedType === "Loki" ||
                    selectedType === "VictoriaLogs" ||
                    selectedType === "VictoriaMetrics" ||
                    selectedType === "Jaeger" ||
                    selectedType === "ElasticSearch" ||
                    selectedType === "ClickHouse"
                ) && (
                    <>
                        {(selectedType === "ClickHouse") && (
                            <MyFormItemGroup prefix={["clickhouseConfig"]}>
                                <Divider orientation="left">Server</Divider>
                                <MyFormItem
                                    name="addr"
                                    label="Addr"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                >
                                    <Input placeholder="127.0.0.1:9000,127.0.0.2:9000"/>
                                </MyFormItem>

                                <MyFormItem
                                    name="timeout"
                                    label="Timeout"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                >
                                    <Input type={"number"} style={{ width: "100%" }} addonAfter={<span>秒</span>} placeholder="10" min={1} />
                                </MyFormItem>
                            </MyFormItemGroup>
                        ) || (
                            <MyFormItemGroup prefix={["http"]}>
                                <Divider orientation="left">HTTP</Divider>
                                <MyFormItem
                                    name="url"
                                    label="URL"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                        {
                                            pattern: /^(http|https):\/\/.*[^/]$/,
                                            message: '请输入正确的URL格式，且结尾不应包含"/"',
                                        },
                                    ]}
                                >
                                    <Input />
                                </MyFormItem>

                                <MyFormItem
                                    name="timeout"
                                    label="Timeout"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                >
                                    <Input type={"number"} style={{ width: "100%" }} addonAfter={<span>秒</span>} placeholder="10" min={1} />
                                </MyFormItem>
                            </MyFormItemGroup>
                        )}

                        <MyFormItemGroup prefix={["auth"]}>
                            <Divider orientation="left">Auth</Divider>
                            <Radio.Group
                                block
                                options={radioOptions}
                                defaultValue="Off"
                                value={authState}
                                onChange={(e)=>setAuthState(e.target.value)}
                            />
                            {authState === "On" && (
                                <>
                                    <MyFormItem
                                        name="user"
                                        label="User"
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}
                                    >
                                        <Input />
                                    </MyFormItem>
                                    <MyFormItem
                                        name="pass"
                                        label="Pass"
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}
                                    >
                                        <Input.Password />
                                    </MyFormItem>
                                </>
                            )}
                        </MyFormItemGroup>
                    </>
                )}

                {selectedType === "AliCloudSLS" && (
                    <div>
                        <Divider orientation="left">Auth</Divider>
                        <MyFormItemGroup prefix={["dsAliCloudConfig"]}>
                            <MyFormItem
                                name="alicloudEndpoint"
                                label="Endpoint"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </MyFormItem>

                            <MyFormItem
                                name="alicloudAk"
                                label="AccessKeyId"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <Input.Password />
                            </MyFormItem>

                            <MyFormItem
                                name="alicloudSk"
                                label="AccessKeySecret"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <Input.Password />
                            </MyFormItem>
                        </MyFormItemGroup>
                    </div>
                )}

                {selectedType === "CloudWatch" && (
                    <div>
                        <Divider orientation="left">Auth</Divider>
                        <MyFormItemGroup prefix={["awsCloudwatch"]}>
                            <MyFormItem
                                name="region"
                                label="Region"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <Input />
                            </MyFormItem>

                            <MyFormItem
                                name="accessKey"
                                label="AccessKey"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <Input.Password />
                            </MyFormItem>

                            <MyFormItem
                                name="secretKey"
                                label="SecretKey"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                            >
                                <Input.Password />
                            </MyFormItem>
                        </MyFormItemGroup>
                    </div>
                )}

                {selectedType === "Kubernetes" && (
                    <div>
                        <Divider orientation="left">Auth</Divider>
                        <MyFormItem
                            name="kubeConfig"
                            label="认证配置"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <VSCodeEditor height={"500px"} language={"Yaml"}/>
                        </MyFormItem>
                    </div>
                )}

                <Divider orientation="left">Other</Divider>
                <MyFormItem name="description" label="描述">
                    <Input />
                </MyFormItem>

                <div style={{display: 'flex', alignItems: 'center'}}>
                    <span style={{marginRight: 8}}>启用/禁用</span>
                    <Checkbox
                        style={{marginTop: '0', marginRight: '10px'}}
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                    />
                </div>
                {/* <MyFormItem name="enabled" label={"状态"} tooltip="启用/禁用" valuePropName="checked">
                    <Switch checked={enabled} onChange={setEnabled} />
                </MyFormItem> */}
            </Form>
        )
    }

    // 渲染步骤内容
    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return renderDatasourceTypeCards()
            case 1:
                return renderDatasourceConfigForm()
            default:
                return null
        }
    }

    // 渲染底部按钮
    const renderFooterButtons = () => {
        if (currentStep === 0) {
            return (
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button onClick={onClose}>取消</Button>
                </div>
            )
        } else {
            return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                        <Button type="default" onClick={handleTestConnection} loading={testLoading}>
                            连接测试
                        </Button>
                    </div>
                    <div>
                        <Button
                            style={{ marginRight: 8 }}
                            onClick={handlePrevStep}
                            disabled={disableStep}
                        >
                            上一步
                        </Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={submitLoading}
                            onClick={handleSubmit}
                            style={{
                                backgroundColor: "#000000",
                            }}
                        >
                            提交
                        </Button>
                    </div>
                </div>
            )
        }
    }

    return (
        <Drawer title="创建数据源" open={visible} onClose={onClose} size="large" footer={renderFooterButtons()}>
            <Steps
                current={currentStep}
                items={[
                    {
                        title: "选择数据源",
                    },
                    {
                        title: "配置数据源",
                    },
                ]}
                style={{ marginBottom: 24 }}
            />

            {renderStepContent()}
        </Drawer>
    )
}