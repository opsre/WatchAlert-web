"use client"

import * as React from "react"
import {
    Line,
    LineChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts"

import {
    Typography,
} from "antd"

const { Text } = Typography

// 为每个 metric 分配不同的颜色
const METRIC_COLORS = [
    '#1890ff', // 蓝色
    '#52c41a', // 绿色
    '#faad14', // 橙色
    '#f5222d', // 红色
    '#722ed1', // 紫色
    '#13c2c2', // 青色
    '#eb2f96', // 粉色
    '#fa8c16', // 深橙色
]

export const EventMetricChart = ({ data }) => {
    console.log(data)
    
    if (!data) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                <Text type="secondary">暂无图表数据</Text>
            </div>
        )
    }

    const result = data[0].data.result

    // 提取所有时间戳并去重排序
    const allTimestamps = new Set()
    result.forEach(item => {
        if (item.values && item.values.length > 0) {
            item.values.forEach(([timestamp]) => {
                allTimestamps.add(timestamp)
            })
        }
    })
    const timestamps = Array.from(allTimestamps).sort((a, b) => a - b)

    // 构建图表数据
    const chartData = timestamps.map(timestamp => {
        const dataPoint = { timestamp }
        
        result.forEach((item, index) => {
            // 构建包含所有 label 的名称
            const labels = Object.entries(item.metric)
                .filter(([key]) => key !== '__name__' )
                .map(([key, value]) => `${key}=${value}`)
                .join(', ')
            
            const seriesName = `{${labels}}`
            const valueEntry = item.values?.find(([ts]) => ts === timestamp)
            dataPoint[seriesName] = valueEntry ? parseFloat(valueEntry[1]) : null
        })

        return dataPoint
    })

    // 获取所有系列名称
    const seriesNames = result.map((item, index) => {
        const labels = Object.entries(item.metric)
            .filter(([key]) => key !== '__name__')
            .map(([key, value]) => `${key}=${value}`)
            .join(', ')
        
        return `{${labels}}`
    })

    return (
        <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    {seriesNames.map((name, index) => (
                        <linearGradient 
                            key={`gradient-${index}`} 
                            id={`color-${index}`} 
                            x1="0" 
                            y1="0" 
                            x2="0" 
                            y2="1"
                        >
                            <stop 
                                offset="5%" 
                                stopColor={METRIC_COLORS[index % METRIC_COLORS.length]} 
                                stopOpacity={0.3} 
                            />
                            <stop 
                                offset="95%" 
                                stopColor={METRIC_COLORS[index % METRIC_COLORS.length]} 
                                stopOpacity={0} 
                            />
                        </linearGradient>
                    ))}
                </defs>

                <CartesianGrid
                    vertical={false}
                    strokeDasharray="3 3"
                    stroke="#e8e8e8"
                />

                <XAxis
                    dataKey="timestamp"
                    tickFormatter={(value) => {
                        const date = new Date(value * 1000)
                        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                    }}
                    axisLine={{ stroke: '#d9d9d9' }}
                    tickLine={false}
                    tickMargin={8}
                    tick={{ fill: "#666", fontSize: 12 }}
                />

                <YAxis
                    axisLine={{ stroke: '#d9d9d9' }}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 12 }}
                    tickFormatter={(value) => {
                        // 优化大数值显示，避免显示过多的0
                        if (Math.abs(value) >= 1000000) {
                            return `${(value / 1000000).toFixed(1)}M`;
                        } else if (Math.abs(value) >= 1000) {
                            return `${(value / 1000).toFixed(1)}K`;
                        } else {
                            return value;
                        }
                    }}
                />

                <Tooltip
                    contentStyle={{
                        backgroundColor: "#000000",
                        borderRadius: 8,
                        border: "none",
                        padding: "12px",
                        maxWidth: '600px',
                        whiteSpace: 'normal',
                        wordBreak: 'break-word',
                    }}
                    itemStyle={{
                        color: "#ffffff",
                        fontSize: "12px",
                        padding: "4px 0",
                        whiteSpace: 'normal',
                        wordBreak: 'break-all',
                        lineHeight: '1.5',
                    }}
                    labelStyle={{
                        color: "#ffffff",
                        fontWeight: "500",
                        marginBottom: "8px",
                        whiteSpace: 'normal',
                    }}
                    labelFormatter={(label) => {
                        const date = new Date(label * 1000)
                        return `时间: ${date.toLocaleString('zh-CN', { 
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                        })}`
                    }}
                    formatter={(value, name) => {
                        if (value === null || value === undefined) return ['无数据', name]
                        return [value, name]
                    }}
                />

                {/* 隐藏图例 */}
                {/* <Legend 
                    wrapperStyle={{
                        paddingTop: '20px',
                        maxHeight: '150px',
                        overflowY: 'auto',
                    }}
                    iconType="line"
                /> */}

                {seriesNames.map((name, index) => (
                    <Line
                        key={name}
                        type="monotone"
                        dataKey={name}
                        stroke={METRIC_COLORS[index % METRIC_COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 5 }}
                        connectNulls={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    )
}
