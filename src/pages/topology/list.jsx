import React, { useState, useEffect, useCallback, useParams } from 'react';
import { Table, Card, Button, Popconfirm, Tag, message, Modal, Form, Input, Tooltip } from 'antd';
import { Link } from 'react-router-dom'
import { EditOutlined, CheckOutlined, CloseOutlined } from "@ant-design/icons"
import { CopyOutlined, DeleteOutlined,PlusOutlined } from '@ant-design/icons';
import { copyToClipboard } from "../../utils/copyToClipboard";
import { TopologyList, TopologyDelete, TopologyCreate, TopologyUpdate } from '../../api/topology';
import { TableWithPagination } from '../../utils/TableWithPagination';
import { HandleShowTotal } from "../../utils/lib";
import { Breadcrumb } from "../../components/Breadcrumb";


const List = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState(null)
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [tempValue, setTempValue] = useState("")
  const [hoveredRecordId, setHoveredRecordId] = useState(null)
  // 从 sessionStorage 恢复页码状态
  const getStoredPagination = useCallback(() => {
      const stored = sessionStorage.getItem(`topology_pagination`)
      if (stored) {
          try {
              return JSON.parse(stored)
          } catch (e) {
              console.error('Failed to parse stored pagination:', e)
          }
      }
      return { index: 1, size: 10, total: 0 }
  }, [])

  const savePaginationToStorage = useCallback((newPagination) => {
    sessionStorage.setItem(`topology_pagination`, JSON.stringify(newPagination))
  }, [])

  const updatePagination = useCallback((newPagination) => {
    setPagination(newPagination)
    savePaginationToStorage(newPagination)
  }, [savePaginationToStorage])

  const [pagination, setPagination] = useState(() => getStoredPagination())
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleList = useCallback(async (index, size) => {
    setLoading(true);
    try {
        const params = {
            index: index,
            size: size,
        }
        const res = await TopologyList(params)
        const newPagination = {
            index: res.data.index,
            size: res.data.size,
            total: res.data.total,
        }
        updatePagination(newPagination)
        setData(res.data.list)
    } catch (error) {
        console.error(error)
    } finally {
      setLoading(false);
    }
  }, [updatePagination])

  useEffect(() => {
    handleList(pagination.index, pagination.size);
  }, []);

  const handleDelete = (record) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除 "${record.name}" 吗？此操作不可恢复。`,
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          await TopologyDelete({ id: record.id });
          handleList(pagination.index, pagination.size);
        } catch (error) {
          console.error('删除失败:', error);
        }
      },
    });
  };

  // 显示创建拓扑的模态框
  const showModal = () => {
    setIsModalVisible(true);
  };

  // 处理模态框取消
  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  // 处理编辑取消
  const handleEditCancel = () => {
    setEditingField(null);
    setEditingRecordId(null);
    setTempValue("");
  };

  // 处理创建拓扑
  const handleCreate = async (values) => {
    try {
      const res = await TopologyCreate({ name: values.name });
      if (res.code === 200) {
        setIsModalVisible(false);
        form.resetFields();
        handleList(1, pagination.size); // 创建后返回第一页
      }
    } catch (error) {
      console.error('创建失败:', error);
    }
  };

  const columns = [
    {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        render: (text, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div 
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
                onMouseEnter={() => setHoveredRecordId(record.id)}
                onMouseLeave={() => setHoveredRecordId(null)}
            >
                {editingField === "name" && editingRecordId === record.id ? (
                  <>
                    <Input
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      style={{ width: "200px", marginRight: "8px" }}
                      onPressEnter={() => handleSave("name", record.id)}
                      autoFocus
                    />
                    <Button 
                      type="text" 
                      icon={<CheckOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSave("name", record.id);
                      }} 
                    />
                    <Button 
                      type="text" 
                      icon={<CloseOutlined />} 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCancel();
                      }} 
                    />
                  </>
                ) : (
                  <>
                    <Link
                        to={`/topology/${record.id}/detail`}
                        style={{
                            color: "#1677ff",
                        }}
                    >
                        {text}
                    </Link>
                    {hoveredRecordId === record.id && (
                        <Button 
                          type="text" 
                          icon={<EditOutlined style={{height: "12px", width: "12px"}}/>} 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit("name", record.id, text);
                          }}
                          style={{ 
                            marginTop: "-5px",
                            opacity: 0.7,
                            transition: "opacity 0.2s ease",
                            height: "25px"
                          }}
                        />
                    )}
                  </>
                )}
            </div>
            <Tooltip title="点击复制 ID">
                <span
                    style={{
                        color: '#8c8c8c',     // 灰色字体
                        fontSize: '12px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        display: 'inline-block',
                        maxWidth: '200px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                    onClick={() => copyToClipboard(record.id)}
                >
                    {record.id}
                    <CopyOutlined style={{ marginLeft: 8 }} />
                </span>
            </Tooltip>
        </div>
        ),
    },
    {
        title: '更新时间',
        dataIndex: 'updatedAt',
        key: 'updatedAt',
        render: (text) => {
            const date = new Date(text * 1000)
                return (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{date.toLocaleString()}</span>
                    </div>
                )
        },
    },
    {
        title: '操作人',
        dataIndex: 'updatedBy',
        key: 'updatedBy',
        render: (text) => {
            return <Tag style={{
                            borderRadius: "12px",
                            padding: "0 10px",
                            fontSize: "12px",
                            fontWeight: "500",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                        }}
                    >
                        {text || "未知用户"}
                    </Tag>
        },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Tooltip title="删除">
            <Popconfirm
                title="确定要删除吗?"
                onConfirm={() => handleDelete(record)}
                okText="确定"
                cancelText="取消"
                placement="left"
            >
                <Button type="text" icon={<DeleteOutlined />} style={{ color: "#ff4d4f" }} />
            </Popconfirm>
        </Tooltip>
      ),
    },
  ];

  const handleEdit = (field, recordId, indexValue) => {
    setEditingField(field);
    setEditingRecordId(recordId);
    setTempValue(indexValue || "");
  };

  const handleSave = async (field, recordId) => {
    try {
      if (!tempValue.trim()) {
        message.error('名称不能为空');
        return;
      }

      const params = {
        id: recordId,
        [field]: tempValue.trim(),
      };
      
      const res = await TopologyUpdate(params);
      if (res.code === 200) {
        setEditingField(null);
        setEditingRecordId(null);
        setTempValue("");
        handleList(pagination.index, pagination.size); // 重新加载数据
      }
    } catch (error) {
      console.error("保存失败:", error);
      message.error('保存失败');
    }
  };

  return (
    <>
      <Breadcrumb items={['服务拓扑']} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
                type="primary" 
                onClick={showModal}
                style={{
                    backgroundColor: '#000000'
                }}
                icon={<PlusOutlined />}
            >
                创建
            </Button>       
        </div>
        <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <TableWithPagination
                columns={columns}
                dataSource={data}
                loading={loading}
                pagination={pagination}
                onPageChange={(page, size) => {
                    const newPagination = { ...pagination, index: page, size: size }
                    updatePagination(newPagination)
                    handleList(page, size);
                }}
                onsizeChange={(index, size) => {
                    const newPagination = { ...pagination, index: index, size: size }
                    updatePagination(newPagination)
                    handleList(index, size);
                }}
                scrollY={'calc(100vh - 300px)'}
                rowKey="id"
                showTotal={HandleShowTotal}
                selectAll={true}
            />
        </div>


        {/* 创建拓扑的模态框 */}
        <Modal
            title="创建拓扑"
            open={isModalVisible}
            onOk={form.submit}
            onCancel={handleModalCancel}
            okText="创建"
            cancelText="取消"
        >
            <Form
            form={form}
            layout="vertical"
            onFinish={handleCreate}
            >
            <Form.Item
                name="name"
                label="拓扑名称"
                rules={[{ required: true, message: '请输入拓扑名称' }]}
            >
                <Input placeholder="请输入拓扑名称" />
            </Form.Item>
            </Form>
        </Modal>
    </>
  );
};

export default List;