"use client"

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import {Button, Input, Table, message, Modal, Select, Form, Dropdown, Tooltip, Space} from "antd"
import RuleTemplateCreateModal from "./RuleTemplateCreateModal"
import { useParams, useNavigate } from "react-router-dom"
import { deleteRuleTmpl, getRuleTmplList, createRuleTmpl } from "../../../api/ruleTmpl"
import { getRuleGroupList } from "../../../api/rule"
import { useAppContext } from "../../../context/RuleContext"
import {
    DeleteOutlined,
    ExportOutlined,
    DownOutlined,
    ImportOutlined,
    EditOutlined,
    PlusOutlined
} from "@ant-design/icons"
import {HandleShowTotal} from "../../../utils/lib";
import { TableWithPagination } from "../../../utils/TableWithPagination"

const MyFormItemContext = React.createContext([])
const { Search } = Input

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// 表单
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const RuleTemplate = () => {
    const [selectedRow, setSelectedRow] = useState(null)
    const [visible, setVisible] = useState(false)
    const [updateVisible, setUpdateVisible] = useState(false)
    const [openSelectedRuleGroupVisible, setOpenSelectedRuleGroupVisible] = useState(false)
    const [list, setList] = useState([])
    const { tmplType, ruleGroupName } = useParams()
    const [height, setHeight] = useState(window.innerHeight)
    const [ruleGroupOptions, setRuleGroupOptions] = useState([])
    const [selectedRuleGroup, setSelectedRuleGroup] = useState(null)
    const navigate = useNavigate()
    const { setRuleTemplate } = useAppContext()
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [importModalVisible, setImportModalVisible] = useState(false)
    const [importedTemplates, setImportedTemplates] = useState([])
    const fileInputRef = useRef(null)
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    })

    // 行选择配置
    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys) => {
            setSelectedRowKeys(selectedKeys)
        },
    }

    const columns = useMemo(
        () => [
            {
                title: "模版名称",
                dataIndex: "ruleName",
                key: "ruleName",
                width: 250,
            },
            {
                title: "数据源类型",
                dataIndex: "datasourceType",
                key: "datasourceType",
                width: 150,
            },
            {
                title: "告警事件详情",
                key: "prometheusConfig.annotations",
                render: (record) => (
                    <div>
                        {record.prometheusConfig?.annotations?.length > 100
                            ? `${record.prometheusConfig?.annotations.slice(0, 100)}...`
                            : record.prometheusConfig?.annotations || "-"}
                    </div>
                ),
            },
            {
                title: "操作",
                dataIndex: "operation",
                width: 120,
                fixed: "right",
                render: (_, record) =>
                    list.length >= 1 ? (
                        <Space size="middle">
                            <Tooltip title="更新">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleUpdateTmpl(record)}
                                    style={{ color: "#1677ff" }}
                                />
                            </Tooltip>
                            <Tooltip title="应用">
                                <Button
                                    type="text"
                                    icon={<ImportOutlined />}
                                    onClick={() => handleOpenSelectedRuleGroup(record)}
                                    style={{ color: "#059136" }}
                                />
                            </Tooltip>
                        </Space>
                    ) : null,
            },
        ],
        [list],
    )

    useEffect(() => {
        const handleResize = () => setHeight(window.innerHeight)
        window.addEventListener("resize", handleResize)
        return () => window.removeEventListener("resize", handleResize)
    }, [])

    useEffect(() => {
        handleList(pagination.index, pagination.size)
    }, [tmplType, ruleGroupName])

    const handleUpdateTmpl = useCallback((record) => {
        setSelectedRow(record)
        setUpdateVisible(true)
    }, [])

    const handleList = useCallback(async (index, size) => {
        const params = { 
            type: tmplType, 
            ruleGroupName, 
            index: index, 
            size: size, 
        };
        const res = await getRuleTmplList(params);
    
        setPagination({
            index: res.data.index,
            size: res.data.size,
            total: res.data.total,
        })

        setList(res.data.list);
        // 清空选择
        setSelectedRowKeys([]);
    }, [tmplType, ruleGroupName])

    const handleGetRuleGroupList = useCallback(async () => {
        const params = {
            index: 1,
            size: 9999,
        }
        const res = await getRuleGroupList(params)
        const newData = res.data.list.map((item) => ({
            label: item.name,
            value: item.id,
        }))
        setRuleGroupOptions(newData)
    }, [])

    const handleModalClose = useCallback(() => setVisible(false), [])

    const handleUpdateModalClose = useCallback(() => setUpdateVisible(false), [])

    const onSearch = useCallback(
        async (value) => {
            try {
                const params = {
                    ruleGroupName,
                    query: value,
                    type: tmplType,
                }
                const res = await getRuleTmplList(params)
                setList(res.data.list)
                // 清空选择
                setSelectedRowKeys([])
            } catch (error) {
                console.error(error)
            }
        },
        [ruleGroupName],
    )

    const handleOpenSelectedRuleGroup = useCallback((record) => {
        setSelectedRow(record)
        setOpenSelectedRuleGroupVisible(true)
    }, [])

    const handleCloseSelectedRuleGroup = useCallback(() => setOpenSelectedRuleGroupVisible(false), [])

    const handleSelectRuleGroupChange = useCallback((_, value) => {
        setSelectedRuleGroup(value.value)
    }, [])

    const handleSubmitUseTmplToRule = useCallback(() => {
        if (!selectedRuleGroup || !selectedRow) {
            message.error("请选择规则组")
            return
        }

        // 准备模板数据
        const templateData = {
            ...selectedRow,
            ruleGroupId: selectedRuleGroup.value,
            ruleGroupName: selectedRuleGroup.label,
        }

        // 将数据存储到 Context 中
        setRuleTemplate(templateData)

        // 跳转到创建页面
        navigate(`/ruleGroup/${selectedRuleGroup}/rule/add`)
        handleCloseSelectedRuleGroup()
    }, [selectedRuleGroup, selectedRow, setRuleTemplate, navigate])

    // 批量删除
    const handleBatchDelete = async () => {
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要删除的模板")
            return
        }

        const deletePromises = selectedRowKeys.map((key) => {
            const record = list.find((item) => {
                // 使用组合键作为唯一标识
                return `${item.ruleGroupName}-${item.ruleName}` === key
            })

            if (record) {
                return deleteRuleTmpl({
                    ruleGroupName: record.ruleGroupName,
                    ruleName: record.ruleName,
                })
            }
            return Promise.resolve()
        })

        await Promise.all(deletePromises)
        setSelectedRowKeys([])
        handleList(pagination.index, pagination.size) // 刷新列表
    }

    // 批量导出
    const handleBatchExport = () => {
        if (selectedRowKeys.length === 0) {
            message.warning("请先选择要导出的模板")
            return
        }

        // 找出所有选中的模板
        const selectedTemplates = list.filter((item) => {
            // 使用组合键作为唯一标识
            return selectedRowKeys.includes(`${item.ruleGroupName}-${item.ruleName}`)
        })

        // 导出为JSON文件
        const data = JSON.stringify(selectedTemplates, null, 2)
        const blob = new Blob([data], { type: "application/json" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `templates_export_${new Date().toISOString().slice(0, 10)}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)

        message.success(`已导出 ${selectedTemplates.length} 个模板`)
    }

    // 处理导入按钮点击
    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click()
        }
    }

    // 处理文件选择
    const handleFileChange = (event) => {
        const file = event.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const templates = JSON.parse(e.target.result)
                if (!Array.isArray(templates)) {
                    message.error("导入的文件格式不正确，应为模板数组")
                    return
                }

                setImportedTemplates(templates)
                setImportModalVisible(true)
            } catch (error) {
                message.error("导入失败：文件解析错误")
                console.error("导入解析错误:", error)
            }
        }
        reader.readAsText(file)

        // 重置文件输入，以便可以重新选择同一个文件
        event.target.value = ""
    }

    // 确认导入
    const handleConfirmImport = async () => {
        if (importedTemplates.length === 0) {
            message.warning("没有可导入的模板")
            return
        }

        try {
            const importPromises = importedTemplates.map((template) => {
                // 检查是否已存在相同名称的模板
                const exists = list.some(
                    (item) => item.ruleName === template.ruleName && item.ruleGroupName === template.ruleGroupName,
                )

                if (exists) {
                    message.warning(`模版 ${template.ruleName} 已存在,跳过导入`)
                } else {
                    // 如果不存在，则创建新的
                    return createRuleTmpl(template)
                }
            })

            await Promise.all(importPromises)
            message.success(`成功导入 ${importedTemplates.length} 个模板`)
            setImportModalVisible(false)
            setImportedTemplates([])
            handleList(pagination.index, pagination.size) // 刷新列表
        } catch (error) {
            message.error("导入失败")
            console.error("导入错误:", error)
        }
    }

    // 批量操作菜单
    const batchOperationMenu = {
        items: [
            {
                key: "batchDelete",
                label: "批量删除",
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => {
                    if (selectedRowKeys.length > 0) {
                        Modal.confirm({
                            title: "确认删除",
                            content: `确定要删除选中的 ${selectedRowKeys.length} 个模板吗？`,
                            onOk: handleBatchDelete,
                        })
                    } else {
                        message.warning("请先选择要删除的模板")
                    }
                },
            },
            {
                key: "batchExport",
                label: "批量导出",
                icon: <ExportOutlined />,
                onClick: handleBatchExport,
            },
        ],
    }

    return (
        <>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <div>
                    <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    {/* 批量操作按钮 */}
                    <Dropdown menu={batchOperationMenu} disabled={selectedRowKeys.length === 0}>
                        <Button>
                            批量操作 <DownOutlined />
                        </Button>
                    </Dropdown>

                    {/* 导入按钮 */}
                    <Button
                        type="primary"
                        size="default"
                        icon={<ImportOutlined />}
                        onClick={handleImportClick}
                        style={{
                            backgroundColor: "#000000",
                        }}
                    >
                        导入
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        style={{ display: "none" }}
                        accept=".json"
                        onChange={handleFileChange}
                    />

                    <Button
                        type="primary"
                        onClick={() => setVisible(true)}
                        icon={<PlusOutlined />}
                        style={{
                            backgroundColor: "#000000",
                        }}
                    >
                        创建
                    </Button>
                </div>
            </div>

            {/* 导入确认模态框 */}
            <Modal
                title="确认导入"
                visible={importModalVisible}
                onCancel={() => setImportModalVisible(false)}
                onOk={handleConfirmImport}
                okText="确认导入"
                cancelText="取消"
            >
                <p>即将导入 {importedTemplates.length} 个模板：</p>
                <ul style={{ maxHeight: "300px", overflow: "auto" }}>
                    {importedTemplates.map((template, index) => (
                        <li key={index}>
                            {template.ruleName} ({template.datasourceType})
                        </li>
                    ))}
                </ul>
                <p>已存在的模板将被更新，不存在的将被创建。确认继续？</p>
            </Modal>

            {openSelectedRuleGroupVisible && (
                <div>
                    <Modal visible={openSelectedRuleGroupVisible} onCancel={handleCloseSelectedRuleGroup} footer={null}>
                        <p style={{ marginTop: "-2px", fontSize: "15px", fontWeight: "bold" }}>应用</p>
                        <MyFormItem
                            label="告警规则组"
                            rules={[{ required: true }]}
                            labelCol={{ span: 24 }}
                            wrapperCol={{ span: 24 }}
                        >
                            <Select
                                showSearch
                                placeholder="将规则模版应用到哪个规则组中"
                                options={ruleGroupOptions}
                                onClick={handleGetRuleGroupList}
                                onChange={handleSelectRuleGroupChange}
                            />
                        </MyFormItem>

                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <Button onClick={handleCloseSelectedRuleGroup} style={{ marginRight: "10px" }}>
                                取消
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleSubmitUseTmplToRule}
                                style={{
                                    backgroundColor: "#000000",
                                }}
                            >
                                提交
                            </Button>
                        </div>
                    </Modal>
                </div>
            )}

            <RuleTemplateCreateModal
                visible={visible}
                onClose={handleModalClose}
                type="create"
                handleList={handleList}
                ruleGroupName={ruleGroupName}
            />

            <RuleTemplateCreateModal
                visible={updateVisible}
                onClose={handleUpdateModalClose}
                selectedRow={selectedRow}
                type="update"
                handleList={handleList}
                ruleGroupName={ruleGroupName}
            />

            <TableWithPagination
                columns={columns}
                dataSource={list}
                pagination={pagination}
                onPageChange={(page, pageSize) => {
                    setPagination({ ...pagination, index: page, size: pageSize });
                    handleList(page, pageSize);
                }}
                onPageSizeChange={(current, pageSize) => {
                    setPagination({ ...pagination, index: current, pageSize });
                    handleList(current, pageSize);
                }}
                scrollY={height - 280}
                rowKey={record => record.id}
                showTotal={HandleShowTotal}
            />
        </>
    )
}

