import React, { useState, useEffect } from 'react';
import {Button, Table, Popconfirm, message} from 'antd';
import { deleteTenant, getTenantList } from '../../api/tenant';
import { CreateTenant } from './CreateTenant';
import {Link} from "react-router-dom";
import {getUserInfo} from "../../api/user";

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
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link to={`/tenants/detail/${record.id}`}>{text}</Link>
                    </div>
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
            width: 'auto',
            render: (text) => {
                if (!text) {
                    return '-'
                }
                return text
            }
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
                        disabled={record.id === 'default'}
                        onConfirm={() => handleDelete(_, record)}>
                        <a style={{
                            cursor: record.id === 'default' ? 'not-allowed' : 'pointer',
                            color: record.id === 'default' ? 'rgba(0, 0, 0, 0.25)' : '#1677ff'
                        }}>删除</a>
                    </Popconfirm>
                    <Button type="link"
                        onClick={() => handleUpdateModalOpen(record)}>
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

    const handleDelete = async (_, record) => {
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
                >
                    创建
                </Button>
            </div>

            <CreateTenant visible={visible} onClose={handleModalClose} type='create' handleList={handleList} />
            <CreateTenant visible={updateVisible} selectedRow={selectedRow} onClose={handleUpdateModalClose} type='update' handleList={handleList} />

            <div style={{ overflowX: 'auto', marginTop: 10, height: '64vh',textAlign:'left' }}>
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