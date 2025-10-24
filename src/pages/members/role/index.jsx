import {Input, Table, Button, Popconfirm, Tooltip, Space} from 'antd';
import React, { useState, useEffect } from 'react';
import UserRoleCreateModal from './UserRoleCreateModal';
import { deleteRole, getRoleList } from '../../../api/role';
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {HandleShowTotal} from "../../../utils/lib";
import {copyToClipboard} from "../../../utils/copyToClipboard";

const { Search } = Input;

export const UserRole = () => {
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]);

    // 表头
    const columns = [
        {
            title: '角色名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {text}
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
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 'auto',
            render: (text) => (!text ? '-' : text),
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
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
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
                                title="确定要删除此角色吗?"
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

    const handleList = async () => {
        const res = await getRoleList();
        setList(res.data);
    };

    const handleDelete = async (record) => {
        const params = {
            id: record.id,
        };
        await deleteRole(params);
        handleList();
    };

    const handleModalClose = () => {
        setVisible(false);
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
    };

    const handleUpdateModalOpen = (record) => {
        setSelectedRow(record);
        setUpdateVisible(true);
    };

    useEffect(() => {
        handleList();
    }, []);

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
                </Button>
            </div>

            <UserRoleCreateModal visible={visible} onClose={handleModalClose} type="create" handleList={handleList} />

            <UserRoleCreateModal
                visible={updateVisible}
                onClose={handleUpdateModalClose}
                selectedRow={selectedRow}
                type="update"
                handleList={handleList}
            />

            <div style={{ overflowX: 'auto', marginTop: 10, height: '65vh' }}>
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