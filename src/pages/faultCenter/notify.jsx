"use client"

import { useState, useEffect, createContext, useContext, useMemo } from "react"
import {
    Input,
    Button,
    Select,
    Tooltip,
    Switch,
    Form,
    Typography,
    Space,
    Row,
    Col,
    Empty,
    message,
    Spin,
} from "antd"
import {
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
    BellOutlined,
    PlusOutlined,
    MinusOutlined,
    TagOutlined,
    ClockCircleOutlined,
    InfoCircleOutlined,
    TeamOutlined,
    SettingOutlined,
} from "@ant-design/icons"
import { FaultCenterSearch, FaultCenterUpdate } from "../../api/faultCenter"
import { useParams } from "react-router-dom"
import { getNoticeList } from "../../api/notice"

const { Title, Text, Paragraph } = Typography

// Form context for nested fields
const MyFormItemContext = createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// Form group component
const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = useContext(MyFormItemContext)
    const concatPath = useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

// Form item component
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const FaultCenterNotify = () => {
    const { id } = useParams()
    const [form] = Form.useForm()
    const [detail, setDetail] = useState({})
    const [noticeRoutes, setNoticeRoutes] = useState([])
    const [noticeLabels, setNoticeLabels] = useState([])
    const [noticeOptions, setNoticeOptions] = useState([])
    const [editable, setEditable] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        handleList()
        handleGetNoticeData()
    }, [])

    const handleList = async () => {
        try {
            setLoading(true)
            const params = { id }
            const res = await FaultCenterSearch(params)
            const data = res?.data
            
            // 处理重复通知间隔数据结构
            let repeatNoticeInterval = data.repeatNoticeInterval
            if (repeatNoticeInterval && typeof repeatNoticeInterval === "object" && !Array.isArray(repeatNoticeInterval)) {
                // 已经是对象格式，直接使用
            } else if (repeatNoticeInterval !== undefined && repeatNoticeInterval !== null) {
                // 旧的数字格式，转换为对象格式
                repeatNoticeInterval = {
                    "0": Number(repeatNoticeInterval),
                    "1": Number(repeatNoticeInterval),
                    "2": Number(repeatNoticeInterval)
                }
            } else {
                // 默认值
                repeatNoticeInterval = {
                    "0": 60,
                    "1": 120,
                    "2": 360
                }
            }

            setDetail(data)

            // Set form values
            form.setFieldsValue({
                noticeIds: data.noticeIds,
                repeatNoticeInterval: repeatNoticeInterval,
                recoverNotify: data.recoverNotify,
                alarmAggregation: data.alarmAggregation,
                recoverWaitTime: data.recoverWaitTime,
            })

            // Map noticeRoutes to noticeLabels
            if (res?.data?.noticeRoutes && res?.data?.noticeRoutes?.length > 0) {
                const labels = res?.data?.noticeRoutes?.map((group) => ({
                    key: group.key,
                    value: group.value,
                    noticeIds: group.noticeIds,
                }))
                setNoticeLabels(labels)
                setNoticeRoutes(labels)
            } else {
                setNoticeLabels([])
                setNoticeRoutes([])
            }
        } catch (error) {
            console.error("Failed to fetch data:", error)
            message.error("获取通知配置失败")
        } finally {
            setLoading(false)
        }
    }

    // Update noticeRoutes when noticeLabels change
    useEffect(() => {
        const updatedNoticeRoutes = noticeLabels.map((label) => ({
            key: label.key,
            value: label.value,
            noticeIds: label.noticeIds,
        }))
        setNoticeRoutes(updatedNoticeRoutes)
    }, [noticeLabels])

    // Add a new label
    const addLabel = () => {
        setNoticeLabels([...noticeLabels, { key: "", value: "", noticeIds: [] }])
    }

    // Update a label
    const updateLabel = (index, field, value) => {
        const updatedLabels = [...noticeLabels]
        updatedLabels[index][field] = value
        setNoticeLabels(updatedLabels)
    }

    // Remove a label
    const removeLabel = (index) => {
        const updatedLabels = [...noticeLabels]
        updatedLabels.splice(index, 1)
        setNoticeLabels(updatedLabels)
    }

    // Toggle edit mode
    const toggleEdit = () => {
        setEditable(!editable)
    }

    // Save changes
    const handleSave = async () => {
        try {
            setSaving(true)
            await form.validateFields()
            const values = form.getFieldsValue()

            // Validate noticeRoutes
            const hasEmptyFields = noticeRoutes.some(
                (route) => !route.key || !route.value || !route.noticeIds || route.noticeIds.length === 0,
            )

            if (noticeRoutes.length > 0 && hasEmptyFields) {
                message.error("告警路由配置不完整，请检查所有字段")
                setSaving(false)
                return
            }

            const params = {
                ...detail,
                ...values,
                noticeRoutes: noticeRoutes,
                repeatNoticeInterval: Object.entries(values.repeatNoticeInterval).reduce((acc, [key, value]) => {
                    acc[key] = Number(value)
                    return acc
                }, {}),
                recoverWaitTime: Number(values.recoverWaitTime) || 1,
            }

            await FaultCenterUpdate(params)
            setEditable(false)
            message.success("保存成功")
        } catch (error) {
            console.error("Save failed:", error)
            message.error("保存失败")
        } finally {
            setSaving(false)
        }
    }

    // Cancel editing
    const handleCancel = () => {
        setEditable(false)
        handleList()
    }

    // Get notification options
    const handleGetNoticeData = async () => {
        try {
            const res = await getNoticeList()
            const newData = res.data?.map((item) => ({
                label: item.name,
                value: item.uuid,
            }))
            setNoticeOptions(newData)
        } catch (error) {
            console.error("Failed to fetch notice data:", error)
        }
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
                <Spin size="large" tip="加载中..." />
            </div>
        )
    }

    return (
        <div className="notify-config-container">
            <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                        <BellOutlined style={{ marginRight: "12px" }} />
                        通知配置
                    </Title>
                    <Space>
                        {editable ? (
                            <>
                                <Button
                                    type="primary"
                                    icon={<CheckOutlined />}
                                    onClick={handleSave}
                                    loading={saving}
                                    style={{ backgroundColor: '#000', borderColor: '#000' }}
                                >
                                    保存
                                </Button>
                                <Button
                                    icon={<CloseOutlined />}
                                    onClick={handleCancel}
                                    style={{ backgroundColor: '#fff', borderColor: '#d9d9d9', color: '#000' }}
                                >
                                    取消
                                </Button>
                            </>
                        ) : (
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={toggleEdit}
                                style={{ backgroundColor: '#000', borderColor: '#000' }}
                            >
                                编辑
                            </Button>
                        )}
                    </Space>
                </div>
                <Text type="secondary">配置告警通知规则，确保告警信息能够及时送达相关人员</Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                className={editable ? "form-editable" : ""}
            >
                <Row gutter={24}>
                    <Col xs={24} lg={8}>
                        <div
                            style={{
                                padding: "24px",
                                background: "#fff",
                                borderRadius: "12px",
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
                                marginBottom: "24px",
                                border: "1px solid #f0f0f0"
                            }}
                        >
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "16px",
                                paddingBottom: "16px",
                                borderBottom: "1px solid #f0f0f0"
                            }}>
                                <SettingOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
                                <Text strong>基本配置</Text>
                            </div>

                            <MyFormItem
                                name="noticeIds"
                                label={
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <TeamOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
                                        <span>默认通知对象</span>
                                    </div>
                                }
                                tooltip="默认接收告警通知的对象"
                                rules={[{ required: true, message: "请选择默认通知对象" }]}
                            >
                                <Select
                                    mode="multiple"
                                    allowClear
                                    placeholder="选择通知对象"
                                    options={noticeOptions}
                                    disabled={!editable}
                                    style={{ width: "100%" }}
                                    optionFilterProp="label"
                                    showSearch
                                    tagRender={(props) => (
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "0 8px",
                                                backgroundColor: "#e6f4ff",
                                                borderRadius: "4px",
                                                marginRight: "4px",
                                                lineHeight: "22px",
                                            }}
                                        >
                                            {props.label}
                                        </span>
                                    )}
                                />
                            </MyFormItem>

                            <div style={{marginBottom: '16px', marginTop: '-8px'}}>
                                <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                    <ClockCircleOutlined style={{ marginRight: "8px", color: "#faad14" }} />
                                    <Text>重复通知间隔</Text>
                                    <Tooltip title="告警持续存在时，重复发送通知的时间间隔，按告警级别配置">
                                        <InfoCircleOutlined style={{ color: "#8c8c8c", marginLeft: "8px" }} />
                                    </Tooltip>
                                </div>
                                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                    {[
                                        { level: "P0" },
                                        { level: "P1" },
                                        { level: "P2" },
                                    ].map((item) => (
                                        <div key={item.level} style={{ flex: "1 1 200px", minWidth: "200px" }}>
                                            <MyFormItem
                                                name={["repeatNoticeInterval", item.level]}
                                                noStyle
                                                rules={[
                                                    { 
                                                        required: true, 
                                                        message: `请输入${item.level}的重复通知间隔` 
                                                    }
                                                ]}
                                            >
                                                <Input
                                                    type="number"
                                                    addonBefore={item.level}
                                                    addonAfter="分钟"
                                                    placeholder="请输入间隔时间"
                                                    min={1}
                                                    disabled={!editable}
                                                    style={{ borderRadius: "6px" }}
                                                    onChange={(e) => {
                                                        const value = e.target.value
                                                        if (value !== "" && !/^\d+$/.test(value)) {
                                                            e.target.value = value.replace(/\D/g, "")
                                                        }
                                                    }}
                                                />
                                            </MyFormItem>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <MyFormItem
                                name="recoverWaitTime"
                                label={
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                        <ClockCircleOutlined style={{ marginRight: "8px", color: "#52c41a" }} />
                                        <span>恢复等待时间</span>
                                    </div>
                                }
                                tooltip="告警恢复后，等待多长时间确认不再触发才发送恢复通知"
                                rules={[{ required: true, message: "请输入恢复等待时间" }]}
                            >
                                <Input
                                    type="number"
                                    addonAfter="秒"
                                    placeholder="请输入等待时间，如 1"
                                    min={1}
                                    disabled={!editable}
                                    style={{ borderRadius: "6px" }}
                                />
                            </MyFormItem>

                            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                <MyFormItem name="recoverNotify" valuePropName="checked" noStyle>
                                    <Switch disabled={!editable} />
                                </MyFormItem>
                                <Text style={{ marginLeft: "12px" }}>启用恢复通知</Text>
                                <Tooltip title="当告警恢复时，是否发送恢复通知">
                                    <InfoCircleOutlined style={{ color: "#8c8c8c", marginLeft: "8px" }} />
                                </Tooltip>
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} lg={16}>
                        <div
                            style={{
                                padding: "24px",
                                background: "#fff",
                                borderRadius: "12px",
                                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
                                border: "1px solid #f0f0f0",
                                minHeight: "300px"
                            }}
                        >
                            <div style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                marginBottom: "16px",
                                paddingBottom: "16px",
                                borderBottom: "1px solid #f0f0f0",
                            }}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <TagOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
                                    <Text strong>告警路由</Text>
                                    <Tooltip title="根据 Metric 标签路由到相应的通知对象">
                                        <InfoCircleOutlined style={{ color: "#8c8c8c", marginLeft: "8px" }} />
                                    </Tooltip>
                                </div>
                                {editable && (
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={addLabel}
                                        size="small"
                                        style={{ backgroundColor: '#000', borderColor: '#000' }}
                                    >
                                        添加路由
                                    </Button>
                                )}
                            </div>

                            <Paragraph style={{ marginBottom: "16px" }}>
                                <Text type="secondary">
                                    告警路由可以根据标签将告警发送给特定的通知对象，优先级高于默认通知对象
                                </Text>
                            </Paragraph>

                            <MyFormItemGroup prefix={["noticeRoutes"]}>
                                {noticeLabels.length > 0 ? (
                                    <div style={{ marginBottom: "16px" }}>
                                        <Row gutter={16}>
                                            <Col span={6}>
                                                <Text >标签 Key</Text>
                                            </Col>
                                            <Col span={6}>
                                                <Text >标签 Value</Text>
                                            </Col>
                                            <Col span={9}>
                                                <Text >通知对象</Text>
                                            </Col>
                                            <Col span={3}>
                                                <Text >操作</Text>
                                            </Col>
                                        </Row>
                                    </div>
                                ) : (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="暂无告警路由配置"
                                        style={{ margin: "40px 0" }}
                                    />
                                )}

                                {noticeLabels?.map((label, index) => (
                                    <div key={index} style={{ marginBottom: "16px" }}>
                                        <Row gutter={16} align="middle">
                                            <Col span={6}>
                                                <Input
                                                    name={`[${index}].key`}
                                                    placeholder="输入标签 Key"
                                                    value={label.key}
                                                    onChange={(e) => updateLabel(index, "key", e.target.value)}
                                                    disabled={!editable}
                                                    style={{ borderRadius: "6px" }}
                                                />
                                            </Col>
                                            <Col span={6}>
                                                <Input
                                                    name={`[${index}].value`}
                                                    placeholder="输入标签 Value"
                                                    value={label.value}
                                                    onChange={(e) => updateLabel(index, "value", e.target.value)}
                                                    disabled={!editable}
                                                    style={{ borderRadius: "6px" }}
                                                />
                                            </Col>
                                            <Col span={9}>
                                                <Select
                                                    mode="multiple"
                                                    name={`[${index}].noticeIds`}
                                                    placeholder="选择通知对象"
                                                    allowClear
                                                    options={noticeOptions}
                                                    value={label.noticeIds}
                                                    onChange={(value) => updateLabel(index, "noticeIds", value)}
                                                    disabled={!editable}
                                                    style={{ width: "100%", borderRadius: "6px" }}
                                                    optionFilterProp="label"
                                                    showSearch
                                                />
                                            </Col>
                                            <Col span={3}>
                                                {editable && (
                                                    <Button
                                                        danger
                                                        icon={<MinusOutlined />}
                                                        onClick={() => removeLabel(index)}
                                                        style={{ borderRadius: "6px" }}
                                                    />
                                                )}
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </MyFormItemGroup>
                        </div>
                    </Col>
                </Row>
            </Form>

            <style jsx>{`
                .notify-config-container .ant-form-item-label > label {
                    color: #262626;
                }
                
                .notify-config-container .ant-input-number-group-wrapper {
                    width: 100%;
                }
                
                .notify-config-container .ant-select-selection-item {
                    border-radius: 4px;
                }
                
                .notify-config-container .form-editable .ant-input,
                .notify-config-container .form-editable .ant-select-selector {
                    background-color: #ffffff;
                    border-color: #d9d9d9;
                }
                
                .notify-config-container .form-editable .ant-input:hover,
                .notify-config-container .form-editable .ant-select-selector:hover {
                    border-color: #40a9ff;
                }
                
                .notify-config-container .ant-form-item {
                    margin-bottom: 24px;
                }
                
                .notify-config-container .ant-form-item:last-child {
                    margin-bottom: 0;
                }
            `}</style>
        </div>
    )
}