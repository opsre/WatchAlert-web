import React, { useState, useEffect } from 'react';
import { Input, Descriptions, Tabs, Button, Select, Tooltip, Switch, Form } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { FaultCenterReset, FaultCenterSearch, FaultCenterUpdate } from '../../api/faultCenter';
import { useParams } from 'react-router-dom';
import { getNoticeList } from '../../api/notice';

const MyFormItemContext = React.createContext([]);

function toArr(str) {
    return Array.isArray(str) ? str : [str];
}

// 表单组
const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = React.useContext(MyFormItemContext);
    const concatPath = React.useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix]);
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>;
};

// 表单
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext);
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined;
    return <Form.Item name={concatName} {...props} />;
};

export const FaultCenterNotify = () => {
    const { id } = useParams();
    const [form] = Form.useForm();
    const [detail, setDetail] = useState({});
    const [noticeRoutes, setNoticeRoutes] = useState([]); // 动态更新 noticeRoutes
    const [noticeLabels, setNoticeLabels] = useState([]); // noticeLabel
    const [noticeOptions, setNoticeOptions] = useState([]); // 通知对象列表
    const [editable, setEditable] = useState(false); // 编辑状态

    useEffect(() => {
        handleList();
        handleGetNoticeData();
    }, []);

    const handleList = async () => {
        try {
            const params = { id };
            const res = await FaultCenterSearch(params);
            setDetail(res.data);
            console.log(res.data);

            // 回显数据
            form.setFieldsValue({
                noticeIds: res.data.noticeIds,
                repeatNoticeInterval: res.data.repeatNoticeInterval,
                recoverNotify: res.data.recoverNotify,
                alarmAggregation: res.data.alarmAggregation,
                recoverWaitTime: res.data.recoverWaitTime,
            });

            // 将 noticeRoutes 映射到 noticeLabels
            if (res.data.noticeRoutes && res.data.noticeRoutes.length > 0) {
                const labels = res.data.noticeRoutes.map((group) => ({
                    key: group.key,
                    value: group.value,
                    noticeIds: group.noticeIds,
                }));
                setNoticeLabels(labels);
                setNoticeRoutes(labels); // 同步更新 noticeRoutes
            } else {
                setNoticeLabels([]); // 如果没有 sNoticeRoutes，清空 noticeLabels
                setNoticeRoutes([]);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 动态更新 setNoticeRoutes
    useEffect(() => {
        const updatedNoticeRoutes = noticeLabels.map((label) => ({
            key: label.key,
            value: label.value,
            noticeIds: label.noticeIds,
        }));
        setNoticeRoutes(updatedNoticeRoutes);
    }, [noticeLabels]);

    // 添加标签
    const addLabel = () => {
        setNoticeLabels([...noticeLabels, { key: '', value: '', noticeIds: [] }]);
    };

    // 更新标签
    const updateLabel = (index, field, value) => {
        const updatedLabels = [...noticeLabels];
        updatedLabels[index][field] = value;
        setNoticeLabels(updatedLabels);
    };

    // 删除标签
    const removeLabel = (index) => {
        const updatedLabels = [...noticeLabels];
        updatedLabels.splice(index, 1);
        setNoticeLabels(updatedLabels);
    };

    // 切换编辑状态
    const toggleEdit = () => {
        setEditable(!editable);
    };

    // 保存修改
    const handleSave = async () => {
        const values = form.getFieldsValue();
        const params = {
            ...detail,
            ...values,
            noticeRoutes: noticeRoutes, // 使用动态更新的 noticeRoutes
            repeatNoticeInterval: Number(values.repeatNoticeInterval),
            recoverWaitTime: Number(values.recoverWaitTime),
        };
        await FaultCenterUpdate(params);
        setEditable(false);
    };

    // 取消编辑
    const handleCancel = () => {
        setEditable(false);
        // 重置表单数据
        handleList();
    };

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
        <Form form={form} initialValues={detail}>
            {/* 按钮组 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                {editable ? (
                    <>
                        <Button
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={handleSave}
                            style={{ marginRight: '8px', backgroundColor: '#000', borderColor: '#000' }}
                        >
                            保存
                        </Button>
                        <Button
                            icon={<CloseOutlined />}
                            onClick={handleCancel}
                            style={{ backgroundColor: '#fff', borderColor: '#d9d9d9', color: '#000' }}
                        >
                            取消
                        </Button>
                    </>
                ) : (
                    <Button
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={toggleEdit}
                        style={{ backgroundColor: '#000', borderColor: '#000' }}
                    >
                        编辑
                    </Button>
                )}
            </div>

            <div style={{
                textAlign: 'left', position: 'relative', paddingBottom: '60px',
                width: '100%',
                alignItems: 'flex-start',
                maxHeight: 'calc((-145px + 70vh) - 65px - 40px)',
                overflowY: 'auto',
            }}>
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
                        disabled={!editable}
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
                        disabled={!editable}
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
                        addonAfter="分钟"
                        placeholder="1"
                        min={1}
                        disabled={!editable}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value !== '' && !/^\d+$/.test(value)) {
                                e.target.value = value.replace(/\D/g, ''); // 移除非数字字符
                            }
                        }}
                    />
                </MyFormItem>

                <div style={{display: 'flex', marginTop: '10px', alignItems: 'center'}}>
                    <MyFormItem style={{marginBottom: '0', marginRight: '10px'}}>
                        <span>告警路由</span>
                        <Tooltip title="根据 Metric 标签路由到相应的通知对象">
                            <QuestionCircleOutlined style={{color: '#1890ff', marginLeft: '4px'}}/>
                        </Tooltip>
                    </MyFormItem>
                    <Button onClick={addLabel} style={{marginTop: '0'}} disabled={!editable}>
                        +
                    </Button>
                </div>

                <div style={{marginTop: '20px'}}>
                    <MyFormItemGroup prefix={['noticeRoutes']}>
                        {noticeLabels.length >= 1 ? (
                            <div style={{display: 'flex'}}>
                                <label style={{marginRight: '29%'}}>* Key</label>
                                <label style={{marginRight: '28%'}}>* Value</label>
                                <label style={{marginRight: '27%'}}>* 通知对象</label>
                                <label>操作</label>
                            </div>
                        ) : null}
                        {noticeLabels?.map((label, index) => (
                            <div style={{display: 'flex', alignItems: 'center', marginTop: '10px'}}>
                                <Input
                                    name={`[${index}].key`}
                                    placeholder="Key"
                                    style={{
                                        marginRight: '10px',
                                        width: 'calc((100% / 3) - 20px)',
                                        height: '32px',
                                    }}
                                    value={label.key} // 回显 key
                                    onChange={(e) => updateLabel(index, 'key', e.target.value)}
                                    disabled={!editable}
                                />

                                <Input
                                    name={`[${index}].value`}
                                    placeholder="Value"
                                    style={{
                                        marginRight: '10px',
                                        width: 'calc((100% / 3) - 20px)',
                                        height: '32px',
                                    }}
                                    value={label.value} // 回显 value
                                    onChange={(e) => updateLabel(index, 'value', e.target.value)}
                                    disabled={!editable}
                                />

                                <Select
                                    mode={"multiple"}
                                    name={`[${index}].noticeIds`}
                                    placeholder="选择通知对象"
                                    style={{width: 'calc((100% / 3) - 20px)', height: '32px'}}
                                    allowClear
                                    options={noticeOptions}
                                    value={label.noticeIds} // 回显 noticeIds
                                    onChange={(value) => updateLabel(index, 'noticeIds', value)}
                                    disabled={!editable}
                                />

                                <Button onClick={() => removeLabel(index)} style={{marginLeft: '10px'}}
                                        disabled={!editable}>
                                    -
                                </Button>
                            </div>
                        ))}
                    </MyFormItemGroup>
                </div>

                <div style={{marginTop: '10px'}}>
                    <MyFormItem style={{marginBottom: 0}} name="recoverNotify">
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{marginRight: 8}}>恢复通知</span>
                            <Switch
                                checked={form.getFieldValue('recoverNotify')}
                                onChange={(checked) => form.setFieldsValue({recoverNotify: checked})}
                                disabled={!editable}
                            />
                        </div>
                    </MyFormItem>
                </div>
            </div>
        </Form>
    );
};