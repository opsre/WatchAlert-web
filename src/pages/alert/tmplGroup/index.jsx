"use client"

import { Button, Input, Table, Popconfirm, Badge, Tooltip, Modal, Empty, Dropdown } from "antd"
import { useState, useEffect } from "react"
import RuleTemplateGroupCreateModal from "./RuleTemplateGroupCreateModal"
import { Link, useParams } from "react-router-dom"
import { deleteRuleTmplGroup, getRuleTmplGroupList } from "../../../api/ruleTmpl"
import { ReactComponent as Metric } from "../assets/metric.svg"
import { ReactComponent as Log } from "../assets/log.svg"
import { ReactComponent as Trace } from "../assets/trace.svg"
import { ReactComponent as Event } from "../assets/event.svg"
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined, MoreOutlined, AppstoreOutlined } from "@ant-design/icons"
import {HandleShowTotal} from "../../../utils/lib";
import { TableWithPagination } from "../../../utils/TableWithPagination";
import { Breadcrumb } from "../../../components/Breadcrumb";

const { Search } = Input

export const RuleTemplateGroup = () => {
    const { tmplType } = useParams()
    const [selectedType, setSelectedType] = useState(tmplType)
    const [selectedRow, setSelectedRow] = useState(null)
    const [updateVisible, setUpdateVisible] = useState(false)
    const [visible, setVisible] = useState(false)
    const [list, setList] = useState([])
    const [loading, setLoading] = useState(false)
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    })

    // Table columns
    const columns = [
        {
            title: "模版组名称",
            dataIndex: "name",
            key: "name",
            render: (text, record) => (
                <Link
                    to={`/tmplType/${record.type}/${record.name}/templates`}
                    style={{
                        color: "#1677ff",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                >
                    {text}
                </Link>
            ),
        },
        {
            title: "模版数",
            dataIndex: "number",
            key: "number",
            width: 120,
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
            title: "描述",
            dataIndex: "description",
            key: "description",
            ellipsis: {
                showTitle: false,
            },
            render: (text) => (
                <Tooltip placement="topLeft" title={text || "-"}>
                    <span>{text || "-"}</span>
                </Tooltip>
            ),
        },
        {
            title: "操作",
            dataIndex: "operation",
            width: 60,
            render: (_, record) =>
                list.length >= 1 ? (
                    <Dropdown
                        menu={{
                            items: [
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
                                    onClick: () => {
                                        Modal.confirm({
                                            title: "确定要删除此模版组吗?",
                                            content: `模版组名称: ${record.name}`,
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
    ]

    const [height, setHeight] = useState(window.innerHeight)

    useEffect(() => {
        setSelectedType(tmplType)

        // Handle window resize
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        window.addEventListener("resize", handleResize)

        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    const handleList = async (index, size) => {
        try {
            setLoading(true);
            const params = {
                index: index,
                size: size,
                type: selectedType,
            };
            const res = await getRuleTmplGroupList(params);

            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            });

            setList(res?.data?.list)
        } catch (error) {
            console.error("Failed to fetch template groups:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (record) => {
        try {
            setLoading(true)
            const params = {
                name: record.name,
            }
            await deleteRuleTmplGroup(params)
            handleList(pagination.index, pagination.size)
        } catch (error) {
            console.error("Failed to delete template group:", error)
        }
    }

    useEffect(() => {
        handleList(pagination.index, pagination.size)
    }, [pagination.index, pagination.size, selectedType])

    const handleModalClose = () => setVisible(false)

    const handleUpdateModalClose = () => setUpdateVisible(false)

    const onSearch = async (value) => {
        try {
            setLoading(true)
            const params = {
                type: selectedType,
                index: pagination.index,
                size: pagination.size,
                query: value,
            }

            const res = await getRuleTmplGroupList(params)

            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            })

            setList(res?.data?.list)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const menuItems = [
        {
            key: "Metrics",
            label: "Metrics",
            icon: <Metric style={{ height: "14px", width: "14px" }} />,
        },
        {
            key: "Logs",
            label: "Logs",
            icon: <Log style={{ height: "14px", width: "14px" }} />,
        },
        {
            key: "Traces",
            label: "Traces",
            icon: <Trace style={{ height: "14px", width: "14px" }} />,
        },
        {
            key: "Events",
            label: "Events",
            icon: <Event style={{ height: "14px", width: "14px" }} />,
        },
    ]

    // Handle menu click
    const handleClick = (e) => {
        setPagination({
            index: 1,
            size: 10,
            total: 0,
        });

        const type = e.key
        setSelectedType(type)
        const pathname = `/tmplType/${type}/group`
        window.history.pushState({}, "", pathname)
    }

    const handleUpdateModalOpen = (record) => {
        setUpdateVisible(true)
        setSelectedRow(record)
    }

    // Get the current type label
    const getCurrentTypeLabel = () => {
        const currentItem = menuItems.find((item) => item.key === selectedType)
        return currentItem ? currentItem.label : "模版组"
    }

    return (
        <>
        <Breadcrumb items={['告警管理', '模版组']} />
        <div style={{ display: 'flex', height: '100%' }}>
            {/* 卡片式 sidebar */}
            <div style={{ width: '210px', flexShrink: 0, paddingRight: '12px' }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    height: 'calc(100vh - 120px)',
                    overflow: 'hidden',
                    background: '#fff',
                    borderRadius: '10px',
                    border: '1px solid #f0f0f0',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                    {/* 头部 */}
                    <div style={{
                        padding: '10px 12px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}>
                        <AppstoreOutlined style={{ fontSize: '14px', color: '#595959' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#262626' }}>模版类型</span>
                        <Badge
                            count={menuItems.length}
                            style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', fontSize: '11px', boxShadow: 'none' }}
                        />
                    </div>

                    {/* 类型卡片列表 */}
                    <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {menuItems.map(item => {
                                const isSelected = item.key === selectedType
                                return (
                                    <div
                                        key={item.key}
                                        style={{
                                            padding: '9px 12px',
                                            borderRadius: '7px',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            background: isSelected ? '#f5f0e6' : '#fff',
                                            border: `1px solid ${isSelected ? 'rgba(167, 135, 83, 0.45)' : '#f0f0f0'}`,
                                            boxShadow: isSelected
                                                ? '0 1px 4px rgba(167, 135, 83, 0.12)'
                                                : '0 0.5px 2px rgba(0,0,0,0.04)',
                                            transition: 'all 0.12s ease',
                                        }}
                                        onClick={() => handleClick({ key: item.key })}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                flexShrink: 0,
                                            }}>
                                                {item.icon}
                                            </span>
                                            <span style={{
                                                fontSize: '12px',
                                                fontWeight: isSelected ? 500 : 400,
                                                color: isSelected ? 'rgb(120, 95, 50)' : '#262626',
                                            }}>
                                                {item.label}
                                            </span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* 主内容区 */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: '20px' }}>
                <div style={{
                    background: '#fff',
                    borderRadius: '8px',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}>
                    {/* 搜索栏 */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <Search
                            allowClear
                            placeholder="输入搜索关键字"
                            onSearch={onSearch}
                            style={{ width: 300 }}
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setVisible(true)}
                            style={{ backgroundColor: '#000000' }}
                        >
                            创建
                        </Button>
                    </div>

                    <TableWithPagination
                        columns={columns}
                        dataSource={list}
                        loading={loading}
                        pagination={pagination}
                        onPageChange={(page, pageSize) => {
                            setPagination({ ...pagination, index: page, size: pageSize });
                            handleList(page, pageSize);
                        }}
                        onPageSizeChange={(current, pageSize) => {
                            setPagination({ ...pagination, index: current, size: pageSize });
                            handleList(current, pageSize);
                        }}
                        scrollY={height - 250}
                        rowKey={record => record.id}
                        showTotal={HandleShowTotal}
                        locale={{
                            emptyText: <Empty description="暂无模版组" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
                        }}
                    />

                    {/* Modals */}
                    <RuleTemplateGroupCreateModal
                        visible={visible}
                        onClose={handleModalClose}
                        openType="create"
                        tmplType={selectedType}
                        handleList={handleList}
                    />
                    <RuleTemplateGroupCreateModal
                        visible={updateVisible}
                        onClose={handleUpdateModalClose}
                        tmplType={selectedType}
                        selectedRow={selectedRow}
                        openType="update"
                        handleList={handleList}
                    />
                </div>
            </div>
        </div>
        </>
    )
}
