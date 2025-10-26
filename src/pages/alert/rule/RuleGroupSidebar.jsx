import React, { useEffect, useState } from 'react'
import { Menu, Badge, Typography, message, Tooltip, Button, Modal, Input } from 'antd'
import { FolderOutlined, AppstoreOutlined, PlusOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { getRuleGroupList, createRuleGroup, deleteRuleGroup } from '../../../api/rule'
import { AlertRuleGroupCreateModal } from '../ruleGroup/AlertRuleGroupCreateModal'

const { Text } = Typography

export const RuleGroupSidebar = ({ 
    selectedRuleGroupId, 
    onRuleGroupChange
}) => {
    const [ruleGroupList, setRuleGroupList] = useState([])
    const [filteredRuleGroupList, setFilteredRuleGroupList] = useState([])
    const [loading, setLoading] = useState(false)
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [hoveredGroupId, setHoveredGroupId] = useState(null)
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [pagination, setPagination] = useState({
        index: 1,
        size: 1000
    })

    // 获取规则组列表
    useEffect(() => {
        handleListRuleGroup()
    }, [])

    // 搜索过滤
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
            const params = {
                index: 1,
                size: 1000  // 获取足够多的数据以显示所有规则组
            }
            const res = await getRuleGroupList(params)
            // 确保返回的是数组
            if (res && res.data && res.data.list) {
                const list = Array.isArray(res.data.list) ? res.data.list : []
                setRuleGroupList(list)
                setFilteredRuleGroupList(list)
            } else if (res && res.data && Array.isArray(res.data)) {
                // 兼容直接返回数组的情况
                setRuleGroupList(res.data)
                setFilteredRuleGroupList(res.data)
            } else {
                setRuleGroupList([])
                setFilteredRuleGroupList([])
            }
        } catch (error) {
            console.error('Failed to fetch rule group list:', error)
            message.error('获取规则组列表失败')
            setRuleGroupList([])
            setFilteredRuleGroupList([])
        } finally {
            setLoading(false)
        }
    }

    // 切换搜索框显示
    const handleToggleSearch = () => {
        setSearchVisible(!searchVisible)
        if (searchVisible) {
            setSearchValue('')
        }
    }

    // 打开创建弹窗
    const handleOpenCreateModal = () => {
        setCreateModalVisible(true)
    }

    // 关闭创建弹窗
    const handleCloseCreateModal = () => {
        setCreateModalVisible(false)
    }

    // 删除规则组
    const handleDeleteRuleGroup = async (group, e) => {
        e.stopPropagation() // 阻止事件冒泡，避免触发菜单项点击
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除规则组「${group.name}」吗？`,
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await deleteRuleGroup({ id: group.id })
                    handleListRuleGroup()
                } catch (error) {
                    console.error('删除规则组失败:', error)
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
            {/* 标题区域 */}
            <div style={{ 
                padding: '2px',
                borderBottom: '1px solid #e8e8e8',
                flexShrink: 0
            }}>
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    {!searchVisible && (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <FolderOutlined style={{ fontSize: '16px', marginRight: 8 }} />
                            <Text strong style={{ fontSize: '14px' }}>规则组</Text>
                        </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: searchVisible ? 0 : 'auto' }}>
                        {!searchVisible && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {filteredRuleGroupList.length}
                            </Text>
                        )}
                        {searchVisible && (
                            <Input
                                size="small"
                                placeholder="搜索"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                style={{ width: '120px' }}
                                autoFocus
                            />
                        )}
                        <Tooltip title={searchVisible ? "关闭搜索" : "搜索规则组"}>
                            <Button
                                type="text"
                                size="small"
                                icon={<SearchOutlined />}
                                onClick={handleToggleSearch}
                                style={{
                                    padding: '4px',
                                    height: 'auto',
                                    minWidth: 'auto'
                                }}
                            />
                        </Tooltip>
                        <Tooltip title="创建规则组">
                            <Button
                                type="text"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={handleOpenCreateModal}
                                style={{
                                    padding: '4px',
                                    height: 'auto',
                                    minWidth: 'auto'
                                }}
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            {/* 菜单列表区域 */}
            <div style={{ 
                flex: 1, 
                overflow: 'auto',
                overflowX: 'hidden',
                marginLeft: '-15px'
            }}>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedRuleGroupId]}
                    style={{ 
                        border: 'none',
                        background: 'transparent'
                    }}
                    // 自定义选中样式
                    className="custom-rule-group-menu"
                >
                    {filteredRuleGroupList.map((group) => {
                        const ruleCount = group.ruleCount || 0
                        const isSelected = group.id === selectedRuleGroupId
                        const isHovered = hoveredGroupId === group.id
                        return (
                            <Menu.Item
                                key={group.id}
                                onClick={() => onRuleGroupChange(group.id)}
                                onMouseEnter={() => setHoveredGroupId(group.id)}
                                onMouseLeave={() => setHoveredGroupId(null)}
                                style={{
                                    height: '40px',
                                    lineHeight: '24px',
                                    padding: '8px 12px',
                                    margin: '4px 8px',
                                    borderRadius: '4px',
                                    backgroundColor: 'transparent',
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    width: '100%',
                                    height: '100%'
                                }}>
                                    <Tooltip title={group.name} placement="right">
                                        <span style={{ 
                                            overflow: 'hidden', 
                                            textOverflow: 'ellipsis', 
                                            whiteSpace: 'nowrap',
                                            flex: 1,
                                            fontSize: '14px',
                                            color: isSelected ? '#000' : '#595959',
                                            fontWeight: isSelected ? 600 : 400
                                        }}>
                                            {group.name}
                                        </span>
                                    </Tooltip>
                                    <div style={{ 
                                        width: '24px',
                                        height: '24px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: '4px',
                                        flexShrink: 0
                                    }}>
                                        {isHovered && (
                                            <Tooltip title="删除规则组">
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => handleDeleteRuleGroup(group, e)}
                                                    style={{
                                                        padding: '2px',
                                                        height: '24px',
                                                        width: '24px',
                                                        minWidth: '24px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </div>
                                </div>
                            </Menu.Item>
                        )
                    })}
                </Menu>
                <style>{`
                    .custom-rule-group-menu .ant-menu-item-selected {
                        background-color: transparent !important;
                    }
                    .custom-rule-group-menu .ant-menu-item:hover {
                        background-color: transparent !important;
                    }
                    .custom-rule-group-menu .ant-menu-item::after {
                        display: none !important;
                    }
                `}</style>
            </div>

            {/* 创建规则组弹窗 */}
            <AlertRuleGroupCreateModal
                visible={createModalVisible}
                onClose={handleCloseCreateModal}
                type="create"
                handleList={handleListRuleGroup}
                pagination={pagination}
            />
        </div>
    )
}
