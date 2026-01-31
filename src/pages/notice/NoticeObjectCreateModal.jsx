import {Form, Input, Button, Select, Card, Drawer, Checkbox} from 'antd'
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createNotice, updateNotice } from '../../api/notice'
import { getDutyManagerList } from '../../api/duty'
import FeiShuImg from "./img/feishu.svg";
import EmailImg from "./img/Email.svg";
import DingDingImg from "./img/dingding.svg";
import WeChatImg from "./img/qywechat.svg"
import SlackImg from "./img/slack.svg"
import WebHook from "./img/webhook.svg"
import {MinusCircleOutlined, PlusOutlined} from "@ant-design/icons";
import {getNoticeTmplList} from "../../api/noticeTmpl";
import {getUserList} from "../../api/user";
import { noticeTest } from '../../api/notice';

const MyFormItemContext = React.createContext([])

function toArr(str) {
    return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
    const prefixPath = React.useContext(MyFormItemContext)
    const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
    return <Form.Item name={concatName} {...props} />
}

export const CreateNoticeObjectModal = ({ visible, onClose, selectedRow, type, handleList }) => {
    const { Option } = Select
    const [form] = Form.useForm()
    
    // 基础状态
    const [dutyList, setDutyList] = useState([])
    const [submitLoading, setSubmitLoading] = useState(false)
    const [testLoadingRoutes, setTestLoadingRoutes] = useState({})
    const [selectedNoticeCard, setSelectedNoticeCard] = useState(0)
    const [noticeType, setNoticeType] = useState('FeiShu')

    const [filteredOptions, setFilteredOptions] = useState([])
    
    // 数据加载状态
    const [dataLoaded, setDataLoaded] = useState(false)
    const [templateCache, setTemplateCache] = useState({})
    const templateCacheRef = useRef({})
    const loadingTemplatesRef = useRef(new Set()) // 跟踪正在加载的模板类型

    const PRIORITY_OPTIONS = useMemo(() => [
        { label: 'P0 紧急', value: 'P0' },
        { label: 'P1 重要', value: 'P1' },
        { label: 'P2 一般', value: 'P2' }
    ], [])

    const cards = useMemo(() => [
        { imgSrc: FeiShuImg, text: '飞书', value: 'FeiShu' },
        { imgSrc: EmailImg, text: '邮件', value: 'Email' },
        { imgSrc: DingDingImg, text: '钉钉', value: 'DingDing' },
        { imgSrc: WeChatImg, text: '企业微信', value: 'WeChat' },
        { imgSrc: SlackImg, text: 'Slack', value: 'Slack' },
        { imgSrc: WebHook, text: 'WebHook', value: 'WebHook' },
    ], [])

    // API 调用函数
    const loadDutyList = useCallback(async () => {
        try {
            const res = await getDutyManagerList()
            if (res?.data && Array.isArray(res?.data)) {
                const newData = res?.data?.map((item) => ({
                    label: item.name,
                    value: item.id
                }))
                setDutyList(newData)
            }
        } catch (error) {
            console.error('获取值班表列表失败:', error)
            setDutyList([])
        }
    }, [])

    const loadUserList = useCallback(async () => {
        try {
            const res = await getUserList({ joinDuty: "true" })
            if (res?.data && Array.isArray(res?.data)) {
                const options = res?.data?.map((item) => ({
                    userName: item.username,
                    userEmail: item.email
                }))
                setFilteredOptions(options)
            }
        } catch (error) {
            console.error('获取用户列表失败:', error)
            setFilteredOptions([])
        }
    }, [])

    const loadNoticeTemplates = useCallback(async (noticeTypeParam) => {
        // 检查缓存
        if (templateCacheRef.current[noticeTypeParam]) {
            return templateCacheRef.current[noticeTypeParam]
        }

        // 检查是否正在加载，避免重复请求
        if (loadingTemplatesRef.current.has(noticeTypeParam)) {
            return []
        }

        loadingTemplatesRef.current.add(noticeTypeParam)

        try {
            const res = await getNoticeTmplList({ noticeType: noticeTypeParam })
            if (res?.data && Array.isArray(res?.data)) {
                const newData = res?.data?.map((item) => ({
                    label: item.name,
                    value: item.id
                }))
                // 缓存结果
                templateCacheRef.current[noticeTypeParam] = newData
                setTemplateCache(prev => ({
                    ...prev,
                    [noticeTypeParam]: newData
                }))
                return newData
            }
            return []
        } catch (error) {
            console.error('获取通知模板列表失败:', error)
            return []
        } finally {
            loadingTemplatesRef.current.delete(noticeTypeParam)
        }
    }, [])

    // 初始化数据加载 - 只在模态框首次打开时执行
    useEffect(() => {
        if (visible && !dataLoaded) {
            const loadInitialData = async () => {
                try {
                    // 先加载基础数据
                    await Promise.all([
                        loadDutyList(),
                        loadUserList()
                    ])
                    
                    // 如果是编辑模式，需要预先加载相关的通知模板
                    if (selectedRow && selectedRow.routes) {
                        const noticeTypesToLoad = []
                        if (selectedRow.routes?.length > 0) {
                            // 收集所有路由中的通知类型
                            selectedRow.routes.forEach(route => {
                                if (route.noticeType && !noticeTypesToLoad.includes(route.noticeType)) {
                                    noticeTypesToLoad.push(route.noticeType)
                                }
                            })
                        } else {
                            // 单一路由情况
                            if (selectedRow.noticeType && !noticeTypesToLoad.includes(selectedRow.noticeType)) {
                                noticeTypesToLoad.push(selectedRow.noticeType)
                            }
                        }
                        
                        // 并行加载所有需要的通知模板
                        if (noticeTypesToLoad.length > 0) {
                            await Promise.all(
                                noticeTypesToLoad.map(type => loadNoticeTemplates(type))
                            )
                        } else {
                            // 如果没有特定类型，加载默认类型
                            await loadNoticeTemplates()
                        }
                    } else {
                        // 创建模式，加载默认类型
                        await loadNoticeTemplates()
                    }
                } finally {
                    setDataLoaded(true)
                }
            }
            loadInitialData()
        }
    }, [visible, dataLoaded, loadDutyList, loadUserList, loadNoticeTemplates, selectedRow])

    // 表单初始化 - 根据编辑/创建模式设置表单值
    useEffect(() => {
        if (!visible) {
            // 模态框关闭时重置状态
            setDataLoaded(false)
            setSelectedNoticeCard(0)
            setNoticeType('')
            setTemplateCache({})
            setTestLoadingRoutes({})
            templateCacheRef.current = {}
            loadingTemplatesRef.current.clear()
            form.resetFields()
            return
        }

        if (selectedRow) {
            // 编辑模式
            const routes = selectedRow.routes?.length > 0 
                ? selectedRow.routes.map(route => ({
                    ...route,
                    severitys: Array.isArray(route.severitys) ? route.severitys : (route.severitys ? [route.severitys] : ['P0']),
                    noticeTmplId: route.noticeTmplId || ''
                }))
                : [{
                    severitys: ['P0'],
                    noticeType: selectedRow.noticeType || 'FeiShu',
                    noticeTmplId: selectedRow.noticeTmplId || '',
                    hook: selectedRow.hook || '',
                    sign: selectedRow.sign || '',
                    subject: selectedRow.email?.subject || '',
                    to: selectedRow.email?.to || [],
                    cc: selectedRow.email?.cc || []
                }]

            // 等待相关模板加载完成后设置表单值
            setTimeout(() => {
                form.setFieldsValue({
                    name: selectedRow.name,
                    dutyId: selectedRow.dutyId,
                    routes: routes
                })
            }, 0)

            const cardIndex = cards.findIndex(card => card.value === (selectedRow.noticeType || 'FeiShu'))
            setSelectedNoticeCard(cardIndex >= 0 ? cardIndex : 0)
            setNoticeType(selectedRow.noticeType || 'FeiShu')
        } else {
            // 创建模式
            form.setFieldsValue({
                routes: [{
                    severitys: ['P0'],
                    noticeType: 'FeiShu',
                    noticeTmplId: '',
                    hook: '',
                    sign: '',
                    subject: '',
                    to: [],
                    cc: []
                }]
            })
            setSelectedNoticeCard(0)
            setNoticeType('FeiShu')
        }
    }, [visible, selectedRow, form, cards])

    // 表单处理函数
    const handleInputChange = (e) => {
        const newValue = e.target.value.replace(/\s/g, '')
        form.setFieldValue('name', newValue)
    }

    const handleKeyPress = (e) => {
        if (e.key === ' ') {
            e.preventDefault()
        }
    }



    // 业务逻辑函数
    const handleCreate = async (data) => {
        try {
            const params = {
                tenantId: 'default',
                name: data.name,
                dutyId: data.dutyId || null,
                routes: data.routes?.map(route => ({
                    noticeType: route.noticeType || noticeType,
                    noticeTmplId: route.noticeTmplId || '',
                    severitys: Array.isArray(route.severitys) ? route.severitys : (route.severitys ? [route.severitys] : ['P0']),
                    hook: route.hook || '',
                    sign: route.sign || '',
                    subject: route.subject || '',
                    to: route.to || [],
                    cc: route.cc || []
                })) || [],
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
                tenantId: selectedRow.tenantId || 'default',
                name: data.name,
                dutyId: data.dutyId || null,
                routes: data.routes?.map(route => ({
                    noticeType: route.noticeType || noticeType,
                    noticeTmplId: route.noticeTmplId || '',
                    severitys: Array.isArray(route.severitys) ? route.severitys : (route.severitys ? [route.severitys] : ['P0']),
                    hook: route.hook || '',
                    sign: route.sign || '',
                    subject: route.subject || '',
                    to: route.to || [],
                    cc: route.cc || []
                })) || [],
                updateBy: 'current_user',
                uuid: selectedRow.uuid
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

    const handleSubmit = async () => {
        setSubmitLoading(true)
        try {
            const values = await form.validateFields()
            await handleFormSubmit(values)
        } catch (error) {
            console.log('表单验证失败:', error)
        } finally {
            setSubmitLoading(false)
        }
    }

    const handleTestNotice = async (routeIndex) => {
        setTestLoadingRoutes(prev => ({ ...prev, [routeIndex]: true }))
        try {
            const formValues = form.getFieldsValue()
            const route = formValues.routes?.[routeIndex]
            
            if (!route) {
                console.error('Route not found')
                return
            }

            const params = {
                noticeType: route.noticeType || 'FeiShu',
                hook: route.hook || '',
                sign: route.sign || '',
                email: {
                    subject: route.subject || '',
                    to: route.to || [],
                    cc: route.cc || []
                }
            }
            
            await noticeTest(params)
        } catch (error) {
            console.log(error)
        } finally {
            setTestLoadingRoutes(prev => ({ ...prev, [routeIndex]: false }))
        }
    }



    return (
        <Drawer
            title={type === 'create' ? '创建通知对象' : '编辑通知对象'}
            open={visible}
            onClose={onClose}
            width={820}
            footer={
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                }}>
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
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder="请输入通知对象名称"
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
                        />
                    </MyFormItem>
                </div>

                <MyFormItem
                    name="routes"
                    label="通知路由"
                    style={{marginRight: '10px', width: '100%'}}
                >
                    <Form.List name="routes">
                        {(fields, {add, remove}) => (
                            <>
                                {fields.map(({key, name, ...restField}) => {
                                    return (
                                        <div
                                            key={key}
                                            style={{
                                                marginBottom: 16,
                                                padding: 12,
                                                border: '1px solid #d9d9d9',
                                                background: '#ffffffff',
                                                borderRadius: 8,
                                                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                            }}
                                        >
                                            <div style={{display: 'flex', gap: 8}}>
                                                <div style={{width: '100%'}}>
                                                    {fields.length > 1 && (
                                                        <div style={{display: 'flex', justifyContent: 'flex-end'}}>
                                                            <MinusCircleOutlined
                                                                onClick={() => remove(name)}
                                                                style={{color: '#ff4d4f', cursor: 'pointer'}}
                                                            />
                                                        </div>
                                                    )}
                                                    {/* 通知类型选择 */}
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "noticeType"]}
                                                        label="通知类型"
                                                        rules={[{required: true}]}
                                                    >
                                                        <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => {
                                                            const prevNoticeType = prevValues?.routes?.[name]?.noticeType
                                                            const currentNoticeType = currentValues?.routes?.[name]?.noticeType
                                                            return prevNoticeType !== currentNoticeType
                                                        }}>
                                                            {({ getFieldValue, setFieldsValue }) => {
                                                                const currentNoticeType = getFieldValue(['routes', name, 'noticeType']) || 'FeiShu'
                                                                const selectedCardIndex = cards.findIndex(card => card.value === currentNoticeType)
                                                                
                                                                const handleRouteCardClick = async (cardIndex) => {
                                                                    const selectedCard = cards[cardIndex]
                                                                    const routes = getFieldValue('routes') || []
                                                                    const newRoutes = [...routes]
                                                                    if (newRoutes[name]) {
                                                                        newRoutes[name] = {
                                                                            ...newRoutes[name],
                                                                            noticeType: selectedCard.value,
                                                                            noticeTmplId: '' // 清空模板选择
                                                                        }
                                                                    }
                                                                    setFieldsValue({ routes: newRoutes })
                                                                    // 预加载新通知类型的模板（不阻塞UI）
                                                                    if (!templateCacheRef.current[selectedCard.value]) {
                                                                        loadNoticeTemplates(selectedCard.value)
                                                                    }
                                                                }
                                                                
                                                                return (
                                                                    <div style={{display: 'flex', gap: '8px', flexWrap: 'wrap'}}>
                                                                        {cards.map((card, cardIndex) => (
                                                                            <Card
                                                                                key={cardIndex}
                                                                                style={{
                                                                                    height: 90,
                                                                                    width: 110,
                                                                                    position: 'relative',
                                                                                    cursor: 'pointer',
                                                                                    border: selectedCardIndex === cardIndex ? '2px solid #1890ff' : '1px solid #d9d9d9',
                                                                                }}
                                                                                onClick={() => handleRouteCardClick(cardIndex)}
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
                                                                                        style={{height: '45px', width: '80px', objectFit: 'contain'}}
                                                                                        alt={card.text}
                                                                                    />
                                                                                    <p style={{
                                                                                        fontSize: '10px',
                                                                                        textAlign: 'center',
                                                                                        marginTop: '3px',
                                                                                        marginBottom: 0
                                                                                    }}>
                                                                                        {card.text}
                                                                                    </p>
                                                                                </div>
                                                                            </Card>
                                                                        ))}
                                                                    </div>
                                                                )
                                                            }}
                                                        </Form.Item>
                                                    </Form.Item>

                                                    {/* 根据通知类型显示不同的配置 */}
                                                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => {
                                                        const prevNoticeType = prevValues?.routes?.[name]?.noticeType
                                                        const currentNoticeType = currentValues?.routes?.[name]?.noticeType
                                                        return prevNoticeType !== currentNoticeType
                                                    }}>
                                                        {({ getFieldValue }) => {
                                                            const currentNoticeType = getFieldValue(['routes', name, 'noticeType']) || 'FeiShu'
                                                            
                                                            if (currentNoticeType === 'Email') {
                                                                return (
                                                                    <>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, "subject"]}
                                                                            label="邮件主题"
                                                                            rules={[{required: true}]}
                                                                        >
                                                                            <Input placeholder="邮件主题"/>
                                                                        </Form.Item>

                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, "to"]}
                                                                            label="收件人"
                                                                            rules={[{required: true}]}
                                                                        >
                                                                            <Select
                                                                                mode="multiple"
                                                                                placeholder="请选择需要通知的人员"
                                                                                style={{ width: '100%' }}
                                                                            >
                                                                                {filteredOptions.map((item) => (
                                                                                    <Option
                                                                                        key={item.userName}
                                                                                        value={item.userEmail}
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
                                                                        >
                                                                            <Select
                                                                                mode="multiple"
                                                                                placeholder="请选择需要抄送的人员"
                                                                                style={{ width: '100%' }}
                                                                            >
                                                                                {filteredOptions.map((item) => (
                                                                                    <Option
                                                                                        key={item.userName}
                                                                                        value={item.userEmail}
                                                                                    >
                                                                                        {item.userName} ({item.userEmail})
                                                                                    </Option>
                                                                                ))}
                                                                            </Select>
                                                                        </Form.Item>
                                                                    </>
                                                                )
                                                            } else {
                                                                return (
                                                                    <>
                                                                        <Form.Item
                                                                            {...restField}
                                                                            name={[name, "hook"]}
                                                                            label="Hook地址"
                                                                            rules={[{required: true, pattern: /^(http|https):\/\//}]}
                                                                        >
                                                                            <Input placeholder="http(s)://xxx.xxx"/>
                                                                        </Form.Item>

                                                                        {currentNoticeType === 'FeiShu' && (
                                                                            <Form.Item
                                                                                {...restField}
                                                                                name={[name, "sign"]}
                                                                                label="签名"
                                                                            >
                                                                                <Input placeholder="选填签名信息"/>
                                                                            </Form.Item>
                                                                        )}
                                                                    </>
                                                                )
                                                            }
                                                        }}
                                                    </Form.Item>


                                                    {/* 通知模板选择 */}
                                                    <Form.Item noStyle shouldUpdate={(prevValues, currentValues) => {
                                                        const prevNoticeType = prevValues?.routes?.[name]?.noticeType
                                                        const currentNoticeType = currentValues?.routes?.[name]?.noticeType
                                                        return prevNoticeType !== currentNoticeType
                                                    }}>
                                                        {({ getFieldValue }) => {
                                                            const currentNoticeType = getFieldValue(['routes', name, 'noticeType']) || 'FeiShu'
                                                            
                                                            // 当通知类型为 WebHook 时，不显示通知模板选项
                                                            if (currentNoticeType === 'WebHook') {
                                                                return null
                                                            }
                                                            
                                                            // 获取当前通知类型对应的模板选项
                                                            const currentTemplateOptions = templateCacheRef.current[currentNoticeType] || templateCache[currentNoticeType] || []
                                                            
                                                            return (
                                                                <Form.Item
                                                                    {...restField}
                                                                    name={[name, "noticeTmplId"]}
                                                                    label="通知模板"
                                                                    rules={[{required: true}]}
                                                                >
                                                                    <Select
                                                                        placeholder="请选择通知模板"
                                                                        options={currentTemplateOptions}
                                                                        onFocus={async () => {
                                                                            if (!templateCacheRef.current[currentNoticeType]) {
                                                                                const templates = await loadNoticeTemplates(currentNoticeType)
                                                                                // 强制更新当前选项
                                                                                if (templates && templates.length > 0) {
                                                                                    // 触发重新渲染
                                                                                    form.setFieldValue(['routes', name, 'noticeTmplId'], form.getFieldValue(['routes', name, 'noticeTmplId']))
                                                                                }
                                                                            }
                                                                        }}
                                                                    />
                                                                </Form.Item>
                                                            )
                                                        }}
                                                    </Form.Item>

                                                    {/* 告警等级选择 */}
                                                    <Form.Item
                                                        {...restField}
                                                        name={[name, "severitys"]}
                                                        label="适用级别"
                                                        rules={[{required: true, message: '请至少选择一个告警等级'}]}
                                                    >
                                                        <Checkbox.Group
                                                            options={PRIORITY_OPTIONS}
                                                        />
                                                    </Form.Item>

                                                    <div style={{ marginTop: "-20px" ,marginBottom: "-20px"}}>
                                                        {/* 通知测试按钮 */}
                                                        <Form.Item>
                                                            <Button
                                                                type="default"
                                                                onClick={() => handleTestNotice(name)}
                                                                loading={testLoadingRoutes[name]}
                                                                style={{ marginTop: 8 }}
                                                            >
                                                                通知测试
                                                            </Button>
                                                        </Form.Item>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}

                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => {
                                            add({
                                                severitys: ['P0'],
                                                noticeType: 'FeiShu',
                                                noticeTmplId: '',
                                                hook: '',
                                                sign: '',
                                                subject: '',
                                                to: [],
                                                cc: []
                                            })
                                        }}
                                        block
                                        icon={<PlusOutlined/>}
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