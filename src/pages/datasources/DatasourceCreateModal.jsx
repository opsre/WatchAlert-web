import {createDatasource, DatasourcePing, updateDatasource} from '../../api/datasource'
import {Modal, Form, Input, Button, Switch, Select, InputNumber, Alert, Drawer} from 'antd'
import React, { useState, useEffect } from 'react'
const { TextArea } = Input
const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatPath = React.useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}


export const CreateDatasourceModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const [enabled, setEnabled] = useState(true) // 设置初始状态为 true
    const [selectedType, setSelectedType] = useState(null) // 数据源类型
    const [isChecked, setIsChecked] = useState(false)
    const [submitLoading,setSubmitLoading] = useState(false)

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
            setSelectedType(selectedRow.type)
            form.setFieldsValue({
                name: selectedRow.name,
                type: selectedRow.type,
                http: {
                    url: selectedRow.http.url,
                    timeout: selectedRow.http.timeout
                },
                alicloudEndpoint: selectedRow.alicloudEndpoint,
                alicloudAk: selectedRow.alicloudAk,
                alicloudSk: selectedRow.alicloudSk,
                awsCloudwatch: selectedRow.awsCloudwatch,
                description: selectedRow.description,
                kubeConfig: selectedRow.kubeConfig,
                elasticSearch: selectedRow.elasticSearch,
                enabled: selectedRow.enabled
            })
        }
    }, [selectedRow, form])

    const handleCreate = async (params) => {
        try {
            await createDatasource(params)
            handleList()
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleUpdate = async (params) => {
        try {
            await updateDatasource(params)
            handleList()
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleFormSubmit = async (values) => {

        if (type === 'create') {
            await handleCreate(values)
        }

        if (type === 'update') {
            const params = {
                ...values,
                id: selectedRow.id
            }
            await handleUpdate(params)
        }

        // 关闭弹窗
        onClose()

    }

    const handleGetDatasourceData = async (data) => {
        setSelectedType(data)
    }

    const handleSubmit = async () => {
        setSubmitLoading(true)
    }

    const handleTestConnection = async () => {
        // 获取表单数据
        const values = await form.validateFields().catch((err) => null);
        if (!values) {
            // 如果表单验证失败，直接返回
            return;
        }

        try {
           await DatasourcePing(values)
        } catch (error) {
            console.error('连接测试失败:', error);
        }
    };

    return (
        <Drawer title="创建数据源" open={visible} onClose={onClose}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <MyFormItem name="name" label="数据源名称"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                    <Input
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={type === 'update'}/>
                </MyFormItem>

                <MyFormItem name="type" label="数据源类型"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                    <Select
                        placeholder="请选择数据源类型"
                        style={{
                            flex: 1,
                        }}
                        onChange={handleGetDatasourceData}
                        options={[
                            {
                                value: 'Prometheus',
                                label: 'Prometheus',
                            },
                            {
                                value: 'AliCloudSLS',
                                label: '阿里云SLS'
                            },
                            {
                                value: 'Jaeger',
                                label: 'Jaeger'
                            },
                            {
                                value: 'Loki',
                                label: 'Loki',
                            },
                            {
                                value: 'CloudWatch',
                                label: 'CloudWatch'
                            },
                            {
                                value: 'VictoriaMetrics',
                                label: 'VictoriaMetrics'
                            },
                            {
                                value: 'Kubernetes',
                                label: 'Kubernetes'
                            },
                            {
                                value: 'ElasticSearch',
                                label: 'ElasticSearch'
                            }
                        ]}
                    />
                </MyFormItem>

                {(selectedType === 'Prometheus' || selectedType === 'Loki' || selectedType === 'VictoriaMetrics' || selectedType === 'Jaeger') &&
                    <MyFormItemGroup prefix={['http']}>
                        <MyFormItem name="url" label="URL"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                        {
                                            pattern: /^(http|https):\/\/.*[^\/]$/,
                                            message: '请输入正确的URL格式，且结尾不应包含"/"',
                                        },
                                    ]}>
                            <Input/>
                        </MyFormItem>

                        <MyFormItem name="timeout" label="Timeout"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}>
                            <InputNumber
                                style={{width: '100%'}}
                                addonAfter={<span>秒</span>}
                                placeholder="10"
                                min={1}
                            />
                        </MyFormItem>
                    </MyFormItemGroup>
                }

                {selectedType === 'AliCloudSLS' &&
                    <div>
                        <MyFormItem name="alicloudEndpoint" label="Endpoint"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}>
                            <Input/>
                        </MyFormItem>

                        <MyFormItem name="alicloudAk" label="AccessKeyId"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}>
                            <Input/>
                        </MyFormItem>

                        <MyFormItem name="alicloudSk" label="AccessKeySecret"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}>
                            <Input/>
                        </MyFormItem>
                    </div>
                }

                {selectedType === 'CloudWatch' &&
                    <div>
                        <MyFormItemGroup prefix={['awsCloudwatch']}>
                            <MyFormItem name="region" label="Region"
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}>
                                <Input/>
                            </MyFormItem>

                            <MyFormItem name="accessKey" label="AccessKey"
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}>
                                <Input/>
                            </MyFormItem>

                            <MyFormItem name="secretKey" label="SecretKey"
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}>
                                <Input/>
                            </MyFormItem>
                        </MyFormItemGroup>
                    </div>
                }

                {selectedType === 'Kubernetes' &&
                    <MyFormItem name="kubeConfig" label="认证配置"
                                rules={[{
                                    required: true,
                                }]}>
                        <TextArea rows={15} placeholder="输入 Kubernetes 认证配置"/>
                    </MyFormItem>
                }

                {(selectedType === 'ElasticSearch') &&
                    <MyFormItemGroup prefix={['elasticSearch']}>
                        <MyFormItem name="url" label="URL"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                        {
                                            pattern: /^(http|https):\/\/.*[^\/]$/,
                                            message: '请输入正确的URL格式，且结尾不应包含"/"',
                                        },
                                    ]}>
                            <Input/>
                        </MyFormItem>

                        <MyFormItem name="username" label="用户名">
                            <Input/>
                        </MyFormItem>

                        <MyFormItem name="password" label="密码">
                            <Input/>
                        </MyFormItem>
                    </MyFormItemGroup>
                }

                <MyFormItem name="description" label="描述">
                    <Input/>
                </MyFormItem>

                <MyFormItem
                    name="enabled"
                    label={"状态"}
                    tooltip="启用/禁用"
                    valuePropName="checked"
                >
                    <Switch checked={enabled} onChange={setEnabled}/>
                </MyFormItem>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Button type="default" onClick={handleTestConnection}>
                        连接测试
                    </Button>
                    <Button type="primary" htmlType="submit" loading={submitLoading} onClick={handleSubmit}>
                        提交
                    </Button>
                </div>
            </Form>
        </Drawer>
    )
}