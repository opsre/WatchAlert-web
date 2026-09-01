import {
    Form,
    Input,
    Button,
    Select,
    Modal,
    message,
    Checkbox,
    InputNumber,
    Spin
} from 'antd'
import React, { useState, useEffect, useCallback } from 'react'
import { MinusCircleOutlined, PlusOutlined, BarChartOutlined } from '@ant-design/icons'
import { RecordingRuleCreate, RecordingRuleGet, RecordingRuleUpdate } from '../../../api/recordingRule'
import { getDatasource, getDatasourceList } from '../../../api/datasource'
import { useParams, useNavigate } from 'react-router-dom'
import { Breadcrumb } from '../../../components/Breadcrumb'
import { PrometheusPromQL } from '../../promethues'
import { SearchViewMetrics } from '../preview/searchViewMetrics.tsx'
import { useAppContext } from '../../../context/RuleContext'
import './create.css'

const { Option } = Select
const METRIC_NAME_PATTERN = /^[a-zA-Z0-9_:]+$/
const LABEL_PATTERN = /^[a-zA-Z0-9_]+$/

export const RecordingRuleCreatePage = ({ type = 'add' }) => {
    const searchParams = new URLSearchParams(window.location.search)
    const { id: ruleGroupId, ruleId } = useParams()
    const navigate = useNavigate()
    const { appState } = useAppContext()
    const [form] = Form.useForm()
    const [datasourceList, setDatasourceList] = useState([])
    const [enabled, setEnabled] = useState(true)
    const [metricAddress, setMetricAddress] = useState('')
    const [promQL, setPromQL] = useState('')
    const [selectedDatasourceId, setSelectedDatasourceId] = useState(null)
    const [openMetricQueryModel, setOpenMetricQueryModel] = useState(false)
    const [viewMetricsModalKey, setViewMetricsModalKey] = useState(0)
    const [loading, setLoading] = useState(false)

    const initBasicInfo = (selectedRow = {}) => {
        const labelsArray = Object.entries(selectedRow.labels || {}).map(([key, value]) => ({ key, value }))
        const datasourceId = selectedRow.datasourceId || null

        form.setFieldsValue({
            metricName: selectedRow.metricName,
            description: selectedRow.description || '',
            datasourceType: selectedRow.datasourceType || 'Prometheus',
            datasourceId,
            evalInterval: selectedRow.evalInterval,
            labels: labelsArray,
            promQL: selectedRow.promQL || ''
        })
        setEnabled(selectedRow.enabled ?? true)
        setPromQL(selectedRow.promQL || '')
        setSelectedDatasourceId(datasourceId)

        if (datasourceId) {
            handleGetDatasourceInfo(datasourceId).then(setMetricAddress)
        }
    }

    const handleGetDatasourceInfo = async (id) => {
        try {
            const res = await getDatasource({ id })
            return res?.data?.http?.url || ''
        } catch (error) {
            console.error(`Error fetching datasource for ID ${id}:`, error)
            return ''
        }
    }

    const fetchRuleData = useCallback(async () => {
        try {
            setLoading(true)
            const res = await RecordingRuleGet({ ruleId, ruleGroupId: parseInt(ruleGroupId, 10) })
            if (res?.data) {
                initBasicInfo(res.data)
            }
        } catch (error) {
            console.error('Failed to fetch rule data:', error)
            message.error('获取规则信息失败')
        } finally {
            setLoading(false)
        }
    }, [ruleId, ruleGroupId])

    const fetchDatasourceList = useCallback(async () => {
        try {
            const res = await getDatasourceList()
            const filteredData = (res?.data || []).filter(item =>
                item.type === 'Prometheus' && item.write?.enabled === 'On'
            )
            setDatasourceList(filteredData)
        } catch (error) {
            console.error('获取数据源列表失败:', error)
            message.error('获取数据源列表失败')
        }
    }, [])

    useEffect(() => {
        fetchDatasourceList()

        if (type === 'edit' && ruleId) {
            fetchRuleData()
        } else if (searchParams.get('clone') === 'true' && appState?.cloneRecodingRule) {
            initBasicInfo(appState.cloneRecodingRule)
        }
        // 仅在进入页面时初始化，避免克隆数据被表单编辑覆盖。
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleSelectedDatasource = async (datasourceId) => {
        setSelectedDatasourceId(datasourceId)
        setMetricAddress(await handleGetDatasourceInfo(datasourceId))
    }

    const handleSubmit = async (values) => {
        const currentPromQL = (promQL || values.promQL || '').trim()
        if (!currentPromQL) {
            message.error('PromQL 不可为空')
            return
        }

        try {
            const labels = values.labels?.reduce((acc, { key, value }) => {
                if (key) acc[key] = value
                return acc
            }, {})

            const params = {
                ruleGroupId: parseInt(ruleGroupId, 10),
                description: values.description || '',
                datasourceType: 'Prometheus',
                datasourceId: values.datasourceId,
                metricName: values.metricName,
                promQL: currentPromQL,
                labels,
                evalInterval: Number(values.evalInterval),
                enabled
            }

            if (type === 'edit') {
                await RecordingRuleUpdate({ ...params, ruleId })
                message.success('记录规则更新成功')
            } else {
                await RecordingRuleCreate(params)
                message.success('记录规则创建成功')
            }
            navigate(`/recordingRules/${ruleGroupId}/list`)
        } catch (error) {
            console.error(type === 'add' ? '创建记录规则失败:' : '更新记录规则失败:', error)
            message.error(type === 'add' ? '创建记录规则失败' : '更新记录规则失败')
        }
    }

    const handleInputChange = (event) => {
        event.target.value = event.target.value.replace(/\s/g, '')
    }

    const hasDatasource = Boolean(selectedDatasourceId)

    return (
        <>
            <Breadcrumb items={['告警管理', '记录规则', type === 'edit' ? '编辑规则' : '创建规则']} />
            <main className="recording-rule-page">
                <nav className="recording-rule-steps" aria-label="记录规则创建步骤">
                    <div className="recording-rule-step is-active">
                        <span>1</span><div><strong>基础信息</strong><small>指标名称与标签</small></div>
                    </div>
                    <div className={`recording-rule-step is-active`}>
                        <span>2</span><div><strong>计算定义</strong><small>数据源与 PromQL</small></div>
                    </div>
                    <div className="recording-rule-step is-active">
                        <span>3</span><div><strong>发布规则</strong><small>频率与启用状态</small></div>
                    </div>
                </nav>

                <div className="recording-rule-workspace">
                    <Form
                        form={form}
                        className="recording-rule-form"
                        layout="vertical"
                        onFinish={handleSubmit}
                        preserve={false}
                        initialValues={{ datasourceType: 'Prometheus', evalInterval: 60 }}
                    >
                        <section className="recording-form-section">
                            <div className="recording-section-heading">
                                <div><span className="recording-section-index">01</span><h2>基础信息</h2></div>
                            </div>
                            <div className="recording-form-grid">
                                <Form.Item
                                    label="指标名称"
                                    name="metricName"
                                    rules={[
                                        { required: true, message: '请输入指标名称' },
                                        { pattern: METRIC_NAME_PATTERN, message: '只允许输入英文、数字、下划线(_)和英文冒号(:)' }
                                    ]}
                                >
                                    <Input placeholder="例如：service:http_requests:rate5m" />
                                </Form.Item>
                                <Form.Item label="描述" name="description">
                                    <Input placeholder="说明该指标的业务含义和计算方式（可选）" />
                                </Form.Item>
                            </div>

                            <Form.Item label="额外标签" >
                                <Form.List name="labels">
                                    {(fields, { add, remove }) => (
                                        <div>
                                            {fields.map(({ key, name, ...restField }) => (
                                                <div key={key} className="recording-label-row">
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'key']}
                                                        rules={[
                                                            { required: true, message: '请输入标签键' },
                                                            { pattern: LABEL_PATTERN, message: '标签键只允许英文、数字和下划线(_)' }
                                                        ]}
                                                    >
                                                        <Input placeholder="标签键，例如：environment" onChange={handleInputChange} />
                                                    </Form.Item>
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, 'value']}
                                                        rules={[
                                                            { required: true, message: '请输入标签值' },
                                                            { pattern: LABEL_PATTERN, message: '标签值只允许英文、数字和下划线(_)' }
                                                        ]}
                                                    >
                                                        <Input placeholder="标签值，例如：production" onChange={handleInputChange} />
                                                    </Form.Item>
                                                    <Button
                                                        type="text"
                                                        danger
                                                        className="recording-remove-label"
                                                        aria-label="删除标签"
                                                        icon={<MinusCircleOutlined />}
                                                        onClick={() => remove(name)}
                                                    />
                                                </div>
                                            ))}


                                            <Form.Item>
                                                <Button
                                                    type="dashed"
                                                    onClick={() => add()}
                                                    block
                                                    icon={<PlusOutlined/>}
                                                    disabled={fields.length >= 10}
                                                >
                                                    添加标签
                                                </Button>
                                            </Form.Item>
                                        </div>
                                    )}
                                </Form.List>
                            </Form.Item>
                        </section>

                        <section className="recording-form-section">
                            <div className="recording-section-heading">
                                <div><span className="recording-section-index">02</span><h2>计算定义</h2></div>
                            </div>
                            <div className="recording-form-grid">
                                <Form.Item
                                    label="写入数据源"
                                    name="datasourceId"
                                    rules={[{ required: true, message: '请选择数据源' }]}
                                >
                                    <Select
                                        placeholder="请选择支持远端写入的 Prometheus 数据源"
                                        showSearch
                                        optionFilterProp="children"
                                        onChange={handleSelectedDatasource}
                                        filterOption={(input, option) =>
                                            (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                                        }
                                    >
                                        {datasourceList.map((datasource) => (
                                            <Option key={datasource.id} value={datasource.id}>{datasource.name}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    label="执行频率"
                                    name="evalInterval"
                                    rules={[{ required: true, message: '请输入执行频率' }]}
                                >
                                    <InputNumber min={30} precision={0} addonAfter="秒" style={{ width: '100%' }} />
                                </Form.Item>
                            </div>
                            <div className="recording-query-panel">
                                <div className="recording-query-header">
                                    <div>
                                        <strong><span className="recording-required">*</span>PromQL</strong>
                                        <span>查询结果将按执行频率写入目标数据源。</span>
                                    </div>
                                    <Button
                                        icon={<BarChartOutlined />}
                                        disabled={!hasDatasource}
                                        onClick={() => setOpenMetricQueryModel(true)}
                                    >
                                        数据预览
                                    </Button>
                                </div>
                                <Form.Item name="promQL" rules={[{ required: true, message: '请输入 PromQL' }]}>
                                    <PrometheusPromQL addr={metricAddress} value={() => promQL || form.getFieldValue('promQL')} setPromQL={setPromQL} />
                                </Form.Item>
                            </div>
                        </section>

                        <section className="recording-form-section recording-publish-section">
                            <div className="recording-section-heading">
                                <div><span className="recording-section-index">03</span><h2>发布规则</h2></div>
                            </div>
                            <div className="recording-enable-row">
                                <div>
                                    <strong>启用规则</strong>
                                    <span>{enabled ? '保存后立即开始计算和写入指标' : '保存为禁用状态，可稍后在规则列表中启用'}</span>
                                </div>
                                <Checkbox checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />
                            </div>
                            <div className="recording-submit-bar">
                                <div className="recording-submit-status">
                                    <span className={`recording-status-dot ${enabled ? 'is-enabled' : ''}`} />
                                    <span>{enabled ? '规则将处于启用状态' : '规则将处于禁用状态'}</span>
                                </div>
                                <div className="recording-submit-actions">
                                    <Button onClick={() => navigate(-1)}>取消</Button>
                                    <Button type="primary" htmlType="submit" loading={loading} className="recording-submit-button">
                                        {type === 'edit' ? '保存修改' : '创建规则'}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </Form>
                </div>
            </main>

            <Modal
                centered
                key={viewMetricsModalKey}
                open={openMetricQueryModel}
                onCancel={() => {
                    setOpenMetricQueryModel(false)
                    setViewMetricsModalKey((key) => key + 1)
                }}
                width={1000}
                footer={null}
                styles={{ body: { height: '80vh', overflowY: 'auto', padding: '12px' } }}
            >
                <SearchViewMetrics
                    key={`search-view-${viewMetricsModalKey}`}
                    datasourceType="Prometheus"
                    datasourceId={selectedDatasourceId ? [selectedDatasourceId] : []}
                    promQL={promQL || form.getFieldValue('promQL')}
                    displayMode="both"
                />
            </Modal>

            {loading && type === 'edit' && (
                <div className="recording-loading-mask"><Spin tip="正在加载规则信息..." /></div>
            )}
        </>
    )
}
