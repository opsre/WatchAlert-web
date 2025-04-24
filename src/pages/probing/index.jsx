import React, { useState, useEffect } from 'react';
import {Table, Button, Tag, Input, Popconfirm, Radio, message, Progress, Tooltip, Space} from 'antd';
import {ProbingDelete, ProbingList, ProbingSearch} from "../../api/probing";
import {Link} from "react-router-dom";
import moment from 'moment';
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";


export const Probing = () => {
    const { Search } = Input;
    const params = new URLSearchParams(window.location.search);
    const [httpMonList, setHttpMonList] = useState([]);
    const [icmpMonList, setIcmpMonList] = useState([]);
    const [tcpMonList, setTcpMonList] = useState([]);
    const [sslMonList, setSslMonList] = useState([]);
    const [probingType, setprobingType] = useState('HTTP');
    const [searchQuery,setSearchQuery] = useState('')
    const HTTPColumns = [
        {
            title: '端点',
            key: 'probingEndpointConfig.endpoint',
            width: 'auto',
            render: (record) => (
                <div>
                    {record.probingEndpointConfig?.endpoint || '-'}
                </div>
            ),
        },
        {
            title: '状态码',
            key: 'statusCode',
            width: 'auto',
            render: (record) => {
                const statusCode = record.probingEndpointValues?.pHttp?.statusCode;
                const isSuccess = statusCode >= 200 && statusCode < 300;

                return (
                    <span style={{
                        color: isSuccess ? 'green' : 'red',
                        fontWeight: 'bold',
                    }}>
                {statusCode || '-'}
            </span>
                );
            },
        },
        {
            title: '响应延迟',
            key: 'latency',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pHttp?.latency && record.probingEndpointValues?.pHttp?.latency+"ms" || '-'}
                </>
            ),
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 'auto',
            render: enabled => (
                <div className="status-container">
                    <div
                        className={`status-dot ${enabled ? 'status-enabled' : 'status-disabled'}`}
                    />
                    <span>{enabled ? '启用' : '禁用'}</span>
                </div>
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
            render: (_, record) =>
                httpMonList.length >= 1 ? (
                    <Space size="middle">
                        <Link to={`/probing/${record.ruleId}/edit`}>
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                style={{ color: "#1677ff" }}
                            />
                        </Link>
                        <Tooltip title="删除">
                            <Popconfirm
                                title="确定要删除此模版组吗?"
                                onConfirm={() => handleDelete(record)}
                                okText="确定"
                                cancelText="取消"
                                placement="left"
                            >
                                <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ) : null,
        },
    ]
    const ICMPColumns = [
        {
            title: '端点',
            key: 'probingEndpointConfig.endpoint',
            width: 'auto',
            render: (record) => (
                <div>
                    {record.probingEndpointConfig?.endpoint || '-'}
                </div>
            ),
        },
        {
            title: '丢包率',
            key: 'packetLoss',
            width: 'auto',
            render: (record) => {
                const packetLoss = record.probingEndpointValues?.pIcmp?.packetLoss;

                // 根据丢包率设置Tag样式和文本
                if (packetLoss === undefined || packetLoss === null || packetLoss === "") {
                    return <Tag color="gray">未知</Tag>;
                }

                return (
                    <Tag color={packetLoss < 80 ? 'green' : 'red'}>
                        {`${packetLoss}%`}
                    </Tag>
                );
            },
        },
        {
            title: '最短 RT',
            key: 'minRtt',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pIcmp?.minRtt && record.probingEndpointValues?.pIcmp?.minRtt+"ms" || '-'}
                </>
            ),
        },
        {
            title: '最长 RTT',
            key: 'maxRtt',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pIcmp?.maxRtt && record.probingEndpointValues?.pIcmp?.maxRtt+"ms" || '-'}
                </>
            ),
        },
        {
            title: '平均 RTT',
            key: 'avgRtt',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pIcmp?.avgRtt && record.probingEndpointValues?.pIcmp?.avgRtt+"ms" || '-'}
                </>
            ),
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 'auto',
            render: enabled => (
                <div className="status-container">
                    <div
                        className={`status-dot ${enabled ? 'status-enabled' : 'status-disabled'}`}
                    />
                    <span>{enabled ? '启用' : '禁用'}</span>
                </div>
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
            render: (_, record) =>
                icmpMonList.length >= 1 ? (
                    <Space size="middle">
                        <Link to={`/probing/${record.ruleId}/edit`}>
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                style={{ color: "#1677ff" }}
                            />
                        </Link>
                        <Tooltip title="删除">
                            <Popconfirm
                                title="确定要删除此模版组吗?"
                                onConfirm={() => handleDelete(record)}
                                okText="确定"
                                cancelText="取消"
                                placement="left"
                            >
                                <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ) : null,
        },
    ]
    const TCPColumns = [
        {
            title: '端点',
            key: 'probingEndpointConfig.endpoint',
            width: 'auto',
            render: (record) => (
                <div>
                    {record.probingEndpointConfig?.endpoint || '-'}
                </div>
            ),
        },
        {
            title: '探测状态',
            key: 'isSuccessful',
            width: 'auto',
            render: (record) => {
                const status = record.probingEndpointValues?.pTcp?.isSuccessful;
                // 根据状态值设置标签样式和文本
                const statusTag = status === "1"
                    ? <Tag color="green">成功</Tag>
                    : status === "0"
                        ? <Tag color="red">失败</Tag>
                        : <Tag color="gray">未知</Tag>;

                return statusTag;
            },
        },
        {
            title: '错误信息',
            key: 'errorMessage',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pTcp?.errorMessage || '-'}
                </>
            ),
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 'auto',
            render: enabled => (
                <div className="status-container">
                    <div
                        className={`status-dot ${enabled ? 'status-enabled' : 'status-disabled'}`}
                    />
                    <span>{enabled ? '启用' : '禁用'}</span>
                </div>
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
            render: (_, record) =>
                tcpMonList.length >= 1 ? (
                    <Space size="middle">
                        <Link to={`/probing/${record.ruleId}/edit`}>
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                style={{ color: "#1677ff" }}
                            />
                        </Link>
                        <Tooltip title="删除">
                            <Popconfirm
                                title="确定要删除此模版组吗?"
                                onConfirm={() => handleDelete(record)}
                                okText="确定"
                                cancelText="取消"
                                placement="left"
                            >
                                <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ) : null,
        },
    ]
    const SSLColumns = [
        {
            title: '端点',
            key: 'probingEndpointConfig.endpoint',
            width: 'auto',
            render: (record) => (
                <div>
                    {record.probingEndpointConfig?.endpoint || '-'}
                </div>
            ),
        },
        {
            title: '签发时间',
            key: 'startTime',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pSsl?.startTime || '-'}
                </>
            ),
        },
        {
            title: '结束时间',
            key: 'expireTime',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pSsl?.expireTime || '-'}
                </>
            ),
        },
        {
            title: '有效时间',
            key: 'timeProgress',
            width: 'auto',
            render: (record) => {
                const startTime = record.probingEndpointValues?.pSsl?.startTime;
                const endTime = record.probingEndpointValues?.pSsl?.expireTime;

                if (!startTime || !endTime) {
                    return '-'; // 数据不足时显示占位符
                }

                const totalDays = moment(endTime).diff(moment(startTime), 'days');
                const remainingDays = moment(endTime).diff(moment(), 'days');
                const progress = Math.max(0, Math.min(100, (remainingDays / totalDays) * 100)); // 进度百分比

                return (
                    <div>
                        <Progress
                            percent={progress.toFixed(2)}
                            status={progress > 20 ? 'active' : 'exception'}
                            strokeColor={progress > 20 ? '#52c41a' : '#ff4d4f'}
                            showInfo={false} // 隐藏默认信息
                        />
                        <div style={{textAlign: 'center', fontSize: 12}}>
                            剩余 {remainingDays > 0 ? remainingDays : 0} 天 / 总共 {totalDays} 天
                        </div>
                    </div>
                );
            }
        },
        {
            title: '响应延迟',
            key: 'avgRtt',
            width: 'auto',
            render: (record) => (
                <>
                    {record.probingEndpointValues?.pSsl?.responseTime + "ms" || '-'}
                </>
            ),
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: 'auto',
            render: enabled => (
                <div className="status-container">
                    <div
                        className={`status-dot ${enabled ? 'status-enabled' : 'status-disabled'}`}
                    />
                    <span>{enabled ? '启用' : '禁用'}</span>
                </div>
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
            render: (_, record) =>
                sslMonList.length >= 1 ? (
                    <Space size="middle">
                        <Link to={`/probing/${record.ruleId}/edit`}>
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                style={{ color: "#1677ff" }}
                            />
                        </Link>
                        <Tooltip title="删除">
                            <Popconfirm
                                title="确定要删除此模版组吗?"
                                onConfirm={() => handleDelete(record)}
                                okText="确定"
                                cancelText="取消"
                                placement="left"
                            >
                                <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
                ) : null,
        },
    ]
    const [loading,setLoading]=useState(true)
    const optionsWithDisabled = [
        {
            label: 'HTTP',
            value: 'HTTP',
        },
        {
            label: 'ICMP',
            value: 'ICMP',
        },
        {
            label: 'TCP',
            value: 'TCP',
        },
        {
            label: 'SSL',
            value: 'SSL',
        },
    ];
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
        handleList(probingType)
    }, [probingType, searchQuery]);

    useEffect(() => {
        const view = params.get('view');
        setprobingType(view ? view : "HTTP");

        // 从 URL 中获取 query 参数，并更新 searchQuery 的状态
        const url = new URL(window.location);
        const queryParam = url.searchParams.get('query');
        if (queryParam) {
            setSearchQuery(queryParam);
        }
    }, []);

    const handleList = async (ruleType) => {
        try {
            const params = {
                ruleType: ruleType
            }
            setLoading(true)
            const res = await ProbingList(params)
            setLoading(false)
            switch (ruleType){
                case "HTTP":
                    setHttpMonList(res.data)
                case "ICMP":
                    setIcmpMonList(res.data)
                case "TCP":
                    setTcpMonList(res.data)
                case "SSL":
                    setSslMonList(res.data)
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (record) => {
        try {
            const params = {
                ruleId: record.ruleId
            }
            await ProbingDelete(params)
            handleList(probingType);
        } catch (error) {
            message.error(error);
        }
    };

    const onSearch = async (value) => {
        try {
            const params = {
                ruleType: probingType,
                query: value,
            }
            const res = await ProbingList(params)
            switch (probingType){
                case "HTTP":
                    setHttpMonList(res.data)
                case "ICMP":
                    setIcmpMonList(res.data)
                case "TCP":
                    setTcpMonList(res.data)
                case "SSL":
                    setSslMonList(res.data)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const changeViewType = ({ target: { value } }) => {
        setprobingType(value);

        const url = new URL(window.location);
        url.searchParams.set('view', value); // Update or add the view parameter
        window.history.pushState({}, '', url); // Update the browser's address bar
    };

    return (
        <>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', gap: '10px'}}>
                    <Radio.Group
                        options={optionsWithDisabled}
                        onChange={changeViewType}
                        value={probingType}
                        optionType="button"
                        buttonStyle="solid"
                    />
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        value={searchQuery} // 将 searchQuery 作为输入框的值
                        onChange={(e) => setSearchQuery(e.target.value)} // 更新 searchQuery 状态
                        style={{width: 300}}
                    />
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                    <Button style={{marginLeft: 'auto'}} onClick={() => {
                        handleList(probingType)
                    }}>刷 新</Button>
                    <Link to={`/probing/create`}>
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: '#000000'
                            }}
                        > 创 建 </Button>
                    </Link>
                </div>
            </div>

            <div style={{overflowX: 'auto', marginTop: 10, height: '76vh'}}>
                {probingType === "HTTP" && (
                    <Table
                        columns={HTTPColumns}
                        dataSource={httpMonList}
                        loading={loading}
                        scroll={{
                            y: height - 280, // 动态设置滚动高度
                            x: 'max-content', // 水平滚动
                        }}
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            overflow: "hidden",
                        }}
                        rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                        rowKey={(record) => record.id} // 设置行唯一键
                    />
                )}

                {probingType === "ICMP" && (
                    <Table
                        columns={ICMPColumns}
                        dataSource={icmpMonList}
                        loading={loading}
                        scroll={{
                            y: height - 280, // 动态设置滚动高度
                            x: 'max-content', // 水平滚动
                        }}
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            overflow: "hidden",
                        }}
                        rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                        rowKey={(record) => record.id} // 设置行唯一键
                    />
                )}

                {probingType === "TCP" && (
                    <Table
                        columns={TCPColumns}
                        dataSource={tcpMonList}
                        loading={loading}
                        scroll={{
                            y: height - 280, // 动态设置滚动高度
                            x: 'max-content', // 水平滚动
                        }}
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            overflow: "hidden",
                        }}
                        rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                        rowKey={(record) => record.id} // 设置行唯一键
                    />
                )}
                {probingType === "SSL" && (
                    <Table
                        columns={SSLColumns}
                        dataSource={sslMonList}
                        loading={loading}
                        scroll={{
                            y: height - 280, // 动态设置滚动高度
                            x: 'max-content', // 水平滚动
                        }}
                        style={{
                            backgroundColor: "#fff",
                            borderRadius: "8px",
                            overflow: "hidden",
                        }}
                        rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                        rowKey={(record) => record.id} // 设置行唯一键
                    />
                )}
            </div>
        </>
    );
};