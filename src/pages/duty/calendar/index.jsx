"use client"

import { Calendar, Button, message, Spin } from "antd"
import { useState, useEffect, useCallback } from "react"
import {CalendarIcon, Plus, Users} from "lucide-react"
import { UpdateCalendarModal } from "./UpdateCalendar"
import { searchCalendar } from "../../../api/duty"
import { useParams } from "react-router-dom"
import {CreateCalendarModal} from "./CreateCalendar";

export const fetchDutyData = async (dutyId, year, month) => {
    try {
        const params = {
            dutyId: dutyId,
            ...(year &&
                month && {
                    year,
                    month: month + 1,
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
        const handleResize = () => setHeight(window.innerHeight)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
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
                        ? "bg-gray-50 hover:bg-gray-100 hover:shadow-md"
                        : "bg-white hover:shadow-sm"}
                  `}
            >
                <div>
                    <div className={`text-xs font-medium ${isToday ? "text-white" : "text-gray-500"}`}>
                        {dateFullCellRender(value)}
                    </div>

                    {matchingDutyData && (
                        <div
                            className={`
                                inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                                ${isToday ? "bg-white text-black" : "bg-black text-white"}
                            `}
                            style={{ marginTop: "10px" }}
                        >
                            <Users size={10}/>
                            {/* 遍历组内人员并显示他们的用户名 */}
                            <span>
                                {matchingDutyData.users.map((user, userIndex) => (
                                    <span key={user.userid}>
                                    <div>
                                        {user.username}
                                    </div>
                                  </span>
                                ))}
                            </span>
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

                    <Button
                        type="primary"
                        size="default"
                        style={{ backgroundColor: '#000000' }}
                        onClick={() => setCreateCalendarModal(true)}
                    >
                        发布日程
                    </Button>
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
