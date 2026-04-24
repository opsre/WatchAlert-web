"use client"
import React, { useEffect, useState, useCallback } from "react"
import {
    Button,
    Input,
    Tag,
    message,
    Tooltip,
    Space,
    Switch,
    Radio,
    Popconfirm,
    Empty,
    Typography,
    Dropdown,
    Modal
} from "antd"
import { Link, useNavigate } from "react-router-dom"
import { useParams } from "react-router-dom"
import { RecordingRuleUpdate, RecordingRuleDelete, RecordingRuleList, RecordingRuleGroupList, RecordingRuleChangeStatus } from "../../../api/recordingRule"
import {
    DeleteOutlined,
    CopyOutlined,
    PlusOutlined,
    ReloadOutlined,
    MoreOutlined
} from "@ant-design/icons"
import { HandleApiError, HandleShowTotal } from "../../../utils/lib";
import { useAppContext } from "../../../context/RuleContext";
import { getDatasourceList} from '../../../api/datasource'
import { RuleGroupSidebar } from './sidebar';
import { Breadcrumb } from "../../../components/Breadcrumb";
import { TableWithPagination } from '../../../utils/TableWithPagination';

export const RecordingRuleIndex = () => {
    const { setCloneRecodingRule } = useAppContext()
    const navigate = useNavigate()
    const { Search } = Input
    const [list, setList] = useState([])
    const [datasourceList, setDatasourceList] = useState([])
    const { id } = useParams()
    const [selectRuleStatus, setSelectRuleStatus] = useState("all")

    const getStoredPagination = useCallback(() => {
        const stored = sessionStorage.getItem(`recordingRule_pagination_${id}`)
        if (stored) {
            try {
                return JSON.parse(stored)
            } catch (e) {
                console.error('Failed to parse stored pagination:', e)
            }
        }
        return { index: 1, size: 10, total: 0 }
    }, [id])

    const [pagination, setPagination] = useState(() => getStoredPagination())
    const [selectedRowKeys, setSelectedRowKeys] = useState([])

    const [selectedRuleGroupId, setSelectedRuleGroupId] = useState(id)
    const [ruleGroupList, setRuleGroupList] = useState([])
    const [isInitialMount, setIsInitialMount] = useState(true)

    const handleSelectChange = (selectedKeys) => {
        setSelectedRowKeys(selectedKeys)
    }
    const columns = [
        {
            title: "指标名称",
            dataIndex: "metricName",
            key: "metricName",
            width: "auto",
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Tooltip title={text} placement="topLeft">
                        <div style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px'
                        }}>
                            <Link
                                style={{
                                    color: "#1677ff",
                                    display: "flex",
                                    alignItems: "center",
                                }}
                                to={`/recordingRules/${record.ruleGroupId}/rule/${record.ruleId}/edit`}
                            >
                                {text}
                            </Link>
                        </div>
                    </Tooltip>
                </div>
            ),
        },
        {
            title: "数据源",
            dataIndex: "datasourceId",
            key: "datasourceId",
            width: "auto",
            render: (text, record) => (
                <span>
                    {getDatasourceNamesByIds([record.datasourceId])
                        .split(", ")
                        ?.map((name, index) => (
                            <Tag color="processing" key={index}>
                                {name}
                            </Tag>
                        ))}
                </span>
            ),
        },
        {
            title: "更新时间",
            dataIndex: "updateAt",
            key: "updateAt",
            width: "150px",
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
            title: "操作人",
            dataIndex: "updateBy",
            key: "updateBy",
            width: "auto",
            render: (text) => {
                return <Tag style={{
                    borderRadius: "12px",
                    padding: "0 10px",
                    fontSize: "12px",
                    fontWeight: "500",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                }}>
                    {text || "未知用户"}
                </Tag>
            },
        },
        {
            title: "状态",
            dataIndex: "enabled",
            key: "enabled",
            width: "80px",
            render: (enabled, record) => {
                const handleStatusChange = async (checked) => {
                    try {
                        const params = {
                            tenantId: record.tenantId,
                            ruleId: record.ruleId,
                            enabled: checked,
                        }
                        await RecordingRuleChangeStatus(params)
                        message.success(`「${record.metricName}」状态已更新为: ${checked ? "启用" : "禁用"}`);
                        handleList(id, pagination.index, pagination.size)
                    } catch (error) {
                        HandleApiError(error)
                    }
                };
                return (
                    <Switch
                        checked={enabled}
                        onChange={handleStatusChange}
                        checkedChildren="启用"
                        unCheckedChildren="禁用"
                        loading={false}
                    />
                );
            },
        },
        {
            title: "操作",
            dataIndex: "operation",
            fixed: "right",
            width: 60,
            render: (_, record) => {
                const items = [
                    {
                        key: 'clone',
                        icon: <CopyOutlined />,
                        label: '克隆',
                        onClick: () => handleClone(record)
                    },
                    {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: '删除',
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: "确定要删除此规则吗?",
                                content: `规则名称: ${record.ruleName}`,
                                okText: "确定",
                                cancelText: "取消",
                                okType: 'danger',
                                onOk: () => handleDelete(record.ruleGroupId, record.ruleId)
                            })
                        }
                    }
                ];

                return (
                    <Dropdown
                        menu={{ items }}
                        trigger={['click']}
                        placement="bottomRight"
                    >
                        <Button
                            type="text"
                            icon={<MoreOutlined />}
                            style={{ color: "#666" }}
                        />
                    </Dropdown>
                );
            },
        },
    ]
    const savePaginationToStorage = useCallback((newPagination) => {
        sessionStorage.setItem(`recordingRule_pagination_${id}`, JSON.stringify(newPagination))
    }, [id])

    const updatePagination = useCallback((newPagination) => {
        setPagination(newPagination)
        savePaginationToStorage(newPagination)
    }, [savePaginationToStorage])

    const handleList = useCallback(async (ruleGroupId, index, size) => {
        try {
            const params = {
                index: index || 1,
                size: size || 10,
                status: selectRuleStatus,
                ruleGroupId: ruleGroupId,
            }
            const res = await RecordingRuleList(params)
            const newPagination = {
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            }
            updatePagination(newPagination)
            setList(res?.data?.list)
            setSelectedRowKeys([])
        } catch (error) {
            console.error(error)
        }
    }, [selectRuleStatus, updatePagination])

    useEffect(() => {
        const initializeData = async () => {
            await handleListDatasource()
            const groups = await handleListRuleGroup()
            if (groups.length > 0) {
                const firstGroupId = groups[0].id
                navigate(`/recordingRules/${firstGroupId}/list`)
                setSelectedRuleGroupId(firstGroupId)
                handleList(firstGroupId, pagination.index, pagination.size)
            }
            setIsInitialMount(false)
        }
        if (isInitialMount) {
            initializeData()
        }
    }, [isInitialMount])

    const onSearch = useCallback(async (value) => {
        try {
            const params = {
                index: pagination.index || 1,
                size: pagination.size || 10,
                ruleGroupId: id,
                status: selectRuleStatus,
                query: value,
            }
            const res = await RecordingRuleList(params)
            const newPagination = {
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            }
            updatePagination(newPagination)
            setList(res?.data?.list)
            setSelectedRowKeys([])
        } catch (error) {
            console.error(error)
        }
    }, [pagination.index, pagination.size, id, selectRuleStatus, updatePagination])

    useEffect(() => {
        setSelectedRuleGroupId(id)
        const storedPagination = getStoredPagination()
        updatePagination(storedPagination)
        handleList(id, storedPagination.index, storedPagination.size)
    }, [id, getStoredPagination, updatePagination, handleList])

    useEffect(() => {
        if (!isInitialMount.current) {
            onSearch()
        }
    }, [selectRuleStatus])

    const handleListDatasource = async () => {
        try {
            const res = await getDatasourceList()
            setDatasourceList(res?.data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleListRuleGroup = async () => {
        try {
            const params = { index: 1, size: 1000 }
            const res = await RecordingRuleGroupList(params)
            const list = res?.data?.list || []
            setRuleGroupList(list)
            return list
        } catch (error) {
            console.error('Failed to fetch rule group list:', error)
            return []
        }
    }

    const handleRuleGroupChangeFromSidebar = useCallback(async (newGroupList) => {
        const list = newGroupList || []
        setRuleGroupList(list)
        // If we were in empty state and now have rule groups, select the first one
        if ((ruleGroupList?.length || 0) === 0 && list.length > 0) {
            const firstGroupId = list[0].id
            setSelectedRuleGroupId(firstGroupId)
            handleList(firstGroupId, 1, pagination.size)
        }
    }, [ruleGroupList, handleList, pagination.size])

    const handleRuleGroupChange = (groupId) => {
        setSelectedRuleGroupId(groupId)
        const newPagination = { ...pagination, index: 1 }
        updatePagination(newPagination)
        handleList(groupId, 1, pagination.size)
        navigate(`/recordingRules/${groupId}/list`)
    }

    const getDatasourceNamesByIds = (datasourceIdList) => {
        if (!Array.isArray(datasourceIdList)) return "Unknown"
        const matchedNames = datasourceIdList.map((id) => {
            const datasource = datasourceList.find((ds) => ds.id === id)
            return datasource ? datasource.name : "Unknown"
        })
        return matchedNames.join(", ") || "Unknown"
    }

    const changeStatus = async ({ target: { value } }) => {
        const newPagination = { ...pagination, index: 1, size: pagination.size }
        updatePagination(newPagination)
        setSelectRuleStatus(value)
    }

    const handleClone = (record) => {
        const cloneData = {
            ...record,
            metricName: `${record.metricName} - Copy`,
            ruleId: "",
        }
        setCloneRecodingRule(cloneData)
        navigate(`/recordingRules/${id}/create?clone=true`)
    }

    const handleDelete = async (ruleGroupId, ruleId) => {
        try {
            await RecordingRuleDelete({ ruleId, ruleGroupId })
        } catch (error) {
            HandleApiError(error)
            return
        }
        handleList(id, pagination.index, pagination.size)
    }

    const { Text } = Typography

    const renderEmptyState = () => (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            padding: '40px',
            marginTop: '-50px'
        }}>
            <Empty 
                description={null}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <Text style={{ fontSize: '14px', color: 'rgb(156, 163, 175)' }}>
                    无可用规则组，请先创建规则组
                </Text>
                <Button size='small' icon={<ReloadOutlined />} onClick={() => handleListRuleGroup()}/>
            </div>
        </div>
    )

    const renderContent = () => {
        if (!ruleGroupList || ruleGroupList.length === 0) {
            return renderEmptyState()
        }
        return (
            <>
                <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "20px",
                    alignItems: "center"
                }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Radio.Group
                            options={[
                                { label: "全部", value: "all" },
                                { label: "开启", value: "enabled" },
                                { label: "禁用", value: "disabled" },
                            ]}
                            defaultValue={selectRuleStatus}
                            onChange={changeStatus}
                            optionType="button"
                        />
                        <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                        {selectedRowKeys.length > 0 && (
                            <div style={{ color: '#1677ff', fontSize: '14px' }}>
                                已选择 {selectedRowKeys.length} 项
                            </div>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Link to={`/recordingRules/${id}/create`}>
                            <Button
                                type="primary"
                                size="default"
                                style={{ backgroundColor: "#000000" }}
                                icon={<PlusOutlined />}
                            >
                                创建
                            </Button>
                        </Link>
                    </div>
                </div>

                <TableWithPagination
                    columns={columns}
                    dataSource={list}
                    pagination={pagination}
                    onPageChange={(page, pageSize) => {
                        const newPagination = { ...pagination, index: page, size: pageSize }
                        updatePagination(newPagination)
                        handleList(id, page, pageSize)
                    }}
                    onPageSizeChange={(current, pageSize) => {
                        const newPagination = { ...pagination, index: current, size: pageSize }
                        updatePagination(newPagination)
                        handleList(id, current, pageSize)
                    }}
                    scrollY={'calc(100vh - 270px)'}
                    rowKey="ruleId"
                    showTotal={HandleShowTotal}
                    selectedRowKeys={selectedRowKeys}
                    onSelectChange={handleSelectChange}
                    selectAll={true}
                />
            </>
        )
    }

    return (
        <>
            <Breadcrumb items={['告警管理', '记录规则']} />
            <div style={{ display: 'flex', height: '100%' }}>
                <div style={{ width: '180px', flexShrink: 0 }}>
                    <RuleGroupSidebar
                        selectedRuleGroupId={String(selectedRuleGroupId)}
                        onRuleGroupChange={handleRuleGroupChange}
                        onRuleGroupChangeFromParent={handleRuleGroupChangeFromSidebar}
                    />
                </div>
                
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', marginLeft: '20px' }}>
                    <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}>
                        {renderContent()}
                    </div>
                </div>
            </div>
        </>
    )
}