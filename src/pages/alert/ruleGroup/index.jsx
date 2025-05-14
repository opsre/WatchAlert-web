import {Button, Input, Table, Popconfirm, message, Space, Tooltip, Badge} from 'antd'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertRuleGroupCreateModal } from './AlertRuleGroupCreateModal'
import {CopyOutlined, DeleteOutlined, EditOutlined, FileTextOutlined} from '@ant-design/icons';
import { deleteRuleGroup, getRuleGroupList } from '../../../api/rule'

export const AlertRuleGroup = ({ }) => {
    const { Search } = Input
    const [list, setList] = useState()
    const [selectedRow, setSelectedRow] = useState(null)
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    });
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 'auto',
            render: (text, record) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link
                            to={`/ruleGroup/${record.id}/rule/list`}
                            style={{
                                color: "#1677ff",
                                fontWeight: "500",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {text}
                        </Link>
                        <CopyOutlined
                            style={{ marginLeft: '5px', cursor: 'pointer', color: "#1677ff" }}
                            onClick={() => handleCopy(text)}
                        />
                    </div>
                </div>
            ),
        },
        {
            title: '规则组名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
        },
        {
            title: '规则数',
            dataIndex: 'number',
            key: 'number',
            width: 'auto',
            render: (count) => (
                <Badge
                    count={count}
                    showZero
                    style={{
                        backgroundColor: count > 0 ? "#1677ff" : "#d9d9d9",
                        fontWeight: "normal",
                        fontSize: "14px",
                    }}
                />
            ),
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (text, record, index) => {
                if (!text) {
                    return '没有留下任何描述~';
                }
                return text;
            },
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
        handleList(pagination.index, pagination.size)
    }, [])

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        message.success('已复制到剪贴板');
    };

    const handleList = async (index, size) => {
        try {
            const params = {
                index: index,
                size: size,
            }
            const res = await getRuleGroupList(params)

            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            });

            setList(res.data.list)
        } catch (error) {
            console.error(error)
        }
    }

    const handlePageChange = (page) => {
        setPagination({ ...pagination, index: page.current, size: page.size });
        handleList(page.current, page.size)
    };

    const handleDelete = async (record) => {
        try {
            const params = {
                id: record.id,
            }
            await deleteRuleGroup(params)
            handleList(pagination.index, pagination.size)
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
                index: pagination?.index,
                size: pagination?.size,
                query: value,
            }

            const res = await getRuleGroupList(params)

            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            });

            setList(res.data.list)
        } catch (error) {
            console.error(error)
        }
    }

    const handleShowTotal = (total, range) =>
        `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`;

    return (
        <>
            <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <div>
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        style={{width: 300}}
                    />
                </div>
                <div>
                    <Button
                        type="primary"
                        onClick={() => setCreateModalVisible(true)}
                        style={{
                            marginLeft: 'auto',
                            backgroundColor: '#000000'
                        }}
                    >
                        创建
                    </Button>
                </div>
            </div>

            <AlertRuleGroupCreateModal visible={createModalVisible} onClose={handleModalClose} type='create'
                                       handleList={handleList} pagination={pagination}/>

            <AlertRuleGroupCreateModal visible={updateModalVisible} onClose={handleUpdateModalClose}
                                       selectedRow={selectedRow} type='update' handleList={handleList} pagination={pagination}/>

            <div style={{overflowX: 'auto', marginTop: 10}}>
                <Table
                    columns={columns}
                    dataSource={list}
                    pagination={{
                        index: pagination.index ?? 1,
                        size: pagination.size ?? 10,
                        total: pagination?.total ?? 0,
                        showTotal: handleShowTotal,
                    }}
                    onChange={handlePageChange}
                    scroll={{
                        y: height - 280, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
                    }}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                    rowKey={(record) => record.id} // 设置行唯一键
                    rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                />
            </div>
        </>
    );
};
