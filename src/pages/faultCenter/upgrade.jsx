"use client"

import { useState, useEffect } from "react"
import { Input, Button, Select, Form, Card, Row, Col, Typography, Space, Tooltip, Checkbox, Switch } from "antd"
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
    InfoCircleOutlined, SettingOutlined,
    AlertOutlined
} from "@ant-design/icons"

const { Title, Text } = Typography

export const AlarmUpgrade = () => {
    const { id } = useParams()
    const [form] = Form.useForm()
    const [noticeOptions, setNoticeOptions] = useState([])
    const [editable, setEditable] = useState(false)
    const [saving, setSaving] = useState(false)
    const [isUpgradeEnabled, setIsUpgradeEnabled] = useState(false)
    const [claimEnabled, setClaimEnabled] = useState(false)
    const [processEnabled, setProcessEnabled] = useState(false)
    const [upgradableSeverity, setUpgradableSeverity] = useState([])
    const STRATEGY_TYPES = {
        CLAIM: 1,
        PROCESS: 2
    }
    const [config, setConfig] = useState({
        isUpgradeEnabled: true,
        strategies: [
            {
                type: STRATEGY_TYPES.CLAIM,
                enabled: true,
                timeout: 0,
                repeatInterval: 0,
                noticeId: null
            },
            {
                type: STRATEGY_TYPES.PROCESS,
                enabled: true,
                timeout: 0,
                repeatInterval: 0,
                noticeId: null
            }
        ]
    })
    const [faultCenterData, setFaultCenterData]= useState(null)


    useEffect(() => {
        Promise.all([handleList(), handleGetNoticeData()])
    }, [])

    const handleList = async () => {
        try {
            const res = await FaultCenterSearch({ id })
            if (res.data) {
                setFaultCenterData(res.data)
                const { isUpgradeEnabled, upgradeStrategy, upgradableSeverity = [] } = res.data

                const strategies = [
                    upgradeStrategy.find(s => s.strategyType === STRATEGY_TYPES.CLAIM) || {
                        type: STRATEGY_TYPES.CLAIM,
                        enabled: true,
                        timeout: 0,
                        repeatInterval: 0,
                        noticeId: null
                    },
                    upgradeStrategy.find(s => s.strategyType === STRATEGY_TYPES.PROCESS) || {
                        type: STRATEGY_TYPES.PROCESS,
                        enabled: true,
                        timeout: 0,
                        repeatInterval: 0,
                        noticeId: null
                    }
                ]

                setConfig({
                    isUpgradeEnabled: isUpgradeEnabled ?? true,
                    strategies
                })

                setIsUpgradeEnabled(isUpgradeEnabled)
                setUpgradableSeverity(upgradableSeverity)
                setClaimEnabled(strategies[0].enabled,)
                setProcessEnabled(strategies[1].enabled)
                // Set form values
                form.setFieldsValue({
                    claimTimeout: strategies[0].timeout,
                    claimRepeatInterval: strategies[0].repeatInterval,
                    claimNoticeId: strategies[0].noticeId,
                    processTimeout: strategies[1].timeout,
                    processRepeatInterval: strategies[1].repeatInterval,
                    processNoticeId: strategies[1].noticeId
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

            const updatedConfig = {
                ...faultCenterData,
                isUpgradeEnabled: isUpgradeEnabled,
                upgradableSeverity: upgradableSeverity,
                upgradeStrategy: [
                    {
                        strategyType: STRATEGY_TYPES.CLAIM,
                        enabled: claimEnabled,
                        timeout: Number(values.claimTimeout),
                        repeatInterval: Number(values.claimRepeatInterval),
                        noticeId: values.claimNoticeId
                    },
                    {
                        strategyType: STRATEGY_TYPES.PROCESS,
                        enabled: processEnabled,
                        timeout: Number(values.processTimeout),
                        repeatInterval: Number(values.processRepeatInterval),
                        noticeId: values.processNoticeId
                    }
                ]
            }

            await FaultCenterUpdate({ id, ...updatedConfig })
            setEditable(false)
            setConfig(updatedConfig)
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

    const formItemLayout = {
        labelCol: { span: 24 },
        wrapperCol: { span: 24 },
    }

    const plainOptions = [
        { label: 'P0', value: 'P0' },
        { label: 'P1', value: 'P1' },
        { label: 'P2', value: 'P2' },
    ];

    return (
        <div style={{ borderRadius: "8px" }}>
            <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Title level={4} style={{ margin: 0 }}>
                        <AlertOutlined style={{ marginRight: "12px" }} />
                        告警升级
                        <Switch
                            checked={isUpgradeEnabled}
                            onChange={setIsUpgradeEnabled}
                            style={{ marginLeft: 16 }}
                            disabled={!editable}
                        />
                        <Checkbox.Group
                            style={{ marginLeft: 16 }}
                            disabled={!editable}
                            options={plainOptions}
                            defaultValue={['P0']}
                            onChange={setUpgradableSeverity}
                            value={upgradableSeverity}
                        />
                    </Title>
                    <Space>
                        {editable ? (
                            <>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleSave}
                                    loading={saving}
                                    style={{ marginRight: '8px', backgroundColor: '#000', borderColor: '#000' }}
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
                <Text type="secondary">🔔: 配置告警认领和处理的超时规则，确保告警能够及时得到响应和处理, 注意: 恢复通知不会升级!</Text>
            </div>

            <Form form={form} {...formItemLayout} layout="vertical">
                <Row gutter={24}>
                    <Col xs={24} md={12}>
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
                                <SettingOutlined style={{marginRight: "8px", color: "#1677ff"}}/>
                                <Text strong>认领超时</Text>
                                <Tooltip
                                    title="当告警产生后，如果在设定时间内未被认领，系统将自动通知相关人员">
                                    <InfoCircleOutlined style={{marginLeft: "8px", color: "#8c8c8c"}}/>
                                </Tooltip>
                                <div style={{ marginLeft: "8px" }}>
                                    <Switch
                                        checked={claimEnabled}
                                        onChange={setClaimEnabled}
                                        disabled={!editable}
                                    />
                                </div>
                            </div>
                                <Form.Item
                                    name="claimTimeout"
                                    label={
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <ClockCircleOutlined style={{marginRight: "8px", color: "#ff4d4f"}}/>
                                            <span>超时时间</span>
                                        </div>
                                    }
                                    rules={[{required: claimEnabled, message: "请输入认领超时时间"}]}
                                >
                                    <Input
                                        type="number"
                                        addonAfter="分钟"
                                        placeholder="请输入认领超时时间"
                                        min={1}
                                        disabled={!editable || !claimEnabled}
                                        style={{borderRadius: "6px"}}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="claimRepeatInterval"
                                    label={
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <BellOutlined style={{marginRight: "8px", color: "#faad14"}}/>
                                            <span>重复通知间隔</span>
                                        </div>
                                    }
                                    rules={[{required: claimEnabled, message: "请输入重复通知间隔"}]}
                                >
                                    <Input
                                        type="number"
                                        addonAfter="分钟"
                                        placeholder="请输入重复通知间隔"
                                        min={1}
                                        disabled={!editable || !claimEnabled}
                                        style={{borderRadius: "6px"}}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="claimNoticeId"
                                    label={
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <TeamOutlined style={{marginRight: "8px", color: "#1677ff"}}/>
                                            <span>通知对象</span>
                                        </div>
                                    }
                                    rules={[{required: claimEnabled, message: "请选择通知对象"}]}
                                >
                                    <Select
                                        placeholder="选择通知对象"
                                        options={noticeOptions}
                                        disabled={!editable || !claimEnabled}
                                        style={{width: "100%", borderRadius: "6px"}}
                                        optionFilterProp="label"
                                        showSearch
                                    />
                                </Form.Item>

                        </div>
                    </Col>

                    <Col xs={24} md={12}>
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
                                <SettingOutlined style={{marginRight: "8px", color: "#1677ff"}}/>
                                <Text strong>处理超时</Text>
                                <Tooltip
                                    title="当告警被认领后，如果在设定时间内未被处理完成，系统将自动通知相关人员">
                                    <InfoCircleOutlined style={{marginLeft: "8px", color: "#8c8c8c"}}/>
                                </Tooltip>
                                <div style={{marginLeft: "8px"}}>
                                    <Switch
                                        checked={processEnabled}
                                        onChange={setProcessEnabled}
                                        disabled={!editable}
                                    />
                                </div>
                            </div>
                                <Form.Item
                                    name="processTimeout"
                                    label={
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <ClockCircleOutlined style={{marginRight: "8px", color: "#ff4d4f"}}/>
                                            <span>超时时间</span>
                                        </div>
                                    }
                                    rules={[{required: processEnabled, message: "请输入处理超时时间"}]}
                                >
                                    <Input
                                        type="number"
                                        addonAfter="分钟"
                                        placeholder="请输入处理超时时间"
                                        min={1}
                                        disabled={!editable || !processEnabled}
                                        style={{borderRadius: "6px"}}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="processRepeatInterval"
                                    label={
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <BellOutlined style={{marginRight: "8px", color: "#faad14"}}/>
                                            <span>重复通知间隔</span>
                                        </div>
                                    }
                                    rules={[{required: processEnabled, message: "请输入重复通知间隔"}]}
                                >
                                    <Input
                                        type="number"
                                        addonAfter="分钟"
                                        placeholder="请输入重复通知间隔"
                                        min={1}
                                        disabled={!editable || !processEnabled}
                                        style={{borderRadius: "6px"}}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="processNoticeId"
                                    label={
                                        <div style={{display: "flex", alignItems: "center"}}>
                                            <TeamOutlined style={{marginRight: "8px", color: "#1677ff"}}/>
                                            <span>通知对象</span>
                                        </div>
                                    }
                                    rules={[{required: processEnabled, message: "请选择通知对象"}]}
                                >
                                    <Select
                                        placeholder="选择通知对象"
                                        options={noticeOptions}
                                        disabled={!editable || !processEnabled}
                                        style={{width: "100%", borderRadius: "6px"}}
                                        optionFilterProp="label"
                                        showSearch
                                    />
                                </Form.Item>
                        </div>
                    </Col>
                </Row>
            </Form>
        </div>
)
}