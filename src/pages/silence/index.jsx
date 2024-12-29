import React, { useState, useEffect } from 'react';
import {Button, Input, Table, Tag, Popconfirm, message, Radio, Card} from 'antd';
import { CreateSilenceModal } from './SilenceRuleCreateModal'
import { deleteSilence, getSilenceList } from '../../api/silence';
import { ReactComponent as PrometheusImg } from "../alert/rule/img/Prometheus.svg"
import { ReactComponent as AlicloudImg } from "../alert/rule/img/alicloud.svg"
import { ReactComponent as JaegerImg } from "../alert/rule/img/jaeger.svg"
import { ReactComponent as AwsImg } from "../alert/rule/img/AWSlogo.svg"
import { ReactComponent as LokiImg } from "../alert/rule/img/L.svg"
import { ReactComponent as VMImg } from "../alert/rule/img/victoriametrics.svg"
import { ReactComponent as K8sImg } from "../alert/rule/img/Kubernetes.svg"
import { ReactComponent as ESImg } from "../alert/rule/img/ElasticSearch.svg"

export const Silences = () => {
    const { Search } = Input
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]); // 初始化list为空数组
    const [selectedCard,setSelectedCard] = useState(null)
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    });
    const [columns] = useState([
        {
            title: '告警指纹',
            dataIndex: 'fingerprint',
            key: 'fingerprint',
            width: 'auto',
        },
        {
            title: '数据源类型',
            dataIndex: 'datasource_type',
            key: 'datasource_type',
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
            title: '创建人',
            dataIndex: 'create_by',
            key: 'create_by',
        },
        {
            title: '更新时间',
            dataIndex: 'update_at',
            key: 'update_at',
            width: 'auto',
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: '评论',
            dataIndex: 'comment',
            key: 'comment',
        },
        {
            title: '静默开始时间',
            dataIndex: 'starts_at',
            key: 'starts_at',
            width: 'auto',
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: '静默结束时间',
            dataIndex: 'ends_at',
            key: 'ends_at',
            width: 'auto',
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
                <div>
                    <Popconfirm
                        title="Sure to delete?"
                        onConfirm={() => handleDelete(_, record)}
                        disabled={record.status ===1}>
                        <a style={{ cursor: record.status ===1 ? 'not-allowed' : 'pointer',
                            color: record.status ===1 ?'rgba(0, 0, 0, 0.25)': '#1677ff',
                        }}>删除</a>
                    </Popconfirm>
                    <Button type="link"
                        onClick={() => handleUpdateModalOpen(record)}
                        disabled={record.status ===1}>
                        更新
                    </Button>
                </div>
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
            const params = {
                status: index||0,
                index: pagination.index,
                size: pagination.size,
            }

            const res = await getSilenceList(params)
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
            console.error(error)
        }
    }

    const handleDelete = async (_, record) => {
        try {
            const params = {
                fingerprint: record.fingerprint,
                id: record.id,
            }
            await deleteSilence(params)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 关闭窗口
    const handleModalClose = () => {
        setVisible(false)
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false)
    }

    const handleUpdateModalOpen = (record) => {
        setSelectedRow(record)
        setUpdateVisible(true)
    };

    const onSearch = async (value) => {
        try {
            const params = {
                index: pagination.index,
                size: pagination.size,
                status: selectedCard,
                query: value,
            }

            const res = await getSilenceList(params)

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

    const cards = [
        {
            text: '进行中',
        },
        {
            text: '已失效',
        },
        {
            text: '总规则',
        },
    ];

    useEffect(() => {
        if (selectedCard === null){
            setSelectedCard(0)
        }
    }, [])

    const handleCardClick = (index) => {
        console.log(index)
        setSelectedCard(index);
        handleList(index)
    };

    return (
        <>
            <div style={{display: 'flex', gap: '10px'}}>
                {cards.map((card, index) => (
                    <Card
                        key={index}
                        style={{
                            height: 50,
                            width: '100%',
                            position: 'relative',
                            background: card.background,
                            border: selectedCard === index ? '1px solid #B0D6FBFF' : '1px solid #d9d9d9',
                        }}
                        onClick={() => handleCardClick(index)}
                    >
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            marginTop: '-20px'
                        }}>
                            <p style={{
                                fontSize: '12px',
                                textAlign: 'center',
                                fontWeight: 'bold',
                            }}>{card.text}</p>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{display: 'flex', marginTop:'10px',justifyContent: 'space-between'}}>
                <div style={{display: 'flex', gap: '10px'}}>
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        style={{width: 300}}
                    />
                </div>
            </div>

            <div style={{display: 'flex'}}>
                <CreateSilenceModal visible={visible} onClose={handleModalClose} type='create' handleList={handleList}/>

                <CreateSilenceModal visible={updateVisible} onClose={handleUpdateModalClose} selectedRow={selectedRow}
                                    type='update' handleList={handleList}/>

                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '10px',
                    width: '1000px'
                }}>

                </div>

            </div>

            <div style={{overflowX: 'auto', marginTop: 10, height: '64vh'}}>
                <Table
                    columns={columns}
                    dataSource={list}
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
    );
};