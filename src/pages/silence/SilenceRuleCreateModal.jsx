import { Modal, Form, Input, Button, DatePicker, Select, Space, message } from 'antd'
import React, { useState, useEffect } from 'react'
import moment from 'moment'
import { getCurEventList } from '../../api/event'
import { createSilence, updateSilence } from '../../api/silence'
const { RangePicker } = DatePicker

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// 表单
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const CreateSilenceModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const [startTimestamp, setStartTimestamp] = useState(null)
    const [endTimestamp, setEndTimestamp] = useState(null)
    const [alertFingerprint, setAlertFingerprint] = useState([])
    const [dataSourceType, setDataSourceType] = useState('')

    useEffect(() => {
        if (selectedRow) {
            form.setFieldsValue({
                datasource_type: selectedRow.datasource_type,
                fingerprint: selectedRow.fingerprint,
            })
        }
    }, [selectedRow, form])

    // 时间选择器
    const onChange = (dates, dateStrings) => {
        if (dates && dates.length === 2) {
            const startTimestamp = moment(dateStrings[0]).unix()
            const endTimestamp = moment(dateStrings[1]).unix()
        }
    }

    const onOk = (dates) => {
        if (dates && dates[0] && dates[1]) {
            const startTimestamp = dates[0].unix()
            const endTimestamp = dates[1].unix()
            setStartTimestamp(startTimestamp)
            setEndTimestamp(endTimestamp)
        }
    }
    // ---

    // 获取当前告警
    const handleSearchCurAlert = async () => {
        try {
            const params = {
                dsType: dataSourceType,
            }
            const res = await getCurEventList(params)
            const options = res.data.map((item) => ({ label: item.fingerprint, value: item.fingerprint }))
            setAlertFingerprint(options)
        } catch (error) {
            console.error(error)
        }
    }

    const onClickToDsType = async (value) => {
        setDataSourceType(value)
    }

    // 创建
    const handleCreate = async (data) => {
        try {
            await createSilence(data)
            if (type !== "createForCurEvent") {
                handleList()
            }
        } catch (error) {
            console.error(error)
        }
    }

    // 更新
    const handleUpdate = async (data) => {
        try {
            await updateSilence(data)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 提交
    const handleFormSubmit = async (values) => {

        if (type === 'create' || type === 'createForCurEvent') {
            const params = {
                ...values,
                starts_at: startTimestamp,
                ends_at: endTimestamp,
                status: 0,
            }

            await handleCreate(params)
        }

        if (type === 'update') {
            const params = {
                ...values,
                tenantId: selectedRow.tenantId,
                id: selectedRow.id,
                create_by: selectedRow.create_by,
                starts_at: startTimestamp,
                ends_at: endTimestamp,
            }

            await handleUpdate(params)
        }

        // 关闭弹窗
        onClose()

    }

    return (
        <Modal visible={visible} onCancel={onClose} footer={null}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>

                <MyFormItem name="datasource_type" label="数据源类型"
                    rules={[
                        {
                            required: true,
                        },
                    ]}>
                    <Select
                        placeholder="请选择数据源类型"
                        style={{
                            flex: 1,
                        }}
                        options=""
                        disabled={true}
                        onChange={onClickToDsType}
                    />
                </MyFormItem>

                <MyFormItem name="fingerprint" label="告警指纹"
                    rules={[
                        {
                            required: true,
                        },
                    ]}>
                    <Select
                        showSearch
                        placeholder="请选择要静默的告警指纹ID"
                        style={{
                            flex: 1,
                        }}
                        disabled={true}
                        options={alertFingerprint}
                        onClick={handleSearchCurAlert}
                    />
                </MyFormItem>

                <MyFormItem name="" label="时间选择器"
                    rules={[
                        {
                            required: true,
                        },
                    ]}>
                    <RangePicker
                        style={{ width: '470px' }}
                        showTime={{
                            format: 'HH:mm:ss',
                        }}
                        format="YYYY-MM-DD HH:mm:ss"
                        onChange={onChange}
                        onOk={onOk}
                    />
                </MyFormItem>

                <MyFormItem name="comment" label="评论">
                    <Input />
                </MyFormItem>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        style={{
                            backgroundColor: '#000000'
                        }}
                    >
                        提交
                    </Button>
                </div>
            </Form>
        </Modal>
    )
}