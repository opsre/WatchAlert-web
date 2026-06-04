import {useCallback, useEffect, useMemo, useState} from 'react';
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
    BarChartOutlined,
    ApiOutlined,
    TeamOutlined,
    DownOutlined,
    LogoutOutlined,
    FileTextOutlined,
} from '@ant-design/icons';
import {Link, useNavigate} from 'react-router-dom';
import {Menu, Layout, Typography, Dropdown, message, Spin, theme, Popover, Avatar, Divider} from 'antd';
import logoIcon from "../../img/logo.svg";
import {getUserInfo} from "../../api/user";
import {getTenantList, getTenant} from "../../api/tenant";

const { Sider } = Layout;

const adminMenuItems = [
    // 监控中心
    {
        key: 'group-monitor',
        type: 'group',
        label: '监控中心',
        children: [
            { key: '1', path: '/', icon: <AreaChartOutlined />, label: '概览' },
            { key: '8', path: '/folders', icon: <DashboardOutlined />, label: '仪表盘' },
            {
                key: '2',
                icon: <BellOutlined />,
                label: '告警管理',
                children: [
                    { key: '2-1', path: '/ruleGroup', label: '告警规则' },
                    { key: '2-5', path: '/tmplType/Metrics/group', label: '规则模版' },
                ]
            },
            { key: '12', path: '/faultCenter', icon: <ExceptionOutlined />, label: '故障中心' },
            { key: '2-6', path: '/recordingRules', icon: <FileTextOutlined />, label: '记录规则' },
        ]
    },
    // 通知中心
    {
        key: 'group-notify',
        type: 'group',
        label: '通知中心',
        children: [
            {
                key: '3-1',
                icon: <NotificationOutlined />,
                label: '通知管理',
                path: '/noticeObjects'
            },
            {
                key: '3-2',
                icon: <FileDoneOutlined />,
                label: '通知模版',
                path: '/noticeTemplate'
            },
        ]
    },
    // 数据管理
    {
        key: 'group-data',
        type: 'group',
        label: '数据管理',
        children: [
            { key: '6', path: '/datasource', icon: <PieChartOutlined />, label: '数据源' },
            {
                key: '14',
                icon: <BarChartOutlined />,
                label: '数据分析',
                children: [
                    { key: '14-1', path: '/dataAnalysis', label: '指标查询' },
                ]
            },
            {
                key: '11',
                icon: <ApiOutlined />,
                label: '网络分析',
                children: [
                    { key: '11-1', path: '/probing', label: '拨测任务' },
                    { key: '11-2', path: '/onceProbing', label: '即时拨测' }
                ]
            },
        ]
    },
    // 组织管理
    {
        key: 'group-org',
        type: 'group',
        label: '组织管理',
        children: [
            {
                key: '5',
                icon: <UserOutlined />,
                label: '人员组织',
                children: [
                    { key: '5-1', path: '/user', label: '用户管理' },
                    { key: '5-2', path: '/userRole', label: '角色管理' }
                ]
            },
            { key: '4', path: '/dutyManage', icon: <CalendarOutlined />, label: '值班中心' },
            { key: '7', path: '/tenants', icon: <DeploymentUnitOutlined />, label: '租户管理' },
        ]
    },
    // 系统管理
    {
        key: 'group-system',
        type: 'group',
        label: '系统管理',
        children: [
            { key: '9', path: '/auditLog', icon: <FileDoneOutlined />, label: '日志审计' },
            { key: '10', path: '/settings', icon: <SettingOutlined />, label: '系统设置' },
        ]
    },
];

const userMenuItems = [
    // 监控中心
    {
        key: 'group-monitor',
        type: 'group',
        label: '监控中心',
        children: [
            { key: '1', path: '/', icon: <AreaChartOutlined />, label: '概览' },
            { key: '8', path: '/folders', icon: <DashboardOutlined />, label: '仪表盘' },
            {
                key: '2',
                icon: <BellOutlined />,
                label: '告警管理',
                children: [
                    { key: '2-1', path: '/ruleGroup', label: '告警规则' },
                    { key: '2-5', path: '/tmplType/Metrics/group', label: '规则模版' },
                ]
            },
            { key: '12', path: '/faultCenter', icon: <ExceptionOutlined />, label: '故障中心' },
            { key: '2-6', path: '/recordingRules', icon: <FileTextOutlined />, label: '记录规则' },
        ]
    },
    // 通知中心
    {
        key: 'group-notify',
        type: 'group',
        label: '通知中心',
        children: [
            {
                key: '3-1',
                icon: <NotificationOutlined />,
                label: '通知管理',
                path: '/noticeObjects'
            },
            {
                key: '3-2',
                icon: <FileDoneOutlined />,
                label: '通知模版',
                path: '/noticeTemplate'
            },
        ]
    },
    // 数据管理
    {
        key: 'group-data',
        type: 'group',
        label: '数据管理',
        children: [
            { key: '6', path: '/datasource', icon: <PieChartOutlined />, label: '数据源' },
            {
                key: '14',
                icon: <BarChartOutlined />,
                label: '数据分析',
                children: [
                    { key: '14-1', path: '/dataAnalysis', label: '指标查询' },
                ]
            },
            {
                key: '11',
                icon: <ApiOutlined />,
                label: '网络分析',
                children: [
                    { key: '11-1', path: '/probing', label: '拨测任务' },
                    { key: '11-2', path: '/onceProbing', label: '即时拨测' }
                ]
            },
        ]
    },
    // 组织管理
    {
        key: 'group-org',
        type: 'group',
        label: '组织管理',
        children: [
            { key: '4', path: '/dutyManage', icon: <CalendarOutlined />, label: '值班中心' },
        ]
    },
];

export const ComponentSider = () => {
    const navigate = useNavigate();
    const [selectedMenuKey, setSelectedMenuKey] = useState('');
    const [userInfo, setUserInfo] = useState(null)
    const [loading, setLoading] = useState(true)
    const [tenantList, setTenantList] = useState([])
    const [currentTenant, setCurrentTenant] = useState(null)
    const [getTenantStatus, setTenantStatus] = useState(null)

    const {
        token: { colorBgContainer },
    } = theme.useToken()

    const handleMenuClick = useCallback((key, path) => {
        if (path) {
            setSelectedMenuKey(key);
            navigate(path);
        }
    }, [navigate]);

    const convertToMenuItems = useCallback((items) => {
        const convertItem = (item) => {
            if (item.type === 'group') {
                return {
                    key: item.key,
                    type: 'group',
                    label: item.label,
                    children: item.children.map(child => convertItem(child)),
                };
            }
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
        };
        return items.map(item => convertItem(item));
    }, [handleMenuClick]);

    const menuItems = useMemo(() => {
        let baseMenuItems = userInfo?.role === 'admin' ? adminMenuItems : userMenuItems;
        
        // 如果不是管理员但是是租户管理者，添加租户管理到组织管理分组
        if (userInfo?.role !== 'admin' && userInfo?.username === currentTenant?.manager) {
            baseMenuItems = baseMenuItems.map(group => {
                if (group.key === 'group-org') {
                    return {
                        ...group,
                        children: [
                            ...group.children,
                            { 
                                key: '7', 
                                path: `/tenants/detail/${localStorage.getItem('TenantID')}`, 
                                icon: <DeploymentUnitOutlined />, 
                                label: '租户管理' 
                            }
                        ]
                    };
                }
                return group;
            });
        }
        
        return convertToMenuItems(baseMenuItems);
    }, [userInfo, currentTenant, convertToMenuItems]);

    const handleLogout = () => {
        // 清除本地存储
        localStorage.clear()
        // 显示退出登录提示
        message.success('已退出登录');
        // 延迟跳转到登录页面，确保用户能看到提示
        setTimeout(() => {
            navigate("/login");
        }, 800); // 延迟0.8秒跳转
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
        
        // 添加现代化黑金主题样式
        const style = document.createElement('style');
        style.textContent = `
            /* 主菜单项样式 */
            .ant-menu-dark .ant-menu-item {
                color: #CCCCCC;
                border-radius: 8px;
                margin: 4px 8px;
                padding: 0 16px;
                height: 38px;
                line-height: 38px;
                font-size: 13px;
                transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            /* 选中状态 - 渐变背景 */
            .ant-menu-dark .ant-menu-item-selected {
                background: linear-gradient(135deg, rgb(255, 203, 125) 0%, rgb(167, 135, 83) 100%);
                color: #000;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(167, 135, 83, 0.3);
                transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            .ant-menu-dark .ant-menu-item-selected .ant-menu-item-icon {
                color: #000;
                transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            /* 悬停效果 */
            .ant-menu-dark .ant-menu-item:hover:not(.ant-menu-item-selected) {
                background: rgba(167, 135, 83, 0.1);
                transform: translateX(6px);
                color: rgb(255, 203, 125);
                transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            .ant-menu-dark .ant-menu-item:hover:not(.ant-menu-item-selected) .ant-menu-item-icon {
                color: rgb(255, 203, 125);
                transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            /* 子菜单样式 */
            .ant-menu-dark .ant-menu-submenu-title {
                color: #CCCCCC;
                border-radius: 8px;
                margin: 4px 8px;
                padding: 0 16px;
                height: 38px;
                line-height: 38px;
                font-size: 13px;
                transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            .ant-menu-dark .ant-menu-submenu-selected > .ant-menu-submenu-title {
                background: linear-gradient(135deg, rgb(255, 203, 125) 0%, rgb(167, 135, 83) 100%);
                color: #000;
                font-weight: 600;
                box-shadow: 0 4px 12px rgba(167, 135, 83, 0.3);
                transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            .ant-menu-dark .ant-menu-submenu-selected > .ant-menu-submenu-title .ant-menu-submenu-arrow {
                color: #000;
                transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            .ant-menu-dark .ant-menu-submenu-title:hover:not(.ant-menu-submenu-selected) {
                background: rgba(167, 135, 83, 0.1);
                color: rgb(255, 203, 125);
                transform: translateX(6px);
                transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            .ant-menu-dark .ant-menu-submenu-title:hover:not(.ant-menu-submenu-selected) .ant-menu-submenu-arrow {
                color: rgb(255, 203, 125);
                transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            /* 即使子菜单被选中，父级菜单悬停时仍应有高亮效果 */
            .ant-menu-dark .ant-menu-submenu-selected:hover > .ant-menu-submenu-title {
                background: linear-gradient(135deg, rgb(255, 203, 125) 0%, rgb(167, 135, 83) 100%) !important;
                color: #000;
                transform: translateX(0px);
            }
            
            .ant-menu-dark .ant-menu-submenu-selected:hover > .ant-menu-submenu-title .ant-menu-submenu-arrow {
                color: #000;
            }
            
            /* 子菜单内容 */
            .ant-menu-dark .ant-menu-sub {
                background: rgba(0, 0, 0, 0.8);
                border-radius: 8px;
                margin: 4px 16px;
                padding: 8px 0;
                backdrop-filter: blur(10px);
                transition: all 0.3s ease-in-out;
            }
            
            .ant-menu-dark .ant-menu-sub .ant-menu-item {
                margin: 2px 8px;
                padding-left: 24px;
                height: 32px;
                line-height: 32px;
                font-size: 12px;
                transition: all 0.25s cubic-bezier(0.645, 0.045, 0.355, 1);
            }
            
            /* 滚动条样式 - 显示为覆盖模式，不占用额外空间 */
            .ant-layout-sider-children::-webkit-scrollbar {
                width: 6px;
            }
            
            .ant-layout-sider-children::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                margin: 8px 0;
            }
            
            .ant-layout-sider-children::-webkit-scrollbar-thumb {
                background: rgba(167, 135, 83, 0.5);
                border-radius: 3px;
                transition: background 0.3s ease;
            }
            
            .ant-layout-sider-children::-webkit-scrollbar-thumb:hover {
                background: rgb(255, 203, 125);
            }
            
            /* 侧边栏容器滚动条样式 */
            .sidebar-menu-container::-webkit-scrollbar {
                width: 6px;
            }
            
            .sidebar-menu-container::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                margin: 8px 0;
            }
            
            .sidebar-menu-container::-webkit-scrollbar-thumb {
                background: rgba(167, 135, 83, 0.3);
                border-radius: 3px;
                transition: background 0.3s ease;
            }
            
            .sidebar-menu-container::-webkit-scrollbar-thumb:hover {
                background: rgb(167, 135, 83);
            }
            
            /* 菜单子项动画 */
            .ant-menu-sub.ant-menu-inline {
                overflow: hidden;
                transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
            }
            
            /* 优化滚动体验 - 使滚动更丝滑 */
            .sidebar-menu-container {
                scroll-behavior: smooth;
                overscroll-behavior: contain;
            }
            
            .ant-menu-root {
                overflow-y: auto;
                scroll-behavior: smooth;
            }
            
            /* 启用原生滚动性能优化 */
            .ant-menu-item, .ant-menu-submenu-title {
                will-change: transform;
            }
            
            /* 分组标题样式 */
            .ant-menu-dark .ant-menu-item-group-title {
                color: rgba(255, 255, 255, 0.45);
                font-size: 11px;
                font-weight: normal;
                text-transform: uppercase;
                letter-spacing: 1px;
                padding: 12px 16px 4px;
                margin-top: 4px;
            }
            
            .ant-menu-dark .ant-menu-item-group:first-child .ant-menu-item-group-title {
                margin-top: 0;
                padding-top: 8px;
            }
            
            .ant-menu-dark .ant-menu-item-group-list .ant-menu-item {
                margin: 2px 8px;
            }
            
            .ant-menu-dark .ant-menu-item-group-list .ant-menu-submenu-title {
                margin: 2px 8px;
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
            setUserInfo(res?.data)

            if (res?.data?.userid) {
                await fetchTenantList(res?.data?.userid)
                // 获取当前租户信息
                await fetchCurrentTenantInfo()
            }

            setLoading(false)
        } catch (error) {
            console.error("Failed to fetch user info:", error)
            // 清除认证信息
            window.localStorage.removeItem("Authorization")
            // 显示错误提示
            message.error('获取用户信息失败，请重新登录');
            // 延迟跳转到登录页面，确保用户能看到提示
            setTimeout(() => {
                navigate("/login");
            }, 1000); // 延迟1秒跳转
        }
    }

    const fetchTenantList = async (userid) => {
        try {
            const params = {
                userId: userid,
            }
            const res = await getTenantList(params)

            if (res?.data === null || res?.data?.length === 0) {
                message.error("该用户没有可用租户")
                return
            }

            const opts = res?.data?.map((key, index) => ({
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
            // 清除本地存储
            localStorage.clear()
            // 显示错误提示
            message.error("获取租户错误, 退出登录")
            // 延迟跳转到登录页面，确保用户能看到提示
            setTimeout(() => {
                navigate("/login");
            }, 1000); // 延迟1秒跳转
        }
    }

    const fetchCurrentTenantInfo = async () => {
        try {
            const tenantId = localStorage.getItem("TenantID");
            if (tenantId) {
                const params = {
                    id: tenantId,
                };
                const res = await getTenant(params);
                setCurrentTenant(res?.data);
            }
        } catch (error) {
            console.error("Failed to fetch current tenant info:", error);
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
                marginLeft: '10px',
                position: 'sticky',
                top: 0,
                zIndex: 1,
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                    marginLeft: '30px'
                }}>
                    <img
                        src={logoIcon}
                        alt="WatchAlert Logo"
                        style={{ width: "150px", height: "auto" }}
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
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(167, 135, 83, 0.15)',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(167, 135, 83, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(167, 135, 83, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(167, 135, 83, 0.15)';
                    }}
                    >
                        <TeamOutlined style={{color: 'rgb(255, 203, 125)', fontSize: '14px', marginRight: '8px'}}/>
                        <Typography.Text
                            style={{color: '#fff', fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {getTenantName()}
                        </Typography.Text>
                        <DownOutlined style={{color: 'rgba(255, 255, 255, 0.5)', fontSize: '10px'}}/>
                    </div>
                </Dropdown>
            </div>

            <Divider style={{
                margin: '0 16px 12px', 
                background: 'linear-gradient(90deg, transparent 0%, rgb(167, 135, 83) 50%, transparent 100%)',
                height: '1px',
                borderRadius: '1px',
                minWidth: 'auto',
                width: 'calc(100% - 32px)',
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
                    /* 自定义滚动条样式 */
                    msOverflowStyle: 'auto',  /* IE 和 Edge */
                    scrollbarWidth: 'thin',  /* Firefox */
                }}
                className="sidebar-menu-container"
            >
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[selectedMenuKey]}
                    style={{ background: 'transparent'}}
                    items={menuItems}
                    expandIcon={({ isActive }) => (
                        <svg
                            viewBox="0 0 1024 1024"
                            style={{
                                width: '12px',
                                height: '12px',
                                transition: 'transform 0.25s ease',
                                transform: isActive ? 'rotate(90deg)' : 'rotate(0deg)',
                            }}
                            fill="currentColor"
                        >
                            <path d="M384 512l256 256-256 256z"></path>
                        </svg>
                    )}
                    collapseMotion={{
                        motionName: 'ant-motion-slide-up',
                        motionAppear: false,
                        motionEnter: true,
                        motionLeave: true,
                        onLeaveStart: (node) => {
                            return { maxHeight: node.offsetHeight };
                        },
                        onLeaveActive: (node) => {
                            return { maxHeight: 0, opacity: 0 };
                        },
                        onEnterStart: (node) => {
                            node.style.maxHeight = '0px';
                            node.style.opacity = '0';
                            return { maxHeight: node.scrollHeight, opacity: 0 };
                        },
                        onEnterActive: (node) => {
                            node.style.overflow = 'hidden';
                            return { maxHeight: node.scrollHeight, opacity: 1 };
                        },
                    }}
                    className="sidebar-menu"
                />
            </div>

            {/* 绝对定位底部用户信息 */}
            <div style={{
                position: 'absolute',
                left: 0,
                bottom: 0,
                width: '100%',
                padding: '16px',
                borderTop: '1px solid rgba(167, 135, 83, 0.2)',
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
                                background: "linear-gradient(135deg, rgb(255, 203, 125) 0%, rgb(167, 135, 83) 100%)",
                                color: "#000",
                                fontWeight: "bold",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
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