import {Modal, Form, Input, Button, InputNumber, Segmented} from 'antd'
import React, {useEffect, useState} from 'react'
import {createDashboardFolder, updateDashboardFolder} from '../../../api/dashboard';

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

const CreateFolderModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const [theme,setTheme] = useState('light')

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
                grafanaHost: selectedRow.grafanaHost,
                grafanaFolderId: selectedRow.grafanaFolderId,
                theme: selectedRow.theme,
            })
        }

    }, [selectedRow, form])

    const handleCreate = async (data) => {
        try {
            await createDashboardFolder(data)
            handleList()
            form.resetFields();
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async (data) => {
        try {
            data.id = selectedRow.id
            await updateDashboardFolder(data)
            handleList()
            form.resetFields();
        } catch (error) {
            console.error(error)
        }
    }

    const handleFormSubmit = async (values) => {
        values.theme = theme
        if (type === 'create') {
            await handleCreate(values)
        }

        if (type === 'update') {
            await handleUpdate(values)
        }

        // 关闭弹窗
        onClose()
    }

    return (
        <Modal visible={visible} onCancel={onClose} footer={null}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <MyFormItem name="name" label="名称" rules={[{required: true}]}>
                    <Input
                        placeholder="文件夹名称"
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress} />
                </MyFormItem>

                <MyFormItem name="grafanaHost" label="Grafana Host" rules={[
                    {
                        required: true
                    },
                    {
                        pattern: /^(http|https):\/\/.*[^\/]$/,
                        message: '请输入正确的URL格式，且结尾不应包含"/"',
                    },
                ]}>
                    <Input placeholder="Grafana链接日志, 例如: https://xx.xx.xx"/>
                </MyFormItem>

                <MyFormItem name="grafanaFolderId" label="Grafana FolderId"  rules={[{required: true}]}>
                    <InputNumber style={{width:'100%'}} placeholder="Grafana目录Id" min={1}/>
                </MyFormItem>

                <MyFormItem name="theme" label="背景颜色">
                    <Segmented
                        options={['light', 'dark']}
                        defaultValue={'light'}
                        onChange={(value) => {
                            setTheme(value)
                        }}
                    />
                </MyFormItem>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        style={{
                            backgroundColor: '#000000'
                        }}
                    >
                        创建
                    </Button>
                </div>
            </Form>
        </Modal>
    )
}

export default CreateFolderModal