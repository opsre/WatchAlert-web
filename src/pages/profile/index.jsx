import { Avatar, Form, Input, Button, message, Tabs, Table, Modal, Space, Tooltip } from "antd";
import { CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from "react";
import { getUserInfo, updateUser } from "../../api/user";
import { createAPIKey, updateAPIKey, deleteAPIKey, listAPIKeys } from "../../api/other";
import { copyToClipboard } from "../../utils/copyToClipboard";

export default function Profile() {
    const [userInfo, setUserInfo] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // 控制编辑模式的状态
    const [form] = Form.useForm();
    
    // API密钥管理状态
    const [apiKeys, setApiKeys] = useState([]);
    const [loadingApiKeys, setLoadingApiKeys] = useState(false);
    const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
    const [editingApiKey, setEditingApiKey] = useState(null);
    const [apiKeyForm] = Form.useForm();

    useEffect(() => {
        fetchUserInfo();
        fetchApiKeys();
    }, []);

    const fetchUserInfo = async () => {
        try {
            const res = await getUserInfo();
            setUserInfo(res.data);
            form.setFieldsValue({
                password: "****************",
                phone: res.data.phone,
                email: res.data.email,
            });
        } catch (error) {
            console.error(error);
            message.error("Failed to fetch user info");
        }
    };

    useEffect(() => {
        if (isEditing) {
            form.setFieldsValue({ password: "" });
        } else {
            form.setFieldsValue({ password: "****************" });
        }
    }, [isEditing]);

    // API密钥管理相关函数
    const fetchApiKeys = async () => {
        try {
            setLoadingApiKeys(true);
            const response = await listAPIKeys();
            setApiKeys(response.data || []);
        } catch (error) {
            console.error('Failed to fetch API keys:', error);
            message.error('获取API密钥失败');
        } finally {
            setLoadingApiKeys(false);
        }
    };

    const handleCreateOrUpdateApiKey = async (values) => {
        try {
            if (editingApiKey) {
                await updateAPIKey({
                    ...editingApiKey,
                    ...values
                });
                message.success('API密钥更新成功');
            } else {
                await createAPIKey(values);
                message.success('API密钥创建成功');
            }
            setApiKeyModalVisible(false);
            apiKeyForm.resetFields();
            setEditingApiKey(null);
            fetchApiKeys();
        } catch (error) {
            console.error('API密钥操作失败:', error);
            message.error(editingApiKey ? '更新API密钥失败' : '创建API密钥失败');
        }
    };

    const handleDeleteApiKey = async (record) => {
        try {
            Modal.confirm({
                title: '确认删除',
                content: `确定要删除API密钥 "${record.name}" 吗？`,
                onOk: async () => {
                    await deleteAPIKey(record.id);
                    message.success('API密钥删除成功');
                    fetchApiKeys();
                },
            });
        } catch (error) {
            console.error('删除API密钥失败:', error);
            message.error('删除API密钥失败');
        }
    };

    const showCreateApiKeyModal = () => {
        setEditingApiKey(null);
        apiKeyForm.resetFields();
        setApiKeyModalVisible(true);
    };

    const showEditApiKeyModal = (record) => {
        setEditingApiKey(record);
        apiKeyForm.setFieldsValue({
            name: record.name,
            description: record.description,
        });
        setApiKeyModalVisible(true);
    };

    const handleUpdate = async (values) => {
        try {
            const params = {
                ...userInfo,
                phone: values.phone,
                email: values.email,
                password: values.password,
            };
            await updateUser(params);
            setIsEditing(false); // 更新成功后退出编辑模式
            await fetchUserInfo(); // 重新获取用户信息
            message.success("用户信息更新成功");
        } catch (error) {
            console.error(error);
            message.error("Failed to update user info");
        }
    };

    // 定义API密钥表格列
    const apiKeyColumns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'API Key',
            dataIndex: 'key',
            key: 'key',
            render: (text, record) => {
                if (!text) {
                    return "-";
                }
                // 截取显示：显示前6位和后4位，中间用***代替
                let displayText = text;
                if (text.length > 10) {
                    const start = text.substring(0, 6);
                    const end = text.substring(text.length - 4);
                    displayText = `${start}***${end}`;
                }
                
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontFamily: "monospace", userSelect: "text" }}>{displayText}</span>
                        <Tooltip title="复制API密钥">
                            <Button
                                type="text"
                                icon={<CopyOutlined />}
                                size="small"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(text);
                                }}
                            />
                        </Tooltip>
                    </div>
                );
            },
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (text) => {
                if (!text) {
                    return "-"
                }
                return text
            },
        },
        {
            title: '创建时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 180,
            render: (text) => {
                const date = new Date(text * 1000)
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{date.toLocaleString()}</span>
                    </div>
                )
            },
        },
        {
            title: '操作',
            key: 'action',
            width: 50,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="编辑">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => showEditApiKeyModal(record)}
                            style={{ color: "#615454" }}
                        />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button
                            type="text"
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteApiKey(record)}
                            style={{ color: "red" }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    // API密钥表单字段
    const apiKeyFormItems = [
        {
            label: '名称',
            name: 'name',
            rules: [{ required: true, message: '请输入API密钥名称' }],
        },
        {
            label: '描述',
            name: 'description',
            rules: [],
        },
    ];

    return (
        <div className="container mx-auto p-4 mt-10">
            <Tabs defaultActiveKey="profile" items={[{
                label: '个人信息',
                key: 'profile',
                children: (
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* Left Column - Profile Info */}
                        <div className="lg:w-1/3 space-y-6 border-r border-white pr-6">
                            <div className="p-6">
                                <div className="flex flex-col items-center space-y-4">
                                    {/* Avatar Section */}
                                    <div className="w-64 h-64 rounded-full overflow-hidden">
                                        <Avatar
                                            style={{
                                                backgroundColor: '#7265e6',
                                                width: 256,
                                                height: 256,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                            size="large"
                                        >
                                            <div style={{ marginTop: -20 }}>
                                                <span style={{ fontSize: 180, lineHeight: 1 }}>
                                                    {userInfo?.username?.charAt(0).toUpperCase() || ''}
                                                </span>
                                            </div>
                                        </Avatar>
                                    </div>
                                    {/* Profile Info */}
                                    <div className="text-center">
                                        <h1 className="text-3xl font-bold">{userInfo?.username}</h1>
                                        <p className="text-l text-muted-foreground">UID: {userInfo?.userid}</p>
                                    </div>
                                    {/* Edit Profile Button */}
                                    <div className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                                        <Button

                                            type="primary"
                                            htmlType="submit"
                                            onClick={() => setIsEditing(true)}
                                            style={{
                                                marginLeft: '12px',
                                                width: '90%',
                                                marginTop: '-15px',
                                                backgroundColor: '#000000'
                                            }}
                                        >
                                            编辑信息
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Account Info */}
                        <div className="lg:w-2/3 space-y-6 border border-white rounded-lg p-6">
                            <section>
                                <div style={{ display: 'flex', justifyContent: 'left' }}>
                                    <h2 className="font-bold inset-y-0 left-0">账户信息</h2>
                                </div>
                                <Form form={form} onFinish={handleUpdate} layout="vertical">
                                    {/* Phone */}
                                    <Form.Item
                                        label="Phone"
                                        name="phone"
                                        rules={[
                                            { pattern: /^[0-9]{10,11}$/, message: "Invalid phone number" },
                                            { required: isEditing, message: "请输入手机号" },
                                        ]}
                                    >
                                        <Input placeholder="Enter phone number" disabled={!isEditing} />
                                    </Form.Item>

                                    {/* Email */}
                                    <Form.Item
                                        label="Email"
                                        name="email"
                                        rules={[
                                            { type: "email", message: "Invalid email address" },
                                            { required: isEditing, message: "请输入邮箱" },
                                        ]}
                                    >
                                        <Input placeholder="Enter email address" disabled={!isEditing} />
                                    </Form.Item>

                                    {/* Password */}
                                    <Form.Item
                                        label="Password"
                                        name="password"
                                        rules={[
                                            { min: 6, message: "Password must be at least 6 characters" },
                                            { required: isEditing, message: "请输入密码" },
                                        ]}
                                    >
                                        <Input.Password placeholder="Enter new password" disabled={!isEditing} />
                                    </Form.Item>

                                    {/* 按钮区域 */}
                                    {isEditing && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            {/* 退出编辑按钮 */}
                                            <Button
                                                type="default"
                                                onClick={() => setIsEditing(false)} // 退出编辑模式
                                            >
                                                退出编辑
                                            </Button>

                                            {/* 更新按钮 */}
                                            <Button
                                                type="primary"
                                                htmlType="submit"
                                                style={{
                                                    backgroundColor: '#000000'
                                                }}
                                            >
                                                更新
                                            </Button>
                                        </div>
                                    )}
                                </Form>
                            </section>
                        </div>
                    </div>
                )
            }, {
                label: 'API密钥管理',
                key: 'apikeys',
                children: (
                    <div>
                        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type="primary" style={{ backgroundColor: "#000000" }} onClick={showCreateApiKeyModal}>
                                创建API密钥
                            </Button>
                        </div>
                        <Table 
                            columns={apiKeyColumns} 
                            dataSource={apiKeys} 
                            rowKey="id" 
                            loading={loadingApiKeys}
                        />
                        
                        {/* API密钥创建/编辑模态框 */}
                        <Modal
                            title={editingApiKey ? '编辑API密钥' : '创建API密钥'}
                            open={apiKeyModalVisible}
                            onCancel={() => {
                                setApiKeyModalVisible(false);
                                apiKeyForm.resetFields();
                                setEditingApiKey(null);
                            }}
                            footer={null}
                        >
                            <Form
                                form={apiKeyForm}
                                layout="vertical"
                                onFinish={handleCreateOrUpdateApiKey}
                            >
                                {apiKeyFormItems.map(item => (
                                    <Form.Item
                                        key={item.name}
                                        label={item.label}
                                        name={item.name}
                                        rules={item.rules}
                                    >
                                        <Input />
                                    </Form.Item>
                                ))}
                                <Form.Item>
                                    <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <Button onClick={() => {
                                            setApiKeyModalVisible(false);
                                            apiKeyForm.resetFields();
                                            setEditingApiKey(null);
                                        }}>
                                            取消
                                        </Button>
                                        <Button type="primary" style={{ backgroundColor: "#000000" }} htmlType="submit">
                                            {editingApiKey ? '更新' : '创建'}
                                        </Button>
                                    </Space>
                                </Form.Item>
                            </Form>
                        </Modal>
                    </div>
                )
            }]} />
        </div>
    );
}