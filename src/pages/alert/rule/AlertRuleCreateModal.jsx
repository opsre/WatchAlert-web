import { List, Modal, Form, Input, Button, Switch, Radio, Divider, Select, Tooltip, InputNumber, Card,TimePicker } from 'antd'
import React, { useState, useEffect } from 'react'
import { QuestionCircleOutlined } from '@ant-design/icons'
import { createRule, updateRule } from '../../../api/rule'
import {getDatasource, searchDatasource} from '../../../api/datasource'
import { getNoticeList } from '../../../api/notice'
import {getJaegerService, queryPromMetrics} from '../../../api/other'
import moment from 'moment';
import './index.css'
import {
    getDimensions,
    getMetricNames,
    getMetricTypes,
    getRdsClusters,
    getRdsInstances,
    getStatistics
} from "../../../api/cloudwatch";
import PrometheusImg from "./img/Prometheus.svg"
import AlicloudImg from "./img/alicloud.svg"
import JaegerImg from "./img/jaeger.svg"
import AwsImg from "./img/AWSlogo.svg"
import LokiImg from "./img/L.svg"
import VMImg from "./img/victoriametrics.svg"
import K8sImg from "./img/Kubernetes.svg"
import {PrometheusPromQL} from "../../promethues";

const format = 'HH:mm';
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

export const AlertRuleCreateModal = ({ visible, onClose, selectedRow, type, handleList, ruleGroupId }) => {
    const [form] = Form.useForm()
    const [enabled, setEnabled] = useState(true) // 设置初始状态为 true
    const [recoverNotify,setRecoverNotify] = useState(true)
    const [selectedType, setSelectedType] = useState(null) // 数据源类型
    const [datasourceOptions, setDatasourceOptions] = useState([])  // 数据源列表
    const [selectedItems, setSelectedItems] = useState([])  //选择数据源
    const [noticeLabels, setNoticeLabels] = useState([]) // notice Lable
    const [noticeOptions, setNoticeOptions] = useState([])  // 通知对象列表
    // 禁止输入空格
    const [spaceValue, setSpaceValue] = useState('')

    // 告警等级
    const [severityValue, setSeverityValue] = useState(1)

    const [jaegerServiceList, setJaegerServiceList] = useState([])
    const [selectedCard, setSelectedCard] = useState(null);
    const [exprRule, setExprRule] = useState([{}])
    // 初始化时间数据的状态
    const [week,setWeek] = useState(null)
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const weekOptions = [
        {
            label:'周一',
            value:'Monday',
        },
        {
            label:'周二',
            value:'Tuesday',
        },
        {
            label:'周三',
            value:'Wednesday',
        },
        {
            label:'周四',
            value:'Thursday',
        },
        {
            label:'周五',
            value:'Friday',
        },
        {
            label:'周六',
            value:'Saturday',
        },
        {
            label:'周日',
            value:'Sunday',
        },
    ];

    const [metricTypeOptions,setMetricTypeOptions] = useState([])
    const [selectMetricType,setSelectMetricType] = useState('')
    const [metricNameOptions,setMetricNameOptions] = useState([])
    const [statisticOptions,setStatisticOptions] = useState([])
    const [cwExpr,setCwExpr] = useState('')
    const [dimensionOptions,setDimensionOptions] = useState([])
    const [selectDimension,setSelectDimension] = useState('')
    const [endpointOptions,setEndpointOptions] = useState([])
    const [inputLabelsValue, setInputLabelsValue] = useState("");
    const [promQL,setPromQL] = useState()
    const [selectDatasourceURL,setSelectDatasourceURL] = useState()
    const [queryModel,setQueryModel] = useState(0)

    const handleInputLabelsChange = (e) => {
        setInputLabelsValue(e.target.value);
    };

    const handleCardClick = (index) => {
        setSelectedType(index)
        setSelectedCard(index);
    };

    useEffect(() => {
        handleGetDatasourceList(selectedType)
    }, [selectedType])

    useEffect(() => {
        if (selectedCard === null){
            setSelectedCard(0)
            setSelectedType(0)
        }
        handleGetNoticeData()
    }, [])

    useEffect(() => {
        handleGetNoticeData()
        handleGetMetricTypes()
        handleGetStatistics()
    }, [])

    useEffect(() => {
        const params = {
            metricType: selectMetricType
        }
        handleGetMetricNames(params)
        handleGetDimensions(params)
    }, [selectMetricType]);

    useEffect(() => {
        const params = {
            datasourceId: selectedItems,
        }

        if (selectDimension === 'DBInstanceIdentifier'){
            handleGetRdsInstances(params)
        }

        if (selectDimension === 'DBClusterIdentifier'){
            handleGetRdsClusters(params)
        }

    }, [selectDimension]);

    const jsonToQueryString = (json) => {
        return Object.entries(json)
            .map(([key, value]) => `${key}=${value}`)
            .join(",");
    };

    useEffect(() => {
        if (selectedRow) {
            let labels = ""
            if (selectedRow.labels !== null) {
                labels = jsonToQueryString(selectedRow.labels)
            }

            form.setFieldsValue({
                annotations: selectedRow.annotations,
                datasourceId: selectedRow.datasourceId,
                datasourceType: selectedRow.datasourceType,
                description: selectedRow.description,
                enabled: selectedRow.enabled,
                evalInterval: selectedRow.evalInterval,
                forDuration: selectedRow.forDuration,
                labels: labels,
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
                recoverNotify:selectedRow.recoverNotify,
            })
            setSelectedItems(selectedRow.datasourceId)
            setWeek(selectedRow.effectiveTime.week)
            setStartTime(selectedRow.effectiveTime.startTime)
            setEndTime(selectedRow.effectiveTime.endTime)

            let t = 0;
            if (selectedRow.datasourceType === "Prometheus"){
                t = 0
            } else if (selectedRow.datasourceType === "Loki"){
                t = 1
            } else if (selectedRow.datasourceType === "AliCloudSLS"){
                t = 2
            } else if (selectedRow.datasourceType === "Jaeger"){
                t = 3
            } else if (selectedRow.datasourceType === "CloudWatch"){
                t = 4
            } else if (selectedRow.datasourceType === "VictoriaMetrics"){
                t = 5
            } else if (selectedRow.datasourceType === "KubernetesEvent"){
                t = 6
            }

            setSelectedType(t)
            setSelectedCard(t)
            setNoticeLabels(selectedRow.noticeGroup)
            setExprRule(selectedRow.prometheusConfig.rules)

            handleGetDatasourceInfo(selectedRow.datasourceId)
        }
    }, [selectedRow, form])

    const handleGetDatasourceInfo = async (id ) =>{
        const params = {
            id: id,
        }
        const res = await getDatasource(params)
        setSelectDatasourceURL(res?.data?.http?.url)
    }

    const handleCreateRule = async (values) => {
        try {
            let t = getSelectedTypeName(selectedType)

            const keyValuePairs = inputLabelsValue.split(",");
            const labelData = {};

            keyValuePairs.forEach((pair) => {
                const [key, value] = pair.split("=");
                labelData[key] = value;
            });

            const params = {
                ...values,
                datasourceType: t,
                noticeGroup: noticeLabels,
                ruleGroupId: ruleGroupId,
                effectiveTime: {
                    week: week,
                    startTime: startTime,
                    endTime: endTime,
                },
                labels: labelData,
                recoverNotify: recoverNotify,
                enabled: enabled
            }

            if (selectedType === 4) {
                let letCwExpr = cwExpr
                if (letCwExpr === '') {
                    letCwExpr = ">"
                }
                params.cloudwatchConfig.expr = letCwExpr
            }

            await createRule(params)
            handleList(ruleGroupId)
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdateRule = async (values) => {
        try {
            let t = getSelectedTypeName(selectedType);

            const keyValuePairs = inputLabelsValue.split(",");
            const labelData = {};

            keyValuePairs.forEach((pair) => {
                const [key, value] = pair.split("=");
                labelData[key] = value;
            });

            const params = {
                ...values,
                datasourceType: t,
                tenantId: selectedRow.tenantId,
                ruleId: selectedRow.ruleId,
                ruleGroupId: ruleGroupId,
                noticeGroup: noticeLabels,
                labels: labelData,
                effectiveTime: {
                    week: week,
                    startTime: startTime,
                    endTime: endTime,
                },
                recoverNotify: recoverNotify,
            }

            if (selectedType === 4) {
                let letCwExpr = cwExpr
                if (letCwExpr === '') {
                    letCwExpr = ">"
                }
                params.cloudwatchConfig.expr = letCwExpr
            }

            await updateRule(params)
            handleList(ruleGroupId)
        } catch (error) {
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
            t = "CloudWatch"
        } else if (selectedType === 5){
            t = "VictoriaMetrics"
        } else if (selectedType === 6){
            t = "KubernetesEvent"
        }

        return t
    }

    const handleGetDatasourceList = async (selectedType) => {
        try {
            let t = getSelectedTypeName(selectedType)

            const params = {
                type: t
            }
            const res = await searchDatasource(params)
            const newData = res.data.map((item) => ({
                label: item.name,
                value: item.id,
                url: item.http.url,
            }))

            // 将数据设置为选项对象数组
            setDatasourceOptions(newData)
        } catch (error) {
            console.error(error)
        }
    }

    // 创建
    const handleFormSubmit = async (values) => {

        if (type === 'create') {
            handleCreateRule(values)
        }

        if (type === 'update') {
            handleUpdateRule(values)
        }

        // 关闭弹窗
        onClose()
    }

    // 获取数据源
    const handleGetDatasourceData = async (data) => {
        setSelectedType(data)
    }

    // 获取通知对象
    const handleGetNoticeData = async () => {
        const res = await getNoticeList()
        const newData = res.data.map((item) => ({
            label: item.name,
            value: item.uuid
        }))
        // 将数据设置为选项对象数组
        setNoticeOptions(newData)
    }

    const handleGetJaegerService = async () => {
        const params = {
            id: selectedItems
        }
        const res = await getJaegerService(params)

        const newData = res.data.data.map((item) => ({
            label: item,
            value: item
        }))
        setJaegerServiceList(newData)
    }

    // 数据源单/多选标签
    const addLabel = () => {
        setNoticeLabels([...noticeLabels, { key: '', value: '', noticeId: '' }])
    }

    const updateLabel = (index, field, value) => {
        const updatedLabels = [...noticeLabels]
        updatedLabels[index][field] = value
        setNoticeLabels(updatedLabels)
    }

    const removeLabel = (index) => {
        const updatedLabels = [...noticeLabels]
        updatedLabels.splice(index, 1)
        setNoticeLabels(updatedLabels)
    }

    // 在onChange事件处理函数中更新选择的通知对象值
    const handleSelectChange = (value) => {
    }

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
            imgSrc: AwsImg,
            text: 'CloudWatch',
        },
        {
            imgSrc: VMImg,
            text: 'VictoriaMetrics',
        },
        {
            imgSrc: K8sImg,
            text: 'KubernetesEvent',
        }
    ];

    const disableSeverity = (s) => {
        return exprRule.some((rule) => {
            if (rule.severity) {
                return rule.severity === s;
            }
        });
    }

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

    const handleChange = (value) => {
        setWeek(value)
    };

    // 时间选择器的事件处理程序
    const handleStartTimeChange = (value) => {
        const time = new Date(value);
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        const seconds = (hours * 3600) + (minutes * 60);
        setStartTime(seconds);
    };

    const handleEndTimeChange = (value) => {
        const time = new Date(value);
        const hours = time.getHours().toString().padStart(2, '0');
        const minutes = time.getMinutes().toString().padStart(2, '0');
        const seconds = (hours * 3600) + (minutes * 60);
        setEndTime(seconds);
    };

    const [errors, setErrors] = useState([]);

    const validateExpr = (expr) => {
        const regex = /^(\s*(==|>=|<=|!=|>|<)\s*-?\d+(\.\d+)?\s*)$/;
        return regex.test(expr);
    };

    const handleExprChange = (index, value) => {
        const newErrors = [...errors];
        if (validateExpr(value) || value === '') {
            updateExprRule(index, 'expr', value);
            newErrors[index] = '';
        } else {
            newErrors[index] = '请输入有效的表达式，例如："> 80"';
        }
        setErrors(newErrors);
    };

    const secondsToMoment = (seconds) => {
        return moment.utc(seconds * 1000); // 将秒转换为毫秒，并使用 UTC 时间
    };

    const handleGetMetricTypes = async() =>{
        try{
            const res = await getMetricTypes()
            const ops = res.data.map((item) =>{
                return {
                    label: item,
                    value: item,
                }
            })
            setMetricTypeOptions(ops)
        } catch (error){
            console.error(error)
        }
    }

    const handleGetMetricNames = async(params) =>{
        try{
            const res = await getMetricNames(params)
            const ops = res.data.map((item) =>{
                return {
                    label: item,
                    value: item,
                }
            })
            setMetricNameOptions(ops)
        } catch (error){
            console.error(error)
        }
    }

    const handleGetStatistics = async() =>{
        try{
            const res = await getStatistics()
            const ops = res.data.map((item) =>{
                return {
                    label: item,
                    value: item,
                }
            })
            setStatisticOptions(ops)
        } catch (error){
            console.error(error)
        }
    }

    const handleGetDimensions = async(params) =>{
        try{
            const res = await getDimensions(params)
            const ops = res.data.map((item) =>{
                return {
                    label: item,
                    value: item,
                }
            })
            setDimensionOptions(ops)
        } catch (error){
            console.error(error)
        }
    }

    const handleGetRdsInstances = async(params) =>{
        try{
            const res = await getRdsInstances(params)
            const ops = res.data.map((item) =>{
                return {
                    label: item,
                    value: item,
                }
            })
            setEndpointOptions(ops)
        } catch (error){
            console.error(error)
        }
    }

    const handleGetRdsClusters = async(params) =>{
        try{
            const res = await getRdsClusters(params)
            if (res.data === null){
                setEndpointOptions([])
            }
            const ops = res.data.map((item) =>{
                return {
                    label: item,
                    value: item,
                }
            })
            setEndpointOptions(ops)
        } catch (error){
            console.error(error)
        }
    }

    const onChangeSeverity = (e) => {
        setSeverityValue(e.target.value)
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

    const handleSelectedDsItem = (ids,info) =>{
        setSelectedItems(ids)
        setSelectDatasourceURL(info[0].url)
    }

    const [dataSource, setDataSource] = useState([]);

    const handleQueryMetrics = async () =>{
        let t = getSelectedTypeName(selectedType)
        const params={
            datasourceType: t,
            url: selectDatasourceURL,
            query: promQL
        }
         const res = await queryPromMetrics(params)
         if (res.code === 200 && res.data && res.data.data && res.data.data.result) {
             const formattedData = res.data.data.result.map(item => ({
                metric: item.metric,
                value: item.value
             }));
             setDataSource(formattedData);
             setQueryModel(1)
        }
    }

    return (
        <Modal
            visible={visible}
            onCancel={onClose}
            footer={null}
            styles={{ body: { overflowY: 'auto', maxHeight: '600px' } }} // 设置最大高度并支持滚动 
            width={820} // 设置Modal窗口宽度
        >
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>

                <div>
                    <strong style={{ fontSize: '20px' }}>基础配置</strong>
                    <div style={{ display: 'flex' }}>
                        <MyFormItem
                            name="ruleName"
                            label="规则名称"
                            style={{
                                marginRight: '10px',
                                width: '500px',
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Input
                                value={spaceValue}
                                onChange={handleInputChange}
                                onKeyPress={handleKeyPress}
                                disabled={type === 'update'} />
                        </MyFormItem>

                        <MyFormItem
                            name="labels"
                            label="附加标签"
                            style={{
                                width: '500px',
                            }}
                        >
                            <Input value={inputLabelsValue} onChange={handleInputLabelsChange}/>
                        </MyFormItem>
                    </div>

                    <MyFormItem name="description" label="描述">
                        <Input />
                    </MyFormItem>
                </div>

                <Divider />

                <div>
                    <strong style={{fontSize: '20px'}}>规则配置</strong>

                    <div style={{display: 'flex'}}>
                        <div>
                            <p>数据源类型</p>
                            <div style={{display: 'flex', gap: '10px'}}>
                                {cards.map((card, index) => (
                                    <Card
                                        key={index}
                                        style={{
                                            height: 100,
                                            width: 120,
                                            position: 'relative',
                                            cursor: type === 'update' ? 'not-allowed' : 'pointer',
                                            border: selectedCard === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                            pointerEvents: type === 'update' ? 'none' : 'auto',
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

                    <div style={{marginTop: '15px'}}>
                        <MyFormItem
                            name="datasourceId"
                            label="关联数据源"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="选择数据源"
                                value={selectedItems}
                                onChange={handleSelectedDsItem}
                                style={{
                                    width: '100%',
                                }}
                                tokenSeparators={[',']}
                                options={datasourceOptions}
                            />
                        </MyFormItem>
                    </div>

                    {(selectedType === 0 || selectedType === 5) &&
                        <>
                            <span>规则配置</span>
                            <div className="rule-config-container">
                                <MyFormItemGroup prefix={['prometheusConfig']}>
                                    <MyFormItem name="promQL" label="PromQL" rules={[{required: true}]}>
                                        <PrometheusPromQL
                                            addr={selectDatasourceURL}
                                            value={handleGetPromQL}
                                            setPromQL={setPromQL}
                                        />
                                    </MyFormItem>

                                    <MyFormItem name="" label="* 表达式" rules={[{required: !exprRule}]}>
                                        {exprRule.map((label, index) => (
                                            <div className="rule-item" key={index}>
                                                <div className="rule-content">
                                                    <MyFormItem
                                                        name={['rules', index, 'severity']}
                                                        rules={[{required: true, message: '请选择告警等级'}]}
                                                    >
                                                        <Select
                                                            showSearch
                                                            value={label.severity}
                                                            onChange={(e) => updateExprRule(index, 'severity', e)}
                                                            style={{width: '147px'}}
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
                                                    >
                                                        <Input
                                                            placeholder='> 80'
                                                            value={label.expr}
                                                            onChange={(e) => handleExprChange(index, e.target.value)}
                                                            style={{width: '532px', marginLeft: '10px'}}
                                                        />
                                                    </MyFormItem>

                                                    <Button onClick={() => removeExprRule(index)}
                                                            style={{marginLeft: '10px'}}
                                                            disabled={index === 0}>
                                                        -
                                                    </Button>
                                                </div>
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
                                        <Button type="link" onClick={handleQueryMetrics}>数据预览</Button>
                                        <Button type="link" onClick={addExprRule} disabled={exprRule.length === 3}>
                                            + 添加规则条件
                                        </Button>
                                    </div>
                                </MyFormItemGroup>

                                {queryModel === 1 && (
                                    <div className="scroll-container">
                                        <List
                                            size="small"
                                            dataSource={dataSource}
                                            // renderItem={(item) => <List.Item>{item}</List.Item>}
                                            renderItem={(item) => {
                                                const metricName = item.metric["__name__"];
                                                const metricDetails = Object.keys(item.metric)
                                                    .filter(key => key !== "__name__")
                                                    .map(key => `${key}:${item.metric[key]}`)
                                                    .join(", ");
                                                return (
                                                    <List.Item>
                                                        <div className="list-item-content">
                                                            {`${metricName}{${metricDetails}}`}
                                                            <div className="value">{`${item.value[1]}`}</div>
                                                        </div>
                                                    </List.Item>
                                                );
                                            }}
                                        />
                                    </div>
                                )}

                            </div>
                        </>
                    }

                    {selectedType === 2 &&
                        <MyFormItemGroup prefix={['alicloudSLSConfig']}>

                            <div style={{display: 'flex'}}>
                                <MyFormItem
                                    name="project"
                                    label="Project"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                    style={{
                                        marginRight: '10px',
                                        width: '500px',
                                    }}>
                                    <Input/>
                                </MyFormItem>
                                <MyFormItem
                                    name="logstore"
                                    label="Logstore"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                    style={{
                                        width: '500px',
                                    }}>
                                    <Input/>
                                </MyFormItem>
                            </div>

                            <MyFormItem
                                name="logQL"
                                label="LogQL"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}>
                                <Input/>
                            </MyFormItem>

                            <div style={{display: 'flex'}}>
                                <MyFormItem
                                    name="logScope"
                                    label="查询区间"
                                    style={{
                                        width: '500px',
                                    }}
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
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
                                <MyFormItem name='service' label="应用服务"
                                            style={{
                                                marginRight: '10px',
                                                width: '500px',
                                            }}
                                            rules={[
                                                {
                                                    required: true,
                                                },
                                            ]}
                                >
                                    <Select
                                        allowClear
                                        showSearch
                                        placeholder="选择需查询链路的服务"
                                        style={{
                                            flex: 1,
                                        }}
                                        options={jaegerServiceList}
                                        onClick={handleGetJaegerService}
                                    />
                                </MyFormItem>

                                <MyFormItem name='tags' label="判断条件"
                                            style={{
                                                width: '500px',
                                            }}
                                            rules={[
                                                {
                                                    required: true,
                                                },
                                            ]}
                                >
                                    <Select showSearch style={{width: '100%'}} placeholder="StatusCode = 5xx">
                                        <Option
                                            value='%7B"http.status_code"%3A"5.%2A%3F"%7D'>{'StatusCode = 5xx'}</Option>
                                    </Select>
                                </MyFormItem>
                            </div>

                            <MyFormItem
                                name="scope"
                                label="查询区间"
                                style={{
                                    width: '380px',
                                }}
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
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
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}>
                                <Input/>
                            </MyFormItem>

                            <div style={{display: 'flex'}}>
                                <MyFormItem
                                    name="logScope"
                                    label="查询区间"
                                    style={{
                                        width: '500px',
                                    }}
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
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

                    {selectedType === 4 &&
                        <MyFormItemGroup prefix={['cloudwatchConfig']}>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <MyFormItem
                                    name="namespace"
                                    label="指标类型"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                    style={{
                                        width: '24%',
                                    }}>
                                    <Select
                                        showSearch
                                        placeholder="请选择指标类型"
                                        options={metricTypeOptions}
                                        onChange={setSelectMetricType}
                                    />
                                </MyFormItem>

                                <MyFormItem
                                    name="metricName"
                                    label="指标名称"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                    style={{
                                        width: '24%',
                                    }}>
                                    <Select
                                        showSearch
                                        placeholder="请选择指标名称"
                                        options={metricNameOptions}
                                    />
                                </MyFormItem>

                                <MyFormItem
                                    name="statistic"
                                    label="统计类型"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                    style={{
                                        width: '24%',
                                    }}>
                                    <Select
                                        placeholder="请选择统计类型"
                                        options={statisticOptions}
                                    />
                                </MyFormItem>

                                <MyFormItem
                                    name="threshold"
                                    label="表达式"
                                    style={{
                                        width: '24%',
                                    }}
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}>
                                    <InputNumber  placeholder="输入阈值, 如 80" addonBefore={
                                        <Select onChange={setCwExpr} placeholder=">" value={cwExpr?cwExpr:'>'}>
                                            <Option value=">">{'>'}</Option>
                                            <Option value=">=">{'>='}</Option>
                                            <Option value="<">{'<'}</Option>
                                            <Option value="==">{'=='}</Option>
                                            <Option value="!=">{'!='}</Option>
                                        </Select>
                                    }/>
                                </MyFormItem>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <MyFormItem
                                    name="dimension"
                                    label="端点类型"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                    style={{
                                        width: '50%',
                                    }}>
                                    <Select
                                        showSearch
                                        placeholder="请选择端点类型"
                                        options={dimensionOptions}
                                        onChange={setSelectDimension}
                                    />
                                </MyFormItem>
                                <MyFormItem
                                    name="endpoints"
                                    label="目标"
                                    rules={[
                                        {
                                            required: true,
                                        },
                                    ]}
                                    style={{
                                        width: '50%',
                                    }}>
                                    <Select
                                        showSearch
                                        mode="multiple"
                                        placeholder="请选择目标"
                                        options={endpointOptions}
                                        tokenSeparators={[',']}
                                    />
                                </MyFormItem>
                            </div>
                            <MyFormItem
                                name="period"
                                label="查询区间"
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}
                                style={{
                                    width: '50%',
                                }}
                            >
                                <InputNumber
                                    style={{ width: '97%' }}
                                    addonAfter={<span>分</span>}
                                    placeholder="10"
                                    min={1}
                                />
                            </MyFormItem>
                        </MyFormItemGroup>
                    }

                    {selectedType !==0 &&
                        <MyFormItem
                            name="severity" label="告警等级"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                            <Radio.Group onChange={onChangeSeverity} value={severityValue}>
                                <Radio value={'P0'}>P0级告警</Radio>
                                <Radio value={'P1'}>P1级告警</Radio>
                                <Radio value={'P2'}>P2级告警</Radio>
                            </Radio.Group>
                        </MyFormItem>
                    }

                    <div style={{display: 'flex', marginTop: '20px'}}>
                        <MyFormItem
                            name="evalInterval"
                            label="执行频率"
                            style={{
                                width: '100vh',
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <InputNumber
                                style={{width: '772px'}}
                                addonAfter={<span>秒</span>}
                                placeholder="10"
                                min={1}
                            />
                        </MyFormItem>

                    </div>

                    <MyFormItem
                        name="effectiveTime"
                        label="生效时间"
                        style={{
                            width: '772px',
                        }}
                    >
                        <div style={{display: 'flex', gap: '10px'}}>
                            <Select
                                mode="multiple"
                                allowClear
                                style={{
                                    width: '100%',
                                }}
                                placeholder="请选择规则生效时间"
                                value={week}
                                onChange={handleChange}
                                options={weekOptions}
                            />
                            <TimePicker
                                placeholder={"开始"}
                                format={format}
                                onChange={handleStartTimeChange}
                                value={secondsToMoment(startTime)}/>
                            <TimePicker
                                placeholder={"结束"}
                                format={format}
                                onChange={handleEndTimeChange}
                                value={secondsToMoment(endTime)}/>
                        </div>
                    </MyFormItem>

                </div>

                <Divider/>

                <div>
                    <strong style={{fontSize: '20px'}}>通知配置</strong>

                    <div style={{display: 'flex'}}>
                        <MyFormItem
                            name="noticeId"
                            label="通知对象"
                            tooltip="默认通知对象"
                            style={{
                                marginRight: '10px',
                                width: '500px',
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <Select
                                style={{
                                    width: 370,
                                }}
                                allowClear
                                placeholder="选择通知对象"
                                options={noticeOptions}
                                onChange={handleSelectChange} // 使用onChange事件处理函数来捕获选择的值
                            />
                        </MyFormItem>

                        <MyFormItem
                            name="repeatNoticeInterval"
                            label="重复通知"
                            style={{
                                width: '500px',
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <InputNumber
                                style={{width: '100%'}}
                                addonAfter={<span>分钟</span>}
                                placeholder="60"
                                min={1}
                            />
                        </MyFormItem>
                    </div>

                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <div style={{marginRight: '10px'}}>
                            启用恢复通知
                        </div>
                        <MyFormItem
                            style={{marginBottom: '0'}}
                            name="recoverNotify"
                            valuePropName="checked"
                        >
                            <Switch
                                value={recoverNotify}
                                checked={recoverNotify}
                                onChange={(e) => {setRecoverNotify(e)}}
                            />
                        </MyFormItem>
                    </div>

                    <div style={{display: 'flex', marginTop:'10px',alignItems: 'center'}}>
                        <MyFormItem style={{marginBottom: '0', marginRight: '10px'}}>
                            <span>分组通知</span>
                            <Tooltip title="根据 Metric 标签进行分组通知">
                                <QuestionCircleOutlined style={{color: '#1890ff', marginLeft: '4px'}}/>
                            </Tooltip>
                        </MyFormItem>
                        <Button onClick={addLabel} style={{marginTop: '0'}}>
                            +
                        </Button>
                    </div>
                </div>

                <MyFormItemGroup prefix={['noticeGroup']}>
                    {noticeLabels.length >= 1 ? (<div style={{display: 'flex',}}>
                        <label style={{marginRight: '210px'}}>* Key</label>
                        <label style={{marginRight: '200px'}}>* Value</label>
                        <label style={{marginRight: '180px'}}>* 通知对象</label>
                        <label>操作</label>
                    </div>) : null}
                    {noticeLabels.map((label, index) => (
                        <div style={{display: 'flex', alignItems: 'center', marginTop: '10px'}}>
                            <Input
                                name={`[${index}].key`}
                                placeholder="Key"
                                style={{
                                    marginRight: '10px',
                                    width: 'calc((100% / 3) - 20px)',
                                    height: '32px'
                                }} // 减去marginRight和padding
                                value={label.key}
                                onChange={(e) => updateLabel(index, 'key', e.target.value)}
                            />

                            <Input
                                name={`[${index}].value`}
                                placeholder="Value"
                                style={{
                                    marginRight: '10px',
                                    width: 'calc((100% / 3) - 20px)',
                                    height: '32px'
                                }} // 减去marginRight和padding
                                value={label.value}
                                onChange={(e) => updateLabel(index, 'value', e.target.value)}
                            />

                            <Select
                                name={`[${index}].noticeId`}
                                placeholder="选择通知对象"
                                style={{ width: 'calc((100% / 3) - 20px)', height: '32px' }} // 减去marginRight和padding
                                allowClear
                                options={noticeOptions}
                                value={label.noticeId ? [label.noticeId] : undefined}
                                onChange={(e) => updateLabel(index, 'noticeId', e)}
                            />

                            <Button onClick={() => removeLabel(index)} style={{ marginLeft: '10px' }}>
                                -
                            </Button>
                        </div>
                    ))}
                </MyFormItemGroup>

                <div style={{ marginTop: '10px' }}>
                    <MyFormItem
                        name="enabled"
                        label="状态"
                        tooltip="启用/禁用"
                        valuePropName="checked"
                    >
                        <Switch value={enabled} checked={enabled} onChange={(e)=>{setEnabled(e)}} />
                    </MyFormItem>
                </div>

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
            </Form >
        </Modal >
    )
}