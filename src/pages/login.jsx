'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './global.css';
import { checkUser, loginUser, registerUser, getOidcInfo } from '../api/user';
import { message } from "antd";
import { UserManager } from 'oidc-client';

export const Login = () => {
    const [showOidcButtons, setShowOidcButtons] = useState(false);
    const [adminExists, setAdminExists] = useState(null); // null: 加载中, false: 不存在, true: 存在
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
                console.log(res?.data);
                // 返回 'ok' 表示用户存在
                setAdminExists(res?.data === 'ok');
            } catch (error) {
                console.error(error);
                setAdminExists(false);
            }
        };
        checkAdminUser();
    }, []);

    // 处理普通登录表单提交
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

    // 处理密码初始化并自动登录（admin 不存在时）
    const handleInitAndLogin = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.target);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirm-password');

        if (password !== confirmPassword) {
            message.error('两次输入的密码不一致');
            return;
        }

        try {
            // 1. 注册 admin 用户
            await registerUser({
                userid: 'admin',
                username: 'admin',
                email: 'admin@qq.com',
                phone: '18888888888',
                password: password,
                role: 'admin',
            });
            
            // 2. 自动登录
            const loginResponse = await loginUser({
                username: 'admin',
                password: password,
            });
            
            if (loginResponse.data) {
                const info = loginResponse.data;
                localStorage.setItem('Authorization', info.token);
                localStorage.setItem('Username', info.username);
                localStorage.setItem('UserId', info.userId);
                message.success('初始化成功，已自动登录');
                navigate('/');
            }
        } catch (error) {
            console.error(error);
            message.error('初始化失败，请稍后重试');
        }
    };

    const handleOidcLogin = async () => {
        try {
            const res = await getOidcInfo();
            if (res?.data?.authType !== 2) {
                message.error('OIDC 未启用，请联系管理员');
                return;
            }

            const oidcConfig = {
                authority: res?.data?.upperURI,
                client_id: res?.data?.clientID,
                client_secret: res?.data?.clientSecret,
                redirect_uri: res?.data?.redirectURI,
                response_type: 'code',
                scope: 'openid profile email',
            };
            const userManager = new UserManager(oidcConfig);
            userManager.signinRedirect();
        } catch (error) {
            console.error('获取 OIDC 信息失败:', error);
        }
    }

    // 示例插画组件
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
                    
                    {adminExists === null ? (
                        // 加载中状态
                        <div className="text-center text-gray-500 py-8">加载中...</div>
                    ) : !adminExists ? (
                        // ✅ admin 不存在：显示初始化密码表单（样式保持原结构）
                        <form onSubmit={handleInitAndLogin} className="space-y-6">
                            <div>
                                <input
                                    type="text"
                                    name="username"
                                    value="admin"
                                    readOnly
                                    placeholder="用户名"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-all bg-gray-50"
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    name="password"
                                    placeholder="设置密码"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <input
                                    type="password"
                                    name="confirm-password"
                                    placeholder="确认密码"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-black transition-all"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                初始化并登陆
                            </button>
                        </form>
                    ) : !showOidcButtons ? (
                        // ✅ admin 存在：显示普通登录表单（保持原逻辑）
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
                            </form>
                            <p className="text-black text-center text-sm py-3 rounded-lg cursor-pointer hover:underline" onClick={()=> setShowOidcButtons(true)}>Login using SSO service</p>
                        </div>
                    ) : (
                        // OIDC 登录选项
                        <div>
                            <button 
                                onClick={handleOidcLogin}
                                className="w-full py-3 border border-gray-300 text-black rounded-lg hover:bg-gray-100 transition-colors text-center"
                            >
                                Login with Oidc
                            </button>
                            <p className="text-black text-center text-sm py-3 rounded-lg cursor-pointer hover:underline" onClick={()=> setShowOidcButtons(false)}>Login as administrator</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
};