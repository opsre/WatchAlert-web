import React, { useState, useEffect, useContext, useMemo } from 'react';
import {Anchor, Button, Form, Input, Popconfirm, Select, Typography, Radio } from 'antd';
import "./index.css";
import { getSystemSetting, saveSystemSetting } from "../../api/settings";
import TextArea from "antd/es/input/TextArea";

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
    const [enableAi,setEnableAi] = useState(false);
    const [serviceProvider, setServiceProvider] = useState(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const res = await getSystemSetting();
            // 解构时处理可能的 undefined 值，并设置 prompt 默认值
            const aiConfig = {
                ...(res.data.aiConfig || {}), // 防止 aiConfig 为 undefined
                prompt: res.data.aiConfig?.prompt || "Revised Prompt: 作为站点可靠性工程 (SRE) 可观测性监控专家，请分析以下警报内容，下面的信息很可能包括（指标、日志、跟踪或 Kubernetes 事件）。\n" +
                    "---\n" +
                    "您的分析应包括：\n" +
                    "1. 可能的原因分析：详细解释警报中出现问题的潜在原因，并提供相关示例。\n" +
                    "2. 排查步骤：概述系统化的故障排除和问题解决方法，包括具体的步骤、命令或工具。\n" +
                    "3. 最佳实践和策略：推荐防止此类问题再次发生的最佳实践，讨论如何实施监控、警报和操作程序以缓解类似问题。\n" +
                    "---\n" +
                    "现在我接收到的告警内容如下：\n" +
                    "规则名称:\n" +
                    "{{ RuleName }}\n" +
                    "触发条件:\n" +
                    "{{ SearchQL }}\n" +
                    "告警内容:\n" +
                    "{{ Content }}\n" +
                    "---\n" +
                    "请根据以下三个方面，结构化地回复我，要求简洁明了、通俗易懂：\n" +
                    "1. 分析可能的原因\n" +
                    "2. 提供具体的排查步骤\n" +
                    "3. 如何规避\n" +
                    "---\n" +
                    "请清晰格式化您的回复，并使用适当的标题分隔每个部分。\n"
            };

            form.setFieldsValue({
                emailConfig: { // 保持原有结构
                    serverAddress: res.data.emailConfig.serverAddress,
                    port: res.data.emailConfig.port,
                    email: res.data.emailConfig.email,
                    token: res.data.emailConfig.token,
                },
                aiConfig: aiConfig // 使用处理后的 aiConfig
            });

            setEnableAi(aiConfig.enable);
            setServiceProvider(aiConfig.type);
            setVersion(res.data.appVersion);
        } catch (error) {
            console.error("Failed to load settings:", error);
            // 可选: 通知用户加载失败
        }
    };


    const saveSettings = async (values) => {
        await form.validateFields()
        values.emailConfig.port = Number(values.emailConfig.port)
        values.aiConfig.timeout = Number(values.aiConfig.timeout)
        values.aiConfig.maxTokens = Number(values.aiConfig.maxTokens)
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

    const radioOptions = [
        { label: '启用', value: true },
        { label: '禁用', value: false },
    ];

    const openaiModels = [
        { label: 'gpt-3.5-turbo', value: 'gpt-3.5-turbo' },
        { label: 'gpt-4', value: 'gpt-4' },
        { label: 'gpt-4o', value: 'gpt-4o' },
        { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
        { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
    ]

    const deepseekModels = [
        { label: 'DeepSeek-R1', value: 'DeepSeek-R1' },
        { label: 'DeepSeek-R1-Lite', value: 'DeepSeek-R1-Lite' },
        { label: 'DeepSeek-V2.5', value: 'DeepSeek-V2.5' },
        { label: 'DeepSeek-V3', value: 'DeepSeek-V3' },
    ]

    return (
        <div style={{ display: 'flex', width: '100%' }}>
            <div style={{ width: '90%', alignItems: 'flex-start', textAlign: 'start', marginTop: '-20px', maxHeight: contentMaxHeight, overflowY: 'auto' }}>
                <Form form={form} name="form_item_path" layout="vertical" onFinish={handleSave}>
                    <section id="email">
                        <Typography.Title level={5}>邮箱配置</Typography.Title>
                        <p style={helpTextStyle}>｜↪ 用于推送邮件告警消息；</p>
                        <MyFormItemGroup prefix={['emailConfig']}>
                            <MyFormItem name="serverAddress" label="邮箱服务器">
                                <Input placeholder="请输入邮箱所属服务器地址"/>
                            </MyFormItem>
                            <MyFormItem name="port" label="邮箱服务器端口">
                                <Input type={"Number"} min={1} placeholder="请输入邮箱所属服务器端口"
                                       style={formItemStyle}/>
                            </MyFormItem>
                            <MyFormItem name="email" label="邮箱账号">
                                <Input placeholder="请输入邮箱所属服务器地址"/>
                            </MyFormItem>
                            <MyFormItem name="token" label="授权码">
                                <Input.Password placeholder="请输入邮箱授权码"/>
                            </MyFormItem>
                        </MyFormItemGroup>
                    </section>

                    <section id="ai">
                        <Typography.Title level={5}>Ai 能力</Typography.Title>
                        <MyFormItemGroup prefix={['aiConfig']}>
                            <MyFormItem name="enable">
                                <Radio.Group
                                    block
                                    options={radioOptions}
                                    value={enableAi}
                                    onChange={(e)=> {setEnableAi(e.target.value)}}
                                />
                            </MyFormItem>

                            {
                                enableAi === true && (
                                    <>
                                        <MyFormItem
                                            name="url"
                                            label="接口地址"
                                            rules={[{required: true}]}
                                        >
                                            <Input placeholder="Ai 接口地址, 必须包含 http(s)://"/>
                                        </MyFormItem>
                                        <MyFormItem
                                            name="appKey"
                                            label="密钥"
                                            rules={[{required: true}]}
                                        >
                                            <Input.Password placeholder="请求密钥"/>
                                        </MyFormItem>
                                        <MyFormItem
                                            name="model"
                                            label="模型"
                                            rules={[{required: true}]}
                                        >
                                            <Input
                                                style={{ width: '100%' }}
                                                placeholder="选择 Ai 模型"
                                            />
                                        </MyFormItem>
                                        <MyFormItem
                                            name="timeout"
                                            label="超时时间"
                                            rules={[{required: true}]}
                                        >
                                            <Input type={'Number'} placeholder="请输入超时时间"/>
                                        </MyFormItem>
                                        <MyFormItem
                                            name="maxTokens"
                                            label="最大 Token 数"
                                            rules={[{required: true}]}
                                        >
                                            <Input type={'Number'}  placeholder="请输入最大 Token 数"/>
                                        </MyFormItem>
                                        <MyFormItem
                                            name="prompt"
                                            label="自定义提示词"
                                            rules={[{required: true}]}
                                        >
                                            <TextArea rows={15} placeholder="请输入自定义提示词" />
                                        </MyFormItem>
                                    </>
                                )
                            }
                        </MyFormItemGroup>
                    </section>

                    <section id="version">
                        <Typography.Title level={5}>系统版本</Typography.Title>
                        {version || 'Null'}
                    </section>

                    <section id="option" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
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
                        { key: '1', href: '#email', title: '邮箱配置' },
                        { key: '2', href: '#ai', title: 'Ai 能力' },
                        { key: '999', href: '#version', title: '系统版本' },
                        { key: '9999', href: '#option', title: '保存取消' },
                    ]}
                />
            </div>
        </div>
    );
};
