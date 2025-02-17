import {createDatasource, DatasourcePing, updateDatasource} from '../../api/datasource'
import {Form, Input, Button, Switch, Select, Alert, Drawer} from 'antd'
import React, { useState, useEffect } from 'react'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
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
    const [submitLoading,setSubmitLoading] = useState(false)
    const [testLoading,setTestLoading] = useState(false)

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
            const labelsArray = Object.entries(selectedRow.labels || {}).map(([key, value]) => ({
                key,
                value,
            }));

            setSelectedType(selectedRow.type)
            form.setFieldsValue({
                name: selectedRow.name,
                type: selectedRow.type,
                labels: labelsArray,
                http: {
                    url: selectedRow.http.url,
                    timeout: Number(selectedRow.http.timeout)
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
        // 将 labels 数组转换为对象格式
        const formattedLabels = values.labels?.reduce((acc, { key, value }) => {
            if (key) {
                acc[key] = value;
            }
            return acc;
        }, {});

        const params = {
            ...values,
            labels: formattedLabels,
            http: {
                url: values.http.url,
                timeout: Number(values.http.timeout),
            },
        }

        if (type === 'create') {
            await handleCreate(params)
        }

        if (type === 'update') {
            params.id = selectedRow.id
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
        const values = form.getFieldsValue();
        await form.validateFields()
        await handleFormSubmit(values)
        setSubmitLoading(false)
    }

    const handleTestConnection = async () => {
        setTestLoading(true)
        // 获取表单数据
        const values = await form.validateFields().catch((err) => null);
        const formattedLabels = values.labels?.reduce((acc, { key, value }) => {
            if (key) {
                acc[key] = value;
            }
            return acc;
        }, {});
        if (!values) {
            // 如果表单验证失败，直接返回
            return;
        }

        try {
            const params = {
                ...values,
                labels: formattedLabels,
                http: {
                    url: values.http.url,
                    timeout: Number(values.http.timeout),
                },
            }
           await DatasourcePing(params)
        } catch (error) {
            console.error('连接测试失败:', error);
        }
        setTestLoading(false)
    };

    return (
        <Drawer
            title="创建数据源"
            open={visible}
            onClose={onClose}
            size='large'
            footer={
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Button
                        type="default"
                        onClick={handleTestConnection}
                        loading={testLoading}
                    >
                        连接测试
                    </Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitLoading}
                        onClick={handleSubmit}
                        style={{
                            backgroundColor: '#000000'
                        }}
                    >
                        提交
                    </Button>
                </div>
            }
        >
            <Form form={form} name="form_item_path" layout="vertical">
                <MyFormItem
                    name="name"
                    label="数据源名称"
                    rules={[{required: true}]}>
                    <Input
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        disabled={type === 'update'}/>
                </MyFormItem>

                <label>标签</label>
                <Alert
                    message="提示：可添加外部标签(external labels), 它将会添加到事件当中用于区分数据来源。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 20, marginTop:'10px' }}
                />

                <Form.List name="labels">
                    {(fields, { add, remove }) => (
                        <>
                            {fields.map(({ key, name, ...restField }) => (
                                <div
                                    key={key}
                                    style={{
                                        display: 'flex',
                                        marginBottom: 8,
                                        gap: '8px', // 控制组件之间的间距
                                        alignItems: 'center', // 垂直居中
                                    }}
                                >
                                    {/* 键（key）输入框 */}
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'key']}
                                        style={{ flex: 3 }} // 占比 3
                                        rules={[{ required: true, message: '请输入标签键（key）' }]}
                                    >
                                        <Input placeholder="键（key）" />
                                    </Form.Item>

                                    {/* 值（value）输入框 */}
                                    <Form.Item
                                        {...restField}
                                        name={[name, 'value']}
                                        style={{ flex: 3 }} // 占比 3
                                        rules={[{ required: true, message: '请输入标签值（value）' }]}
                                    >
                                        <Input placeholder="值（value）" />
                                    </Form.Item>

                                    {/* 删除按钮 */}
                                    <MinusCircleOutlined
                                        style={{
                                            // flex: 1, // 占比 1
                                            marginTop: '-25px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            cursor: 'pointer',
                                        }}
                                        onClick={() => remove(name)}
                                    />
                                </div>
                            ))}

                            <Form.Item>
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    block
                                    icon={<PlusOutlined />}
                                    disabled={fields.length >= 10}
                                >
                                    添加标签
                                </Button>
                            </Form.Item>
                        </>
                    )}
                </Form.List>

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
                            <Input
                                type={"number"}
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
            </Form>
        </Drawer>
    )
}