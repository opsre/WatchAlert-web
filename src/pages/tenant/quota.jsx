import React, { useEffect } from 'react'
import {Button, Form, Input, Popconfirm} from "antd";
import { updateTenant } from '../../api/tenant'
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

export const TenantQuota = ({tenantInfo})=>{
    const [form] = Form.useForm()

    useEffect(() => {
        console.log(tenantInfo)
        if (tenantInfo) {
            form.setFieldsValue({
                userNumber: Number(tenantInfo.userNumber),
                ruleNumber: Number(tenantInfo.ruleNumber),
                dutyNumber: Number(tenantInfo.dutyNumber),
                noticeNumber: Number(tenantInfo.noticeNumber),
            })
        }
    }, [tenantInfo, form])

    const handleFormSubmit =async (values) =>{
        try {
            const params = {
                ...tenantInfo,
                userNumber: Number(values.userNumber),
                ruleNumber: Number(values.ruleNumber),
                dutyNumber: Number(values.dutyNumber),
                noticeNumber: Number(values.noticeNumber),
            }

            await updateTenant(params)
        } catch (error) {
            console.error(error)
        }
    }

    return(
       <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
            <div style={{display:'flex'}}>
                <MyFormItem
                    name="userNumber"
                    label="用户数"
                    style={{
                        marginRight: '20px',
                    }}
                >
                    <Input
                        type={"number"}
                        addonAfter={'个'}
                        placeholder="10"
                        min={1}
                    />
                </MyFormItem>
                <MyFormItem
                    name="ruleNumber"
                    label="规则数"
                    style={{
                        marginRight: '20px',
                    }}
                >
                    <Input
                        type={"number"}
                        addonAfter={'个'}
                        placeholder="10"
                        min={1}
                    />
                </MyFormItem>
            </div>

            <div style={{display:'flex'}}>
               <MyFormItem
                   name="dutyNumber"
                   label="值班表数"
                   style={{
                       marginRight: '20px',
                   }}
               >
                   <Input
                       type={"number"}
                       addonAfter={'个'}
                       placeholder="10"
                       min={1}
                   />
               </MyFormItem>
               <MyFormItem
                   name="noticeNumber"
                   label="通知对象数"
                   style={{
                       marginRight: '20px',
                   }}
               >
                   <Input
                       type={"number"}
                       addonAfter={'个'}
                       placeholder="10"
                       min={1}
                   />
               </MyFormItem>
           </div>

            <div id="option" style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                <Popconfirm
                    title="取消后修改的配置将不会保存!"
                    >
                    <Button type="dashed">
                        取消
                    </Button>
                </Popconfirm>
                <Button
                    type="primary"
                    htmlType="submit"
                    style={{
                        backgroundColor: '#000000'
                    }}
                >
                    保存
                </Button>
            </div>
       </Form>
    )
}