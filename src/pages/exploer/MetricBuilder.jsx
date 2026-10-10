import React, { useState, useEffect, useMemo, useCallback } from "react"
import {
    Button,
    Select,
    Space,
    Tag,
    Typography,
    Segmented,
    Divider,
    Empty,
    Tooltip,
} from "antd"
import {
    ThunderboltOutlined,
    FilterOutlined,
    FunctionOutlined,
    SearchOutlined,
} from "@ant-design/icons"
import { getMetricNames, getLabels, getLabelValues } from "../../api/datasource"

const { Text } = Typography

// 聚合函数可选列表(空串 = 不聚合)
const AGG_OPTIONS = [
    { label: '不聚合', value: '' },
    { label: 'max', value: 'max' },
    { label: 'avg', value: 'avg' },
    { label: 'sum', value: 'sum' },
    { label: 'min', value: 'min' },
    { label: 'count', value: 'count' },
]

/**
 * 指标浏览器 —— 面向不会写 PromQL 的开发者:
 * 搜指标名 → 点选 label 过滤 → 选聚合/rate → 一键生成 PromQL。
 */
export const MetricBuilder = ({ datasourceId, onApply }) => {
    const [metricNames, setMetricNames] = useState([])
    const [metricName, setMetricName] = useState(undefined)
    const [labels, setLabels] = useState([])
    const [filters, setFilters] = useState([])      // [{name, value}]
    const [aggFunc, setAggFunc] = useState('')
    const [byLabels, setByLabels] = useState([])
    const [useRate, setUseRate] = useState(false)

    const [pickedLabel, setPickedLabel] = useState(undefined)
    const [labelValues, setLabelValues] = useState([])
    const [pickedValue, setPickedValue] = useState(undefined)

    const [loadingNames, setLoadingNames] = useState(false)
    const [loadingLabels, setLoadingLabels] = useState(false)
    const [loadingValues, setLoadingValues] = useState(false)

    // 数据源变化 → 重拉指标名
    useEffect(() => {
        setMetricName(undefined); setFilters([]); setLabels([]); setPickedLabel(undefined); setPickedValue(undefined)
        if (!datasourceId) { setMetricNames([]); return }
        setLoadingNames(true)
        getMetricNames({ datasourceId }).then(res => {
            if (res?.code === 200 && Array.isArray(res.data)) setMetricNames(res.data)
        }).finally(() => setLoadingNames(false))
    }, [datasourceId])

    // 指标名变化 → 拉 labels
    useEffect(() => {
        setLabels([]); setFilters([]); setPickedLabel(undefined); setPickedValue(undefined); setLabelValues([])
        if (!datasourceId || !metricName) return
        setLoadingLabels(true)
        getLabels({ datasourceId, match: metricName }).then(res => {
            if (res?.code === 200 && Array.isArray(res.data)) {
                setLabels(res.data.filter(l => l !== '__name__'))
            }
        }).finally(() => setLoadingLabels(false))
    }, [datasourceId, metricName])

    // 选中的 label → 拉其取值
    useEffect(() => {
        setPickedValue(undefined); setLabelValues([])
        if (!datasourceId || !metricName || !pickedLabel) return
        setLoadingValues(true)
        getLabelValues({ datasourceId, name: pickedLabel, match: metricName }).then(res => {
            if (res?.code === 200 && Array.isArray(res.data)) setLabelValues(res.data)
        }).finally(() => setLoadingValues(false))
    }, [datasourceId, metricName, pickedLabel])

    const addFilter = () => {
        if (!pickedLabel || pickedValue === undefined || pickedValue === null) return
        if (filters.some(f => f.name === pickedLabel)) return
        setFilters([...filters, { name: pickedLabel, value: pickedValue }])
        setPickedLabel(undefined); setPickedValue(undefined)
    }

    const removeFilter = (name) => setFilters(filters.filter(f => f.name !== name))

    const buildPromQL = useMemo(() => {
        if (!metricName) return '/* 选择一个指标后自动生成 PromQL */'
        let expr = metricName
        if (filters.length > 0) {
            const fs = filters.map(f => `${f.name}="${f.value}"`).join(', ')
            expr = `${metricName}{${fs}}`
        }
        if (useRate) expr = `rate(${expr}[5m])`
        if (aggFunc) {
            const by = byLabels.length > 0 ? ` by (${byLabels.join(', ')})` : ''
            expr = `${aggFunc}${by}(${expr})`
        }
        return expr
    }, [metricName, filters, aggFunc, byLabels, useRate])

    const handleApply = () => {
        if (!metricName) return
        onApply(buildPromQL)
    }

    const metricOptions = useMemo(() => metricNames.map(m => ({ label: m, value: m })), [metricNames])

    return (
        <div style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: '12px 16px', marginBottom: 16, background: '#fafafa' }}>
            <Space align="center" style={{ marginBottom: 8 }}>
                <ThunderboltOutlined style={{ color: '#1677ff' }} />
                <Text strong>指标浏览器</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    不会写 PromQL？选指标 + 加过滤 + 选聚合，一键生成
                </Text>
            </Space>

            {!datasourceId ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="请先在上方选择一个 Prometheus 数据源" />
            ) : (
                <>
                    <Space wrap style={{ width: '100%' }} size="middle">
                        <Space direction="vertical" style={{ width: 360 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>1. 指标名（可搜索）</Text>
                            <Select
                                showSearch
                                value={metricName}
                                placeholder="搜索指标名，如 disk / cpu / mem"
                                style={{ width: 360 }}
                                loading={loadingNames}
                                options={metricOptions}
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                }
                                onChange={setMetricName}
                            />
                        </Space>

                        <Space direction="vertical">
                            <Text type="secondary" style={{ fontSize: 12 }}>2. 聚合函数</Text>
                            <Segmented
                                value={aggFunc}
                                options={AGG_OPTIONS}
                                onChange={(v) => setAggFunc(v)}
                            />
                        </Space>

                        <Space direction="vertical">
                            <Text type="secondary" style={{ fontSize: 12 }}>3. 选项</Text>
                            <Space>
                                <Tag.CheckableTag checked={useRate} onChange={setUseRate}>
                                    rate（计数器）
                                </Tag.CheckableTag>
                                {aggFunc && (
                                    <Select
                                        mode="multiple"
                                        allowClear
                                        placeholder="by (label)"
                                        style={{ minWidth: 200 }}
                                        maxTagCount={2}
                                        options={labels.map(l => ({ label: l, value: l }))}
                                        value={byLabels}
                                        onChange={setByLabels}
                                        notFoundContent={loadingLabels ? '加载中...' : '无 label'}
                                    />
                                )}
                            </Space>
                        </Space>
                    </Space>

                    {metricName && labels.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                <FilterOutlined /> 过滤（可选，如指定主机/磁盘）
                            </Text>
                            <Space wrap style={{ marginTop: 6 }}>
                                <Select
                                    showSearch
                                    allowClear
                                    value={pickedLabel}
                                    placeholder="label（如 instanceName）"
                                    style={{ width: 200 }}
                                    options={labels.map(l => ({ label: l, value: l }))}
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    onChange={setPickedLabel}
                                />
                                <Select
                                    showSearch
                                    allowClear
                                    value={pickedValue}
                                    placeholder="值"
                                    style={{ width: 260 }}
                                    loading={loadingValues}
                                    options={labelValues.map(v => ({ label: String(v), value: String(v) }))}
                                    optionFilterProp="label"
                                    filterOption={(input, option) =>
                                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                                    }
                                    onChange={setPickedValue}
                                    disabled={!pickedLabel}
                                />
                                <Button size="small" icon={<FilterOutlined />} onClick={addFilter} disabled={!pickedLabel || pickedValue === undefined}>
                                    添加过滤
                                </Button>
                                {filters.map(f => (
                                    <Tag key={f.name} closable onClose={() => removeFilter(f.name)} color="blue">
                                        {f.name}=&quot;{f.value}&quot;
                                    </Tag>
                                ))}
                            </Space>
                        </div>
                    )}

                    <Divider style={{ margin: '12px 0' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ flex: 1, fontFamily: 'monospace', fontSize: 13, background: '#fff', border: '1px dashed #d9d9d9', borderRadius: 6, padding: '6px 10px', minHeight: 34 }}>
                            {buildPromQL}
                        </div>
                        <Button type="primary" icon={<ThunderboltOutlined />} onClick={handleApply} disabled={!metricName}>
                            应用到查询语句
                        </Button>
                    </div>
                </>
            )}
        </div>
    )
}