"use client"

import { Calendar, Button, message, Spin } from "antd"
import React, { useState, useEffect, useCallback } from "react"
import {CalendarIcon, Plus, Users} from "lucide-react"
import { UpdateCalendarModal } from "./UpdateCalendar"
import { searchCalendar } from "../../../api/duty"
import { useParams } from "react-router-dom"
import {CreateCalendarModal} from "./CreateCalendar";
import {PlusOutlined, ReloadOutlined} from "@ant-design/icons";

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
        return res.data
    } catch (error) {
        console.error(error)
        message.error("获取日程数据失败")
        return []
    }
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
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
    const [height, setHeight] = useState(window.innerHeight)
    const [loading, setLoading] = useState(false)
    const [selectedDayDutyUsers, setSelectedDayDutyUsers] = useState(null)
    
    // 定义值班组的颜色列表（与 CreateCalendar 保持一致）
    const groupColors = [
        "#E3F2FD", // 浅蓝色
        "#F3E5F5", // 浅紫色
        "#E8F5E9", // 浅绿色
        "#FFF3E0", // 浅橙色
        "#FCE4EC", // 浅粉色
        "#F1F8E9", // 浅黄绿色
        "#E0F2F1", // 浅青色
        "#FBE9E7", // 浅珊瑚色
    ]

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchDutyData(id, currentYear, currentMonth)
            setDutyData(data)
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

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        // 监听窗口的resize事件
        window.addEventListener("resize", handleResize)

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    const dateCellRender = (value) => {
        const today = new Date()
        const isToday =
            value.year() === today.getFullYear() && value.month() === today.getMonth() && value.date() === today.getDate()

        const matchingDutyData = dutyData.find((item) => {
            const itemDate = new Date(item.time)
            return (
                itemDate.getFullYear() === value.year() &&
                itemDate.getMonth() === value.month() &&
                itemDate.getDate() === value.date()
            )
        })

        const hasData = !!matchingDutyData

        return (
            <div
                onDoubleClick={() => handleDoubleClick(value)}
                className={`
                    relative cursor-pointer p-2
                    ${isToday
                    ? "bg-black text-white shadow-lg"
                    : hasData
                        ? "hover:shadow-md"
                        : "bg-white hover:shadow-sm"}
                  `}
            >
                <div>
                    <div className={`text-xs font-medium ${isToday ? "text-white" : "text-gray-500"}`}>
                        {dateFullCellRender(value)}
                    </div>

                    {matchingDutyData && matchingDutyData.users && matchingDutyData.users.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                            {/* 检查是否为多组结构（二维数组）：判断第一个元素是否为数组 */}
                            {Array.isArray(matchingDutyData.users[0]) ? (
                                // 多组结构：[][]DutyUser
                                matchingDutyData.users.map((userGroup, groupIndex) => {
                                    if (Array.isArray(userGroup) && userGroup.length > 0) {
                                        const groupColor = groupColors[groupIndex % groupColors.length]
                                        return (
                                            <div
                                                key={groupIndex}
                                                style={{
                                                    position: "relative",
                                                    paddingLeft: "8px",
                                                    backgroundColor: isToday ? "rgba(255,255,255,0.1)" : "white",
                                                    borderRadius: "4px",
                                                    overflow: "hidden",
                                                }}
                                            >
                                                {/* 左侧颜色条 */}
                                                <div
                                                    style={{
                                                        position: "absolute",
                                                        left: 0,
                                                        top: 0,
                                                        bottom: 0,
                                                        width: "6px",
                                                        backgroundColor: groupColor,
                                                    }}
                                                />
                                                <div className="text-xs py-1">
                                                    {userGroup.map((user, userIndex) => (
                                                        <div
                                                            key={user.userid}
                                                            className={isToday ? "text-white" : "text-gray-700"}
                                                        >
                                                            {user.username}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                })
                            ) : (
                                // 单组结构：[]DutyUser - users直接是用户对象数组
                                (() => {
                                    // 根据第一个用户的userid生成稳定的颜色索引
                                    let colorIndex = 0
                                    if (matchingDutyData.users.length > 0 && matchingDutyData.users[0].userid) {
                                        const firstUserId = matchingDutyData.users[0].userid
                                        const hashCode = firstUserId.split('').reduce((acc, char) => {
                                            return acc + char.charCodeAt(0)
                                        }, 0)
                                        colorIndex = hashCode % groupColors.length
                                    }
                                    return (
                                        <div
                                            style={{
                                                position: "relative",
                                                paddingLeft: "8px",
                                                backgroundColor: isToday ? "rgba(255,255,255,0.1)" : "white",
                                                borderRadius: "4px",
                                                overflow: "hidden",
                                            }}
                                        >
                                            {/* 左侧颜色条 */}
                                            <div
                                                style={{
                                                    position: "absolute",
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: "6px",
                                                    backgroundColor: groupColors[colorIndex],
                                                }}
                                            />
                                            <div className="text-xs py-1">
                                                {matchingDutyData.users.map((user, userIndex) => (
                                                    <div
                                                        key={user.userid}
                                                        className={isToday ? "text-white" : "text-gray-700"}
                                                    >
                                                        {user.username}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })()
                            )}
                        </div>
                    )}

                    {hasData && (
                        <div
                            className={`
                                absolute top-1 right-1 w-2 h-2 rounded-full
                                ${isToday ? "bg-white" : "bg-black"}
                            `}
                        />
                    )}
                </div>
            </div>
        )
    }

    const handleDoubleClick = (date) => {
        if (
            !dutyData.some((item) => {
                const itemDate = new Date(item.time)
                return (
                    itemDate.getFullYear() === date.year() &&
                    itemDate.getMonth() === date.month() &&
                    itemDate.getDate() === date.date()
                )
            })
        ) {
            return
        }

        // 查找匹配当前日期的值班数据
        const matchingData = dutyData.find((item) => {
            const itemDate = new Date(item.time)
            return (
                itemDate.getFullYear() === date.year() &&
                itemDate.getMonth() === date.month() &&
                itemDate.getDate() === date.date()
            )
        })

        if (!matchingData || !matchingData.users || matchingData.users.length === 0) {
            return // If no matching data or no duty groups, do nothing
        }
        setSelectedDayDutyUsers(matchingData.users) // Store the full matching data for the modal

        const m = date.month()
        const month = m + 1
        const year = date.year()

        setSelectedDate(`${year}-${month}-${date.date()}`)
        setModalVisible(true)
    }

    const dateFullCellRender = (date) => {
        const day = date.day()
        const weekday = ["日", "一", "二", "三", "四", "五", "六"][day]
        return `周${weekday}`
    }


    const handlePanelChange = (date) => {
        const year = date.year()
        const month = date.month()
        setCurrentYear(year)
        setCurrentMonth(month)
    }

    return (
        <div>
            <Spin spinning={loading} tip="加载中..." className="custom-spin">
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
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
                <div>
                    <Calendar
                        onPanelChange={handlePanelChange}
                        cellRender={dateCellRender}
                        fullscreen={false}
                    />
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
