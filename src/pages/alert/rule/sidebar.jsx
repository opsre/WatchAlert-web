import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Typography, message, Tooltip, Button, Modal, Input } from 'antd'
import { FolderOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, CaretDownOutlined, CaretRightOutlined, EditOutlined } from '@ant-design/icons'
import { getRuleGroupList, deleteRuleGroup } from '../../../api/rule'
import { AlertRuleGroupCreateModal } from './createGroup.jsx'

const { Text } = Typography

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
            isExpanded: true,
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
                    isExpanded: true,
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
            // 不需要 push 到 tree，这里后面统一收集
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
const TreeNode = React.memo(({
    node,
    selectedRuleGroupId,
    onRuleGroupChange,
    handleDeleteRuleGroup,
    handleUpdateRuleGroup,
    hoveredGroupId,
    setHoveredGroupId,
    toggleExpand
}) => {
    const isSelected = node.id === selectedRuleGroupId
    const isHovered = hoveredGroupId === node.id
    const hasChildren = node.children?.length > 0

    // ==================== 点击逻辑（按你的最新需求） ====================
    const handleNodeClick = useCallback((e) => {
        if (!node.isReal) {
            return;                    // 虚拟父节点（xxxx）不允许选中
        }
        if (e.target.closest('button')) return;

        onRuleGroupChange(node.id)
    }, [node.isReal, node.id, onRuleGroupChange])

    const handleExpandClick = useCallback((e) => {
        e.stopPropagation()
        toggleExpand(node.id)
    }, [node.id, toggleExpand])

    return (
        <div style={{ marginBottom: '2px' }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '36px',
                    padding: '0 12px',
                    margin: '0 8px',
                    borderRadius: '4px',
                    cursor: node.isReal ? 'pointer' : 'default',
                    userSelect: 'none'
                }}
                onClick={handleNodeClick}
                onMouseEnter={() => setHoveredGroupId(node.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
            >
                {/* 箭头 - 始终可点击（即使是虚拟节点） */}
                {hasChildren ? (
                    <span
                        onClick={handleExpandClick}
                        style={{ 
                            marginRight: '6px', 
                            fontSize: '12px', 
                            color: '#8c8c8c', 
                            width: '16px', 
                            cursor: 'pointer' 
                        }}
                    >
                        {node.isExpanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
                    </span>
                ) : (
                    <span style={{ marginRight: '6px', width: '16px' }} />
                )}

                {/* 名称 */}
                <Tooltip title={node.name} placement="right">
                    <span style={{
                        flex: 1,
                        fontSize: '13px',
                        color: isSelected ? 'rgb(255, 203, 125)' : (node.isReal ? '#595959' : '#bfbfbf'),
                        fontWeight: isSelected ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: node.isReal ? 'pointer' : 'default'
                    }}>
                        {node.displayName}
                    </span>
                </Tooltip>

                {/* 操作按钮：只有真实节点才显示 */}
                {isHovered && node.isReal && (
                    <div style={{ display: 'flex', gap: '2px' }}>
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined style={{ fontSize: '12px' }} />}
                            onClick={(e) => { e.stopPropagation(); handleUpdateRuleGroup(node); }}
                            style={{ padding: '2px', height: '20px', width: '20px', minWidth: '20px' }}
                        />
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleDeleteRuleGroup(node, e)}
                            style={{ padding: '2px', height: '20px', width: '20px', minWidth: '20px' }}
                        />
                    </div>
                )}
            </div>

            {/* 子节点 */}
            {hasChildren && node.isExpanded && (
                <div style={{ paddingLeft: '20px' }}>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            selectedRuleGroupId={selectedRuleGroupId}
                            onRuleGroupChange={onRuleGroupChange}
                            handleDeleteRuleGroup={handleDeleteRuleGroup}
                            handleUpdateRuleGroup={handleUpdateRuleGroup}
                            hoveredGroupId={hoveredGroupId}
                            setHoveredGroupId={setHoveredGroupId}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>
            )}
        </div>
    )
})

// ==================== 主组件 ====================
export const RuleGroupSidebar = ({ selectedRuleGroupId, onRuleGroupChange }) => {
    const [ruleGroupList, setRuleGroupList] = useState([])
    const [filteredRuleGroupList, setFilteredRuleGroupList] = useState([])
    const [loading, setLoading] = useState(false)
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    const [hoveredGroupId, setHoveredGroupId] = useState(null)
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [treeData, setTreeData] = useState([])

    // 构建树并更新展开状态
    const groupTree = useMemo(() => buildGroupTree(filteredRuleGroupList), [filteredRuleGroupList])

    // 同步 treeData（用于控制展开状态）
    useEffect(() => {
        setTreeData(groupTree)
    }, [groupTree])

    // 获取列表
    useEffect(() => {
        handleListRuleGroup()
    }, [])

    // 搜索
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
        setLoading(true)
        try {
            const res = await getRuleGroupList({ index: 1, size: 1000 })
            const list = res?.data?.list || res?.data || []
            setRuleGroupList(Array.isArray(list) ? list : [])
        } catch (error) {
            console.error('获取规则组列表失败:', error)
            message.error('获取规则组列表失败')
        } finally {
            setLoading(false)
        }
    }

    const toggleExpand = (id) => {
        setTreeData(prevTree => {
            const updateNode = (nodes) => {
                return nodes.map(node => {
                    if (node.id === id) {
                        return { ...node, isExpanded: !node.isExpanded }
                    }
                    if (node.children.length > 0) {
                        return { ...node, children: updateNode(node.children) }
                    }
                    return node
                })
            }
            return updateNode(prevTree)
        })
    }

    const handleToggleSearch = () => {
        setSearchVisible(!searchVisible)
        if (searchVisible) setSearchValue('')
    }

    const handleOpenCreateModal = () => setCreateModalVisible(true)
    const handleCloseCreateModal = () => setCreateModalVisible(false)
    const handleOpenUpdateModal = () => setUpdateModalVisible(true)
    const handleCloseUpdateModal = () => setUpdateModalVisible(false)

    const handleDeleteRuleGroup = async (group, e) => {
        e.stopPropagation()
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除规则组「${group.name}」吗？`,
            onOk: async () => {
                try {
                    await deleteRuleGroup({ id: group.id, name: group.name, })
                    handleListRuleGroup()
                } catch (error) {
                    message.error('删除失败')
                }
            }
        })
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 150px)',
            background: '#fff',
            borderRight: '1px solid #e8e8e8',
            overflow: 'hidden'
        }}>
            {/* 头部工具栏 */}
            <div style={{ padding: '8px 12px', borderBottom: '1px solid #e8e8e8', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {!searchVisible && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FolderOutlined style={{ fontSize: '16px', marginRight: 8 }} />
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: searchVisible ? 0 : 'auto' }}>
                        {searchVisible && (
                            <Input
                                size="small"
                                placeholder="搜索规则组"
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                style={{ width: '140px' }}
                                autoFocus
                            />
                        )}
                        <Tooltip title={searchVisible ? "关闭搜索" : "搜索"}>
                            <Button type="text" size="small" icon={<SearchOutlined />} onClick={handleToggleSearch} />
                        </Tooltip>
                        <Tooltip title="创建规则组">
                            <Button type="text" size="small" icon={<PlusOutlined />} onClick={handleOpenCreateModal} />
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* 树形列表 */}
            <div style={{ flex: 1, overflow: 'auto', marginLeft: '-20px' }}>
                {treeData.map(node => (
                    <TreeNode
                        key={node.id}
                        node={node}
                        selectedRuleGroupId={selectedRuleGroupId}
                        onRuleGroupChange={onRuleGroupChange}
                        handleDeleteRuleGroup={handleDeleteRuleGroup}
                        hoveredGroupId={hoveredGroupId}
                        setHoveredGroupId={setHoveredGroupId}
                        toggleExpand={toggleExpand}
                        setUpdateModalVisible={setUpdateModalVisible}
                        setSelectedGroup={setSelectedGroup}
                    />
                ))}

                {treeData.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#999', padding: '40px 0' }}>
                        暂无规则组
                    </div>
                )}
            </div>

            {/* 创建弹窗 */}
            <AlertRuleGroupCreateModal
                visible={createModalVisible}
                onClose={handleCloseCreateModal}
                type="create"
                handleList={handleListRuleGroup}
            />

            {/* 更新弹窗 */}
            <AlertRuleGroupCreateModal
                visible={updateModalVisible}
                onClose={handleCloseUpdateModal}
                type="update"
                handleList={handleListRuleGroup}
                selectedRow={selectedGroup}
            />

        </div>
    )
}