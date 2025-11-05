import { createDutyManager, updateDutyManager } from '../../api/duty'
import { Modal, Form, Input, Button, Select } from 'antd'
import React, { useState, useEffect } from 'react'
import {getUserList} from "../../api/user";
const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const CreateDutyModal = ({ visible, onClose, handleList, selectedRow, type }) => {
    const [form] = Form.useForm()
    const { Option } = Select
    const [filteredOptions, setFilteredOptions] = useState([])
    const renderedOptions = new Set();
    const [selectedItems, setSelectedItems] = useState({})

    useEffect(() => {
        if (selectedRow) {
            form.setFieldsValue({
                name: selectedRow.name,
                description: selectedRow.description,
                manager: selectedRow.manager.username,
            })
        }
    }, [selectedRow, form])


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

    const handleCreate = async (data) => {
        try {
            await createDutyManager(data)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async (data) => {
        try {
            await updateDutyManager(data)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    const handleFormSubmit = async (values) => {

        const newData = {
            ...values,
            manager: {
                username: selectedItems.value,
                userid: selectedItems.userid,
            }
        }

        if (type === 'create') {
            handleCreate(newData)
        }
        if (type === 'update') {
            const newUpdateData = {
                ...newData,
                tenantId: selectedRow.tenantId,
                id: selectedRow.id,
            }
            handleUpdate(newUpdateData)
        }

        // 关闭弹窗
        onClose()
    }

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

    const renderOption = (item) => {
        if (!renderedOptions.has(item.username)) {
            renderedOptions.add(item.username);
            return <Option key={item.username} value={item.username} userid={item.userid}>{item.username}</Option>;
        }
        return null; // 如果选项已存在，不渲染
    };

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

                <Form.Item
                    name="manager"
                    label="负责人"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Select
                        showSearch
                        placeholder="管理当前值班值班表的负责人"
                        onChange={handleSelectChange}
                        onClick={handleSearchDutyUser}
                        style={{
                            width: '100%',
                        }}
                    >
                        {filteredOptions.map(renderOption)}
                    </Select>
                </Form.Item>

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