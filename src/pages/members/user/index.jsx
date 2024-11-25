import { Input, Table, Button, Popconfirm } from 'antd';
import React, { useState, useEffect } from 'react';
import UserCreateModal from './UserCreateModal';
import UserChangePass from './UserChangePass';
import { deleteUser, getUserList, searchUser } from '../../../api/user';

const { Search } = Input;

export const User = () => {
    const [selectedRow, setSelectedRow] = useState(null); // 当前选中行
    const [updateVisible, setUpdateVisible] = useState(false); // 更新弹窗可见性
    const [changeVisible, setChangeVisible] = useState(false); // 修改密码弹窗可见性
    const [visible, setVisible] = useState(false); // 创建弹窗可见性
    const [list, setList] = useState([]); // 用户列表
    const [height, setHeight] = useState(window.innerHeight); // 动态表格高度

    // 表格列定义
    const columns = [
        {
            title: '用户名',
            dataIndex: 'username',
            key: 'username',
            width: 30,
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            width: 40,
            render: (text) => text || '-',
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            width: 40,
            render: (text) => text || '-',
        },
        {
            title: '创建人',
            dataIndex: 'create_by',
            key: 'create_by',
            width: 40,
        },
        {
            title: '创建时间',
            dataIndex: 'create_at',
            key: 'create_at',
            width: 50,
            render: (text) => new Date(text * 1000).toLocaleString(),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 30,
            render: (_, record) => (
                list.length >= 1 && (
                    <div>
                        <Button
                            type="link"
                            onClick={() => openChangePassModal(record)}
                            disabled={record.create_by === 'LDAP'}
                        >
                            重置密码
                        </Button>
                        <Popconfirm
                            title="确定删除此用户？"
                            onConfirm={() => handleDelete(record)}
                            disabled={record.username === 'admin'}
                        >
                            <a
                                style={{
                                    cursor: record.username === 'admin' ? 'not-allowed' : 'pointer',
                                    color: record.username === 'admin' ? 'rgba(0, 0, 0, 0.25)' : '#1677ff',
                                }}
                            >
                                删除
                            </a>
                        </Popconfirm>
                        <Button type="link" onClick={() => handleUpdateModalOpen(record)}>
                            更新
                        </Button>
                    </div>
                )
            ),
        },
    ];

    // 动态调整表格高度
    useEffect(() => {
        const handleResize = () => setHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 加载用户列表
    const handleList = async () => {
        try {
            const res = await getUserList();
            setList(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // 删除用户
    const handleDelete = async (record) => {
        try {
            await deleteUser({ userid: record.userid });
            handleList();
        } catch (error) {
            console.error(error);
        }
    };

    // 打开更新用户弹窗
    const handleUpdateModalOpen = (record) => {
        setSelectedRow(record);
        setUpdateVisible(true);
    };

    // 打开重置密码弹窗
    const openChangePassModal = (record) => {
        setSelectedRow(record); // 动态绑定当前选中用户
        setChangeVisible(true);
    };

    // 搜索用户
    const onSearch = async (value) => {
        try {
            const res = await searchUser({ query: value });
            setList(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // 初始化加载用户列表
    useEffect(() => {
        handleList();
    }, []);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={onSearch}
                    style={{ width: 300 }}
                />
                <Button type="primary" onClick={() => setVisible(true)}>
                    创建
                </Button>
            </div>

            {/* 用户创建弹窗 */}
            <UserCreateModal
                visible={visible}
                onClose={() => setVisible(false)}
                type="create"
                handleList={handleList}
            />

            {/* 用户更新弹窗 */}
            <UserCreateModal
                visible={updateVisible}
                onClose={() => setUpdateVisible(false)}
                selectedRow={selectedRow}
                type="update"
                handleList={handleList}
            />

            {/* 重置密码弹窗 */}
            {selectedRow && (
                <UserChangePass
                    visible={changeVisible}
                    onClose={() => setChangeVisible(false)}
                    userid={selectedRow.userid}
                    username={selectedRow.username}
                />
            )}

            {/* 用户表格 */}
            <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    rowKey="userid"
                    scroll={{ x: 1500, y: height - 400 }}
                />
            </div>
        </>
    );
};
