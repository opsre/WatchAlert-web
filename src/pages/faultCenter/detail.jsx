"use client"

import { useState, useEffect } from "react"
import { Input, Descriptions, Segmented, Button } from "antd"
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons"
import "./index.css"
import { FaultCenterReset, FaultCenterSearch } from "../../api/faultCenter"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { AlertCurrentEvent } from "../event/currentEvent"
import { AlertHistoryEvent } from "../event/historyEvent"
import { FaultCenterNotify } from "./notify"
import { Breadcrumb } from "../../components/Breadcrumb";

export const FaultCenterDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [detail, setDetail] = useState({})
  const [editingField, setEditingField] = useState(null)
  const [tempValue, setTempValue] = useState("")

  // 解析 URL 中的 tab 参数，默认为 '1'
  const getInitialTabKey = () => {
    const searchParams = new URLSearchParams(location.search)
    return searchParams.get("tab") || "1"
  }

  const [activeTabKey, setActiveTabKey] = useState(getInitialTabKey)

  useEffect(() => {
    handleList()
  }, [])

  // 当 URL 的查询参数变化时更新 activeTabKey
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const tabFromUrl = searchParams.get("tab")
    if (tabFromUrl) {
      setActiveTabKey(tabFromUrl)
    }
  }, [location.search])

  const handleList = async () => {
    try {
      const params = { id }
      const res = await FaultCenterSearch(params)
      setDetail(res?.data)
    } catch (error) {
      console.error(error)
    }
  }

  const handleEdit = (field) => {
    setEditingField(field)
    setTempValue(detail[field] || "")
  }

  const handleSave = async (field) => {
    try {
      setDetail({ ...detail, [field]: tempValue })
      setEditingField(null)

      const params = {
        id: id,
        [field]: tempValue,
      }
      await FaultCenterReset(params)
    } catch (error) {
      console.error("保存失败:", error)
    }
  }

  const handleCancel = () => {
    setEditingField(null)
  }

  const tagItems = [
    {
      key: "1",
      label: "活跃告警",
      children: <AlertCurrentEvent id={id} />,
    },
    {
      key: "2",
      label: "历史告警",
      children: <AlertHistoryEvent id={id} />,
    },
    {
      key: "4",
      label: "通知配置",
      children: <FaultCenterNotify id={id} />,
    },
  ]

  const describeItems = [
    {
      key: "1",
      label: "ID",
      children: detail.id,
    },
    {
      key: "2",
      label: "名称",
      children: (
        <div style={{ display: "flex", alignItems: "center", marginTop: "-5px" }}>
          {editingField === "name" ? (
            <>
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                style={{ width: "200px", marginRight: "8px" }}
              />
              <Button type="text" icon={<CheckOutlined />} onClick={() => handleSave("name")} />
              <Button type="text" icon={<CloseOutlined />} onClick={handleCancel} />
            </>
          ) : (
            <>
              {detail.name}
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit("name")} />
            </>
          )}
        </div>
      ),
    },
    {
      key: "3",
      label: "描述",
      children: (
        <div style={{ display: "flex", alignItems: "center", marginTop: "-5px" }}>
          {editingField === "description" ? (
            <>
              <Input
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                style={{ width: "200px", marginRight: "8px" }}
              />
              <Button type="text" icon={<CheckOutlined />} onClick={() => handleSave("description")} />
              <Button type="text" icon={<CloseOutlined />} onClick={handleCancel} />
            </>
          ) : (
            <>
              {detail.description || "-"}
              <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit("description")} />
            </>
          )}
        </div>
      ),
    },
  ]

  const activeTab = tagItems.find((item) => item.key === activeTabKey) || tagItems[0]

  // Tab 切换回调函数
  const onTabChange = (key) => {
    setActiveTabKey(key)
    const searchParams = new URLSearchParams(location.search)
    searchParams.set("tab", key)
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true })
  }

  return (
    <>
      <Breadcrumb items={['故障中心', '详情']} />
      <div style={{ textAlign: "left" }}>
        <div
          style={{
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #ddddddff",
            height: 65,
          }}
        >
          <Descriptions items={describeItems} />
        </div>
        


        <div style={{ marginTop: 24 }}>
          <Segmented
            block
            value={activeTab.key}
            options={tagItems.map((item) => ({ label: item.label, value: item.key }))}
            onChange={onTabChange}
            style={{width: '300px'}}
          />
          <div style={{ marginTop: 20 }}>
            {activeTab.children}
          </div>
        </div>
      </div>
    </>
  )
}
