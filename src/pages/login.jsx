'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './global.css';
import { checkUser, loginUser, registerUser, getOidcInfo } from '../api/user';
import { message } from "antd";
import { UserManager } from 'oidc-client';

export const Login = () => {
    const [showOidcButtons,setShowOidcButtons] = useState(false);
    const [passwordModal, setPasswordModal] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const navigate = useNavigate();

    // 检查是否已登录
    useEffect(() => {
        const token = localStorage.getItem('Authorization');
        if (token) {
            navigate('/');
        }
    }, [navigate]);

    // 检查 admin 用户是否存在
    useEffect(() => {
        const checkAdminUser = async () => {
            try {
                const params = { username: 'admin' };
                const res = await checkUser(params);
                if (res?.data?.username === 'admin') {
                    setPasswordModal(true);
                }
            } catch (error) {
                console.error(error);
            }
        };
        checkAdminUser();
    }, []);

    // 处理登录表单提交
    const onFinish = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const params = {
            username: formData.get('username'),
            password: formData.get('password'),
        };
        try {
            const response = await loginUser(params);
            if (response.data) {
                const info = response.data;
                localStorage.setItem('Authorization', info.token);
                localStorage.setItem('Username', info.username);
                localStorage.setItem('UserId', info.userId);
                navigate('/');
            }
        } catch (error) {
            message.error('用户名或密码错误');
        }
    };

    // 处理密码初始化表单提交
    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');

        if (password !== confirmPassword) {
            message.open({
                type: 'error',
                content: '两次输入的密码不一致',
            });
            return;
        }

        try {
            const params = {
                userid: 'admin',
                username: 'admin',
                email: 'admin@qq.com',
                phone: '18888888888',
                password: password,
                role: 'admin',
            };
            await registerUser(params);
            handleHideModal();
            window.location.reload();
        } catch (error) {
            console.error(error);
        }
    };

    const handleOidcLogin = async () => {
        try {
            const res = await getOidcInfo();
            if (res) {
                if (res.data.authType !== 2) {
                    message.error('OIDC 未启用，请联系管理员');
                    return;
                }

                const oidcConfig = {
                    authority: res.data.upperURI,
                    client_id: res.data.clientID,
                    redirect_uri: res.data.redirectURI,
                    response_type: 'code',
                    scope: 'openid profile email',
                };
                const userManager = new UserManager(oidcConfig);
                userManager.signinRedirect();
            }
        } catch (error) {
            console.error('获取 OIDC 信息失败:', error);
        }
    }

    // 显示/隐藏模态框
    const handleShowModal = () => setIsModalVisible(true);
    const handleHideModal = () => setIsModalVisible(false);

    // 示例插画组件（你可以替换成自己的 SVG 或 Icon 组件）
    const Illustration1 = () => (
        <svg className="w-16 h-16 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
    );

    const Illustration2 = () => (
        <svg className="w-16 h-16 text-gray-300" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    );

    return (
        <div className="min-h-screen flex bg-black text-white">
            {/* 左侧插画区 */}
            <div className="hidden md:flex w-1/2 flex-col justify-center items-center bg-black p-12 space-y-8">
                <Illustration1 />
                <h2 className="text-3xl tracking-wide font-medium">WatchAlert 告警引擎</h2>
                <p className="text-gray-400 max-w-md text-center">
                    实时监控 · 安全可靠 · 快速部署
                </p>
                <Illustration2 />
            </div>

            {/* 右侧登录区域 */}
            <div className="w-full md:w-1/2 flex items-center justify-center px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white text-black rounded-2xl shadow-xl w-full max-w-md p-8"
                >
                    <h1 className="text-2xl font-medium mb-2">欢迎回来</h1>
                    <p className="text-gray-600 mb-8">请登录以继续使用 WatchAlert</p>
                    {!showOidcButtons ? (
                            <div>
                                <form onSubmit={onFinish} className="space-y-6">
                                    <div>
                                        <input
                                            type="text"
                                            name="username"
                                            placeholder="用户名"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="密码"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <label className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="form-checkbox h-4 w-4 text-black rounded border-gray-300"
                                            />
                                            <span className="text-sm text-gray-600">记住我</span>
                                        </label>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
                                    >
                                        登录
                                    </button>
                                    {!passwordModal && (
                                        <button
                                            type="button"
                                            onClick={handleShowModal}
                                            className="text-sm text-gray-600 hover:text-black underline mt-4"
                                        >
                                            ➡️ 点击初始化 admin 密码
                                        </button>
                                    )}
                                </form>
                                <p className="text-black text-center text-sm py-3 rounded-lg" onClick={()=> setShowOidcButtons(true)}>Login using SSO service</p>
                            </div>
                        ):(
                            <div>
                                <button onClick={handleOidcLogin}
                                    className="w-full py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-100 transition-colors text-center"
                                >
                                    Login with Oidc
                                </button>
                                <p className="text-black text-center text-sm py-3 rounded-lg" onClick={()=> setShowOidcButtons(false)}>Login as administrator</p>
                            </div>
                        )
                    }
                </motion.div>
            </div>

            {/* 密码初始化模态框 */}
            {isModalVisible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm"
                >
                    <div className="bg-white text-black p-8 rounded-xl shadow-2xl max-w-md w-full">
                        <h2 className="text-2xl font-medium mb-6">设置管理员密码</h2>
                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="init-password" className="block text-sm font-medium text-gray-700 mb-1">
                                    设置密码
                                </label>
                                <input
                                    type="password"
                                    id="init-password"
                                    name="password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                                    确认密码
                                </label>
                                <input
                                    type="password"
                                    id="confirm-password"
                                    name="confirm-password"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleHideModal}
                                    className="px-4 py-2 text-gray-600 hover:text-black transition"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition"
                                >
                                    提交
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}
        </div>
    );
};