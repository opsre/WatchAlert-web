import { PrometheusTargetGroupCreate, PrometheusTargetGroupUpdate } from '../../../api/prometheus'
import { Modal, Form, Input, Button } from 'antd'
import React, { useEffect } from 'react'

export const ServiceGroupCreateModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()

    useEffect(() => {
        if (selectedRow && type === 'update') {
            form.setFieldsValue({
                id: selectedRow.id,
                name: selectedRow.name,
            })
        } else {
            form.resetFields()
        }
    }, [selectedRow, type, form])

    const handleFormSubmit = async (values) => {
        try {
            if (type === 'create') {
                await PrometheusTargetGroupCreate(values)
            } else {
                await PrometheusTargetGroupUpdate({
                    ...values,
                    id: selectedRow.id,
                })
            }
            handleList()
            onClose()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Modal open={visible} onCancel={onClose} footer={null} title={type === 'create' ? '创建服务组' : '编辑服务组'}>
            <Form form={form} layout="vertical" onFinish={handleFormSubmit}>
                <Form.Item
                    name="name"
                    label="名称"
                    rules={[{ required: true, message: '请输入服务组名称' }]}
                >
                    <Input placeholder="输入服务组名称" />
                </Form.Item>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <Button onClick={onClose}>取消</Button>
                    <Button type="primary" htmlType="submit" style={{ backgroundColor: '#000000' }}>
                        提交
                    </Button>
                </div>
            </Form>
        </Modal>
    )
}
