import React, { useState, useEffect } from 'react';
import {Button, Table, Popconfirm, message, Tooltip, Space} from 'antd';
import { deleteTenant, getTenantList } from '../../api/tenant';
import { CreateTenant } from './CreateTenant';
import {Link} from "react-router-dom";
import {getUserInfo} from "../../api/user";
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {copyToClipboard} from "../../utils/copyToClipboard";
import {HandleShowTotal} from "../../utils/lib";


export const Tenants = () => {
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]);
    const [columns] = useState([
        {
            title: '租户名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Link
                        to={`/tenants/detail/${record.id}`}
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
            width: 'auto'

        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: '500px',
            render: (text) => {
                if (!text) {
                    return '-'
                }
                return text
            }
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
                <div>
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
                                title={`确定要删除租户 ${record.name} 吗?`}
                                onConfirm={() => handleDelete(record)}
                                okText="确定"
                                cancelText="取消"
                                placement="left"
                            >
                                <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
                            </Popconfirm>
                        </Tooltip>
                    </Space>
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
    const handleList = async () => {
        let userid = ""
        try {
            const userRes = await getUserInfo()
            userid = userRes.data.userid
        } catch (error){
            console.log(error)
        }

        try {
            const params = {
                userId: userid,
            }
            const res = await getTenantList(params)
            if (res.data === null || res.data.length === 0){
                message.error("该用户没有可用租户")
            }
            setList(res.data);
        } catch (error) {
            console.error(error)
        }
    }

    const handleDelete = async (record) => {
        try {
            const params = {
                id: record.id,
            }
            await deleteTenant(params)
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

            <CreateTenant visible={visible} onClose={handleModalClose} type='create' handleList={handleList} />
            <CreateTenant visible={updateVisible} selectedRow={selectedRow} onClose={handleUpdateModalClose} type='update' handleList={handleList} />

            <div style={{ overflowX: 'auto', marginTop: 10, textAlign:'left' }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        y: height - 280, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
                    }}
                    pagination={{
                        showTotal: HandleShowTotal,
                        pageSizeOptions: ['10'],
                    }}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                    rowKey={(record) => record.id} // 设置行唯一键
                />
            </div>
        </>
    );
};