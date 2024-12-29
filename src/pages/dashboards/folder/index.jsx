import { Button, Table, Popconfirm, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteRuleGroup } from '../../../api/rule'
import {
    deleteDashboard,
    deleteDashboardFolder,
    getDashboardList,
    getFolderList,
    searchDashboard
} from '../../../api/dashboard';
import CreateFolderModal from './create';

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
                < div >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link to={`/folder/${record.id}/list`}>{text}</Link>
                    </div>
                </div >
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            width: 120,
            fixed: 'right',
            render: (_, record) =>
                list.length >= 1 ? (
                    <div>
                        <Popconfirm
                            title="Sure to delete?"
                            onConfirm={() => handleDelete(_, record)}>
                            <a>删除</a>
                        </Popconfirm>

                        <Button
                            type="link" onClick={() => handleUpdateModalOpen(record)} >
                            更新
                        </Button>
                    </div>
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

    const handleDelete = async (_, record) => {
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
            const res = await searchDashboard(params)
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
