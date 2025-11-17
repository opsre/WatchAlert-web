"use client"

import { useState, useEffect } from "react"
import { Input, Descriptions, Tabs, Button, Row, Col, Typography } from "antd"
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons"
import "./index.css"
import { FaultCenterReset, FaultCenterSearch, FaultCenterSlo } from "../../api/faultCenter"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { AlertCurrentEvent } from "../event/currentEvent"
import { AlertHistoryEvent } from "../event/historyEvent"
import { Silences } from "../silence"
import { FaultCenterNotify } from "./notify"
import { AlarmUpgrade } from "./upgrade"
import moment from "moment"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts"

export const FaultCenterDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [detail, setDetail] = useState({})
  const [editingField, setEditingField] = useState(null)
  const [tempValue, setTempValue] = useState("")

  // 解析 URL 中的 tab 参数，默认为 '1'
  const getInitialTabKey = () => {
    const searchParams = new URLSearchParams(location.search)
    return searchParams.get("tab") || "1"
  }

  const [activeTabKey, setActiveTabKey] = useState(getInitialTabKey)
  const [sloChartData, setSloChartData] = useState([]) // [{date, mttr, mtta, mtbf}, ...]

  // 计算数组中某个 key 的平均值（基于 sloChartData 列表）
  const computeAverageFromList = (key) => {
    if (!Array.isArray(sloChartData) || sloChartData.length === 0) return null
    const vals = sloChartData
      .map((d) => {
        const v = Number(d[key])
        return isNaN(v) ? null : Math.round(v)
      })
      .filter((v) => v !== null)
    if (vals.length === 0) return null
    const sum = vals.reduce((a, b) => a + b, 0)
    return Math.round(sum / vals.length)
  }

  useEffect(() => {
    handleList()
    handleGetSlo()
  }, [])

  // 当 URL 的查询参数变化时更新 activeTabKey
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tabFromUrl = searchParams.get("tab")
    if (tabFromUrl) {
      setActiveTabKey(tabFromUrl)
    }
  }, [location.search])

  const handleList = async () => {
    try {
      const params = { id }
      const res = await FaultCenterSearch(params)
      setDetail(res.data)
    } catch (error) {
      console.error(error)
    }
  }

const handleGetSlo = async () => {
    try {
      const params = {
        tenantId: localStorage.getItem("TenantID"),
        id: id,
      }
      const res = await FaultCenterSlo(params)

      if (res.code === 200 && res.data) {
        const mttaArr = Array.isArray(res.data.mtta) ? res.data.mtta : []
        const mttrArr = Array.isArray(res.data.mttr) ? res.data.mttr : []
        const mtbfArr = Array.isArray(res.data.mtbf) ? res.data.mtbf : []

        // 构造近7天日期（从 6 天前 到 今天），并对应数组索引 0..6
        const days = []
        for (let i = 0; i < 7; i++) {
          days.push(
            moment()
              .subtract(6 - i, "days")
              .format("MM-DD"),
          )
        }

        const data = days.map((d, idx) => ({
          date: d,
          // 保证图表数据为整数秒
          mtta: Math.round(Number(mttaArr[idx] ?? 0)),
          mttr: Math.round(Number(mttrArr[idx] ?? 0)),
          mtbf: Math.round(Number(mtbfArr[idx] ?? 0)),
        }))

        // 直接设置 sloChartData（平均值由 computeAverageFromList 在渲染时计算）
        setSloChartData(data)
      }
    } catch (error) {
      console.error("获取 SLO 数据失败:", error)
    }
  }

  const handleEdit = (field) => {
    setEditingField(field)
    setTempValue(detail[field] || "")
  }

  const handleSave = async (field) => {
    try {
      setDetail({ ...detail, [field]: tempValue })
      setEditingField(null)

      const params = {
        id: id,
        [field]: tempValue,
      }
      await FaultCenterReset(params)
    } catch (error) {
      console.error("保存失败:", error)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
  }

  const tagItems = [
    {
      key: "1",
      label: "活跃告警",
      children: <AlertCurrentEvent id={id} />,
    },
    {
      key: "2",
      label: "历史告警",
      children: <AlertHistoryEvent id={id} />,
    },
    {
      key: "3",
      label: "降噪配置",
      children: <Silences faultCenterId={id} aggregationType={detail.aggregationType} />,
    },
    {
      key: "4",
      label: "通知配置",
      children: <FaultCenterNotify id={id} />,
    },
    {
      key: "5",
      label: "告警升级",
      children: <AlarmUpgrade />,
    },
  ]

  const describeItems = [
    {
      key: "1",
      label: "ID",
      children: detail.id,
    },
    {
      key: "2",
      label: "名称",
      children: (
        <div style={{ display: "flex", alignItems: "center", marginTop: "-5px" }}>
          {editingField === "name" ? (
            <>
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                style={{ width: "200px", marginRight: "8px" }}
              />
              <Button type="text" icon={<CheckOutlined />} onClick={() => handleSave("name")} />
              <Button type="text" icon={<CloseOutlined />} onClick={handleCancel} />
            </>
          ) : (
            <>
              {detail.name}
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit("name")} />
            </>
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: "描述",
      children: (
        <div style={{ display: "flex", alignItems: "center", marginTop: "-5px" }}>
          {editingField === "description" ? (
            <>
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                style={{ width: "200px", marginRight: "8px" }}
              />
              <Button type="text" icon={<CheckOutlined />} onClick={() => handleSave("description")} />
              <Button type="text" icon={<CloseOutlined />} onClick={handleCancel} />
            </>
          ) : (
            <>
              {detail.description || "-"}
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit("description")} />
            </>
          )}
        </div>
      ),
    },
  ]

  // 格式化时长（秒转换为可读格式）
  const formatDuration = (seconds) => {
    if (seconds === null || seconds === undefined) return "-"
    const s = Number(seconds)
    if (isNaN(s)) return "-"
    const total = Math.abs(Math.floor(s))
    const days = Math.floor(total / 86400)
    const hours = Math.floor((total % 86400) / 3600)
    const minutes = Math.floor((total % 3600) / 60)
    const secs = total % 60
    const parts = []
    if (days) parts.push(`${days}天`)
    if (hours) parts.push(`${hours}小时`)
    if (minutes) parts.push(`${minutes}分`)
    // 最小单位展示秒，若全部为 0 则显示 "0秒"
    if (secs || parts.length === 0) parts.push(`${secs}秒`)
    return parts.join(" ")
  }

  // Tab 切换回调函数
  const onTabChange = (key) => {
    setActiveTabKey(key)
    const searchParams = new URLSearchParams(location.search)
    searchParams.set("tab", key)
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true })
  }

  return (
    <div style={{ textAlign: "left" }}>
      <Descriptions items={describeItems} />

      {/* 近7天 SLO 线性图看板 */}
      <Row gutter={16} style={{ marginTop: 8, marginBottom: 20 }}>
        <Col span={12}>
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #ddddddff",
              height: 250,
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}
            >
              <div>
                <Typography.Text style={{ fontSize: 13, color: "#000000ff", fontWeight: 600, display: "block" }}>
                  平均修复时间 (MTTR)
                </Typography.Text>
                <Typography.Text style={{ fontSize: 11, color: "#6b7280", display: "block", marginTop: 2 }}>
                  Mean Time To Repair
                </Typography.Text>
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 18, color: "#fff" }}>⚡</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4, display: "block" }}>
                7日平均: {formatDuration(computeAverageFromList("mttr"))}
              </Typography.Text>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={sloChartData}>
                <defs>
                  <linearGradient id="mttrGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cacacaff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#cacacaff" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cacacaff" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#cacacaff" }}
                  tickLine={{ stroke: "#cacacaff" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#cacacaff" }}
                  tickLine={{ stroke: "#cacacaff" }}
                  tickFormatter={(value) => `${value}s`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #cacacaff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#000000ff", fontWeight: 600 }}
                  formatter={(value) => formatDuration(value)}
                />
                <Area
                  type="monotone"
                  dataKey="mttr"
                  stroke="#000000ff"
                  strokeWidth={1.5}
                  fill="url(#mttrGradient)"
                  dot={{ fill: "#000000ff", strokeWidth: 1, r: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>

        <Col span={12}>
          <div
            style={{
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #ddddddff",
              height: 250,
            }}
          >
            <div
              style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}
            >
              <div>
                <Typography.Text style={{ fontSize: 13, color: "#000000ff", fontWeight: 600, display: "block" }}>
                  平均响应时间 (MTTA)
                </Typography.Text>
                <Typography.Text style={{ fontSize: 11, color: "#6b7280", display: "block", marginTop: 2 }}>
                  Mean Time To Acknowledge
                </Typography.Text>
              </div>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 18, color: "#fff" }}>⏱️</span>
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <Typography.Text style={{ fontSize: 12, color: "#6b7280", marginTop: 4, display: "block" }}>
                7日平均: {formatDuration(computeAverageFromList("mtta"))}
              </Typography.Text>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={sloChartData}>
                <defs>
                  <linearGradient id="mttaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#cacacaff" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#cacacaff" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#cacacaff" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#cacacaff" }}
                  tickLine={{ stroke: "#cacacaff" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#6b7280" }}
                  axisLine={{ stroke: "#cacacaff" }}
                  tickLine={{ stroke: "#cacacaff" }}
                  tickFormatter={(value) => `${value}s`}
                  width={40}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #cacacaff",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#000000ff", fontWeight: 600 }}
                  formatter={(value) => formatDuration(value)}
                />
                <Area
                  type="monotone"
                  dataKey="mtta"
                  stroke="#000000ff"
                  strokeWidth={1.5}
                  fill="url(#mttaGradient)"
                  dot={{ fill: "#000000ff", strokeWidth: 1, r: 2, stroke: "#fff" }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Col>
      </Row>

      <Tabs activeKey={activeTabKey} defaultActiveKey="1" items={tagItems} onChange={onTabChange} />
    </div>
  )
}
