"use client"
import { updateCalendar } from "../../../api/duty"
import {Modal, Form, Button, message, Select, Typography} from "antd"
import React, { useState, useEffect } from "react"
import {getUserList} from "../../../api/user";

export const UpdateCalendarModal = ({ visible, onClose, time, tenantId, dutyId, date, currentDutyUsers, onSuccess }) => {
    const { Option } = Select
    const [form] = Form.useForm() // 使用 Ant Design 的 form hook 来设置表单值
    const [selectedUsersForUpdate, setSelectedUsersForUpdate] = useState([]) // 存储选中的用户对象 { username, userid }
    const [filteredOptions, setFilteredOptions] = useState([]) // 搜索框可用的用户列表

    // Modal 打开时加载数据并初始化表单
    useEffect(() => {
        if (visible && currentDutyUsers) {
            // currentDutyData.userGroup 预期是 `[][]DutyUser`
            // 我们假设更新操作是针对该日期第一个（或唯一一个）值班组
            const currentUsers =
                currentDutyUsers && currentDutyUsers.length > 0 && Array.isArray(currentDutyUsers[0])
                    ? currentDutyUsers[0]
                    : []

            setSelectedUsersForUpdate(currentUsers)

            // 为 Ant Design 的 Select 组件设置初始值
            // Select 在 multiple 模式下期望一个键数组作为值
            form.setFieldsValue({
                dutyUser: currentUsers.map((user) => user.userid), // 将用户对象映射为 userid 数组
            })
            handleSearchDutyUser() // 模态框打开时获取所有用户列表
        } else if (!visible) {
            // 模态框关闭时重置状态
            setSelectedUsersForUpdate([])
            setFilteredOptions([])
            form.resetFields() // 清空表单字段
        }
    }, [visible, currentDutyUsers, form]) // 依赖 visible, currentDutyData 和 form 实例

    // 处理 Select 框选择变化
    const handleSelectChange = (value, options) => {
        // 'value' 是一个包含选中 Option value (这里是 userid) 的数组
        // 'options' 是一个包含选中 Option 对象 (包含 key, value, children, userid 等) 的数组
        const newSelectedUsers = options.map((option) => ({
            username: option.children, // 假设 username 在 children 中
            userid: option.key, // 假设 userid 在 key 中
        }))
        setSelectedUsersForUpdate(newSelectedUsers)
    }

    // 获取所有可选择的用户列表
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
            message.error("获取用户列表失败")
        }
    }

    // 提交表单数据到后端
    const handleFormSubmit = async () => {
        const currentSelectedCount = selectedUsersForUpdate.length

        if (currentSelectedCount !== currentDutyUsers.length) {
            message.error("请选择值班人员。")
            return
        }

        // 构建后端数据结构
        const calendarData = {
            tenantId: tenantId,
            dutyId: dutyId,
            time: date,
            users: selectedUsersForUpdate,
            status: "Temporary"
        }

        try {
            await updateCalendar(calendarData)
            message.success("值班人员更新成功！")
            onClose()
            if (onSuccess) {
                onSuccess()
            }
        } catch (error) {
            console.error("更新失败:", error)
            message.error("更新值班人员失败。")
        }
    }

    return (
        <Modal visible={visible} onCancel={onClose} footer={null} style={{ marginTop: "20vh" }}>
            <div>调整值班人员, 当前值班日期: {time}</div>
            <Form form={form} layout="vertical">
                {" "}
                {/* 关联表单实例 */}
                <Form.Item
                    name="dutyUser"
                    // 根据初始人数动态显示提示
                    label={`值班人员 (当前${currentDutyUsers?.length ? currentDutyUsers?.length : 0}人，请更新为${currentDutyUsers?.length ? currentDutyUsers?.length : 0}人)`}
                    rules={[
                        {
                            required: true,
                            message: "请选择值班人员",
                        },
                        // 其他校验逻辑已在 handleFormSubmit 中处理
                    ]}
                    style={{ marginTop: "20px" }}
                >
                    <Typography.Text type="secondary" style={{marginTop: '5px', fontSize: '12px'}}>
                        {"更新某一天的值班组，则称为临时调班，不在发布日程的用户列表内体现。"}
                    </Typography.Text>
                    <Select
                        mode="multiple"
                        showSearch
                        placeholder="Select person(s)"
                        optionFilterProp="children"
                        onChange={handleSelectChange}
                        onFocus={handleSearchDutyUser}
                        style={{
                            width: "100%",
                        }}
                         value={selectedUsersForUpdate.map((user) => user.userid)}
                    >
                        {filteredOptions.map((item) => (
                             <Option key={item.userid} value={item.userid} disabled={selectedUsersForUpdate?.length === currentDutyUsers?.length}>
                                {item.username}
                            </Option>
                        ))}
                    </Select>
                </Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    onClick={handleFormSubmit}
                    style={{
                        backgroundColor: "#000000",
                        width: "100%", // 按钮宽度占满
                    }}
                >
                    提交
                </Button>
            </Form>
        </Modal>
    )
}
