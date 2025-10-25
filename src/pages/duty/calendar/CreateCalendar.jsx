"use client"

import { useEffect, useState } from "react"
import { Form, Modal, DatePicker, Select, Button, List, Avatar, Space, Drawer, Input, InputNumber, message } from "antd"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import { PlusOutlined, DeleteOutlined, MenuOutlined } from "@ant-design/icons"
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
    
    // 定义值班组的颜色列表
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
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                const loadedGroups = res.data
                    .filter((userList) => Array.isArray(userList)) // 确保每个 userList 都是数组
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
            const options = res.data.map((item) => ({
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
                <Button type="dashed" onClick={handleAddGroup} style={{ marginBottom: 16 }}>
                    + 添加值班组
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
                                                    padding: "16px",
                                                    paddingLeft: "24px",
                                                    marginBottom: "16px",
                                                    border: "1px solid #e0e0e0",
                                                    borderRadius: "8px",
                                                    backgroundColor: "#f9f9f9",
                                                    overflow: "hidden",
                                                    ...providedGroup.draggableProps.style,
                                                }}
                                            >
                                                {/* 左侧颜色条 */}
                                                <div style={{ 
                                                    position: "absolute",
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: "6px", 
                                                    backgroundColor: group.color,
                                                }} />
                                                <Space style={{ width: "100%", justifyContent: "space-between", marginBottom: "12px" }}>
                                                  <span {...providedGroup.dragHandleProps} style={{ cursor: "move" }}>
                                                    <MenuOutlined />
                                                  </span>
                                                    <div style={{ flex: 1 }} />
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleDeleteGroup(groupIndex)}
                                                    />
                                                </Space>
                                                <Button
                                                    type="dashed"
                                                    onClick={() => {
                                                        handleSearchDutyUser()
                                                        setCurrentGroupIndexForUserSelection(groupIndex) // 设置当前要添加人员的组索引
                                                        setSearchVisible(true)
                                                    }}
                                                    style={{ marginBottom: 12, width: "100%" }}
                                                    disabled={group.users.length >= 2} // 当成员数达到2时禁用按钮
                                                >
                                                    + 添加组内人员
                                                </Button>
                                                <Droppable droppableId={group.id} type="users">
                                                    {/* 内层 Droppable 用于组内人员排序 */}
                                                    {(providedUsers) => (
                                                        <div {...providedUsers.droppableProps} ref={providedUsers.innerRef}>
                                                            {group.users.map((user, userIndex) => (
                                                                <Draggable key={user.userid} draggableId={user.userid} index={userIndex}>
                                                                    {(providedUser) => (
                                                                        <div
                                                                            ref={providedUser.innerRef}
                                                                            {...providedUser.draggableProps}
                                                                            style={{
                                                                                padding: "8px",
                                                                                marginBottom: "8px",
                                                                                border: "1px solid #f0f0f0",
                                                                                borderRadius: "4px",
                                                                                backgroundColor: "white",
                                                                                ...providedUser.draggableProps.style,
                                                                            }}
                                                                        >
                                                                            <Space style={{ width: "100%", justifyContent: "space-between" }}>
                                                                                <Space>
                                                                                    <span {...providedUser.dragHandleProps}>
                                                                                      <MenuOutlined />
                                                                                    </span>
                                                                                    <Avatar style={{ backgroundColor: group.color, color: "#000" }}>
                                                                                        {user.username[0]}
                                                                                    </Avatar>
                                                                                    {user.username}
                                                                                </Space>
                                                                                <Button
                                                                                    type="text"
                                                                                    danger
                                                                                    icon={<DeleteOutlined />}
                                                                                    onClick={() => handleDeleteUserFromGroup(groupIndex, userIndex)}
                                                                                />
                                                                            </Space>
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {providedUsers.placeholder}
                                                        </div>
                                                    )}
                                                </Droppable>
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
