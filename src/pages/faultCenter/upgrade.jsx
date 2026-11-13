"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Input, Button, Select, Form, Typography, Space, Tooltip, Checkbox, Switch, Tag, Empty, message } from "antd"
import { FaultCenterSearch, FaultCenterUpdate } from "../../api/faultCenter"
import { useParams } from "react-router-dom"
import { getNoticeList } from "../../api/notice"
import {
    ClockCircleOutlined,
    BellOutlined,
    TeamOutlined,
    EditOutlined,
    SaveOutlined,
    CloseOutlined,
    InfoCircleOutlined
} from "@ant-design/icons"

const { Text } = Typography

export const AlarmUpgrade = ({ hideToolbar = false, onControls } = {}) => {
    const { id } = useParams()
    const [form] = Form.useForm()
    const [noticeOptions, setNoticeOptions] = useState([])
    const [editable, setEditable] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isUpgradeEnabled, setIsUpgradeEnabled] = useState(false)
    const [upgradableSeverity, setUpgradableSeverity] = useState([])
    const STRATEGY_TYPES = {
        CLAIM: 1,
        PROCESS: 2
    }
    const [faultCenterData, setFaultCenterData] = useState(null)

    useEffect(() => {
        Promise.all([handleList(), handleGetNoticeData()])
    }, [])

    const handleList = async () => {
        try {
            const res = await FaultCenterSearch({ id })
            if (res?.data) {
                setFaultCenterData(res?.data)
                const { isUpgradeEnabled, upgradeStrategy, upgradableSeverity = [] } = res?.data

                setIsUpgradeEnabled(isUpgradeEnabled)
                setUpgradableSeverity(upgradableSeverity)
                // Set form values
                form.setFieldsValue({
                    claimTimeout: upgradeStrategy.timeout,
                    claimRepeatInterval: upgradeStrategy.repeatInterval,
                    claimNoticeId: upgradeStrategy.noticeId,
                })
            }
        } catch (error) {
            console.error("Failed to fetch alarm upgrade config:", error)
        } finally {
            setSaving(false)
        }
    }

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

    const toggleEdit = () => {
        setEditable(!editable)
    }

    const handleSave = async () => {
        try {
            setSaving(true)
            const values = await form.getFieldsValue()

            if (isUpgradeEnabled) {
                if (!upgradableSeverity || upgradableSeverity.length === 0) {
                    message.error("请至少勾选一个适用等级")
                    setSaving(false)
                    return
                }
                await form.validateFields(["claimTimeout", "claimRepeatInterval", "claimNoticeId"])
            }

            const updatedConfig = {
                ...faultCenterData,
                isUpgradeEnabled: isUpgradeEnabled,
                upgradableSeverity: upgradableSeverity,
                upgradeStrategy: {
                    strategyType: STRATEGY_TYPES.CLAIM,
                    timeout: Number(values.claimTimeout),
                    repeatInterval: Number(values.claimRepeatInterval),
                    noticeId: values.claimNoticeId
                }
            }

            await FaultCenterUpdate({ id, ...updatedConfig })
            setEditable(false)
        } catch (error) {
            console.error("Save failed:", error)
        } finally {
            setSaving(false)
        }
    }

    const handleCancel = () => {
        handleList()
        setEditable(false)
    }

    // 将编辑控件暴露给外层面板头部（hideToolbar 时按钮由父组件渲染）
    // 用 ref 转发最新闭包：若直接把 handleSave 放进 [editable, saving] 依赖的 effect，
    // 开关/等级变化不会触发 effect 重跑，父组件拿到的 save 仍是旧状态闭包，
    // 会导致"开关打开 -> 保存 -> 刷新后开关仍为关闭"
    const controlsRef = useRef({})
    controlsRef.current = {
        editable,
        saving,
        edit: toggleEdit,
        save: handleSave,
        cancel: handleCancel,
    }

    const stableControls = useMemo(() => ({
        edit: () => controlsRef.current.edit(),
        save: () => controlsRef.current.save(),
        cancel: () => controlsRef.current.cancel(),
    }), [])

    useEffect(() => {
        if (onControls) {
            onControls({ editable, saving, ...stableControls })
        }
    }, [editable, saving, stableControls, onControls])

    const plainOptions = [
        { label: 'P0', value: 'P0' },
        { label: 'P1', value: 'P1' },
        { label: 'P2', value: 'P2' },
    ];

    return (
        <div>
            {/* 设置条：启用开关 + 适用等级 + 操作按钮 */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                    marginBottom: 24,
                    padding: "12px 16px",
                    background: "#fafafa",
                    borderRadius: 8,
                    border: "1px solid #f0f0f0",
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    {/* 启用开关 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Switch
                            checked={isUpgradeEnabled}
                            onChange={(v) => editable && setIsUpgradeEnabled(v)}
                            disabled={!editable}
                        />
                        <span style={{ fontSize: 14, fontWeight: 500 }}>启用告警升级</span>
                        <Tooltip title="开启后，适用等级的告警超过认领超时时间仍未被认领时，将自动升级并重复通知指定对象">
                            <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                        </Tooltip>
                        <Tag
                            color={isUpgradeEnabled ? "success" : "default"}
                            style={{ borderRadius: 4, marginRight: 0 }}
                        >
                            {isUpgradeEnabled ? "已启用" : "未启用"}
                        </Tag>
                    </div>

                    {/* 分隔线 */}
                    <div style={{ width: 1, height: 16, background: "#e0e0e0", margin: "0 4px" }} />

                    {/* 适用等级 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 14, color: "#595959" }}>适用等级</span>
                        <Tooltip title="仅勾选级别的告警会触发升级策略">
                            <InfoCircleOutlined style={{ color: "#8c8c8c" }} />
                        </Tooltip>
                        <Checkbox.Group
                            options={plainOptions}
                            value={upgradableSeverity}
                            onChange={setUpgradableSeverity}
                            disabled={!editable || !isUpgradeEnabled}
                        />
                    </div>
                </div>

                {!hideToolbar && (
                    <Space>
                        {editable ? (
                            <>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
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
                )}
            </div>

            {/* 升级策略表单 / 未启用提示 */}
            {isUpgradeEnabled ? (
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="claimTimeout"
                        label={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <ClockCircleOutlined style={{ marginRight: "8px", color: "#ff4d4f" }} />
                                <span>认领超时时间</span>
                            </div>
                        }
                        rules={[{ required: isUpgradeEnabled, message: "请输入认领超时时间" }]}
                    >
                        <Input
                            type="number"
                            addonAfter="分钟"
                            placeholder="请输入认领超时时间"
                            min={1}
                            disabled={!editable}
                            style={{ borderRadius: "6px" }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="claimRepeatInterval"
                        label={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <BellOutlined style={{ marginRight: "8px", color: "#faad14" }} />
                                <span>重复通知间隔</span>
                            </div>
                        }
                        rules={[{ required: isUpgradeEnabled, message: "请输入重复通知间隔" }]}
                    >
                        <Input
                            type="number"
                            addonAfter="分钟"
                            placeholder="请输入重复通知间隔"
                            min={1}
                            disabled={!editable}
                            style={{ borderRadius: "6px" }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="claimNoticeId"
                        label={
                            <div style={{ display: "flex", alignItems: "center" }}>
                                <TeamOutlined style={{ marginRight: "8px", color: "#1677ff" }} />
                                <span>升级到通知对象</span>
                            </div>
                        }
                        rules={[{ required: isUpgradeEnabled, message: "请选择升级到通知对象" }]}
                    >
                        <Select
                            placeholder="选择升级到通知对象"
                            options={noticeOptions}
                            disabled={!editable}
                            style={{ width: "100%", borderRadius: "6px" }}
                            optionFilterProp="label"
                            showSearch
                        />
                    </Form.Item>
                </Form>
            ) : (
                <div
                    style={{
                        border: "1px dashed #e0e0e0",
                        borderRadius: 8,
                        padding: "48px 0",
                        textAlign: "center",
                        background: "#fafafa",
                    }}
                >
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span>
                                <Text strong>告警升级未启用</Text>
                                <br />
                                <Text type="secondary" style={{ fontSize: 13 }}>
                                    {editable
                                        ? "点击上方开关启用后，即可配置升级策略"
                                        : "点击「编辑」后开启开关，配置认领超时与升级通知"}
                                </Text>
                            </span>
                        }
                    />
                </div>
            )}
        </div>
    )
}
