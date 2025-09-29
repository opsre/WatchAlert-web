import React, { useState, useEffect } from 'react';
import {Button, Input, Table, Tag, Popconfirm, message, Radio, Card, Tooltip, Space} from 'antd';
import {deleteSubscribe, listSubscribe} from "../../api/subscribe";
import {Link} from "react-router-dom";
import { ReactComponent as PrometheusImg } from "../alert/rule/img/Prometheus.svg"
import { ReactComponent as AlicloudImg } from "../alert/rule/img/alicloud.svg"
import { ReactComponent as JaegerImg } from "../alert/rule/img/jaeger.svg"
import { ReactComponent as AwsImg } from "../alert/rule/img/AWSlogo.svg"
import { ReactComponent as LokiImg } from "../alert/rule/img/L.svg"
import { ReactComponent as VMImg } from "../alert/rule/img/victoriametrics.svg"
import { ReactComponent as K8sImg } from "../alert/rule/img/Kubernetes.svg"
import { ReactComponent as ESImg } from "../alert/rule/img/ElasticSearch.svg"
import { ReactComponent as VLogImg } from "../alert/rule/img/victorialogs.svg"
import {DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {HandleShowTotal} from "../../utils/lib";

export const Subscribe = () => {
    const { Search } = Input
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [list, setList] = useState([]); // 初始化list为空数组
    const [columns] = useState([
        {
            title: '订阅规则',
            dataIndex: 'sRuleName',
            key: 'sRuleName',
        },
        {
            title: '规则类型',
            dataIndex: 'sRuleType',
            key: 'sRuleType',
            render: (text) => {
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
                        {text === "VictoriaLogs" && (
                            <VLogImg style={{ height: "25px", width: "25px" }} />
                        )}
                        <div style={{marginLeft: "5px", marginTop: '3px',fontSize :'12px'}}>{text}</div>
                    </div>
                )
            },
        },
        {
            title: '告警等级',
            dataIndex: 'sRuleSeverity',
            key: 'sRuleSeverity',
            render: (text) => (
                <span>
                    {text.map((item, index) => (
                        <Tag color={item === "P0" ? "red" : item === "P1" ? "gold" : item === "P2" ? "cyan" : "purple"} key={index}>
                            {item}
                        </Tag>
                    ))}

                </span>
            ),
        },
        {
            title: '订阅时间',
            dataIndex: 'sCreateAt',
            key: 'sCreateAt',
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
            render: (_, record) =>
                <Space size="middle">
                    <Tooltip title="删除">
                        <Popconfirm
                            title="确定要删除此订阅吗?"
                            onConfirm={() => handleDelete(record)}
                            okText="确定"
                            cancelText="取消"
                            placement="left"
                        >
                            <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
                        </Popconfirm>
                    </Tooltip>
                </Space>
        },
    ]);
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
        handleList();
    }, []);

    // 获取所有数据
    const handleList = async (index) => {
        try {
            const res = await listSubscribe()
            const sortedList = res.data.sort((a, b) => {
                return new Date(b.sCreateAt) - new Date(a.sCreateAt);
            });

            setList(sortedList);
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (record) => {
        try {
            const params = {
                sId: record.sId,
            }
            await deleteSubscribe(params)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 关闭窗口
    const handleModalClose = () => {
        setCreateModalVisible(false)
    };

    const onSearch = async (value) => {
        try {
            // const params = {
            //     index: pagination.index,
            //     size: pagination.size,
            //     status: selectedCard,
            //     query: value,
            // }
            //
            // const res = await getSilenceList(params)
            //
            // setList(res.data.list);
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <div style={{display: 'flex', marginTop: '10px', justifyContent: 'space-between'}}>
                <div style={{display: 'flex', gap: '10px'}}>
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        style={{width: 300}}
                    />
                </div>

                <div>
                    <Link to={`/subscribe/create`}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            style={{
                                backgroundColor: '#000000'
                            }}
                        > 创建 </Button>
                    </Link>
                </div>
            </div>

            {/*<CreateSilenceModal visible={visible} onClose={handleModalClose} type='create' handleList={handleList}/>*/}

            <div style={{overflowX: 'auto', marginTop: 10, height: '64vh'}}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        y: height - 280, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
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
                    rowKey={(record) => record.id} // 设置行唯一键
                />
            </div>
        </>
    );
};