"use client"

import { useState, useEffect, createContext, useContext, useCallback } from "react"
import {
    Input,
    Button,
    Select,
    Tooltip,
    Switch,
    Form,
    Typography,
    Space,
    Empty,
    message,
    Spin,
    Tag,
    Radio
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
    BlockOutlined,
    ThunderboltOutlined,
    ArrowRightOutlined
} from "@ant-design/icons"
import { FaultCenterSearch, FaultCenterUpdate, FaultCenterReset } from "../../api/faultCenter"
import { useParams } from "react-router-dom"
import { getNoticeList } from "../../api/notice"
import { AlarmUpgrade } from "./upgrade";

const { Title, Text } = Typography
const { Option } = Select

// Form context for nested fields
const MyFormItemContext = createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// Form item component
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

// 左侧配置菜单分组定义
const MENU_GROUPS = [
    {
        group: "通知设置",
        items: [
            { key: "basic", label: "基本配置", icon: <SettingOutlined /> },
            { key: "routes", label: "通知路由", icon: <TagOutlined /> },
        ],
    },
    {
        group: "故障处理",
        items: [
            { key: "aggregation", label: "告警聚合", icon: <BlockOutlined /> },
            { key: "upgrade", label: "告警升级", icon: <ThunderboltOutlined /> },
        ],
    },
]

export const FaultCenterNotify = () => {
    const { id } = useParams()
    const [form] = Form.useForm()
    const [detail, setDetail] = useState({})
    const [selectedAggregationType, setSelectedAggregationType] = useState("None")
    const [noticeOptions, setNoticeOptions] = useState([])
    const [basicEditable, setBasicEditable] = useState(false)
    const [editingRouteIndex, setEditingRouteIndex] = useState(null) // 当前正在编辑的路由规则下标（null = 浏览态）
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [selectedKey, setSelectedKey] = useState("basic")
    // 通知路由数据（供展示模式直接渲染，不依赖 Form.List 挂载时机）
    const [routesData, setRoutesData] = useState([])

    // 告警升级面板的编辑控件（由 AlarmUpgrade 通过 onControls 暴露，按钮渲染在面板头部）
    const [upgradeControls, setUpgradeControls] = useState(null)
    const handleUpgradeControls = useCallback((controls) => setUpgradeControls(controls), [])

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
            setSelectedAggregationType(data?.aggregationType || "None")

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
            setRoutesData(routes)
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

    // 进入某条路由规则的编辑模式（按卡片选择性编辑，而非全部规则同时进入编辑）
    const handleRouteEdit = (routeIndex) => {
        // 注入完整数据，确保 Form.List 挂载时能从 store 初始化
        form.setFieldsValue({ noticeRoutes: routesData })
        setEditingRouteIndex(routeIndex)
    }

    // 取消某条路由规则的编辑
    const handleRouteCancel = () => {
        setEditingRouteIndex(null)
        handleList()
    }

    // 新增路由规则
    const handleRouteAdd = () => {
        const next = [
            ...routesData,
            { labels: [{ key: "", operator: "==", value: "" }], noticeIds: [] },
        ]
        form.setFieldsValue({ noticeRoutes: next })
        setRoutesData(next)
        setEditingRouteIndex(next.length - 1)
    }

    // 移除某条路由规则
    const handleRouteRemove = (routeIndex) => {
        const rest = routesData.filter((_, i) => i !== routeIndex)
        form.setFieldsValue({ noticeRoutes: rest })
        setRoutesData(rest)
        setEditingRouteIndex(null)
    }

    // 构造更新参数（getFieldsValue(true) 返回完整 store，含未挂载面板的保留值）
    const buildUpdateParams = (values) => ({
        ...detail,
        ...values,
        noticeRoutes: (values.noticeRoutes || []).map((route) => ({
            noticeIds: route.noticeIds,
            labels: route.labels,
        })),
        repeatNoticeInterval: Object.entries(values.repeatNoticeInterval || {}).reduce((acc, [key, value]) => {
            acc[key] = Number(value)
            return acc
        }, {}),
        recoverWaitTime: Number(values.recoverWaitTime) || 1,
    })

    const syncRoutesData = (values) => {
        setRoutesData(
            (values.noticeRoutes || []).map((route) => ({
                noticeIds: route.noticeIds,
                labels: route.labels,
            })),
        )
    }

    // Save changes（基本配置面板）
    const handleSave = async () => {
        try {
            setSaving(true)
            await form.validateFields(["noticeIds", "repeatNoticeInterval", "recoverNotify", "recoverWaitTime"])

            const values = form.getFieldsValue(true)
            await FaultCenterUpdate(buildUpdateParams(values))
            syncRoutesData(values)
            setBasicEditable(false)
        } catch (error) {
            console.error("Save failed:", error)
        } finally {
            setSaving(false)
        }
    }

    // Save changes（单条路由规则）
    const handleRouteSave = async (routeIndex) => {
        try {
            setSaving(true)
            await form.validateFields([["noticeRoutes", routeIndex]])

            const values = form.getFieldsValue(true)
            const route = (values.noticeRoutes || [])[routeIndex] || {}
            const labels = route.labels || []
            if (
                labels.some((label) => !label.key || !label.value) ||
                !route.noticeIds ||
                route.noticeIds.length === 0
            ) {
                message.error("路由规则配置不完整，请检查匹配条件与通知对象")
                setSaving(false)
                return
            }

            await FaultCenterUpdate(buildUpdateParams(values))
            message.success("保存成功")
            syncRoutesData(values)
            setEditingRouteIndex(null)
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

    // 处理聚合模式变化
    const handleAggregationModeChange = async (e) => {
        setSelectedAggregationType(e.target.value)
        const params = {
            id,
            aggregationType: e.target.value,
        }
        await FaultCenterReset(params);
    };

    // 切换左侧菜单项（若正在编辑则先取消编辑并还原数据）
    const handleMenuClick = (key) => {
        if (key === selectedKey) return
        if (basicEditable) {
            handleCancel()
        }
        if (editingRouteIndex !== null) {
            handleRouteCancel()
        }
        if (selectedKey === "upgrade" && upgradeControls?.editable) {
            upgradeControls.cancel()
        }
        setSelectedKey(key)
    }

    const radioOptions = [
        {
            label: '规则聚合',
            value: 'Rule',
        },
        {
            label: '不聚合',
            value: 'None',
        },
    ];

    // 各配置面板的标题与描述
    const panelMeta = {
        aggregation: {
            icon: <BlockOutlined />,
            title: "告警聚合",
            desc: "定义故障通知的聚合规则，相同规则的告警将合并为一条故障通知，避免重复打扰",
        },
        upgrade: {
            icon: <ThunderboltOutlined />,
            title: "告警升级",
            desc: "配置告警认领超时后的自动升级策略，确保告警无人处理时及时通知上级",
        },
        basic: {
            icon: <SettingOutlined />,
            title: "基本配置",
            desc: "配置默认通知对象、重复通知间隔与恢复通知等基础参数",
        },
        routes: {
            icon: <TagOutlined />,
            title: "通知路由",
            desc: "根据告警标签将告警路由到特定的通知对象，优先级高于默认通知对象",
        },
    }

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "400px" }}>
                <Spin size="large" tip="加载中..." />
            </div>
        )
    }

    // 面板头部右侧工具栏
    const renderToolbar = () => {
        if (selectedKey === "basic") {
            return basicEditable ? (
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
                    <Button size="small" icon={<CloseOutlined />} onClick={handleCancel}>
                        取消
                    </Button>
                </Space>
            ) : (
                <Button type="text" icon={<EditOutlined />} onClick={toggleBasicEdit} size="small">
                    编辑
                </Button>
            )
        }
        // 通知路由为按卡片编辑，按钮在各卡片头部，面板工具栏不渲染
        if (selectedKey === "routes") {
            return null
        }
        if (selectedKey === "upgrade") {
            if (!upgradeControls) return null
            return upgradeControls.editable ? (
                <Space size="small">
                    <Button
                        type="primary"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={upgradeControls.save}
                        loading={upgradeControls.saving}
                        style={{ backgroundColor: '#000', borderColor: '#000' }}
                    >
                        保存
                    </Button>
                    <Button size="small" icon={<CloseOutlined />} onClick={upgradeControls.cancel}>
                        取消
                    </Button>
                </Space>
            ) : (
                <Button type="text" icon={<EditOutlined />} onClick={upgradeControls.edit} size="small">
                    编辑
                </Button>
            )
        }
        return null
    }

    // 左侧菜单
    const renderSideMenu = () => (
        <div
            style={{
                width: 200,
                flexShrink: 0,
                position: "sticky",
                top: 16,
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #f0f0f0",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                padding: "8px 8px 12px",
                alignSelf: "flex-start",
            }}
        >
            {MENU_GROUPS.map((group) => (
                <div key={group.group}>
                    <div
                        style={{
                            fontSize: 12,
                            color: "#8c8c8c",
                            padding: "10px 12px 6px",
                        }}
                    >
                        {group.group}
                    </div>
                    {group.items.map((item) => {
                        const isSelected = item.key === selectedKey
                        return (
                            <div
                                key={item.key}
                                onClick={() => handleMenuClick(item.key)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    padding: "8px 12px",
                                    borderRadius: 8,
                                    cursor: "pointer",
                                    fontSize: 13,
                                    marginBottom: 2,
                                    color: isSelected ? "#1f1f1f" : "#595959",
                                    fontWeight: isSelected ? 600 : 400,
                                    backgroundColor: isSelected ? "#f5f5f5" : "transparent",
                                    transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = "#fafafa"
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = "transparent"
                                }}
                            >
                                <span>
                                    <span style={{ marginRight: 8 }}>{item.icon}</span>
                                    {item.label}
                                </span>
                            </div>
                        )
                    })}
                </div>
            ))}
        </div>
    )

    return (
        <div className="notify-config-container" style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {renderSideMenu()}

            {/* 右侧内容面板 */}
            <Form
                form={form}
                layout="vertical"
                requiredMark="optional"
                className={basicEditable || editingRouteIndex !== null ? "form-editable" : ""}
                style={{ flex: 1, minWidth: 0 }}
            >
                <div
                    style={{
                        background: "#fff",
                        borderRadius: 12,
                        border: "1px solid #f0f0f0",
                        boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02)",
                        padding: 24,
                        minHeight: 480,
                    }}
                >
                    {/* 面板头部 */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                            gap: 16,
                            marginBottom: 20,
                            paddingBottom: 16,
                            borderBottom: "1px solid #f0f0f0",
                        }}
                    >
                        <div>
                            <Title level={4} style={{ margin: 0, fontSize: 16, marginBottom: 4 }}>
                                {panelMeta[selectedKey].icon}
                                <span style={{ marginLeft: 10 }}>{panelMeta[selectedKey].title}</span>
                            </Title>
                            <Text type="secondary" style={{ fontSize: 13 }}>
                                {panelMeta[selectedKey].desc}
                            </Text>
                        </div>
                        <div style={{ flexShrink: 0 }}>{renderToolbar()}</div>
                    </div>

                    {/* 告警聚合面板 */}
                    {selectedKey === "aggregation" && (
                        <div style={{ maxWidth: 480 }}>
                            <Radio.Group
                                block
                                options={radioOptions}
                                value={selectedAggregationType}
                                onChange={handleAggregationModeChange}
                            />
                            <div style={{ marginTop: 16 }}>
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    <BellOutlined style={{ marginRight: 6 }} />
                                    选择「规则聚合」时，相同规则持续触发的告警将合并为一条故障；切换后立即生效
                                </Text>
                            </div>
                        </div>
                    )}

                    {/* 告警升级面板 */}
                    {selectedKey === "upgrade" && (
                        <AlarmUpgrade hideToolbar onControls={handleUpgradeControls} />
                    )}

                    {/* 基本配置面板 */}
                    {selectedKey === "basic" && (
                        <>
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

                            <div style={{ marginBottom: 16 }}>
                                <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                                    <ClockCircleOutlined style={{ marginRight: 8, color: "#faad14" }} />
                                    <Text>重复通知间隔</Text>
                                    <Tooltip title="告警持续存在时，重复发送通知的时间间隔，按告警级别配置">
                                        <InfoCircleOutlined style={{ color: "#8c8c8c", marginLeft: 8 }} />
                                    </Tooltip>
                                </div>
                                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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

                            <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                                <MyFormItem name="recoverNotify" valuePropName="checked" noStyle>
                                    <Switch disabled={!basicEditable} />
                                </MyFormItem>
                                <Text style={{ marginLeft: 12 }}>启用恢复通知</Text>
                                <Tooltip title="当告警恢复时，是否发送恢复通知">
                                    <InfoCircleOutlined style={{ color: "#8c8c8c", marginLeft: 8 }} />
                                </Tooltip>
                            </div>
                        </>
                    )}

                    {/* 通知路由面板 */}
                    {selectedKey === "routes" && (
                        <>
                            {/* 展示模式：直接由 routesData 渲染，正在编辑的卡片由下方编辑卡片替代 */}
                            {routesData.map((route, routeIndex) => (routeIndex === editingRouteIndex ? null : (
                                        <div
                                            key={routeIndex}
                                            style={{
                                                marginBottom: 16,
                                                border: "1px solid #e8e8e8",
                                                borderRadius: 10,
                                                overflow: "hidden",
                                            }}
                                        >
                                            {/* 卡片头 */}
                                            <div
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "space-between",
                                                    padding: "10px 16px",
                                                    background: "#fafafa",
                                                    borderBottom: "1px solid #f0f0f0",
                                                }}
                                            >
                                                <span style={{ fontSize: 13, fontWeight: 600, color: "#262626" }}>
                                                    <TagOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                                                    路由规则 {routeIndex + 1}
                                                </span>
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EditOutlined />}
                                                    onClick={() => handleRouteEdit(routeIndex)}
                                                >
                                                    编辑
                                                </Button>
                                            </div>
                                            <div style={{ padding: 16 }}>
                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "flex-start",
                                                        gap: 16,
                                                        flexWrap: "wrap",
                                                    }}
                                                >
                                                    {/* 匹配条件 */}
                                                    <div style={{ flex: 1, minWidth: 260 }}>
                                                        <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 8 }}>
                                                            匹配条件
                                                        </div>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                            {(route.labels || []).filter((l) => l.key).map((label, idx) => (
                                                                <Tag key={idx} color="blue" style={{ borderRadius: 4 }}>
                                                                    {label.key} {label.operator} {label.value}
                                                                </Tag>
                                                            ))}
                                                            {(route.labels || []).filter((l) => l.key).length === 0 && (
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    任意告警
                                                                </Text>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* 流转箭头 */}
                                                    <ArrowRightOutlined
                                                        style={{ color: "#bfbfbf", fontSize: 16, marginTop: 22, flexShrink: 0 }}
                                                    />

                                                    {/* 通知对象 */}
                                                    <div style={{ flex: 1, minWidth: 200 }}>
                                                        <div style={{ fontSize: 12, color: "#8c8c8c", marginBottom: 8 }}>
                                                            通知对象
                                                        </div>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                                                            {(route.noticeIds || []).map((nid, nidIndex) => (
                                                                <Tag key={`${nid}-${nidIndex}`} color="geekblue" style={{ borderRadius: 4 }}>
                                                                    {noticeOptions.find((o) => o.value === nid)?.label || nid}
                                                                </Tag>
                                                            ))}
                                                            {(route.noticeIds || []).length === 0 && (
                                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                                    未设置
                                                                </Text>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )))}

                                    {routesData.length === 0 && editingRouteIndex === null && (
                                        <Empty
                                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                                            description={
                                                <span>
                                                    <Text strong>暂无通知路由</Text>
                                                    <br />
                                                    <Text type="secondary" style={{ fontSize: 13 }}>
                                                        点击下方「添加路由规则」新增路由规则
                                                    </Text>
                                                </span>
                                            }
                                            style={{ margin: "48px 0" }}
                                        />
                                    )}

                                    {/* 编辑中的路由规则卡片（仅渲染当前编辑的那一条） */}
                                    {editingRouteIndex !== null && (
                                        <Form.List name="noticeRoutes">
                                            {(fields) => {
                                                const editingField = fields.find(({ name }) => name === editingRouteIndex)
                                                if (!editingField) return null
                                                const { key, name, ...restField } = editingField
                                                return (
                                                <div
                                                    key={key}
                                                    style={{
                                                        marginBottom: 16,
                                                        border: "1px solid #e8e8e8",
                                                        borderRadius: 10,
                                                        overflow: "hidden",
                                                    }}
                                                >
                                                    {/* 卡片头 */}
                                                    <div
                                                        style={{
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "space-between",
                                                            padding: "10px 16px",
                                                            background: "#fafafa",
                                                            borderBottom: "1px solid #f0f0f0",
                                                        }}
                                                    >
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: "#262626" }}>
                                                            <TagOutlined style={{ marginRight: 8, color: "#1677ff" }} />
                                                            路由规则 {editingRouteIndex + 1}
                                                        </span>
                                                        <Space size="small">
                                                            <Button
                                                                type="text"
                                                                danger
                                                                size="small"
                                                                icon={<MinusCircleOutlined />}
                                                                onClick={() => handleRouteRemove(editingRouteIndex)}
                                                            >
                                                                移除规则
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                icon={<CloseOutlined />}
                                                                onClick={() => handleRouteCancel()}
                                                            >
                                                                取消
                                                            </Button>
                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                icon={<CheckOutlined />}
                                                                onClick={() => handleRouteSave(editingRouteIndex)}
                                                                loading={saving}
                                                                style={{ backgroundColor: '#000', borderColor: '#000' }}
                                                            >
                                                                保存
                                                            </Button>
                                                        </Space>
                                                    </div>

                                                    <div style={{ padding: 16 }}>
                                                        {/* 匹配条件 */}
                                                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                                                            <Text strong style={{ fontSize: 13 }}>匹配条件</Text>
                                                            <Tooltip title="根据告警携带的标签进行匹配">
                                                                <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                                                            </Tooltip>
                                                        </div>
                                                        <Form.List name={[name, "labels"]}>
                                                            {(labelFields, { add: addLabel, remove: removeLabel }) => (
                                                                <>
                                                                    {labelFields.map((labelField, labelIndex) => (
                                                                        <div
                                                                            key={labelField.key}
                                                                            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
                                                                        >
                                                                            {/* 标签 Key */}
                                                                            <Form.Item
                                                                                name={[labelField.name, "key"]}
                                                                                rules={[{ required: true, message: "请输入" }]}
                                                                                noStyle
                                                                                normalize={(value) => value?.replace(/\s/g, "")}
                                                                            >
                                                                                <Input
                                                                                    placeholder="标签 Key"
                                                                                    style={{ flex: "0 0 140px", borderRadius: "6px" }}
                                                                                />
                                                                            </Form.Item>

                                                                            {/* 操作符 */}
                                                                            <Form.Item
                                                                                name={[labelField.name, "operator"]}
                                                                                rules={[{ required: true, message: "请选择" }]}
                                                                                noStyle
                                                                            >
                                                                                <Select style={{ width: 80 }}>
                                                                                    <Option value="==">==</Option>
                                                                                    <Option value="=~">=~</Option>
                                                                                    <Option value="!=">!=</Option>
                                                                                    <Option value="!~">!~</Option>
                                                                                </Select>
                                                                            </Form.Item>

                                                                            {/* 标签 Value */}
                                                                            <Form.Item
                                                                                name={[labelField.name, "value"]}
                                                                                rules={[{ required: true, message: "请输入" }]}
                                                                                noStyle
                                                                                normalize={(value) => value?.replace(/\s/g, "")}
                                                                            >
                                                                                <Input
                                                                                    placeholder="标签 Value"
                                                                                    style={{ flex: 1, borderRadius: "6px" }}
                                                                                />
                                                                            </Form.Item>

                                                                            {/* 删除条件 */}
                                                                            {labelFields.length > 1 && (
                                                                                <MinusCircleOutlined
                                                                                    onClick={() => removeLabel(labelField.name)}
                                                                                    style={{ color: "#ff4d4f", cursor: "pointer", fontSize: 16, flexShrink: 0 }}
                                                                                />
                                                                            )}
                                                                        </div>
                                                                    ))}

                                                                    <Button
                                                                        type="dashed"
                                                                        size="small"
                                                                        onClick={() => addLabel({ key: "", operator: "==", value: "" })}
                                                                        icon={<PlusOutlined />}
                                                                        style={{ width: "100%" }}
                                                                    >
                                                                        添加条件
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </Form.List>

                                                        {/* 通知对象 */}
                                                        <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed #e8e8e8" }}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                                                                <TeamOutlined style={{ color: "#1677ff" }} />
                                                                <Text strong style={{ fontSize: 13 }}>通知对象</Text>
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
                                                                    style={{ width: "100%", borderRadius: "6px" }}
                                                                    optionFilterProp="label"
                                                                    showSearch
                                                                />
                                                            </Form.Item>
                                                        </div>
                                                    </div>
                                                </div>
                                                )
                                            }}
                                        </Form.List>
                                    )}

                                    {/* 添加路由规则 */}
                                    {editingRouteIndex === null && (
                                        <div
                                            onClick={handleRouteAdd}
                                            style={{
                                                border: "2px dashed #d9d9d9",
                                                borderRadius: 10,
                                                padding: 16,
                                                textAlign: "center",
                                                cursor: "pointer",
                                                transition: "all 0.3s",
                                                background: "#fafafa",
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
                                            <PlusOutlined style={{ color: "#8c8c8c", fontSize: 18, marginRight: 8 }} />
                                            <Text style={{ color: "#8c8c8c" }}>添加路由规则</Text>
                                        </div>
                                    )}
                        </>
                    )}
                </div>
            </Form>

            <style>{`
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
