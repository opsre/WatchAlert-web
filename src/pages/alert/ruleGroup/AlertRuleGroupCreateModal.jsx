import { createRuleGroup, updateRuleGroup } from '../../../api/rule'
import { Modal, Form, Input, Button, message } from 'antd'
import React, { useState, useEffect } from 'react'

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const AlertRuleGroupCreateModal = ({ visible, onClose, selectedRow, type, handleList, pagination}) => {
    const [form] = Form.useForm()

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
            form.setFieldsValue({
                id: selectedRow.id,
                name: selectedRow.name,
                description: selectedRow.description,
            })
        }

    }, [selectedRow, form])

    const handleCreate = async (data) => {
        try {
            await createRuleGroup(data)
            handleList(pagination.index,pagination.size)
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async (data) => {
        try {
            await updateRuleGroup(data)
            handleList(pagination.index,pagination.size)
        } catch (error) {
            console.error(error)
        }
    }

    const handleFormSubmit = async (values) => {

        if (type === 'create') {
            await handleCreate(values)
        }

        if (type === 'update') {
            const newValues = {
                ...values,
                tenantId: selectedRow.tenantId,
                id: selectedRow.id
            }
            await handleUpdate(newValues)
        }

        onClose()
    }

    return (
        <Modal visible={visible} onCancel={onClose} footer={null}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <MyFormItem name="name" label="名称"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Input
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress} />
                </MyFormItem>

                <MyFormItem name="description" label="描述">
                    <Input />
                </MyFormItem>

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