import React, {useEffect, useState} from 'react'
import {Form, Modal, DatePicker, Select, Button, List, Avatar, Space, Drawer, Input, InputNumber} from 'antd'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { PlusOutlined, DeleteOutlined, MenuOutlined } from '@ant-design/icons'
import { getAllUsers } from '../../../api/other.jsx'
import {createCalendar, GetCalendarUsers} from '../../../api/duty'
import Search from "antd/es/input/Search";

export const CreateCalendarModal = ({ visible, onClose, dutyId }) => {
    const { Option } = Select
    const [form] = Form.useForm()
    const [selectedMonth, setSelectedMonth] = useState(null)
    const [dutyPeriod, setDutyPeriod] = useState(1)
    const [filteredOptions, setFilteredOptions] = useState([])
    const [dateType, setDateType] = useState('day')
    const [selectedUsers, setSelectedUsers] = useState([])
    const [searchVisible, setSearchVisible] = useState(false)

    useEffect(() => {
        handleGetCalendarUsers()
    }, [visible])

    const handleGetCalendarUsers = async ()  =>{
        try {
            const params = {
                dutyId: dutyId
            }
            const res = await GetCalendarUsers(params)
            setSelectedUsers(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    const onChangeDate = (date, dateString) => {
        setSelectedMonth(dateString)
    }

    const handleDutyPeriodChange = (value) => {
        setDutyPeriod(value)
    }

    const handleFormSubmit = async (data) => {
        try {
            await createCalendar(data)
        } catch (error) {
            console.error(error)
        }
        onClose()
    }

    const handleSearchDutyUser = async () => {
        try {
            const params = {
                "joinDuty": "true"
            }
            const res = await getAllUsers(params)
            const options = res.data.map((item) => ({
                username: item.username,
                userid: item.userid
            }))
            setFilteredOptions(options)
        } catch (error) {
            console.error(error)
        }
    }

    const onSearchDutyUser = (query) =>{
        // 确保 query 是一个有效的字符串
        if (!query || typeof query !== "string") {
            handleSearchDutyUser()
            return;
        }

        // 过滤 filteredOptions
        const filtered = filteredOptions.filter((item) =>
            item.username.toLowerCase().includes(query.toLowerCase())
        );

        // 更新过滤后的结果
        setFilteredOptions(filtered);
    }

    const handleDragEnd = (result) => {
        if (!result.destination) return

        const items = Array.from(selectedUsers)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        setSelectedUsers(items)
    }

    const handleDeleteUser = (index) => {
        const newUsers = selectedUsers.filter((_, idx) => idx !== index)
        setSelectedUsers(newUsers)
    }

    const SelectUserModal = () => (
        <Modal
            title="选择值班人员"
            visible={searchVisible}
            onCancel={() => setSearchVisible(false)}
            footer={null}
            styles={{ body: { maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' } }}
        >
            <Search
                placeholder="搜索值班人员"
                onSearch={onSearchDutyUser}
            />
            <List
                dataSource={filteredOptions.filter(
                    option => !selectedUsers.find(user => user.userid === option.userid)
                )}
                renderItem={item => (
                    <List.Item
                        onClick={() => {
                            setSelectedUsers([...selectedUsers, item])
                            setSearchVisible(false)
                        }}
                        style={{ cursor: 'pointer' }}
                    >
                        <List.Item.Meta
                            avatar={<Avatar>{item.username[0]}</Avatar>}
                            title={item.username}
                        />
                    </List.Item>
                )}
            />
        </Modal>
    )

    const DutyUserList = () => (
        <Form.Item
            name="dutyUser"
            label="值班人员"
            rules={[{ required: true, message: '请选择值班人员' }]}
        >
            <div>
                <Button
                    type="dashed"
                    onClick={() => {
                        handleSearchDutyUser()
                        setSearchVisible(true)
                    }}
                    style={{ marginBottom: 16 }}
                >
                    <PlusOutlined /> 添加值班人员
                </Button>

                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="dutyUsers">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                                {selectedUsers.map((user, index) => (
                                    <Draggable
                                        key={user.userid}
                                        draggableId={user.userid}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                style={{
                                                    padding: '8px',
                                                    marginBottom: '8px',
                                                    border: '1px solid #f0f0f0',
                                                    borderRadius: '4px',
                                                    backgroundColor: 'white',
                                                    ...provided.draggableProps.style
                                                }}
                                            >
                                                <Space>
                                                    <span {...provided.dragHandleProps}>
                                                        <MenuOutlined />
                                                    </span>
                                                    <Avatar>{user.username[0]}</Avatar>
                                                    {user.username}
                                                    <Button
                                                        type="text"
                                                        danger
                                                        icon={<DeleteOutlined />}
                                                        onClick={() => handleDeleteUser(index)}
                                                    />
                                                </Space>
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
        if (selectedMonth && dutyPeriod && selectedUsers.length > 0) {
            const calendarData = {
                dutyId: dutyId,
                month: selectedMonth,
                dutyPeriod: dutyPeriod,
                dateType: dateType,
                users: selectedUsers.map((user) => ({
                    username: user.username,
                    userid: user.userid
                })),
            }

            handleFormSubmit(calendarData)

            form.resetFields()
        }
    }

    return (
        <Drawer title="发布日程" open={visible} onClose={onClose} size='large'>
            <Form>
                <Form.Item
                    name="year-month"
                    label="选择月份"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <DatePicker onChange={onChangeDate} picker="month" style={{ width: '100%' }} />
                </Form.Item>

                <Form.Item
                    name="dutyPeriod"
                    label="每人持续"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <InputNumber
                        style={{ width: '100%' }}
                        placeholder="1"
                        min={1}
                        onChange={handleDutyPeriodChange}
                        addonAfter={
                            <Select onChange={setDateType} value={dateType?dateType:'day'}>
                                <Option value="day">{'天'}</Option>
                                <Option value="week">{'周'}</Option>
                            </Select>
                        }
                    />
                </Form.Item>

                <DutyUserList />
            </Form>

            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <Button
                    type="primary"
                    onClick={generateCalendar}
                    style={{
                        backgroundColor: '#000000'
                    }}
                >
                    提交
                </Button>
            </div>
            <SelectUserModal/>
        </Drawer>
    )
}