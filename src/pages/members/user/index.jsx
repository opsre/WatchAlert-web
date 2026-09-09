import {Input, Table, Button, Popconfirm, Tooltip, Space, Dropdown, Modal} from 'antd';
import React, { useState, useEffect } from 'react';
import UserCreateModal from './UserCreateModal';
import UserChangePass from './UserChangePass';
import { deleteUser, getUserList } from '../../../api/user';
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined, MoreOutlined} from "@ant-design/icons";
import {HandleShowTotal} from "../../../utils/lib";
import {Link} from "react-router-dom";
import {copyToClipboard} from "../../../utils/copyToClipboard";
import { Breadcrumb } from "../../../components/Breadcrumb";


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
                            onClick={() => copyToClipboard(record.userid)}
                        >
                            {record.userid}
                            <CopyOutlined style={{ marginLeft: 8 }} />
                        </span>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            key: 'email',
            render: (text) => text || '-',
        },
        {
            title: '手机号',
            dataIndex: 'phone',
            key: 'phone',
            render: (text) => text || '-',
        },
        {
            title: '创建人',
            dataIndex: 'create_by',
            key: 'create_by',
        },
        {
            title: '创建时间',
            dataIndex: 'create_at',
            key: 'create_at',
            render: (text) => new Date(text * 1000).toLocaleString(),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 60,
            render: (_, record) =>
                list.length >= 1 ? (
                    <Dropdown
                        menu={{
                            items: [
                                {
                                    key: 'reset-password',
                                    label: '重置密码',
                                    disabled: record.create_by === 'LDAP',
                                    onClick: () => openChangePassModal(record)
                                },
                                {
                                    key: 'edit',
                                    icon: <EditOutlined />,
                                    label: '更新',
                                    onClick: () => handleUpdateModalOpen(record)
                                },
                                {
                                    key: 'delete',
                                    icon: <DeleteOutlined />,
                                    label: '删除',
                                    danger: true,
                                    disabled: record.userid === "admin",
                                    onClick: () => {
                                        Modal.confirm({
                                            title: "确定要删除此用户吗?",
                                            content: `用户名: ${record.username}`,
                                            okText: "确定",
                                            cancelText: "取消",
                                            okType: 'danger',
                                            onOk: () => handleDelete(record)
                                        })
                                    }
                                }
                            ]
                        }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined />}
                            style={{ color: "#666" }}
                        />
                    </Dropdown>
                ) : null,
        },
    ];

    useEffect(() => {
        const handleResize = () => setHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // 加载用户列表
    const handleList = async () => {
        try {
            const res = await getUserList();
            setList(res?.data);
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
            const params = {
                query: value
            }
            const res = await getUserList(params)
            setList(res?.data);
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
            <Breadcrumb items={['人员组织', '用户管理']} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={onSearch}
                    style={{ width: 300 }}
                />
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
                />
            </div>
        </>
    );
};
