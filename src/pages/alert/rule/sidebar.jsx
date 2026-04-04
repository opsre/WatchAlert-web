import React, { useCallback, useEffect, useState, useMemo } from 'react'
import { Typography, message, Tooltip, Button, Modal, Input } from 'antd'
import { FolderOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, CaretDownOutlined, CaretRightOutlined, EditOutlined } from '@ant-design/icons'
import { getRuleGroupList, deleteRuleGroup } from '../../../api/rule'
import { AlertRuleGroupCreateModal } from './createGroup.jsx'

const { Text } = Typography

// ==================== 构建树形结构 ====================
const buildGroupTree = (groups) => {
    const groupMap = new Map()
    const tree = []

    // 创建节点
    groups.forEach(group => {
        const parts = group.name.split(':')
        groupMap.set(group.id, {
            ...group,
            children: [],
            displayName: parts[parts.length - 1],   // 只显示最后一级
            isExpanded: true                        // 默认展开
        })
    })

    // 建立父子关系
    groups.forEach(group => {
        const node = groupMap.get(group.id)
        const parts = group.name.split(':')

        if (parts.length === 1) {
            tree.push(node)
        } else {
            const parentName = parts.slice(0, -1).join(':')
            const parentNode = Array.from(groupMap.values()).find(n => n.name === parentName)

            if (parentNode) {
                parentNode.children.push(node)
            } else {
                tree.push(node) // 容错
            }
        }
    })

    // 排序
    const sortNodes = (nodes) => {
        nodes.sort((a, b) => a.name.localeCompare(b.name))
        nodes.forEach(node => {
            if (node.children.length > 0) sortNodes(node.children)
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
    handleDeleteRuleGroup,
    hoveredGroupId,
    setHoveredGroupId,
    toggleExpand,
    setUpdateModalVisible,
    setSelectedGroup
}) => {
    const isSelected = String(node.id) === String(selectedRuleGroupId)
    const isHovered = hoveredGroupId === node.id
    const hasChildren = node.children && node.children.length > 0

    const handleUpdateRuleGroup = (node) => {
        setUpdateModalVisible(true)
        setSelectedGroup(node)
    }

    return (
        <div style={{ marginBottom: '2px' }}>
            {/* 当前节点行 */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '36px',
                    padding: '0 12px',
                    margin: '0 8px',
                    borderRadius: '4px',
                    backgroundColor: isSelected ? '#f0f5ff' : 'transparent',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
                onClick={() => onRuleGroupChange(node.id)}
                onMouseEnter={() => setHoveredGroupId(node.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
            >
                {/* 展开/收起箭头 */}
                {hasChildren ? (
                    <span
                        onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(node.id)
                        }}
                        style={{ marginRight: '6px', fontSize: '12px', color: '#8c8c8c', width: '16px' }}
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
                        color: isSelected ? '#1890ff' : '#595959',
                        fontWeight: isSelected ? 600 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}>
                        {node.displayName}
                    </span>
                </Tooltip>

                
                {isHovered && (
                    <>
                        {/* 更新按钮 */}
                        <Button
                            type="text"
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => handleUpdateRuleGroup(node)}
                            style={{
                                padding: '2px',
                                height: '20px',
                                width: '20px',
                                minWidth: '20px'
                            }}
                        />
                    
                        {/* 删除按钮 */}
                        <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={(e) => handleDeleteRuleGroup(node, e)}
                            style={{
                                padding: '2px',
                                height: '20px',
                                width: '20px',
                                minWidth: '20px'
                            }}
                        />
                    </>
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
                            hoveredGroupId={hoveredGroupId}
                            setHoveredGroupId={setHoveredGroupId}
                            toggleExpand={toggleExpand}
                            setUpdateModalVisible={setUpdateModalVisible}
                            setSelectedGroup={setSelectedGroup}
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