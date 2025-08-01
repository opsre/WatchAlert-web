import {Form, Input, Button, Select, Alert, Card} from 'antd'
import React, { useState, useEffect } from 'react'
import { createSilence, updateSilence } from '../../api/silence'
import { getRuleList } from "../../api/rule";
import PrometheusImg from "../alert/rule/img/Prometheus.svg";
import LokiImg from "../alert/rule/img/L.svg";
import AlicloudImg from "../alert/rule/img/alicloud.svg";
import JaegerImg from "../alert/rule/img/jaeger.svg";
import AwsImg from "../alert/rule/img/AWSlogo.svg";
import VMImg from "../alert/rule/img/victoriametrics.svg";
import K8sImg from "../alert/rule/img/Kubernetes.svg";
import ESImg from "../alert/rule/img/ElasticSearch.svg";
import VLogImg from "../alert/rule/img/victorialogs.svg"
import {createSubscribe} from "../../api/subscribe";
import {getNoticeTmplList} from "../../api/noticeTmpl";

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

// 表单
const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const CreateSubscribeModel = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const { Option } = Select;
    const [ruleList, setRuleList] = useState([])
    const [selectedCard, setSelectedCard] = useState(0);
    const [selectedType, setSelectedType] = useState("Prometheus")
    const [noticeTmplItems,setNoticeTmplItems] = useState([])
    const [rulePagination, setRulePagination] = useState({
        index: 1,
        size: 1000,
        total: 0,
    });
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
        },
        {
            imgSrc: VLogImg,
            text: 'VictoriaLogs',
        },
    ];
    const [selectedItems, setSelectedItems] = useState([])
    const [filterTags,setFilterTags] = useState([])
    const [selectedLabelName,setSelectedLabelName] = useState(null)

    useEffect(() => {
        if (selectedRow) {
            form.setFieldsValue({
                datasource_type: selectedRow.datasource_type,
                fingerprint: selectedRow.fingerprint,
            })
        }
    }, [selectedRow, form])

    useEffect(() => {
        handleCardClick(0)
        handleNoticeTemplate()
    }, [])

    // 创建
    const handleCreate = async (data) => {
        try {
            await createSubscribe(data)
        } catch (error) {
            console.error(error)
        }
    }

    // 提交
    const handleFormSubmit = async (values) => {
        const params = {
            ...values,
            sRuleType: selectedType,
            sRuleName: selectedLabelName,
        }

        await handleCreate(params)

        window.history.back()
    }

    const handleCardClick = async (index) => {
        let t = ""
        if (index === 0){
            t = "Prometheus"
        } else if (index === 1){
            t = "Loki"
        } else if (index === 2){
            t = "AliCloudSLS"
        } else if (index === 3){
            t = "Jaeger"
        } else if (index === 4){
            t = "CloudWatch"
        } else if (index === 5){
            t = "VictoriaMetrics"
        } else if (index === 6){
            t = "KubernetesEvent"
        } else if (index === 7){
            t = "ElasticSearch"
        } else if (index === 8){
            t = "VictoriaLogs"
        }
        setSelectedType(t)
        setSelectedCard(index);

        try {
            const params = {
                datasourceType: t,
                status: "enabled",
                index: rulePagination.index,
                size: rulePagination.size,
            }
            const res = await getRuleList(params)
            const ops = res.data.list.map((item) =>{
                return {
                    label: item.ruleName,
                    value: item.ruleId,
                }
            })

            setRulePagination({
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            });
            setRuleList(ops);
        } catch (error) {
            console.error(error)
        }
    };

    const handleNoticeTemplate = async() => {
        const params = {
            noticeType: "Email",
        }
        const res =  await getNoticeTmplList(params)
        const newData = res.data.map((item) => ({
            label: item.name,
            value: item.id
        }))
        setNoticeTmplItems(newData)
    }

    const handleSelectedSeverityItem = (ids,info) =>{
        setSelectedItems(ids)
    }

    const handleChangeFilterTags = (value) => {
        setFilterTags(value);
    };

    return (
        <div style={{textAlign:'left',
            width: '100%',
            alignItems: 'flex-start',
            marginTop: '-10px',
            maxHeight: 'calc(100vh)',
            overflowY: 'auto',
        }}>
            <Alert message="订阅的告警只为当前用户生效, 其通过邮件的方式发送订阅消息；⚠️ 只允许订阅已启用的规则。" type="info" showIcon />
            <br/>
            <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
                <MyFormItem name="sRuleType" label="订阅类型" >
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        flexWrap: 'wrap',  // 添加这行使卡片自动换行
                        maxWidth: '100%',  // 可选：限制容器最大宽度
                    }}>
                        {cards.map((card, index) => (
                            <Card
                                key={index}
                                style={{
                                    height: 100,
                                    width: 120,
                                    position: 'relative',
                                    cursor: type === 'edit' ? 'not-allowed' : 'pointer',
                                    border: selectedCard === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                    pointerEvents: type === 'edit' ? 'none' : 'auto',
                                    flexShrink: 0,  // 防止卡片被压缩
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
                </MyFormItem>
                <MyFormItem name="sRuleId" label="订阅对象"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                    <Select
                        showSearch
                        placeholder="请选择要订阅的告警规则"
                        options={ruleList}
                        onChange={(value, option) => {
                            const selectedLabel = option.label;
                            setSelectedLabelName(selectedLabel);
                        }}                    />
                </MyFormItem>

                <MyFormItem name="sRuleSeverity" label="告警等级"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                    <Select
                        mode={"multiple"}
                        showSearch
                        placeholder="请选择要订阅的告警等级"
                        tokenSeparators={[',']}
                        onChange={handleSelectedSeverityItem}
                        options={[
                            {
                                value: 'P0',
                                label: 'P0级告警',
                            },
                            {
                                value: 'P1',
                                label: 'P1级告警',
                            },
                            {
                                value: 'P2',
                                label: 'P2级告警',
                            },
                        ]}
                    />
                </MyFormItem>

                <MyFormItem name="sNoticeSubject" label="通知主题"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                    <Input placeholder="WatchAlert 监控报警平台"/>
                </MyFormItem>

                <MyFormItem name="sNoticeTemplateId" label="通知模版" tooltip={"仅限 Email 类型通知模版"}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                    <Select
                        showSearch
                        placeholder="请选择要订阅的告警规则"
                        options={noticeTmplItems}
                    />
                </MyFormItem>

                <MyFormItem
                    name="sFilter"
                    label="过滤事件"
                    tooltip={"仅接收匹配如下关键字的告警, 例如 metric labels 和 规则事件详情中, 包含添加的<关键字 Tag>, 则会推送到订阅邮箱中。"}
                >
                    <Select
                        mode="tags"
                        style={{width: '100%'}}
                        placeholder="按 'Enter' 添加标签"
                        value={filterTags}
                        onChange={handleChangeFilterTags}
                    >
                        {filterTags.map((tag) => (
                            <Option key={tag} value={tag}>
                                {tag}
                            </Option>
                        ))}
                    </Select>
                </MyFormItem>

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
            </Form>
        </div>
    )
}