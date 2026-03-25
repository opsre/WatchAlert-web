"use client"

import { useState, useEffect, createContext, useContext, useMemo, useCallback } from "react"
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
    Tag,
} from "antd"
import {
    EditOutlined,
    CheckOutlined,
    CloseOutlined,
    BellOutlined,
    PlusOutlined,
    MinusCircleOutlined,
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
const { Option } = Select

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
    const [basicEditable, setBasicEditable] = useState(false)
    const [routeEditable, setRouteEditable] = useState(false)
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

            // 处理 noticeRoutes 数据，兼容旧数据和新的 labels 格式
            const routes = (data.noticeRoutes || []).map((route) => {
                // 如果是新的 labels 格式
                if (route.labels && Array.isArray(route.labels)) {
                    return {
                        ...route,
                        labels: route.labels.map(label => ({
                            key: label.key || "",
                            operator: label.operator || "==",
                            value: label.value || ""
                        }))
                    }
                }
                // 兼容旧的扁平格式：key/operator/value
                return {
                    ...route,
                    labels: route.key ? [{ key: route.key, operator: route.operator || "==", value: route.value || "" }] : []
                }
            })

            // Set form values
            form.setFieldsValue({
                noticeIds: data.noticeIds,
                repeatNoticeInterval: repeatNoticeInterval,
                recoverNotify: data.recoverNotify,
                alarmAggregation: data.alarmAggregation,
                recoverWaitTime: data.recoverWaitTime,
                noticeRoutes: routes.length > 0 ? routes : [],
            })
        } catch (error) {
            console.error("Failed to fetch data:", error)
            message.error("获取通知配置失败")
        } finally {
            setLoading(false)
        }
    }

    // Toggle basic config edit mode
    const toggleBasicEdit = () => {
        setBasicEditable(!basicEditable)
    }

    // Toggle route edit mode
    const toggleRouteEdit = () => {
        setRouteEditable(!routeEditable)
    }

    // Save changes
    const handleSave = async () => {
        try {
            setSaving(true)

            // 验证当前正在编辑的部分
            if (basicEditable) {
                await form.validateFields(["noticeIds", "repeatNoticeInterval", "recoverNotify", "recoverWaitTime"])
            }
            if (routeEditable) {
                await form.validateFields(["noticeRoutes"])
            }

            const values = form.getFieldsValue()

            // Validate noticeRoutes
            const noticeRoutes = values.noticeRoutes || []
            const hasEmptyFields = noticeRoutes.some(
                (route) => {
                    const labels = route.labels || []
                    const hasEmptyLabels = labels.some(label => !label.key || !label.value)
                    return hasEmptyLabels || !route.noticeIds || route.noticeIds.length === 0
                },
            )

            if (noticeRoutes.length > 0 && hasEmptyFields) {
                message.error("告警路由配置不完整，请检查所有字段")
                setSaving(false)
                return
            }

            // 处理 noticeRoutes，移除旧的 key/value 字段，只保留 labels
            const processedRoutes = noticeRoutes.map(route => ({
                noticeIds: route.noticeIds,
                labels: route.labels
            }))

            const params = {
                ...detail,
                ...values,
                noticeRoutes: processedRoutes,
                repeatNoticeInterval: Object.entries(values.repeatNoticeInterval).reduce((acc, [key, value]) => {
                    acc[key] = Number(value)
                    return acc
                }, {}),
                recoverWaitTime: Number(values.recoverWaitTime) || 1,
            }

            await FaultCenterUpdate(params)
            setBasicEditable(false)
            setRouteEditable(false)
        } catch (error) {
            console.error("Save failed:", error)
            message.error("保存失败")
        } finally {
            setSaving(false)
        }
    }

    // Cancel editing
    const handleCancel = () => {
        setBasicEditable(false)
        setRouteEditable(false)
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
                <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                    <BellOutlined style={{ marginRight: "12px" }} />
                    通知配置
                </Title>
                <Text type="secondary">配置告警通知规则，确保告警信息能够及时送达相关人员</Text>
            </div>

            <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                className={(basicEditable || routeEditable) ? "form-editable" : ""}
            >
                <Row gutter={24}>
                    <Col xs={24} lg={7}>
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
                                justifyContent: "space-between",
                                marginBottom: "16px",
                                paddingBottom: "16px",
                                borderBottom: "1px solid #f0f0f0"
                            }}>
                                <div>
                                    <SettingOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
                                    <Text strong>基本配置</Text>
                                </div>
                                {basicEditable ? (
                                    <Space size="small">
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<CheckOutlined />}
                                            onClick={handleSave}
                                            loading={saving}
                                            style={{ backgroundColor: '#000', borderColor: '#000' }}
                                        >
                                            保存
                                        </Button>
                                        <Button
                                            size="small"
                                            icon={<CloseOutlined />}
                                            onClick={handleCancel}
                                        >
                                            取消
                                        </Button>
                                    </Space>
                                ) : (
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={toggleBasicEdit}
                                        size="small"
                                    >
                                        编辑
                                    </Button>
                                )}
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
                                    disabled={!basicEditable}
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
                                                    disabled={!basicEditable}
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
                                    disabled={!basicEditable}
                                    style={{ borderRadius: "6px" }}
                                />
                            </MyFormItem>

                            <div style={{ display: "flex", alignItems: "center", marginBottom: "8px" }}>
                                <MyFormItem name="recoverNotify" valuePropName="checked" noStyle>
                                    <Switch disabled={!basicEditable} />
                                </MyFormItem>
                                <Text style={{ marginLeft: "12px" }}>启用恢复通知</Text>
                                <Tooltip title="当告警恢复时，是否发送恢复通知">
                                    <InfoCircleOutlined style={{ color: "#8c8c8c", marginLeft: "8px" }} />
                                </Tooltip>
                            </div>
                        </div>
                    </Col>

                    <Col xs={24} lg={17}>
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
                                <div>
                                    <TagOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
                                    <Text strong>告警路由</Text>
                                    <Tooltip title="根据 Metric 标签路由到相应的通知对象">
                                        <InfoCircleOutlined style={{ color: "#8c8c8c", marginLeft: "8px" }} />
                                    </Tooltip>
                                </div>
                                {routeEditable ? (
                                    <Space size="small">
                                        <Button
                                            type="primary"
                                            size="small"
                                            icon={<CheckOutlined />}
                                            onClick={handleSave}
                                            loading={saving}
                                            style={{ backgroundColor: '#000', borderColor: '#000' }}
                                        >
                                            保存
                                        </Button>
                                        <Button
                                            size="small"
                                            icon={<CloseOutlined />}
                                            onClick={handleCancel}
                                        >
                                            取消
                                        </Button>
                                    </Space>
                                ) : (
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={toggleRouteEdit}
                                        size="small"
                                    >
                                        编辑
                                    </Button>
                                )}
                            </div>

                            <Paragraph style={{ marginBottom: "16px" }}>
                                <Text type="secondary">
                                    告警路由可以根据标签将告警发送给特定的通知对象，优先级高于默认通知对象
                                </Text>
                            </Paragraph>

                            <Form.List name="noticeRoutes">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, routeIndex) => {
                                            const labels = form.getFieldValue(["noticeRoutes", name, "labels"]) || []

                                            return (
                                                <div key={key} style={{ marginBottom: "16px" }}>
                                                    <div
                                                        style={{
                                                            padding: "16px",
                                                            borderRadius: "12px",
                                                            border: "1px solid #e8e8e8",
                                                        }}
                                                    >
                                                        {/* 非编辑模式：使用 Tag 展示条件 */}
                                                        {!routeEditable && labels.length > 0 && (
                                                            <div style={{ marginBottom: "16px" }}>
                                                                <div style={{ marginBottom: "8px" }}>
                                                                    <Text type="secondary" style={{ fontSize: "12px" }}>匹配条件</Text>
                                                                </div>
                                                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                                                    {labels.filter(l => l.key).map((label, idx) => (
                                                                        <Tag
                                                                            key={idx}
                                                                            color="blue"
                                                                            style={{
                                                                                padding: "4px 10px",
                                                                                borderRadius: "4px",
                                                                                fontSize: "13px",
                                                                                fontFamily: "monospace"
                                                                            }}
                                                                        >
                                                                            {label.key} {label.operator} {label.value}
                                                                        </Tag>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* 编辑模式：显示条件编辑区域 */}
                                                        {routeEditable && (
                                                            <div style={{ marginBottom: "16px" }}>
                                                                <Form.List name={[name, "labels"]}>
                                                                {(labelFields, { add: addLabel, remove: removeLabel }) => (
                                                                    <>
                                                                        {labelFields.map((labelField, labelIndex) => (
                                                                            <div key={labelField.key} style={{
                                                                                display: "flex",
                                                                                alignItems: "center",
                                                                                marginBottom: labelIndex < labelFields.length - 1 ? "12px" : "0",
                                                                                gap: "8px"
                                                                            }}>
                                                                                {/* 标签 Key */}
                                                                                <Form.Item
                                                                                    {...labelField}
                                                                                    name={[labelField.name, "key"]}
                                                                                    rules={[{ required: true, message: "请输入" }]}
                                                                                    noStyle
                                                                                    style={{ flex: "0 0 120px" }}
                                                                                    normalize={(value) => value?.replace(/\s/g, "")}
                                                                                >
                                                                                    <Input
                                                                                        placeholder="标签 Key"
                                                                                        disabled={!routeEditable}
                                                                                        style={{ borderRadius: "6px" }}
                                                                                    />
                                                                                </Form.Item>

                                                                                {/* 操作符 */}
                                                                                <Form.Item
                                                                                    {...labelField}
                                                                                    name={[labelField.name, "operator"]}
                                                                                    rules={[{ required: true, message: "请选择" }]}
                                                                                    noStyle
                                                                                    style={{ flex: "0 0 70px" }}
                                                                                >
                                                                                    <Select
                                                                                        disabled={!routeEditable}
                                                                                        style={{ width: "20%" }}
                                                                                    >
                                                                                        <Option value="==">==</Option>
                                                                                        <Option value="=~">=~</Option>
                                                                                        <Option value="!=">!=</Option>
                                                                                        <Option value="!~">!~</Option>
                                                                                    </Select>
                                                                                </Form.Item>

                                                                                {/* 标签 Value */}
                                                                                <Form.Item
                                                                                    {...labelField}
                                                                                    name={[labelField.name, "value"]}
                                                                                    rules={[{ required: true, message: "请输入" }]}
                                                                                    noStyle
                                                                                    style={{ flex: 1 }}
                                                                                    normalize={(value) => value?.replace(/\s/g, "")}
                                                                                >
                                                                                    <Input
                                                                                        placeholder="标签 Value"
                                                                                        disabled={!routeEditable}
                                                                                        style={{ borderRadius: "6px" }}
                                                                                    />
                                                                                </Form.Item>

                                                                                {/* 删除条件按钮 */}
                                                                                {routeEditable && labelFields.length > 1 && (
                                                                                    <MinusCircleOutlined
                                                                                        onClick={() => removeLabel(labelField.name)}
                                                                                        style={{ color: "#ff4d4f", cursor: "pointer", fontSize: "16px", flexShrink: 0 }}
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        ))}

                                                                        {routeEditable && (
                                                                            <Button
                                                                                type="dashed"
                                                                                size="small"
                                                                                onClick={() => addLabel({ key: "", operator: "==", value: "" })}
                                                                                icon={<PlusOutlined />}
                                                                                style={{ marginTop: "8px", width: "100%" }}
                                                                            >
                                                                                添加条件
                                                                            </Button>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </Form.List>
                                                            </div>
                                                        )}

                                                        {/* 通知对象选择 */}
                                                        <div style={{
                                                            paddingTop: "12px",
                                                            borderTop: "1px dashed #e8e8e8",
                                                            display: "flex",
                                                            alignItems: "flex-start",
                                                            gap: "8px"
                                                        }}>
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    marginBottom: "8px"
                                                                }}>
                                                                    <TeamOutlined style={{ color: "#1677ff", marginRight: "6px" }} />
                                                                    <Text strong style={{ fontSize: "13px" }}>通知对象</Text>
                                                                </div>
                                                                <Form.Item
                                                                {...restField}
                                                                name={[name, "noticeIds"]}
                                                                rules={[{ required: true, message: "请选择通知对象" }]}
                                                                noStyle
                                                            >
                                                                <Select
                                                                    mode="multiple"
                                                                    placeholder="选择通知对象"
                                                                    allowClear
                                                                    options={noticeOptions}
                                                                    disabled={!routeEditable}
                                                                    style={{ width: "100%", borderRadius: "6px" }}
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
                                                            </Form.Item>
                                                            </div>
                                                            {routeEditable && (
                                                                <MinusCircleOutlined
                                                                    onClick={() => remove(name)}
                                                                    style={{ color: "#ff4d4f", cursor: "pointer", fontSize: "18px", marginTop: "35px" }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}

                                        {fields.length === 0 && !routeEditable && (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="暂无告警路由配置"
                                                style={{ margin: "40px 0" }}
                                            />
                                        )}

                                        {routeEditable && (
                                            <Form.Item style={{ marginTop: "8px" }}>
                                                <div
                                                    onClick={() => add({ labels: [{ key: "", operator: "==", value: "" }], noticeIds: [] })}
                                                    style={{
                                                        border: "2px dashed #d9d9d9",
                                                        borderRadius: "12px",
                                                        padding: "16px",
                                                        textAlign: "center",
                                                        cursor: "pointer",
                                                        transition: "all 0.3s",
                                                        background: "#fafafa"
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.borderColor = "#1677ff"
                                                        e.currentTarget.style.background = "#f0f5ff"
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.borderColor = "#d9d9d9"
                                                        e.currentTarget.style.background = "#fafafa"
                                                    }}
                                                >
                                                    <PlusOutlined style={{ color: "#8c8c8c", fontSize: "18px", marginRight: "8px" }} />
                                                    <Text style={{ color: "#8c8c8c" }}>添加路由规则</Text>
                                                </div>
                                            </Form.Item>
                                        )}
                                    </>
                                )}
                            </Form.List>
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