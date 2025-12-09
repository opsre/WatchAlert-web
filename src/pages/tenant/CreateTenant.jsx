import { Modal, Form, Input, Button, Divider, Select } from 'antd'
import React, { useEffect, useState } from 'react'
import { createTenant, updateTenant } from '../../api/tenant'
import { getUserList } from "../../api/user";

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
    const { Option } = Select
    const renderedOptions = new Set();
    const [selectedItems, setSelectedItems] = useState({})
    const [filteredOptions, setFilteredOptions] = useState([])

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

    const renderOption = (item) => {
        if (!renderedOptions.has(item.username)) {
            renderedOptions.add(item.username);
            return <Option key={item.username} value={item.username} userid={item.userid}>{item.username}</Option>;
        }
        return null; // 如果选项已存在，不渲染
    };

    const handleSelectChange = (_, value) => {
        setSelectedItems(value)
    }

    const handleSearchDutyUser = async () => {
        try {
            const params = {
                joinDuty: "true",
            }
            const res = await getUserList(params)
            const options = res.data.map((item) => ({
                username: item.username,
                userid: item.userid
            }))
            setFilteredOptions(options)
        } catch (error) {
            console.error(error)
        }
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
                        <Select
                            showSearch
                            placeholder="租户负责人"
                            onChange={handleSelectChange}
                            onClick={handleSearchDutyUser}
                            style={{
                                width: '100%',
                            }}
                        >
                            {filteredOptions.map(renderOption)}
                        </Select>
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