import {  Form, Input, Button, Switch, Divider, Select, InputNumber, Radio, Typography } from 'antd'
import React, { useState, useEffect } from 'react'
import { getNoticeList } from '../../api/notice'
import { useParams } from 'react-router-dom'
import {ProbingCreate, ProbingSearch, ProbingUpdate} from "../../api/probing";
import TextArea from "antd/es/input/TextArea";
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

const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatPath = React.useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

export const CreateProbingRule = ({ type, handleList }) => {
    const [form] = Form.useForm()
    const { id } = useParams()
    const [selectedRow,setSelectedRow] = useState(null)
    const [enabled, setEnabled] = useState(true) // 设置初始状态为 true
    const [recoverNotify,setRecoverNotify] = useState(true)
    const [noticeOptions, setNoticeOptions] = useState([])  // 通知对象列表
    // 禁止输入空格
    const [spaceValue, setSpaceValue] = useState('')
    const [loading, setLoading] = useState(true);
    const [protocolType, setProtocolType] = useState('HTTP') // 协议类型
    const [methodType, setMethodType] = useState('GET') // 方法类型
    const [calculate,setCalculate] = useState(">")
    const [submitLoading,setSubmitLoading] = useState(false)
    const httpOptions=[
        {
            value: 'StatusCode',
            label: '状态码'
        },
        {
            value: 'Latency',
            label: '响应延迟'
        },
    ]
    const icmpOptions = [
        {
            value: 'PacketLoss',
            label: '丢包率'
        },
        {
            value: 'MinRtt',
            label: '最小耗时'
        },
        {
            value: 'MaxRtt',
            label: '最大耗时'
        },
        {
            value: 'AvgRtt',
            label: '平均耗时'
        },
    ]
    const tcpOptions = [
        {
            value: 'IsSuccessful',
            label: ''
        }
    ]
    const sslOptions = [
        {
            value: 'TimeRemaining',
            label: '证书有效时间'
        }
    ]

    useEffect(() => {
        form.setFieldsValue({
            ruleType: 'HTTP',
            repeatNoticeInterval: 60,
            probingEndpointConfig: {
                strategy: {
                    evalInterval: 10,
                    timeout: 10,
                    failure: 3,
                }
            }
        })

        const handleSearchRuleInfo = async ()=>{
            try {
                const params = {
                    ruleId: id
                };
                const res = await ProbingSearch(params);
                setSelectedRow(res?.data); // 更新状态
            } catch (error) {
                console.error('Error fetching rule info:', error);
            } finally {
                setLoading(false); // 请求完成后设置 loading 状态
            }
        }

        if (type === "edit"){
            handleSearchRuleInfo()
        }

        handleGetNoticeData()
    }, [])

    useEffect(() => {
        if (selectedRow) {
            setProtocolType(selectedRow.ruleType)
            setRecoverNotify(selectedRow.recoverNotify)
            setEnabled(selectedRow.enabled)
            setMethodType(selectedRow.probingEndpointConfig.http.method)
            setCalculate(selectedRow.probingEndpointConfig.strategy.operator)
            form.setFieldsValue({
                ruleName: selectedRow.ruleName,
                ruleType: selectedRow.ruleType,
                repeatNoticeInterval: selectedRow.repeatNoticeInterval,
                probingEndpointConfig: {
                    endpoint: selectedRow.probingEndpointConfig.endpoint,
                    icmp: {
                        interval: selectedRow.probingEndpointConfig.icmp.interval,
                        count: selectedRow.probingEndpointConfig.icmp.count,
                    },
                    http: {
                        method: selectedRow.probingEndpointConfig.http.method,
                        header: selectedRow.probingEndpointConfig.http.header,
                        body: selectedRow.probingEndpointConfig.http.body,
                    },
                    strategy: {
                        timeout: selectedRow.probingEndpointConfig.strategy.timeout,
                        evalInterval: selectedRow.probingEndpointConfig.strategy.evalInterval,
                        failure: selectedRow.probingEndpointConfig.strategy.failure,
                        operator: selectedRow.probingEndpointConfig.strategy.operator,
                        field: selectedRow.probingEndpointConfig.strategy.field,
                        expectedValue: selectedRow.probingEndpointConfig.strategy.expectedValue,
                    }
                },
                noticeId: selectedRow.noticeId,
                annotations: selectedRow.annotations,
                recoverNotify: selectedRow.recoverNotify,
                enabled: selectedRow.enabled
            })
        }
    }, [selectedRow, form])

    const handleCreate = async (params) => {
        try {
            await ProbingCreate(params)
            handleList()
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleUpdate = async (params) => {
        try {
            const newParams = {
                ...params,
                ruleId: selectedRow.ruleId
            }
            await ProbingUpdate(newParams)
            handleList()
        } catch (error) {
            console.error(error)
        } finally {
            setSubmitLoading(false)
        }
    }

    // 创建
    const handleFormSubmit = async (values) => {
        const params = {
            ...values,
            ruleName: protocolType+" 拨测任务",
            enabled: enabled,
            recoverNotify: recoverNotify,
            probingEndpointConfig:{
                ...values.probingEndpointConfig,
                http: {
                    ...values.probingEndpointConfig.http,
                    method: methodType,
                    // header:,
                    // body: ,
                },
                strategy: {
                    ...values.probingEndpointConfig.strategy,
                    operator: calculate,
                }
            }
        }

        if (type === 'add') {
            await handleCreate(params)
        }

        if (type === 'edit') {
            const newParams = {
                ...params,
                ruleId: selectedRow.ruleId
            }
            await handleUpdate(newParams)
        }

        window.history.back()
    }

    // 获取通知对象
    const handleGetNoticeData = async () => {
        const res = await getNoticeList()
        const newData = res.data.map((item) => ({
            label: item.name,
            value: item.uuid
        }))
        // 将数据设置为选项对象数组
        setNoticeOptions(newData)
    }

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

    if (loading && type === "edit") {
        return <div>Loading...</div>;
    }

    const urlPattern = /^(https?:\/\/)[a-zA-Z0-9.-]+(?::\d+)?(?:\/[^\s]*)?$/; // HTTP(S) URL 校验
    const domainIpPattern = /^(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3})$/; // 域名或IP校验
    const tcpPattern = /^(([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}|(\d{1,3}\.){3}\d{1,3}):\d+$/; // TCP: IP/域名:port
    const domainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/; // 仅域名校验（SSL）

    const optionsMap = {
        HTTP: httpOptions,
        ICMP: icmpOptions,
        TCP: tcpOptions,
        SSL: sslOptions,
    };
    const options = optionsMap[protocolType] || [];

    return (
        <div style={{textAlign:'left',
            width: '100%',
            alignItems: 'flex-start',
            marginTop: '-20px',
            maxHeight: 'calc((-145px + 100vh) - 65px - 40px)',
            overflowY: 'auto',
        }}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <Divider orientation="left">基础配置</Divider>
                <div style={{display: 'flex', gap: '10px'}}>
                    <MyFormItem
                        name="ruleType"
                        label="拨测协议"
                        style={{ width: '100%' }}
                        rules={[{ required: true }]}
                    >
                        <Select
                            placeholder="选择拨测协议"
                            style={{ flex: 1 }}
                            options={[
                                { value: 'HTTP', label: 'HTTP' },
                                { value: 'ICMP', label: 'ICMP' },
                                { value: 'TCP', label: 'TCP' },
                                { value: 'SSL', label: 'SSL' },
                            ]}
                            defaultValue={protocolType}
                            value={protocolType}
                            onChange={(value) => setProtocolType(value)}
                        />
                    </MyFormItem>
                </div>

                <MyFormItemGroup prefix={['probingEndpointConfig']}>
                    <div style={{display: 'flex', gap: '10px'}}>
                        <MyFormItem
                            name="endpoint"
                            label="端点"
                            style={{ width: '100%' }}
                            rules={[
                                { required: true, message: '请输入端点' },
                                {
                                    validator: (_, value) => {

                                        switch (protocolType) {
                                            case "HTTP":
                                                return urlPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject('请输入有效的完整URL, 例如: http(s)://github.com');
                                            case "ICMP":
                                                return domainIpPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject('请输入有效的域名或IP地址, 例如: github.com / 1.1.1.1');
                                            case "TCP":
                                                return tcpPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject('请输入有效的 IP/域名:端口, 例如: 1.1.1.1:80');
                                            case "SSL":
                                                return domainPattern.test(value)
                                                    ? Promise.resolve()
                                                    : Promise.reject('请输入有效的域名, 例如: github.com');
                                            default:
                                                return Promise.resolve();
                                        }
                                    }
                                }
                            ]}
                        >
                            {protocolType === "HTTP" ? (
                                <Input
                                    addonBefore={
                                        <Select
                                            defaultValue="GET"
                                            style={{ flex: 1 }}
                                            options={[
                                                { value: 'GET', label: 'GET' },
                                                { value: 'POST', label: 'POST' },
                                            ]}
                                            value={methodType}
                                            onChange={setMethodType}
                                        />
                                    }
                                    value={spaceValue}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                />
                            ) : (
                                <Input
                                    value={spaceValue}
                                    onChange={handleInputChange}
                                    onKeyPress={handleKeyPress}
                                />
                            )}
                        </MyFormItem>
                    </div>

                    {/* ICMP Ping Settings */}
                    {protocolType === "ICMP" && (
                        <MyFormItemGroup prefix={['icmp']}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <MyFormItem
                                    name="interval"
                                    label="请求间隔(s)"
                                    style={{ width: '100%' }}
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber type="number" min={1} placeholder="1" style={{ width: '100%' }} />
                                </MyFormItem>
                                <MyFormItem
                                    name="count"
                                    label="请求总数(个)"
                                    style={{ width: '100%' }}
                                    rules={[{ required: true }]}
                                >
                                    <InputNumber type="number" min={1} placeholder="1" style={{ width: '100%' }} />
                                </MyFormItem>
                            </div>
                        </MyFormItemGroup>
                    )}

                    {/* HTTP Request Settings */}
                    {protocolType === "HTTP" && (
                        <MyFormItemGroup prefix={['http']}>
                            {/* Request Body for POST Method */}
                            {methodType === "POST" && (
                                <MyFormItem
                                    name="body"
                                    label="请求体"
                                    style={{ width: '100%' }}
                                    rules={[{ required: true }]}
                                >
                                    <TextArea rows={4} placeholder="输入请求体" />
                                </MyFormItem>
                            )}
                        </MyFormItemGroup>
                    )}

                    <Divider orientation="left">策略配置</Divider>
                    <MyFormItemGroup prefix={['strategy']}>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <MyFormItem name="evalInterval" label="执行频率(s)"
                                        style={{
                                            width: '100%',
                                        }}
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}>
                                <InputNumber type={"number"} min={1} style={{width: '100%'}}/>
                            </MyFormItem>
                            <MyFormItem name="timeout" label="超时时间(s)"
                                        style={{
                                            width: '100%',
                                        }}
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}>
                                <InputNumber type={"number"} min={1} style={{width: '100%'}}/>
                            </MyFormItem>
                        </div>
                        <MyFormItem name="failure" label="失败次数"
                                    style={{
                                        width: '100%',
                                    }}
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}>
                            <InputNumber type={"number"} min={1} placeholder="1" style={{width: '100%'}}/>
                        </MyFormItem>

                        {protocolType !== "TCP" && (
                            <div style={{display: 'flex', gap: '10px'}}>
                                <MyFormItem
                                    name="field"
                                    label="字段"
                                    style={{width: '50%'}}
                                    rules={[{required: true}]}
                                >
                                    <Select
                                        placeholder="选择需要评估的字段"
                                        style={{
                                            width: '100%',
                                            borderRadius: '0',
                                        }}
                                        options={options}
                                    />
                                </MyFormItem>

                                <MyFormItem
                                    name="expectedValue"
                                    label="表达式"
                                    style={{width: '50%'}}
                                    rules={[{required: true}]}
                                >
                                    <InputNumber
                                        type="number"
                                        min={1}
                                        placeholder="1"
                                        style={{width: '100%', borderRadius: '0'}}
                                        addonBefore={
                                            <Select
                                                placeholder="运算"
                                                style={{
                                                    width: '100px',
                                                    borderRadius: '0',
                                                }}
                                                defaultValue={">"}
                                                value={calculate}
                                                options={[
                                                    {value: '>', label: '大于'},
                                                    {value: '>=', label: '大于等于'},
                                                    {value: '<', label: '小于'},
                                                    {value: '<=', label: '小于等于'},
                                                    {value: '==', label: '等于'},
                                                    {value: '!=', label: '不等于'},
                                                ]}
                                                onChange={setCalculate}
                                            />
                                        }
                                        addonAfter={"时触发告警"}
                                    />
                                </MyFormItem>
                            </div>
                        )}
                        {protocolType === "TCP" && (
                            <Typography.Text type="secondary" style={{ marginTop: '5px', fontSize: '12px' }}>
                                {"> 在对端点执行 TCP 探测时，如果探测失败，将触发相应的告警。"}
                            </Typography.Text>
                        )}

                    </MyFormItemGroup>

                </MyFormItemGroup>

                <Divider orientation="left">通知配置</Divider>

                <div>
                    <MyFormItem
                        name="annotations"
                        label="告警详情"
                        tooltip="${address}：获取端点信息，${value}：获取数据结果"
                        rules={[
                            {
                                required: true,
                            },
                        ]}>
                        <TextArea rows={2} placeholder="输入告警事件的详细消息内容，如：站点: ${address}，请求不可达请紧急排查!" maxLength={10000} />
                    </MyFormItem>
                </div>

                <div style={{display: 'flex'}}>
                    <MyFormItem
                        name="noticeId"
                        label="通知对象"
                        tooltip="默认通知对象"
                        style={{
                            marginRight: '10px',
                            width: '50%',
                        }}
                        rules={[{required: true}]}
                    >
                        <Select
                            style={{width: '100%'}}
                            allowClear
                            placeholder="选择通知对象"
                            options={noticeOptions}
                        />
                    </MyFormItem>

                    <MyFormItem
                        name="repeatNoticeInterval"
                        label="重复通知"
                        style={{width: '50%'}}
                        rules={[{required: true,}
                        ]}
                    >
                        <InputNumber
                            style={{width: '100%'}}
                            addonAfter={<span>分钟</span>}
                            min={1}
                        />
                    </MyFormItem>
                </div>

                <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginTop: '10px'}}>
                    <MyFormItem
                        style={{marginBottom: 0}}
                        name="recoverNotify"
                        valuePropName="checked"
                    >
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{marginRight: 8}}>恢复通知</span>
                            <Switch
                                value={recoverNotify}
                                checked={recoverNotify}
                                onChange={setRecoverNotify}
                            />
                        </div>
                    </MyFormItem>
                </div>

                <div style={{marginTop: '20px'}}>
                    <MyFormItem
                        style={{marginBottom: 0}}
                        name="enabled"
                        valuePropName="checked"
                    >
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{marginRight: 8}}>规则状态</span>
                            <Switch value={enabled} checked={enabled} onChange={(e) => {
                                setEnabled(e)
                            }}/>
                        </div>
                    </MyFormItem>
                </div>

                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitLoading}
                        style={{
                            backgroundColor: '#000000'
                        }}
                    >
                        提交
                    </Button>
                </div>
            </Form>
        </div>
    )
}