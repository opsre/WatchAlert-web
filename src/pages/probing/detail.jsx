import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Select, message } from 'antd';
import { ProbingList } from '../../api/probing';
import { queryRangePromMetrics } from '../../api/other';
import { EventMetricChart } from '../chart/eventMetricChart';

const { Option } = Select;


// 时间范围选项
const TIME_RANGES = [
    { label: '最近1小时', value: '1h', seconds: 3600 },
    { label: '最近6小时', value: '6h', seconds: 6 * 3600 },
];

// 不同拨测类型的指标配置
const METRICS_CONFIG = {
    HTTP: [
        {
            title: 'HTTP状态码',
            query: 'probe_http_status_code',
            description: 'HTTP响应状态码'
        },
        {
            title: '响应时间',
            query: 'probe_http_response_time_ms',
            description: 'HTTP请求响应时间（毫秒）'
        },
        {
            title: 'HTTP请求状态',
            query: 'probe_http_success',
            description: 'HTTP请求状态（1=成功，0=失败）'
        }
    ],
    ICMP: [
        {
            title: '丢包率',
            query: 'probe_icmp_packet_loss_percent',
            description: 'ICMP包丢失百分比'
        },
        {
            title: '最小RTT',
            query: 'probe_icmp_rtt_min_ms',
            description: 'ICMP最小往返时间（毫秒）'
        },
        {
            title: '最大RTT',
            query: 'probe_icmp_rtt_max_ms',
            description: 'ICMP最大往返时间（毫秒）'
        },
        {
            title: '平均RTT',
            query: 'probe_icmp_rtt_avg_ms',
            description: 'ICMP平均往返时间（毫秒）'
        },
        {
            title: '发送包数',
            query: 'probe_icmp_packets_sent_total',
            description: 'ICMP发送包总数'
        },
        {
            title: '接收包数',
            query: 'probe_icmp_packets_received_total',
            description: 'ICMP接收包总数'
        }
    ],
    TCP: [
        {
            title: 'TCP连通性',
            query: 'probe_tcp_success',
            description: 'TCP连接成功率（1=成功，0=失败）'
        },
        {
            title: '连接时间',
            query: 'probe_tcp_response_time_ms',
            description: 'TCP连接响应时间（毫秒）'
        }
    ],
    SSL: [
        {
            title: 'SSL证书有效期',
            query: 'probe_ssl_certificate_expiry_days',
            description: 'SSL证书剩余有效天数'
        },
        {
            title: 'SSL响应时间',
            query: 'probe_ssl_response_time_ms',
            description: 'SSL响应时间（毫秒）'
        },
        {
            title: 'SSL证书状态',
            query: 'probe_ssl_certificate_valid',
            description: 'SSL证书有效性（1=有效，0=无效）'
        }
    ]
};

export const ProbingMetrics = () => {
    const { id } = useParams();
    const [loading, setLoading] = useState(true);
    const [taskInfo, setTaskInfo] = useState(null);
    const [metricsData, setMetricsData] = useState({});
    const [timeRange, setTimeRange] = useState('1h');

    // 获取任务信息
    const fetchTaskInfo = useCallback(async () => {
        try {
            const res = await ProbingList({});
            
            if (res.data && res.data.length > 0) {
                const task = res.data.find(item => item.ruleId === id);
                
                if (task) {
                    setTaskInfo(task);
                } else {
                    message.error('未找到对应的拨测任务');
                }
            }
        } catch (error) {
            message.error('获取任务信息失败');
            console.error(error);
        }
    }, [id]);

    // 获取指标数据
    const fetchMetricData = useCallback(async (metric) => {
        if (!taskInfo) return null;

        try {
            const timeRangeConfig = TIME_RANGES.find(range => range.value === timeRange);
            const now = Math.floor(Date.now() / 1000);
            const startTime = now - timeRangeConfig.seconds;
            
            // 构建查询参数
            const query = `${metric.query}{rule_id="${taskInfo.ruleId}"}`;
            
            const params = {
                datasourceIds: taskInfo.datasourceId,
                query: query,
                startTime: startTime,
                endTime: now,
                step: Math.max(Math.floor(timeRangeConfig.seconds / 100), 10) // 动态计算步长
            };

            console.log(`查询参数 ${metric.title}:`, params);

            const result = await queryRangePromMetrics(params);
            console.log(`获取指标 ${metric.title} 数据:`, result);
            
            // 处理API响应数据结构
            if (result && result.data) {
                if (Array.isArray(result.data) && result.data.length > 0) {
                    // API返回格式: { data: [{ status: "success", data: { result: [...] } }] }
                    const responseData = result.data[0];
                    if (responseData && responseData.status === 'success' && responseData.data) {
                        return responseData.data;
                    }
                } else if (result.data.result) {
                    // 直接返回格式: { data: { result: [...] } }
                    return result.data;
                }
            }
            return null;
        } catch (error) {
            console.error(`获取指标 ${metric.title} 失败:`, error);
            return null;
        }
    }, [taskInfo, timeRange]);

    // 获取所有指标数据
    const fetchMetricsData = useCallback(async () => {
        if (!taskInfo) return;

        const metrics = METRICS_CONFIG[taskInfo.ruleType] || [];
        
        if (metrics.length === 0) {
            console.warn('No metrics found for rule type:', taskInfo.ruleType);
            return;
        }
        
        const metricsResults = {};

        try {
            setLoading(true);
            
            // 并行获取所有指标数据
            const promises = metrics.map(async (metric) => {
                const data = await fetchMetricData(metric);
                return { metric, data };
            });

            const results = await Promise.all(promises);
            
            results.forEach(({ metric, data }) => {
                console.log(`处理指标 ${metric.title}:`, data);
                console.log(`指标 ${metric.title} 数据结构检查:`, {
                    hasData: !!data,
                    hasResult: !!(data && data.result),
                    resultLength: data && data.result ? data.result.length : 0,
                    resultType: data && data.resultType
                });
                metricsResults[metric.title] = {
                    ...metric,
                    data: data
                };
            });

            setMetricsData(metricsResults);
        } catch (error) {
            message.error('获取指标数据失败');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [taskInfo, fetchMetricData]);

    useEffect(() => {
        fetchTaskInfo();
    }, [fetchTaskInfo]);

    useEffect(() => {
        if (taskInfo) {
            fetchMetricsData();
        }
    }, [fetchMetricsData, taskInfo, timeRange]);



    if (!taskInfo) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <Spin size="large" />
                <p style={{ marginTop: '16px', color: '#666' }}>
                    正在加载任务信息...
                </p>
            </div>
        );
    }

    // 检查是否有有效的拨测类型
    const availableMetrics = METRICS_CONFIG[taskInfo.ruleType];
    if (!availableMetrics) {
        return (
            <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>{taskInfo.ruleName}</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                            {taskInfo.probingEndpointConfig?.endpoint && taskInfo.probingEndpointConfig.endpoint.length > 150 
                                ? `${taskInfo.probingEndpointConfig.endpoint.substring(0, 150)}...`
                                : taskInfo.probingEndpointConfig?.endpoint}
                        </p>
                    </div>
                </div>
                
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999',
                    backgroundColor: '#fafafa',
                    borderRadius: '8px'
                }}>
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                        不支持的拨测类型: {taskInfo.ruleType}
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        支持的类型: {Object.keys(METRICS_CONFIG).join(', ')}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* 头部 */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div>
                        <h2 style={{ margin: 0 }}>{taskInfo.ruleName}</h2>
                        <p style={{ margin: '4px 0 0 0', color: '#666' }}>
                            {taskInfo.probingEndpointConfig?.endpoint && taskInfo.probingEndpointConfig.endpoint.length > 150 
                                ? `${taskInfo.probingEndpointConfig.endpoint.substring(0, 150)}...`
                                : taskInfo.probingEndpointConfig?.endpoint}
                        </p>
                    </div>
                </div>
                
                <Select
                    value={timeRange}
                    onChange={setTimeRange}
                    style={{ width: 150 }}
                >
                    {TIME_RANGES.map(range => (
                        <Option key={range.value} value={range.value}>
                            {range.label}
                        </Option>
                    ))}
                </Select>
            </div>

            {/* 指标图表 */}
            <Spin spinning={loading}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
                    gap: '20px'
                }}>
                    {Object.entries(metricsData).map(([title, metric]) => (
                        <div
                            key={title}
                            style={{
                                background: '#fff',
                                borderRadius: '8px',
                                padding: '20px',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                border: '1px solid #f0f0f0'
                            }}
                        >
                            <div style={{
                                marginBottom: '16px'
                            }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: '16px',
                                    color: '#262626',
                                    marginBottom: '4px'
                                }}>
                                    {title}
                                </h3>
                                <p style={{
                                    margin: 0,
                                    fontSize: '12px',
                                    color: '#8c8c8c'
                                }}>
                                    {metric.description}
                                </p>
                            </div>
                            
                            <div style={{ height: '200px' }}>
                                {metric.data && metric.data.result && metric.data.result.length > 0 ? (
                                    <EventMetricChart data={[{ data: metric.data }]} />
                                ) : (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        height: '100%',
                                        color: '#8c8c8c'
                                    }}>
                                        暂无数据
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </Spin>
            
            {Object.keys(metricsData).length === 0 && !loading && (
                <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: '#999',
                    backgroundColor: '#fafafa',
                    borderRadius: '8px'
                }}>
                    <p style={{ fontSize: '16px', marginBottom: '8px' }}>
                        暂无指标数据
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                        拨测类型: {taskInfo?.ruleType || '未知'}
                    </p>
                    <p style={{ fontSize: '14px', marginBottom: '4px' }}>
                        支持的类型: {Object.keys(METRICS_CONFIG).join(', ')}
                    </p>
                    <p style={{ fontSize: '14px' }}>
                        请确认数据源配置正确且任务正在运行
                    </p>
                </div>
            )}
        </div>
    );
};