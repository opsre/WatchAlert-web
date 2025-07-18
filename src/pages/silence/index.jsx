import React, { useState, useEffect } from 'react';
import { Typography, Radio, Row, Col, Card, Dropdown, Empty, Menu, Modal } from 'antd';
import { CreateSilenceModal } from './SilenceRuleCreateModal';
import { deleteSilence, getSilenceList } from '../../api/silence';
import {
    BellOutlined,
    BlockOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    MoreOutlined, PauseCircleOutlined,
    PlusOutlined
} from "@ant-design/icons";
import "../alert/rule/index.css";
import {FaultCenterReset} from "../../api/faultCenter";

const { Title } = Typography

const { confirm } = Modal;

export const Silences = (props) => {
    const { faultCenterId, aggregationType } = props;
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]); // 初始化list为空数组
    const [selectedCard, setSelectedCard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAggregationType, setSelectedAggregationType] = useState(aggregationType)
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    });
    const [height, setHeight] = useState(window.innerHeight)

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        // 监听窗口的resize事件
        window.addEventListener("resize", handleResize)

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        handleList();
    }, []);

    // 获取所有数据
    const handleList = async (index) => {
        try {
            const params = {
                index: pagination.index,
                size: pagination.size,
                faultCenterId: faultCenterId
            };

            setLoading(true);
            const res = await getSilenceList(params);
            setLoading(false);

            const sortedList = res.data.list.sort((a, b) => {
                return new Date(b.update_at) - new Date(a.update_at);
            });

            setPagination({
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            });

            setList(sortedList);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (record) => {
        try {
            const params = {
                faultCenterId: faultCenterId,
                id: record.id,
            };
            await deleteSilence(params);
            handleList();
        } catch (error) {
            console.error(error);
        }
    };

    // 关闭窗口
    const handleModalClose = () => {
        setVisible(false);
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
    };

    useEffect(() => {
        if (selectedCard === null) {
            setSelectedCard(0);
        }
    }, []);

    // 处理聚合模式变化
    const handleAggregationModeChange = async (e) => {
        setSelectedAggregationType(e.target.value)
        const params = {
            id: faultCenterId,
            ["aggregationType"]: e.target.value,
        }
        await FaultCenterReset(params);
    };

    const radioOptions = [
        {
            label: '按规则聚合',
            value: 'Rule',
        },
        {
            label: '不聚合',
            value: 'None',
        },
    ];

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
            fontSize: '14px',
        }),
        cardHover: {
            transform: 'scale(1.05)',
            transition: 'transform 0.3s ease',
        },
        addCard: {
            border: '1px dashed #d9d9d9',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '90%',
            cursor: 'pointer',
            backgroundColor: '#fafafa',
            color: '#878383',
            fontSize: '15px',
        },
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

    // 显示删除确认弹窗
    const showDeleteConfirm = (record) => {
        confirm({
            title: '确认删除',
            icon: <ExclamationCircleOutlined />,
            content: `确定删除静默规则 ${record.name} 吗？`,
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

    // 点击卡片空白处打开 Modal
    const handleCardClick = (record) => {
        setSelectedRow(record); // 设置选中的卡片数据
        setUpdateVisible(true); // 打开 Modal
    };

    return (
        <div style={{ marginTop: "5px" }}>
            <Title level={4} style={{ margin: 0, fontSize: "16px" }}>
                <BlockOutlined style={{ marginRight: "12px" }} />
                告警聚合
            </Title>
            <Radio.Group
                block
                options={radioOptions}
                defaultValue="None"
                value={selectedAggregationType}
                onChange={handleAggregationModeChange}
            />

            <Title level={4} style={{ marginTop: '20px', fontSize: "16px" }}>
                <PauseCircleOutlined style={{ marginRight: "12px" }} />
                静默规则
            </Title>
            <Typography.Title level={5} style={{ fontSize: '14px', marginTop: '10px' }}></Typography.Title>
            <div style={{ display: 'flex' }}>
                <CreateSilenceModal visible={visible} onClose={handleModalClose} type='create' handleList={handleList} faultCenterId={faultCenterId} />

                <CreateSilenceModal visible={updateVisible} onClose={handleUpdateModalClose} selectedRow={selectedRow}
                                    type='update' handleList={handleList} faultCenterId={faultCenterId} />
            </div>

            <div style={{
                textAlign: 'left', position: 'relative', paddingBottom: '60px',
                width: '100%',
                alignItems: 'flex-start',
                maxHeight: height - 380,
                overflowY: 'auto',
            }}>
                    <Row gutter={[18, 18]} style={{ display: 'flex', flexWrap: 'wrap' }}>
                        {list.map((item) => (
                            <Col key={item.id} xs={24} sm={24} md={8} lg={8}>
                                <Card
                                    style={{ textAlign: 'left', width: '100%', marginBottom: '16px', cursor: 'pointer' }}
                                    onClick={() => handleCardClick(item)} // 点击卡片空白处打开 Modal
                                >
                                    <div style={styles.cardTitle}>
                                        <div className="status-container">
                                            <span>{item.name}</span>
                                            <div
                                                className={`status-dot ${item.status === 1 ? 'status-enabled' : 'status-disabled'}`}
                                            />
                                        </div>

                                        <Dropdown
                                            overlay={renderMenu(item)}
                                            trigger={['click']}
                                            overlayStyle={{ zIndex: 9999 }} // 确保下拉菜单在最上层
                                            onClick={(e) => e.stopPropagation()} // 阻止事件冒泡
                                        >
                                            <MoreOutlined
                                                style={{ fontSize: '18px', cursor: 'pointer' }}
                                            />
                                        </Dropdown>
                                    </div>

                                    {/* 时间 */}
                                    <div>
                                        <span style={styles.label}>起始: </span>
                                        <span
                                            style={styles.value('gray')}>{formatDate(item.startsAt)}</span> / <span
                                        style={styles.value('gray')}>{formatDate(item.endsAt)}</span>
                                    </div>

                                    <br />

                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <span style={{ marginRight: "5px", color: "gray" }}>Update:</span>
                                        <span style={styles.value('gray')}>{item.updateBy}</span>
                                        <span style={styles.value('gray')}>({formatDate(item.updateAt)})</span>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                        {/* 添加一个虚线的卡片 */}
                        <Col xs={24} sm={24} md={8} lg={8}>
                            <Card
                                style={styles.addCard}
                                onClick={() => setVisible(true)}
                            >
                                <PlusOutlined style={{ fontSize: '15px', marginRight: '8px' }} />
                                添加新规则
                            </Card>
                        </Col>
                    </Row>
            </div>
        </div>
    );
};