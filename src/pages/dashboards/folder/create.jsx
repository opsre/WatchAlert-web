import {Modal, Form, Input, Button, Segmented, Drawer, Radio} from 'antd'
import React, {useEffect, useState} from 'react'
import {createDashboardFolder, updateDashboardFolder} from '../../../api/dashboard';
import {DownOutlined, RightOutlined} from "@ant-design/icons";

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
    const [folderHelpExpanded, setFolderHelpExpanded] = useState(false);
    const [grafanaVersion, setGrafanaVersion] = useState('v10')
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
                apiKey: selectedRow.apiKey,
                grafanaVersion: selectedRow.grafanaVersion,
                grafanaHost: selectedRow.grafanaHost,
                grafanaFolderId: selectedRow.grafanaFolderId,
                theme: selectedRow.theme,
            })

            setGrafanaVersion(selectedRow.grafanaVersion)
        }
    }, [selectedRow, form])

    const handleCreate = async (data) => {
        const params = {
            ...data,
            grafanaVersion: grafanaVersion,
            grafanaFolderId: data.grafanaFolderId,
        }
        try {
            await createDashboardFolder(params)
            handleList()
            form.resetFields();
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async (data) => {
        try {
            const params = {
                ...data,
                id: selectedRow.id,
                grafanaVersion: grafanaVersion,
                grafanaFolderId: data.grafanaFolderId,
            }
            await updateDashboardFolder(params)
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

    const toggleFolderHelp = () => {
        setFolderHelpExpanded(!folderHelpExpanded);
    };

    const radioOptions = [
        {
            label: 'v11及以上',
            value: 'v11',
        },
        {
            label: 'v10及以下',
            value: 'v10',
        },
    ];

    return (
        <Drawer title={"创建 Grafana 仪表盘链接"} open={visible} onClose={onClose} footer={null} size={"large"}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <MyFormItem name="name" label="名称" rules={[{required: true}]}>
                    <Input
                        placeholder="文件夹名称"
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress} />
                </MyFormItem>

                <MyFormItem name="grafanaVersion" label="Grafana 版本">
                    <Radio.Group
                        block
                        options={radioOptions}
                        defaultValue={grafanaVersion}
                        onChange={(e)=>{setGrafanaVersion(e?.target?.value)}}
                    />
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
                    <Input placeholder="Grafana链接, 例如: https://xx.xx.xx 无需包含末尾的 URI 路径"/>
                </MyFormItem>

                <MyFormItem name="apiKey" label="ApiKey">
                    <Input.Password style={{width:'100%'}} placeholder="Grafana ApiKey" min={1}/>
                </MyFormItem>

                <MyFormItem name="grafanaFolderId" label="Grafana FolderId"  rules={[{required: true}]}>
                    <Input style={{width:'100%'}} placeholder="Grafana目录Id" min={1}/>
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
                <div style={{marginTop: 24}}>
                    <div
                        onClick={toggleFolderHelp}
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 0',
                            userSelect: 'none'
                        }}
                    >
                        {folderHelpExpanded ? <DownOutlined/> : <RightOutlined/>}
                        <h4 style={{margin: 0}}>获取 FolderId 的方法</h4>
                    </div>

                    {folderHelpExpanded && (
                        <div style={{
                            marginLeft: 12,
                            padding: 12,
                            backgroundColor: '#f8f9fa',
                            borderRadius: 4
                        }}>
                            <ul style={{margin: 0, paddingLeft: 16}}>
                                <li>打开 Grafana 平台 / 仪表盘(Dashboards)，再打开 F12；</li>
                                <li>点击 网络(Network)，再点击下 Grafana 文件夹，会出现一个 Search 接口的请求；</li>
                                <li>
                                    点开请求，点击 Payload 查看请求参数，其中有 <code>folderIds</code> 或 <code>folderUids</code> ，
                                    这个 ID 即可应用到 WatchAlert。
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </Form>
        </Drawer>
    )
}

export default CreateFolderModal