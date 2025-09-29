import {Button, Table, Popconfirm, Input, Tooltip, Space, message} from 'antd'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    deleteDashboardFolder,
    getFolderList,
    searchDashboard
} from '../../../api/dashboard';
import CreateFolderModal from './create';
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import { copyToClipboard } from "../../../utils/copyToClipboard";
import {HandleShowTotal} from "../../../utils/lib";

export const DashboardFolder = () => {
    const { Search } = Input
    const [list, setList] = useState()
    const [selectedRow, setSelectedRow] = useState(null)
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Link
                        to={`/folder/${record.id}/list`}
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
            title: '端点',
            dataIndex: 'grafanaHost',
            key: 'grafanaHost',
        },
        {
            title: '目录ID',
            dataIndex: 'grafanaFolderId',
            key: 'grafanaFolderId',
        },
        {
            title: '版本',
            dataIndex: 'grafanaVersion',
            key: 'grafanaVersion',
        },
        {
            title: '操作',
            dataIndex: 'operation',
            width: 120,
            fixed: 'right',
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
        handleList()
    }, [])


    const handleList = async () => {
        try {
            const res = await getFolderList();
            const d = res.data.map((item, index) => {
                return {
                    key: index,
                    ...item,
                }
            })
            setList(d);
        } catch (error) {
            console.error(error);
        }
    }

    const handleDelete = async (record) => {
        try {
            const params = {
                id: record.id,
            }
            await deleteDashboardFolder(params)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    const handleModalClose = () => {
        setCreateModalVisible(false)
    }

    const handleUpdateModalOpen = (record) => {
        setUpdateModalVisible(true)
        setSelectedRow(record)
    }

    const handleUpdateModalClose = () => {
        setUpdateModalVisible(false)
    }

    const onSearch = async (value) => {
        try {
            const params = {
                query: value,
            }
            const res = await getFolderList(params)
            setList(res.data)
        } catch (error) {
            console.error(error)
        }
        console.log(value)
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        style={{ width: 300 }}
                        onSearch={onSearch}
                    />
                </div>
                <div>
                    <Button
                        type="primary"
                        onClick={() => { setCreateModalVisible(true) }}
                        style={{
                            backgroundColor: '#000000'
                        }}
                        icon={<PlusOutlined />}
                    >
                        创建
                    </Button>
                </div>
            </div>

            <CreateFolderModal
                visible={createModalVisible}
                onClose={handleModalClose}
                type="create"
                handleList={handleList}
            />

            <CreateFolderModal
                visible={updateModalVisible}
                onClose={handleUpdateModalClose}
                selectedRow={selectedRow}
                type="update"
                handleList={handleList}
            />

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
