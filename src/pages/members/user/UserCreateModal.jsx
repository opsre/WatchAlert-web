import { Modal, Form, Input, Button, Select, Switch } from 'antd'
import React, { useState, useEffect } from 'react'
import { registerUser, updateUser } from '../../../api/user'
import { getRoleList } from '../../../api/role'


const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// 表单
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

// 函数组件
const UserCreateModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const [checked, setChecked] = useState()
    const [username, setUsername] = useState("")

    // 禁止输入空格
    const [spaceValue, setSpaceValue] = useState('')

    const handleInputChange = (e) => {
        // 移除输入值中的空格
        const newValue = e.target.value.replace(/\s/g, '')
        setSpaceValue(newValue)
    }

    const handleKeyPress = (e) => {
        // 阻止空格键的默认行为
        if (e.key === ' ') {
            e.preventDefault()
        }
    }

    useEffect(() => {
        if (selectedRow) {
            if (type === 'update') {
                setChecked(selectedRow.joinDuty === 'true' ? true : false)
                setUsername(selectedRow.username)
            }
            form.setFieldsValue({
                username: selectedRow.username,
                phone: selectedRow.phone,
                email: selectedRow.email,
                joinDuty: selectedRow.joinDuty, // 修改这里
                dutyUserId: selectedRow.dutyUserId,
                role: selectedRow.role
            })
        }
    }, [selectedRow, form])

    // 创建
    const handleCreate = async (values) => {
        try {
            await registerUser(values)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 更新
    const handleUpdate = async (values) => {
        try {
            await updateUser(values)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 提交
    const handleFormSubmit = (values) => {

        if (type === 'create') {
            const newValues = {
                ...values,
                joinDuty: values.joinDuty ? "true" : "false",
                role: "app",
            }
            handleCreate(newValues)

        }

        if (type === 'update') {
            const newValues = {
                ...values,
                joinDuty: values.joinDuty ? "true" : "false",
                userid: selectedRow.userid,
                password: selectedRow.password,
            }

            handleUpdate(newValues)
        }

        // 关闭弹窗
        onClose()

    }

    const onChangeJoinDuty = (checked) => {
        setChecked(checked) // 修改这里
    }

    return (
        <Modal visible={visible} onCancel={onClose} footer={null}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>

                <div style={{ display: 'flex' }}>
                    <MyFormItem name="username" label="用户名"
                        style={{
                            marginRight: '10px',
                            width: '500px',
                        }}
                        rules={[
                            {
                                required: true,
                                message: 'Please input your username!',
                            },
                        ]}>
                        <Input
                            value={spaceValue}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            disabled={type === 'update'} />
                    </MyFormItem>
                    {type === 'create' && <Form.Item
                        name="password"
                        label="密码"
                        style={{
                            marginRight: '10px',
                            width: '500px',
                        }}
                        rules={[
                            {
                                required: true,
                                message: 'Please input your password!',
                            },
                        ]}
                        hasFeedback
                    >
                        <Input.Password />
                    </Form.Item>}

                </div>

                <MyFormItem name="email" label="邮箱"
                            rules={[
                                {
                                    required: true,
                                    message: 'Please input your email!',
                                },
                            ]}>
                    <Input />
                </MyFormItem>

                <MyFormItem name="phone" label="手机号">
                    <Input />
                </MyFormItem>

                <MyFormItem name="joinDuty" label="接受值班">
                    <Switch checked={checked} onChange={onChangeJoinDuty} />
                </MyFormItem>

                {checked === true && <MyFormItem name="dutyUserId" label="UserID「飞书/钉钉」"
                    rules={[
                        {
                            required: true,
                            message: 'Please input your UserID!',
                        },
                    ]}>
                    <Input />
                </MyFormItem>}

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        style={{
                            backgroundColor: '#000000'
                        }}
                    >
                        提交
                    </Button>
                </div>
            </Form>
        </Modal>
    )
}

export default UserCreateModal