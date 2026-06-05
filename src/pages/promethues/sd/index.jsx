import React, { useEffect, useState, useCallback } from "react"
import {
    Button,
    Input,
    Tag,
    message,
    Tooltip,
    Space,
    Popconfirm,
    Popover,
    Empty,
    Typography,
    Dropdown,
    Modal,
    Segmented,
    Drawer,
} from "antd"
import { useParams, useNavigate } from "react-router-dom"
import {
    PrometheusTargetList,
    PrometheusTargetDelete,
    PrometheusTargetGroupList,
} from "../../../api/prometheus"
import {
    DeleteOutlined,
    PlusOutlined,
    ReloadOutlined,
    MoreOutlined,
    EditOutlined,
    HistoryOutlined,
    GlobalOutlined,
    FolderOutlined,
    QuestionCircleOutlined,
    CopyOutlined,
} from "@ant-design/icons"
import { HandleApiError, HandleShowTotal } from "../../../utils/lib"
import { ServiceGroupSidebar } from "./sidebar"
import { ServiceCreateModal } from "./createService"
import { VersionHistoryModal } from "./versionHistory"
import { Breadcrumb } from "../../../components/Breadcrumb"
import { TableWithPagination } from "../../../utils/TableWithPagination"

export const PrometheusServiceDiscovery = () => {
    const navigate = useNavigate()
    const { id } = useParams()
    const { Search } = Input
    const { Text } = Typography

    const [list, setList] = useState([])
    const [groupList, setGroupList] = useState([])
    const [selectedGroupId, setSelectedGroupId] = useState(id || null)
    const [isInitialMount, setIsInitialMount] = useState(true)

    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    const [historyTargetId, setHistoryTargetId] = useState(null)
    const [selectedRow, setSelectedRow] = useState(null)

    const [pagination, setPagination] = useState({ index: 1, size: 10, total: 0 })
    const [searchMode, setSearchMode] = useState('local')
    const [searchKeyword, setSearchKeyword] = useState('')
    const [helpVisible, setHelpVisible] = useState(false)

    const handleList = useCallback(async (groupId, index, size, query) => {
        if (searchMode === 'local' && !groupId) {
            setList([])
            return
        }
        try {
            const params = {
                index: index || 1,
                size: size || 10,
            }
            if (searchMode === 'global') {
                params.groupId = 0
            } else {
                params.groupId = groupId
            }
            if (query) {
                params.query = query
            }
            const res = await PrometheusTargetList(params)
            const newPagination = {
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            }
            setPagination(newPagination)
            setList(res?.data?.list || [])
        } catch (error) {
            console.error(error)
        }
    }, [searchMode])

    const handleListGroup = async () => {
        try {
            const res = await PrometheusTargetGroupList({ index: 1, size: 1000 })
            const list = res?.data?.list || []
            setGroupList(list)
            return list
        } catch (error) {
            console.error(error)
            return []
        }
    }

    useEffect(() => {
        const initializeData = async () => {
            const groups = await handleListGroup()
            if (groups.length > 0 && !selectedGroupId) {
                const firstGroupId = groups[0].id
                navigate(`/prometheusTargets/${firstGroupId}/list`)
                setSelectedGroupId(firstGroupId)
                handleList(firstGroupId, 1, pagination.size)
            }
            setIsInitialMount(false)
        }
        if (isInitialMount) {
            initializeData()
        }
    }, [isInitialMount])

    useEffect(() => {
        if (id) {
            setSelectedGroupId(Number(id))
            handleList(Number(id), 1, pagination.size)
        }
    }, [id])

    const handleGroupChange = (groupId) => {
        setSelectedGroupId(groupId)
        setSearchKeyword('')
        setPagination({ index: 1, size: 10, total: 0 })
        if (groupId) {
            navigate(`/prometheusTargets/${groupId}/list`)
            handleList(groupId, 1, pagination.size)
        }
    }

    const onSearch = useCallback(async (value) => {
        setSearchKeyword(value || '')
        const groupId = searchMode === 'global' ? 0 : selectedGroupId
        if (searchMode === 'local' && !selectedGroupId) return
        try {
            const params = {
                index: 1,
                size: pagination.size,
                groupId: groupId,
                query: value || '',
            }
            const res = await PrometheusTargetList(params)
            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            })
            setList(res?.data?.list || [])
        } catch (error) {
            console.error(error)
        }
    }, [selectedGroupId, pagination.size, searchMode])

    const handleSearchModeChange = (mode) => {
        setSearchMode(mode)
        setSearchKeyword('')
        setPagination({ index: 1, size: 10, total: 0 })
        // 切换模式后重新拉取数据
        if (mode === 'global') {
            // 全局搜索，groupId=0
            ;(async () => {
                try {
                    const res = await PrometheusTargetList({ index: 1, size: pagination.size, groupId: 0 })
                    setPagination({ index: res?.data?.index, size: res?.data?.size, total: res?.data?.total })
                    setList(res?.data?.list || [])
                } catch (e) { console.error(e) }
            })()
        } else if (selectedGroupId) {
            handleList(selectedGroupId, 1, pagination.size)
        }
    }

    // 全局搜索结果点击某行，跳转到该组
    const handleRowClick = (record) => {
        if (searchMode === 'global' && record.groupId) {
            setSearchMode('local')
            setSearchKeyword('')
            handleGroupChange(record.groupId)
        }
    }

    const handleDelete = async (record) => {
        try {
            await PrometheusTargetDelete({
                id: record.id,
                groupId: record.groupId,
            })
            handleList(selectedGroupId, pagination.index, pagination.size)
        } catch (error) {
            HandleApiError(error)
        }
    }

    const handleUpdate = (record) => {
        setSelectedRow(record)
        setUpdateModalVisible(true)
    }

    const groupMap = React.useMemo(() => {
        const map = {}
        groupList.forEach(g => { map[g.id] = g.name })
        return map
    }, [groupList])

    const columns = [
        ...(searchMode === 'global' ? [{
            title: '服务组',
            dataIndex: 'groupId',
            key: 'groupId',
            width: 120,
            render: (groupId) => (
                <Tag color="geekblue" style={{ borderRadius: '4px' }}>
                    {groupMap[groupId] || `组 ${groupId}`}
                </Tag>
            ),
        }] : []),
        {
            title: "Targets",
            dataIndex: "targets",
            key: "targets",
            width: 320,
            render: (targets) => (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {targets?.map((t, index) => (
                        <Tag color="processing" key={index} style={{ borderRadius: '4px' }}>
                            {t}
                        </Tag>
                    ))}
                </div>
            ),
        },
        {
            title: "Labels",
            dataIndex: "labels",
            key: "labels",
            width: 360,
            render: (labels) => <LabelsCell labels={labels} />,
        },
        {
            title: "操作",
            dataIndex: "operation",
            fixed: "right",
            width: 10,
            render: (_, record) => {
                const items = [
                    {
                        key: 'edit',
                        icon: <EditOutlined />,
                        label: '编辑',
                        onClick: () => handleUpdate(record)
                    },
                    {
                        key: 'delete',
                        icon: <DeleteOutlined />,
                        label: '删除',
                        danger: true,
                        onClick: () => {
                            Modal.confirm({
                                title: "确定要删除此服务吗?",
                                content: `ID: ${record.id}`,
                                okText: "确定",
                                cancelText: "取消",
                                okType: 'danger',
                                onOk: () => handleDelete(record)
                            })
                        }
                    },
                    {
                        key: 'history',
                        icon: <HistoryOutlined />,
                        label: '历史版本',
                        onClick: () => setHistoryTargetId(record.id)
                    }
                ]
                return (
                    <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                        <Button type="text" icon={<MoreOutlined />} style={{ color: "#666" }} />
                    </Dropdown>
                )
            },
        },
    ]

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
            <Empty description={null} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
                <Text style={{ fontSize: '14px', color: 'rgb(156, 163, 175)' }}>
                    无可用服务组，请先创建服务组
                </Text>
                <Button size='small' icon={<ReloadOutlined />} onClick={() => handleListGroup()} />
            </div>
        </div>
    )

    const renderContent = () => {
        if (!groupList || groupList.length === 0) {
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
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <Segmented
                            value={searchMode}
                            onChange={handleSearchModeChange}
                            options={[
                                { label: <span><FolderOutlined /> 组内搜</span>, value: 'local' },
                                { label: <span><GlobalOutlined /> 全局搜</span>, value: 'global' },
                            ]}
                            size="middle"
                        />
                        <Search
                            allowClear
                            placeholder={searchMode === 'global' ? '全局搜索 Target...' : '搜索当前组 Target...'}
                            onSearch={onSearch}
                            style={{ width: 280 }}
                        />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                        <Tooltip title="接口使用指南">
                            <Button
                                icon={<QuestionCircleOutlined />}
                                onClick={() => setHelpVisible(true)}
                            />
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            disabled={!selectedGroupId}
                            style={{ backgroundColor: selectedGroupId ? '#000000' : undefined }}
                            onClick={() => setCreateModalVisible(true)}
                        >
                            创建
                        </Button>
                    </div>
                </div>

                <TableWithPagination
                    columns={columns}
                    dataSource={list}
                    pagination={pagination}
                    onPageChange={(page, pageSize) => {
                        setPagination({ ...pagination, index: page, size: pageSize })
                        handleList(selectedGroupId, page, pageSize, searchKeyword)
                    }}
                    onPageSizeChange={(current, pageSize) => {
                        setPagination({ ...pagination, index: current, size: pageSize })
                        handleList(selectedGroupId, current, pageSize, searchKeyword)
                    }}
                    onRow={(record) => ({
                        onClick: () => handleRowClick(record),
                        style: searchMode === 'global' ? { cursor: 'pointer' } : {},
                    })}
                    scrollY={'calc(100vh - 270px)'}
                    rowKey="id"
                    showTotal={HandleShowTotal}
                />
            </>
        )
    }

    return (
        <>
            <Breadcrumb items={['数据管理', '服务发现']} />
            <div style={{ display: 'flex', height: '100%' }}>
                <div style={{ width: '210px', flexShrink: 0, paddingRight: '12px' }}>
                    <ServiceGroupSidebar
                        selectedGroupId={selectedGroupId}
                        onGroupChange={handleGroupChange}
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

            <ServiceCreateModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                type="create"
                groupId={selectedGroupId}
                handleList={() => handleList(selectedGroupId, pagination.index, pagination.size)}
            />
            <ServiceCreateModal
                visible={updateModalVisible}
                onClose={() => setUpdateModalVisible(false)}
                type="update"
                selectedRow={selectedRow}
                groupId={selectedGroupId}
                handleList={() => handleList(selectedGroupId, pagination.index, pagination.size)}
            />

            <VersionHistoryModal
                visible={historyTargetId !== null}
                onClose={() => setHistoryTargetId(null)}
                targetId={historyTargetId}
                groupId={selectedGroupId}
                onRollback={() => handleList(selectedGroupId, 1, pagination.size)}
            />

            <Drawer
                title="Prometheus HTTP SD 接口指南"
                placement="right"
                width={620}
                open={helpVisible}
                onClose={() => setHelpVisible(false)}
            >
                <HelpContent />
            </Drawer>
        </>
    )
}

// Labels 单元格（默认展示 3 个，超出则点击按钮弹出全部）
const LabelsCell = ({ labels }) => {
    if (!labels || Object.keys(labels).length === 0) {
        return <span style={{ color: '#bfbfbf' }}>-</span>
    }
    const entries = Object.entries(labels)
    const showMore = entries.length > 3
    const preview = entries.slice(0, 3)

    const allLabelsContent = (
        <div style={{ maxWidth: '280px', display: 'flex', flexWrap: 'wrap', gap: '4px', maxHeight: '240px', overflow: 'auto' }}>
            {entries.map(([key, value]) => (
                <Tooltip key={key} title={`${key}: ${value}`}>
                    <Tag style={{
                        borderRadius: '4px',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0,
                    }}>
                        {key}: {value}
                    </Tag>
                </Tooltip>
            ))}
        </div>
    )

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: 360, alignItems: 'center' }}>
            {preview.map(([key, value]) => (
                <Tooltip key={key} title={`${key}: ${value}`}>
                    <Tag style={{
                        borderRadius: '4px',
                        maxWidth: '140px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        margin: 0,
                    }}>
                        {key}: {value}
                    </Tag>
                </Tooltip>
            ))}
            {showMore && (
                <Popover
                    title={`全部 Labels（${entries.length}）`}
                    content={allLabelsContent}
                    trigger="click"
                    placement="bottomRight"
                    overlayStyle={{ maxWidth: '320px' }}
                >
                    <Button
                        type="link"
                        size="small"
                        style={{ fontSize: '12px', padding: '0 4px', height: '22px' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        +{entries.length - 3}
                    </Button>
                </Popover>
            )}
        </div>
    )
}

// 接口示例代码块（带复制按钮）
const CodeBlock = ({ code, title }) => (
    <div style={{ marginBottom: '16px' }}>
        {title && <div style={{ fontSize: '12px', color: '#595959', marginBottom: '6px', fontWeight: 500 }}>{title}</div>}
        <div style={{ position: 'relative' }}>
            <pre style={{
                background: '#f5f5f5',
                border: '1px solid #e8e8e8',
                borderRadius: '6px',
                padding: '12px 40px 12px 12px',
                fontSize: '12px',
                lineHeight: '1.6',
                overflow: 'auto',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
            }}>{code}</pre>
            <Tooltip title="复制">
                <Button
                    type="text"
                    size="small"
                    icon={<CopyOutlined />}
                    style={{ position: 'absolute', top: '6px', right: '6px', color: '#8c8c8c' }}
                    onClick={() => {
                        navigator.clipboard.writeText(code).then(
                            () => message.success('已复制'),
                            () => message.error('复制失败')
                        )
                    }}
                />
            </Tooltip>
        </div>
    </div>
)

const HelpContent = () => {
    const BASE = '/api/w8t/prometheus/targets'

    return (
        <div style={{ fontSize: '13px', color: '#262626' }}>
            <Typography.Title level={5} style={{ marginTop: 0 }}>接口地址</Typography.Title>
            <CodeBlock code={`GET ${BASE}`} />
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                此接口无需登录鉴权，供 Prometheus HTTP SD 直接轮询使用。
            </Typography.Text>

            <Typography.Title level={5}>Query 参数</Typography.Title>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', marginBottom: '16px' }}>
                <thead>
                    <tr style={{ background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>参数</th>
                        <th style={{ padding: '8px 12px', textAlign: 'left' }}>说明</th>
                    </tr>
                </thead>
                <tbody>
                    {[
                        ['tenantId', '必填，租户 ID'],
                        ['includeGroup', '正向检索：组名（逗号分隔，子串匹配）'],
                        ['includeTarget', '正向检索：target 地址（子串匹配）'],
                        ['includeLabel', '正向检索：label，格式 key:value 或 key'],
                        ['excludeGroup', '反向过滤：组名'],
                        ['excludeTarget', '反向过滤：target 地址'],
                        ['excludeLabel', '反向过滤：label'],
                    ].map(([param, desc]) => (
                        <tr key={param} style={{ borderBottom: '1px solid #f5f5f5' }}>
                            <td style={{ padding: '6px 12px' }}><code>{param}</code></td>
                            <td style={{ padding: '6px 12px', color: '#595959' }}>{desc}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Typography.Title level={5}>请求示例</Typography.Title>

            <CodeBlock
                title="获取某租户下全部 targets"
                code={`${BASE}?tenantId=tenant-abc`}
            />

            <CodeBlock
                title="按组名正向检索（匹配组名包含 web 或 api）"
                code={`${BASE}?tenantId=tenant-abc&includeGroup=web,api`}
            />

            <CodeBlock
                title="按 target 地址检索（匹配含 192.168 的记录）"
                code={`${BASE}?tenantId=tenant-abc&includeTarget=192.168`}
            />

            <CodeBlock
                title="按 label 检索（有 env:prod 标签的记录）"
                code={`${BASE}?tenantId=tenant-abc&includeLabel=env:prod`}
            />

            <CodeBlock
                title="只检查 key 是否存在（有 team 标签，值不限）"
                code={`${BASE}?tenantId=tenant-abc&includeLabel=team`}
            />

            <CodeBlock
                title="多条件组合（组名含 web 且有 env:prod 标签）"
                code={`${BASE}?tenantId=tenant-abc&includeGroup=web&includeLabel=env:prod`}
            />

            <CodeBlock
                title="反向过滤（排除 deprecated 组）"
                code={`${BASE}?tenantId=tenant-abc&excludeGroup=deprecated`}
            />

            <CodeBlock
                title="正向 + 反向组合（web 组，排除 env:staging）"
                code={`${BASE}?tenantId=tenant-abc&includeGroup=web&excludeLabel=env:staging`}
            />

            <Typography.Title level={5}>过滤规则</Typography.Title>
            <ul style={{ paddingLeft: '20px', fontSize: '12px', color: '#595959', lineHeight: '2' }}>
                <li><strong>正向检索</strong>：同类别内 <strong>OR</strong>（任意一项匹配即可），跨类别 <strong>AND</strong>（所有已指定类别都必须通过）</li>
                <li><strong>反向过滤</strong>：任意条件命中即排除</li>
            </ul>

            <Typography.Title level={5}>响应格式</Typography.Title>
            <CodeBlock
                title="符合 Prometheus HTTP SD 规范"
                code={`[
  {
    "targets": ["192.168.1.1:9090"],
    "labels": {
      "env": "prod",
      "team": "sre",
      "instance": "web1",
      "__meta_group": "web-servers"
    }
  }
]`}
            />
            <Typography.Text type="secondary" style={{ fontSize: '12px' }}>
                每个 target 地址展开为独立条目；<code>labels</code> 已合并全局标签与 target 级标签（冲突时 target 级优先）；<code>__meta_group</code> 自动注入所属服务组名。
            </Typography.Text>

            <Typography.Title level={5} style={{ marginTop: '24px' }}>Prometheus 配置示例</Typography.Title>
            <CodeBlock
                title="添加到 prometheus.yml"
                code={`scrape_configs:
  - job_name: 'w8t-sd'
    http_sd_configs:
      - url: 'http://<watch-alert-host>:<port>${BASE}?tenantId=tenant-abc'
        refresh_interval: 30s`}
            />
        </div>
    )
}
