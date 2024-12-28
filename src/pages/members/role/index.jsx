import { Input, Table, Button, Popconfirm } from 'antd';
import React, { useState, useEffect } from 'react';
import UserRoleCreateModal from './UserRoleCreateModal';
import { deleteRole, getRoleList } from '../../../api/role';

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
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 'auto',
            render: (text) => (!text ? '-' : text),
        },
        {
            title: '创建时间',
            dataIndex: 'create_at',
            key: 'create_at',
            width: 'auto',
            render: (text) => {
                const date = new Date(text * 1000);
                return date.toLocaleString();
            },
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
            render: (_, record) =>
                list.length >= 1 ? (
                    <div>
                        <Popconfirm
                            title="Sure to delete?"
                            onConfirm={() => handleDelete(record)}
                            disabled={record.name === 'admin'}
                        >
                            <a
                                style={{
                                    cursor: record.name === 'admin' ? 'not-allowed' : 'pointer',
                                    color: record.name === 'admin' ? 'rgba(0, 0, 0, 0.25)' : '#1677ff',
                                }}
                            >
                                删除
                            </a>
                        </Popconfirm>
                        <Button
                            disabled={record.name === 'admin'}
                            type="link"
                            onClick={() => handleUpdateModalOpen(record)}
                        >
                            更新
                        </Button>
                    </div>
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
                        x: 1000,
                        y: height-400,
                    }}
                />
            </div>
        </>
    );
};