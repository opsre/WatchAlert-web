import { Modal, Form, Input, Button, DatePicker, Select, Drawer, message, Space } from 'antd';
import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { createSilence, updateSilence } from '../../api/silence';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { RangePicker } = DatePicker;
const { Option } = Select;

const MyFormItemContext = React.createContext([]);

function toArr(str) {
    return Array.isArray(str) ? str : [str];
}

// 表单
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext);
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined;
    return <Form.Item name={concatName} {...props} />;
};

export const CreateSilenceModal = ({ visible, onClose, selectedRow, type, handleList, faultCenterId }) => {
    const [form] = Form.useForm();
    const [startTimestamp, setStartTimestamp] = useState(null);
    const [endTimestamp, setEndTimestamp] = useState(null);

    useEffect(() => {
        if (selectedRow) {
            form.setFieldsValue({
                name: selectedRow.name,
                comment: selectedRow.comment,
                labels: selectedRow.labels || [{ key: '', operator: '=', value: '' }], // 初始化 labels，默认展示一个空 k/v 和操作符
            });
        } else {
            form.setFieldsValue({
                labels: [{ key: '', operator: '=', value: '' }], // 默认展示一个空 k/v 和操作符
            });
        }
    }, [selectedRow, form]);

    // 时间选择器
    const onChange = (dates, dateStrings) => {
        if (dates && dates.length === 2) {
            const startTimestamp = moment(dateStrings[0]).unix();
            const endTimestamp = moment(dateStrings[1]).unix();
        }
    };

    const onOk = (dates) => {
        if (dates && dates[0] && dates[1]) {
            const startTimestamp = dates[0].unix();
            const endTimestamp = dates[1].unix();
            setStartTimestamp(startTimestamp);
            setEndTimestamp(endTimestamp);
        }
    };

    // 创建
    const handleCreate = async (data) => {
        try {
            await createSilence(data);
            handleList()
        } catch (error) {
            console.error(error);
        }
    };

    // 更新
    const handleUpdate = async (data) => {
        try {
            await updateSilence(data);
            handleList()
        } catch (error) {
            console.error(error);
        }
    };

    // 提交
    const handleFormSubmit = async (values) => {
        const params = {
            ...values,
            startsAt: startTimestamp,
            endsAt: endTimestamp,
            faultCenterId: faultCenterId,
            status: 0,
        };

        if (type === 'create') {
            await handleCreate(params);
        }

        if (type === 'update') {
            const updateParams = {
                ...params,
                id: selectedRow.id,
            };

            await handleUpdate(updateParams);
        }

        // 关闭弹窗
        onClose();
    };

    return (
        <Drawer title="静默规则" open={visible} onClose={onClose} footer={null} size="large">
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <MyFormItem name="name" label="规则名称" rules={[{ required: true }]}>
                    <Input />
                </MyFormItem>

                <MyFormItem
                    name=""
                    label="时间选择器"
                    rules={[
                        {
                            required: true,
                        },
                    ]}
                >
                    <RangePicker
                        style={{ width: '100%' }}
                        showTime={{
                            format: 'HH:mm:ss',
                        }}
                        format="YYYY-MM-DD HH:mm:ss"
                        onChange={onChange}
                        onOk={onOk}
                    />
                </MyFormItem>

                <span>静默条件</span>
                {/* 动态添加 label */}
                <div style={{ border: '1px solid #d9d9d9', borderRadius: '8px', padding: '16px', marginBottom: '16px', marginTop: '10px' }}>
                    <Form.List name="labels">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'key']}
                                            rules={[{ required: true, message: '请输入 key' }]}
                                            style={{width: '265px'}}
                                        >
                                            <Input placeholder="key" />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'operator']}
                                            rules={[{ required: true, message: '请选择操作符' }]}
                                        >
                                            <Select defaultValue={'='}>
                                                <Option value="=">等于</Option>
                                                <Option value="!=">不等于</Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'value']}
                                            rules={[{ required: true, message: '请输入 value' }]}
                                            style={{width: '265px'}}
                                        >
                                            <Input placeholder="value" />
                                        </Form.Item>
                                        <MinusCircleOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                        添加 label
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </div>

                <MyFormItem name="comment" label="评论" rules={[{ required: true }]}>
                    <Input />
                </MyFormItem>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button type="primary" htmlType="submit" style={{ backgroundColor: '#000000' }}>
                        提交
                    </Button>
                </div>
            </Form>
        </Drawer>
    );
};