import {Modal, Form, Input, Button, Select, Drawer, Divider} from 'antd'
import React, { useState, useEffect } from 'react'
import {FaultCenterCreate} from "../../api/faultCenter";
import {getNoticeList} from "../../api/notice";
const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const CreateFaultCenter = ({ visible, onClose, handleList }) => {
    const [form] = Form.useForm()
    const [noticeOptions, setNoticeOptions] = useState([]); // 通知对象列表


    useEffect(() => {
        handleGetNoticeData();

        form.setFieldsValue({
            repeatNoticeInterval: 60,
            recoverWaitTime: 30,

        })
    }, []);

    // 禁止输入空格
    const [spaceValue, setSpaceValue] = useState('')

    const handleInputChange = (e) => {
        // 移除输入值中的空格
        const newValue = e.target.value.replace(/\s/g, '')
        setSpaceValue(newValue)
    }

    const handleKeyPress = (e) => {
        // 阻止空格键的默认行为
        if (e.key === ' ') {
            e.preventDefault()
        }
    }

    const handleCreate = async (data) => {
        try {
            await FaultCenterCreate(data)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }


    const handleFormSubmit = async (values) => {
        const params = {
            ...values,
            aggregationType: "Rule",
            recoverNotify: true,
            repeatNoticeInterval: Number(values.repeatNoticeInterval),
            recoverWaitTime: Number(values.recoverWaitTime),
        }

        handleCreate(params)

        // 关闭弹窗
        onClose()
    }

    // 获取通知对象列表
    const handleGetNoticeData = async () => {
        const res = await getNoticeList();
        const newData = res.data?.map((item) => ({
            label: item.name,
            value: item.uuid,
        }));
        setNoticeOptions(newData);
    };


    return (
        <Drawer title="创建故障中心" open={visible} onClose={onClose} footer={null} size={"large"}>
            <strong style={{fontSize: '16px'}}>基础配置</strong>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <MyFormItem name="name" label="名称"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                >
                    <Input
                        value={spaceValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}/>
                </MyFormItem>

                <MyFormItem name="description" label="描述">
                    <Input/>
                </MyFormItem>

                <Divider />

                <strong style={{fontSize: '16px'}}>通知策略</strong>
                <MyFormItem
                    name="noticeIds"
                    label="通知对象"
                    tooltip="默认通知对象"
                    style={{
                        marginRight: '10px',
                        width: '100%',
                    }}
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <Select
                        mode={"multiple"}
                        style={{
                            width: '100%',
                        }}
                        allowClear
                        placeholder="选择通知对象"
                        options={noticeOptions}
                    />
                </MyFormItem>

                <MyFormItem
                    name="repeatNoticeInterval"
                    label="重复通知"
                    style={{ width: '100%' }}
                    rules={[
                        {
                            required: true,
                            message: '请输入重复通知间隔时间',
                        }
                    ]}
                >
                    <Input
                        type="number"
                        style={{ width: '100%' }}
                        addonAfter="分钟"
                        placeholder="60"
                        min={1}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '' && !/^\d+$/.test(value)) {
                                e.target.value = value.replace(/\D/g, ''); // 移除非数字字符
                            }
                        }}
                    />
                </MyFormItem>

                <MyFormItem
                    name="recoverWaitTime"
                    label="恢复等待"
                    tooltip={"告警恢复等待时间间隔（为了防止在告警触发恢复后紧接着再次触发告警条件，单位分钟默认1m）"}
                    style={{ width: '100%' }}
                    rules={[
                        {
                            required: true,
                            message: '请输入恢复等待时间',
                        }
                    ]}
                >
                    <Input
                        type="number"
                        style={{ width: '100%' }}
                        addonAfter="秒"
                        placeholder="30"
                        min={1}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '' && !/^\d+$/.test(value)) {
                                e.target.value = value.replace(/\D/g, ''); // 移除非数字字符
                            }
                        }}
                    />
                </MyFormItem>

                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
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
        </Drawer>
    )
}
