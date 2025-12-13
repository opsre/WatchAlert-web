import React, {useEffect, useState} from 'react';
import {
    UserOutlined,
    BellOutlined,
    PieChartOutlined,
    NotificationOutlined,
    CalendarOutlined,
    DashboardOutlined,
    DeploymentUnitOutlined,
    AreaChartOutlined,
    FileDoneOutlined,
    SettingOutlined,
    ExceptionOutlined,
    ApiOutlined, TeamOutlined, DownOutlined, LogoutOutlined, NodeIndexOutlined
} from '@ant-design/icons';
import {Link, useNavigate} from 'react-router-dom';
import {Menu, Layout, Typography, Dropdown, message, Spin, theme, Popover, Avatar, Divider} from 'antd';
import logoIcon from "../../img/logo.svg";
import {getUserInfo} from "../../api/user";
import {getTenantList} from "../../api/tenant";

const { Sider } = Layout;

const adminMenuItems = [
    { key: '1', path: '/', icon: <AreaChartOutlined />, label: '概览' },
    {
        key: '2',
        icon: <BellOutlined />,
        label: '告警管理',
        children: [
            { key: '2-1', path: '/ruleGroup', label: '告警规则' },
            { key: '2-5', path: '/tmplType/Metrics/group', label: '规则模版' },
            { key: '2-6', path: '/subscribes', label: '告警订阅' }
        ]
    },
    { key: '12', path: '/faultCenter', icon: <ExceptionOutlined />, label: '故障中心' },
    {
        key: '3',
        icon: <NotificationOutlined />,
        label: '通知管理',
        children: [
            { key: '3-1', path: '/noticeObjects', label: '通知对象' },
            { key: '3-2', path: '/noticeTemplate', label: '通知模版' },
            { key: '3-3', path: '/noticeRecords', label: '通知记录' }
        ]
    },
    { key: '13', path: '/topology', icon: <NodeIndexOutlined />, label: '服务拓扑' },
    { key: '4', path: '/dutyManage', icon: <CalendarOutlined />, label: '值班中心' },
    {
        key: '11',
        icon: <ApiOutlined />,
        label: '网络分析',
        children: [
            { key: '11-1', path: '/probing', label: '拨测任务' },
            { key: '11-2', path: '/onceProbing', label: '即时拨测' }
        ]
    },
    { key: '6', path: '/datasource', icon: <PieChartOutlined />, label: '数据源' },
    { key: '8', path: '/folders', icon: <DashboardOutlined />, label: '仪表盘' },
    {
        key: '5',
        icon: <UserOutlined />,
        label: '人员组织',
        children: [
            { key: '5-1', path: '/user', label: '用户管理' },
            { key: '5-2', path: '/userRole', label: '角色管理' }
        ]
    },
    { key: '7', path: '/tenants', icon: <DeploymentUnitOutlined />, label: '租户管理' },
    { key: '9', path: '/auditLog', icon: <FileDoneOutlined />, label: '日志审计' },
    { key: '10', path: '/settings', icon: <SettingOutlined />, label: '系统设置' }
];

const userMenuItems = [
    { key: '1', path: '/', icon: <AreaChartOutlined />, label: '概览' },
    {
        key: '2',
        icon: <BellOutlined />,
        label: '告警管理',
        children: [
            { key: '2-1', path: '/ruleGroup', label: '告警规则' },
            { key: '2-5', path: '/tmplType/Metrics/group', label: '规则模版' },
            { key: '2-6', path: '/subscribes', label: '告警订阅' }
        ]
    },
    { key: '12', path: '/faultCenter', icon: <ExceptionOutlined />, label: '故障中心' },
    {
        key: '3',
        icon: <NotificationOutlined />,
        label: '通知管理',
        children: [
            { key: '3-1', path: '/noticeObjects', label: '通知对象' },
            { key: '3-2', path: '/noticeTemplate', label: '通知模版' },
            { key: '3-3', path: '/noticeRecords', label: '通知记录' }
        ]
    },
    { key: '13', path: '/topology', icon: <NodeIndexOutlined />, label: '服务拓扑' },
    { key: '4', path: '/dutyManage', icon: <CalendarOutlined />, label: '值班中心' },
    {
        key: '11',
        icon: <ApiOutlined />,
        label: '网络分析',
        children: [
            { key: '11-1', path: '/probing', label: '拨测任务' },
            { key: '11-2', path: '/onceProbing', label: '即时拨测' }
        ]
    },
    { key: '6', path: '/datasource', icon: <PieChartOutlined />, label: '数据源' },
    { key: '8', path: '/folders', icon: <DashboardOutlined />, label: '仪表盘' },
];

export const ComponentSider = () => {
    const navigate = useNavigate();
    const [selectedMenuKey, setSelectedMenuKey] = useState('');
    const [userInfo, setUserInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tenantList, setTenantList] = useState([])
    const [getTenantStatus, setTenantStatus] = useState(null)

    const {
        token: { colorBgContainer },
    } = theme.useToken()

    const handleMenuClick = (key, path) => {
        if (path) {
            setSelectedMenuKey(key);
            navigate(path);
        }
    };

    const convertToMenuItems = (items) => {
        return items.map(item => {
            if (item.children) {
                return {
                    key: item.key,
                    icon: item.icon,
                    label: item.label,
                    children: item.children.map(child => ({
                        key: child.key,
                        label: child.label,
                        onClick: () => handleMenuClick(child.key, child.path),
                    })),
                };
            }
            return {
                key: item.key,
                icon: item.icon,
                label: item.label,
                onClick: () => handleMenuClick(item.key, item.path),
            };
        });
    };

    const handleLogout = () => {
        localStorage.clear()
        navigate("/login")
    }

    const userPopoverMenuItems = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: <Link to="/profile">个人信息</Link>,
        },
        {
            type: 'divider',
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: '退出登录',
            danger: true,
            onClick: handleLogout,
        },
    ]

    useEffect(() => {
        fetchUserInfo()
        
        // 添加现代化黑橙主题样式
        const style = document.createElement('style');
        style.textContent = `
            /* 主菜单项样式 */
            .ant-menu-dark .ant-menu-item {
                color: #CCCCCC !important;
                border-radius: 8px !important;
                margin: 4px 8px !important;
                padding: 0 16px !important;
                height: 44px !important;
                line-height: 44px !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            /* 选中状态 - 橙色渐变背景 */
            .ant-menu-dark .ant-menu-item-selected {
                background: linear-gradient(135deg, #FF9900 0%, #FFB84D 100%) !important;
                color: #000 !important;
                font-weight: 600 !important;
                box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3) !important;
            }
            
            .ant-menu-dark .ant-menu-item-selected .ant-menu-item-icon {
                color: #000 !important;
            }
            
            /* 悬停效果 */
            .ant-menu-dark .ant-menu-item:hover:not(.ant-menu-item-selected) {
                background: rgba(255, 153, 0, 0.1) !important;
                color: #FF9900 !important;
                transform: translateX(4px) !important;
            }
            
            .ant-menu-dark .ant-menu-item:hover:not(.ant-menu-item-selected) .ant-menu-item-icon {
                color: #FF9900 !important;
            }
            
            /* 子菜单样式 */
            .ant-menu-dark .ant-menu-submenu-title {
                color: #CCCCCC !important;
                border-radius: 8px !important;
                margin: 4px 8px !important;
                padding: 0 16px !important;
                height: 44px !important;
                line-height: 44px !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
            }
            
            .ant-menu-dark .ant-menu-submenu-selected > .ant-menu-submenu-title {
                background: linear-gradient(135deg, #FF9900 0%, #FFB84D 100%) !important;
                color: #000 !important;
                font-weight: 600 !important;
                box-shadow: 0 4px 12px rgba(255, 153, 0, 0.3) !important;
            }
            
            .ant-menu-dark .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-submenu-arrow {
                color: #000 !important;
            }
            
            .ant-menu-dark .ant-menu-submenu-title:hover:not(.ant-menu-submenu-selected) {
                background: rgba(255, 153, 0, 0.1) !important;
                color: #FF9900 !important;
                transform: translateX(4px) !important;
            }
            
            .ant-menu-dark .ant-menu-submenu-title:hover:not(.ant-menu-submenu-selected) .ant-menu-submenu-arrow {
                color: #FF9900 !important;
            }
            
            /* 子菜单内容 */
            .ant-menu-dark .ant-menu-sub {
                background: rgba(0, 0, 0, 0.8) !important;
                border-radius: 8px !important;
                margin: 4px 16px !important;
                padding: 8px 0 !important;
                backdrop-filter: blur(10px) !important;
            }
            
            .ant-menu-dark .ant-menu-sub .ant-menu-item {
                margin: 2px 8px !important;
                padding-left: 24px !important;
                height: 36px !important;
                line-height: 36px !important;
                font-size: 13px !important;
            }
            
            /* 滚动条样式 */
            .ant-layout-sider-children::-webkit-scrollbar {
                width: 6px !important;
            }
            
            .ant-layout-sider-children::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1) !important;
                border-radius: 3px !important;
            }
            
            .ant-layout-sider-children::-webkit-scrollbar-thumb {
                background: #FF9900 !important;
                border-radius: 3px !important;
            }
            
            .ant-layout-sider-children::-webkit-scrollbar-thumb:hover {
                background: #FFB84D !important;
            }
        `;
        document.head.appendChild(style);
        
        // 清理函数
        return () => {
            if (document.head.contains(style)) {
                document.head.removeChild(style);
            }
        };
    }, [])

    const fetchUserInfo = async () => {
        try {
            const res = await getUserInfo()
            setUserInfo(res.data)

            if (res.data.userid) {
                await fetchTenantList(res.data.userid)
            }

            setLoading(false)
        } catch (error) {
            console.error("Failed to fetch user info:", error)
            window.localStorage.removeItem("Authorization")
            navigate("/login")
        }
    }

    const fetchTenantList = async (userid) => {
        try {
            const params = {
                userId: userid,
            }
            const res = await getTenantList(params)

            if (res.data === null || res.data.length === 0) {
                message.error("该用户没有可用租户")
                return
            }

            const opts = res.data.map((key, index) => ({
                label: key.name,
                value: key.id,
                index: index,
            }))

            setTenantList(opts)

            if (getTenantName() === null && opts.length > 0) {
                localStorage.setItem("TenantName", opts[0].label)
                localStorage.setItem("TenantID", opts[0].value)
                localStorage.setItem("TenantIndex", opts[0].index)
            }

            setTenantStatus(true)
        } catch (error) {
            console.error("Failed to fetch tenant list:", error)
            localStorage.clear()
            message.error("获取租户错误, 退出登录")
        }
    }

    const getTenantName = () => {
        return localStorage.getItem("TenantName")
    }

    const getTenantIndex = () => {
        return localStorage.getItem("TenantIndex")
    }

    const changeTenant = (c) => {
        localStorage.setItem("TenantIndex", c.key)
        if (c.item.props.name) {
            localStorage.setItem("TenantName", c.item.props.name)
        }
        if (c.item.props.value) {
            localStorage.setItem("TenantID", c.item.props.value)
        }

        setSelectedMenuKey('1')
        navigate('/')
        window.location.reload();
    }

    const tenantMenuItems = tenantList.map((item) => ({
        key: item.index.toString(),
        label: item.label,
        name: item.label,
        value: item.value,
    }))

    if (loading || !getTenantStatus) {
        return (
            <div
                style={{
                    height: "100vh",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    background: colorBgContainer,
                }}
            >
                <Spin size="large">
                    <div style={{ padding: '50px' }}>加载中...</div>
                </Spin>
            </div>
        )
    }

    return (
        <Sider
            style={{
                overflow: 'hidden',
                height: '100%',
                background: '#000',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
            }}
            theme="dark"
        >
            {/* 顶部Logo和租户选择区域 */}
            <div style={{
                padding: '16px 16px 0',
                position: 'sticky',
                top: 0,
                zIndex: 1,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    marginTop: '-70px',
                }}>
                    <img
                        src={logoIcon}
                        alt="WatchAlert Logo"
                        style={{ width: "160px", height: "140px", borderRadius: "8px", marginLeft: "6px" }}
                    />
                </div>

                <Dropdown 
                    menu={{ 
                        items: tenantMenuItems, 
                        selectable: true, 
                        defaultSelectedKeys: [getTenantIndex()],
                        onSelect: changeTenant 
                    }} 
                    trigger={["click"]} 
                    placement="bottomLeft"
                >
                    <div style={{
                        display: 'flex',
                        marginTop: '-40px',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.1)',
                        marginBottom: '16px',
                        ':hover': {
                            background: 'rgba(255, 255, 255, 0.2)',
                        }
                    }}>
                        <TeamOutlined style={{color: '#fff', fontSize: '14px', marginRight: '8px'}}/>
                        <Typography.Text
                            style={{color: '#fff', fontSize: '14px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                            {getTenantName()}
                        </Typography.Text>
                        <DownOutlined style={{color: '#fff', fontSize: '12px'}}/>
                    </div>
                </Dropdown>
            </div>

            <Divider style={{
                margin: '0 16px 16px', 
                background: 'linear-gradient(90deg, transparent 0%, #FF9900 50%, transparent 100%)',
                height: '2px',
                borderRadius: '1px',
                marginLeft: '5px'
            }}/>

            {/* 主内容，预留底部空间 */}
            <div
                style={{
                    textAlign:'left',
                    alignItems: 'flex-start',
                    overflowY: 'auto',
                    flex: 1,
                    height: '76vh',
                    paddingBottom: 70, // 预留底部空间
                }}
            >
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedMenuKey]}
                    style={{ background: 'transparent'}}
                    items={convertToMenuItems(userInfo?.role === 'admin' ? adminMenuItems : userMenuItems)}
                />
            </div>

            {/* 绝对定位底部用户信息 */}
            <div style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                padding: '16px',
                borderTop: '1px solid rgba(255, 153, 0, 0.2)',
                background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, #000 100%)',
                backdropFilter: 'blur(10px)',
            }}>
                <Popover 
                    content={<Menu mode="vertical" items={userPopoverMenuItems} />} 
                    trigger="click" 
                    placement="topRight"
                >
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        cursor: "pointer",
                        padding: '8px',
                        borderRadius: '4px',
                        width: '100%',
                    }}>
                        <Avatar
                            style={{
                                background: "linear-gradient(135deg, #FF9900 0%, #FFB84D 100%)",
                                color: "#000",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                border: "2px solid rgba(255, 153, 0, 0.3)",
                                boxShadow: "0 2px 8px rgba(255, 153, 0, 0.3)"
                            }}
                            size="default"
                        >
                            {userInfo.username ? userInfo.username.charAt(0).toUpperCase() : ""}
                        </Avatar>
                        <div style={{marginLeft: "12px", overflow: 'hidden'}}>
                            <Typography.Text style={{color: "#FFFFFFA6", display: 'block'}}>
                                {userInfo.username}
                            </Typography.Text>
                        </div>
                    </div>
                </Popover>
            </div>
        </Sider>
    );
};