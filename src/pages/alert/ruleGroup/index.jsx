import {Button, Input, Table, Popconfirm, Space, Tooltip, Badge, Pagination} from 'antd'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertRuleGroupCreateModal } from './AlertRuleGroupCreateModal'
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import { deleteRuleGroup, getRuleGroupList } from '../../../api/rule'
import { copyToClipboard } from "../../../utils/copyToClipboard";
import {HandleShowTotal} from "../../../utils/lib";
import { TableWithPagination } from "../../../utils/TableWithPagination"

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
            title: '规则组名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Link
                        to={`/ruleGroup/${record.id}/rule/list`}
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
                        icon={<PlusOutlined />}
                    >
                        创建
                    </Button>
                </div>
            </div>

            <AlertRuleGroupCreateModal visible={createModalVisible} onClose={handleModalClose} type='create'
                                       handleList={handleList} pagination={pagination}/>

            <AlertRuleGroupCreateModal visible={updateModalVisible} onClose={handleUpdateModalClose}
                                       selectedRow={selectedRow} type='update' handleList={handleList} pagination={pagination}/>

            <TableWithPagination
                columns={columns}
                dataSource={list}
                pagination={pagination}
                onPageChange={(page, pageSize) => {
                    setPagination({ ...pagination, index: page, size: pageSize });
                    handleList(page, pageSize);
                }}
                onPageSizeChange={(current, size) => {
                    setPagination({ ...pagination, index: current, size });
                    handleList(current, size);
                }}
                scrollY={height - 280}
                rowKey={record => record.id}
                showTotal={HandleShowTotal}
            />
        </>
    );
};
