import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Card, List, Row, Col, Statistic } from 'antd';
import { getDashboardInfo } from '../api/other';

export const Home = () => {
    const [dashboardInfo, setDashboardInfo] = useState([]);
    const contentMaxHeight = 'calc((-145px + 100vh) - 65px - 10px)';

    const fetchDashboardInfo = async () => {
        try {
            const res = await getDashboardInfo();
            setDashboardInfo(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDashboardInfo();
    }, []);

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

    const lineChartConfig = {
        data: dashboardInfo?.serviceResource ?? [],
        xField: 'time',
        yField: 'value',
        seriesField: 'label',
        xAxis: {
            type: 'time',
            labels: {
                formatter: (value) => {
                    const date = new Date(value);
                    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                },
            },
        },
        tooltip: {
            dateTimeLabelFormats: {
                minute: '%H:%M:%S',
                hour: '%H:%M:%S',
                day: '%H:%M:%S',
            },
        },
        interval: 60,
    };

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
                            value={dashboardInfo?.curAlerts || 0}
                            valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#ff4d4f' }}
                        />
                        <div style={{ color: '#999', marginTop: '8px' }}>当前告警总数</div>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={8}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                    >
                        <Statistic
                            value={dashboardInfo?.curMutes || 0}
                            valueStyle={{ fontSize: '32px', fontWeight: 'bold', color: '#b1b1b1' }}
                        />
                        <div style={{ color: '#999', marginTop: '8px' }}>运行静默总数</div>
                    </Card>
                </Col>
                {/*<Col xs={24} md={8}>*/}
                {/*    <Card*/}
                {/*        title="服务资源使用率"*/}
                {/*        bordered={false}*/}
                {/*        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}*/}
                {/*    >*/}
                {/*        <Line*/}
                {/*            style={{ height: '200px', width: '100%' }}*/}
                {/*            {...lineChartConfig}*/}
                {/*        />*/}
                {/*    </Card>*/}
                {/*</Col>*/}
            </Row>

            {/* 第二行：最近告警列表、告警分布 */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                    <Card
                        title="最近告警列表"
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
                        title="告警分布"
                        bordered={false}
                        style={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                    >
                        <ReactECharts
                            option={alarmDistributionOption}
                            style={{ width: '550px' }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
};