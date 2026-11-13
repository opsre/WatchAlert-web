"use client"

import { Button, message, Spin, Tooltip } from "antd"
import React, { useState, useEffect, useCallback, useMemo } from "react"
import { CalendarIcon } from "lucide-react"
import { UpdateCalendarModal } from "./UpdateCalendar"
import { searchCalendar } from "../../../api/duty"
import { useParams } from "react-router-dom"
import { CreateCalendarModal } from "./CreateCalendar"
import { PlusOutlined, ReloadOutlined, LeftOutlined, RightOutlined } from "@ant-design/icons"
import { Breadcrumb } from "../../../components/Breadcrumb"
import dayjs from "dayjs"


export const fetchDutyData = async (dutyId, year, month) => {
    try {
        const params = {
            dutyId: dutyId,
            ...(year &&
                month && {
                    time: year+"-"+(month + 1),
                }),
        }
        const res = await searchCalendar(params)
        return res?.data
    } catch (error) {
        console.error(error)
        message.error("获取日程数据失败")
        return []
    }
}

// 值班长条配色（按值班组顺序分配，鲜亮色系）
const barColors = [
    "#34C724", // 绿色
    "#FFC60A", // 黄色
    "#00D0D6", // 青色
    "#7B61FF", // 紫色
    "#FF7A9E", // 粉色
    "#2E90FA", // 蓝色
    "#FF6B6B", // 珊瑚红
    "#F08626", // 橙色
]

const BAR_HEIGHT = 26      // 长条高度
const BAR_LANE_GAP = 8     // 同一周行内多条长条的垂直间距
const DATE_HEADER_H = 30   // 日期数字行高度

/**
 * 将逐日排班记录聚合为连续班次区间（segment）
 * 输入: [{ time, users: DutyUser[] | DutyUser[][], status }]，按天一条
 * 输出: [{ lane, start: dayjs, end: dayjs, users, statuses }]，相邻且值班人员相同的天合并为一条
 */
const buildSegments = (records) => {
    const list = (records || [])
        .map((item) => ({ ...item, day: dayjs(item.time) }))
        .filter((item) => item.day.isValid())
        .sort((a, b) => a.day.valueOf() - b.day.valueOf())

    // 展开为每天每组的结构: [{ day, lane, users, status }]
    const dayGroups = []
    list.forEach((item) => {
        if (Array.isArray(item.users) && item.users.length > 0 && Array.isArray(item.users[0])) {
            // 多组结构: [][]DutyUser
            item.users.forEach((group, lane) => {
                if (Array.isArray(group) && group.length > 0) {
                    dayGroups.push({ day: item.day, lane, users: group, status: item.status })
                }
            })
        } else if (Array.isArray(item.users) && item.users.length > 0) {
            // 单组结构: []DutyUser
            dayGroups.push({ day: item.day, lane: 0, users: item.users, status: item.status })
        }
    })

    const segments = []
    const openByLane = {} // lane -> 正在延长的 segment

    dayGroups.forEach(({ day, lane, users, status }) => {
        const key = JSON.stringify(users.map((u) => u.userid))

        // 当天未出现的 lane，关闭其延伸中的 segment
        Object.keys(openByLane).forEach((laneStr) => {
            if (!dayGroups.some((g) => g.day.isSame(day, "day") && g.lane === Number(laneStr))) {
                delete openByLane[laneStr]
            }
        })

        const open = openByLane[lane]
        const isConsecutive =
            open &&
            open.key === key &&
            day.diff(open.end, "day") === 1

        if (isConsecutive) {
            open.end = day
            if (!open.statuses.includes(status)) open.statuses.push(status)
        } else {
            const seg = { lane, start: day, end: day, users, key, statuses: [status] }
            segments.push(seg)
            openByLane[lane] = seg
        }
    })

    return segments
}

export const CalendarApp = ({ tenantId }) => {
    const url = new URL(window.location)
    const calendarName = url.searchParams.get("calendarName")
    const { id } = useParams()
    const [dutyData, setDutyData] = useState([])
    const [createCalendarModal, setCreateCalendarModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null)
    const [modalVisible, setModalVisible] = useState(false)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth()) // 0 基
    const [loading, setLoading] = useState(false)
    const [selectedDayDutyUsers, setSelectedDayDutyUsers] = useState(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchDutyData(id, currentYear, currentMonth)
            setDutyData(data || [])
        } catch (error) {
            console.error("Error:", error)
            message.error("加载数据失败")
        } finally {
            setLoading(false)
        }
    }, [id, currentYear, currentMonth])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    // 将当月逐日数据聚合为跨天班次区间
    const segments = useMemo(() => {
        const segs = buildSegments(dutyData)
        // 按"值班组身份"（人员组合 key）首次出现的顺序分配稳定颜色索引，
        // 避免单组结构下所有区间都是同一颜色
        const keyOrder = []
        segs.forEach((s) => {
            if (!keyOrder.includes(s.key)) keyOrder.push(s.key)
        })
        segs.forEach((s) => {
            s.colorIndex = keyOrder.indexOf(s.key)
        })
        return segs
    }, [dutyData])

    // 构造月历网格（周一起始），并补齐前后月占位
    const weeks = useMemo(() => {
        const monthStart = dayjs(`${currentYear}-${currentMonth + 1}-01`)
        const firstOffset = (monthStart.day() + 6) % 7 // 周一为第一列
        const gridStart = monthStart.subtract(firstOffset, "day")
        const totalCells = firstOffset + monthStart.daysInMonth()
        const trailing = (7 - (totalCells % 7)) % 7
        const days = Array.from({ length: totalCells + trailing }, (_, i) => gridStart.add(i, "day"))
        const result = []
        for (let i = 0; i < days.length; i += 7) {
            result.push(days.slice(i, i + 7))
        }
        return result
    }, [currentYear, currentMonth])

    const today = dayjs()

    const handleDoubleClick = (date) => {
        // 兼容旧逻辑：仅当该天有排班数据时打开临时调班弹窗
        const matchingData = dutyData.find((item) => {
            const d = dayjs(item.time)
            return d.isValid() && d.isSame(date, "day")
        })

        if (!matchingData || !matchingData.users || matchingData.users.length === 0) {
            return
        }
        setSelectedDayDutyUsers(matchingData.users)
        setSelectedDate(date.format("YYYY-M-D"))
        setModalVisible(true)
    }

    const handleBarClick = (event, segment) => {
        // 根据鼠标在长条上的横向位置换算出实际点击的日期
        // （长条覆盖 spanDays 天，均匀等分）
        try {
            const rect = event.currentTarget.getBoundingClientRect()
            const spanDays = segment.end.diff(segment.start, "day") + 1
            const offsetRatio = (event.clientX - rect.left) / rect.width
            const dayOffset = Math.max(0, Math.min(spanDays - 1, Math.floor(offsetRatio * spanDays)))
            const clickedDay = segment.start.add(dayOffset, "day")
            handleDoubleClick(clickedDay)
        } catch (e) {
            handleDoubleClick(segment.start)
        }
    }

    const prevMonth = () => {
        const d = dayjs(`${currentYear}-${currentMonth + 1}-01`).subtract(1, "month")
        setCurrentYear(d.year())
        setCurrentMonth(d.month())
    }

    const nextMonth = () => {
        const d = dayjs(`${currentYear}-${currentMonth + 1}-01`).add(1, "month")
        setCurrentYear(d.year())
        setCurrentMonth(d.month())
    }

    const goToday = () => {
        setCurrentYear(new Date().getFullYear())
        setCurrentMonth(new Date().getMonth())
    }

    const isCurrentMonth = today.year() === currentYear && today.month() === currentMonth

    // 渲染单个周行
    const renderWeekRow = (weekDays) => {
        const weekStart = weekDays[0]
        const weekEnd = weekDays[6]

        // 找出与本周有交集的班次区间
        const weekSegments = segments.filter((seg) => {
            return seg.start.isSame(weekEnd, "day") ||
                seg.end.isSame(weekStart, "day") ||
                (seg.start.isBefore(weekEnd) && seg.end.isAfter(weekStart)) ||
                seg.start.isSame(weekStart, "day") || seg.end.isSame(weekEnd, "day")
        })

        const laneCount = Math.max(1, ...weekSegments.map((s) => s.lane + 1))
        const lanesAreaH = laneCount * (BAR_HEIGHT + BAR_LANE_GAP) + 6

        return (
            <div key={weekStart.format("YYYY-MM-DD")} className="border-b border-gray-100 last:border-b-0">
                {/* 日期数字行 */}
                <div className="grid grid-cols-7">
                    {weekDays.map((d) => {
                        const inMonth = d.isSame(dayjs(`${currentYear}-${currentMonth + 1}-01`), "month")
                        const isToday = d.isSame(today, "day")
                        return (
                            <div
                                key={d.format("YYYY-MM-DD")}
                                onDoubleClick={() => inMonth && handleDoubleClick(d)}
                                className="flex items-center justify-center py-1.5 cursor-default"
                                style={{ height: DATE_HEADER_H }}
                            >
                                <span
                                    className={
                                        isToday
                                            ? "flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-semibold"
                                            : `text-xs font-medium ${inMonth ? "text-gray-700" : "text-gray-300"}`
                                    }
                                >
                                    {d.date()}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {/* 班次长条区域 */}
                <div className="relative" style={{ height: lanesAreaH }}>
                    {weekSegments.map((seg) => {
                        const clamp = (v) => Math.max(0, Math.min(6, v))
                        const startCol = clamp(seg.start.diff(weekStart, "day"))
                        const endCol = clamp(seg.end.diff(weekStart, "day"))
                        const spanDays = endCol - startCol + 1
                        const color = barColors[seg.colorIndex % barColors.length]
                        const isTemporary = seg.statuses.includes("Temporary")
                        const names = seg.users.map((u) => u.username).join("、")
                        const tooltip = `${seg.start.format("M月D日")} - ${seg.end.format("M月D日")}｜${names}${isTemporary ? "（临时调班）" : ""}`

                        return (
                            <Tooltip key={`${seg.lane}-${seg.start.format("YYYY-MM-DD")}`} title={tooltip}>
                                <div
                                    onClick={(e) => handleBarClick(e, seg)}
                                    className="absolute flex items-center px-3 cursor-pointer text-white text-xs font-medium truncate transition-all hover:opacity-90"
                                    style={{
                                        left: `calc(${(startCol / 7) * 100}% + 3px)`,
                                        width: `calc(${(spanDays / 7) * 100}% - 6px)`,
                                        top: seg.lane * (BAR_HEIGHT + BAR_LANE_GAP) + 4,
                                        height: BAR_HEIGHT,
                                        backgroundColor: color,
                                        borderRadius: 999,
                                        border: isTemporary ? "1.5px dashed rgba(255,255,255,0.9)" : "none",
                                        boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                    }}
                                >
                                    <span className="truncate">
                                        {names}
                                        {isTemporary && (
                                            <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] bg-white/25">临时</span>
                                        )}
                                    </span>
                                </div>
                            </Tooltip>
                        )
                    })}
                </div>
            </div>
        )
    }

    return (
        <div>
            <Breadcrumb items={['值班中心', '详情']} />
            <Spin spinning={loading} tip="加载中..." className="custom-spin">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-black rounded-lg">
                            <CalendarIcon className="w-6 h-6 text-white"/>
                        </div>
                        <div>
                            <p className="text-xl font-bold text-gray-900">{calendarName}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button
                            type="primary"
                            size="default"
                            onClick={fetchData}
                            icon={<ReloadOutlined />}
                            style={{ backgroundColor: '#000000' }}
                            loading={loading}
                        >
                            刷新
                        </Button>

                        <Button
                            type="primary"
                            size="default"
                            style={{ backgroundColor: '#000000' }}
                            onClick={() => setCreateCalendarModal(true)}
                            icon={<PlusOutlined />}
                        >
                            发布
                        </Button>
                    </div>
                </div>

                {/* Calendar Section */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* 月份导航 */}
                    <div className="flex items-center justify-between px-6 pt-4 pb-2">
                        <div className="flex items-center gap-2">
                            <Button type="text" size="small" icon={<LeftOutlined />} onClick={prevMonth} />
                            <span className="text-base font-semibold text-gray-900 px-2">
                                {currentYear} 年 {currentMonth + 1} 月
                            </span>
                            <Button type="text" size="small" icon={<RightOutlined />} onClick={nextMonth} />
                            {!isCurrentMonth && (
                                <Button size="small" onClick={goToday} className="ml-2">
                                    今天
                                </Button>
                            )}
                        </div>
                        <div className="text-xs text-gray-400">
                            点击具体日期可进行临时调班
                        </div>
                    </div>

                    {/* 星期表头 */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/60">
                        {["周一", "周二", "周三", "周四", "周五", "周六", "周日"].map((w) => (
                            <div key={w} className="text-center py-2 text-xs font-medium text-gray-500">
                                {w}
                            </div>
                        ))}
                    </div>

                    {/* 周行 × 班次长条 */}
                    {weeks.map((weekDays) => renderWeekRow(weekDays))}

                    {segments.length === 0 && !loading && (
                        <div className="py-10 text-center text-sm text-gray-400">
                            当月暂无排班，点击右上角「发布」生成排班计划
                        </div>
                    )}
                </div>

                {/* Modals */}
                <CreateCalendarModal
                    visible={createCalendarModal}
                    onClose={() => setCreateCalendarModal(false)}
                    dutyId={id}
                    onSuccess={fetchData}
                />

                <UpdateCalendarModal
                    visible={modalVisible}
                    onClose={() => {
                        setModalVisible(false)
                        setSelectedDayDutyUsers(null)
                    }} // Clear on close
                    onSuccess={fetchData}
                    time={selectedDate}
                    tenantId={tenantId}
                    dutyId={id}
                    date={selectedDate}
                    currentDutyUsers={selectedDayDutyUsers} // Pass the new prop
                />
            </Spin>
        </div>
    )
}
