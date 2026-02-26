import React, { useState, useEffect, useCallback } from 'react';
import {Button, Table, Popconfirm, message, Input, Tag, Space, Tooltip, Drawer, Select} from 'antd';
import { CreateNoticeObjectModal } from './NoticeObjectCreateModal';
import { deleteNotice, getNoticeList, createNotice } from '../../api/notice';
import {getDutyManagerList} from "../../api/duty";
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import { copyToClipboard } from "../../utils/copyToClipboard";
import {HandleShowTotal} from "../../utils/lib";
import { noticeRecordList } from '../../api/notice';
import { NoticeRecords } from './history';
import { Breadcrumb } from "../../components/Breadcrumb";


export const NoticeObjects = () => {
    const { Search } = Input
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]);
    const [dutyList, setDutyList] = useState([])
    const [height, setHeight] = useState(window.innerHeight);
    const [historyDrawerVisible, setHistoryDrawerVisible] = useState(false);
    const [selectedNoticeObject, setSelectedNoticeObject] = useState(null);
    const [createSelectedRow, setCreateSelectedRow] = useState(null); // 用于存放复制时带入的数据
    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span 
                        style={{ 
                            cursor: 'pointer', 
                            color: '#1677ff',
                            textDecoration: 'none'
                        }}
                        onClick={() => handleShowHistory(record)}
                    >
                        {text}
                    </span>
                    <Tooltip title="点击复制 ID">
                        <span
                            style={{
                                color: '#8c8c8c',     // 灰色字体
                                fontSize: '12px',
                                cursor: 'pointer',
                                userSelect: 'none',
                                display: 'inline-block',
                                maxWidth: '200px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                            onClick={() => copyToClipboard(record.uuid)}
                        >
                            {record.uuid}
                            <CopyOutlined style={{ marginLeft: 8 }} />
                        </span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: '值班表',
            dataIndex: 'dutyId',
            key: 'dutyId',
            width: 'auto',
            render: (text, record) => (
                <span>
                  {getDutyNameById(record.dutyId)
                      .split(", ")
                      .map((name, index) => (
                          <Tag color="processing" key={index}>
                              {name}
                          </Tag>
                      ))}
                </span>
            ),
        },
        {
            title: "更新时间",
            dataIndex: "updateAt",
            key: "updateAt",
            width: "180px",
            render: (text) => {
                const date = new Date(text * 1000)
                    return (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span>{date.toLocaleString()}</span>
                        </div>
                    )
            },
        },
        {
            title: "操作人",
            dataIndex: "updateBy",
            key: "updateBy",
            width: "auto",
            render: (text) => {
                return <Tag style={{
                                borderRadius: "12px",
                                padding: "0 10px",
                                fontSize: "12px",
                                fontWeight: "500",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                            }}
                        >
                            {text || "未知用户"}
                        </Tag>
            },
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 140, // 增加宽度以容纳三个按钮
            render: (_, record) =>
                list.length >= 1 ? (
                    <Space size="middle">
                        <Tooltip title="更新">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleUpdateModalOpen(record)}
                                style={{ color: "#1677ff" }}
                            />
                        </Tooltip>
                        {/* 新增的复制按钮 */}
                        <Tooltip title="复制">
                            <Button 
                                type="text" 
                                icon={<CopyOutlined />} 
                                 style={{ color: "#52c41a" }} // 使用绿色区分
                            />
                        </Tooltip>
                        <Tooltip title="删除">
                            <Popconfirm
                                title="确定要删除吗?"
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

    const handleList = useCallback(async () => {
        handleDutyManagerList()

        try {
            const res = await getNoticeList()
            setList(res?.data);
        } catch (error) {
            message.error(error);
        }
    }, []);

    useEffect(() => {
        handleList();
    }, [handleList]);

    const handleDutyManagerList = async () => {
        try {
            const res = await getDutyManagerList()
            setDutyList(res?.data);
        } catch (error) {
            message.error(error);
        }
    };

    const getDutyNameById = (id) =>{
        const datasource = dutyList.find((d) => d.id === id)
        return datasource ? datasource.name : "-"
    }

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
    };

    const handleUpdateModalOpen = (record) => {
        setSelectedRow(record);
        setUpdateVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            const params = {
                uuid: record.uuid
            }
            await deleteNotice(params)
            handleList();
        } catch (error) {
            message.error(error);
        }
    };
    
// 修改原有的 handleCopy 函数
    const handleCopy = (record) => {
        // 构造新的复制参数，给名称加一个 "-复制" 的后缀
        const copiedRecord = {
            ...record,
            name: `${record.name}-复制`
        };
        // 保存复制的数据并打开弹窗
        setCreateSelectedRow(copiedRecord);
        setVisible(true); 
    };

    const handleModalClose = () => {
        setVisible(false);
        setCreateSelectedRow(null); // 关闭弹窗时清空复制产生的数据
    };

    const onSearch = async (value) => {
        try {
            const params = {
                query: value,
            }
            const res = await getNoticeList(params)
            setList(res?.data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleShowHistory = (record) => {
        setSelectedNoticeObject(record);
        setHistoryDrawerVisible(true);
    };

    const handleHistoryDrawerClose = () => {
        setHistoryDrawerVisible(false);
        setSelectedNoticeObject(null);
    };

    return (
        <>
            <Breadcrumb items={['通知管理', '通知对象']} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                </div>
                <div>
                    <Button
                        type="primary"
                        onClick={() => {
                            setCreateSelectedRow(null); // 确保正常创建时是个空表单
                            setVisible(true)}}
                        style={{
                            backgroundColor: '#000000'
                        }}
                        icon={<PlusOutlined />}
                    >
                        创建
                    </Button>
                </div>
            </div>

            <CreateNoticeObjectModal 
                visible={visible} 
                onClose={handleModalClose} 
                selectedRow={createSelectedRow} 
                type='create' 
                handleList={handleList} 
            />

            <CreateNoticeObjectModal visible={updateVisible} onClose={handleUpdateModalClose} selectedRow={selectedRow} type='update' handleList={handleList} />

            <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        y: height - 250, // 动态设置滚动高度
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

            {/* 通知历史记录 Drawer */}
            <Drawer
                title={`通知记录 - ${selectedNoticeObject?.name || ''}`}
                open={historyDrawerVisible}
                onClose={handleHistoryDrawerClose}
                width={1000}
                destroyOnClose={true}
            >
                {selectedNoticeObject && (
                    <NoticeRecords noticeObjectId={selectedNoticeObject.uuid} />
                )}
            </Drawer>
        </>
    );
};
