import { PrometheusTargetCreate, PrometheusTargetUpdate } from '../../../api/prometheus'
import { Modal, Button, message, Alert } from 'antd'
import { ThunderboltOutlined, CopyOutlined } from '@ant-design/icons'
import React, { useEffect, useState } from 'react'
import VSCodeEditor from '../../../utils/VSCodeEditor'

const EXAMPLE_JSON = JSON.stringify({
    targets: ['192.168.1.1:9090', '192.168.1.2:9090'],
    labels: { env: 'prod', team: 'sre' },
    targetLabels: {
        '192.168.1.1:9090': { instance: 'web1' },
        '192.168.1.2:9090': { instance: 'web2', env: 'staging' },
    },
}, null, 2)

// 将已有数据序列化为 JSON 文本
const toJsonText = (row) => {
    if (!row) return ''
    const obj = {
        targets: row.targets || [],
        labels: row.labels || {},
    }
    if (row.targetLabels && Object.keys(row.targetLabels).length > 0) {
        obj.targetLabels = row.targetLabels
    }
    return JSON.stringify(obj, null, 2)
}

export const ServiceCreateModal = ({ visible, onClose, selectedRow, type, groupId, handleList }) => {
    const [jsonText, setJsonText] = useState('')
    const [jsonError, setJsonError] = useState(null)

    useEffect(() => {
        if (visible) {
            if (selectedRow && type === 'update') {
                setJsonText(toJsonText(selectedRow))
            } else {
                setJsonText('')
            }
            setJsonError(null)
        }
    }, [visible, selectedRow, type])

    const handleSubmit = async () => {
        let parsed
        try {
            parsed = JSON.parse(jsonText)
        } catch (e) {
            setJsonError('JSON 格式错误：' + e.message)
            return
        }

        const payload = {
            targets: parsed.targets || [],
            labels: parsed.labels || {},
            targetLabels: parsed.targetLabels,
        }

        if (!payload.targets || payload.targets.length === 0) {
            message.warning('请至少填写一个 Target 地址')
            return
        }

        try {
            if (type === 'create') {
                await PrometheusTargetCreate({ ...payload, groupId })
            } else {
                await PrometheusTargetUpdate({ ...payload, groupId, id: selectedRow.id })
            }
            handleList()
            onClose()
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <Modal
            open={visible}
            onCancel={onClose}
            footer={null}
            title={type === 'create' ? '创建服务' : '编辑服务'}
            width={640}
        >
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <Button
                    size="small"
                    icon={<ThunderboltOutlined />}
                    onClick={() => { setJsonText(EXAMPLE_JSON); setJsonError(null) }}
                >
                    填充示例
                </Button>
                <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                        if (!jsonText) { message.warning('暂无内容可复制'); return }
                        navigator.clipboard.writeText(jsonText).then(
                            () => message.success('已复制到剪贴板'),
                            () => message.error('复制失败')
                        )
                    }}
                >
                    一键复制
                </Button>
            </div>
            <div style={{ marginBottom: '12px', border: jsonError ? '1px solid #ff4d4f' : undefined, borderRadius: '6px' }}>
                <VSCodeEditor
                    value={jsonText}
                    onChange={v => { setJsonText(v ?? ''); setJsonError(null) }}
                    language="json"
                    height="400px"
                    options={{ minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false }}
                />
            </div>
            {jsonError && (
                <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>{jsonError}</div>
            )}
            <Alert
                type="info"
                showIcon
                message={
                    <span style={{ fontSize: '12px' }}>
                        <code>labels</code> 为全局标签，<code>targetLabels</code> 为各 Target 的额外标签（冲突时优先级更高）
                    </span>
                }
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
                <Button onClick={onClose}>取消</Button>
                <Button type="primary" onClick={handleSubmit} style={{ backgroundColor: '#000000' }}>
                    提交
                </Button>
            </div>
        </Modal>
    )
}
