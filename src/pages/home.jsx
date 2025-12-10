"use client"

import { useState, useEffect } from "react"
import ReactECharts from "echarts-for-react"
import { List, Row, Col, Select, message, Typography, Spin, Empty, Tag, Card, Progress, Avatar } from "antd"
import { getDashboardInfo } from "../api/other"
import { FaultCenterList } from "../api/faultCenter"
import { noticeRecordMetric } from "../api/notice"
import { AlertTriangle, BarChart2, Users, Bell, Server, TrendingUp, Shield, Zap, Clock } from "lucide-react"
import { NoticeMetricChart } from "./chart/noticeMetricChart"
import { FormatTime } from "../utils/lib"

const { Option } = Select
const { Text } = Typography

export const Home = () => {
  const [dashboardInfo, setDashboardInfo] = useState({})
  const [faultCenters, setFaultCenters] = useState([])
  const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
  const [loading, setLoading] = useState(true)
  const [metricData, setMetricData] = useState({})
  const [currentTime, setCurrentTime] = useState(new Date())

  // 更新时间
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // 获取故障中心列表
  const fetchFaultCenters = async () => {
    try {
      setLoading(true)
      const res = await FaultCenterList()
      setFaultCenters(res.data)
      if (res.data.length > 0) {
        setSelectedFaultCenter(res.data[0].id)
      }
    } catch (error) {
      console.error(error)
      message.error("获取故障中心列表失败")
    } finally {
      setLoading(false)
    }
  }

  // 获取仪表盘信息
  const fetchDashboardInfo = async (faultCenterId) => {
    if (!faultCenterId) return
    try {
      setLoading(true)
      const params = { faultCenterId }
      const res = await getDashboardInfo(params)
      setDashboardInfo(res.data)
    } catch (error) {
      console.error(error)
      message.error("获取仪表盘数据失败")
    } finally {
      setLoading(false)
    }
  }

  // 获取图表数据
  const fetchMetricData = async () => {
    try {
      const res = await noticeRecordMetric()
      setMetricData(res.data)
    } catch (error) {
      message.error("加载图表数据失败")
      console.error("Failed to load metric data:", error)
    }
  }

  // 初始化加载
  useEffect(() => {
    fetchFaultCenters()
  }, [])

  useEffect(() => {
    fetchDashboardInfo(selectedFaultCenter)
  }, [selectedFaultCenter])

  useEffect(() => {
    fetchMetricData()
  }, [])

  // 告警等级颜色
  const SEVERITY_COLORS = {
    P0: "#ff4d4f",
    P1: "#faad14", 
    P2: "#52c41a",
  }

  // 渲染告警级别 badge
  const getSeverityBadge = (severity, ruleName, faultCenterId) => {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Tag 
          color={SEVERITY_COLORS[severity]} 
          style={{ 
            margin: 0, 
            fontWeight: '500',
            borderRadius: '6px'
          }}
        >
          {severity}
        </Tag>
        <a 
          href={`/faultCenter/detail/${faultCenterId}?query=${ruleName}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            color: '#262626', 
            textDecoration: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '400',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#FF9900'}
          onMouseLeave={(e) => e.target.style.color = '#262626'}
        >
          {ruleName}
        </a>
      </div>
    )
  }

  const alarmDistributionOption = {
    tooltip: {
      trigger: "item",
      formatter: "{a} <br/>{b}: {c} ({d}%)",
      backgroundColor: "#000000",
      borderColor: "#333",
      textStyle: {
        color: "#ffffff",
        fontSize: 12,
      },
    },
    legend: {
      orient: "vertical",
      right: 10,
      top: "center",
      data: ["P0", "P1", "P2"],
      textStyle: {
        color: "#000",
      },
    },
    series: [
      {
        name: "告警级别",
        type: "pie",
        radius: ["50%", "70%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
          position: "center",
        },
        emphasis: {
          label: {
            show: false,
            fontSize: "18",
            fontWeight: "bold",
            color: "#000",
          },
        },
        labelLine: {
          show: false,
        },
        data: [
          {
            value: dashboardInfo?.alarmDistribution?.P0 ?? 0,
            name: "P0",
            itemStyle: { color: SEVERITY_COLORS.P0 },
          },
          {
            value: dashboardInfo?.alarmDistribution?.P1 ?? 0,
            name: "P1",
            itemStyle: { color: SEVERITY_COLORS.P1 },
          },
          {
            value: dashboardInfo?.alarmDistribution?.P2 ?? 0,
            name: "P2",
            itemStyle: { color: SEVERITY_COLORS.P2 },
          },
        ],
      },
    ],
  }

  // 计算总告警数
  const totalAlerts = (dashboardInfo?.alarmDistribution?.P0 || 0) + 
                     (dashboardInfo?.alarmDistribution?.P1 || 0) + 
                     (dashboardInfo?.alarmDistribution?.P2 || 0)

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #000000 0%, #1a1a1a 50%, #000000 100%)",
        padding: "32px",
      }}
    >
      {/* 页面头部 */}
      <div style={{ 
        marginBottom: "32px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h1 style={{ 
            color: "#ffffff", 
            fontSize: "32px", 
            fontWeight: "700", 
            margin: 0,
            textShadow: "0 2px 4px rgba(0,0,0,0.1)"
          }}>
            Overview
          </h1>
          <Text style={{ 
            color: "rgba(255,255,255,0.8)", 
            fontSize: "16px",
            display: "block",
            marginTop: "8px"
          }}>
            实时监控系统状态，智能告警管理
          </Text>
        </div>
        <div style={{ 
          color: "#ffffff", 
          fontSize: "18px", 
          fontWeight: "500",
          textAlign: "right"
        }}>
          <div>{currentTime.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            weekday: 'long'
          })}</div>
          <div style={{ fontSize: "24px", fontWeight: "700", marginTop: "4px" }}>
            {currentTime.toLocaleTimeString('zh-CN')}
          </div>
        </div>
      </div>
      {/* 统计卡片 */}
      <Row gutter={[24, 24]} style={{ marginBottom: "32px" }}>
        {/* 告警规则卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "200px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.12), 0 8px 32px rgba(255,153,0,0.15)"
              e.currentTarget.style.borderColor = "rgba(255,153,0,0.3)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "linear-gradient(135deg, rgba(255,153,0,0.08), rgba(0,0,0,0.04))", 
              borderRadius: "50%",
              filter: "blur(1px)"
            }}></div>
            <div style={{ 
              position: "absolute", 
              bottom: "-30px", 
              left: "-30px", 
              width: "80px", 
              height: "80px", 
              background: "linear-gradient(45deg, rgba(0,0,0,0.03), rgba(255,153,0,0.05))", 
              borderRadius: "50%",
              filter: "blur(2px)"
            }}></div>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              height: "100%",
              position: "relative",
              zIndex: 1
            }}>
              {/* 图标和标题区域 */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  background: "linear-gradient(135deg, #FF9900, #000000)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  boxShadow: "0 8px 24px rgba(255,153,0,0.25)"
                }}>
                  <Shield size={24} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#595959", 
                    fontSize: "13px", 
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "2px"
                  }}>
                    Alert Rules
                  </Text>
                  <Text style={{ 
                    color: "#262626", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    display: "block"
                  }}>
                    告警规则
                  </Text>
                </div>
              </div>
              
              {/* 数值区域 */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Text style={{ 
                  color: "#262626", 
                  fontSize: "42px", 
                  fontWeight: "800", 
                  lineHeight: "1",
                  marginBottom: "8px",
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>
                  {dashboardInfo?.countAlertRules || 0}
                </Text>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#FF9900",
                    marginRight: "8px"
                  }}></div>
                  <Text style={{ 
                    color: "#FF9900", 
                    fontSize: "13px", 
                    fontWeight: "600",
                    letterSpacing: "0.3px"
                  }}>
                    规则可用性
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 故障中心卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "200px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.12), 0 8px 32px rgba(0,0,0,0.15)"
              e.currentTarget.style.borderColor = "rgba(0,0,0,0.15)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "linear-gradient(135deg, rgba(0,0,0,0.06), rgba(255,153,0,0.04))", 
              borderRadius: "50%",
              filter: "blur(1px)"
            }}></div>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              height: "100%",
              position: "relative",
              zIndex: 1
            }}>
              {/* 图标和标题区域 */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  background: "linear-gradient(135deg, #FF9900, #000000)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)"
                }}>
                  <Server size={24} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#595959", 
                    fontSize: "13px", 
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "2px"
                  }}>
                    Fault Centers
                  </Text>
                  <Text style={{ 
                    color: "#262626", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    display: "block"
                  }}>
                    故障中心
                  </Text>
                </div>
              </div>
              
              {/* 数值区域 */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Text style={{ 
                  color: "#262626", 
                  fontSize: "42px", 
                  fontWeight: "800", 
                  lineHeight: "1",
                  marginBottom: "8px",
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>
                  {dashboardInfo?.faultCenterNumber || 0}
                </Text>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: "#FF9900",
                    marginRight: "8px"
                  }}></div>
                  <Text style={{ 
                    color: "#FF9900", 
                    fontSize: "13px", 
                    fontWeight: "600",
                    letterSpacing: "0.3px"
                  }}>
                    事件接收渠道
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 系统用户卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "200px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.12), 0 8px 32px rgba(82,196,26,0.15)"
              e.currentTarget.style.borderColor = "rgba(82,196,26,0.3)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "linear-gradient(135deg, rgba(82,196,26,0.08), rgba(135,208,104,0.04))", 
              borderRadius: "50%",
              filter: "blur(1px)"
            }}></div>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              height: "100%",
              position: "relative",
              zIndex: 1
            }}>
              {/* 图标和标题区域 */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  background: "linear-gradient(135deg, #FF9900, #000000)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  boxShadow: "0 8px 24px rgba(82,196,26,0.25)"
                }}>
                  <Users size={24} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#595959", 
                    fontSize: "13px", 
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "2px"
                  }}>
                    Active Users
                  </Text>
                  <Text style={{ 
                    color: "#262626", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    display: "block"
                  }}>
                    活跃用户
                  </Text>
                </div>
              </div>
              
              {/* 数值区域 */}
              <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Text style={{ 
                  color: "#262626", 
                  fontSize: "42px", 
                  fontWeight: "800", 
                  lineHeight: "1",
                  marginBottom: "8px",
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif"
                }}>
                  {dashboardInfo?.userNumber || 0}
                </Text>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: "0",
                    height: "0",
                    borderLeft: "4px solid transparent",
                    borderRight: "4px solid transparent",
                    borderBottom: "6px solid #FF9900",
                    marginRight: "8px"
                  }}></div>
                  <Text style={{ 
                    color: "#FF9900", 
                    fontSize: "13px", 
                    fontWeight: "600",
                    letterSpacing: "0.3px"
                  }}>
                    用户活跃度
                  </Text>
                </div>
              </div>
            </div>
          </Card>
        </Col>

        {/* 告警分布卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.95) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              boxShadow: "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              border: "1px solid rgba(255,255,255,0.2)",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "200px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.12), 0 8px 32px rgba(255,77,79,0.15)"
              e.currentTarget.style.borderColor = "rgba(255,77,79,0.3)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)"
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "linear-gradient(135deg, rgba(255,77,79,0.08), rgba(250,173,20,0.04))", 
              borderRadius: "50%",
              filter: "blur(1px)"
            }}></div>
            
            <div style={{ 
              display: "flex", 
              flexDirection: "column", 
              height: "100%",
              position: "relative",
              zIndex: 1
            }}>
              {/* 图标和标题区域 */}
              <div style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  background: "linear-gradient(135deg, #FF9900, #000000)",
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  boxShadow: "0 8px 24px rgba(255,77,79,0.25)"
                }}>
                  <BarChart2 size={24} color="#ffffff" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#595959", 
                    fontSize: "13px", 
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "2px"
                  }}>
                    Alert Distribution
                  </Text>
                  <Text style={{ 
                    color: "#262626", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    display: "block"
                  }}>
                    告警分布
                  </Text>
                </div>
              </div>
              
              {/* 图表和统计区域 */}
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ flex: 1 }}>
                  {/* 告警级别统计 */}
                  <div style={{ marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: SEVERITY_COLORS.P0,
                        marginRight: "8px"
                      }}></div>
                      <Text style={{ fontSize: "12px", color: "#595959", marginRight: "8px" }}>P0</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#262626" }}>
                        {dashboardInfo?.alarmDistribution?.P0 || 0}
                      </Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: SEVERITY_COLORS.P1,
                        marginRight: "8px"
                      }}></div>
                      <Text style={{ fontSize: "12px", color: "#595959", marginRight: "8px" }}>P1</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#262626" }}>
                        {dashboardInfo?.alarmDistribution?.P1 || 0}
                      </Text>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: SEVERITY_COLORS.P2,
                        marginRight: "8px"
                      }}></div>
                      <Text style={{ fontSize: "12px", color: "#595959", marginRight: "8px" }}>P2</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#262626" }}>
                        {dashboardInfo?.alarmDistribution?.P2 || 0}
                      </Text>
                    </div>
                  </div>
                  
                  {/* 总计 */}
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Text style={{ fontSize: "12px", color: "#8c8c8c", marginRight: "8px" }}>总计:</Text>
                    <Text style={{ 
                      fontSize: "18px", 
                      fontWeight: "700", 
                      color: totalAlerts > 0 ? "#ff4d4f" : "#52c41a"
                    }}>
                      {totalAlerts}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 告警趋势图表和最近告警列表 */}
      <Row gutter={[24, 24]}>
        {/* 告警趋势图表 - 占2/3宽度 */}
        <Col xs={24} lg={16}>
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "24px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              height: "500px",
              overflow: "hidden"
            }}
          >
            {/* 标题区域 */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "24px 24px 8px 24px",
              borderBottom: "1px solid rgba(0,0,0,0.06)"
            }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#262626" }}>告警通知趋势</div>
                <div style={{ fontSize: "14px", color: "#8c8c8c" }}>实时监控告警数据变化</div>
              </div>
            </div>
            
            {/* 内容区域 */}
            <div style={{ padding: "24px", height: "calc(100% - 80px)" }}>
              <Spin spinning={loading}>
                {metricData.date && metricData.date.length > 0 ? (
                  <div style={{ 
                    borderRadius: "16px",
                    padding: "16px",
                    height: "100%",
                    display: "flex",
                    alignItems: "center"
                  }}>
                    <div style={{ width: "100%", height: "500px" }}>
                      <NoticeMetricChart data={metricData} />
                    </div>
                  </div>
                ) : (
                  <div style={{ 
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    borderRadius: "16px"
                  }}>
                    <Empty 
                      description="暂无告警趋势数据" 
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  </div>
                )}
              </Spin>
            </div>
          </div>
        </Col>

        {/* 最近告警列表 - 占1/3宽度 */}
        <Col xs={24} lg={8}>
          <div
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(10px)",
              borderRadius: "24px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
              height: "500px",
              overflow: "hidden"
            }}
          >
            {/* 标题区域 */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              padding: "24px 24px 8px 24px",
              borderBottom: "1px solid rgba(0,0,0,0.06)"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#262626" }}>最近告警</div>
                  <div style={{ fontSize: "12px", color: "#8c8c8c" }}>实时事件监控</div>
                </div>
              </div>
              <Select
                style={{ 
                  width: "100%",
                  borderRadius: "12px"
                }}
                placeholder="选择故障中心"
                value={selectedFaultCenter}
                onChange={setSelectedFaultCenter}
                showSearch
                optionFilterProp="children"
                loading={loading}
                size="small"
                dropdownStyle={{ 
                  maxHeight: 400, 
                  overflow: "auto",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)"
                }}
              >
                {faultCenters.length === 0 && <Option disabled>暂无可用故障中心</Option>}
                {faultCenters.map((center) => (
                  <Option key={center.id} value={center.id}>
                    {center.name}
                  </Option>
                ))}
              </Select>
            </div>
            
            {/* 内容区域 */}
            <div style={{ padding: "0", height: "calc(100% - 120px)" }}>
              <Spin spinning={loading}>
                {dashboardInfo.curAlertList?.length > 0 ? (
                  <List
                    dataSource={dashboardInfo.curAlertList ?? []}
                    style={{
                      height: "100%",
                      overflow: "auto",
                      padding: "0 8px"
                    }}
                    renderItem={(item, index) => (
                      <List.Item
                        style={{
                          padding: "16px 20px",
                          margin: "6px 0",
                          borderRadius: "12px",
                          border: "none",
                          background: index % 2 === 0 ? "rgba(255, 153, 0, 0.03)" : "rgba(0, 0, 0, 0.03)"
                        }}
                      >
                        <div style={{ width: "100%" }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: "8px" }}>
                            <Tag 
                              color={SEVERITY_COLORS[item.severity]} 
                              style={{ 
                                margin: 0, 
                                fontWeight: '500',
                                borderRadius: '6px',
                                fontSize: "11px"
                              }}
                            >
                              {item.severity}
                            </Tag>
                            <a 
                              href={`/faultCenter/detail/${item.faultCenterId}?query=${item.ruleName}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ 
                                color: '#262626', 
                                textDecoration: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '400',
                                transition: 'color 0.2s',
                                display: "block",
                                lineHeight: "1.4"
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#FF9900'}
                              onMouseLeave={(e) => e.target.style.color = '#262626'}
                            >
                              {item.ruleName}
                            </a>
                            <div style={{ display: "flex", alignItems: "center", color: "#8c8c8c", fontSize: "10px" }}>
                              <Clock size={12} style={{ marginRight: "4px" }} />
                              {FormatTime(item.tiggerTime)}
                            </div>
                          </div>
                        </div>
                      </List.Item>
                    )}
                  />
                ) : (
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    height: "100%",
                    margin: "16px",
                    borderRadius: "16px"
                  }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description="暂无告警数据" 
                      imageStyle={{ height: 40 }}
                    />
                  </div>
                )}
              </Spin>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  )
}
