import { Avatar, Form, Input, Button, message } from "antd";
import React, { useEffect, useState } from "react";
import { getUserInfo, updateUser } from "../../api/user";

export default function Profile() {
    const [userInfo, setUserInfo] = useState(null);
    const [isEditing, setIsEditing] = useState(false); // 控制编辑模式的状态
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUserInfo();
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

    return (
        <div className="container mx-auto p-4 mt-10">
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
        </div>
    );
}