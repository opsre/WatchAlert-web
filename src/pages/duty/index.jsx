/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { useState, useEffect } from 'react';
import {Table, Button, Popconfirm, message, Space, Tag, Tooltip } from 'antd';
import { CreateDutyModal } from './DutyManageCreateModal';
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import { deleteDutyManager, getDutyManagerList } from '../../api/duty';
import {Link} from "react-router-dom";
import { copyToClipboard } from "../../utils/copyToClipboard";
import {HandleShowTotal} from "../../utils/lib";
import {Users} from "lucide-react";

export const DutyManage = () => {
    const [visible, setVisible] = useState(false);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [list, setList] = useState([]);
    const [selectedRow, setSelectedRow] = useState(null)
    const [height, setHeight] = useState(window.innerHeight);
    const [columns] = useState([
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Link
                        to={`/dutyManage/${record.id}/calendar?calendarName=${record.name}`}
                        style={{
                            color: "#1677ff",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: '4px'
                        }}
                    >
                        {text}
                    </Link>
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
                            onClick={() => copyToClipboard(record.id)}
                        >
                            {record.id}
                            <CopyOutlined style={{ marginLeft: 8 }} />
                        </span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: '负责人',
            dataIndex: 'manager',
            key: 'manager',
            width: 'auto',
            render: (text) => {
                return <span>{text.username}</span>;
            },
        },
        {
            title: '今日值班',
            dataIndex: 'curDutyUser',
            key: 'curDutyUser',
            width: 'auto',
            render: (text) => {
                if (!text || text.length === 0) {
                    return <Tag style={{
                                    borderRadius: "12px",
                                    padding: "0 10px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}>
                                    暂无
                                </Tag>;
                }
                return (
                    <>
                        {text.map((user, index) => (
                            <Tooltip title={user.username} key={index}>
                                <Tag style={{
                                    borderRadius: "12px",
                                    padding: "0 10px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}>
                                    {user.username}
                                </Tag>
                            </Tooltip>
                        ))}
                    </>
                );
            },
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 'auto',
            render: (text) => {
                if (!text) {
                    return '没有留下任何描述~';
                }
                return text;
            },
        },
        {
            title: "更新时间",
            dataIndex: "updateAt",
            key: "updateAt",
            width: "auto",
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
            title: "更新人",
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
            width: 120,
            render: (_, record) =>
                <Space size="middle">
                    <Tooltip title="更新">
                        <Button
                            type="text"
                            icon={<EditOutlined />}
                            onClick={() => handleUpdateModalOpen(record)}
                            style={{ color: "#1677ff" }}
                        />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Popconfirm
                            title="确定要删除此日程吗?"
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

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        message.success('已复制到剪贴板');
    };

    useEffect(() => {
        handleList();
    }, []);

    const handleList = async () => {
        try {
            const res = await getDutyManagerList()
            setList(res.data);
        } catch (error) {
            message.error(error);
        }
    };

    const handleDelete = async (record) => {
        try {
            const params = {
                id: record.id
            }
            await deleteDutyManager(params)
            handleList();
        } catch (error) {
            message.error(error);
        }
    };

    const handleModalClose = () => {
        setVisible(false);
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
    };

    const handleUpdateModalOpen = (record) => {
        setSelectedRow(record)
        setUpdateVisible(true)
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    type="primary"
                    onClick={() => setVisible(true)}
                    style={{
                        backgroundColor: '#000000'
                    }}
                    icon={<PlusOutlined />}
                >
                    创建
                </Button>            </div>
            <div style={{ display: 'flex' }}>

                <CreateDutyModal visible={visible} onClose={handleModalClose} handleList={handleList} type="create" />

                <CreateDutyModal visible={updateVisible} onClose={handleUpdateModalClose} handleList={handleList} selectedRow={selectedRow} type="update" />

                {/*<CalendarApp visible={calendarVisible} onClose={handleCalendarModalClose} name={calendarName} tenantId={tenantId} dutyId={calendarDutyId} handleList={handleList} />*/}

            </div>

            <div style={{ overflowX: 'auto', marginTop: 10 }}>
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