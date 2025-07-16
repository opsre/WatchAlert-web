import {Modal, Form, Input, Button, Select, Card, Drawer, Divider} from 'antd'
import React, { useState, useEffect } from 'react'
import { createNotice, updateNotice } from '../../api/notice'
import { getDutyManagerList } from '../../api/duty'
import FeiShuImg from "./img/feishu.svg";
import EmailImg from "./img/Email.svg";
import DingDingImg from "./img/dingding.svg";
import WeChatImg from "./img/qywechat.svg"
import SlackImg from "./img/slack.svg"
import CustomHook from "./img/customhook.svg"
import { searchNoticeTmpl} from "../../api/noticeTmpl";
import { getAllUsers } from "../../api/other";
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItemGroup = ({ prefix, children }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatPath = React.useMemo(() => [...prefixPath, ...toArr(prefix)], [prefixPath, prefix])
    return <MyFormItemContext.Provider value={concatPath}>{children}</MyFormItemContext.Provider>
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const CreateNoticeObjectModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const { Option } = Select
    const [form] = Form.useForm()
    const [dutyList, setDutyList] = useState([])
    const [selectedDutyItem, setSelectedDutyItem] = useState([])
    const [submitLoading,setSubmitLoading] = useState(false)
    const [subjectValue,setSubjectValue] = useState('')
    const [selectedNoticeCard, setSelectedNoticeCard] = useState(null)
    const [noticeType,setNoticeType] = useState('')
    const [noticeTmplItems,setNoticeTmplItems] = useState([])
    const [selectNoticeTmpl,setSelectNoticeTmpl] = useState('')
    const [selectedToItems, setSelectedToItems] = useState([])
    const [selectedCcItems, setSelectedCcItems] = useState([])
    const [filteredOptions, setFilteredOptions] = useState([])
    const [spaceValue, setSpaceValue] = useState('')

    const PRIORITY_OPTIONS = [
        { label: 'P0 紧急', value: 'P0' },
        { label: 'P1 重要', value: 'P1' },
        { label: 'P2 一般', value: 'P2' }
    ]

    const PRIORITY_COLORS = {
        P0: '#ff4d4f',
        P1: '#faad14',
        P2: '#b0e1fb'
    }

    const cards = [
        { imgSrc: FeiShuImg, text: '飞书', value: 'FeiShu' },
        { imgSrc: EmailImg, text: '邮件', value: 'Email' },
        { imgSrc: DingDingImg, text: '钉钉', value: 'DingDing' },
        { imgSrc: WeChatImg, text: '企业微信', value: 'WeChat' },
        { imgSrc: SlackImg, text: 'Slack', value: 'Slack' },
        { imgSrc: CustomHook, text: '自定义Hook', value: 'CustomHook' },
    ]

    const handleInputEmailChange = (name, value) => {
        switch (name) {
            case 'subject':
                setSubjectValue(value)
                break
            default:
                break
        }
    }

    const handleInputChange = (e) => {
        const newValue = e.target.value.replace(/\s/g, '')
        setSpaceValue(newValue)
    }

    const handleKeyPress = (e) => {
        if (e.key === ' ') {
            e.preventDefault()
        }
    }

    useEffect(() => {
        handleSearchUser()
        handleDutyManageList()
        handleGetNoticeTmpl()

        if (selectedRow) {
            form.setFieldsValue({
                uuid: selectedRow.uuid,
                name: selectedRow.name,
                dutyId: selectedRow.dutyId,
                env: selectedRow.env,
                noticeType: selectedRow.noticeType,
                hook: selectedRow.hook,
                noticeTmplId: selectedRow.noticeTmplId,
                sign: selectedRow.sign,
                email: {
                    subject: selectedRow.email.subject,
                    to: selectedRow.email.to,
                    cc: selectedRow.email.cc,
                },
                routes: selectedRow.routes || []
            })

            const cardIndex = cards.findIndex(card => card.value === selectedRow.noticeType)
            setSubjectValue(selectedRow.email.subject)
            setSelectedToItems(selectedRow.email.to)
            setSelectedCcItems(selectedRow.email.cc)
            setSelectedNoticeCard(cardIndex)
            setNoticeType(selectedRow.noticeType)
            setSelectNoticeTmpl(selectedRow.noticeTmplId)
        }
    }, [selectedRow, form])

    const handleDutyManageList = async () => {
        try {
            const res = await getDutyManagerList()
            const newData = res.data.map((item) => ({
                label: item.name,
                value: item.id
            }))
            setDutyList(newData)
        } catch (error) {
            console.error(error)
        }
    }

    const handleCreate = async (data) => {
        try {
            const params = {
                ...data,
                noticeType: noticeType,
                email: {
                    subject: subjectValue,
                    to: selectedToItems,
                    cc: selectedCcItems,
                }
            }
            await createNotice(params)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async (data) => {
        try {
            const params = {
                ...data,
                noticeType: noticeType,
                tenantId: selectedRow.tenantId,
                uuid: selectedRow.uuid,
                email: {
                    subject: subjectValue,
                    to: selectedToItems,
                    cc: selectedCcItems,
                }
            }
            await updateNotice(params)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    const handleFormSubmit = async (values) => {
        if (type === 'create') {
            await handleCreate(values)
        } else if (type === 'update') {
            await handleUpdate(values)
        }
        onClose()
    }

    useEffect(() => {
        if (selectedNoticeCard === null) {
            setSelectedNoticeCard(0)
            setNoticeType("FeiShu")
        }
    }, [])

    const handleCardClick = (index) => {
        setNoticeType(cards[index].value)
        setSelectedNoticeCard(index)
    }

    const handleGetNoticeTmpl = async () => {
        const params = { noticeType: noticeType }
        const res = await searchNoticeTmpl(params)
        const newData = res.data.map((item) => ({
            label: item.name,
            value: item.id
        }))
        setNoticeTmplItems(newData)
    }

    const handleSelectChangeTo = (value) => {
        setSelectedToItems(value)
    }

    const handleSelectChangeCc = (value) => {
        setSelectedCcItems(value)
    }

    const handleSearchUser = async () => {
        try {
            const res = await getAllUsers()
            const options = res.data.map((item) => ({
                userName: item.username,
                userEmail: item.email
            }))
            setFilteredOptions(options)
        } catch (error) {
            console.error(error)
        }
    }

    const handleSubmit = async () => {
        setSubmitLoading(true)
        const values = form.getFieldsValue()
        try {
            await form.validateFields()
            await handleFormSubmit(values)
        } catch (error) {
            console.log(error)
        }
        setSubmitLoading(false)
    }

    const getAvailablePriorityOptions = (fields) => {
        const usedPriorities = fields.map(field =>
            form.getFieldValue(['routes', field.name, 'severity'])
        )
        return PRIORITY_OPTIONS.filter(
            option => !usedPriorities.includes(option.value)
        )
    }

    return (
        <Drawer
            title="创建通知对象"
            open={visible}
            onClose={onClose}
            width={820}
            footer={
                <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={submitLoading}
                        onClick={handleSubmit}
                        style={{ backgroundColor: '#000000' }}
                    >
                        提交
                    </Button>
                </div>
            }
        >
            <Form form={form} name="form_item_path" layout="vertical">
                <div style={{display: 'flex'}}>
                    <MyFormItem
                        name="name"
                        label="名称"
                        style={{ marginRight: '10px', width: '500px' }}
                        rules={[{ required: true }]}
                    >
                        <Input
                            value={spaceValue}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            disabled={type === 'update'}
                        />
                    </MyFormItem>

                    <MyFormItem
                        name="dutyId"
                        label="值班表"
                        style={{ width: '500px' }}
                    >
                        <Select
                            showSearch
                            allowClear
                            placeholder="请选择值班表"
                            options={dutyList}
                            value={selectedDutyItem}
                            tokenSeparators={[',']}
                            onChange={setSelectedDutyItem}
                        />
                    </MyFormItem>
                </div>

                <div style={{display: 'flex'}}>
                    <MyFormItem name="" label="通知类型">
                        <div style={{display: 'flex', gap: '10px'}}>
                            {cards.map((card, index) => (
                                <Card
                                    key={index}
                                    style={{
                                        height: 100,
                                        width: 120,
                                        position: 'relative',
                                        cursor: type === 'update' ? 'not-allowed' : 'pointer',
                                        border: selectedNoticeCard === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
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
                                        <img
                                            src={card.imgSrc}
                                            style={{height: '50px', width: '100px', objectFit: 'contain'}}
                                            alt={card.text}
                                        />
                                        <p style={{
                                            fontSize: '12px',
                                            textAlign: 'center',
                                            marginTop: '5px'
                                        }}>
                                            {card.text}
                                        </p>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </MyFormItem>
                </div>

                <div>
                    {noticeType === "Email" ? (
                        <MyFormItemGroup prefix={['email']}>
                            <MyFormItem name="subject" label="邮件主题" rules={[{required: true}]}>
                                <Input
                                    onChange={(e) => handleInputEmailChange('subject', e.target.value)}
                                    placeholder="WatchAlert监控报警平台"
                                    style={{width: '100%'}}
                                />
                            </MyFormItem>

                            <MyFormItem name="to" label="收件人" rules={[{ required: true }]}>
                                <Select
                                    mode="multiple"
                                    placeholder="请选择需要通知的人员"
                                    onChange={handleSelectChangeTo}
                                    style={{ width: '100%' }}
                                >
                                    {filteredOptions.map((item) => (
                                        <Option
                                            key={item.userName}
                                            value={item.userEmail}
                                            userName={item.userName}
                                            userEmail={item.userEmail}
                                        >
                                            {item.userName} ({item.userEmail})
                                        </Option>
                                    ))}
                                </Select>
                            </MyFormItem>

                            <MyFormItem name="cc" label="抄送人">
                                <Select
                                    mode="multiple"
                                    placeholder="请选择需要抄送的人员"
                                    onChange={handleSelectChangeCc}
                                    style={{ width: '100%' }}
                                >
                                    {filteredOptions.map((item) => (
                                        <Option
                                            key={item.userName}
                                            value={item.userEmail}
                                            userName={item.userName}
                                            userEmail={item.userEmail}
                                            disabled={(selectedToItems.some(toItem => toItem === item.userEmail) || item.userEmail === "")}
                                        >
                                            {item.userName} ({item.userEmail})
                                        </Option>
                                    ))}
                                </Select>
                            </MyFormItem>
                        </MyFormItemGroup>
                    ) : (
                        <MyFormItem
                            name="hook"
                            label="默认Hook"
                            tooltip="客户端机器人的 Hook 地址"
                            style={{ marginRight: '10px', width: '100%' }}
                            rules={[
                                { required: true },
                                { pattern: /^(http|https):\/\//, message: '输入正确的URL格式' },
                            ]}
                        >
                            <Input/>
                        </MyFormItem>
                    )}
                </div>

                {selectedNoticeCard === 0 && (
                    <MyFormItem
                        name="sign"
                        label="默认签名"
                        tooltip="飞书客户端机器人的签名校验"
                        style={{ marginRight: '10px', width: '100%' }}
                    >
                        <Input.Password />
                    </MyFormItem>
                )}

                {selectedNoticeCard !== 5 && (
                    <MyFormItem
                        name="noticeTmplId"
                        label="通知模版"
                        rules={[{ required: true }]}
                    >
                        <Select
                            showSearch
                            allowClear
                            placeholder="请选择通知模版"
                            options={noticeTmplItems}
                            value={selectNoticeTmpl}
                            tokenSeparators={[',']}
                            onChange={setSelectNoticeTmpl}
                            onClick={handleGetNoticeTmpl}
                        />
                    </MyFormItem>
                )}

                {selectedNoticeCard === 5 && (
                    <pre>
                        <span>Request Body</span>
                        <code>{`
{
    "tenantId": "租户ID",
    "rule_name": "规则名称",
    "datasource_type": "数据源类型",
    "fingerprint": "告警指纹",
    "severity": "告警等级",
    "metric": {
        "__name__": "up",   // 指标 label
    },
    "labels": {
        "key": "value",     // 额外 label
    },
    "annotations": "告警详情",
    "is_recovered": false,  // 是否恢复
    "first_trigger_time": 1734100959,   // 首次触发时间
    "first_trigger_time_format": "",
    "recover_time": 0,      // 恢复时间
    "recover_time_format": "",
    "duty_user": "暂无"      // 值班人员
}
                        `}</code>
                    </pre>
                )}

                <MyFormItem
                    name="routes"
                    label="路由策略"
                    tooltip="如果不匹配如下任何策略, 则会走默认Hook"
                    style={{marginRight: '10px', width: '100%'}}
                >

                    <div style={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12
                    }}>
                        <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: PRIORITY_COLORS["P0"] || PRIORITY_COLORS.P0,
                            marginRight: 1
                        }}/> P0

                        <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: PRIORITY_COLORS["P1"] || PRIORITY_COLORS.P0,
                            marginRight: 1
                        }}/> P1

                        <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: PRIORITY_COLORS["P2"] || PRIORITY_COLORS.P0,
                            marginRight: 1
                        }}/> P2
                    </div>

                    <Form.List name="routes">
                        {(fields, {add, remove}) => (
                            <>
                                {fields.map(({key, name, ...restField}) => {
                                    const currentSeverity = form.getFieldValue(['routes', name, 'severity'])
                                    return (
                                        <div
                                            key={key}
                                            style={{
                                                marginBottom: 16,
                                                padding: 12,
                                                borderLeft: `4px solid ${PRIORITY_COLORS[currentSeverity] || PRIORITY_COLORS.P0}`,
                                                background: '#f4f4f4',
                                                borderRadius: 4
                                            }}
                                        >
                                            <div style={{display: 'flex', gap: 8}}>
                                                <div style={{width: '100%'}}>
                                                    {selectedNoticeCard !== 1 && (
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "hook"]}
                                                            label="Hook"
                                                            rules={[{required: true, pattern: /^(http|https):\/\//}]}
                                                        >
                                                            <Input placeholder="http(s)://xxx.xxx"/>
                                                        </Form.Item>
                                                    ) || (
                                                        <>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "to"]}
                                                                label="收件人"
                                                                rules={[{required: true}]}
                                                            >
                                                                <Select
                                                                    mode="multiple"
                                                                    placeholder="请选择需要通知的人员"
                                                                    onChange={handleSelectChangeTo}
                                                                    style={{ width: '100%' }}
                                                                >
                                                                    {filteredOptions.map((item) => (
                                                                        <Option
                                                                            key={item.userName}
                                                                            value={item.userEmail}
                                                                            userName={item.userName}
                                                                            userEmail={item.userEmail}
                                                                        >
                                                                            {item.userName} ({item.userEmail})
                                                                        </Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>

                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, "cc"]}
                                                                label="抄送人"
                                                                rules={[{required: true}]}
                                                            >
                                                                <Select
                                                                    mode="multiple"
                                                                    placeholder="请选择需要抄送的人员"
                                                                    onChange={handleSelectChangeCc}
                                                                    style={{ width: '100%' }}
                                                                >
                                                                    {filteredOptions.map((item) => (
                                                                        <Option
                                                                            key={item.userName}
                                                                            value={item.userEmail}
                                                                            userName={item.userName}
                                                                            userEmail={item.userEmail}
                                                                            disabled={(selectedToItems.some(toItem => toItem === item.userEmail) || item.userEmail === "")}
                                                                        >
                                                                            {item.userName} ({item.userEmail})
                                                                        </Option>
                                                                    ))}
                                                                </Select>
                                                            </Form.Item>
                                                        </>
                                                    )}

                                                    {/*非飞书Robot不需要Sign*/}
                                                    {selectedNoticeCard === 0 && (
                                                        <Form.Item
                                                            {...restField}
                                                            name={[name, "sign"]}
                                                            label="签名"
                                                        >
                                                            <Input placeholder="选填签名信息"/>
                                                        </Form.Item>
                                                    )}
                                                </div>
                                                <MinusCircleOutlined
                                                    onClick={() => remove(name)}
                                                    style={{color: PRIORITY_COLORS.P0}}
                                                />
                                            </div>

                                        </div>
                                    )
                                })}

                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => {
                                            const availableOptions = getAvailablePriorityOptions(fields)
                                            if (availableOptions.length > 0) {
                                                add({severity: availableOptions[0].value})
                                            }
                                        }}
                                        block
                                        icon={<PlusOutlined/>}
                                        disabled={fields.length >= PRIORITY_OPTIONS.length}
                                    >
                                        添加策略
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                </MyFormItem>
            </Form>
        </Drawer>
    )
}