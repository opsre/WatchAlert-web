import React, { useState, useEffect } from 'react';
import {Button, Input, Card, Row, Col, Dropdown, Menu, Modal, Empty} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { FaultCenterDelete, FaultCenterList } from '../../api/faultCenter';
import { MoreOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import {CreateFaultCenter} from "./create";
import Title from "antd/es/skeleton/Title";

const { confirm } = Modal;

export const FaultCenter = () => {
    const { Search } = Input;
    const [list, setList] = useState([]);
    const [hoveredCard, setHoveredCard] = useState(null); // 当前悬停的卡片ID
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null)

    useEffect(() => {
        handleList();
    }, []);

    const handleList = async () => {
        try {
            const res = await FaultCenterList();
            setList(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (record) => {
        try {
            const params = { id: record.id };
            await FaultCenterDelete(params);
            handleList(); // 删除后刷新列表
        } catch (error) {
            console.error(error);
        }
    };

    const onSearch = async (value) => {
        try {
            const params = { query: value };
            const res = await FaultCenterList(params);
            setList(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCardClick = (id) => {
        navigate(`/faultCenter/detail/${id}`);
    };

    // 显示删除确认弹窗
    const showDeleteConfirm = (record) => {
        confirm({
            title: '确认删除',
            icon: <ExclamationCircleOutlined />,
            content: `确定删除故障中心 ${record.name} 吗？`,
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                handleDelete(record);
            },
        });
    };

    // 三个点的下拉菜单
    const renderMenu = (record) => (
        <Menu>
            <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                    e.domEvent.stopPropagation(); // 阻止事件冒泡
                    showDeleteConfirm(record); // 显示删除确认弹窗
                }}
            >
                删除
            </Menu.Item>
        </Menu>
    );

    // 定义样式常量
    const styles = {
        cardTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        label: {
            color: '#878383',
        },
        value: (color) => ({
            color: color,
            fontWeight: 'bold',
            marginLeft: '8px',
            fontSize: '15px',
        }),
        cardHover: {
            transform: 'scale(1.05)',
            transition: 'transform 0.3s ease',
        },
    };

    const handleModalClose = () => {
        setVisible(false);
    };

    // 格式化时间
    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000); // 将秒转换为毫秒
        const year = date.getFullYear(); // 获取年份
        const month = date.getMonth() + 1; // 获取月份（0-11，需要加1）
        const day = date.getDate(); // 获取日期
        const hours = date.getHours(); // 获取小时
        const minutes = date.getMinutes(); // 获取分钟

        // 补零函数，确保月份、日期、小时、分钟、秒为两位数
        const padZero = (num) => (num < 10 ? `0${num}` : num);

        // 返回格式化后的时间字符串
        return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hours)}:${padZero(minutes)}`;
    };

    return (
        <>
            <div style={{ display: 'flex', marginTop: '10px', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        style={{ width: 300 }}
                    />
                </div>

                <div>
                    <Button
                        type="primary"
                        style={{ backgroundColor: '#000000' }}
                        onClick={() => setVisible(true)}
                    >
                        创 建
                    </Button>
                </div>
            </div>

            <CreateFaultCenter visible={visible} onClose={handleModalClose} handleList={handleList} type="create" />

            {/* 空状态展示 */}
            {list.length === 0 && (
                <div style={{
                    height: '70vh',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: -40
                }}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={"暂无故障中心数据"}
                        style={{ marginBottom: 32 }}
                    >
                        <Title level={4} style={{ marginBottom: 16 }}>
                            开始创建第一个故障中心
                        </Title>
                        <span style={{ marginBottom: 24 }}>
                            通过创建故障中心来统一管理您的告警信息
                        </span>
                    </Empty>
                </div>
            )}

            <Row gutter={[18, 18]} style={{ display: 'flex', flexWrap: 'wrap', marginTop: '20px' }}>
                {list.map((item) => (
                    <Col key={item.id} xs={24} sm={24} md={8} lg={8} style={{ flex: "320px" }}>
                        <div
                            onClick={() => handleCardClick(item.id)}
                            onMouseEnter={() => setHoveredCard(item.id)} // 鼠标悬停时设置 hoveredCard
                            onMouseLeave={() => setHoveredCard(null)} // 鼠标离开时清除 hoveredCard
                            style={{
                                cursor: 'pointer',
                                transform: hoveredCard === item.id ? styles.cardHover.transform : 'scale(1)',
                                transition: styles.cardHover.transition,
                            }}
                        >
                            <Card style={{textAlign: 'left'}}>
                                {/* 标题部分 */}
                                <div style={styles.cardTitle}>
                                    <span>{item.name}</span>
                                    <Dropdown
                                        overlay={renderMenu(item)}
                                        trigger={['click']}
                                        overlayStyle={{zIndex: 9999}} // 确保下拉菜单在最上层
                                    >
                                        <MoreOutlined
                                            onClick={(e) => {
                                                e.stopPropagation(); // 阻止事件冒泡
                                            }}
                                            style={{fontSize: '18px', cursor: 'pointer'}}
                                        />
                                    </Dropdown>
                                </div>

                                {/* 待处理 */}
                                <div>
                                    <span
                                        style={styles.value(item.currentAlertNumber > 0 ? '#ff7373' : '#93fa8f')}>{item.currentAlertNumber ? item.currentAlertNumber : 0} </span>
                                    <span style={styles.label}> 待处理</span>
                                </div>
                                <div>
                                    <span
                                        style={styles.value( 'orange')}>{item.currentRecoverNumber ? item.currentRecoverNumber : 0} </span>
                                    <span style={styles.label}> 待恢复</span>
                                </div>
                                <div>
                                    <span
                                        style={styles.value('#878383')}>{item.currentMuteNumber ? item.currentMuteNumber : 0} </span>
                                    <span style={styles.label}> 静默中</span>
                                </div>

                                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                    <span style={{marginRight: "5px", color: "gray"}}>CreateAt:</span>
                                    <span style={{color: 'gray'}}>{formatDate(item.createAt)}</span>
                                </div>
                            </Card>
                        </div>
                    </Col>
                ))}
            </Row>
        </>
    );
};