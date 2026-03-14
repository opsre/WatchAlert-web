import {
    Form,
    Input,
    Button,
    Select,
    Modal,
    message,
    Alert,
    Checkbox
} from 'antd'
import React, { useState, useEffect, useCallback } from 'react'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'
import { RecordingRuleCreate, RecordingRuleGet, RecordingRuleUpdate } from '../../../api/recordingRule'
import { getDatasource, getDatasourceList } from '../../../api/datasource'
import { useParams, useNavigate } from 'react-router-dom'
import { Breadcrumb } from "../../../components/Breadcrumb"
import { PrometheusPromQL } from "../../promethues";
import { SearchViewMetrics } from "../preview/searchViewMetrics.tsx";
import { useAppContext } from '../../../context/RuleContext';
import { number } from 'framer-motion'

const MyFormItemContext = React.createContext([])
const { Option } = Select;

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}


export const RecordingRuleCreatePage = ({ type = 'add' }) => {
    const searchParams = new URLSearchParams(window.location.search);
    const { id: ruleGroupId, ruleId } = useParams()
    const navigate = useNavigate()
    const { appState } = useAppContext();
    const [form] = Form.useForm()
    const [datasourceList, setDatasourceList] = useState([])
    const [enabled, setEnabled] = useState(true)
    const [metricAddress, setMetricAddress] = useState("")
    const [promQL, setPromQL] = useState("")
    const [selectedItems, setSelectedItems] = useState([])
    const [openMetricQueryModel, setOpenMetricQueryModel] = useState(false)
    const [viewMetricsModalKey, setViewMetricsModalKey] = useState(0);
    const [loading, setLoading] = useState(false);

    const initBasicInfo = (selectedRow) => {
        const labelsArray = Object.entries(selectedRow.labels || {}).map(([key, value]) => ({
            key,
            value,
        }))

        // 设置表单值
        form.setFieldsValue({
            metricName: selectedRow.metricName,
            description: selectedRow.description || '',
            datasourceId: selectedRow.datasourceId,
            evalInterval: selectedRow.evalInterval,
            labels: labelsArray,
            promQL: selectedRow.promQL
        })
    }

    useEffect(() => {
        if (searchParams.get("clone") === "true"){
            const copyData = appState?.cloneRecodingRule
            initBasicInfo(copyData)
        }
    },[])

    // 获取数据源列表
    const fetchRuleData = useCallback(async () => {
        try {
            setLoading(true)
            const res = await RecordingRuleGet({ ruleId: ruleId, ruleGroupId: parseInt(ruleGroupId, 10) })
            const data = res?.data
            if (data) {
                setEnabled(data.enabled)
                setPromQL(data.promQL)
                setSelectedItems(data.datasourceId)

                initBasicInfo(data)

                // Fetch datasource info to get the URL
                if (data.datasourceId) {
                    const url = await handleGetDatasourceInfo(data.datasourceId)
                    setMetricAddress(url)
                }
            }
        } catch (error) {
            console.error('Failed to fetch rule data:', error)
            message.error('获取规则信息失败')
        } finally {
            setLoading(false)
        }
    }, [ruleId, ruleGroupId, form])
    
    const fetchDatasourceList = useCallback(async () => {
        try {
            const res = await getDatasourceList()
            const filteredData = res?.data?.filter(item => 
                item.type === "Prometheus" && item.write.enabled === "On"
            )

            setDatasourceList(filteredData)
        } catch (error) {
            console.error('获取数据源列表失败:', error)
        }
    }, [])

    const handleGetPromQL = () =>{
        if (promQL){
            return promQL
        }
        return form.getFieldValue('promQL')
    }

    const handleSelectedDsItem = async (id) => {
        // 获取数据源信息
        const url = await handleGetDatasourceInfo(id);

        setSelectedItems(id);

        // 更新metricAddress
        setMetricAddress(url);
    };

    const handleGetDatasourceInfo = async (id)  => {
        try {
            const params = {
                id: id,
            }
            const res = await getDatasource(params)

            if (res?.data?.http?.url) {
                return res?.data?.http?.url
            }
            return ""
        } catch (error) {
            console.error(`Error fetching datasource for ID ${id}:`, error)
        }
    }

    // 表单提交
    const handleSubmit = async (values) => {
        try {
            if (promQL === ""){
                message.error("PromQL 不可为空")
                return
            }

            const formattedLabels = values.labels?.reduce((acc, { key, value }) => {
                if (key) {
                    acc[key] = value
                }
                return acc
            }, {})

            if (type === 'add') {
                const params = {
                    description: values.description || '',
                    datasourceType: values.datasourceType,
                    datasourceId: values.datasourceId,
                    metricName: values.metricName,
                    promQL: promQL,
                    labels: formattedLabels,
                    evalInterval: Number(values.evalInterval),
                    enabled: enabled,
                    ruleGroupId: parseInt(ruleGroupId, 10)
                }

                await RecordingRuleCreate(params)
                message.success('记录规则创建成功')
                navigate(`/recordingRules/${ruleGroupId}/list`)
            } else if (type === 'edit') {
                const params = {
                    ruleId: ruleId,
                    ruleGroupId: parseInt(ruleGroupId, 10),
                    description: values.description || '',
                    datasourceType: values.datasourceType,
                    datasourceId: values.datasourceId,
                    metricName: values.metricName,
                    promQL: promQL,
                    labels: formattedLabels,
                    evalInterval: Number(values.evalInterval),
                    enabled: enabled,
                }

                await RecordingRuleUpdate(params)
                message.success('记录规则更新成功')
                navigate(`/recordingRules/${ruleGroupId}/list`)
            }
        } catch (error) {
            console.error(type === 'add' ? '创建记录规则失败:' : '更新记录规则失败:', error)
            message.error(type === 'add' ? '创建记录规则失败' : '更新记录规则失败')
        }
    }

    useEffect(() => {
        fetchDatasourceList()

        if (type === 'edit' && ruleId) {
            fetchRuleData()
        }
    }, [type, ruleId, fetchDatasourceList, fetchRuleData])

    // 当数据源列表加载完成后，确保表单值正确显示
    useEffect(() => {
        if (type === 'edit' && datasourceList.length > 0 && form.getFieldValue('datasourceId')) {
            // 重新设置数据源值以确保Select组件能正确显示
            const currentDsId = form.getFieldValue('datasourceId')
            form.setFieldsValue({ datasourceId: currentDsId })
        }
    }, [datasourceList, type, form])

    const handleQueryMetrics = async () => {
        setOpenMetricQueryModel(true)
    };

    const handleCloseMetricModel = () =>{
        setOpenMetricQueryModel(false)
    }

    const handleInputChange = (e) => {
        // 移除输入值中的空格
        const newValue = e.target.value.replace(/\s/g, '')
        e.target.value = newValue
    }

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>加载中...</div>
    }

    return (
        <>
            <Breadcrumb items={['告警管理', '记录规则', type === 'edit' ? '编辑' : '创建']} />

            <div style={{
                textAlign: 'left',
                width: '100%',
                alignItems: 'flex-start',
                maxHeight: 'calc((-120px + 100vh))',
                overflowY: 'auto',
                marginTop: '10px'
            }}>        
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        preserve={false}
                        initialValues={{
                            evalInterval: 60,
                        }}
                    >
                        {/* 基础信息 */}
                        <div>                            
                            <Form.Item
                                label="指标名称"
                                name="metricName"
                                rules={[
                                    { required: true, message: '请输入指标名称' },
                                    { 
                                        pattern: /^[a-zA-Z0-9_:]+$/,
                                        message: '只允许输入英文、数字、下划线(_)和英文冒号(:)'
                                    }
                                ]}
                            >
                                <Input placeholder="请输入指标名称" />
                            </Form.Item>

                            <label>额外标签</label>
                            <div style={{marginTop: '8px'}}>
                                <Form.List name="labels">
                                    {(fields, { add, remove }) => (
                                        <>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <div
                                                    key={key}
                                                    style={{
                                                        display: "flex",
                                                        marginBottom: 8,
                                                        gap: "8px",
                                                        alignItems: "center",
                                                    }}
                                                >
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "key"]}
                                                        style={{ flex: 3 }}
                                                        rules={[
                                                            { required: true, message: "请输入标签键（key）" },
                                                            { 
                                                                pattern: /^[a-zA-Z0-9_]+$/,
                                                                message: '只允许输入英文、数字、下划线(_)'
                                                            }
                                                        ]}
                                                    >
                                                        <Input placeholder="键（key）" onChange={handleInputChange}/>
                                                    </Form.Item>

                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "value"]}
                                                        style={{ flex: 3 }}
                                                        rules={[
                                                            { required: true, message: "请输入标签值（value）" },
                                                            { 
                                                                pattern: /^[a-zA-Z0-9_]+$/,
                                                                message: '只允许输入英文、数字、下划线(_)'
                                                            }
                                                        ]}
                                                    >
                                                        <Input placeholder="值（value）" onChange={handleInputChange}/>
                                                    </Form.Item>

                                                    <MinusCircleOutlined
                                                        style={{
                                                            marginTop: "-25px",
                                                            display: "flex",
                                                            justifyContent: "center",
                                                            alignItems: "center",
                                                            cursor: "pointer",
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
                            </div>
                     
                            <Form.Item
                                label="数据源"
                                name="datasourceId"
                                rules={[{ required: true, message: '请选择数据源' }]}
                            >
                                <Select
                                    placeholder="请选择数据源"
                                    showSearch
                                    optionFilterProp="children"
                                    onChange={(value)=>{handleSelectedDsItem(value)}}
                                    filterOption={(input, option) =>
                                        (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                >
                                    {datasourceList.map((ds) => (
                                        <Option key={ds.id} value={ds.id}>
                                            {ds.name}
                                        </Option>
                                    ))}
                                </Select>
                            </Form.Item>
                      
                            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                <MyFormItem
                                    name="promQL"
                                    label={<><span style={{ marginInlineEnd: '4px', color: '#ff4d4f', fontSize: '14px', fontFamily: 'SimSun,sans-serif'}}>*</span>PromQL</>}
                                    style={{width: '100%', height: '100%'}}
                                >
                                    <PrometheusPromQL
                                        addr={metricAddress}
                                        value={handleGetPromQL}
                                        setPromQL={setPromQL}
                                    />
                                </MyFormItem>
                                <Button
                                    type="primary"
                                    style={{backgroundColor: '#000', borderColor: '#000', marginTop: '5px'}}
                                    onClick={() => {
                                        if (selectedItems.length === 0) {
                                            message.error("请先选择数据源")
                                            return
                                        }
                                        handleQueryMetrics()
                                    }}
                                >
                                    数据预览
                                </Button>
                            </div>
                    
                            <Form.Item
                                label="执行频率"
                                name="evalInterval"
                                rules={[
                                    { required: true, message: '请输入执行频率' },
                                    { 
                                        validator: (_, value) => {
                                            if (!value || value >= 30) {
                                                return Promise.resolve()
                                            }
                                            return Promise.reject(new Error('执行频率不能低于30秒'))
                                        }
                                    }
                                ]}
                            >
                                <Input
                                    type="number"
                                    min={30} 
                                    style={{ width: '100%' }} 
                                    placeholder="请输入执行频率" 
                                    addonAfter={"秒"}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value !== '' && !/^\d+$/.test(value)) {
                                            e.target.value = value.replace(/\D/g, ''); // 移除非数字字符
                                        }
                                    }}
                                />
                            </Form.Item>

                            <div style={{display: 'flex', alignItems: 'center'}}>
                                <span style={{marginRight: 8}}>启用/禁用</span>
                                <Checkbox
                                    style={{marginTop: '0', marginRight: '10px'}}
                                    checked={enabled}
                                    onChange={(e) => setEnabled(e.target.checked)}
                                />
                            </div>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '8px'}}>
                            <Button onClick={() => navigate(-1)}>
                                取消
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                style={{
                                    backgroundColor: '#000000'
                                }}
                                loading={loading}
                            >
                                {type === 'edit' ? '更新' : '提交'}
                            </Button>
                        </div>
                    </Form>
            </div>

            <Modal
                centered
                key={viewMetricsModalKey}
                open={openMetricQueryModel}
                onCancel={() => {
                    handleCloseMetricModel()
                    setViewMetricsModalKey(prev => prev + 1); // Change key to force remount
                }}
                width={1000}
                footer={null} // 不显示底部按钮
                styles={{
                    body: {
                        height: '80vh', // 固定高度
                        overflowY: 'auto', // 支持垂直滚动
                        padding: '12px',
                    },
                }}
            >
                <SearchViewMetrics
                    key={`search-view-${viewMetricsModalKey}`}
                    datasourceType={"Prometheus"}
                    datasourceId={[selectedItems]}
                    promQL={promQL}
                    displayMode='both'
                />
            </Modal>
        </>
    )
}
