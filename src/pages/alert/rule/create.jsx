import {
    List,
    Form,
    Input,
    Button,
    Switch,
    Radio,
    Divider,
    Select,
    Tooltip,
    InputNumber,
    Card,
    TimePicker,
    Typography, Tabs, Modal, Empty, Spin, Descriptions
} from 'antd'
import React, { useState, useEffect } from 'react'
import { RedoOutlined } from '@ant-design/icons'
import {createRule, searchRuleInfo, updateRule} from '../../../api/rule'
import {ElasticSearchData, getDatasource, searchDatasource} from '../../../api/datasource'
import {getJaegerService, queryPromMetrics} from '../../../api/other'
import {useParams} from 'react-router-dom'
import dayjs from 'dayjs';
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
import ESImg from "./img/ElasticSearch.svg"
import {PrometheusPromQL} from "../../promethues";
import {getKubernetesReasonList, getKubernetesResourceList} from "../../../api/kubernetes";
import { useRule } from '../../../context/RuleContext';
import TextArea from "antd/es/input/TextArea";
import {FaultCenterList} from "../../../api/faultCenter";
import VSCodeEditor from "../../../utils/VSCodeEditor";
import JsonToTable from "../../../utils/JsonTable";
import JsonTable from "../../../utils/JsonTable";
import MarkdownRenderer from "../../../utils/MarkdownRenderer";

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

export const AlertRule = ({ type }) => {
    const { ruleTemplate } = useRule();
    const [form] = Form.useForm()
    const { id,ruleId } = useParams()
    const [selectedRow,setSelectedRow] = useState({})
    const [enabled, setEnabled] = useState(true) // 设置初始状态为 true
    const [selectedType, setSelectedType] = useState(0) // 数据源类型
    const [datasourceOptions, setDatasourceOptions] = useState([])  // 数据源列表
    const [selectedItems, setSelectedItems] = useState([])  //选择数据源
    // 禁止输入空格
    const [spaceValue, setSpaceValue] = useState('')
    // 告警等级
    const [severityValue, setSeverityValue] = useState(1)
    const [jaegerServiceList, setJaegerServiceList] = useState([])
    const [selectedCard, setSelectedCard] = useState(0);
    const [exprRule, setExprRule] = useState([{}])
    // 初始化时间数据的状态
    const [week,setWeek] = useState(null)
    const [startTime, setStartTime] = useState(0);
    const [endTime, setEndTime] = useState(86340);
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
    const [promQL,setPromQL] = useState()
    const [openMetricQueryModel, setOpenMetricQueryModel] = useState(false)
    const [openMetricQueryModelLoading, setOpenMetricQueryModelLoading] = useState(false)
    const [loading, setLoading] = useState(true);
    const [kubeResourceTypeOptions,setKubeResourceTypeOptions]=useState([])
    const [selectedKubeResource,setSelectedKubeResource]=useState('')
    const [kubeReasonListOptions,setKubeReasonListOptions]=useState({})
    const [filterTags,setFilterTags] = useState([])
    const [esfilter, setEsfilter] = useState([{}])
    const [faultCenters, setFaultCenters] = useState([])
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(null)
    const [evalTimeType,setEvalTimeType] = useState('second')
    const [esFilterType,setEsFilterType] = useState('RawJson')
    const [esRawJson, setEsRawJson] = useState('')
    const [filterCondition,setFilterCondition] = useState('') // 匹配关系
    const [queryWildcard,setQueryWildcard] = useState(0) // 匹配模式
    const [openJsonToTable,setOpenJsonToTable] = useState(false)
    const [jsonToTableData,setJsonToTableData] = useState([])

    useEffect(() => {
        if (ruleTemplate) {
            // 使用模板数据初始化表单
            form.setFieldsValue(ruleTemplate);
            setPromQL(ruleTemplate.prometheusConfig.promQL);
            setExprRule(ruleTemplate.prometheusConfig.rules);

            const datasourceTypeMap = {
                "Prometheus": 0,
                "Loki": 1,
                "AliCloudSLS": 2,
                "Jaeger": 3,
                "CloudWatch": 4,
                "VictoriaMetrics": 5,
                "KubernetesEvent": 6,
                "ElasticSearch": 7
            };

            const t = datasourceTypeMap[ruleTemplate.datasourceType] || 0;
            setSelectedType(t);
            setSelectedCard(t);
            type = 'tmpl'
        } else {
            const handleSearchRuleInfo = async ()=>{
                try {
                    const params = {
                        ruleGroupId: id,
                        ruleId: ruleId
                    };
                    const res = await searchRuleInfo(params);
                    setSelectedRow(res?.data); // 更新状态
                    initBasicInfo(res?.data)
                } catch (error) {
                    console.error('Error fetching rule info:', error);
                } finally {
                    setLoading(false); // 请求完成后设置 loading 状态
                }
            }

            if (type === "edit"){
                handleSearchRuleInfo()
            }
        }
    }, [])

    const initBasicInfo =(selectedRow)=>{
        form.setFieldsValue({
            annotations: selectedRow.annotations,
            datasourceId: selectedRow.datasourceId,
            datasourceType: selectedRow.datasourceType,
            description: selectedRow.description,
            enabled: selectedRow.enabled,
            evalInterval: selectedRow.evalInterval,
            forDuration: selectedRow.forDuration,
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
            logEvalCondition: selectedRow.logEvalCondition,
            faultCenterId: selectedRow.faultCenterId,
        })
        setPromQL(selectedRow.prometheusConfig.promQL)
        setSelectedItems(selectedRow.datasourceId)
        setWeek(selectedRow.effectiveTime.week)
        setStartTime(selectedRow.effectiveTime.startTime)
        setEndTime(selectedRow.effectiveTime.endTime)
        setEnabled(selectedRow.enabled)
        setSelectedFaultCenter(selectedRow.faultCenterId)
        setEvalTimeType(selectedRow.evalTimeType)
        setEsFilterType(selectedRow.elasticSearchConfig.queryType)
        setEsRawJson(selectedRow.elasticSearchConfig.rawJson)
        setFilterCondition(selectedRow.elasticSearchConfig.filterCondition)
        setQueryWildcard(selectedRow.elasticSearchConfig.queryWildcard)

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
        } else if (selectedRow.datasourceType === "ElasticSearch"){
            t = 7
        }

        setSelectedType(t)
        setSelectedCard(t)
        setExprRule(selectedRow.prometheusConfig.rules)
        setSelectedKubeResource(selectedRow.kubernetesConfig.resource)
        setFilterTags(selectedRow.kubernetesConfig.filter)
        setEsfilter(selectedRow.elasticSearchConfig.filter)

        // handleGetDatasourceInfo(selectedRow.datasourceId)
    }

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
        handleGetMetricTypes()
        handleGetStatistics()
        handleGetKubernetesEventTypes()
        handleGetFaultCenterList()
    }, [])

    useEffect(() => {
        const params = {
            metricType: selectMetricType
        }
        handleGetMetricNames(params)
        handleGetDimensions(params)
    }, [selectMetricType]);

    useEffect(() => {
        handleGetKubeReasonList(selectedKubeResource)
    }, [selectedKubeResource]);

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

    // const handleGetDatasourceInfo = async (id ) =>{
    //     const params = {
    //         id: id,
    //     }
    //     const res = await getDatasource(params)
    //     setSelectDatasourceIds([
    //         ...selectDatasourceIds,
    //         res?.data?.id
    //     ])
    // }

    const handleCreateRule = async (values) => {
        try {
            let t = getSelectedTypeName(selectedType)

            const params = {
                ...values,
                datasourceType: t,
                ruleGroupId: id,
                evalTimeType: evalTimeType,
                faultCenterId: selectedFaultCenter,
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
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdateRule = async (values) => {
        try {
            let t = getSelectedTypeName(selectedType);

            const params = {
                ...values,
                datasourceType: t,
                tenantId: selectedRow.tenantId,
                ruleId: selectedRow.ruleId,
                ruleGroupId: id,
                evalTimeType: evalTimeType,
                faultCenterId: selectedFaultCenter,
                enabled: enabled
            }

            if (selectedType === 4) {
                let letCwExpr = cwExpr
                if (letCwExpr === '') {
                    letCwExpr = ">"
                }
                params.cloudwatchConfig.expr = letCwExpr
            }

            await updateRule(params)
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
        } else if (selectedType === 7){
            t = "ElasticSearch"
        }

        return t
    }

    const handleGetDatasourceList = async (selectedType) => {
        try {
            let t = getSelectedTypeName(selectedType)

            let dsType = t
            if (t === "KubernetesEvent"){
                dsType = "Kubernetes"
            }

            const params = {
                type: dsType
            }
            const res = await searchDatasource(params)
            const newData = res.data?.map((item) => ({
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

    const handleGetFaultCenterList = async () => {
        try {
            const res = await FaultCenterList()
            const newData = res.data?.map((item) => ({
                label: item.name,
                value: item.id,
            }))

            setFaultCenters(newData)
        } catch (error) {
            console.error(error)
        }
    }

    // 创建
    const handleFormSubmit = async (values) => {
        const newEsConfig = {
            index: values?.elasticSearchConfig?.index,
            scope: values?.elasticSearchConfig?.scope,
            queryType: esFilterType,
            rawJson: esRawJson,
            filter: esfilter,
            queryWildcard: queryWildcard,
            filterCondition: filterCondition,
        }

        const newValues= {
            ...values,
            elasticSearchConfig: newEsConfig,
            effectiveTime: {
                week: week,
                startTime: startTime,
                endTime: endTime,
            },
        }
        if (type === 'add') {
            handleCreateRule(newValues)
        }
        if (type === 'edit') {
            handleUpdateRule(newValues)
        }

        window.history.back()
    }

    const handleGetJaegerService = async () => {
        const params = {
            id: selectedItems
        }
        const res = await getJaegerService(params)

        const newData = res.data.data?.map((item) => ({
            label: item,
            value: item
        }))
        setJaegerServiceList(newData)
    }

    const handleInputChange = (e) => {
        // 移除输入值中的空格
        const newValue = e.target.value.replace(/\s/g, '')
        setSpaceValue(newValue)
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
        },
        {
            imgSrc: ESImg,
            text: 'ElasticSearch',
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

    // 将秒数转换为 ISO 格式的 Date 对象
    const secondsToDateObj = (seconds) => {
        // 以当前日期为基础
        const date = dayjs();

        // 计算小时和分钟
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        // 设置 dayjs 对象的小时和分钟
        return date.set('hour', hours).set('minute', minutes).set('second', 0); // 秒数设为 0
    };

    const [errors, setErrors] = useState([]);

    const validateExpr = (expr) => {
        const regex = /^(\s*(==|>=|<=|!=|>|<)\s*-?\d+(\.\d+)?\s*)$/;
        return regex.test(expr);
    };

    const handleExprChange = (index, value) => {
        const trimmedValue = value.trim(); // 去除输入值两端的空格
        const newErrors = [...errors];

        if (trimmedValue !== value) {
            // 输入值中含有空格时，提示错误信息
            newErrors[index] = '输入值的开头不允许有空格';
        } else if (validateExpr(trimmedValue) || trimmedValue === '') {
            updateExprRule(index, 'expr', trimmedValue);
            newErrors[index] = '';
        } else {
            newErrors[index] = '请输入有效的表达式，例如：>80';
        }

        setErrors(newErrors);
    };

    const handleGetMetricTypes = async() =>{
        try{
            const res = await getMetricTypes()
            const ops = res.data?.map((item) =>{
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
            const ops = res.data?.map((item) =>{
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
            const ops = res.data?.map((item) =>{
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
            const ops = res.data?.map((item) =>{
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
            const ops = res.data?.map((item) =>{
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
            const ops = res.data?.map((item) =>{
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
        setSeverityValue(e.target?.value)
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

    const handleSelectedDsItem = (ids) =>{
        setSelectedItems(ids)
    }

    const [dataSource, setDataSource] = useState([]);

    const handleQueryMetrics = async () => {
        try {
            setOpenMetricQueryModel(true)
            // 编码 PromQL 查询
            const encodedPromQL = encodeURIComponent(promQL);

            // 构造请求参数
            const params = {
                datasourceIds: selectedItems.join(","),
                query: encodedPromQL,
            };

            // 发起请求
            setDataSource("")
            setOpenMetricQueryModelLoading(true)
            const res = await queryPromMetrics(params);

            setOpenMetricQueryModelLoading(false)
            // 检查响应是否有效
            if (res.code !== 200 || !res.data) {
                console.error("Invalid response format or empty data");
                return;
            }

            // 提取所有 result 数据
            const allResults = res.data
                .filter(item => item.status === "success" && item.data?.result?.length > 0) // 过滤有效数据
                .flatMap(item => item.data.result); // 将多个 result 数组合并为一个

            // 如果没有有效数据，直接返回
            if (allResults.length === 0) {
                console.warn("No valid results found");
                return;
            }

            // 格式化数据
            const formattedData = allResults.map(item => ({
                metric: item.metric,
                value: item.value,
            }));

            // 更新状态
            setDataSource(formattedData);
        } catch (error) {
            console.error("Failed to query metrics:", error);
        }
    };

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

    const handleQueryWildcardChange = async (e) => {
        setQueryWildcard(e.target.value)
    };

    const handleKeyPress = (e) => {
        if (!/[0-9+\-*/><=\s]/.test(e.key)) {
            e.preventDefault(); // 阻止非法字符输入
        }
    };

    // Base64 编码工具函数
    const encodeBase64 = (str) => {
        try {
            return btoa(unescape(encodeURIComponent(str))); // 支持中文
        } catch (error) {
            console.error('Base64 编码失败:', error);
            throw new Error('Base64 编码失败');
        }
    };

    const handleEsSearchData = async() =>{
        const params = {
            datasourceId: selectedItems[0],
            index: form.getFieldValue(['elasticSearchConfig', 'index']),
            query: encodeBase64(esRawJson)
        }
        const res = await ElasticSearchData(params)
        setOpenJsonToTable(true)
        setJsonToTableData(JSON.parse(res.data))
    }

    const cancelEsSearchModel = () =>{
        setOpenJsonToTable(false)
    }

    const handleCloseMetricModel = () =>{
        setOpenMetricQueryModel(false)
    }

    if (loading && type === "edit") {
        return <div>Loading...</div>;
    }

    return (
        <div style={{
            textAlign: 'left',
            width: '100%',
            // flex: 1,
            alignItems: 'flex-start',
            marginTop: '-20px',
            maxHeight: 'calc((-145px + 100vh) - 65px - 40px)',
            overflowY: 'auto',
        }}>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <div>
                    <strong style={{fontSize: '20px'}}>基础配置</strong>
                    <div style={{display: 'flex'}}>
                        <MyFormItem
                            name="ruleName"
                            label="规则名称"
                            rules={[{ required: true }]}
                            style={{width: '100%'}}
                        >
                            <Input
                                value={spaceValue}
                                onChange={handleInputChange}
                                disabled={type === 'update'}/>
                        </MyFormItem>
                    </div>
                    <MyFormItem
                        name="description"
                        label="描述"
                        style={{width: '100%'}}
                    >
                        <Input/>
                    </MyFormItem>
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
                                            cursor: (type !== 'add') ? 'not-allowed' : 'pointer',
                                            border: selectedCard === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                            pointerEvents: (type !== 'add') ? 'none' : 'auto',
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
                            rules={[{required: true,}]}
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
                                            // addr={selectDatasourceURL}
                                            value={handleGetPromQL}
                                            setPromQL={setPromQL}
                                        />
                                    </MyFormItem>

                                    <MyFormItem name="" label="表达式" rules={[{required: !exprRule}]}>
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
                                                min={0}
                                            />
                                        </MyFormItem>
                                    </div>

                                    <div>
                                        <MyFormItem
                                            name="annotations"
                                            label="告警详情"
                                            tooltip="获取 Label 变量, 示例: ${job}, ${instance}。凡是 Target 中的变量均可通过`${}`获取。"
                                            rules={[{required: true}]}
                                        >
                                            <TextArea rows={2}
                                                      placeholder="输入告警事件的详细消息内容，如：服务器: ${instanace}，发生故障请紧急排查!"
                                                      maxLength={10000}/>
                                        </MyFormItem>
                                    </div>

                                    <div className="action-buttons">
                                        <Button type="link" onClick={handleQueryMetrics}>数据预览</Button>
                                        <Button type="link" onClick={addExprRule} disabled={exprRule?.length === 3}>
                                            + 添加规则条件
                                        </Button>
                                    </div>
                                </MyFormItemGroup>

                                <Modal
                                    centered
                                    open={openMetricQueryModel}
                                    onCancel={handleCloseMetricModel}
                                    width={1000}
                                    footer={null} // 不显示底部按钮
                                    styles={{
                                        body: {
                                            height: '500px', // 固定高度
                                            overflowY: 'auto', // 支持垂直滚动
                                            padding: '20px',
                                            backgroundColor: '#f9f9f9', // 灰色背景
                                            borderRadius: '8px', // 圆角
                                        },
                                    }}
                                >
                                    { openMetricQueryModelLoading && (
                                        <div style={{alignItems: 'center', marginTop: '100px'}}>
                                            <Spin tip="数据查询中..." >
                                                <br/>
                                            </Spin>
                                        </div>
                                    )}

                                    {dataSource.length > 0 && (
                                        <div className="scroll-container">
                                            <List
                                                size="small"
                                                dataSource={dataSource}
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

                                    {
                                        // 数据查询完成但无数据
                                         !openMetricQueryModelLoading && dataSource.length === 0 && (
                                            <div className="empty-container">
                                                <Empty description="暂无数据" />
                                            </div>
                                        )
                                    }
                                < /Modal>
                            </div>
                        </>
                    }

                    {selectedType === 2 &&
                        <MyFormItemGroup prefix={['alicloudSLSConfig']}>
                            <span>规则配置</span>
                            <div className="log-rule-config-container">
                                <div style={{display: 'flex'}}>
                                    <MyFormItem
                                        name="project"
                                        label="Project"
                                        rules={[{required: true}]}
                                        style={{
                                            marginRight: '10px',
                                            width: '500px',
                                        }}>
                                        <Input/>
                                    </MyFormItem>
                                    <MyFormItem
                                        name="logstore"
                                        label="Logstore"
                                        rules={[{required: true}]}
                                        style={{
                                            width: '500px',
                                        }}>
                                        <Input/>
                                    </MyFormItem>
                                </div>

                                <MyFormItem
                                    name="logQL"
                                    label="LogQL"
                                    rules={[{required: true}]}
                                >
                                    <Input/>
                                </MyFormItem>

                                <MyFormItem
                                    name="logScope"
                                    label="查询区间"
                                    rules={[{required: true,}]}
                                >
                                    <InputNumber
                                        style={{
                                            width: '100%',
                                        }}
                                        addonAfter={'分钟'}
                                        placeholder="10"
                                        min={1}
                                    />
                                </MyFormItem>
                            </div>
                        </MyFormItemGroup>
                    }

                    {selectedType === 3 &&
                        <MyFormItemGroup prefix={['jaegerConfig']}>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <MyFormItem
                                    name='service'
                                    label="应用服务"
                                    style={{
                                        width: '50%',
                                    }}
                                    rules={[{required: true}]}
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

                                <MyFormItem
                                    name='tags'
                                    label="判断条件"
                                    style={{
                                        width: '50%',
                                    }}
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
                                rules={[{ required: true }]}
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    addonAfter={'分钟'}
                                    placeholder="10"
                                    min={1}
                                />
                            </MyFormItem>

                        </MyFormItemGroup>
                    }

                    {selectedType === 1 &&
                        <MyFormItemGroup prefix={['lokiConfig']}>
                            <span>规则配置</span>
                            <div className="log-rule-config-container">
                                <MyFormItem
                                    name="logQL"
                                    label="LogQL"
                                    rules={[{required: true}]}
                                >
                                    <Input/>
                                </MyFormItem>
                                <MyFormItem
                                    name="logScope"
                                    label="查询区间"
                                    rules={[{required: true}]}
                                >
                                    <InputNumber
                                        style={{width: '100%'}}
                                        addonAfter={'分钟'}
                                        placeholder="10"
                                        min={1}
                                    />
                                </MyFormItem>
                            </div>
                        </MyFormItemGroup>
                    }

                    {selectedType === 4 &&
                        <MyFormItemGroup prefix={['cloudwatchConfig']}>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <MyFormItem
                                    name="namespace"
                                    label="指标类型"
                                    rules={[{required: true,}]}
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
                                    <InputNumber placeholder="输入阈值, 如 80" addonBefore={
                                        <Select onChange={setCwExpr} placeholder=">" value={cwExpr ? cwExpr : '>'}>
                                            <Option value=">">{'>'}</Option>
                                            <Option value=">=">{'>='}</Option>
                                            <Option value="<">{'<'}</Option>
                                            <Option value="==">{'=='}</Option>
                                            <Option value="!=">{'!='}</Option>
                                        </Select>
                                    }/>
                                </MyFormItem>
                            </div>
                            <div style={{display: 'flex', gap: '10px'}}>
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
                                rules={[{required: true}]}
                            >
                                <InputNumber
                                    style={{width: '100%'}}
                                    addonAfter={<span>分钟</span>}
                                    placeholder="10"
                                    min={1}
                                />
                            </MyFormItem>
                        </MyFormItemGroup>
                    }

                    {selectedType === 6 &&
                        <MyFormItemGroup prefix={['kubernetesConfig']}>
                            <span>规则配置</span>
                            <div className="log-rule-config-container">
                                <div style={{display: 'flex', gap: '10px'}}>
                                    <MyFormItem
                                        name="resource"
                                        label="资源类型"
                                        rules={[{required: true}]}
                                        style={{
                                            width: '50%',
                                        }}>
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
                                            placeholder="请选择事件类型"
                                            options={kubeReasonListOptions}
                                        />
                                    </MyFormItem>

                                    <MyFormItem
                                        name="value"
                                        label="表达式"
                                        style={{
                                            width: '45%',
                                        }}
                                        rules={[
                                            {
                                                required: true,
                                            },
                                        ]}>
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
                                        style={{
                                            width: '100%',
                                        }}>
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
                                    rules={[{required: true}]}
                                >
                                    <InputNumber
                                        style={{width: '100%'}}
                                        addonAfter={<span>分钟</span>}
                                        placeholder="10"
                                        min={1}
                                    />
                                </MyFormItem>
                            </div>
                        </MyFormItemGroup>
                    }

                    {selectedType === 7 &&
                        <MyFormItemGroup prefix={['elasticSearchConfig']}>
                            <div style={{display: 'flex', gap: '10px'}}>
                                <MyFormItem
                                    name="index"
                                    label="索引名称"
                                    tooltip="🔔：支持固定索引名称；支持按时间自动轮转，例如：索引名称为 test.YYYY-MM-dd，今日日期2025.02.23，那么索引名字会轮转为test.2025-02-23"
                                    rules={[{required: true,}]}
                                    style={{
                                        width: '50%',
                                    }}>
                                    <Input/>
                                </MyFormItem>

                                <MyFormItem
                                    name="scope"
                                    label="查询区间"
                                    rules={[{required: true}]}
                                    style={{
                                        width: '50%',
                                    }}
                                >
                                    <InputNumber
                                        style={{width: '100%'}}
                                        addonAfter={<span>分钟</span>}
                                        placeholder="10"
                                        min={1}
                                    />
                                </MyFormItem>
                            </div>

                            <span>规则配置</span>
                            <div className="log-rule-config-container">
                                <Tabs
                                    activeKey={esFilterType}
                                    onChange={setEsFilterType}
                                    items={[
                                        {
                                            label: '查询语句',
                                            key: 'RawJson',
                                        },
                                        {
                                            label: '字段匹配',
                                            key: 'Field',
                                        }
                                    ]}
                                />

                                {esFilterType === "Field" &&
                                    <>
                                        <MyFormItem
                                            name="filterCondition"
                                            label="匹配关系"
                                            rules={[{
                                                required: true,
                                            }]}>
                                            <Select
                                                placeholder="请选择匹配关系"
                                                style={{
                                                    flex: 1,
                                                }}
                                                value={filterCondition}
                                                onChange={setFilterCondition}
                                                options={[
                                                    {
                                                        label: 'And（表示"与"，所有子查询都必须匹配）',
                                                        value: 'And',
                                                    },
                                                    {
                                                        label: 'Or（表示"或"，至少有一个子查询需要匹配）',
                                                        value: 'Or'
                                                    },
                                                    {
                                                        label: 'Not（表示"非"，所有子查询都不能匹配）',
                                                        value: 'Not'
                                                    }
                                                ]}
                                            />
                                        </MyFormItem>

                                        <MyFormItem
                                            name="queryWildcard"
                                            label="匹配模式"
                                            rules={[{
                                                required: true,
                                            }]}>
                                            <Radio.Group
                                                block
                                                options={[
                                                    {
                                                        label: '模糊匹配',
                                                        value: 1,
                                                    },
                                                    {
                                                        label: '精准匹配',
                                                        value: 0,
                                                    },
                                                ]}
                                                defaultValue={false}
                                                value={1}
                                                onChange={handleQueryWildcardChange}
                                            />
                                        </MyFormItem>

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
                                                            style={{marginTop: '35px'}}
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
                                    </>
                                }
                                {esFilterType === "RawJson" && (
                                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                                        <MyFormItem
                                            rules={[{required: true}]}
                                            style={{width: '100%', height: '100%'}}
                                        >
                                            <VSCodeEditor onChange={setEsRawJson} value={esRawJson}/>
                                        </MyFormItem>
                                        <Button
                                            type="primary"
                                            style={{backgroundColor: '#000', borderColor: '#000', marginTop: '-25px'}}
                                            onClick={handleEsSearchData}
                                        >
                                            查询
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </MyFormItemGroup>
                    }

                    <Modal
                        visible={openJsonToTable}
                        onCancel={cancelEsSearchModel}
                        footer={null}
                        width={800}
                        bodyStyle={{
                            padding: '16px',
                            overflow: 'hidden',
                            maxHeight: '80vh',
                        }}
                    >
                        <div
                            style={{
                                overflow: 'auto',
                                maxHeight: 'calc(80vh - 32px)',
                                width: '100%',
                                scrollBehavior: 'smooth',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#888 transparent'
                            }}
                            onWheel={(e) => {
                                // 增强型滚轮处理
                                const container = e.currentTarget;
                                const isVerticalScroll = container.scrollHeight > container.clientHeight;
                                const delta = e.deltaMode === 0 ? e.deltaY * 0.5 : e.deltaY * 4;

                                if (!isVerticalScroll || e.shiftKey) {
                                    // 当垂直滚动不可用或按住shift时，转换为横向滚动
                                    container.scrollLeft += delta;
                                    e.preventDefault();
                                }
                            }}
                        >
                            <JsonTable
                                data={jsonToTableData}
                                style={{
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    minWidth: '100%',
                                    pointerEvents: 'auto',
                                    userSelect: 'none'  // 防止拖动选中干扰滚动
                                }}
                            />
                        </div>
                    </Modal>

                    {(selectedType === 1 || selectedType === 2 || selectedType === 7) && (
                        <MyFormItem
                            name="logEvalCondition"
                            label="表达式"
                            rules={[{ required: true, message: '请输入表达式' }]}
                            style={{ width: '100%' }}
                        >
                            <Input
                                addonBefore="当日志条数"
                                addonAfter="时触发告警"
                                placeholder="请输入有效的表达式，例如：> 2"
                                onKeyPress={handleKeyPress} // 监听按键事件
                                style={{ width: '100%' }}
                            />
                        </MyFormItem>
                    )}

                    {selectedType !== 0 &&
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
                                width: '100%',
                            }}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <InputNumber
                                style={{width: '100%'}}
                                addonAfter={
                                    <Select
                                        style={{width: '70px'}}
                                        value={evalTimeType}
                                        defaultValue={'second'}
                                        onChange={setEvalTimeType}
                                        options={[
                                            {
                                                label: '秒',
                                                value: 'second'
                                            },
                                            {
                                                label: '毫秒',
                                                value: 'millisecond'
                                            }
                                        ]}
                                    />
                                }
                                placeholder="10"
                                min={1}
                            />
                        </MyFormItem>

                    </div>

                    <MyFormItem
                        name="effectiveTime"
                        label="生效时间"
                        style={{
                            width: '100%',
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
                                value={secondsToDateObj(startTime)}/>
                            <TimePicker
                                placeholder={"结束"}
                                format={format}
                                onChange={handleEndTimeChange}
                                value={secondsToDateObj(endTime)}
                            />
                        </div>
                        <Typography.Text type="secondary" style={{marginTop: '5px', fontSize: '12px'}}>
                            {"> 默认情况下规则随时生效。如需指定生效时间，请选择具体的时间。"}
                        </Typography.Text>
                    </MyFormItem>
                </div>

                <Divider/>

                <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
                    <MyFormItem
                        name="faultCenterId"
                        label="事件推送给 WatchAlert 故障中心"
                        rules={[{required: selectedFaultCenter === null}]}
                        style={{marginBottom: 0, flex: 1}}
                    >
                        <div style={{display: 'flex', gap: 5, alignItems: 'center'}}>
                            {/* 选择器 */}
                            <Select
                                placeholder="选择故障中心"
                                style={{width: '90%'}}
                                options={faultCenters}
                                showSearch
                                optionFilterProp="label"
                                filterOption={(input, option) =>
                                    option.label.toLowerCase().includes(input.toLowerCase())
                                }
                                value={selectedFaultCenter}
                                onChange={setSelectedFaultCenter}
                            />

                            {/* 操作按钮组 */}
                            <div style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                                borderLeft: '1px solid #e8e8e8',
                                paddingLeft: 10,
                                height: 32
                            }}>
                                {/* 刷新按钮 */}
                                <Tooltip title="刷新列表">
                                    <RedoOutlined
                                        onClick={handleGetFaultCenterList}
                                        style={{
                                            cursor: 'pointer',
                                            color: '#1890ff',
                                            transition: 'all 0.3s',
                                        }}
                                    />
                                </Tooltip>

                                {/* 创建按钮 */}
                                <Tooltip title="创建新故障中心">
                                    <a
                                        href="/faultCenter"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '4px 8px',
                                            borderRadius: 4,
                                            background: '#f5f5f5',
                                            transition: 'all 0.3s',
                                            color: '#666',
                                            '&:hover': {
                                                background: '#1890ff',
                                                color: '#fff',
                                                textDecoration: 'none'
                                            }
                                        }}
                                    >
                                        前往创建
                                    </a>
                                </Tooltip>
                            </div>
                        </div>
                    </MyFormItem>
                </div>


                <div style={{marginTop: '20px'}}>
                    <MyFormItem
                        style={{marginBottom: 0}}
                        name="enabled"
                        valuePropName="checked"
                    >
                        <div style={{display: 'flex', alignItems: 'center'}}>
                            <span style={{marginRight: 8}}>规则状态</span>
                            <Switch value={enabled} checked={enabled} onChange={(e) => {
                                setEnabled(e)
                            }}/>
                        </div>
                    </MyFormItem>
                </div>

                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
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
            </Form>
        </div>
    )
}