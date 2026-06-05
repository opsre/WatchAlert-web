import React, { useEffect, useState, useMemo } from 'react'
import { message, Tooltip, Button, Modal, Input, Badge } from 'antd'
import { FolderOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, CaretDownOutlined, CaretRightOutlined, EditOutlined, AppstoreOutlined } from '@ant-design/icons'
import { getRuleGroupList, deleteRuleGroup } from '../../../api/rule'
import { AlertRuleGroupCreateModal } from './createGroup.jsx'

// ==================== 构建树形结构 ====================
const buildGroupTree = (groups) => {
    const groupMap = new Map()   // id -> node
    const nameToNode = new Map() // name -> node （用于快速查找）

    const realGroups = new Set(groups.map(g => g.name)) // 所有真实存在的组名

    // 第一步：创建所有真实节点
    groups.forEach(group => {
        const parts = group.name.split(':')
        const node = {
            ...group,
            children: [],
            displayName: parts[parts.length - 1],
            isReal: true
        }
        groupMap.set(group.id, node)
        nameToNode.set(group.name, node)
    })

    // 第二步：为所有层级创建虚拟父节点（从最顶层开始）
    groups.forEach(group => {
        const parts = group.name.split(':')
        
        let currentPath = ''
        for (let i = 0; i < parts.length - 1; i++) {   // 不包含自己，只处理父级
            currentPath = currentPath ? `${currentPath}:${parts[i]}` : parts[i]
            
            // 如果这个父级路径不存在真实节点，则创建虚拟节点
            if (!realGroups.has(currentPath) && !nameToNode.has(currentPath)) {
                const virtualId = `virtual-${currentPath}`
                const virtualNode = {
                    id: virtualId,
                    name: currentPath,
                    displayName: parts[i],
                    children: [],
                    isReal: false
                }
                groupMap.set(virtualId, virtualNode)
                nameToNode.set(currentPath, virtualNode)
            }
        }
    })

    // 第三步：建立父子关系
    Array.from(groupMap.values()).forEach(node => {
        const parts = node.name.split(':')
        
        if (parts.length === 1) {
            // 顶层节点
        } else {
            const parentName = parts.slice(0, -1).join(':')
            const parentNode = nameToNode.get(parentName)
            
            if (parentNode) {
                parentNode.children.push(node)
            }
        }
    })

    // 第四步：收集顶层节点
    const tree = Array.from(groupMap.values()).filter(node => {
        const parts = node.name.split(':')
        return parts.length === 1
    })

    // 排序
    const sortNodes = (nodes) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name))
        nodes.forEach(node => {
            if (node.children?.length > 0) sortNodes(node.children)
        })
    }
    sortNodes(tree)

    return tree
}

// ==================== 单个树节点组件 ====================
const TreeNode = ({
    node,
    selectedRuleGroupId,
    onRuleGroupChange,
    onDeleteGroup,
    onUpdateGroup,
    hoveredGroupId,
    setHoveredGroupId,
    toggleExpand,
    collapsedKeys,
    depth = 0,
}) => {
    const isSelected = String(node.id) === selectedRuleGroupId
    const isHovered = hoveredGroupId === String(node.id)
    const hasChildren = node.children?.length > 0
    const isExpanded = !collapsedKeys.has(String(node.id))

    return (
        <div style={{ marginBottom: '4px' }}>
            <div
                style={{
                    padding: '8px 10px',
                    borderRadius: '7px',
                    cursor: node.isReal ? 'pointer' : 'default',
                    userSelect: 'none',
                    background: isSelected ? '#f5f0e6'
                        : isHovered && node.isReal ? '#fafafa' : 'transparent',
                    border: `1px solid ${
                        isSelected ? 'rgba(167, 135, 83, 0.45)'
                        : isHovered && node.isReal ? '#f0f0f0' : 'transparent'
                    }`,
                    boxShadow: isSelected
                        ? '0 1px 4px rgba(167, 135, 83, 0.12)'
                        : 'none',
                    transition: 'all 0.12s ease',
                    marginLeft: `${depth * 10}px`,
                }}
                onClick={(e) => {
                    if (!node.isReal || e.target.closest('button')) return
                    onRuleGroupChange(node.id)
                }}
                onMouseEnter={() => setHoveredGroupId(String(node.id))}
                onMouseLeave={() => setHoveredGroupId(null)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {hasChildren ? (
                        <span
                            onClick={(e) => { e.stopPropagation(); toggleExpand(String(node.id)) }}
                            style={{ fontSize: '11px', color: '#8c8c8c', cursor: 'pointer', flexShrink: 0, width: '14px', textAlign: 'center' }}
                        >
                            {isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                        </span>
                    ) : (
                        <span style={{ width: '14px', flexShrink: 0 }} />
                    )}

                    <FolderOutlined style={{
                        fontSize: '13px',
                        color: isSelected ? 'rgb(167, 135, 83)' : (node.isReal ? '#bfbfbf' : '#d9d9d9'),
                        flexShrink: 0,
                    }} />

                    <Tooltip title={node.name} placement="right">
                        <span style={{
                            flex: 1,
                            fontSize: '12px',
                            lineHeight: '1.4',
                            color: isSelected ? 'rgb(120, 95, 50)'
                                : node.isReal ? '#262626' : '#bfbfbf',
                            fontWeight: isSelected ? 500 : 400,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}>
                            {node.displayName}
                        </span>
                    </Tooltip>

                    {/* hover 操作按钮（内联右侧） */}
                    {isHovered && node.isReal && (
                        <div style={{ display: 'flex', gap: '2px', flexShrink: 0, marginTop: '-4px' }}>
                            <Tooltip title="编辑">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<EditOutlined style={{ fontSize: '12px', color: '#595959' }} />}
                                    onClick={(e) => { e.stopPropagation(); onUpdateGroup(node) }}
                                    style={{ padding: '2px', height: '20px', width: '20px', minWidth: '20px' }}
                                />
                            </Tooltip>
                            <Tooltip title="删除">
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined style={{ fontSize: '12px' }} />}
                                    onClick={(e) => onDeleteGroup(node, e)}
                                    style={{ padding: '2px', height: '20px', width: '20px', minWidth: '20px', color: '#ff4d4f' }}
                                />
                            </Tooltip>
                        </div>
                    )}
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div style={{ marginTop: '2px' }}>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedRuleGroupId={selectedRuleGroupId}
                            onRuleGroupChange={onRuleGroupChange}
                            onDeleteGroup={onDeleteGroup}
                            onUpdateGroup={onUpdateGroup}
                            hoveredGroupId={hoveredGroupId}
                            setHoveredGroupId={setHoveredGroupId}
                            toggleExpand={toggleExpand}
                            collapsedKeys={collapsedKeys}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ==================== 主组件 ====================
export const RuleGroupSidebar = ({ selectedRuleGroupId, onRuleGroupChange }) => {
    const [ruleGroupList, setRuleGroupList] = useState([])
    const [filteredRuleGroupList, setFilteredRuleGroupList] = useState([])
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    const [hoveredGroupId, setHoveredGroupId] = useState(null)
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [collapsedKeys, setCollapsedKeys] = useState(new Set())

    const groupTree = useMemo(() => buildGroupTree(filteredRuleGroupList), [filteredRuleGroupList])

    useEffect(() => {
        handleListRuleGroup()
    }, [])

    useEffect(() => {
        if (searchValue.trim() === '') {
            setFilteredRuleGroupList(ruleGroupList)
        } else {
            const filtered = ruleGroupList.filter(group =>
                group.name.toLowerCase().includes(searchValue.toLowerCase())
            )
            setFilteredRuleGroupList(filtered)
        }
    }, [searchValue, ruleGroupList])

    const handleListRuleGroup = async () => {
        try {
            const res = await getRuleGroupList({ index: 1, size: 1000 })
            const list = res?.data?.list || res?.data || []
            setRuleGroupList(Array.isArray(list) ? list : [])
            setFilteredRuleGroupList(Array.isArray(list) ? list : [])
        } catch (error) {
            console.error('获取规则组列表失败:', error)
            message.error('获取规则组列表失败')
        }
    }

    const toggleExpand = (id) => {
        setCollapsedKeys(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleToggleSearch = () => {
        setSearchVisible(!searchVisible)
        if (searchVisible) setSearchValue('')
    }

    const handleDeleteRuleGroup = async (group, e) => {
        e.stopPropagation()
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除规则组「${group.name}」吗？`,
            okText: '确定',
            cancelText: '取消',
            okType: 'danger',
            onOk: async () => {
                try {
                    await deleteRuleGroup({ id: group.id, name: group.name })
                    handleListRuleGroup()
                } catch (error) {
                    message.error('删除失败')
                }
            }
        })
    }

    const handleUpdateRuleGroup = (group) => {
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
                        <span style={{ fontSize: '13px', fontWeight: 600, color: '#262626' }}>规则组</span>
                        <Badge
                            count={filteredRuleGroupList.length}
                            style={{ backgroundColor: '#f0f0f0', color: '#8c8c8c', fontSize: '11px', boxShadow: 'none' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <Tooltip title={searchVisible ? "关闭搜索" : "搜索"}>
                            <Button type="text" size="small" icon={<SearchOutlined />} onClick={handleToggleSearch}
                                style={{ color: searchVisible ? '#000' : '#8c8c8c' }} />
                        </Tooltip>
                        <Tooltip title="创建规则组">
                            <Button type="text" size="small" icon={<PlusOutlined />}
                                onClick={() => setCreateModalVisible(true)}
                                style={{ color: '#8c8c8c' }} />
                        </Tooltip>
                    </div>
                </div>
                {searchVisible && (
                    <Input
                        size="small"
                        placeholder="搜索规则组..."
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        allowClear
                        autoFocus
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        style={{ borderRadius: '6px' }}
                    />
                )}
            </div>

            {/* 树形列表 */}
            <div style={{ flex: 1, overflow: 'auto', padding: '0 8px 8px' }}>
                {groupTree.map(node => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        selectedRuleGroupId={selectedRuleGroupId}
                        onRuleGroupChange={onRuleGroupChange}
                        onDeleteGroup={handleDeleteRuleGroup}
                        onUpdateGroup={handleUpdateRuleGroup}
                        hoveredGroupId={hoveredGroupId}
                        setHoveredGroupId={setHoveredGroupId}
                        toggleExpand={toggleExpand}
                        collapsedKeys={collapsedKeys}
                        depth={0}
                    />
                ))}

                {groupTree.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        color: '#bfbfbf',
                        padding: '40px 12px',
                        fontSize: '13px',
                    }}>
                        {searchValue ? '未找到匹配的规则组' : '暂无规则组'}
                    </div>
                )}
            </div>

            <AlertRuleGroupCreateModal
                visible={createModalVisible}
                onClose={() => setCreateModalVisible(false)}
                type="create"
                handleList={handleListRuleGroup}
            />
            <AlertRuleGroupCreateModal
                visible={updateModalVisible}
                onClose={() => setUpdateModalVisible(false)}
                type="update"
                selectedRow={selectedGroup}
                handleList={handleListRuleGroup}
            />
        </div>
    )
}