"use client"

import * as React from "react"
import {
    Area,
    AreaChart,
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

// 告警等级颜色配置
const SEVERITY_COLORS = {
    P0: '#ff4d4f',
    P1: '#faad14',
    P2: '#b0e1fb'
}

export const NoticeMetricChart = ({ data }) => {
    if (!data || !data.date || !data.series) {
        return (
            <div style={{ textAlign: "center", padding: "40px" }}>
                <Text type="secondary">暂无图表数据</Text>
            </div>
        )
    }

    // 将接口返回的数据转换成 recharts 支持的格式
    const chartData = data.date.map((date, index) => ({
        name: date,
        P0: data.series.p0?.[index] ?? 0,
        P1: data.series.p1?.[index] ?? 0,
        P2: data.series.p2?.[index] ?? 0,
    }))

    return (
        <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorP0" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SEVERITY_COLORS.P0} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={SEVERITY_COLORS.P0} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorP1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SEVERITY_COLORS.P1} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={SEVERITY_COLORS.P1} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorP2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={SEVERITY_COLORS.P2} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={SEVERITY_COLORS.P2} stopOpacity={0} />
                    </linearGradient>
                </defs>

                <CartesianGrid
                    vertical={false}   // 隐藏垂直分割线
                    horizontal={false} // 隐藏水平分割线
                />
                <XAxis
                    dataKey="name"
                    tickFormatter={(value) => {
                        const date = new Date(value)
                        return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
                    }}
                    axisLine={true}
                    tickLine={false}
                    tickMargin={8}
                />
                <YAxis
                    axisLine={true}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 12 }}
                />

                <Tooltip
                    contentStyle={{
                        backgroundColor: "#000000",
                        borderRadius: 8,
                        borderColor: "#333",
                    }}
                    itemStyle={{
                        color: "#ffffff",
                        fontSize: "14px",
                    }}
                    labelFormatter={(label) => {
                        const date = new Date(label)
                        return <span style={{color: "#fff"}}>日期: {date.getFullYear()}-{date.getMonth() + 1}-{date.getDate()}</span>
                    }}
                    formatter={(value, name) => [value, name]}
                />

                <Legend />

                <Area
                    type="monotone"
                    dataKey="P0"
                    stroke={SEVERITY_COLORS.P0}
                    fill="url(#colorP0)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Area
                    type="monotone"
                    dataKey="P1"
                    stroke={SEVERITY_COLORS.P1}
                    fill="url(#colorP1)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
                <Area
                    type="monotone"
                    dataKey="P2"
                    stroke={SEVERITY_COLORS.P2}
                    fill="url(#colorP2)"
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                />
            </AreaChart>
        </ResponsiveContainer>
    )
}