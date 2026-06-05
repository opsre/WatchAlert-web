import React, { useEffect, useState } from 'react'
import { Typography, message, Tooltip, Button, Modal, Input, Badge } from 'antd'
import { FolderOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, EditOutlined, AppstoreOutlined } from '@ant-design/icons'
import { PrometheusTargetGroupList, PrometheusTargetGroupDelete } from '../../../api/prometheus'
import { ServiceGroupCreateModal } from './createGroup'

export const ServiceGroupSidebar = ({ selectedGroupId, onGroupChange }) => {
    const [groupList, setGroupList] = useState([])
    const [filteredGroupList, setFilteredGroupList] = useState([])
    const [loading, setLoading] = useState(false)
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    const [hoveredGroupId, setHoveredGroupId] = useState(null)
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [selectedGroup, setSelectedGroup] = useState(null)

    useEffect(() => {
        handleListGroup()
    }, [])

    useEffect(() => {
        if (searchValue.trim() === '') {
            setFilteredGroupList(groupList)
        } else {
            const filtered = groupList.filter(g =>
                g.name.toLowerCase().includes(searchValue.toLowerCase())
            )
            setFilteredGroupList(filtered)
        }
    }, [searchValue, groupList])

    const handleListGroup = async () => {
        setLoading(true)
        try {
            const res = await PrometheusTargetGroupList({ index: 1, size: 1000 })
            const list = res?.data?.list || []
            setGroupList(Array.isArray(list) ? list : [])
            setFilteredGroupList(Array.isArray(list) ? list : [])
        } catch (error) {
            console.error('获取服务组列表失败:', error)
            message.error('获取服务组列表失败')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleSearch = () => {
        setSearchVisible(!searchVisible)
        if (searchVisible) setSearchValue('')
    }

    const handleDeleteGroup = async (group, e) => {
        e.stopPropagation()
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除服务组「${group.name}」吗？`,
            okText: '确定',
            cancelText: '取消',
            okType: 'danger',
            onOk: async () => {
                try {
                    await PrometheusTargetGroupDelete({ id: group.id })
                    handleListGroup()
                    if (String(group.id) === String(selectedGroupId)) {
                        onGroupChange(null)
                    }
                } catch (error) {
                    message.error('删除失败')
                }
            }
        })
    }

    const handleUpdateGroup = (group) => {
        setSelectedGroup(group)
        setUpdateModalVisible(true)
    }

    return (
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
                flexDirection: 'column',
                gap: '8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AppstoreOutlined style={{ fontSize: '14px', color: '#595959' }} />
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#262626' }}>服务组</span>
                        <Badge
                            count={filteredGroupList.length}
                            style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', fontSize: '11px', boxShadow: 'none' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Tooltip title={searchVisible ? "关闭搜索" : "搜索"}>
                            <Button type="text" size="small" icon={<SearchOutlined />} onClick={handleToggleSearch}
                                style={{ color: searchVisible ? '#000' : '#8c8c8c' }} />
                        </Tooltip>
                        <Tooltip title="创建服务组">
                            <Button type="text" size="small" icon={<PlusOutlined />}
                                onClick={() => setCreateModalVisible(true)}
                                style={{ color: '#8c8c8c' }} />
                        </Tooltip>
                    </div>
                </div>
                {searchVisible && (
                    <Input
                        size="small"
                        placeholder="搜索服务组..."
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        allowClear
                        autoFocus
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        style={{ borderRadius: '6px' }}
                    />
                )}
            </div>

            {/* 卡片列表 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {filteredGroupList.map(group => {
                        const isSelected = String(group.id) === String(selectedGroupId)
                        const isHovered = hoveredGroupId === String(group.id)
                        return (
                            <div
                                key={group.id}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                    background: isSelected ? '#f5f0e6' : '#fff',
                                    border: `1px solid ${isSelected ? 'rgba(167, 135, 83, 0.5)' : '#f0f0f0'}`,
                                    boxShadow: isSelected
                                        ? '0 1px 4px rgba(167, 135, 83, 0.15)'
                                        : isHovered
                                            ? '0 1px 4px rgba(0,0,0,0.08)'
                                            : '0 0.5px 2px rgba(0,0,0,0.04)',
                                    transition: 'all 0.15s ease',
                                    position: 'relative',
                                }}
                                onClick={() => onGroupChange(group.id)}
                                onMouseEnter={() => setHoveredGroupId(String(group.id))}
                                onMouseLeave={() => setHoveredGroupId(null)}
                            >
                                {/* 卡片内容 */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                    <FolderOutlined style={{
                                        fontSize: '14px',
                                        color: isSelected ? 'rgb(167, 135, 83)' : '#bfbfbf',
                                        marginTop: '2px',
                                        flexShrink: 0,
                                    }} />
                                    <Tooltip title={group.name} placement="right">
                                        <span style={{
                                            flex: 1,
                                            fontSize: '12px',
                                            lineHeight: '1.4',
                                            color: isSelected ? 'rgb(120, 95, 50)' : '#262626',
                                            fontWeight: isSelected ? 500 : 400,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 2,
                                            WebkitBoxOrient: 'vertical',
                                            wordBreak: 'break-all',
                                        }}>
                                            {group.name}
                                        </span>
                                    </Tooltip>

                                    {/* hover 操作按钮（内联右侧） */}
                                    {isHovered && (
                                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginTop: '-4px' }}>
                                            <Tooltip title="编辑">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<EditOutlined style={{ fontSize: '12px', color: '#595959' }} />}
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateGroup(group) }}
                                                    style={{ padding: '2px', height: '20px', width: '20px', minWidth: '20px' }}
                                                />
                                            </Tooltip>
                                            <Tooltip title="删除">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
                                                    onClick={(e) => handleDeleteGroup(group, e)}
                                                    style={{ padding: '2px', height: '20px', width: '20px', minWidth: '20px', color: '#ff4d4f' }}
                                                />
                                            </Tooltip>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>

                {filteredGroupList.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#bfbfbf',
                        padding: '40px 12px',
                        fontSize: '13px',
                    }}>
                        {searchValue ? '未找到匹配的服务组' : '暂无服务组'}
                    </div>
                )}
            </div>

            <ServiceGroupCreateModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                type="create"
                handleList={handleListGroup}
            />
            <ServiceGroupCreateModal
                visible={updateModalVisible}
                onClose={() => setUpdateModalVisible(false)}
                type="update"
                selectedRow={selectedGroup}
                handleList={handleListGroup}
            />
        </div>
    )
}
