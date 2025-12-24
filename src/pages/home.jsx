"use client"

import { useState, useEffect } from "react"
import { List, Row, Col, Select, message, Typography, Spin, Empty, Tag, Card } from "antd"
import { getDashboardInfo } from "../api/other"
import { FaultCenterList } from "../api/faultCenter"
import { noticeRecordMetric } from "../api/notice"
import { BarChart2, Users, Server, Shield, Clock } from "lucide-react"
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

  // 添加样式
  const selectStyles = `
    .ant-select-selector {
      background-color: rgba(40,40,40,0.95) !important;
      border: 1px solid rgba(80,80,80,0.3) !important;
      color: #ffffff !important;
    }
    .ant-select-selector:hover {
      border-color: rgba(255,153,0,0.5) !important;
    }
    .ant-select-focused .ant-select-selector {
      border-color: #FF9900 !important;
      box-shadow: 0 0 0 2px rgba(255,153,0,0.2) !important;
    }
    .ant-select-selection-placeholder {
      color: rgba(255,255,255,0.5) !important;
    }
    .ant-select-selection-item {
      color: #ffffff !important;
    }
    .ant-select-arrow {
      color: rgba(255,255,255,0.7) !important;
    }
    .dark-select-dropdown .ant-select-item {
      background-color: rgba(40,40,40,0.95) !important;
      color: #ffffff !important;
    }
    .dark-select-dropdown .ant-select-item:hover {
      background-color: rgba(255,153,0,0.1) !important;
    }
    .dark-select-dropdown .ant-select-item-option-selected {
      background-color: rgba(255,153,0,0.2) !important;
    }
  `

  // 在组件挂载时添加样式
  useEffect(() => {
    const styleElement = document.createElement('style')
    styleElement.textContent = selectStyles
    document.head.appendChild(styleElement)
    
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [selectStyles])

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
      {/* 金色粒子效果 */}
      <div style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `
          radial-gradient(2px 2px at 20px 30px, rgba(255, 215, 0, 0.4), transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(255, 193, 7, 0.3), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(255, 215, 0, 0.5), transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255, 193, 7, 0.4), transparent),
          radial-gradient(2px 2px at 160px 30px, rgba(255, 215, 0, 0.3), transparent)
        `,
        backgroundRepeat: "repeat",
        backgroundSize: "200px 100px",
        animation: "sparkle 20s linear infinite",
        zIndex: 0,
        pointerEvents: "none"
      }}></div>
      
      <style jsx>{`
        @keyframes sparkle {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
          50% { transform: translateY(-10px) rotate(180deg); opacity: 0.8; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.3); }
          50% { box-shadow: 0 0 40px rgba(255, 215, 0, 0.6), 0 0 60px rgba(255, 193, 7, 0.4); }
        }
      `}</style>
      
      <div style={{ position: "relative", zIndex: 1 }}>
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
            // color: "#FFD700", 
            color: "linear-gradient(135deg, #FF9900 0%, #FFB84D 100%) !important",
            fontSize: "32px", 
            fontWeight: "700", 
            margin: 0,
            background: "linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FFB300 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text"
          }}>
            ✦ Overview Dashboard ✦
          </h1>
          <Text style={{ 
            color: "rgba(255,255,255,0.8)", 
            fontSize: "14px",
            display: "block",
            marginTop: "12px",
          }}>
            🔥 实时监控系统状态，智能告警管理
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
              background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.95) 50%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "180px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.8), 0 8px 32px rgba(255,215,0,0.3)"
              e.currentTarget.style.borderColor = "rgba(255,215,0,0.6)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,215,0,0.2)"
              e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "linear-gradient(135deg, rgba(255,153,0,0.15), rgba(60,60,60,0.1))", 
              borderRadius: "50%",
              filter: "blur(1px)"
            }}></div>
            <div style={{ 
              position: "absolute", 
              bottom: "-30px", 
              left: "-30px", 
              width: "80px", 
              height: "80px", 
              background: "linear-gradient(45deg, rgba(60,60,60,0.08), rgba(255,153,0,0.1))", 
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
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF8F00 100%)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                }}>
                  <Shield size={28} color="#000000" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#a0a0a0", 
                    fontSize: "13px", 
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    display: "block",
                    marginBottom: "2px"
                  }}>
                    ALERT RULES
                  </Text>
                  <Text style={{ 
                    color: "#ffffff", 
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
                  color: "#ffffff", 
                  fontSize: "42px", 
                  fontWeight: "800", 
                  lineHeight: "1",
                  marginBottom: "12px",
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  textShadow: "0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.3)"
                }}>
                  {dashboardInfo?.countAlertRules || 0}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 故障中心卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.95) 50%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "180px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.8), 0 8px 32px rgba(255,215,0,0.3)"
              e.currentTarget.style.borderColor = "rgba(255,215,0,0.6)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,215,0,0.2)"
              e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, rgba(255,193,7,0.06) 50%, transparent 100%)", 
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
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF8F00 100%)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                }}>
                  <Server size={28} color="#000000" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#a0a0a0", 
                    fontSize: "13px", 
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "4px"
                  }}>
                    FAULT CENTERS
                  </Text>
                  <Text style={{ 
                    color: "#ffffff", 
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
                  color: "#ffffff", 
                  fontSize: "42px", 
                  fontWeight: "800", 
                  lineHeight: "1",
                  marginBottom: "12px",
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  textShadow: "0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.3)"
                }}>
                  {dashboardInfo?.faultCenterNumber || 0}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 系统用户卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.95) 50%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "180px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.8), 0 8px 32px rgba(255,215,0,0.3)"
              e.currentTarget.style.borderColor = "rgba(255,215,0,0.6)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,215,0,0.2)"
              e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, rgba(255,193,7,0.06) 50%, transparent 100%)", 
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
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF8F00 100%)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                }}>
                  <Users size={28} color="#000000" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#a0a0a0", 
                    fontSize: "13px", 
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "4px"
                  }}>
                    Active Users
                  </Text>
                  <Text style={{ 
                    color: "#ffffff", 
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
                  color: "#ffffff", 
                  fontSize: "42px", 
                  fontWeight: "800", 
                  lineHeight: "1",
                  marginBottom: "12px",
                  fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
                  textShadow: "0 4px 8px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.3)"
                }}>
                  {dashboardInfo?.userNumber || 0}
                </Text>
              </div>
            </div>
          </Card>
        </Col>

        {/* 告警分布卡片 */}
        <Col xs={24} sm={12} lg={6}>
          <Card
            bordered={false}
            style={{
              background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.95) 50%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              overflow: "hidden",
              position: "relative",
              height: "180px"
            }}
            bodyStyle={{ padding: "28px 24px", height: "100%" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-12px) scale(1.03)"
              e.currentTarget.style.boxShadow = "0 24px 60px rgba(0,0,0,0.8), 0 8px 32px rgba(255,215,0,0.3)"
              e.currentTarget.style.borderColor = "rgba(255,215,0,0.6)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0) scale(1)"
              e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.6), 0 4px 16px rgba(255,215,0,0.1), inset 0 1px 0 rgba(255,215,0,0.2)"
              e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.3)"
            }}
          >
            {/* 装饰性背景元素 */}
            <div style={{ 
              position: "absolute", 
              top: "-20px", 
              right: "-20px", 
              width: "120px", 
              height: "120px", 
              background: "radial-gradient(circle, rgba(255,215,0,0.12) 0%, rgba(255,193,7,0.06) 50%, transparent 100%)", 
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
                  width: "50px",
                  height: "50px",
                  background: "linear-gradient(135deg, #FFD700 0%, #FFC107 50%, #FF8F00 100%)",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                }}>
                  <BarChart2 size={28} color="#000000" strokeWidth={2.5} />
                </div>
                <div>
                  <Text style={{ 
                    color: "#a0a0a0", 
                    fontSize: "13px", 
                    fontWeight: "600",
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    display: "block",
                    marginBottom: "4px"
                  }}>
                    ALERT DISTRIBUTION
                  </Text>
                  <Text style={{ 
                    color: "#ffffff", 
                    fontSize: "16px", 
                    fontWeight: "600",
                    display: "block",
                    textShadow: "0 2px 4px rgba(0,0,0,0.3)"
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
                      <Text style={{ fontSize: "12px", color: "#a0a0a0", marginRight: "8px" }}>P0</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>
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
                      <Text style={{ fontSize: "12px", color: "#a0a0a0", marginRight: "8px" }}>P1</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>
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
                      <Text style={{ fontSize: "12px", color: "#a0a0a0", marginRight: "8px" }}>P2</Text>
                      <Text style={{ fontSize: "14px", fontWeight: "600", color: "#ffffff" }}>
                        {dashboardInfo?.alarmDistribution?.P2 || 0}
                      </Text>
                    </div>
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
              background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.95) 50%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              height: "520px",
              overflow: "hidden"
            }}
          >
            {/* 标题区域 */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "28px 28px 12px 28px",
              borderBottom: "1px solid rgba(255, 215, 0, 0.2)"
            }}>
              <div>
                <div style={{ fontSize: "20px", fontWeight: "700", color: "#ffffff" }}>告警通知趋势</div>
                <div style={{ fontSize: "14px", color: "#a0a0a0" }}>实时监控告警数据变化</div>
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
                    alignItems: "center",
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
                    borderRadius: "16px",
                  }}>
                    <Empty 
                      description={
                        <span style={{ color: "rgba(255,215,0,0.7)" }}>
                          暂无告警趋势数据
                        </span>
                      }
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
              background: "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(26,26,26,0.95) 50%, rgba(0,0,0,0.9) 100%)",
              backdropFilter: "blur(20px)",
              borderRadius: "24px",
              height: "520px",
              overflow: "hidden"
            }}
          >
            {/* 标题区域 */}
            <div style={{ 
              display: "flex", 
              flexDirection: "column",
              padding: "24px 24px 8px 24px",
              borderBottom: "1px solid rgba(80,80,80,0.3)"
            }}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div>
                  <div style={{ fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>最近活跃告警</div>
                  <div style={{ fontSize: "12px", color: "#a0a0a0" }}>实时事件监控</div>
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
                  boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                  backgroundColor: "rgba(40,40,40,0.95)",
                  border: "1px solid rgba(80,80,80,0.3)"
                }}
                popupClassName="dark-select-dropdown"
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
                          padding: "18px 24px",
                          margin: "8px 0",
                          borderRadius: "16px",
                          background: index % 2 === 0 
                            ? "linear-gradient(135deg, rgba(255, 215, 0, 0.08) 0%, rgba(255, 193, 7, 0.05) 100%)" 
                            : "linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(26, 26, 26, 0.2) 100%)",
                          backdropFilter: "blur(10px)",
                          transition: "all 0.3s ease"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateX(8px)"
                          e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.4)"
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,215,0,0.15)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateX(0)"
                          e.currentTarget.style.borderColor = "rgba(255, 215, 0, 0.2)"
                          e.currentTarget.style.boxShadow = "none"
                        }}
                      >
                        <div style={{ width: "100%" }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: "10px" }}>
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
                                color: '#ffffff', 
                                textDecoration: 'none',
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '400',
                                transition: 'color 0.2s',
                                display: "block",
                                lineHeight: "1.4"
                              }}
                              onMouseEnter={(e) => e.target.style.color = '#FF9900'}
                              onMouseLeave={(e) => e.target.style.color = '#ffffff'}
                            >
                              {item.ruleName}
                            </a>
                            <div style={{ display: "flex", alignItems: "center", color: "#a0a0a0", fontSize: "10px" }}>
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
                    borderRadius: "16px",
                    background: "rgba(255,215,0,0.02)",
                  }}>
                    <Empty 
                      image={Empty.PRESENTED_IMAGE_SIMPLE} 
                      description={
                        <span style={{ color: "rgba(255,215,0,0.7)" }}>
                          暂无告警数据
                        </span>
                      }
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
    </div>
  )
}
