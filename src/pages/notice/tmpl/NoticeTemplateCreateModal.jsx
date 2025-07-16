import {Modal, Form, Input, Button, Card, Tooltip, Checkbox, Drawer} from 'antd'
import VSCodeEditor from "../../../utils/VSCodeEditor";
import React, { useEffect, useState } from 'react'
import { createNoticeTmpl, updateNoticeTmpl } from '../../../api/noticeTmpl'
import FeiShuImg from "../img/feishu.svg";
import EmailImg from "../img/Email.svg";
import DingDingImg from "../img/dingding.svg";
import WeChatImg from "../img/qywechat.svg"
import SlackImg from "../img/slack.svg"
import {QuestionCircleOutlined} from "@ant-design/icons";

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

// 函数组件
const NoticeTemplateCreateModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const [form] = Form.useForm()
    const [selectedNotifyCard, setSelectedNotifyCard] = useState(null);
    const [notifyType,setNotifyType] = useState('')
    const [isChecked, setIsChecked] = useState(false)

    // 禁止输入空格
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
                id: selectedRow.id,
                name: selectedRow.name,
                description: selectedRow.description,
                noticeType: selectedRow.noticeType,
                template: selectedRow.template,
                templateFiring: selectedRow.templateFiring,
                templateRecover: selectedRow.templateRecover,
                enableFeiShuJsonCard: selectedRow.enableFeiShuJsonCard,
            })

            let t = 0;
            if (selectedRow.noticeType === "FeiShu"){
                t = 0
            } else if (selectedRow.noticeType === "Email"){
                t = 1
            } else if (selectedRow.noticeType === "DingDing"){
                t = 2
            } else if (selectedRow.noticeType === "WeChat"){
                t = 3
            } else if (selectedRow.noticeType === "Slack"){
                t = 4
            }

            setIsChecked(selectedRow.enableFeiShuJsonCard)
            setNotifyType(selectedRow.noticeType)
            setSelectedNotifyCard(t)
            console.log(t)
        }
    }, [selectedRow, form])

    const handleCreate = async (values) => {
        try {
            const params = {
                ...values,
                noticeType: notifyType,
                enableFeiShuJsonCard: isChecked,
            }
            await createNoticeTmpl(params)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    const handleUpdate = async (values) => {
        try {
            const newValue = {
                ...values,
                id: selectedRow.id,
                noticeType: notifyType,
                enableFeiShuJsonCard: isChecked,
            }
            await updateNoticeTmpl(newValue)
            handleList()
        } catch (error) {
            console.error(error)
        }
    }

    // 提交
    const handleFormSubmit = (values) => {
        if (type === 'create') {
            handleCreate(values)

        }
        if (type === 'update') {
            handleUpdate(values)
        }

        // 关闭弹窗
        onClose()
    }

    const cards = [
        {
            imgSrc: FeiShuImg,
            text: '飞书',
        },
        {
            imgSrc: EmailImg,
            text: '邮件',
        },
        {
            imgSrc: DingDingImg,
            text: '钉钉',
        },
        {
            imgSrc: WeChatImg,
            text: '企业微信'
        },
        {
            imgSrc: SlackImg,
            text: 'Slack'
        }
    ];

    useEffect(() => {
        if (selectedNotifyCard === null){
            setSelectedNotifyCard(0)
            setNotifyType("FeiShu")
        }
    }, [])

    const handleCardClick = (index) => {
        let t = "FeiShu";
       if (index === 1){
            t = "Email"
        } else if (index === 2){
            t = "DingDing"
        } else if (index === 3){
           t = "WeChat"
        } else if (index === 4){
           t = "Slack"
        }

        setNotifyType(t)
        setSelectedNotifyCard(index);
    };

    const handleSubmit = async () => {
        const values = form.getFieldsValue();
        await form.validateFields()
        await handleFormSubmit(values)
    }

    return (
        <Drawer
            title="创建通知模版"
            open={visible}
            onClose={onClose}
            size='large'
            footer={
            <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                <Button
                    type="primary"
                    htmlType="submit"
                    onClick={handleSubmit}
                    style={{
                        backgroundColor: '#000',
                    }}
                >
                    提交
                </Button>
            </div>}
        >
            <Form form={form} name="form_item_path" layout="vertical">
                <div style={{display: 'flex'}}>
                    <MyFormItem name="name" label="名称"
                                style={{
                                    marginRight: '10px',
                                    width: '500px',
                                }}
                                rules={[
                                    {
                                        required: true,
                                    },
                                ]}>
                        <Input
                            value={spaceValue}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            disabled={type === 'update'}/>
                    </MyFormItem>

                    <MyFormItem name="description" label="描述"
                                style={{
                                    marginRight: '10px',
                                    width: '500px',
                                }}>
                        <Input/>
                    </MyFormItem>
                </div>

                <div style={{display: 'flex'}}>
                    <MyFormItem name="" label="模版类型">
                        <div style={{display: 'flex', gap: '10px'}}>
                            {cards.map((card, index) => (
                                <Card
                                    key={index}
                                    style={{
                                        height: 100,
                                        width: 120,
                                        position: 'relative',
                                        cursor: type === 'update' ? 'not-allowed' : 'pointer',
                                        border: selectedNotifyCard === index ? '2px solid #1890ff' : '1px solid #d9d9d9',
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
                    </MyFormItem>
                </div>

                {selectedNotifyCard === 0 && (
                    <div style={{display: 'flex', alignItems: 'center'}}>
                        <MyFormItem style={{marginBottom: '0', marginRight: '10px'}}>
                            <span>应用飞书高级消息卡片</span>
                            <Tooltip title="需要则输入 飞书消息卡片搭建工具的Json Code">
                                <QuestionCircleOutlined style={{color: '#1890ff', marginLeft: '4px'}}/>
                            </Tooltip>
                        </MyFormItem>
                        <Checkbox
                            style={{marginTop: '0', marginRight: '10px'}}
                            checked={isChecked}
                            onChange={(e) => setIsChecked(e.target.checked)}
                        />
                    </div>
                )}

                {(!isChecked || notifyType !== "FeiShu") && (
                    <div>
                        <MyFormItem
                            name="template"
                            label="告警模版"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                            <VSCodeEditor height={"500px"}/>
                        </MyFormItem>
                    </div>
                ) || (
                    <div>
                        <MyFormItem
                            name="templateFiring"
                            label="告警模版"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                            <VSCodeEditor height={"350px"}/>
                        </MyFormItem>
                        <MyFormItem
                            name="templateRecover"
                            label="恢复模版"
                            rules={[
                                {
                                    required: true,
                                },
                            ]}>
                            <VSCodeEditor height={"350px"}/>
                        </MyFormItem>
                    </div>
                )}
            </Form>
        </Drawer>
    )
}

export default NoticeTemplateCreateModal