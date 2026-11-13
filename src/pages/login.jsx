'use client'
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './global.css';
import { checkUser, loginUser, registerUser, getOidcInfo } from '../api/user';
import { message, Result, Button } from "antd";
import { UserManager } from 'oidc-client';

// 内联小图标（登录表单用）
const UserIcon = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7A7A8C" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
);

const LockIcon = ({ active }) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={active ? "#E3C27E" : "#7A7A8C"} strokeWidth="2">
        <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
);

// 品牌区特性项
const FeatureItem = ({ iconBg, iconBorder, iconColor, icon, title, desc }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
            background: iconBg, border: `0.5px solid ${iconBorder}`,
            display: "flex", alignItems: "center", justifyContent: "center",
        }}>
            {icon}
        </div>
        <div>
            <p style={{ color: "#D8D8E2", fontSize: 13, fontWeight: 500, margin: 0 }}>{title}</p>
            <p style={{ color: "#7A7A8C", fontSize: 12, margin: 0 }}>{desc}</p>
        </div>
    </div>
);

// 品牌 Logo 图标（盾牌 + 对勾）
const BrandLogo = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2L21 7v6c0 5-3.8 8.4-9 9-5.2-.6-9-4-9-9V7l9-5z" fill="#fff" opacity="0.92" />
        <path d="M8.5 12.2l2.4 2.4 4.6-4.8" stroke="#C69344" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
);

export const Login = () => {
    const [showOidcButtons, setShowOidcButtons] = useState(false);
    const [adminExists, setAdminExists] = useState(null); // null: 加载中, false: 不存在, true: 存在
    const navigate = useNavigate();
    const [serviceError, setServiceError] = useState(false)
    const [serviceErrorMsg, setServiceErrorMsg] = useState("服务暂时不可用，请稍后重试或联系管理员") // 新增：服务异常详细信息

    // 检查是否已登录
    useEffect(() => {
        const token = localStorage.getItem('Authorization');
        if (token) {
            const redirectPath = localStorage.getItem('redirectPath') || '/';
            localStorage.removeItem('redirectPath');
            navigate(redirectPath);
        }
    }, [navigate]);

    // 检查 admin 用户是否存在
    useEffect(() => {
        const checkAdminUser = async () => {
            try {
                const params = { identifier: 'admin' };
                const res = await checkUser(params);
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
            identifier: formData.get('identifier'),
            password: formData.get('password'),
        };
        try {
            const response = await loginUser(params);
            if (response.data) {
                const info = response.data;
                localStorage.setItem('Authorization', info.token);
                localStorage.setItem('Identifier', info.identifier);
                localStorage.setItem('UserId', info.userId);
                const redirectPath = localStorage.getItem('redirectPath') || '/';
                localStorage.removeItem('redirectPath');
                navigate(redirectPath);
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
                identifier: 'admin',
                password: password,
            });

            if (loginResponse.data) {
                const info = loginResponse.data;
                localStorage.setItem('Authorization', info.token);
                localStorage.setItem('Identifier', info.identifier);
                localStorage.setItem('UserId', info.userId);
                message.success('初始化成功，已自动登录');
                const redirectPath = localStorage.getItem('redirectPath') || '/';
                localStorage.removeItem('redirectPath');
                navigate(redirectPath);
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

    // 错误组件 - 区分认证错误和服务异常
    const SystemErrorScreen = () => {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: "linear-gradient(135deg, #000000 0%, #1a1a1a 100%)",
                }}
            >
                <Result
                    status="error"
                    title={<span style={{ color: "#FFFFFF" }}>服务异常</span>}
                    subTitle={<span style={{ color: "#CCCCCC" }}>{serviceErrorMsg}</span>}
                    extra={[
                        <Button
                            type="primary"
                            key="retry"
                            onClick={() => {
                                setServiceErrorMsg("服务暂时不可用，请稍后重试或联系管理员")
                                setServiceError(true)
                                // 直接刷新页面
                                window.location.reload()
                            }}
                            style={{
                                background: "linear-gradient(135deg, rgb(255, 203, 125) 0%, rgb(167, 135, 83) 100%)",
                                borderColor: "#FF9900",
                                color: "#000",
                                fontWeight: "600",
                                boxShadow: "0 4px 12px rgba(255, 153, 0, 0.3)",
                                border: "none"
                            }}
                        >
                            重试
                        </Button>
                    ]}
                />
            </div>
        )
    }

    if (serviceError) {
        return <SystemErrorScreen />
    }

    return (
        <div className="wa-login min-h-screen flex bg-black text-white">
            <style>{`
                .wa-brand {
                    position: relative;
                    overflow: hidden;
                    width: 55%;
                    flex-direction: column;
                    justify-content: center;
                    padding: 56px 48px 56px 128px;
                    background: #0a0a0f;
                }
                .wa-glow { position: absolute; border-radius: 50%; pointer-events: none; }
                .wa-glow-1 { top: -80px; right: -60px; width: 340px; height: 340px; background: radial-gradient(circle, rgba(217,169,79,0.18) 0%, transparent 70%); }
                .wa-glow-2 { bottom: -60px; left: -40px; width: 300px; height: 300px; background: radial-gradient(circle, rgba(198,147,68,0.14) 0%, transparent 70%); }
                .wa-grid {
                    position: absolute; inset: 0;
                    background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
                    background-size: 44px 44px;
                }
                .wa-brand-content { position: relative; }
                .wa-card {
                    background: #0a0a0f;
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 16px;
                    padding: 32px 28px;
                    width: 100%;
                    max-width: 420px;
                }
                .wa-field { margin-bottom: 18px; }
                .wa-label { color: #8E8EA0; font-size: 12px; margin: 0 0 6px; }
                .wa-input-wrap {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.14);
                    border-radius: 10px;
                    padding: 11px 14px;
                    display: flex; align-items: center; gap: 10px;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .wa-input-wrap:focus-within {
                    border-color: rgba(217,169,79,0.75);
                    box-shadow: 0 0 0 3px rgba(217,169,79,0.14);
                }
                .wa-input-wrap svg { flex-shrink: 0; }
                .wa-input {
                    flex: 1; background: transparent; border: none; outline: none;
                    color: #E4E4EE; font-size: 14px; min-width: 0;
                }
                .wa-input::placeholder { color: #5A5A6C; }
                .wa-input[readonly] { color: #8E8EA0; }
                .wa-btn {
                    width: 100%;
                    background: linear-gradient(135deg, #E9CB85 0%, #C69344 100%);
                    border: none; border-radius: 10px; padding: 12px;
                    color: #201709; font-size: 14px; font-weight: 500;
                    cursor: pointer; letter-spacing: 4px;
                    transition: transform 0.15s, filter 0.15s, box-shadow 0.15s;
                }
                .wa-btn:hover {
                    transform: translateY(-1px);
                    filter: brightness(1.06);
                    box-shadow: 0 6px 16px rgba(217,169,79,0.3);
                }
                .wa-btn:active { transform: translateY(0); }
                .wa-oidc-btn {
                    width: 100%; padding: 12px; border-radius: 10px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.14);
                    color: #E4E4EE; font-size: 14px; cursor: pointer;
                    transition: background 0.2s, border-color 0.2s;
                }
                .wa-oidc-btn:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); }
                .wa-link { color: #8E8EA0; text-align: center; font-size: 13px; padding: 16px 0 0; margin: 0; cursor: pointer; transition: color 0.2s; }
                .wa-link:hover { color: #E3C27E; text-decoration: underline; }
                .wa-link .wa-link-arrow { color: #D9A94F; }
                .wa-copyright { color: #5A5A6C; font-size: 11px; text-align: center; margin: 24px 0 0; }
                @media (max-width: 1023px) { .wa-right { width: 100% !important; } }
            `}</style>

            {/* 左侧品牌区（小屏隐藏） */}
            <div className="wa-brand hidden lg:flex">
                <div className="wa-glow wa-glow-1" />
                <div className="wa-glow wa-glow-2" />
                <div className="wa-grid" />

                <div className="wa-brand-content">
                    {/* 品牌标识 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
                        <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: "linear-gradient(135deg, #E9CB85 0%, #C69344 100%)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                            <BrandLogo />
                        </div>
                        <div>
                            <p style={{ color: "#EDEDF2", fontSize: 18, fontWeight: 500, margin: 0, letterSpacing: "0.5px" }}>WatchAlert</p>
                            <p style={{ color: "#8E8EA0", fontSize: 12, margin: 0 }}>Cloud-Native Alerting Center</p>
                        </div>
                    </div>

                    {/* 主标语 */}
                    <h1 style={{ color: "#F2F2F7", fontSize: 28, fontWeight: 500, lineHeight: 1.35, margin: "0 0 14px" }}>
                        让每一条告警<br />都被及时看见与处理
                    </h1>
                    <p style={{ color: "#9C9CB0", fontSize: 13, lineHeight: 1.8, margin: "0 0 40px", maxWidth: 360 }}>
                        多数据源统一接入 · 智能聚合降噪 · 全渠道即时通知，为运维与研发团队提供一站式故障响应平台。
                    </p>

                    {/* 特性点 */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        <FeatureItem
                            iconBg="rgba(217,169,79,0.14)" iconBorder="rgba(217,169,79,0.4)"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E3C27E" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M12 5V3M12 21v-2M5 12H3M21 12h-2" /></svg>}
                            title="多源监控接入"
                            desc="Prometheus / ElasticSearch / Grafana 等 10+ 数据源"
                        />
                        <FeatureItem
                            iconBg="rgba(217,169,79,0.08)" iconBorder="rgba(217,169,79,0.3)"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D9A94F" strokeWidth="2"><path d="M3 12h4l3-8 4 16 3-8h4" /></svg>}
                            title="智能聚合降噪"
                            desc="相同规则自动聚合，故障分级处理不遗漏"
                        />
                        <FeatureItem
                            iconBg="rgba(198,147,68,0.12)" iconBorder="rgba(227,194,126,0.35)"
                            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C69344" strokeWidth="2"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" /></svg>}
                            title="全渠道即时通知"
                            desc="钉钉 / 企微 / 飞书 / 邮件 / 电话，秒级触达值班人"
                        />
                    </div>
                </div>
            </div>

            {/* 右侧登录区 */}
            <div
                className="wa-right w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-12"
                style={{ background: "#0a0a0f" }}
            >
                <div className="wa-card">
                    <p style={{ color: "#F2F2F7", fontSize: 20, fontWeight: 500, margin: "0 0 6px" }}>欢迎回来</p>
                    <p style={{ color: "#8E8EA0", fontSize: 13, margin: "0 0 28px" }}>请登录以继续使用 WatchAlert</p>

                    {adminExists === null ? (
                        // 加载中状态
                        <div style={{ color: "#8E8EA0", textAlign: "center", padding: "32px 0", fontSize: 13 }}>
                            加载中...
                        </div>
                    ) : !adminExists ? (
                        // ✅ admin 不存在：显示初始化密码表单
                        <form onSubmit={handleInitAndLogin}>
                            <div className="wa-field">
                                <p className="wa-label">管理员账号</p>
                                <div className="wa-input-wrap">
                                    <UserIcon />
                                    <input
                                        type="text"
                                        name="identifier"
                                        value="admin"
                                        readOnly
                                        placeholder="用户名"
                                        className="wa-input"
                                    />
                                </div>
                            </div>
                            <div className="wa-field">
                                <p className="wa-label">设置密码</p>
                                <div className="wa-input-wrap">
                                    <LockIcon />
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="请输入密码"
                                        className="wa-input"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="wa-field">
                                <p className="wa-label">确认密码</p>
                                <div className="wa-input-wrap">
                                    <LockIcon />
                                    <input
                                        type="password"
                                        name="confirm-password"
                                        placeholder="请再次输入密码"
                                        className="wa-input"
                                        required
                                    />
                                </div>
                            </div>
                            <button type="submit" className="wa-btn">初始化并登录</button>
                        </form>
                    ) : !showOidcButtons ? (
                        // ✅ admin 存在：显示普通登录表单
                        <div>
                            <form onSubmit={onFinish}>
                                <div className="wa-field">
                                    <p className="wa-label">用户名 / 邮箱 / 手机号</p>
                                    <div className="wa-input-wrap">
                                        <UserIcon />
                                        <input
                                            type="text"
                                            name="identifier"
                                            placeholder="请输入用户名"
                                            className="wa-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="wa-field">
                                    <p className="wa-label">密码</p>
                                    <div className="wa-input-wrap">
                                        <LockIcon />
                                        <input
                                            type="password"
                                            name="password"
                                            placeholder="请输入密码"
                                            className="wa-input"
                                            required
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="wa-btn">登录</button>
                            </form>
                            <p className="wa-link" onClick={() => setShowOidcButtons(true)}>
                                使用 SSO 单点登录 <span className="wa-link-arrow">→</span>
                            </p>
                        </div>
                    ) : (
                        // OIDC 登录选项
                        <div>
                            <button onClick={handleOidcLogin} className="wa-oidc-btn">
                                Login with Oidc
                            </button>
                            <p className="wa-link" onClick={() => setShowOidcButtons(false)}>
                                使用管理员账号登录 <span className="wa-link-arrow">←</span>
                            </p>
                        </div>
                    )}
                </div>

                <p className="wa-copyright">© 2026 WatchAlert · Open Source Alerting Platform</p>
            </div>
        </div>
    );
};
