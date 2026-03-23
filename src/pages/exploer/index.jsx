"use client"

import React, { useState, useEffect } from "react"
import {
    Form,
    Input,
    Button,
    Select,
    Typography,
    Space,
    Divider,
    Row,
    Col,
    Alert,
    Tabs,
    Table,
    DatePicker,
    InputNumber,
    Spin,
    Tag,
    message,
} from "antd"
import {
    PlusOutlined,
    MinusCircleOutlined,
    SearchOutlined,
    LineChartOutlined,
    AppstoreOutlined,
    BarChartOutlined,
    ClockCircleOutlined,
    TagsOutlined,
} from "@ant-design/icons"
import { EventMetricChart } from '../chart/eventMetricChart'
import { queryPromMetrics, queryRangePromMetrics } from '../../api/other'
import { getDatasourceList } from '../../api/datasource'
import { PrometheusPromQL } from '../promethues'
import { Breadcrumb } from "../../components/Breadcrumb"
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

// 查询项组件
const QueryItem = ({ query, index, onRemove, onQueryChange, datasourceOptions }) => {
    const handlePromQLChange = (value) => {
        onQueryChange(index, { ...query, promQL: value })
    }

    return (
        <div
            style={{ marginBottom: '16px' }}
            title={
                <Space>
                    <BarChartOutlined style={{ color: '#000' }} />
                    <Text strong>查询 #{index + 1}</Text>
                </Space>
            }
            extra={
                index > 0 && (
                    <Button
                        type="text"
                        danger
                        icon={<MinusCircleOutlined />}
                        onClick={() => onRemove(index)}
                    >
                        移除
                    </Button>
                )
            }
        >
            <Form layout="vertical">
                <Form.Item
                    label="PromQL 查询语句"
                    required
                    rules={[{ required: true, message: '请输入 PromQL 查询语句' }]}
                >
                    <Input.TextArea
                        rows={3}
                        placeholder='例如：up{job="node"}'
                        value={query.promQL}
                        onChange={(e) => handlePromQLChange(e.target.value)}
                        style={{ fontFamily: 'monospace', fontSize: '13px' }}
                    />
                </Form.Item>
            </Form>
        </div>
    )
}

// 指标数据表格组件 - Card模式，展示所有 values
const MetricTable = ({ metrics, loading }) => {
    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "400px",
                    background: "#fafafa",
                    borderRadius: "8px",
                }}
            >
                <Spin size="large" />
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                        正在获取最新的 Metric 数据
                    </Text>
                </div>
            </div>
        )
    }

    // 准备表格数据 - 支持多个 values 在同一行展示
    const prepareTableData = () => {
        if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
            return []
        }
        
        return metrics
            .filter(item => item && item.values && Array.isArray(item.values) && item.values.length > 0)
            .map((item, index) => {
                // 提取所有 values 的值和时间戳
                const allValues = item.values
                    .filter(v => Array.isArray(v) && v.length >= 2 && v[1] != null)
                    .map(v => ({
                        value: v[1],
                        timestamp: new Date(v[0] * 1000).toLocaleString("zh-CN")
                    }));
                
                return {
                    key: index,
                    metricName: item.metric?.__name__ || `Metric #${index + 1}`,
                    allValues: allValues, 
                    labels: Object.keys(item.metric || {})
                        .filter(key => key !== '__name__')
                        .map(key => ({ key, value: item.metric[key] }))
                }
            })
    }

    const tableColumns = [
        {
            title: '标签',
            dataIndex: 'labels',
            key: 'labels',
            width: 'auto',
            render: (labels) => (
                <Space wrap>
                    {labels.map((label, idx) => (
                        <Tag key={idx} color="blue" style={{ margin: '2px' }}>
                            <Text style={{ fontSize: '12px' }}>
                                <span style={{ fontWeight: 600 }}>{label.key}:</span> {label.value}
                            </Text>
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: '数值 (时间)',
            dataIndex: 'allValues',
            key: 'allValues',
            width: 300,
            render: (allValues) => (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {allValues.map((v, idx) => (
                        <div key={idx}>
                            <Text strong style={{ fontSize: '14px' }}>
                                {v.value}
                            </Text>
                            <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                                ({v.timestamp})
                            </Text>
                        </div>
                    ))}
                </Space>
            )
        },
    ]

    return (
        <Table
            columns={tableColumns}
            dataSource={prepareTableData()}
            pagination={{ pageSize: 10 }}
            size="middle"
            scroll={{ x: 1200 }}
            bordered
        />
    )
}

// 图表视图组件 - Graph 模式，只展示最后一个 value
const ChartView = ({ chartData, metrics, loading }) => {
    const prepareTableData = () => {
        if (!metrics || metrics.length === 0) return []
        
        // 过滤无效数据，只取最后一个值
        return metrics
            .filter(item => item && item.values && Array.isArray(item.values) && item.values.length > 0)
            .map((item, index) => {
                // 只取最后一个值
                const lastValue = item.values[item.values.length - 1]
                
                return {
                    key: index,
                    metricName: item.metric?.__name__ || `Metric #${index + 1}`,
                    value: lastValue[1],
                    timestamp: new Date(lastValue[0] * 1000).toLocaleString("zh-CN"),
                    labels: Object.keys(item.metric || {})
                        .filter(key => key !== '__name__')
                        .map(key => ({ key, value: item.metric[key] }))
                }
            })
    }

    const tableColumns = [
        {
            title: '标签',
            dataIndex: 'labels',
            key: 'labels',
            width: 'auto',
            render: (labels) => (
                <Space wrap>
                    {labels.map((label, idx) => (
                        <Tag key={idx} color="blue" style={{ margin: '2px' }}>
                            <Text style={{ fontSize: '12px' }}>
                                <span style={{ fontWeight: 600 }}>{label.key}:</span> {label.value}
                            </Text>
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: '数值 (时间)',
            dataIndex: 'value',
            key: 'value',
            width: 300,
            render: (value, record) => (
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <div>
                        <Text strong style={{ fontSize: '14px' }}>
                            {value}
                        </Text>
                        <Text type="secondary" style={{ fontSize: '12px', marginLeft: '8px' }}>
                            ({record.timestamp})
                        </Text>
                    </div>
                </Space>
            )
        },
    ]

    if (loading) {
        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "400px",
                    background: "#fafafa",
                    borderRadius: "8px",
                }}
            >
                <Spin size="large" />
                <div style={{ marginTop: "16px", textAlign: "center" }}>
                    <Text type="secondary" style={{ fontSize: "14px" }}>
                        正在获取图表数据
                    </Text>
                </div>
            </div>
        )
    }

    return (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
            <div style={{ marginBottom: "20px" }}>
                <EventMetricChart data={chartData} />
            </div>
            <Divider />
            <div>
                <Table
                    columns={tableColumns}
                    dataSource={prepareTableData()}
                    pagination={{ pageSize: 10 }}
                    size="middle"
                    scroll={{ x: 1200 }}
                    bordered
                />
            </div>
        </Space>
    )
}

// 主组件
export const DataAnalysis = () => {
    const [form] = Form.useForm()
    const [datasourceOptions, setDatasourceOptions] = useState([])
    const [datasourceLoading, setDatasourceLoading] = useState(false)
    const [queries, setQueries] = useState([{ promQL: '', datasourceId: [] }])
    const [activeTab, setActiveTab] = useState('card')
    const [cardData, setCardData] = useState([])
    const [chartData, setChartData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [timeRange, setTimeRange] = useState([
        dayjs().subtract(5, 'minute'),
        dayjs()
    ])
    const [step, setStep] = useState(10)
    const [metricAddress, setMetricAddress] = useState('')

    // 获取数据源列表
    useEffect(() => {
        fetchDatasources()
    }, [])

    const fetchDatasources = async () => {
        try {
            setDatasourceLoading(true)
            const res = await getDatasourceList({})
            if (res.code === 200 && res.data) {
                const options = res.data.filter(item => item.type === 'Prometheus').map(item => ({
                    label: `${item.name}`,
                    value: item.id,
                    url: item.http?.url || '',
                }))
                setDatasourceOptions(options)
                
                // 默认选择第一个数据源的地址
                if (options.length > 0 && !queries[0]?.datasourceId?.[0]) {
                    setMetricAddress(options[0].url || '')
                }
            }
        } catch (error) {
            console.error('获取数据源列表失败:', error)
        } finally {
            setDatasourceLoading(false)
        }
    }

    // 添加查询项
    const handleAddQuery = () => {
        setQueries([...queries, { promQL: '', datasourceId: [] }])
    }

    // 移除查询项
    const handleRemoveQuery = (index) => {
        const newQueries = queries.filter((_, i) => i !== index)
        setQueries(newQueries)
    }

    // 更新查询项
    const handleQueryChange = (index, updatedQuery) => {
        const newQueries = [...queries]
        newQueries[index] = updatedQuery
        setQueries(newQueries)
    }

    // 更新数据源选择 - 修复数据源清空问题
    const handleDatasourceChange = (index, value) => {
        const newQueries = [...queries]
        // value 可能是单个值或 undefined（清空时）
        const datasourceId = value ? [value] : []
        newQueries[index] = { ...queries[index], datasourceId }
        setQueries(newQueries)
        
        console.log('数据源变化:', index, value, datasourceId, newQueries[index])
        
        // 更新 metric 地址
        if (datasourceId && datasourceId.length > 0) {
            const selectedDs = datasourceOptions.find(ds => ds.value === datasourceId[0])
            if (selectedDs) {
                setMetricAddress(selectedDs.url || '')
            }
        } else {
            setMetricAddress('')
        }
    }

    // 执行查询 - 卡片视图（即时查询）
    const fetchCardData = async (queryObj) => {
        try {
            console.log('卡片视图查询参数:', queryObj)
            const params = {
                datasourceIds: queryObj.datasourceId?.[0] || '',
                query: queryObj.promQL,
            }

            const res = await queryPromMetrics(params)
            console.log('卡片视图查询结果:', res)

            if (res.code !== 200) {
                throw new Error(res.msg || "请求失败")
            }

            return res?.data
        } catch (err) {
            console.error("Fetch card data error:", err)
            throw err
        }
    }

    // 执行查询 - 图表视图（时间范围查询）
    const fetchChartData = async (queryObj, startTime, endTime) => {
        try {
            console.log('图表视图查询参数:', queryObj, startTime, endTime)
            const params = {
                datasourceIds: queryObj.datasourceId?.[0] || '',
                query: queryObj.promQL,
                startTime: startTime,
                endTime: endTime,
                step: step,
            }

            const res = await queryRangePromMetrics(params)
            console.log('图表视图查询结果:', res)

            if (res.code !== 200) {
                throw new Error(res.msg || "请求失败")
            }

            return res?.data
        } catch (err) {
            console.error("Fetch chart data error:", err)
            throw err
        }
    }

    // 更新 PromQL - 使用 useCallback 避免不必要的重新渲染
    const handlePromQLChange = React.useCallback((index, value) => {
        setQueries(prev => {
            const newQueries = [...prev]
            newQueries[index] = { ...newQueries[index], promQL: value }
            return newQueries
        })
    }, [])

    // 执行所有查询
    const handleSearch = async () => {
        // 验证所有查询都有 PromQL
        const validQueries = queries.filter(q => q.promQL?.trim() && q.datasourceId?.[0])
        
        if (validQueries.length === 0) {
            message.warning('请至少填写一个有效的 PromQL 查询语句并选择数据源')
            return
        }

        try {
            setLoading(true)
            setError(null)

            if (activeTab === 'card') {
                // 卡片视图模式：只查询即时数据
                const allResults = []
                for (const query of validQueries) {
                    try {
                        const results = await fetchCardData(query)
                        console.log('卡片视图 - API 返回结果:', results)
                        
                        if (results && Array.isArray(results) && results.length > 0) {
                            const processedResults = results.flatMap(r => 
                                r.data?.result?.map(item => ({
                                    ...item,
                                    // 取最后一个值作为当前值
                                    value: item.values && item.values.length > 0 
                                        ? item.values[item.values.length - 1] 
                                        : (item.value || null)
                                })) || []
                            )
                            allResults.push(...processedResults)
                        }
                    } catch (err) {
                        console.error(`Query ${query.promQL} failed:`, err)
                    }
                }
                console.log('卡片视图最终结果数量:', allResults.length)
                setCardData(allResults)
            } else {
                // 图表视图模式：查询时间范围数据
                const startTime = timeRange[0]?.unix() || Math.floor(Date.now() / 1000) - 300
                const endTime = timeRange[1]?.unix() || Math.floor(Date.now() / 1000)
                
                console.log('图表视图 - 开始查询', { startTime, endTime })
                
                const allResults = []
                for (const query of validQueries) {
                    try {
                        const results = await fetchChartData(query, startTime, endTime)
                        console.log('图表视图 - API 返回结果:', results)
                        
                        if (results && Array.isArray(results) && results.length > 0) {
                            // 处理 matrix 类型的数据，将 values 转换为 value 格式
                            const processedResults = results.flatMap(r => 
                                r.data?.result?.map(item => ({
                                    ...item,
                                    // 取最后一个值作为当前值
                                    value: item.values && item.values.length > 0 
                                        ? item.values[item.values.length - 1] 
                                        : (item.value || null)
                                })) || []
                            )
                            console.log('图表视图 - 处理后的数据数量:', processedResults.length)
                            console.log('图表视图 - 第一条数据示例:', processedResults[0])
                            allResults.push(...processedResults)
                        }
                    } catch (err) {
                        console.error(`Query ${query.promQL} failed:`, err)
                    }
                }
                
                console.log('图表视图 - 最终结果数量:', allResults.length)
                
                // 设置图表数据（直接传递处理后的结果数组）
                if (allResults.length > 0) {
                    setChartData([{
                        status: 'success',
                        data: {
                            resultType: 'matrix',
                            result: allResults
                        }
                    }])
                    // 同时设置 metrics 用于表格显示
                    setCardData(allResults)
                } else {
                    setChartData([])
                    setCardData([])
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "网络错误")
        } finally {
            setLoading(false)
        }
    }

    // Tab 切换处理
    const handleTabChange = (key) => {
        setActiveTab(key)
        // 清空当前数据，等待下次查询
        setCardData([])
        setChartData(null)
    }

    // 渲染查询区域
    const renderQueryArea = () => (
        <div style={{ marginBottom: '24px' }}>
            {queries.map((query, index) => (
                <div key={index} style={{ 
                    border: '1px solid #f0f0f0',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    background: '#fff'
                }}>
                    <Row gutter={16} align="middle">
                        {/* 左侧：数据源选择 */}
                        <Col span={6}>
                            <Form.Item
                                label="数据源"
                                required
                                rules={[{ required: true, message: '请选择数据源' }]}
                                style={{ marginBottom: 0 }}
                            >
                                <Select
                                    placeholder="选择数据源"
                                    value={query.datasourceId?.[0] || undefined}
                                    onChange={(value) => handleDatasourceChange(index, value)}
                                    options={datasourceOptions}
                                    loading={datasourceLoading}
                                    allowClear
                                    showSearch
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                        
                        {/* 中间：PromQL 输入框 */}
                        <Col span={16}>
                            <Form.Item
                                label="PromQL"
                                required
                                rules={[{ required: true, message: '请输入 PromQL 查询语句' }]}
                                style={{ marginBottom: 0, width: '100%' }}
                            >
                                <PrometheusPromQL
                                    addr={metricAddress}
                                    value={query.promQL}
                                    setPromQL={(value) => handlePromQLChange(index, value)}
                                    debounceDuration={300}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        
                        {/* 右侧：执行查询按钮 */}
                        <Col span={2}>
                            <Button
                                type="primary"
                                icon={<SearchOutlined />}
                                onClick={handleSearch}
                                loading={loading}
                                block
                                style={{backgroundColor: '#000'}}
                            >
                                查询
                            </Button>
                        </Col>
                    </Row>
                    
                    <Tabs
                        activeKey={activeTab}
                        onChange={handleTabChange}
                        items={[
                            {
                                key: 'card',
                                label: (
                                    <span>
                                        <AppstoreOutlined style={{ marginRight: '8px' }} />
                                        Card
                                    </span>
                                ),
                                children: <MetricTable metrics={cardData} loading={loading} />,
                            },
                            {
                                key: 'chart',
                                label: (
                                    <span>
                                        <LineChartOutlined style={{ marginRight: '8px' }} />
                                        Graph
                                    </span>
                                ),
                                children: (
                                    <div>
                                        {/* 时间范围和步长设置 - 在视图下方，数据上方 */}
                                        <Row gutter={16} align="middle" style={{ marginBottom: '16px' }}>
                                            <Col flex="auto">
                                                <Space>
                                                    <Form.Item label="时间范围" style={{ marginBottom: 0 }}>
                                                        <RangePicker
                                                            value={timeRange}
                                                            onChange={setTimeRange}
                                                            showTime={{
                                                                format: 'HH:mm:ss',
                                                            }}
                                                            format="YYYY-MM-DD HH:mm:ss"
                                                        />
                                                    </Form.Item>
                                                    <Form.Item label="步长 (秒)" style={{ marginBottom: 0 }}>
                                                        <InputNumber
                                                            min={1}
                                                            max={3600}
                                                            value={step}
                                                            onChange={setStep}
                                                            style={{ width: 100 }}
                                                        />
                                                    </Form.Item>
                                                </Space>
                                            </Col>
                                        </Row>
                                        <Divider />
                                        {/* 图表和数据表格 */}
                                        <ChartView chartData={chartData} metrics={cardData} loading={loading} />
                                    </div>
                                ),
                            },
                        ]}
                        destroyInactiveTabPane={true}
                    />
                    
                    {/* 移除按钮（除了第一个查询） */}
                    {index > 0 && (
                        <div style={{ textAlign: 'right', marginTop: '8px' }}>
                            <Button
                                type="text"
                                danger
                                icon={<MinusCircleOutlined />}
                                onClick={() => handleRemoveQuery(index)}
                            />
                        </div>
                    )}
                </div>
            ))}
            
            {/* 底部：添加查询按钮 */}
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={handleAddQuery}
                    size="small"
                    block
                >
                    添加查询
                </Button>
            </div>
        </div>
    )

    // 渲染内容区域
    const renderContent = () => {
        return (
            <div>
                {renderQueryArea()}
            </div>
        )
    }

    return (
        <>
            <Breadcrumb items={['数据分析', '指标查询']} />
            <div>
                {error && (
                    <Alert
                        message="查询失败"
                        description={error}
                        type="error"
                        showIcon
                        style={{ marginBottom: '24px' }}
                        closable
                        onClose={() => setError(null)}
                    />
                )}

                {renderContent()}
            </div>
        </>

    )
}
