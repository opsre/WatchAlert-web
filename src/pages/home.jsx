import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import {Card, List, Row, Col, Statistic, Select} from 'antd';
import { getDashboardInfo } from '../api/other';
import {FaultCenterList} from "../api/faultCenter";

const { Option } = Select;

export const Home = () => {
    const contentMaxHeight = 'calc((-145px + 100vh) - 65px - 10px)';
    const [dashboardInfo, setDashboardInfo] = useState({});
    const [faultCenters, setFaultCenters] = useState([]); // 故障中心列表
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(null); // 选中的故障中心

    // 获取故障中心列表
    const fetchFaultCenters = async () => {
        try {
            const res = await FaultCenterList();
            setFaultCenters(res.data);
            // 默认选择第一个
            if (res.data.length > 0) {
                setSelectedFaultCenter(res.data[0].id);
            }
        } catch (error) {
            console.error(error);
        }
    };

    // 获取仪表盘数据
    const fetchDashboardInfo = async (faultCenterId) => {
        try {
            const params = { faultCenterId: faultCenterId };
            const res = await getDashboardInfo(params);
            setDashboardInfo(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchFaultCenters();
    }, []);

    useEffect(() => {
        fetchDashboardInfo(selectedFaultCenter);
    }, [selectedFaultCenter]);

    const alarmDistributionOption = {
        xAxis: { type: 'category', data: ['P0', 'P1', 'P2'] },
        yAxis: { type: 'value' },
        series: [
            {
                data: [
                    dashboardInfo?.alarmDistribution?.P0 ?? 0,
                    dashboardInfo?.alarmDistribution?.P1 ?? 0,
                    dashboardInfo?.alarmDistribution?.P2 ?? 0,
                ],
                type: 'bar',
            },
        ],
    };

    // 渲染卡片标题（带选择器）
    const renderCardTitle = (title) => (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0 8px'
        }}>
            <span style={{ fontWeight: 'bold' }}>{title}</span>
            <Select
                style={{ width: 200 }}
                placeholder="选择故障中心"
                value={selectedFaultCenter}
                onChange={setSelectedFaultCenter}
                showSearch
                optionFilterProp="children"
            >
                {faultCenters.length === 0 && (
                    <Option disabled>暂无可用故障中心</Option>
                )}
                {faultCenters.map(center => (
                    <Option key={center.id} value={center.id}>
                        {center.name}
                    </Option>
                ))}
            </Select>
        </div>
    );

    return (
        <div style={{
            alignItems: 'flex-start',
            textAlign: 'start',
            marginTop: '-20px',
            maxHeight: contentMaxHeight,
            overflowY: 'auto'
        }}>
            {/* 第一行：规则总数、当前告警总数、服务资源使用率 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                    >
                        <Statistic
                            value={dashboardInfo?.countAlertRules || 0}
                            valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#1890ff' }}
                        />
                        <div style={{ color: '#999', marginTop: '8px' }}>当前规则总数</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                    >
                        <Statistic
                            value={dashboardInfo?.faultCenterNumber || 0}
                            valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4d4f' }}
                        />
                        <div style={{ color: '#999', marginTop: '8px' }}>故障中心总数</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                    >
                        <Statistic
                            value={dashboardInfo?.userNumber || 0}
                            valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#b1b1b1' }}
                        />
                        <div style={{ color: '#999', marginTop: '8px' }}>系统用户总数</div>
                    </Card>
                </Col>
            </Row>

            {/* 第二行：最近告警列表、告警分布 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card
                        title={renderCardTitle('最近告警列表')}
                        bordered={false}
                        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                    >
                        <List
                            bordered
                            dataSource={dashboardInfo?.curAlertList ?? []}
                            style={{ height: '300px', overflow: 'auto' }}
                            renderItem={(item) => (
                                <List.Item>
                                    <div style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>{item}</div>
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card
                        title={renderCardTitle('告警分布')}
                        bordered={false}
                        style={{
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            overflow: 'hidden',
                        }}
                    >
                        <ReactECharts
                            option={alarmDistributionOption}
                            style={{ width: '100%', height: '300px' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};