import { Modal, Form, Input, Button, Divider } from 'antd'
import React, { useEffect } from 'react'
import { createTenant, updateTenant } from '../../api/tenant'

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

export const CreateTenant = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()

    useEffect(() => {
        if (selectedRow) {
            form.setFieldsValue({
                name: selectedRow.name,
                manager: selectedRow.manager,
                description: selectedRow.description,
            })
        }
    }, [selectedRow, form])

    // 创建
    const handleCreate = async (data) => {
        try {
            await createTenant(data)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 更新
    const handleUpdate = async (data) => {
        try {
            await updateTenant(data)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 提交
    const handleFormSubmit = async (values) => {

        if (type === 'create') {
            const params = {
                ...values,
                userNumber: 10,
                ruleNumber: 50,
                dutyNumber: 10,
                noticeNumber: 10,
                removeProtection: false,
            }

            await handleCreate(params)
        }

        if (type === 'update') {
            const params = {
                ...values,
                id: selectedRow.id,
            }

            await handleUpdate(params)
        }

        // 关闭弹窗
        onClose()
    }

    return (
        <>
            <Modal visible={visible} onCancel={onClose} footer={null}>
                <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                    <strong style={{ fontSize: '15px' }}>基础信息</strong>
                    <MyFormItem
                            name="name"
                            label="租户名称"
                            style={{
                                marginRight: '10px',
                                width: '472px',
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Input />
                        </MyFormItem>

                    <MyFormItem
                            name="manager"
                            label="租户负责人"
                            style={{
                                width: '472px',
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Input />
                        </MyFormItem>

                    <MyFormItem
                        name="description"
                        label="描述"
                        style={{
                            width: '472px',
                        }}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <Input maxLength={30} />
                    </MyFormItem>
                    <Divider />

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
        </>
    )
}