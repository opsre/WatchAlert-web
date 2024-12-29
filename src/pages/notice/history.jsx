import React, { useState, useEffect, useRef } from 'react';
import {Table, message, Tag, Button, Drawer, Divider, Input, Select} from 'antd';
import { noticeRecordList, noticeRecordMetric} from '../../api/notice';
import * as echarts from 'echarts';
import { ReactComponent as FeiShuIcon } from './img/feishu.svg'
import { ReactComponent as DingdingIcon } from './img/dingding.svg'
import { ReactComponent as EmailIcon } from './img/Email.svg'
import { ReactComponent as WeChatIcon } from './img/qywechat.svg'
import { ReactComponent as CustomHookIcon } from './img/customhook.svg'
import { ReactComponent as P0 } from "../alert/event/img/P0.svg"
import { ReactComponent as P1 } from "../alert/event/img/P1.svg"
import { ReactComponent as P2 } from "../alert/event/img/P2.svg"

export const NoticeRecords = () => {
    const { TextArea,Search } = Input;
    const chartRef = useRef(null);
    const [height, setHeight] = useState(window.innerHeight);
    const [list, setList] = useState();
    const [alarmMsg, setAlarmMsg] = useState();
    const [errMsg, setErrMsg] = useState();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [severiry,setSeverity] = useState()
    const [pushStatus,setPushStatus] = useState()
    const columns = [
        {
            title: '规则名称',
            dataIndex: 'ruleName',
            key: 'ruleName',
        },
        {
            title: '告警等级',
            dataIndex: 'severity',
            key: 'severity',
            render: (text) => {
                return (
                    <div style={{display: 'flex'}}>
                        {text === "P0" && (
                            <P0 style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "P1" && (
                            <P1 style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "P2" && (
                            <P2 style={{ height: "25px", width: "25px" }} />
                        )}
                        <div style={{marginLeft: "5px", marginTop: '3px',fontSize :'12px'}}>{text}</div>
                    </div>
                )
            },
        },
        {
            title: '通知类型',
            dataIndex: 'nType',
            key: 'nType',
            render: (text) => {
                if (text === 'FeiShu') {
                    return (
                        <div style={{display: 'flex'}}>
                            <FeiShuIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>飞书</div>
                        </div>
                    )
                } else if (text === 'DingDing') {
                    return (
                        <div style={{display: 'flex'}}>
                            <DingdingIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>钉钉</div>
                        </div>
                    )
                } else if (text === 'Email') {
                    return (
                        <div style={{display: 'flex'}}>
                            <EmailIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>邮件</div>
                        </div>
                    )
                } else if (text === 'WeChat') {
                    return (
                        <div style={{display: 'flex'}}>
                            <WeChatIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>企业微信</div>
                        </div>
                    )
                } else if (text === 'CustomHook') {
                    return (
                        <div style={{display: 'flex'}}>
                            <CustomHookIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>自定义Hook</div>
                        </div>
                    )
                }
                return '-'
            },
        },
        {
            title: '通知对象',
            dataIndex: 'nObj',
            key: 'nObj',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: status => (
                status === 0 ?
                    <Tag color="success">发送成功</Tag> :
                    <Tag color="error">发送失败</Tag>
            ),
        },
        {
            title: '通知时间',
            dataIndex: 'createAt',
            key: 'createAt',
            render: (text) => {
                const date = new Date(text * 1000);
                return date.toLocaleString();
            },
        },
        {
            title: '内容详情',
            width: 120,
            render: (text, record) => (
                <span>
                    <Button type="link" onClick={() => { showDrawer(record) }}>
                        详情
                    </Button>
                </span>
            )
        },
    ];

    useEffect(() => {
        const chartDom = chartRef.current;
        const myChart = echarts.init(chartDom);

        const fetchMetricData = async () => {
            try {
                const res = await noticeRecordMetric();
                const { date, series } = res.data;

                const option = {
                    grid: {
                        left: '10px',
                        right: '10px',
                        top: '25px',
                        bottom: '10px',
                        containLabel: true,
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: {
                            type: 'cross',
                        },
                    },
                    legend: {
                        data: ['P0', 'P1', 'P2'],
                        left: 35
                    },
                    xAxis: {
                        type: 'category',
                        data: date,
                    },
                    yAxis: {
                        type: 'value',
                    },
                    series: [
                        { name: 'P0', data: series.p0, type: 'line' },
                        { name: 'P1', data: series.p1, type: 'line' },
                        { name: 'P2', data: series.p2, type: 'line' },
                    ],
                };
                myChart.setOption(option);
            } catch (error) {
                message.error('Failed to load metric data');
            }
        };

        fetchMetricData();
        handleList()

        const handleResize = () => {
            myChart.resize();
        };

        // 确保页面加载时调整图表大小
        window.addEventListener('resize', handleResize);
        myChart.resize();  // 页面加载时自动调整图表大小

        return () => {
            window.removeEventListener('resize', handleResize);
            myChart.dispose();
        };
    }, []);

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight);
        };

        // 监听窗口的resize事件
        window.addEventListener('resize', handleResize);

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleList = async () => {
        try {
            const res = await noticeRecordList()
            setList(res.data);
        } catch (error) {
            message.error(error);
        }
    };

    const showDrawer = (record) => {
        setDrawerOpen(true);
        setAlarmMsg(record.alarmMsg)
        if (record.errMsg === ""){
            record.errMsg = 'null'
        }
        setErrMsg(record.errMsg)
    };

    const onCloseDrawer = () => {
        setDrawerOpen(false);
    };

    useEffect(() => {
        onSearch()
    },[severiry,pushStatus])

    const onSearch = async (value) => {
        try {
            const params = {
                severity: severiry,
                status: pushStatus,
                query: value,
            }

            const res = await noticeRecordList(params)
            setList(res.data);
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                gap: '10px'}}>

                <Select
                    placeholder="告警等级"
                    allowClear
                    onChange={(record) => setSeverity(record)}
                    options={[
                        {
                            value: 'P0',
                            label: 'P0级告警',
                        },
                        {
                            value: 'P1',
                            label: 'P1级告警',
                        },
                        {
                            value: 'P2',
                            label: 'P2级告警',
                        },
                    ]}
                />

                <Select
                    placeholder="发送状态"
                    allowClear
                    onChange={(record) => setPushStatus(record)}
                    options={[
                        {
                            value: '0',
                            label: '发送成功',
                        },
                        {
                            value: '1',
                            label: '发送失败',
                        },
                    ]}
                />

                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={onSearch}
                    style={{width: 335}}
                />
            </div>

            <Drawer
                title="事件详情"
                size={'large'}
                onClose={onCloseDrawer}
                open={drawerOpen}
            >
                <div>告警消息体</div>
                <TextArea
                    value={alarmMsg}
                    style={{
                        height: 200,
                        resize: 'none',
                    }}
                />

                <Divider/>

                <div>错误消息体</div>
                <TextArea
                    value={errMsg}
                    style={{
                        height: 200,
                        resize: 'none',
                    }}
                />

            </Drawer>

            <div
                ref={chartRef}
                style={{
                    marginTop: '10px',
                    width: '100%',
                    height: '200px',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    padding: '0', // 确保没有额外的内边距
                }}
            />

            <div style={{marginTop: '10px'}}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        y: height - 600, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
                    }}
                    bordered // 添加表格边框
                    style={{ backgroundColor: '#fff' }} // 设置表格背景色
                    rowKey={(record) => record.id} // 设置行唯一键
                />
            </div>

        </>
    );
};
