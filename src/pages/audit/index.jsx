import React, { useState, useEffect } from 'react';
import {Table, message, Button, Drawer, Select, Input, Tag} from 'antd';
import { listAuditLog, searchAuditLog } from '../../api/auditLog';
import moment from 'moment';
import JsonViewer from 'react-json-view';

export const AuditLog = () => {
    const { Search } = Input
    const [list, setList] = useState([]);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [annotations, setAnnotations] = useState('');
    const [scope, setScope] = useState('')
    const [startTimestamp, setStartTimestamp] = useState(null)
    const [endTimestamp, setEndTimestamp] = useState(null)
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    });
    const columns = [
        {
            title: '时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 'auto',
            render: (text) => {
                const dateInMilliseconds = text * 1000;
                return moment(dateInMilliseconds).format('YYYY-MM-DD HH:mm:ss');
            }
        },
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            width: 'auto',
        },
        {
            title: '来源IP',
            dataIndex: 'ipAddress',
            key: 'ipAddress',
            width: 'auto',
        },
        {
            title: '事件名称',
            dataIndex: 'auditType',
            key: 'auditType',
            width: 'auto',
        },
        {
            title: '操作状态',
            dataIndex: 'statusCode',
            key: 'statusCode',
            width: 'auto',
            render: (text) => (
                <span>
                    {text === 200 && (
                        <Tag color="success">{text}</Tag>
                    ) || (
                        <Tag color="error">{text}</Tag>
                    )}

                </span>
            ),
        },
        {
            title: '事件ID',
            dataIndex: 'id',
            key: 'id',
            width: 'auto',
        },
        {
            title: '事件Body详情',
            dataIndex: 'body',
            key: 'body',
            width: 120,
            render: (text, record) => (
                <span>
                    {record.body && (
                        <Button type="link" onClick={() => { showDrawer(record.body) }}>
                            详情
                        </Button>
                    )}
                </span>
            )
        },
    ]
    const [height, setHeight] = useState(window.innerHeight);

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

    useEffect(() => {
        handleList(pagination.index, pagination.size);
    }, [startTimestamp, endTimestamp]);

    useEffect(() => {
        onSearch()
    }, [scope]);

    const handleList = async (index, size) => {
        try {
            const params = {
                index: index,
                size: size,
            };

            const filteredParams = {};
            for (const key in params) {
                if (params[key] !== undefined) {
                    filteredParams[key] = params[key];
                }
            }

            const res = await listAuditLog(params)
            setPagination({
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            });

            setList(res.data.list);
        } catch (error) {
            message.error(error);
        }
    };

    const handlePageChange = (page) => {
        setPagination({ ...pagination, index: page.current, size: page.size });
        handleList(page.current, page.size)
    };

    const handleShowTotal = (total, range) =>
        `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`;

    const showDrawer = (record) => {
        setDrawerOpen(true);
        setAnnotations(record)
    };

    const onCloseDrawer = () => {
        setDrawerOpen(false);
    };

    let annotationsJson = ""
    if (annotations) {
        annotationsJson = JSON.parse(annotations);
    }

    const onSearch = async (value) => {
        try {
            const params = {
                index: pagination.index,
                size: pagination.size,
                scope: scope,
                query: value,
            }

            const res = await searchAuditLog(params)

            setPagination({
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            });

            setList(res.data.list);
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div>
            <Drawer
                anchor="right"
                title="事件Body详情"
                onClose={onCloseDrawer}
                open={drawerOpen}
            >
                <JsonViewer
                    src={annotationsJson}
                    displayObjectSize={false}
                />
            </Drawer>
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '50vh' }}>
                <Select
                    allowClear
                    placeholder="时间范围"
                    style={{
                        flex: 1,
                        marginRight: '10px'
                    }}
                    options={[
                        {
                            value: '1',
                            label: '近 1 天',
                        },
                        {
                            value: '3',
                            label: '近 3 天'
                        },
                        {
                            value: '5',
                            label: '近 5 天'
                        },
                        {
                            value: '9',
                            label: '近 9 天'
                        },
                        {
                            value: '15',
                            label: '近 15 天'
                        },
                        {
                            value: '20',
                            label: '近 20 天'
                        },
                        {
                            value: '30',
                            label: '近 30 天'
                        },
                    ]}
                    onChange={(record) => { setScope(record) }}
                />
                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    style={{ width: 300 }}
                    onSearch={onSearch}
                />
            </div>

            <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    pagination={{
                        index: pagination.index ?? 1,
                        size: pagination.size ?? 10,
                        total: pagination?.total ?? 0,
                        showTotal: handleShowTotal,
                    }}
                    onChange={handlePageChange}
                    scroll={{
                        y: height - 400, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
                    }}
                    bordered // 添加表格边框
                    style={{ backgroundColor: '#fff' }} // 设置表格背景色
                    rowKey={(record) => record.id} // 设置行唯一键
                />
            </div>
        </div>
    );
};