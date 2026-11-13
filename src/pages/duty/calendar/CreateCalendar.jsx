"use client"

import { useEffect, useState } from "react"
import { Form, Modal, DatePicker, Select, Button, List, Avatar, Drawer, InputNumber, message } from "antd"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { PlusOutlined, DeleteOutlined, MenuOutlined, CloseOutlined } from "@ant-design/icons"
import { createCalendar, GetCalendarUsers } from "../../../api/duty" // 假设这些路径是正确的
import Search from "antd/es/input/Search"
import { v4 as uuidv4 } from "uuid"
import dayjs from "dayjs"
import {getUserList} from "../../../api/user";

export const CreateCalendarModal = ({ visible, onClose,onSuccess, dutyId }) => {
    const { Option } = Select
    const [form] = Form.useForm()
    const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"))
    const [dutyPeriod, setDutyPeriod] = useState(1)
    const [filteredOptions, setFilteredOptions] = useState([])
    const [dateType, setDateType] = useState("day")
    // 更改为 selectedGroups，存储多个值班组
    const [selectedGroups, setSelectedGroups] = useState([])
    const [searchVisible, setSearchVisible] = useState(false)
    // 新增状态，用于记录当前正在向哪个组添加人员
    const [currentGroupIndexForUserSelection, setCurrentGroupIndexForUserSelection] = useState(null)
    
    // 定义值班组的颜色列表（与日历长条配色保持一致）
    const groupColors = [
        "#34C724", // 绿色
        "#FFC60A", // 黄色
        "#00D0D6", // 青色
        "#7B61FF", // 紫色
        "#FF7A9E", // 粉色
        "#2E90FA", // 蓝色
        "#FF6B6B", // 珊瑚红
        "#F08626", // 橙色
    ]

    useEffect(() => {
        if (visible) {
            const date =dayjs().format("YYYY-MM")
            form.setFieldsValue({
                "year-month": dayjs(date),
            })
            handleGetCalendarUsers()
            setDutyPeriod(1)
            setDateType("week")
        }
    }, [visible])

    const handleGetCalendarUsers = async () => {
        try {
            const params = {
                dutyId: dutyId,
            }
            const res = await GetCalendarUsers(params)

            // 假设 res.data 是 [][]DutyUser 结构
            if (res?.data && Array.isArray(res?.data) && res?.data?.length > 0) {
                const loadedGroups = res?.data
                    ?.filter((userList) => Array.isArray(userList)) // 确保每个 userList 都是数组
                    .map((userList, index) => {
                        // 根据组内第一个用户的userid生成稳定的颜色索引
                        let colorIndex = index
                        if (userList.length > 0 && userList[0].userid) {
                            const firstUserId = userList[0].userid
                            const hashCode = firstUserId.split('').reduce((acc, char) => {
                                return acc + char.charCodeAt(0)
                            }, 0)
                            colorIndex = hashCode % groupColors.length
                        }
                        return {
                            id: uuidv4(), // 为每个加载的组生成唯一ID
                            color: groupColors[colorIndex], // 为每个组分配颜色
                            users: userList, // 此时 userList 已经保证是数组了
                        }
                    })
                setSelectedGroups(loadedGroups)
            } else {
                // 如果没有返回组数据，则初始化一个空的默认组
                setSelectedGroups([{ id: uuidv4(), color: groupColors[0], users: [] }])
            }
        } catch (error) {
            console.error(error)
            // 错误时也回退到初始化一个空的默认组
            setSelectedGroups([{ id: uuidv4(), name: "值班 1 组", users: [] }])
        }
    }

    const onChangeDate = (date, dateString) => {
        setSelectedMonth(dateString)
    }

    const handleDutyPeriodChange = (value) => {
        setDutyPeriod(value || 1)
    }

    const handleFormSubmit = async (data) => {
        try {
            await createCalendar(data)
        } catch (error) {
            console.error(error)
        }
        onClose()
        onSuccess()
    }

    const handleSearchDutyUser = async () => {
        try {
            const params = {
                joinDuty: "true",
            }
            const res = await getUserList(params)
            const options = res?.data?.map((item) => ({
                username: item.username,
                userid: item.userid,
            }))
            setFilteredOptions(options)
        } catch (error) {
            console.error(error)
        }
    }

    const onSearchDutyUser = (query) => {
        if (!query || typeof query !== "string") {
            handleSearchDutyUser() // 如果查询为空，重新加载所有用户
            return
        }
        const filtered = filteredOptions.filter((item) => item.username.toLowerCase().includes(query.toLowerCase()))
        setFilteredOptions(filtered)
    }

    const handleAddUserToGroup = (user) => {
        if (currentGroupIndexForUserSelection !== null) {
            const newGroups = [...selectedGroups]
            const currentGroup = newGroups[currentGroupIndexForUserSelection]
            // 检查用户是否已存在于当前组中
            if (!currentGroup.users.some((u) => u.userid === user.userid)) {
                currentGroup.users.push(user)
                setSelectedGroups(newGroups)
            }
        }
        setSearchVisible(false)
        setCurrentGroupIndexForUserSelection(null) // 添加完成后重置索引
    }

    const handleAddGroup = () => {
        const newColor = groupColors[selectedGroups.length % groupColors.length]
        setSelectedGroups([...selectedGroups, { id: uuidv4(), color: newColor, users: [] }])
    }

    const handleDeleteGroup = (groupIndex) => {
        const newGroups = selectedGroups.filter((_, idx) => idx !== groupIndex)
        setSelectedGroups(newGroups)
    }

    const handleDeleteUserFromGroup = (groupIndex, userIndex) => {
        const newGroups = [...selectedGroups]
        newGroups[groupIndex].users = newGroups[groupIndex].users.filter((_, idx) => idx !== userIndex)
        setSelectedGroups(newGroups)
    }

    const handleDragEnd = (result) => {
        const { source, destination, type } = result

        if (!destination) return

        // 组的排序
        if (type === "groups") {
            const items = Array.from(selectedGroups)
            const [reorderedItem] = items.splice(source.index, 1)
            items.splice(destination.index, 0, reorderedItem)
            setSelectedGroups(items)
        }

        // 组内人员的排序或跨组移动
        if (type === "users") {
            const sourceGroupId = source.droppableId
            const destinationGroupId = destination.droppableId

            const sourceGroupIndex = selectedGroups.findIndex((group) => group.id === sourceGroupId)
            const destinationGroupIndex = selectedGroups.findIndex((group) => group.id === destinationGroupId)

            if (sourceGroupIndex === -1 || destinationGroupIndex === -1) return

            const newGroups = [...selectedGroups]

            // 在同一个组内移动
            if (sourceGroupId === destinationGroupId) {
                const users = Array.from(newGroups[sourceGroupIndex].users)
                const [reorderedUser] = users.splice(source.index, 1)
                users.splice(destination.index, 0, reorderedUser)
                newGroups[sourceGroupIndex].users = users
                setSelectedGroups(newGroups)
            } else {
                // 跨组移动
                const sourceUsers = Array.from(newGroups[sourceGroupIndex].users)
                const destinationUsers = Array.from(newGroups[destinationGroupIndex].users)
                const [movedUser] = sourceUsers.splice(source.index, 1)
                destinationUsers.splice(destination.index, 0, movedUser)

                newGroups[sourceGroupIndex].users = sourceUsers
                newGroups[destinationGroupIndex].users = destinationUsers
                setSelectedGroups(newGroups)
            }
        }
    }

    const DutyUserGroupList = () => (
        <Form.Item name="dutyUserGroups" rules={[{ required: true, message: "请至少添加一个值班组" }]}>
            <div>
                <Button type="dashed" onClick={handleAddGroup} icon={<PlusOutlined />} style={{ marginBottom: 16 }}>
                    添加值班组
                </Button>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="all-groups" type="groups">
                        {/* 外层 Droppable 用于组排序 */}
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {selectedGroups.map((group, groupIndex) => (
                                    <Draggable key={group.id} draggableId={group.id} index={groupIndex}>
                                        {(providedGroup) => (
                                            <div
                                                ref={providedGroup.innerRef}
                                                {...providedGroup.draggableProps}
                                                style={{
                                                    position: "relative",
                                                    padding: "14px 16px 14px 20px",
                                                    marginBottom: 16,
                                                    border: "1px solid #e8e8e8",
                                                    borderRadius: 10,
                                                    backgroundColor: "#fff",
                                                    overflow: "hidden",
                                                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                                                    ...providedGroup.draggableProps.style,
                                                }}
                                            >
                                                <div/>
                                                {/* 组头部：拖拽手柄 + 组名 + 人数 + 删除 */}
                                                <div className="flex items-center gap-2" style={{ marginBottom: 12 }}>
                                                    <span
                                                        {...providedGroup.dragHandleProps}
                                                        style={{ cursor: "grab", color: "#999", fontSize: 14 }}
                                                    >
                                                        <MenuOutlined />
                                                    </span>
                                                    <span className="text-sm font-semibold text-gray-800">
                                                        值班组 {groupIndex + 1}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {group.users.length} 人
                                                    </span>
                                                    <div style={{ flex: 1 }} />
                                                    <Button
                                                        type="text"
                                                        danger
                                                        size="small"
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleDeleteGroup(groupIndex)}
                                                    />
                                                </div>
                                                {/* 成员标签（可横向拖拽排序 / 跨组移动） */}
                                                <Droppable droppableId={group.id} type="users" direction="horizontal">
                                                    {(providedUsers) => (
                                                        <div
                                                            {...providedUsers.droppableProps}
                                                            ref={providedUsers.innerRef}
                                                            className="flex flex-wrap items-center"
                                                            style={{ gap: 8, minHeight: 32 }}
                                                        >
                                                            {group.users.map((user, userIndex) => (
                                                                <Draggable
                                                                    key={user.userid}
                                                                    draggableId={user.userid}
                                                                    index={userIndex}
                                                                >
                                                                    {(providedUser) => (
                                                                        <span
                                                                            ref={providedUser.innerRef}
                                                                            {...providedUser.draggableProps}
                                                                            {...providedUser.dragHandleProps}
                                                                            style={{
                                                                                display: "inline-flex",
                                                                                alignItems: "center",
                                                                                gap: 6,
                                                                                padding: "4px 12px",
                                                                                borderRadius: 999,
                                                                                backgroundColor: group.color,
                                                                                color: "#fff",
                                                                                fontSize: 13,
                                                                                fontWeight: 500,
                                                                                cursor: "grab",
                                                                                userSelect: "none",
                                                                                boxShadow: "0 1px 2px rgba(0,0,0,0.08)",
                                                                                ...providedUser.draggableProps.style,
                                                                            }}
                                                                        >
                                                                            {user.username}
                                                                            <CloseOutlined
                                                                                style={{ fontSize: 11, opacity: 0.85, cursor: "pointer" }}
                                                                                onClick={() =>
                                                                                    handleDeleteUserFromGroup(groupIndex, userIndex)
                                                                                }
                                                                            />
                                                                        </span>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {providedUsers.placeholder}
                                                            <Button
                                                                type="dashed"
                                                                size="small"
                                                                icon={<PlusOutlined />}
                                                                onClick={() => {
                                                                    handleSearchDutyUser()
                                                                    setCurrentGroupIndexForUserSelection(groupIndex)
                                                                    setSearchVisible(true)
                                                                }}
                                                                disabled={group.users.length >= 8} // 当成员数达到8时禁用按钮
                                                            >
                                                                添加人员
                                                            </Button>
                                                        </div>
                                                    )}
                                                </Droppable>
                                                {group.users.length === 0 && (
                                                    <div className="text-xs text-gray-400" style={{ marginTop: 8 }}>
                                                        点击「添加人员」选择值班成员（最多 8 人）
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </Form.Item>
    )

    const generateCalendar = () => {
        if (selectedMonth && dutyPeriod && selectedGroups.length > 0) {
            // 校验每个组是否至少有一个用户
            const allGroupsHaveUsers = selectedGroups.every((group) => group.users.length > 0)
            if (!allGroupsHaveUsers) {
                message.error("每个值班组至少需要一名值班人员")
                return
            }

            // 将 selectedGroups 转换为后端期望的 [][]DutyUser 格式
            const userGroupData = selectedGroups.map((group) => group.users)

            const calendarData = {
                dutyId: dutyId,
                month: selectedMonth,
                dutyPeriod: dutyPeriod,
                dateType: dateType,
                userGroup: userGroupData,
                status: "Formal",
            }
            handleFormSubmit(calendarData)
            form.resetFields()
        } else {
            message.error("请填写所有必填项并至少添加一个值班组")
        }
    }

    return (
        <Drawer title="发布日程" open={visible} onClose={onClose} size="large">
            <Form form={form} layout="vertical">
                {/* 添加 form prop */}
                <Form.Item
                    name="year-month"
                    label="选择月份"
                    rules={[
                        {
                            required: true,
                            message: "请选择月份",
                        },
                    ]}
                    value={selectedMonth ? dayjs(selectedMonth) : null}
                    onChange={(date, dateString) => onChangeDate(date, dateString)}
                >
                    <DatePicker onChange={onChangeDate} picker="month" style={{ width: "100%" }} />
                </Form.Item>
                <Form.Item
                    name="dutyPeriod"
                    label="每组持续"
                    rules={[
                        {
                            required: true,
                            message: "请输入持续天数/周数",
                        },
                    ]}
                    initialValue={1} // 设置初始值
                >
                    <InputNumber
                        style={{ width: "100%" }}
                        placeholder="1"
                        min={1}
                        onChange={handleDutyPeriodChange}
                        addonAfter={
                            <Select onChange={setDateType} value={dateType}>
                                <Option value="day">{"天"}</Option>
                                <Option value="week">{"周"}</Option>
                                <Option value="month">{"月"}</Option>
                                <Option value="year">{"年"}</Option>
                            </Select>
                        }
                    />
                </Form.Item>
                <DutyUserGroupList /> {/* 使用新的组件 */}
            </Form>
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "16px 0" }}>
                <Button
                    type="primary"
                    onClick={generateCalendar}
                    style={{
                        backgroundColor: "#000000",
                    }}
                >
                    提交
                </Button>
            </div>
            <Modal
                title="选择值班人员"
                open={searchVisible}
                onCancel={() => {
                    setSearchVisible(false)
                    setCurrentGroupIndexForUserSelection(null) // 取消时重置组索引
                }}
                footer={null}
                styles={{ body: { maxHeight: "calc(100vh - 300px)", overflowY: "auto" } }}
            >
                <Search
                    placeholder="搜索值班人员"
                    onSearch={onSearchDutyUser}
                    onChange={(e) => onSearchDutyUser(e.target.value)} // 允许实时搜索
                    style={{ marginBottom: 16 }}
                />
                <List
                    dataSource={filteredOptions.filter((option) => {
                        // 过滤掉已在当前编辑组中的用户
                        if (currentGroupIndexForUserSelection !== null) {
                            return !selectedGroups[currentGroupIndexForUserSelection].users.some(
                                (user) => user.userid === option.userid,
                            )
                        }
                        return true // 如果没有指定组，则不进行过滤
                    })}
                    renderItem={(item) => (
                        <List.Item onClick={() => handleAddUserToGroup(item)} style={{ cursor: "pointer" }}>
                            <List.Item.Meta avatar={<Avatar>{item.username[0]}</Avatar>} title={item.username} />
                        </List.Item>
                    )}
                />
            </Modal>
        </Drawer>
    )
}
