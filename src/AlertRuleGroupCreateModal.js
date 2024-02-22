import { Modal, Form, Input, Button, message, Select, Tooltip } from 'antd'
import axios from 'axios'
import React, { useEffect } from 'react'
import backendIP from './config'

const MyFormItemContext = React.createContext([])

function toArr (str) {
  return Array.isArray(str) ? str : [str]
}

const MyFormItem = ({ name, ...props }) => {
  const prefixPath = React.useContext(MyFormItemContext)
  const concatName = name !== undefined ? [...prefixPath, ...toArr(name)] : undefined
  return <Form.Item name={concatName} {...props} />
}

const AlertRuleGroupCreateModal = ({ visible, onClose, selectedRow, type, handleList }) => {
  const [form] = Form.useForm()

  useEffect(() => {
    if (selectedRow) {
      form.setFieldsValue({
        id: selectedRow.id,
        name: selectedRow.name,
        description: selectedRow.description,
      })
    }

  }, [selectedRow, form])

  const handleCreate = async (data) => {
    axios.post(`http://${backendIP}/api/w8t/ruleGroup/ruleGroupCreate`, data)
      .then((res) => {
        if (res.status === 200) {
          message.success("创建成功")
          handleList()
        }
      })
      .catch(() => {
        message.error("创建失败")
      })
  }

  const handleUpdate = async (data) => {
    axios.post(`http://${backendIP}/api/w8t/ruleGroup/ruleGroupUpdate`, data)
      .then((res) => {
        if (res.status === 200) {
          message.success("更新成功")
          handleList()
        }
      })
      .catch(() => {
        message.error("更新失败")
      })
  }

  const handleFormSubmit = async (values) => {

    if (type === 'create') {
      await handleCreate(values)
    }

    if (type === 'update') {
      const newValues = {
        ...values,
        id: selectedRow.id
      }
      await handleUpdate(newValues)
    }

    // 关闭弹窗
    onClose()
  }

  return (
    <Modal visible={visible} onCancel={onClose} footer={null}>
      <Form form={form} name="form_item_path" layout="vertical" onFinish={handleFormSubmit}>
        <MyFormItem name="name" label="名称"
          rules={[
            {
              required: true,
            },
          ]}
        >
          <Input />
        </MyFormItem>

        <MyFormItem name="description" label="描述">
          <Input />
        </MyFormItem>

        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form>
    </Modal>
  )
}

export default AlertRuleGroupCreateModal