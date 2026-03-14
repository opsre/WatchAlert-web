import React, { useEffect, useState } from 'react'
import { Menu, Typography, message, Tooltip, Button, Modal, Form, Input } from 'antd'
import { FolderOutlined, PlusOutlined, DeleteOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons'
import { RecordingRuleGroupList, RecordingRuleGroupCreate, RecordingRuleGroupDelete, RecordingRuleGroupUpdate } from '../../../api/recordingRule'

const { Text } = Typography

export const RuleGroupSidebar = ({ 
    selectedRuleGroupId, 
    onRuleGroupChange,
    onRuleGroupChangeFromParent
}) => {
    const [ruleGroupList, setRuleGroupList] = useState([])
    const [filteredRuleGroupList, setFilteredRuleGroupList] = useState([])
    const [createModalVisible, setCreateModalVisible] = useState(false)
    const [updateModalVisible, setUpdateModalVisible] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState(null)
    const [hoveredGroupId, setHoveredGroupId] = useState(null)
    const [searchVisible, setSearchVisible] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [form] = Form.useForm()

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
            const params = { index: 1, size: 1000 }
            const res = await RecordingRuleGroupList(params)
            if (res?.data?.list && Array.isArray(res.data.list)) {
                setRuleGroupList(res.data.list)
                setFilteredRuleGroupList(res.data.list)
            } else {
                setRuleGroupList([])
                setFilteredRuleGroupList([])
            }
        } catch (error) {
            console.error('Failed to fetch rule group list:', error)
            message.error('获取规则组列表失败')
            setRuleGroupList([])
            setFilteredRuleGroupList([])
        }
    }

    const handleToggleSearch = () => {
        setSearchVisible(!searchVisible)
        if (searchVisible) {
            setSearchValue('')
        }
    }

    const handleOpenCreateModal = () => {
        setCreateModalVisible(true)
    }

    const handleCloseCreateModal = () => {
        setCreateModalVisible(false)
    }

    const handleOpenUpdateModal = (group) => {
        setSelectedGroup(group)
        setUpdateModalVisible(true)
    }

    const handleCloseUpdateModal = () => {
        setUpdateModalVisible(false)
        setSelectedGroup(null)
    }

    const handleCreateRuleGroup = async (values) => {
        try {
            await RecordingRuleGroupCreate(values)
            const updatedList = await handleListRuleGroup()
            if (onRuleGroupChangeFromParent) {
                onRuleGroupChangeFromParent(updatedList)
            }
            message.success('创建成功')
        } catch (error) {
            console.error('创建规则组失败:', error)
        }
    }

    const handleUpdateRuleGroup = async (values) => {
        try {
            await RecordingRuleGroupUpdate(values)
            const updatedList = await handleListRuleGroup()
            if (onRuleGroupChangeFromParent) {
                onRuleGroupChangeFromParent(updatedList)
            }
            message.success('更新成功')
        } catch (error) {
            console.error('更新规则组失败:', error)
        }
    }

    const handleDeleteRuleGroup = async (group, e) => {
        e.stopPropagation()
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除规则组「${group.name}」吗？`,
            okText: '确定',
            cancelText: '取消',
            onOk: async () => {
                try {
                    await RecordingRuleGroupDelete({ id: group.id })
                    const updatedList = await handleListRuleGroup()
                    if (onRuleGroupChangeFromParent) {
                        onRuleGroupChangeFromParent(updatedList)
                    }
                } catch (error) {
                    console.error('删除规则组失败:', error)
                    return
                }
            }
        })
    }

    const CreateModal = () => (
        <Modal
            title="创建规则组"
            open={createModalVisible}
            onCancel={handleCloseCreateModal}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                    handleCreateRuleGroup(values)
                    handleCloseCreateModal()
                }}
            >
                <Form.Item
                    name="name"
                    label="名称"
                    rules={[{ required: true, message: '请输入规则组名称' }]}
                >
                    <Input placeholder="请输入规则组名称" />
                </Form.Item>
            </Form>
        </Modal>
    )

    const UpdateModal = () => (
        <Modal
            title="编辑规则组"
            open={updateModalVisible}
            onCancel={handleCloseUpdateModal}
            footer={null}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={(values) => {
                    handleUpdateRuleGroup({ ...values, id: selectedGroup.id })
                    handleCloseUpdateModal()
                }}
                initialValues={{ name: selectedGroup?.name }}
            >
                <Form.Item
                    name="name"
                    label="名称"
                    rules={[{ required: true, message: '请输入规则组名称' }]}
                >
                    <Input placeholder="请输入规则组名称" />
                </Form.Item>
            </Form>
        </Modal>
    )

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            height: 'calc(100vh - 150px)',
            background: '#fff',
            borderRight: '1px solid #e8e8e8',
            overflow: 'hidden'
        }}>
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
                                style={{ padding: '4px', height: 'auto', minWidth: 'auto' }}
                            />
                        </Tooltip>
                        <Tooltip title="创建规则组">
                            <Button
                                type="text"
                                size="small"
                                icon={<PlusOutlined />}
                                onClick={handleOpenCreateModal}
                                style={{ padding: '4px', height: 'auto', minWidth: 'auto' }}
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>

            <div style={{ 
                flex: 1, 
                overflow: 'auto',
                overflowX: 'hidden',
                marginLeft: '-15px'
            }}>
                <Menu
                    mode="inline"
                    selectedKeys={[selectedRuleGroupId]}
                    style={{ border: 'none', background: 'transparent' }}
                    className="custom-rule-group-menu"
                >
                    {filteredRuleGroupList.map((group) => {
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
                                        marginLeft: '10px',
                                        flexShrink: 0
                                    }}>
                                        {isHovered && (
                                            <>
                                                <Tooltip title="编辑规则组">
                                                    <Button
                                                        type="text"
                                                        size="small"
                                                        icon={<EditOutlined style={{ fontSize: '12px' }} />}
                                                        onClick={(e) => { e.stopPropagation(); handleOpenUpdateModal(group) }}
                                                        style={{
                                                            padding: '2px',
                                                            height: '24px',
                                                            width: '24px',
                                                            minWidth: '24px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                        }}
                                                    />
                                                </Tooltip>
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
                                                            justifyContent: 'center',
                                                            marginRight: '15px'
                                                        }}
                                                    />
                                                </Tooltip>
                                            </>
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
            <CreateModal />
            <UpdateModal />
        </div>
    )
}
