"use client"

import { Button, Input, Table, Popconfirm, Divider, Menu, Badge, Tooltip, Space, Empty } from "antd"
import { useState, useEffect } from "react"
import RuleTemplateGroupCreateModal from "./RuleTemplateGroupCreateModal"
import { Link, useParams } from "react-router-dom"
import { deleteRuleTmplGroup, getRuleTmplGroupList } from "../../../api/ruleTmpl"
import { ReactComponent as Metric } from "../assets/metric.svg"
import { ReactComponent as Log } from "../assets/log.svg"
import { ReactComponent as Trace } from "../assets/trace.svg"
import { ReactComponent as Event } from "../assets/event.svg"
import { SearchOutlined, PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons"
import {HandleShowTotal} from "../../../utils/lib";
import { TableWithPagination } from "../../../utils/TableWithPagination"

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
                        fontWeight: "500",
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
                                title="确定要删除此模版组吗?"
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
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            });

            setList(res.data.list)
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
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            })

            setList(res.data.list)
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
            icon: <Metric style={{ height: "20px", width: "20px" }} />,
        },
        {
            key: "Logs",
            label: "Logs",
            icon: <Log style={{ height: "20px", width: "20px" }} />,
        },
        {
            key: "Traces",
            label: "Traces",
            icon: <Trace style={{ height: "20px", width: "20px" }} />,
        },
        {
            key: "Events",
            label: "Events",
            icon: <Event style={{ height: "20px", width: "20px" }} />,
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
        <div style={{ display: "flex", borderRadius: "8px" }}>
            {/* Sidebar */}
            <div style={{ width: "200px" }}>
                <Menu
                    onClick={handleClick}
                    mode="vertical"
                    style={{ border: "none", width: "100%" }}
                    selectedKeys={[selectedType]}
                >
                    {menuItems.map((item) => (
                        <Menu.Item key={item.key}>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "10px",
                                    fontSize: "14px",
                                }}
                            >
                                {item.icon}
                                {item.label}
                            </div>
                        </Menu.Item>
                    ))}
                </Menu>
            </div>

            {/* Vertical divider */}
            <Divider type="vertical" style={{ height: "auto", margin: "0 16px" }} />

            {/* Main content */}
            <div style={{ flex: 1 }}>
                {/* Search bar */}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        style={{ width: 300 }}
                        prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setVisible(true)}
                        style={{
                            backgroundColor: "#000000",
                        }}
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
                    scrollY={height - 280}
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
    )
}
