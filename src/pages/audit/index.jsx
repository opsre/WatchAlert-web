import React, { useState, useEffect } from "react"
import { Table, message, Button, Drawer, Select, Input, Tag } from "antd"
import { listAuditLog, searchAuditLog } from "../../api/auditLog"
import moment from "moment"
import JsonViewer from "react-json-view"
import {FileText} from "lucide-react";
import {HandleShowTotal} from "../../utils/lib";
import {ReloadOutlined} from "@ant-design/icons";
import { TableWithPagination } from "../../utils/TableWithPagination"

export const AuditLog = () => {
    const { Search } = Input
    const [list, setList] = useState([])
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [annotations, setAnnotations] = useState("")
    const [scope, setScope] = useState("")
    const [startTimestamp, setStartTimestamp] = useState(null)
    const [endTimestamp, setEndTimestamp] = useState(null)
    // 统一分页参数为 index 和 size
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    })
    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
            width: "200px",
            render: (_, record) => (
                <span
                    role="button"
                    tabIndex={0}
                    onClick={() => showDrawer(record.body)}
                    style={{ cursor: 'pointer', color: 'rgb(22, 119, 255)', textDecoration: 'none', marginTop: '1px' }}
                    >
                        {record.id}
                </span>
            ),
        },
        {
            title: "时间",
            dataIndex: "createdAt",
            key: "createdAt",
            width: "200px",
            render: (text) => {
                const dateInMilliseconds = text * 1000
                return moment(dateInMilliseconds).format("YYYY-MM-DD HH:mm:ss")
            },
        },
        {
            title: "用户名",
            dataIndex: "username",
            key: "username",
            width: "auto",
        },
        {
            title: "来源IP",
            dataIndex: "ipAddress",
            key: "ipAddress",
            width: "200px",
        },
        {
            title: "事件名称",
            dataIndex: "auditType",
            key: "auditType",
            width: "auto",
        },
        {
            title: "操作状态",
            dataIndex: "statusCode",
            key: "statusCode",
            width: "150px",
            render: (text) => (
                <span>{text === 200 ? <Tag color="success">{text}</Tag> : <Tag color="error">{text}</Tag>}</span>
            ),
        },
    ]
    const [height, setHeight] = useState(window.innerHeight)

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        // 监听窗口的resize事件
        window.addEventListener("resize", handleResize)

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        fetchData()
    }, [startTimestamp, endTimestamp, pagination.current, pagination.pageSize])

    useEffect(() => {
        onSearch()
    }, [scope])

    // Renamed from handleList to fetchData for clarity
    // fetchData 支持传参
    const fetchData = async (page = pagination.index, size = pagination.size) => {
        try {
            const params = {
                index: page,
                size: size,
                scope: scope,
            }

            const res = await listAuditLog(params)

            // Update pagination with response data
            setPagination({
                index: res.data.index || 1, // Use response index or default to 1
                size: res.data.size || 10, // Use response size or default to 10
                total: res.data.total || 0, // Use response total or default to 0
            })

            setList(res.data.list || [])
        } catch (error) {
            message.error(typeof error === "string" ? error : "Failed to fetch audit logs")
        }
    }

    // Updated to handle Ant Design's pagination change event
    const handlePageChange = (page, pageSize) => {
        setPagination(prev => ({
            ...prev,
            index: page,
            size: pageSize,
        }));
        fetchData(page, pageSize);
    }

    const handlePageSizeChange = (current, size) => {
        setPagination(prev => ({
            ...prev,
            index: 1,
            size: size,
        }));
        fetchData(1, size);
    };

    const handleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

    const showDrawer = (record) => {
        setDrawerOpen(true)
        setAnnotations(record)
    }

    const onCloseDrawer = () => {
        setDrawerOpen(false)
    }

    let annotationsJson = ""
    if (annotations) {
        try {
            annotationsJson = JSON.parse(annotations)
        } catch (error) {
            console.error("Failed to parse JSON:", error)
            annotationsJson = annotations // Fallback to raw text if parsing fails
        }
    }

    const onSearch = async (value) => {
        try {
            const params = {
                index: pagination.current,
                size: pagination.pageSize,
                scope: scope,
                query: value,
            }

            const res = await searchAuditLog(params)

            setPagination({
                current: res.data.index || 1,
                pageSize: res.data.size || 10,
                total: res.data.total || 0,
            })

            setList(res.data.list || [])
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <div>
            <Drawer anchor="right" title="事件Body详情" onClose={onCloseDrawer} open={drawerOpen}>
                <JsonViewer src={annotationsJson} displayObjectSize={false} />
            </Drawer>
            <div style={{ display: "flex", justifyContent: "space-between", width: "50vh" }}>
                <Select
                    allowClear
                    placeholder="时间范围"
                    style={{
                        flex: 1,
                        marginRight: "10px",
                    }}
                    options={[
                        {
                            value: "1",
                            label: "近 1 天",
                        },
                        {
                            value: "3",
                            label: "近 3 天",
                        },
                        {
                            value: "5",
                            label: "近 5 天",
                        },
                        {
                            value: "9",
                            label: "近 9 天",
                        },
                        {
                            value: "15",
                            label: "近 15 天",
                        },
                        {
                            value: "20",
                            label: "近 20 天",
                        },
                        {
                            value: "30",
                            label: "近 30 天",
                        },
                    ]}
                    onChange={(record) => {
                        setScope(record)
                    }}
                />
                <Search allowClear placeholder="输入搜索关键字" style={{ width: 300 }} onSearch={onSearch} />

                <Button
                    style={{ marginLeft: '10px'}}
                    onClick={() => {
                        fetchData()
                    }}
                    icon={<ReloadOutlined />}
                >刷新</Button>
            </div>


            <TableWithPagination
                columns={columns}
                dataSource={list}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                scrollY={height - 280}
                rowKey={record => record.id}
                showTotal={HandleShowTotal}
            />
        </div>
    )
}

