import { useState, useEffect, useMemo, useCallback } from 'react';
import {Table, Button, Tag, Input, Popconfirm, message, Tooltip, Space, Switch, Drawer, Typography, Divider} from 'antd';
import {ProbingChangeState, ProbingDelete, ProbingList} from "../../api/probing";
import {Link, useNavigate} from "react-router-dom";
import {CopyOutlined, DeleteOutlined, PlusOutlined, ReloadOutlined, QuestionCircleOutlined} from "@ant-design/icons";
import {HandleApiError, HandleShowTotal} from "../../utils/lib";
import {useAppContext} from "../../context/RuleContext";


export const Probing = () => {
    const { setCloneProbeRule } = useAppContext()
    const navigate = useNavigate()
    const { Search } = Input;
    const { Title, Paragraph, Text } = Typography;
    const params = useMemo(() => new URLSearchParams(window.location.search), []);
    const [dataList, setDataList] = useState([]);
    const [searchQuery,setSearchQuery] = useState('')
    const [helpDrawerVisible, setHelpDrawerVisible] = useState(false);

    const [loading,setLoading]=useState(true)
    const [height, setHeight] = useState(window.innerHeight);
    // Common columns used across all protocol types
    const getCommonColumns = useCallback(() => [
        {
            title: '任务名称',
            dataIndex: 'ruleName',
            key: 'name',
            width: 'auto',
            render: (text,record) => (
                <Link 
                    to={`/probing/${record.ruleId}/edit`}
                    style={{
                            color: "#1677ff",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                >
                    {text}
                </Link>
            )
        },
        {
            title: '拨测类型',
            dataIndex: 'ruleType',
            key: 'ruleType',
            width: '100px',
            render: (text) => (
                <Tag color={
                    text === 'HTTP' ? 'blue' :
                    text === 'ICMP' ? 'green' :
                    text === 'TCP' ? 'orange' :
                    text === 'SSL' ? 'purple' : 'default'
                }>
                    {text || '-'}
                </Tag>
            )
        },
        {
            title: '端点',
            key: 'endpoint',
            width: 'auto',
            render: (record) => (
                <Link 
                    to={`/probing/${record.ruleId}/detail`}
                    style={{
                            color: "#1677ff",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                        }}
                >
                    {record.probingEndpointConfig?.endpoint && record.probingEndpointConfig.endpoint.length > 80 
                                ? `${record.probingEndpointConfig.endpoint.substring(0, 80)}...`
                                : record.probingEndpointConfig?.endpoint}
                </Link>
            ),
        }
    ], []);

    const handleDelete = useCallback(async (record) => {
        try {
            const params = {
                ruleId: record.ruleId
            }
            await ProbingDelete(params)
            handleList();
        } catch (error) {
            message.error(error);
        }
    }, []);

    const handleClone = useCallback((record) => {
        const cloneData = {
            ...record,
            ruleId: "",
            probingEndpointConfig: {
                ...record.probingEndpointConfig,
                endpoint: "",
                http: {
                    method: "",
                    header: [],
                    body: "",
                },
            },
        };
        setCloneProbeRule(cloneData);
        navigate(`/probing/create?isClone=1`);
    }, [setCloneProbeRule, navigate]);

    const getStatusColumns = useCallback(() => [
        {
            title: "更新时间",
            dataIndex: "updateAt",
            key: "updateAt",
            width: "200px",
            render: (text) => new Date(text * 1000).toLocaleString(),
        },
        {
            title: "操作人",
            dataIndex: "updateBy",
            key: "updateBy",
            width: "auto",
            render: (text) => (
                <Tag style={{
                    borderRadius: "12px",
                    padding: "0 10px",
                    fontSize: "12px",
                    fontWeight: "500",
                }}>
                    {text || "未知用户"}
                </Tag>
            ),
        },
        {
            title: '状态',
            dataIndex: 'enabled',
            key: 'enabled',
            width: "100px",
            render: (enabled, record) => (
                <Switch
                    checked={enabled}
                    onChange={async (checked) => {
                        try {
                            await ProbingChangeState({
                                tenantId: record.tenantId,
                                ruleId: record.ruleId,
                                enabled: checked,
                            });
                            message.success(`状态已更新为: ${checked ? "启用" : "禁用"}`);
                            handleList();
                        } catch (error) {
                            HandleApiError(error);
                        }
                    }}
                    checkedChildren="启用"
                    unCheckedChildren="禁用"
                />
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="克隆">
                        <Button
                            type="text"
                            icon={<CopyOutlined />}
                            onClick={() => handleClone(record)}
                            style={{ color: "#615454" }}
                        />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Popconfirm
                            title="确定要删除此任务吗?"
                            onConfirm={() => handleDelete(record)}
                            okText="确定"
                            cancelText="取消"
                            placement="left"
                        >
                            <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
            ),
        },
    ], [handleClone, handleDelete]);

    // Combine columns for all tasks
    const columns = useMemo(() => [
        ...getCommonColumns(),
        ...getStatusColumns()
    ], [getCommonColumns, getStatusColumns]);



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
        handleList()
    }, [searchQuery]);

    useEffect(() => {
        // 从 URL 中获取 query 参数，并更新 searchQuery 的状态
        const url = new URL(window.location);
        const queryParam = url.searchParams.get('query');
        if (queryParam) {
            setSearchQuery(queryParam);
        }
    }, [params]);



    const handleList = async () => {
        try {
            setLoading(true);
            // 不传递 ruleType 参数，获取所有类型的任务
            const res = await ProbingList({});
            setDataList(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };



    const onSearch = async (value) => {
        try {
            const res = await ProbingList({
                query: value,
            });
            setDataList(res.data);
        } catch (error) {
            console.error(error);
        }
    };





    return (
        <>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', gap: '10px'}}>
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
                    <Tooltip title="帮助手册">
                        <Button
                            type="default"
                            icon={<QuestionCircleOutlined />}
                            onClick={() => setHelpDrawerVisible(true)}
                        >
                            帮助
                        </Button>
                    </Tooltip>

                    <Button
                        type="primary"
                        size="default"
                        style={{ marginLeft: 'auto', backgroundColor: '#000000' }}
                        onClick={() => {
                            handleList()
                        }}
                        icon={<ReloadOutlined />}
                    >刷新</Button>

                    <Link to="/probing/create">
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: '#000000'
                            }}
                            icon={<PlusOutlined />}
                        > 创建 </Button>
                    </Link>
                </div>
            </div>

            <div style={{overflowX: 'auto', marginTop: 10, height: '76vh'}}>
                <Table
                    columns={columns}
                    dataSource={dataList}
                    loading={loading}
                    scroll={{
                        y: height - 280,
                        x: 'max-content',
                    }}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                    pagination={{
                        showTotal: HandleShowTotal,
                        pageSizeOptions: ['10'],
                    }}
                    rowKey={(record) => record.id}
                />
            </div>

            <Drawer
                title="指标配置指南"
                placement="right"
                width={600}
                onClose={() => setHelpDrawerVisible(false)}
                open={helpDrawerVisible}
            >
                <div style={{ padding: '0 8px' }}>
                    <Title level={4}>支持的监控指标</Title>
                    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        <div style={{ 
                            padding: '12px', 
                            border: '1px solid #d9d9d9', 
                            borderRadius: '6px', 
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#1677ff' }}>HTTP 拨测</Title>
                            <Paragraph style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                                <Text strong>可配置指标：</Text><br/>
                                • <Text code>probe_http_status_code</Text> - HTTP响应状态码<br/>
                                • <Text code>probe_http_response_time_ms</Text> - HTTP请求响应时间（毫秒）<br/>
                                • <Text code>probe_http_success</Text> - HTTP请求状态（1=成功，0=失败）
                            </Paragraph>
                        </div>

                        <div style={{ 
                            padding: '12px', 
                            border: '1px solid #d9d9d9', 
                            borderRadius: '6px', 
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#52c41a' }}>ICMP 拨测</Title>
                            <Paragraph style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                                <Text strong>可配置指标：</Text><br/>
                                • <Text code>probe_icmp_packet_loss_percent</Text> - ICMP包丢失百分比<br/>
                                • <Text code>probe_icmp_rtt_min_ms</Text> - ICMP最小往返时间（毫秒）<br/>
                                • <Text code>probe_icmp_rtt_max_ms</Text> - ICMP最大往返时间（毫秒）<br/>
                                • <Text code>probe_icmp_rtt_avg_ms</Text> - ICMP平均往返时间（毫秒）<br/>
                                • <Text code>probe_icmp_packets_sent_total</Text> - ICMP发送包总数<br/>
                                • <Text code>probe_icmp_packets_received_total</Text> - ICMP接收包总数
                            </Paragraph>
                        </div>

                        <div style={{ 
                            padding: '12px', 
                            border: '1px solid #d9d9d9', 
                            borderRadius: '6px', 
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#fa8c16' }}>TCP 拨测</Title>
                            <Paragraph style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                                <Text strong>可配置指标：</Text><br/>
                                • <Text code>probe_tcp_success</Text> - TCP连接成功率（1=成功，0=失败）<br/>
                                • <Text code>probe_tcp_response_time_ms</Text> - TCP连接响应时间（毫秒）
                            </Paragraph>
                        </div>

                        <div style={{ 
                            padding: '12px', 
                            border: '1px solid #d9d9d9', 
                            borderRadius: '6px', 
                        }}>
                            <Title level={5} style={{ margin: 0, color: '#722ed1' }}>SSL 拨测</Title>
                            <Paragraph style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
                                <Text strong>可配置指标：</Text><br/>
                                • <Text code>probe_ssl_certificate_expiry_days</Text> - SSL证书剩余有效天数<br/>
                                • <Text code>probe_ssl_response_time_ms</Text> - SSL响应时间（毫秒）<br/>
                                • <Text code>probe_ssl_certificate_valid</Text> - SSL证书有效性（1=有效，0=无效）
                            </Paragraph>
                        </div>
                    </Space>
                </div>
            </Drawer>
        </>
    );
};