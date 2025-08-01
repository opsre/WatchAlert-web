"use client"
import { Modal, Form, Input, Button, Switch, Typography, message } from "antd" // 导入 message
import React, { useState, useEffect } from "react"
import { registerUser, updateUser } from "../../../api/user" // 假设这些路径是正确的

const MyFormItemContext = React.createContext([])
function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// 表单自定义 Form.Item 包装器
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

// 函数组件
const UserCreateModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const [checked, setChecked] = useState(false) // 初始值设为 false
    const [spaceValue, setSpaceValue] = useState("") // 用户名输入框的值，用于处理空格

    useEffect(() => {
        if (visible) {
            // 仅当模态框可见时才设置值
            if (selectedRow && type === "update") {
                const joinDutyStatus = selectedRow.joinDuty === "true"
                setChecked(joinDutyStatus)
                setSpaceValue(selectedRow.username) // 初始化禁用空格输入框的值
                form.setFieldsValue({
                    username: selectedRow.username,
                    phone: selectedRow.phone,
                    email: selectedRow.email,
                    joinDuty: joinDutyStatus,
                    dutyUserId: selectedRow.dutyUserId,
                    role: selectedRow.role,
                })
            } else {
                // 'create' 或没有 selectedRow 时，重置表单和相关状态
                form.resetFields()
                setChecked(false)
                setSpaceValue("")
                form.setFieldsValue({
                    joinDuty: false, // 确保初始值为false
                    role: "app", // 设置默认角色
                })
            }
        }
    }, [visible, selectedRow, type, form]) // 依赖 visible, selectedRow, type, form

    // 用户名输入框处理，禁止输入空格
    const handleInputChange = (e) => {
        const newValue = e.target.value.replace(/\s/g, "")
        setSpaceValue(newValue)
        form.setFieldsValue({ username: newValue }) // 同步更新form的值
    }
    const handleKeyPress = (e) => {
        if (e.key === " ") {
            e.preventDefault()
        }
    }

    // 创建用户
    const handleCreate = async (values) => {
        try {
            await registerUser(values)
            message.success("用户创建成功！")
            handleList()
        } catch (error) {
            console.error(error)
            message.error("用户创建失败。")
        }
    }

    // 更新用户
    const handleUpdate = async (values) => {
        await updateUser(values)
        handleList()
    }

    // 提交表单
    const handleFormSubmit = async (values) => {
        if (type === "create") {
            const newValues = {
                ...values,
                joinDuty: values.joinDuty ? "true" : "false",
                role: "app",
                dutyUserId: values.dutyUserId
            }
            await handleCreate(newValues)
        }
        if (type === "update") {
            const newValues = {
                ...values,
                joinDuty: values.joinDuty ? "true" : "false",
                userid: selectedRow.userid,
                dutyUserId: values.dutyUserId
            }
            await handleUpdate(newValues)
        }
        onClose()
    }

    // 接受值班 Switch 变化
    const onChangeJoinDuty = (checkedStatus) => {
        setChecked(checkedStatus)
        form.setFieldsValue({ joinDuty: checkedStatus }) // 同步更新 Form.Item 的值
    }

    return (
        <Modal visible={visible} onCancel={onClose} footer={null}>
            <Form
                form={form}
                name="user_form" // 更改表单名称
                layout="horizontal" // 关键：设置为水平布局
                onFinish={handleFormSubmit}
                labelCol={{ span: 5 }} // 默认标签宽度
                wrapperCol={{ span: 20 }} // 默认输入框宽度
                style={{ padding: "40px 24px" }}

            >
                <MyFormItem
                    name="username"
                    label="用户名"
                    style={{ flex: 1 }}
                    rules={[{ required: true, message: "请输入用户名！" }]}
                >
                    <Input
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={type === "update"}
                    />
                </MyFormItem>

                {type === "create" && (
                    <Form.Item
                        name="password"
                        label="密码"
                        style={{ flex: 1 }}
                        rules={[{ required: true, message: "请输入密码！" }]}
                        hasFeedback
                    >
                        <Input.Password />
                    </Form.Item>
                )}

                <MyFormItem
                    name="email"
                    label="邮箱"
                    rules={[
                        { required: true, message: "请输入邮箱！", type: "email" }, // 添加type: 'email'进行格式校验
                    ]}
                >
                    <Input />
                </MyFormItem>

                <MyFormItem name="phone" label="手机号">
                    <Input />
                </MyFormItem>

                <MyFormItem
                    name="joinDuty"
                    label="接受值班"
                    valuePropName="checked"
                >
                    <Switch checked={checked} onChange={onChangeJoinDuty} />
                </MyFormItem>

                {checked && (
                    <>
                        <MyFormItem name="dutyUserId" label="用户标识" rules={[{ required: true, message: "请输入用户标识！" }]}>
                            <Input />
                        </MyFormItem>
                        <Typography.Text type="secondary" style={{ marginTop: "5px", fontSize: "12px", display: "block" }}>
                            {"第三方平台的用户 ID（飞书/Slack平台） 或 手机号（钉钉/企微平台）"}
                        </Typography.Text>
                    </>
                )}

                <Form.Item wrapperCol={{ offset: 6, span: 18 }}>
                    <div style={{ display: "flex", justifyContent: "flex-end" }}>
                        <Button type="primary" htmlType="submit" style={{ backgroundColor: "#000000" }}>
                            提交
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </Modal>
    )
}

export default UserCreateModal
