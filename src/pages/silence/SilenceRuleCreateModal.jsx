"use client"

import { Form, Input, Button, DatePicker, Select, Drawer, message, Space } from "antd"
import React, { useState, useEffect, useCallback } from "react"
import moment from "moment"
import { createSilence, updateSilence } from "../../api/silence"
import { PlusOutlined, MinusCircleOutlined } from "@ant-design/icons"
import {HandleApiError} from "../../utils/lib";

const { RangePicker } = DatePicker
const { Option } = Select

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// 表单组件
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const CreateSilenceModal = ({ visible, onClose, selectedRow, type, handleList, faultCenterId }) => {
    const [form] = Form.useForm()
    const [startTimestamp, setStartTimestamp] = useState(null)
    const [endTimestamp, setEndTimestamp] = useState(null)
    const [loading, setLoading] = useState(false)

    // 初始化表单数据
    useEffect(() => {
        if (selectedRow) {
            form.setFieldsValue({
                name: selectedRow.name,
                comment: selectedRow.comment,
                labels: selectedRow.labels || [{ key: "", operator: "=", value: "" }],
            })
        } else {
            form.setFieldsValue({
                labels: [{ key: "", operator: "=", value: "" }],
            })
        }
    }, [selectedRow, form])

    // 时间选择器变化处理
    const handleDateChange = useCallback((dates, dateStrings) => {
        if (dates && dates.length === 2) {
            const startTs = moment(dateStrings[0]).unix()
            const endTs = moment(dateStrings[1]).unix()
            setStartTimestamp(startTs)
            setEndTimestamp(endTs)
        }
    }, [])

    // 时间选择器确认处理
    const handleDateOk = useCallback((dates) => {
        if (dates && dates[0] && dates[1]) {
            const startTs = dates[0].unix()
            const endTs = dates[1].unix()
            setStartTimestamp(startTs)
            setEndTimestamp(endTs)
        }
    }, [])

    // 创建静默规则
    const handleCreate = useCallback(async (data) => {
            try {
                await createSilence(data)
                handleList()
            } catch (error) {
                HandleApiError(error)
                throw error
            }
        },
        [handleList],
    )

    // 更新静默规则
    const handleUpdate = useCallback(async (data) => {
            try {
                await updateSilence(data)
                handleList()
            } catch (error) {
                HandleApiError(error)
                throw error
            }
        },
        [handleList],
    )

    // 表单提交处理
    const handleFormSubmit = useCallback(
        async (values) => {
            if (!startTimestamp || !endTimestamp) {
                message.error("请选择时间范围")
                return
            }

            setLoading(true)
            try {
                const params = {
                    ...values,
                    startsAt: startTimestamp,
                    endsAt: endTimestamp,
                    faultCenterId: faultCenterId,
                    status: 0,
                }

                if (type === "create") {
                    await handleCreate(params)
                } else if (type === "update") {
                    const updateParams = {
                        ...params,
                        id: selectedRow.id,
                    }
                    await handleUpdate(updateParams)
                }
            } catch (error) {
                // 错误已在具体方法中处理
            } finally {
                setLoading(false)
                onClose()
            }
        },
        [startTimestamp, endTimestamp, faultCenterId, type, selectedRow, handleCreate, handleUpdate, onClose],
    )

    // 添加label处理
    const handleAddLabel = useCallback((add) => {
        add({ key: "", operator: "=", value: "" }) // 关键修复：为新添加的label设置默认值
    }, [])

    return (
        <Drawer
            title={type === "create" ? "创建静默规则" : "编辑静默规则"}
            open={visible}
            onClose={onClose}
            footer={null}
            size="large"
        >
            <Form form={form} name="silence_form" layout="vertical" onFinish={handleFormSubmit} preserve={false}>
                <MyFormItem name="name" label="规则名称" rules={[{ required: true, message: "请输入规则名称" }]}>
                    <Input placeholder="请输入规则名称" />
                </MyFormItem>

                <MyFormItem name="timeRange" label="时间选择器" rules={[{ required: true, message: "请选择时间范围" }]}>
                    <RangePicker
                        style={{ width: "100%" }}
                        showTime={{ format: "HH:mm:ss" }}
                        format="YYYY-MM-DD HH:mm:ss"
                        onChange={handleDateChange}
                        onOk={handleDateOk}
                        placeholder={["开始时间", "结束时间"]}
                    />
                </MyFormItem>

                <div style={{ marginBottom: "16px" }}>
                    <span style={{ fontWeight: "bold" }}>静默条件</span>
                </div>

                <div
                    style={{
                        border: "1px solid #d9d9d9",
                        borderRadius: "8px",
                        padding: "16px",
                        marginBottom: "16px",
                    }}
                >
                    <Form.List name="labels">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: "flex", marginBottom: 8, width: "100%" }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, "key"]}
                                            rules={[{ required: true, message: "请输入 key" }]}
                                            style={{ width: "250px" }}
                                        >
                                            <Input placeholder="请输入 key" />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, "operator"]}
                                            rules={[{ required: true, message: "请选择操作符" }]}
                                            style={{ width: "120px" }}
                                        >
                                            <Select placeholder="选择操作符">
                                                <Option value="=">等于</Option>
                                                <Option value="!=">不等于</Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, "value"]}
                                            rules={[{ required: true, message: "请输入 value" }]}
                                            style={{ width: "250px" }}
                                        >
                                            <Input placeholder="请输入 value" />
                                        </Form.Item>

                                        {fields.length > 1 && (
                                            <MinusCircleOutlined
                                                onClick={() => remove(name)}
                                                style={{ color: "#ff4d4f", cursor: "pointer" }}
                                            />
                                        )}
                                    </Space>
                                ))}

                                <Form.Item>
                                    <Button type="dashed" onClick={() => handleAddLabel(add)} block icon={<PlusOutlined />}>
                                        添加 label
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </div>

                <MyFormItem name="comment" label="评论" rules={[{ required: true, message: "请输入评论" }]}>
                    <Input.TextArea placeholder="请输入评论" rows={3} maxLength={500} showCount />
                </MyFormItem>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <Button onClick={onClose}>取消</Button>
                    <Button type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: "#000000" }}>
                        {loading ? "提交中..." : "提交"}
                    </Button>
                </div>
            </Form>
        </Drawer>
    );
};