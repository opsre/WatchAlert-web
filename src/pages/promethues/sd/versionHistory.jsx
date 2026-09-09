import React, { useEffect, useState, useCallback } from 'react'
import { Modal, Button, Tag, message, Tooltip, Spin, Empty, Alert } from 'antd'
import { RollbackOutlined } from '@ant-design/icons'
import SafeDiffEditor from '../../../utils/SafeDiffEditor'
import {
    PrometheusTargetVersionList,
    PrometheusTargetVersionGet,
    PrometheusTargetVersionRollback,
    PrometheusTargetGet,
} from '../../../api/prometheus'

// 将 target 数据序列化为格式化 JSON
const toJson = (data) => {
    if (!data) return ''
    const obj = {
        targets: data.targets || [],
        labels: data.labels || {},
    }
    if (data.targetLabels && Object.keys(data.targetLabels).length > 0) {
        obj.targetLabels = data.targetLabels
    }
    return JSON.stringify(obj, null, 2)
}

export const VersionHistoryModal = ({ visible, onClose, targetId, groupId, onRollback }) => {
    const [versionList, setVersionList] = useState([])
    const [loading, setLoading] = useState(false)
    const [diffLoading, setDiffLoading] = useState(false)
    const [total, setTotal] = useState(0)
    const [pagination, setPagination] = useState({ index: 1, size: 20 })
    const [selectedId, setSelectedId] = useState(null)
    const [currentTarget, setCurrentTarget] = useState(null)
    const [oldJson, setOldJson] = useState('')
    const [newJson, setNewJson] = useState('')

    const [diffEditorError, setDiffEditorError] = useState(false)

    const handleList = useCallback(async (index, size) => {
        if (!targetId) return
        setLoading(true)
        try {
            const res = await PrometheusTargetVersionList({ targetId, index, size })
            setVersionList(res?.data?.list || [])
            setTotal(res?.data?.total || 0)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }, [targetId])

    const fetchCurrentTarget = useCallback(async () => {
        if (!targetId || !groupId) return
        try {
            const res = await PrometheusTargetGet({ groupId, id: targetId })
            const data = res?.data || null
            setCurrentTarget(data)
            setNewJson(toJson(data))
        } catch (e) {
            console.error(e)
        }
    }, [targetId, groupId])

    useEffect(() => {
        if (visible && targetId) {
            handleList(1, pagination.size)
            fetchCurrentTarget()
            setSelectedId(null)
            setOldJson('')
            setNewJson('')
            setDiffEditorError(false)
        }
    }, [visible, targetId])

    // 列表加载完后默认选中第二个（最新前一个）
    useEffect(() => {
        if (versionList.length >= 2 && !selectedId) {
            setSelectedId(versionList[1].id)
        } else if (versionList.length === 1 && !selectedId) {
            setSelectedId(versionList[0].id)
        }
    }, [versionList])

    // 选中版本后拉取该版本 JSON
    useEffect(() => {
        if (!selectedId) return
        const fetchVersion = async () => {
            setDiffLoading(true)
            try {
                const res = await PrometheusTargetVersionGet({ id: selectedId })
                setOldJson(toJson(res?.data || {}))
            } catch (e) {
                console.error(e)
            } finally {
                setDiffLoading(false)
            }
        }
        fetchVersion()
    }, [selectedId])

    const handleRollback = (record) => {
        Modal.confirm({
            title: '确认回滚',
            content: `确定要回滚到 v${record.version} 吗？回滚前当前状态也会保存为新版本。`,
            okText: '确定回滚',
            cancelText: '取消',
            okType: 'danger',
            onOk: async () => {
                try {
                    await PrometheusTargetVersionRollback({ id: record.id })
                    handleList(1, pagination.size)
                    setPagination(p => ({ ...p, index: 1 }))
                    setSelectedId(null)
                    setOldJson('')
                    fetchCurrentTarget()
                    onRollback && onRollback()
                } catch (error) {
                    message.error('回滚失败')
                }
            }
        })
    }

    const selectedVersion = versionList.find(v => v.id === selectedId)

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            title="版本历史"
            width={900}
        >
            <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
                {/* 左侧：版本列表 */}
                <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', maxHeight: '520px' }}>
                    <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '8px' }}>点击版本查看 Diff</div>
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        {loading && <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="small" /></div>}
                        {!loading && versionList.length === 0 && (
                            <Empty description="暂无版本记录" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
                        )}
                        {!loading && versionList.map((v, i) => {
                            const isSelected = v.id === selectedId
                            const isLatest = i === 0
                            return (
                                <div
                                    key={v.id}
                                    onClick={() => setSelectedId(v.id)}
                                    style={{
                                        padding: '10px 12px',
                                        marginBottom: '4px',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        border: isSelected ? '1px solid #000' : '1px solid #f0f0f0',
                                        background: isSelected ? '#fafafa' : '#fff',
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Tag color={isLatest ? 'gold' : 'blue'} style={{ margin: 0, fontSize: '11px' }}>
                                                v{v.version}
                                            </Tag>
                                            {isLatest && <span style={{ fontSize: '11px', color: '#8c8c8c' }}>最新</span>}
                                        </div>
                                        {!isLatest && (
                                            <Tooltip title="回滚到此版本">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<RollbackOutlined style={{ fontSize: '12px' }} />}
                                                    onClick={(e) => { e.stopPropagation(); handleRollback(v) }}
                                                    style={{ padding: '2px', color: '#8c8c8c' }}
                                                />
                                            </Tooltip>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
                                        {v.createdAt ? new Date(v.createdAt).toLocaleString('zh-CN') : '-'}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    {total > pagination.size && (
                        <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                            <Button
                                size="small"
                                type="link"
                                onClick={() => {
                                    const next = { ...pagination, index: pagination.index + 1 }
                                    setPagination(next)
                                    handleList(next.index, next.size)
                                }}
                                disabled={pagination.index * pagination.size >= total}
                            >
                                加载更多
                            </Button>
                        </div>
                    )}
                </div>

                {/* 右侧：Monaco DiffEditor */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxHeight: '520px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
                        {selectedVersion ? (
                            <>
                                <Tag color="blue" style={{ margin: 0 }}>v{selectedVersion.version}（历史版本）</Tag>
                                <span style={{ color: '#8c8c8c', fontSize: '12px' }}>→</span>
                                <Tag color="default" style={{ margin: 0 }}>当前状态</Tag>
                            </>
                        ) : (
                            <span style={{ color: '#8c8c8c', fontSize: '12px' }}>选择左侧版本查看 Diff</span>
                        )}
                    </div>
                    <div style={{
                        flex: 1,
                        height: '400px',
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        position: 'relative',
                    }}>
                        {!selectedVersion && (
                            <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c' }}>
                                选择左侧版本查看 Diff
                            </div>
                        )}
                        {selectedVersion && diffLoading && (
                            <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Spin tip="加载中..." />
                            </div>
                        )}
                        {diffEditorError ? (
                            <div style={{ padding: '40px', textAlign: 'center' }}>
                                <Alert message="Diff 编辑器加载失败" type="error" showIcon />
                            </div>
                        ) : (
                            <SafeDiffEditor
                                height="400px"
                                language="json"
                                original={oldJson}
                                modified={newJson}
                                options={{
                                    readOnly: true,
                                    renderSideBySide: true,
                                    minimap: { enabled: false },
                                    fontSize: 12,
                                    scrollBeyondLastLine: false,
                                    originalEditable: false,
                                    renderIndicators: false,
                                }}
                                onError={() => setDiffEditorError(true)}
                            />
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    )
}
