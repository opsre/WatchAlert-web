import {Modal, Form, Input, Button, Radio, Select, InputNumber, Divider, Card, List, TimePicker, Typography} from 'antd'
import React, { useState, useEffect } from 'react'
import {createRuleTmpl, updateRuleTmpl} from '../../../api/ruleTmpl'
import {useParams} from "react-router-dom";
import {PrometheusPromQL} from "../../promethues";
import PrometheusImg from "../rule/img/Prometheus.svg";
import LokiImg from "../rule/img/L.svg";
import AlicloudImg from "../rule/img/alicloud.svg";
import JaegerImg from "../rule/img/jaeger.svg";
import VMImg from "../rule/img/victoriametrics.svg";
import K8sImg from "../rule/img/Kubernetes.svg";
import ESImg from "../rule/img/ElasticSearch.svg";
import {getKubernetesReasonList, getKubernetesResourceList} from "../../../api/kubernetes";

const MyFormItemContext = React.createContext([])
const { Option } = Select;

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// 表单组
const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatPath = React.useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

// 表单
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

const RuleTemplateCreateModal = ({ visible, onClose, selectedRow, type, handleList, ruleGroupName }) => {
    const [form] = Form.useForm()
    const { tmplType} = useParams()
    const cards = [
        {
            imgSrc: PrometheusImg,
            text: 'Prometheus',
        },
        {
            imgSrc: LokiImg,
            text: 'Loki',
        },
        {
            imgSrc: AlicloudImg,
            text: 'AliCloudSLS',
        },
        {
            imgSrc: JaegerImg,
            text: 'Jaeger',
        },
        {
            imgSrc: VMImg,
            text: 'VictoriaMetrics',
        },
        {
            imgSrc: K8sImg,
            text: 'KubernetesEvent',
        },
        {
            imgSrc: ESImg,
            text: 'ElasticSearch',
        }
    ];
    const [selectedCard, setSelectedCard] = useState(0);
    const [selectedType, setSelectedType] = useState(0) // 数据源类型
    const [exprRule, setExprRule] = useState([{}])
    const [promQL,setPromQL] = useState()
    const [kubeResourceTypeOptions,setKubeResourceTypeOptions]=useState([])
    const [selectedKubeResource,setSelectedKubeResource]=useState('')
    const [kubeReasonListOptions,setKubeReasonListOptions]=useState({})
    const [filterTags,setFilterTags] = useState([])
    const [errors, setErrors] = useState([]);
    const [esfilter, setEsfilter] = useState([{}])
    const [spaceValue, setSpaceValue] = useState('')

    const handleInputChange = (e) => {
        // 移除输入值中的空格
        const newValue = e.target.value.replace(/\s/g, '')
        setSpaceValue(newValue)
    }

    const handleKeyPress = (e) => {
        // 阻止空格键的默认行为
        if (e.key === ' ') {
            e.preventDefault()
        }
    }

    useEffect(() => {
        if (selectedRow) {
            form.setFieldsValue({
                annotations: selectedRow.annotations,
                datasourceId: selectedRow.datasourceId,
                datasourceType: selectedRow.datasourceType,
                description: selectedRow.description,
                enabled: selectedRow.enabled,
                evalInterval: selectedRow.evalInterval,
                forDuration: selectedRow.forDuration,
                noticeGroup: selectedRow.noticeGroup,
                noticeId: selectedRow.noticeId,
                repeatNoticeInterval: selectedRow.repeatNoticeInterval,
                ruleId: selectedRow.ruleId,
                ruleName: selectedRow.ruleName,
                alicloudSLSConfig: selectedRow.alicloudSLSConfig,
                lokiConfig: selectedRow.lokiConfig,
                prometheusConfig: selectedRow.prometheusConfig,
                severity: selectedRow.severity,
                jaegerConfig: {
                    service: selectedRow.jaegerConfig.service,
                    tags: selectedRow.jaegerConfig.tags,
                    scope: selectedRow.jaegerConfig.scope,
                },
                effectiveTime: {
                    week: selectedRow.effectiveTime.week,
                    startTime: selectedRow.effectiveTime.startTime,
                    endTime: selectedRow.effectiveTime.endTime,
                },
                cloudwatchConfig: selectedRow.cloudwatchConfig,
                kubernetesConfig: selectedRow.kubernetesConfig,
                elasticSearchConfig: selectedRow.elasticSearchConfig,
                recoverNotify:selectedRow.recoverNotify,
            })

            let t = 0;
            if (selectedRow.datasourceType === "Prometheus"){
                t = 0
            } else if (selectedRow.datasourceType === "Loki"){
                t = 1
            } else if (selectedRow.datasourceType === "AliCloudSLS"){
                t = 2
            } else if (selectedRow.datasourceType === "Jaeger"){
                t = 3
            } else if (selectedRow.datasourceType === "VictoriaMetrics"){
                t = 4
            } else if (selectedRow.datasourceType === "KubernetesEvent"){
                t = 5
            } else if (selectedRow.datasourceType === "ElasticSearch"){
                t = 6
            }

            setSelectedType(t)
            setSelectedCard(t)
            setExprRule(selectedRow.prometheusConfig.rules)
            setSelectedKubeResource(selectedRow.kubernetesConfig.resource)
            setFilterTags(selectedRow.kubernetesConfig.filter)
            setEsfilter(selectedRow.elasticSearchConfig.filter)
        }
    }, [selectedRow, form])

    useEffect(() => {
        handleGetKubernetesEventTypes()
    }, [])

    // 创建
    const handleFormSubmit = async (values) => {
        let t = getSelectedTypeName(selectedType);
        const params = {
            ...values,
            datasourceType: t,
            type: tmplType,
            ruleGroupName: ruleGroupName,
        }
        if (type === 'create') {
            try {
                await createRuleTmpl(params)
                handleList(ruleGroupName)
            } catch (error) {
                console.error(error)
            }
        }
        if (type === 'update') {
            try {
                await updateRuleTmpl(params)
                handleList(ruleGroupName)
            } catch (error) {
                console.error(error)
            }
        }

        // 关闭弹窗
        onClose()
    }

    useEffect(() => {
        handleGetKubeReasonList(selectedKubeResource)
    }, [selectedKubeResource]);

    const handleGetKubeReasonList = async (resource)=> {
        const params = {
            resource: resource
        }
        const res = await getKubernetesReasonList(params)
        const options = res.data?.map((item) => ({
            label: item.typeCN,
            value: item.type
        }))
        setKubeReasonListOptions(options)
    }

    const handleGetKubernetesEventTypes = async() =>{
        try{
            const res = await getKubernetesResourceList()
            const ops = res.data?.map((item) =>{
                return {
                    label: item,
                    value: item,
                }
            })
            setKubeResourceTypeOptions(ops)
        } catch (error){
            console.error(error)
        }
    }

    const getSelectedTypeName = (selectedType) =>{
        let t = ""
        if (selectedType === 0){
            t = "Prometheus"
        } else if (selectedType === 1){
            t = "Loki"
        } else if (selectedType === 2){
            t = "AliCloudSLS"
        } else if (selectedType === 3){
            t = "Jaeger"
        } else if (selectedType === 4){
            t = "VictoriaMetrics"
        } else if (selectedType === 5){
            t = "KubernetesEvent"
        } else if (selectedType === 6){
            t = "ElasticSearch"
        }

        return t
    }

    const handleCardClick = (index) => {
        setSelectedType(index)
        setSelectedCard(index);
    };

    const addExprRule = () => {
        if(exprRule.length < 3){
            setExprRule([...exprRule, { severity: '', expr: '' }]);
        }
    }

    const updateExprRule = (index, field, value) => {
        const updatedExprRule = [...exprRule]
        updatedExprRule[index][field] = value
        setExprRule(updatedExprRule)
    }

    const removeExprRule = (index) => {
        const updatedExprRule = [...exprRule]
        updatedExprRule.splice(index, 1)
        setExprRule(updatedExprRule)
    }

    const disableSeverity = (s) => {
        return exprRule.some((rule) => {
            if (rule.severity) {
                return rule.severity === s;
            }
        });
    }

    const handleExprChange = (index, value) => {
        const trimmedValue = value.trim(); // 去除输入值两端的空格
        const newErrors = [...errors];

        if (trimmedValue !== value) {
            // 输入值中含有空格时，提示错误信息
            newErrors[index] = '输入的值不允许包含空格';
        } else if (validateExpr(trimmedValue) || trimmedValue === '') {
            updateExprRule(index, 'expr', trimmedValue);
            newErrors[index] = '';
        } else {
            newErrors[index] = '请输入有效的表达式，例如：>80';
        }

        setErrors(newErrors);
    };

    const validateExpr = (expr) => {
        const regex = /^(\s*(==|>=|<=|!=|>|<)\s*-?\d+(\.\d+)?\s*)$/;
        return regex.test(expr);
    };

    const handleChangeFilterTags = (value) => {
        setFilterTags(value);
    };

    const addEsFilter = () => {
        setEsfilter([...esfilter, { field: '', value: '' }]);
    }

    const updateEsFilter = (index, field, value) => {
        const updatedEsFilter = [...esfilter]
        updatedEsFilter[index][field] = value
        setEsfilter(updatedEsFilter)
    }

    const removeEsFilter = (index) => {
        const updatedEsFilter = [...esfilter]
        updatedEsFilter.splice(index, 1)
        setEsfilter(updatedEsFilter)
    }

    const handleGetPromQL = () =>{
        if (promQL){
            return promQL
        }
        return form.getFieldValue(['prometheusConfig', 'promQL'])
    }

    useEffect(() => {
        form.setFieldsValue({ prometheusConfig: { promQL: promQL } });
    }, [promQL])

    return (
        <Modal
            visible={visible}
            onCancel={onClose}
            footer={null}
            bodyStyle={{ overflowY: 'auto', maxHeight: '600px' }} // 设置最大高度并支持滚动
            width={1080} // 设置Modal窗口宽度
        >
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <div>
                    <strong style={{fontSize: '20px'}}>基础配置</strong>
                    <div style={{display: 'flex'}}>
                        <MyFormItem
                            name="ruleName"
                            label="规则名称"
                            style={{
                                marginRight: '10px',
                                width: '50%',
                            }}
                            rules={[{required: true}]}
                        >
                            <Input
                                value={spaceValue}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                disabled={type === 'update'}/>
                        </MyFormItem>

                        <MyFormItem
                            name="description"
                            label="描述"
                            style={{width: '50%'}}
                        >
                            <Input/>
                        </MyFormItem>
                    </div>
                </div>

                <Divider/>

                <div>
                    <strong style={{fontSize: '20px'}}>规则配置</strong>

                    <div style={{display: 'flex'}}>
                        <div>
                            <p>数据源类型</p>
                            <div style={{display: 'flex', gap: '10px'}}>
                                {cards?.map((card, index) => (
                                    <Card
                                        key={index}
                                        style={{
                                            height: 100,
                                            width: 120,
                                            position: 'relative',
                                            cursor: type === 'edit' ? 'not-allowed' : 'pointer',
                                            border: selectedCard === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                            pointerEvents: type === 'edit' ? 'none' : 'auto',
                                        }}
                                        onClick={() => handleCardClick(index)}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            height: '100%',
                                            marginTop: '-10px'
                                        }}>
                                            <img src={card.imgSrc}
                                                 style={{height: '50px', width: '100px', objectFit: 'contain'}}
                                                 alt={card.text}/>
                                            <p style={{
                                                fontSize: '12px',
                                                textAlign: 'center',
                                                marginTop: '5px'
                                            }}>{card.text}</p>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>

                    <br/>

                    {(selectedType === 0 || selectedType === 4) &&
                        <>
                            <div className="rule-config-container">
                                <MyFormItemGroup prefix={['prometheusConfig']}>
                                    <MyFormItem name="promQL" label="PromQL" rules={[{required: true}]}>
                                        <PrometheusPromQL
                                            value={handleGetPromQL}
                                            setPromQL={setPromQL}
                                        />
                                    </MyFormItem>

                                    <MyFormItem name="" label="* 表达式" rules={[{required: !exprRule}]}>
                                        {exprRule?.map((label, index) => (
                                            <div className="rule-item" key={index} style={{gap: '10px'}}>
                                                <MyFormItem
                                                    name={['rules', index, 'severity']}
                                                    rules={[{required: true, message: '请选择告警等级'}]}
                                                    style={{width: '20%', gap: '10px'}}
                                                >
                                                    <Select
                                                        showSearch
                                                        value={label.severity}
                                                        onChange={(e) => updateExprRule(index, 'severity', e)}
                                                        placeholder="普通"
                                                    >
                                                        <Option value="P0"
                                                                disabled={disableSeverity('P0')}>紧急</Option>
                                                        <Option value="P1"
                                                                disabled={disableSeverity('P1')}>告警</Option>
                                                        <Option value="P2"
                                                                disabled={disableSeverity('P2')}>普通</Option>
                                                    </Select>
                                                </MyFormItem>

                                                <MyFormItem
                                                    name={['rules', index, 'expr']}
                                                    rules={[{required: true, message: '请输入表达式'}]}
                                                    validateStatus={errors[index] ? 'error' : ''}
                                                    help={errors[index]}
                                                    style={{width: '100%'}}
                                                >
                                                    <Input
                                                        placeholder='请输入有效的表达式，例如：>80'
                                                        value={label.expr}
                                                        onChange={(e) => handleExprChange(index, e.target.value)}
                                                        style={{width: '100%'}}
                                                    />
                                                </MyFormItem>

                                                <Button onClick={() => removeExprRule(index)}
                                                    // style={{marginLeft: '10px'}}
                                                        disabled={index === 0}>
                                                    -
                                                </Button>
                                            </div>
                                        ))}
                                    </MyFormItem>

                                    <div className="duration-input">
                                        <MyFormItem
                                            name="forDuration"
                                            label={"持续时间"}
                                            rules={[{required: true}]}
                                        >
                                            <InputNumber
                                                addonAfter="秒"
                                                placeholder="60"
                                                min={1}
                                            />
                                        </MyFormItem>
                                    </div>

                                    <div>
                                        <MyFormItem
                                            name="annotations"
                                            label="告警详情"
                                            tooltip="获取 Label 变量, 示例: ${job}, ${instance}。凡是 Target 中的变量均可通过`${}`获取。"
                                            rules={[
                                                {
                                                    required: true,
                                                },
                                            ]}>
                                            <Input/>
                                        </MyFormItem>
                                    </div>

                                    <div className="action-buttons">
                                        <Button type="link" onClick={addExprRule} disabled={exprRule.length === 3}>
                                            + 添加规则条件
                                        </Button>
                                    </div>
                                </MyFormItemGroup>
                            </div>
                        </>
                    }

                    {selectedType === 2 &&
                        <MyFormItemGroup prefix={['alicloudSLSConfig']}>
                            <div style={{display: 'flex'}}>
                                <MyFormItem
                                    name="project"
                                    label="Project"
                                    rules={[{required: true}]}
                                    style={{
                                        marginRight: '10px',
                                        width: '500px'
                                    }}>
                                    <Input/>
                                </MyFormItem>
                                <MyFormItem
                                    name="logstore"
                                    label="Logstore"
                                    rules={[{required: true,}]}
                                    style={{width: '500px'}}
                                >
                                    <Input/>
                                </MyFormItem>
                            </div>

                            <MyFormItem
                                name="logQL"
                                label="LogQL"
                                rules={[{required: true}]}>
                                <Input/>
                            </MyFormItem>

                            <div style={{display: 'flex'}}>
                                <MyFormItem
                                    name="logScope"
                                    label="查询区间"
                                    style={{width: '500px'}}
                                    rules={[{required: true}]}
                                >
                                    <InputNumber
                                        style={{width: '97%'}}
                                        addonAfter={'分钟'}
                                        placeholder="10"
                                        min={1}
                                    />
                                </MyFormItem>

                                <MyFormItemGroup prefix={['evalCondition']}>

                                    <MyFormItem name="type" label="判断条件">
                                        <Select showSearch style={{marginRight: 8, width: '127px'}}
                                                placeholder="数据条数">
                                            <Option value="count">数据条数</Option>
                                        </Select>
                                    </MyFormItem>

                                    <MyFormItem name="operator" label=" ">
                                        <Select showSearch style={{marginRight: 8, width: '127px'}} placeholder=">">
                                            <Option value=">">{'>'}</Option>
                                            <Option value=">=">{'>='}</Option>
                                            <Option value="<">{'<'}</Option>
                                            <Option value="<=">{'<='}</Option>
                                            <Option value="==">{'=='}</Option>
                                            <Option value="!=">{'!='}</Option>
                                        </Select>
                                    </MyFormItem>

                                    <MyFormItem name='value' label=" ">
                                        <InputNumber style={{width: '100px'}} min={1} placeholder="0"/>
                                    </MyFormItem>

                                </MyFormItemGroup>

                            </div>

                        </MyFormItemGroup>
                    }

                    {selectedType === 3 &&
                        <MyFormItemGroup prefix={['jaegerConfig']}>
                            <div style={{display: 'flex'}}>
                                <MyFormItem
                                    name='tags'
                                    label="判断条件"
                                    style={{width: '500px'}}
                                    rules={[{required: true}]}
                                >
                                    <Select showSearch style={{width: '100%'}} placeholder="StatusCode =~ 5xx">
                                        <Option
                                            value='%7B"http.status_code"%3A"5.%2A%3F"%7D'>{'StatusCode =~ 5xx'}</Option>
                                    </Select>
                                </MyFormItem>
                            </div>

                            <MyFormItem
                                name="scope"
                                label="查询区间"
                                style={{width: '380px'}}
                                rules={[{required: true}]}
                            >
                                <InputNumber
                                    style={{width: '98%'}}
                                    addonAfter={'分钟'}
                                    placeholder="10"
                                    min={1}
                                />
                            </MyFormItem>

                        </MyFormItemGroup>
                    }

                    {selectedType === 1 &&
                        <MyFormItemGroup prefix={['lokiConfig']}>

                            <MyFormItem
                                name="logQL"
                                label="LogQL"
                                rules={[{required: true,}]}>
                                <Input/>
                            </MyFormItem>

                            <div style={{display: 'flex'}}>
                                <MyFormItem
                                    name="logScope"
                                    label="查询区间"
                                    style={{
                                        width: '500px',
                                    }}
                                    rules={[{required: true}]}
                                >
                                    <InputNumber
                                        style={{width: '97%'}}
                                        addonAfter={'分钟'}
                                        placeholder="10"
                                        min={1}
                                    />
                                </MyFormItem>

                                <MyFormItemGroup prefix={['evalCondition']}>

                                    <MyFormItem name="type" label="判断条件">
                                        <Select showSearch style={{marginRight: 8, width: '127px'}}
                                                placeholder="数据条数">
                                            <Option value="count">数据条数</Option>
                                        </Select>
                                    </MyFormItem>

                                    <MyFormItem name="operator" label=" ">
                                        <Select showSearch style={{marginRight: 8, width: '127px'}} placeholder=">">
                                            <Option value=">">{'>'}</Option>
                                            <Option value=">=">{'>='}</Option>
                                            <Option value="<">{'<'}</Option>
                                            <Option value="<=">{'<='}</Option>
                                            <Option value="==">{'=='}</Option>
                                            <Option value="!=">{'!='}</Option>
                                        </Select>
                                    </MyFormItem>

                                    <MyFormItem name='value' label=" ">
                                        <InputNumber style={{width: '100px'}} min={1} placeholder="0"/>
                                    </MyFormItem>

                                </MyFormItemGroup>

                            </div>

                        </MyFormItemGroup>
                    }

                    {selectedType === 5 &&
                        <MyFormItemGroup prefix={['kubernetesConfig']}>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <MyFormItem
                                    name="resource"
                                    label="资源类型"
                                    rules={[{required: true}]}
                                    style={{width: '50%'}}>
                                    <Select
                                        showSearch
                                        placeholder="请选择资源类型"
                                        options={kubeResourceTypeOptions}
                                        onChange={(e) => setSelectedKubeResource(e)}
                                    />
                                </MyFormItem>

                                <MyFormItem
                                    name="reason"
                                    label="事件类型"
                                    rules={[{required: true,}]}
                                    style={{width: '50%'}}>
                                    <Select
                                        showSearch
                                        placeholder="请选择事件类型"
                                        options={kubeReasonListOptions}
                                    />
                                </MyFormItem>

                                <MyFormItem
                                    name="value"
                                    label="表达式"
                                    style={{width: '45%'}}
                                    rules={[{required: true,}]}>
                                    <InputNumber placeholder="输入阈值" addonBefore={
                                        "当事件条数 >="
                                    } addonAfter={"条时告警"}/>
                                </MyFormItem>
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <MyFormItem
                                    name="filter"
                                    label="过滤"
                                    tooltip={"过滤掉事件中某些 Reason, 例如：事件中存在 'nginx' 的 Pod 需要过滤, 那么输入 'nginx' 即可, 可以输入 Pod 全名称, 'nginx-xxx-xxx'"}
                                    style={{width: '100%'}}>
                                    <Select
                                        mode="tags"
                                        style={{width: '100%'}}
                                        placeholder="按 'Enter' 添加标签"
                                        value={filterTags}
                                        onChange={handleChangeFilterTags}
                                    >
                                        {filterTags?.map((tag) => (
                                            <Option key={tag} value={tag}>
                                                {tag}
                                            </Option>
                                        ))}
                                    </Select>
                                </MyFormItem>
                            </div>
                            <MyFormItem
                                name="scope"
                                label="查询区间"
                                rules={[{required: true,}]}
                                style={{width: '100%'}}
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    addonAfter={<span>分</span>}
                                    placeholder="10"
                                    min={1}
                                />
                            </MyFormItem>
                        </MyFormItemGroup>
                    }

                    {selectedType === 6 &&
                        <MyFormItemGroup prefix={['elasticSearchConfig']}>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <MyFormItem
                                    name="index"
                                    label="索引名称"
                                    rules={[{required: true,}]}
                                    style={{width: '50%'}}>
                                    <Input/>
                                </MyFormItem>

                                <MyFormItem
                                    name="scope"
                                    label="查询区间"
                                    rules={[{required: true}]}
                                    style={{width: '50%'}}
                                >
                                    <InputNumber
                                        style={{width: '100%'}}
                                        addonAfter={<span>分</span>}
                                        placeholder="10"
                                        min={1}
                                    />
                                </MyFormItem>
                            </div>

                            <span>筛选</span>
                            <div className="es-rule-config-container">
                                <MyFormItem name="" label="" rules={[{required: !esfilter}]}>
                                    {esfilter?.map((label, index) => (
                                        <div className="rule-item" key={index} style={{gap: '10px'}}>
                                            <MyFormItem
                                                name={['filter', index, 'field']}
                                                label="字段名"
                                                rules={[{required: true, message: '请输入字段名'}]}
                                                style={{width: '50%', gap: '10px'}}
                                            >
                                                <Input
                                                    onChange={(e) => updateEsFilter(index, 'field', e.target.value)}/>
                                            </MyFormItem>

                                            <MyFormItem
                                                name={['filter', index, 'value']}
                                                label="字段值"
                                                rules={[{required: true, message: '请输入字段值'}]}
                                                validateStatus={errors[index] ? 'error' : ''}
                                                help={errors[index]}
                                                style={{width: '50%'}}
                                            >
                                                <Input
                                                    value={label.expr}
                                                    style={{width: '100%'}}
                                                    onChange={(e) => updateEsFilter(index, 'value', e.target.value)}
                                                />
                                            </MyFormItem>

                                            <Button onClick={() => removeEsFilter(index)}
                                                    style={{marginTop: '30px'}}
                                                    disabled={index === 0}>
                                                -
                                            </Button>
                                        </div>
                                    ))}
                                </MyFormItem>
                                <Button type="link" onClick={addEsFilter} style={{
                                    display: 'block',
                                    textAlign: 'center',
                                    width: '100%',
                                    marginTop: '-30px'
                                }}>
                                    添加一个新的筛选规则
                                </Button>
                            </div>
                        </MyFormItemGroup>
                    }

                    <div style={{display: 'flex', marginTop: '20px'}}>
                        <MyFormItem
                            name="evalInterval"
                            label="执行频率"
                            style={{width: '100%'}}
                            rules={[{required: true}]}
                        >
                            <InputNumber
                                style={{width: '100%'}}
                                addonAfter={<span>秒</span>}
                                placeholder="10"
                                min={1}
                            />
                        </MyFormItem>
                    </div>
                </div>

                {type !== 'view' &&
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            style={{
                                backgroundColor: '#000000'
                            }}
                        >
                            提交
                        </Button>
                    </div>
                }
            </Form>
        </Modal>
    )
}

export default RuleTemplateCreateModal