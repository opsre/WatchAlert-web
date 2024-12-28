import { updateCalendar } from '../../../api/duty'
import { getAllUsers } from '../../../api/other.jsx'
import { Modal, Form, Button, message, Select } from 'antd'
import React, { useState } from 'react'

export const UpdateCalendarModal = ({ visible, onClose, time, tenantId, dutyId, date }) => {
    const { Option } = Select
    const [selectedItems, setSelectedItems] = useState([])
    const [filteredOptions, setFilteredOptions] = useState([])

    const handleSelectChange = (_, value) => {
        setSelectedItems(value)
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

    const handleUpdate = async (data) => {
        try {
            await updateCalendar(data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleFormSubmit = async () => {

        const calendarData = {
            tenantId: tenantId,
            dutyId: dutyId,
            time: date,
            userid: selectedItems.userid,
            username: selectedItems.value,
        }

        await handleUpdate(calendarData)

        // 关闭弹窗
        onClose()

    }

    return (
        <Modal visible={visible} onCancel={onClose} footer={null} style={{ marginTop: '20vh' }}>

            <div>
                调整值班人员, 当前值班日期: {time}
            </div>

            <Form.Item
                name="dutyUser"
                label="值班人员"
                rules={[
                    {
                        required: true,
                    },
                ]}
                style={{ marginTop: '20px' }}
            >
                <Select
                    showSearch
                    placeholder="Select a person"
                    optionFilterProp="children"
                    onChange={handleSelectChange}
                    onClick={handleSearchDutyUser}
                    style={{
                        width: '100%',
                    }}
                >
                    {filteredOptions.map((item) => (
                        <Option key={item.username} value={item.username} userid={item.userid}>
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
                    backgroundColor: '#000000'
                }}
            >
                提交
            </Button>

        </Modal>
    )
}