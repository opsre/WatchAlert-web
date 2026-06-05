"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Row, Col, Select, message, Typography, Spin, Empty, Tag, theme, Progress, Tooltip } from "antd"
import { getDashboardInfo } from "../api/other"
import { FaultCenterList } from "../api/faultCenter"
import { noticeRecordMetric } from "../api/notice"
import { Users, Server, Shield, Clock, AlertTriangle, TrendingUp, Activity, RefreshCw, Bell, Zap, Globe, Layers, LineChart } from "lucide-react"
import { NoticeMetricChart } from "./chart/noticeMetricChart"
import { FormatTime } from "../utils/lib"
import "./home.css"

const { Option } = Select
const { Text } = Typography

// ─── 子组件：统计卡片 ───────────────────────────────────────────
const StatCard = ({ title, value, icon: IconComp, color, bg, panelStyle }) => (
  <div className="stat-card panel" style={panelStyle}>
    <div className="stat-icon" style={{ background: bg }}>
      <IconComp size={24} color={color} strokeWidth={2} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ fontSize: 13, color: "#8c8c8c", display: "block", marginBottom: 4 }}>
        {title}
      </Text>
      <span className="stat-value" style={{ color }}>{value}</span>
    </div>
  </div>
)

// ─── 子组件：告警列表项 ─────────────────────────────────────────
const AlertItem = ({ item, severityColors, textColor }) => (
  <div
    className="alert-item"
    style={{
      background: "rgba(0,0,0,0.02)",
      borderLeft: `3px solid ${severityColors[item?.severity] || "#d9d9d9"}`,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <Tag
        color={severityColors[item?.severity]}
        style={{ margin: 0, borderRadius: 4, fontSize: 11, lineHeight: "18px" }}
      >
        {item?.severity}
      </Tag>
      <Tooltip title={item?.ruleName} placement="topLeft">
        <a
          href={`/faultCenter/detail/${item?.faultCenterId}?query=${item?.ruleName}`}
          target="_blank"
          rel="noopener noreferrer"
          className="alert-link"
          style={{ color: textColor }}
        >
          {item?.ruleName}
        </a>
      </Tooltip>
    </div>
    <div style={{ display: "flex", alignItems: "center", color: "#bfbfbf", fontSize: 11, paddingLeft: 2 }}>
      <Clock size={11} style={{ marginRight: 4 }} />
      {FormatTime(item?.tiggerTime)}
    </div>
  </div>
)

// ─── 主组件 ─────────────────────────────────────────────────────
export const Home = () => {
  const { token } = theme.useToken()
  const [dashboardInfo, setDashboardInfo] = useState({})
  const [faultCenters, setFaultCenters] = useState([])
  const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metricData, setMetricData] = useState({})

  // ─── 数据请求 ───────────────────────────────────────────────
  const fetchFaultCenters = useCallback(async () => {
    try {
      setLoading(true)
      const res = await FaultCenterList()
      setFaultCenters(res?.data || [])
      if (res?.data?.length > 0) {
        setSelectedFaultCenter(res?.data[0]?.id)
      }
    } catch (error) {
      console.error(error)
      message.error("获取故障中心列表失败")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchDashboardInfo = useCallback(async (faultCenterId) => {
    if (!faultCenterId) return
    try {
      const res = await getDashboardInfo({ faultCenterId })
      setDashboardInfo(res?.data || {})
    } catch (error) {
      console.error(error)
      message.error("获取仪表盘数据失败")
    }
  }, [])

  const fetchMetricData = useCallback(async () => {
    try {
      const res = await noticeRecordMetric()
      setMetricData(res?.data)
    } catch (error) {
      message.error("加载图表数据失败")
      console.error("Failed to load metric data:", error)
    }
  }, [])

  useEffect(() => {
    fetchFaultCenters()
    fetchMetricData()
  }, [fetchFaultCenters, fetchMetricData])

  useEffect(() => {
    if (selectedFaultCenter) {
      fetchDashboardInfo(selectedFaultCenter)
    }
  }, [selectedFaultCenter, fetchDashboardInfo])

  const handleRefresh = useCallback(() => {
    fetchFaultCenters()
    fetchMetricData()
  }, [fetchFaultCenters, fetchMetricData])

  // ─── 派生数据 ───────────────────────────────────────────────
  const SEVERITY_COLORS = useMemo(() => ({
    P0: token.colorError,
    P1: token.colorWarning,
    P2: token.colorSuccess,
  }), [token])

  const totalAlerts = useMemo(() => (
    (dashboardInfo?.alarmDistribution?.P0 ?? 0) +
    (dashboardInfo?.alarmDistribution?.P1 ?? 0) +
    (dashboardInfo?.alarmDistribution?.P2 ?? 0)
  ), [dashboardInfo?.alarmDistribution])

  const statCards = useMemo(() => [
    {
      title: "告警规则",
      value: dashboardInfo?.countAlertRules || 0,
      icon: Shield,
      color: "#6366f1",
      bg: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
    },
    {
      title: "故障中心",
      value: dashboardInfo?.faultCenterNumber || 0,
      icon: Server,
      color: "#f59e0b",
      bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
    },
    {
      title: "活跃用户",
      value: dashboardInfo?.userNumber ?? 0,
      icon: Users,
      color: "#10b981",
      bg: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
    },
    {
      title: "总告警数",
      value: totalAlerts,
      icon: AlertTriangle,
      color: "#ef4444",
      bg: "linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)",
    },
  ], [dashboardInfo, totalAlerts])

  // ─── 通用样式 ──────────────────────────────────────────────
  const panelStyle = {
    background: token.colorBgContainer,
    borderRadius: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
    border: `1px solid ${token.colorBorderSecondary}`,
    overflow: "hidden",
  }

  return (
    <div className="home-container">
      <div className="home-content">

        {/* ─── 平台介绍区域 ────────────────────────────── */}
        <div className="hero-section panel" style={panelStyle}>
          <div className="hero-content">
            <div className="hero-text">
              <p style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#595959',
                margin: 0,
                lineHeight: 1.8,
                maxWidth: 520,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                一款专为云原生环境设计 的轻量级监控告警引擎，
              </p>
              <p style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#595959',
                margin: 0,
                lineHeight: 1.8,
                maxWidth: 520,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                聚焦于可观测性（Metrics、Logs、Traces）与系统稳定性保障。
              </p>
              <p style={{
                fontSize: 14,
                fontWeight: 700,
                color: '#595959',
                margin: 0,
                lineHeight: 1.8,
                maxWidth: 520,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                使用 <a href="https://cairry.github.io/sreflow-docs/" target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'underline' }}>AI 驱动的 SRE 工作流自动化平台</a>，从你的第一个 Workflow 开始，让告警响应快人一步。
              </p>
            </div>

            <div className="hero-capabilities">
              {[
                { icon: Globe, label: '多源接入', desc: 'Metrics / Logs / Traces 等' },
                { icon: Zap, label: '智能规则', desc: '简单易用、支持多条件组合...' },
                { icon: Bell, label: '多渠道通知', desc: '飞书 / 钉钉 / 企微 / 邮件...' },
                { icon: Server, label: '故障中心', desc: '统一故障管理与事件追踪' },
                { icon: Layers, label: '服务发现', desc: 'HTTP SD 动态目标管理' },
                { icon: LineChart, label: '记录规则', desc: '预计算指标，提升查询性能' },
              ].map((item) => (
                <div key={item.label} className="capability-item">
                  <div className="capability-icon">
                    <item.icon size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', lineHeight: 1.4 }}>
                      {item.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#8c8c8c', lineHeight: 1.4 }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── 统计卡片 ──────────────────────────────────── */}
        <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
          {statCards.map((card) => (
            <Col xs={24} sm={12} lg={6} key={card.title}>
              <StatCard {...card} panelStyle={panelStyle} />
            </Col>
          ))}
        </Row>

        {/* ─── 告警分布条 ─────────────────────────────────── */}
        <div className="distribution-bar panel" style={panelStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, flexWrap: "wrap" }}>
            {Object.entries(SEVERITY_COLORS).map(([level, color]) => {
              const count = dashboardInfo?.alarmDistribution?.[level] ?? 0
              const percent = totalAlerts > 0 ? Math.round((count / totalAlerts) * 100) : 0
              return (
                <div key={level} className="distribution-item">
                  <Tag
                    color={color}
                    style={{ margin: 0, borderRadius: 6, fontWeight: 600, minWidth: 32, textAlign: "center" }}
                  >
                    {level}
                  </Tag>
                  <Text strong style={{ fontSize: 20, minWidth: 28 }}>{count}</Text>
                  <Progress
                    percent={percent}
                    size="small"
                    showInfo={false}
                    strokeColor={color}
                    trailColor={token.colorFillSecondary}
                    style={{ width: 80, margin: 0 }}
                  />
                  <Text type="secondary" style={{ fontSize: 12, minWidth: 32 }}>{percent}%</Text>
                </div>
              )
            })}
          </div>
          {/* 刷新按钮 */}
          <Tooltip title="刷新数据">
            <div
              onClick={handleRefresh}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "background 0.2s",
                background: token.colorFillQuaternary,
              }}
            >
              <RefreshCw size={15} color={token.colorTextSecondary} />
            </div>
          </Tooltip>
        </div>

        {/* ─── 图表 + 告警列表 ───────────────────────────── */}
        <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
          {/* 告警趋势 */}
          <Col xs={24} lg={16}>
            <div className="panel" style={{ ...panelStyle, height: 420 }}>
              <div style={{
                padding: "18px 24px 14px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}>
                <div className="panel-header">
                  <div>
                    <Text strong style={{ fontSize: 15, display: "block" }}>告警通知趋势</Text>
                  </div>
                </div>
              </div>
              <div style={{ padding: "16px", height: "calc(100% - 68px)" }}>
                <Spin spinning={loading}>
                  {metricData?.date?.length > 0 ? (
                    <div style={{ width: "100%", height: "100%" }}>
                      <NoticeMetricChart data={metricData ?? {}} />
                    </div>
                  ) : (
                    <div className="empty-center" style={{ paddingTop: 0 }}>
                      <Empty description="暂无告警趋势数据" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    </div>
                  )}
                </Spin>
              </div>
            </div>
          </Col>

          {/* 最近告警 */}
          <Col xs={24} lg={8}>
            <div className="panel" style={{ ...panelStyle, height: 420, display: "flex", flexDirection: "column" }}>
              {/* 头部 */}
              <div style={{
                padding: "18px 24px 14px",
                borderBottom: `1px solid ${token.colorBorderSecondary}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <Text strong style={{ fontSize: 15, display: "block" }}>最近活跃告警</Text>
                  </div>
                  <Tag color="processing" style={{ margin: 0, borderRadius: 10, fontSize: 12 }}>
                    {dashboardInfo?.curAlertList?.length ?? 0} 条
                  </Tag>
                </div>
                <Select
                  style={{ width: "100%" }}
                  placeholder="选择故障中心"
                  value={selectedFaultCenter}
                  onChange={setSelectedFaultCenter}
                  showSearch
                  optionFilterProp="children"
                  loading={loading}
                  size="small"
                >
                  {faultCenters?.length === 0 && <Option disabled>暂无可用故障中心</Option>}
                  {faultCenters?.map((center) => (
                    <Option key={center?.id} value={center?.id}>
                      {center?.name}
                    </Option>
                  ))}
                </Select>
              </div>

              {/* 列表 */}
              <div style={{ flex: 1, overflow: "auto", padding: "10px 16px" }}>
                <Spin spinning={loading}>
                  {dashboardInfo?.curAlertList?.length > 0 ? (
                    <div>
                      {(dashboardInfo?.curAlertList ?? []).map((item, index) => (
                        <AlertItem
                          key={item?.id || index}
                          item={item}
                          severityColors={SEVERITY_COLORS}
                          textColor={token.colorText}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="empty-center">
                      <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description="暂无告警数据"
                        imageStyle={{ height: 36 }}
                      />
                    </div>
                  )}
                </Spin>
              </div>
            </div>
          </Col>
        </Row>
      </div>
    </div>
  )
}
