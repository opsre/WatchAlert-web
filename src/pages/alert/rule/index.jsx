import React, { useEffect, useState } from 'react'
import { Button, Input, Table, Radio, Popconfirm, Tag } from 'antd'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { deleteRule, getRuleList } from '../../../api/rule'
import { ReactComponent as PrometheusImg } from "./img/Prometheus.svg"
import { ReactComponent as AlicloudImg } from "./img/alicloud.svg"
import { ReactComponent as JaegerImg } from "./img/jaeger.svg"
import { ReactComponent as AwsImg } from "./img/AWSlogo.svg"
import { ReactComponent as LokiImg } from "./img/L.svg"
import { ReactComponent as VMImg } from "./img/victoriametrics.svg"
import { ReactComponent as K8sImg } from "./img/Kubernetes.svg"
import { ReactComponent as ESImg } from "./img/ElasticSearch.svg"
import {getDatasourceList} from "../../../api/datasource";

export const AlertRuleList = () => {
    const { Search } = Input
    const [selectedRow, setSelectedRow] = useState(null)
    const [updateVisible, setUpdateVisible] = useState(false)
    const [visible, setVisible] = useState(false)
    const [list, setList] = useState([])
    const [datasourceList,setDatasourceList] = useState([])
    const { id } = useParams()
    const [selectRuleStatus, setSelectRuleStatus] = useState('all')
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    });
    const columns = [
        {
            title: '规则名称',
            dataIndex: 'ruleName',
            key: 'ruleName',
            width: 'auto',
        },
        {
            title: '数据源类型',
            dataIndex: 'datasourceType',
            key: 'datasourceType',
            width: 'auto',
            render: (text, record) => {
                return (
                    <div style={{display: 'flex'}}>
                        {text === "Prometheus" && (
                            <PrometheusImg style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "CloudWatch" && (
                            <AwsImg style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "Loki" && (
                            <LokiImg style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "Jaeger" && (
                            <JaegerImg style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "AliCloudSLS" && (
                            <AlicloudImg style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "VictoriaMetrics" && (
                            <VMImg style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "KubernetesEvent" && (
                            <K8sImg style={{ height: "25px", width: "25px" }} />
                        )}
                        {text === "ElasticSearch" && (
                            <ESImg style={{ height: "25px", width: "25px" }} />
                        )}
                        <div style={{marginLeft: "5px", marginTop: '3px',fontSize :'12px'}}>{text}</div>
                    </div>
                )
            },
        },
        {
            title: '数据源',
            dataIndex: 'datasourceId',
            key: 'datasourceId',
            width: 'auto',
            render: (text, record) => (
                <span>
                    {getDatasourceNamesByIds(record.datasourceId).split(', ').map((name, index) => (
                        <Tag color="processing" key={index}>{name}</Tag>
                    ))}
                </span>
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 'auto',
            render: (text, record, index) => {
                if (!text) {
                    return '没有留下任何描述~';
                }
                return text;
            },
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
            fixed: 'right', // 设置操作列固定
            width: 120,
            render: (_, record) => (
                <div>
                    <Popconfirm
                        title="Sure to delete?"
                        onConfirm={() => handleDelete(_, record)}>
                        <a>删除</a>
                    </Popconfirm>

                    <Link to={`/ruleGroup/${record.ruleGroupId}/rule/${record.ruleId}/edit`}>
                        <Button type="link">
                            更新
                        </Button>
                    </Link>
                </div>
            ),
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
        handleList(id, pagination.index, pagination.size)
        handleListDatasource()
    }, [])

    useEffect(() => {
        onSearch()
    },[selectRuleStatus])

    const handleListDatasource = async () => {
        try {
            const res = await getDatasourceList()
            setDatasourceList(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    const getDatasourceNamesByIds = (datasourceIdList) => {
        if (!Array.isArray(datasourceIdList)) return 'Unknown';

        const matchedNames = datasourceIdList.map((id) => {
            const datasource = datasourceList.find(ds => ds.id === id);
            return datasource ? datasource.name : 'Unknown';
        });

        return matchedNames.join(', ') || 'Unknown'; // Join multiple names with commas
    };

    const handleList = async (id,index,size) => {
        try {
            const params = {
                index: index,
                size: size,
                status: selectRuleStatus,
                ruleGroupId: id,
            }
            const res = await getRuleList(params)

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

    const handleDelete = async (_, record) => {
        try {
            const params = {
                ruleId: record.ruleId,
                ruleGroupId: record.ruleGroupId
            }
            await deleteRule(params)
            handleList(id, pagination.index, pagination.size)
        } catch (error) {
            console.error(error)
        }
    }

    const handleModalClose = () => {
        setVisible(false)
    }

    const handleUpdateModalClose = () => {
        setUpdateVisible(false)
    }

    const onSearch = async (value) => {
        try {
            const params = {
                index: pagination.index,
                size: pagination.size,
                ruleGroupId: id,
                status: selectRuleStatus,
                query: value,
            }

            const res = await getRuleList(params)

            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            });

            setList(res.data.list);
        } catch (error) {
            console.error(error)
        }
    }

    const changeStatus = async ({ target: { value } }) => {
        setPagination({ ...pagination, index: 1, size: pagination.size });
        setSelectRuleStatus(value)
    }

    const handlePageChange = (page) => {
        setPagination({ ...pagination, index: page.current, size: page.size });
        handleList(id, page.current, page.size)
    };

    const handleShowTotal = (total, range) =>
        `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`;

    return (
        <>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Radio.Group
                        options={[
                            {
                                label: '全部',
                                value: 'all',
                            },
                            {
                                label: '开启',
                                value: 'enabled',
                            },
                            {
                                label: '禁用',
                                value: 'disabled',
                            }
                        ]}
                        defaultValue={selectRuleStatus}
                        onChange={changeStatus}
                        optionType="button"
                    />

                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        style={{width: 300}}
                    />
                </div>
                <div>
                    <Link to={`/ruleGroup/${id}/rule/add`}>
                        <Button
                            type="primary"
                            style={{
                                backgroundColor: '#000000'
                            }}
                        > 创 建 </Button>
                    </Link>
                </div>
            </div>

            <div style={{ marginTop: 10}}>
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
        </>
    )
}