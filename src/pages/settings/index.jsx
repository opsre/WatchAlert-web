import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Anchor, Button, Form, Input, InputNumber, Popconfirm, Typography } from 'antd';
import "./index.css";
import { getSystemSetting, saveSystemSetting } from "../../api/settings";

// 表单上下文
const MyFormItemContext = React.createContext([]);
const toArr = (str) => (Array.isArray(str) ? str : [str]);

const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = useContext(MyFormItemContext);
    const concatPath = useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix]);
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>;
};

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = useContext(MyFormItemContext);
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined;
    return <Form.Item name={concatName} {...props} />;
};

export const SystemSettings = () => {
    const [form] = Form.useForm();
    const contentMaxHeight = 'calc((-145px + 100vh) - 65px - 40px)';
    const [version, setVersion] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await getSystemSetting();
            form.setFieldsValue({
                alarmConfig: {
                    groupWait: res.data.alarmConfig.groupWait,
                    groupInterval: res.data.alarmConfig.groupInterval,
                    recoverWait: res.data.alarmConfig.recoverWait,
                },
                emailConfig: {
                    serverAddress: res.data.emailConfig.serverAddress,
                    port: res.data.emailConfig.port,
                    email: res.data.emailConfig.email,
                    token: res.data.emailConfig.token,
                }
            });
            setVersion(res.data.appVersion);
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    };

    const saveSettings = async (values) => {
        try {
            await saveSystemSetting(values);
            loadSettings();
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    };

    const handleSave = (values) => saveSettings(values);
    const handleCancel = () => loadSettings();

    const formItemStyle = { width: '100%' };
    const helpTextStyle = { fontSize: '12px', color: '#7f838a' };

    return (
        <div style={{ display: 'flex', width: '100%' }}>
            <div style={{ width: '90%', alignItems: 'flex-start', textAlign: 'start', marginTop: '-20px', maxHeight: contentMaxHeight, overflowY: 'auto' }}>
                <Form form={form} name="form_item_path" layout="vertical" onFinish={handleSave}>
                    <section id="alarm">
                        <Typography.Title level={5}>告警配置</Typography.Title>
                        <MyFormItemGroup prefix={['alarmConfig']}>
                            <MyFormItem name="groupWait" label="初次告警等待时间">
                                <InputNumber min={1} placeholder="10" style={formItemStyle} />
                            </MyFormItem>
                            <p style={helpTextStyle}>｜↪ 定义相同的Group之间发送告警通知的时间间隔, 组内有告警就一起发出, 没有则单独发出, 单位秒 默认10s；</p>
                            <MyFormItem name="groupInterval" label="告警等待间隔时间">
                                <InputNumber min={1} placeholder="120" style={formItemStyle} />
                            </MyFormItem>
                            <p style={helpTextStyle}>｜↪ 非初次推送告警的等待时间间隔（为了保证告警聚合性相同时间段的告警一起发送，单位秒 默认120s）；</p>
                            <MyFormItem name="recoverWait" label="告警恢复等待时间">
                                <InputNumber min={1} placeholder="1" style={formItemStyle} />
                            </MyFormItem>
                            <p style={helpTextStyle}>｜↪ 告警恢复等待时间间隔（为了防止在告警触发恢复后紧接着再次触发告警条件，单位分钟 默认1m）；</p>
                        </MyFormItemGroup>
                    </section>

                    <section id="email">
                        <Typography.Title level={5}>邮箱配置</Typography.Title>
                        <p style={helpTextStyle}>｜↪ 用于推送邮件告警消息；</p>
                        <MyFormItemGroup prefix={['emailConfig']}>
                            <MyFormItem name="serverAddress" label="邮箱服务器">
                                <Input placeholder="请输入邮箱所属服务器地址" />
                            </MyFormItem>
                            <MyFormItem name="port" label="邮箱服务器端口">
                                <InputNumber min={1} placeholder="请输入邮箱所属服务器端口" style={formItemStyle} />
                            </MyFormItem>
                            <MyFormItem name="email" label="邮箱账号">
                                <Input placeholder="请输入邮箱所属服务器地址" />
                            </MyFormItem>
                            <MyFormItem name="token" label="授权码">
                                <Input.Password placeholder="请输入邮箱授权码" />
                            </MyFormItem>
                        </MyFormItemGroup>
                    </section>

                    <section id="version">
                        <Typography.Title level={5}>系统版本</Typography.Title>
                        {version || 'Null'}
                    </section>

                    <section id="option" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Popconfirm title="取消后修改的配置将不会保存!" onConfirm={handleCancel}>
                            <Button type="dashed">取消</Button>
                        </Popconfirm>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{
                                backgroundColor: '#000000'
                            }}
                        >保存</Button>
                    </section>
                </Form>
            </div>

            <div className="systemSettingsAnchorContainer">
                <Anchor
                    affix
                    items={[
                        { key: '1', href: '#alarm', title: '告警配置' },
                        { key: '2', href: '#email', title: '邮箱配置' },
                        { key: '999', href: '#version', title: '系统版本' },
                        { key: '9999', href: '#option', title: '保存取消' },
                    ]}
                />
            </div>
        </div>
    );
};
