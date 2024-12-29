import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {Button, Input, Table, Popconfirm, message, Modal, Select, Form} from 'antd';
import RuleTemplateCreateModal from './RuleTemplateCreateModal';
import {useParams, useNavigate} from 'react-router-dom';
import {deleteRuleTmpl, getRuleTmplList} from '../../../api/ruleTmpl';
import {getRuleGroupList} from "../../../api/rule";
import { useRule } from '../../../context/RuleContext';

const MyFormItemContext = React.createContext([])
const { Search } = Input;

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
    const [selectedRow, setSelectedRow] = useState(null);
    const [viewVisible, setViewVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [openSelectedRuleGroupVisible, setOpenSelectedRuleGroupVisible] = useState(false);
    const [list, setList] = useState([]);
    const { tmplType, ruleGroupName } = useParams();
    const [height, setHeight] = useState(window.innerHeight);
    const [ruleGroupOptions, setRuleGroupOptions] = useState([]);
    const [selectedRuleGroup, setSelectedRuleGroup] = useState(null);
    const navigate = useNavigate();
    const { setRuleTemplate } = useRule();

    const columns = useMemo(() => [
        {
            title: '模版名称',
            dataIndex: 'ruleName',
            key: 'ruleName',
            width: 250,
            render: (text, record) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <a
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleRuleNameClick(record)}>
                            {text}
                        </a>
                    </div>
                </div>
            ),
        },
        {
            title: '数据源类型',
            dataIndex: 'datasourceType',
            key: 'datasourceType',
            width: 150,
        },
        {
            title: '告警事件详情',
            key: 'prometheusConfig.annotations',
            render: (record) => (
                <div>
                    {record.prometheusConfig?.annotations.length > 100 ? `${record.prometheusConfig?.annotations.slice(0,100)}...`: record.prometheusConfig?.annotations || '-'}
                </div>
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            width: 160,
            fixed: 'right',
            render: (_, record) =>
                list.length >= 1 ? (
                    <div>
                        <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record)}>
                            <a>删除</a>
                        </Popconfirm>

                        <Button type="link" onClick={() => handleUpdateTmpl(record)}>更新</Button>

                        <Button type="link" onClick={() => handleOpenSelectedRuleGroup(record)} style={{padding: '0px'}}>应用</Button>
                    </div>
                ) : null,
        },
    ], [list]);

    useEffect(() => {
        const handleResize = () => setHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        handleList();
    }, [tmplType, ruleGroupName]);

    const handleRuleNameClick = useCallback((record) => {
        setSelectedRow(record);
        setViewVisible(true);
    }, []);

    const handleUpdateTmpl = useCallback( (record) => {
        setSelectedRow(record)
        setUpdateVisible(true);
    }, [])

    const handleList = useCallback(async () => {
        const params = { type: tmplType, ruleGroupName };
        const res = await getRuleTmplList(params);
        setList(res.data);
    }, [tmplType, ruleGroupName]);

    const handleGetRuleGroupList = useCallback( async () => {
        const params = {
            index: 1,
            size: 9999,
        }
        const res = await getRuleGroupList(params);
        const newData = res.data.list.map((item) => ({
            label: item.name,
            value: item.id,
        }))
        setRuleGroupOptions(newData)
    }, [])

    const handleDelete = useCallback(async (record) => {
        try {
            const params = {
                ruleGroupName: record.ruleGroupName,
                ruleName: record.ruleName
            };
            await deleteRuleTmpl(params);
            handleList();
        } catch (error) {
            message.error(error);
        }
    }, [handleList]);

    const handleViewModalClose = useCallback(() => setViewVisible(false), []);

    const handleModalClose = useCallback(() => setVisible(false), []);

    const handleUpdateModalClose = useCallback(() => setUpdateVisible(false), []);

    const onSearch = useCallback(async (value) => {
        try {
            const params = {
                ruleGroupName,
                query: value,
                type: tmplType,
            };
            const res = await getRuleTmplList(params);
            setList(res.data);
        } catch (error) {
            console.error(error);
        }
    }, [ruleGroupName]);

    const handleOpenSelectedRuleGroup = useCallback((record) => {
        setSelectedRow(record)
        setOpenSelectedRuleGroupVisible(true)
    }, []);

    const handleCloseSelectedRuleGroup = useCallback(() => setOpenSelectedRuleGroupVisible(false), []);

    const handleSelectRuleGroupChange = useCallback((_, value)=> {setSelectedRuleGroup(value.value)},[])

    const handleSubmitUseTmplToRule = useCallback(() => {
        if (!selectedRuleGroup || !selectedRow) {
            message.error('请选择规则组');
            return;
        }

        // 准备模板数据
        const templateData = {
            ...selectedRow,
            ruleGroupId: selectedRuleGroup.value,
            ruleGroupName: selectedRuleGroup.label
        };

        console.log(templateData)

        // 将数据存储到 Context 中
        setRuleTemplate(templateData);

        // 跳转到创建页面
        navigate(`/ruleGroup/${selectedRuleGroup}/rule/add`);
        handleCloseSelectedRuleGroup();
    }, [selectedRuleGroup, selectedRow, setRuleTemplate, navigate]);

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                </div>
                <div>
                    <Button
                        type="primary"
                        onClick={() => setVisible(true)}
                        style={{
                            backgroundColor: '#000000'
                        }}
                    >
                        创建
                    </Button>
                </div>
            </div>

            { openSelectedRuleGroupVisible && (
                <div>
                    <Modal visible={openSelectedRuleGroupVisible} onCancel={handleCloseSelectedRuleGroup} footer={null}>
                        <p style={{marginTop: '-2px', fontSize: '15px', fontWeight: 'bold',}}>应用</p>
                        <MyFormItem
                            label="告警规则组"
                            rules={[{required: true}]}
                            labelCol={{span: 24}}
                            wrapperCol={{span: 24}}
                        >
                            <Select
                                showSearch
                                placeholder="将规则模版应用到哪个规则组中"
                                options={ruleGroupOptions}
                                onClick={handleGetRuleGroupList}
                                onChange={handleSelectRuleGroupChange}
                            />
                        </MyFormItem>

                        <div style={{display: 'flex', justifyContent: 'space-between'}}>
                            <Button onClick={handleCloseSelectedRuleGroup} style={{marginRight: '10px'}}>
                                取消
                            </Button>
                            <Button
                                type="primary"
                                onClick={handleSubmitUseTmplToRule}
                                style={{
                                    backgroundColor: '#000000'
                                }}>
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

            <RuleTemplateCreateModal
                visible={viewVisible}
                onClose={handleViewModalClose}
                selectedRow={selectedRow}
                type="view"
                handleList={handleList}
                ruleGroupName={ruleGroupName}
            />

            <div style={{ overflowX: 'auto', marginTop: 10 }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        y: height - 400, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
                    }}
                    bordered // 添加表格边框
                    style={{ backgroundColor: '#fff' }} // 设置表格背景色
                    rowKey={(record) => record.id} // 设置行唯一键
                />
            </div>
        </>
    );
};