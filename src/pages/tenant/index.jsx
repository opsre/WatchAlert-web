import React, { useState, useEffect, useCallback } from 'react';
import { Button, Input, Card, Row, Col, Dropdown, Menu, Modal, Empty, Typography, Tag, Tooltip } from 'antd';
import { deleteTenant, getTenantList } from '../../api/tenant';
import { CreateTenant } from './CreateTenant';
import { useNavigate, Link } from "react-router-dom";
import {getUserInfo} from "../../api/user";
import { DeleteOutlined, EditOutlined, PlusOutlined, MoreOutlined, CopyOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { copyToClipboard } from "../../utils/copyToClipboard";
import { Breadcrumb } from "../../components/Breadcrumb";

const { Search } = Input;
const { Title } = Typography;
const { confirm } = Modal;

export const Tenants = () => {
    const [list, setList] = useState([]);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [visible, setVisible] = useState(false);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        handleList();
    }, []);

    const handleList = useCallback(async () => {
        let userid = "";
        try {
            const userRes = await getUserInfo();
            userid = userRes?.data?.userid;
        } catch (error) {
            console.log(error);
        }

        try {
            const params = {
                userId: userid,
            };
            const res = await getTenantList(params);
            if (res?.data === null || res?.data?.length === 0) {
                // 不再显示错误提示，允许空列表
            }
            setList(res?.data || []);
        } catch (error) {
            console.error(error);
        }
    }, []);

    const handleDelete = async (record) => {
        try {
            const params = {
                id: record.id,
            };
            await deleteTenant(params);
            handleList();
        } catch (error) {
            console.error(error);
        }
    };

    const onSearch = (value) => {
        // 简单过滤
        if (!value) {
            handleList();
            return;
        }
        const filtered = list.filter(item =>
            item.name?.toLowerCase().includes(value.toLowerCase()) ||
            item.id?.toLowerCase().includes(value.toLowerCase()) ||
            item.manager?.toLowerCase().includes(value.toLowerCase())
        );
        setList(filtered);
    };

    const handleCardClick = (id) => {
        navigate(`/tenants/detail/${id}`);
    };

    // 显示删除确认弹窗
    const showDeleteConfirm = (record) => {
        confirm({
            title: "确认删除",
            icon: <ExclamationCircleOutlined />,
            content: `确定删除租户 ${record.name} 吗？`,
            okText: "确定",
            okType: "danger",
            cancelText: "取消",
            onOk() {
                handleDelete(record);
            },
        });
    };

    // 三个点的下拉菜单
    const renderMenu = (record) => (
        <Menu>
            <Menu.Item
                key="edit"
                icon={<EditOutlined />}
                onClick={(e) => {
                    e.domEvent.stopPropagation();
                    setSelectedRow(record);
                    setUpdateVisible(true);
                }}
            >
                编辑
            </Menu.Item>
            <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                danger
                onClick={(e) => {
                    e.domEvent.stopPropagation();
                    showDeleteConfirm(record);
                }}
            >
                删除
            </Menu.Item>
        </Menu>
    );

    // 样式定义
    const styles = {
        pageContainer: {
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
        },
        headerSection: {
            backgroundColor: "#fff",
            zIndex: 10,
            marginBottom: "20px",
        },
        scrollContainer: {
            flex: 1,
            overflowY: "auto",
        },
        cardHover: {
            transform: "translateY(-4px) scale(1.01)",
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
        },
        cardContainer: {
            margin: "4px",
            transition: "all 0.3s ease",
        },
        card: {
            borderRadius: "10px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid #f0f0f0",
            transition: "all 0.3s ease",
            height: "145px",
            display: "flex",
            flexDirection: "column",
            padding: "16px",
            position: "relative",
            overflow: "hidden",
            background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
        },
        cardHeader: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "6px",
        },
        cardTitle: {
            fontSize: "15px",
            fontWeight: "600",
            color: "#1f2d3d",
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },
        tenantId: {
            display: "flex",
            alignItems: "center",
            gap: "6px",
            color: "#8c8c8c",
            fontSize: "11px",
            cursor: "pointer",
            marginTop: "2px",
        },
        cardContent: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "6px",
        },
        infoRow: {
            display: "flex",
            alignItems: "center",
            gap: "8px",
        },
        infoLabel: {
            color: "#8c8c8c",
            fontSize: "12px",
            minWidth: "50px",
        },
        infoValue: {
            color: "#1f2d3d",
            fontSize: "13px",
            fontWeight: "500",
        },
        cardFooter: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #f5f5f5",
            paddingTop: "8px",
            marginTop: "4px",
        },
        createTime: {
            fontSize: "11px",
            color: "#bfbfbf",
        },
        moreIcon: {
            fontSize: "16px",
            cursor: "pointer",
            padding: "4px",
            borderRadius: "4px",
            transition: "background-color 0.2s",
            color: "#8c8c8c",
        },
        emptyContainer: {
            height: "60vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
        },
    };

    // 格式化时间
    const formatDate = (timestamp) => {
        if (!timestamp) return "-";
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}`;
    };

    const handleModalClose = () => {
        setVisible(false);
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
        setSelectedRow(null);
    };

    return (
        <>
            <Breadcrumb items={['租户管理']} />
            <div style={styles.pageContainer}>
                {/* 固定在顶部的搜索和创建按钮 */}
                <div style={styles.headerSection}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <Search
                                allowClear
                                placeholder="搜索租户名称、ID"
                                onSearch={onSearch}
                                onChange={(e) => {
                                    if (!e.target.value) handleList();
                                }}
                                style={{ width: 280 }}
                            />
                        </div>

                        <div>
                            <Button
                                type="primary"
                                style={{ backgroundColor: "#000000" }}
                                onClick={() => setVisible(true)}
                                icon={<PlusOutlined />}
                            >
                                创建租户
                            </Button>
                        </div>
                    </div>
                </div>

                <CreateTenant visible={visible} onClose={handleModalClose} type='create' handleList={handleList} />
                <CreateTenant visible={updateVisible} selectedRow={selectedRow} onClose={handleUpdateModalClose} type='update' handleList={handleList} />

                {/* 可滚动的内容区域 */}
                <div style={styles.scrollContainer}>
                    {/* 空状态展示 */}
                    {list?.length === 0 && (
                        <div style={styles.emptyContainer}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="暂无租户数据"
                            >
                                <Title level={4} style={{ marginBottom: 16, marginTop: 0 }}>
                                    开始创建第一个租户
                                </Title>
                                <span style={{ color: "#8c8c8c", marginBottom: 24, display: "block" }}>
                                    通过创建租户来管理不同的业务团队
                                </span>
                            </Empty>
                        </div>
                    )}

                    <Row gutter={[16, 16]} style={{ display: "flex", flexWrap: "wrap" }}>
                        {list?.map((item) => (
                            <Col key={item.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                                <div
                                    style={styles.cardContainer}
                                    onClick={() => handleCardClick(item.id)}
                                    onMouseEnter={() => setHoveredCard(item.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <Card
                                        style={{
                                            ...styles.card,
                                            ...(hoveredCard === item.id ? styles.cardHover : {})
                                        }}
                                        bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column' }}
                                    >
                                        {/* 标题部分 */}
                                        <div style={styles.cardHeader}>
                                            <div>
                                                <div style={styles.cardTitle}>
                                                    <Link
                                                        to={`/tenants/detail/${item.id}`}
                                                        style={{ color: "#1f2d3d" }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {item.name}
                                                    </Link>
                                                </div>
                                            </div>
                                            <Dropdown
                                                overlay={renderMenu(item)}
                                                trigger={"click"}
                                                overlayStyle={{ zIndex: 9999 }}
                                            >
                                                <MoreOutlined
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={styles.moreIcon}
                                                    onMouseEnter={(e) => e.target.style.backgroundColor = "#f5f5f5"}
                                                    onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                                                />
                                            </Dropdown>
                                        </div>

                                        {/* 内容部分 */}
                                        <div style={styles.cardContent}>
                                            <div style={styles.infoRow}>
                                                <span style={styles.infoLabel}>负责人</span>
                                                <Tag style={{
                                                    borderRadius: "12px",
                                                    padding: "0 10px",
                                                    fontSize: "12px",
                                                    fontWeight: "500",
                                                    backgroundColor: "#f0f5ff",
                                                    border: "none",
                                                    color: "#1677ff",
                                                }}>
                                                    {item.manager || "未设置"}
                                                </Tag>
                                            </div>
                                        </div>

                                        {/* 底部 */}
                                        <div style={styles.cardFooter}>
                                            <span></span>
                                            <span style={styles.createTime}>
                                                {formatDate(item.updateAt)}
                                            </span>
                                        </div>
                                    </Card>
                                </div>
                            </Col>
                        ))}
                    </Row>
                </div>
            </div>
        </>
    );
};
