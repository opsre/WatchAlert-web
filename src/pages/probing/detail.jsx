"use client";

import React, { useState, useEffect } from "react";
import ReactECharts from "echarts-for-react";
import { Spin, Empty, Modal, Select } from "antd";
import { ProbingGetHistory } from "../../api/probing";

const { Option } = Select;

// 支持的图表类型
const CHART_TYPES = {
    line: "line",
    bar: "bar",
};

// 支持的时间范围选项（秒）
const TIME_RANGES = [
    { label: "最近1小时", value: 3600 },
    { label: "最近6小时", value: 6 * 3600 },
    { label: "最近24小时", value: 24 * 3600 },
];

// 支持的字段类型定义
const FIELD_CONFIG = {
    Latency: {
        title: "延迟 (ms)",
        yAxisName: "延迟 (ms)",
        chartType: CHART_TYPES.line,
        dataKey: "Latency",
        formatTooltip: (val) => `${val} ms`,
        color: "#4096ff"
    },
    StatusCode: {
        title: "HTTP 状态码",
        yAxisName: "状态码",
        chartType: CHART_TYPES.bar,
        dataKey: "StatusCode",
        formatTooltip: (val) => `状态码: ${val}`,
        color: "#a6f6a2"
    },
    Telnet: {
        title: "TCP 连通性",
        yAxisName: "是否成功 (1=成功, 0=失败)",
        chartType: CHART_TYPES.bar,
        dataKey: "IsSuccessful",
        formatTooltip: (val) => val === true ? "成功" : "失败",
        color: "#a6f6a2"
    },
    PacketLoss: {
        title: "ICMP 丢包率",
        yAxisName: "丢包率",
        chartType: CHART_TYPES.line,
        dataKey: "PacketLoss",
        formatTooltip: (val) => `${val} %`,
        color: "#4096ff"
    },
    MinRtt: {
        title: "ICMP 最小耗时",
        yAxisName: "最小耗时",
        chartType: CHART_TYPES.line,
        dataKey: "MinRtt",
        formatTooltip: (val) => `${val} ms`,
        color: "#4096ff"
    },
    MaxRtt: {
        title: "ICMP 最大耗时",
        yAxisName: "最大耗时",
        chartType: CHART_TYPES.line,
        dataKey: "MaxRtt",
        formatTooltip: (val) => `${val} ms`,
        color: "#4096ff"
    },
    AvgRtt: {
        title: "ICMP 平均耗时",
        yAxisName: "平均耗时",
        chartType: CHART_TYPES.line,
        dataKey: "AvgRtt",
        formatTooltip: (val) => `${val} ms`,
        color: "#4096ff"
    },
};

export const DetailProbingHistory = ({ visible, onClose, row }) => {
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState({ timestamps: [], values: [] });
    const [selectedRange, setSelectedRange] = useState(3600); // 默认时间范围

    const field = row?.probingEndpointConfig?.strategy?.field || "Latency";
    const config = FIELD_CONFIG[field] || FIELD_CONFIG.Latency;

    // 获取拨测历史数据
    const fetchProbingHistory = async () => {
        try {
            setLoading(true);

            const params = {
                ruleId: row?.ruleId,
                dateRange: selectedRange,
            };

            const response = await ProbingGetHistory(params);

            if (response.code === 200 && Array.isArray(response.data)) {
                const sortedData = response.data.sort((a, b) => a.timestamp - b.timestamp);

                const timestamps = sortedData.map(item =>
                    new Date(item.timestamp * 1000).toLocaleTimeString()
                );

                const values = sortedData.map(item => item.value[config.dataKey]);

                setChartData({ timestamps, values });
            } else {
                setChartData({ timestamps: [], values: [] });
            }
        } catch (error) {
            console.error("获取拨测历史失败", error);
        } finally {
            setLoading(false);
        }
    };

    // 每次打开 Modal 或切换时间范围时刷新数据
    useEffect(() => {
        if (visible) {
            fetchProbingHistory();
        }
    }, [visible, selectedRange, field]);

    // 构造 ECharts 配置项
    const getOption = () => {
        return {
            tooltip: {
                trigger: "axis",
                formatter: (params) => {
                    return `${params[0].axisValue}<br/>${config.title}: ${config.formatTooltip(params[0].value)}`;
                },
            },
            xAxis: {
                type: "category",
                data: chartData.timestamps,
                name: "时间",
                axisLabel: {
                    rotate: 45
                }
            },
            yAxis: {
                type: "value",
                name: config.yAxisName,
            },
            series: [
                {
                    name: config.title,
                    type: config.chartType,
                    data: chartData.values,
                    smooth: config.chartType === CHART_TYPES.line,
                    itemStyle: { color: config.color },
                    lineStyle: { color: config.color },
                    showSymbol: config.chartType === CHART_TYPES.line,
                },
            ],
            grid: {
                left: "10%",
                right: "10%",
                bottom: "15%",
                top: "20%",
            }
        };
    };

    return (
        <Modal
            visible={visible}
            onCancel={onClose}
            footer={null}
            title="拨测历史记录"
            width={1000}
        >
            <div style={{ marginBottom: 16 }}>
                <Select
                    value={selectedRange}
                    onChange={(value) => setSelectedRange(value)}
                    style={{ width: 150 }}
                >
                    {TIME_RANGES.map(range => (
                        <Option key={range.value} value={range.value}>
                            {range.label}
                        </Option>
                    ))}
                </Select>
            </div>

            <Spin spinning={loading}>
                {chartData.timestamps.length > 0 ? (
                    <ReactECharts option={getOption()} style={{ height: 400 }} />
                ) : (
                    <div style={{ textAlign: "center", padding: "80px 0" }}>
                        <Empty description="暂无拨测历史数据" />
                    </div>
                )}
            </Spin>
        </Modal>
    );
};