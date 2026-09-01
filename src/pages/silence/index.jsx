import React, { useState, useEffect } from 'react';
import { 
  Typography, 
  Radio, 
  Table, 
  Popconfirm, 
  Menu, 
  Modal, 
  Tag,
  Space,
  Button,
  Empty,
  Tooltip,
  Input,
  Select
} from 'antd';  // 添加 Empty 组件
import { CreateSilenceModal } from './SilenceRuleCreateModal';
import { deleteSilence, getSilenceList } from '../../api/silence';
import {
    BellOutlined,
    DeleteOutlined,
    ExclamationCircleOutlined,
    MoreOutlined, 
    PauseCircleOutlined,
    PlusOutlined,
    SearchOutlined // 添加搜索图标
} from "@ant-design/icons";
import "../alert/rule/index.css";
import { FaultCenterList } from "../../api/faultCenter";
import {HandleShowTotal} from "../../utils/lib";
import { Breadcrumb } from "../../components/Breadcrumb";

const { Title } = Typography
const { Search } = Input
const { confirm } = Modal;

export const Silences = () => {
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]); // 初始化list为空数组
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    });
    const [searchText, setSearchText] = useState(''); // 添加搜索文本状态
    const [height, setHeight] = useState(window.innerHeight)
    const [selectStatus, setSelectStatus] = useState("1")
    const [faultCenters, setFaultCenters] = useState([])
    const [selectedFaultCenter, setSelectedFaultCenter] = useState(undefined)

    const fetchFaultCenters = async () => {
        try {
            const res = await FaultCenterList()
            setFaultCenters(res?.data || [])
        } catch (error) {
            console.error("获取故障中心列表失败:", error)
        }
    }

    useEffect(() => {
        fetchFaultCenters()
    }, [])

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        // 监听窗口的resize事件
        window.addEventListener("resize", handleResize)

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        handleList();
    }, [pagination.index, pagination.size]);

    // 获取所有数据
    const handleList = async ({ status = selectStatus, query = searchText, pageIndex = pagination.index } = {}) => {
        try {
            const params = {
                index: pageIndex,
                size: pagination.size,
                faultCenterId: selectedFaultCenter || undefined,
                query: query || undefined,
                status,
            };

            setLoading(true);
            const res = await getSilenceList(params);
            setLoading(false);

            const sortedList = res?.data?.list?.sort((a, b) => {
                return new Date(b.update_at) - new Date(a.update_at);
            });

            setPagination({
                index: res?.data?.index,
                size: res?.data?.size,
                total: res?.data?.total,
            });

            setList(sortedList);
        } catch (error) {
            console.error(error);
        }
    };

    // 处理分页变化
    const handlePageChange = (page, pageSize) => {
        setPagination({
            ...pagination,
            index: page,
            size: pageSize,
        });
    };

    const handleDelete = async (record) => {
        try {
            const params = {
                faultCenterId: record.faultCenterId || record.fault_center_id || selectedFaultCenter,
                id: record.id,
                name: record.name,
            };
            await deleteSilence(params);
            handleList(); // 重新加载当前页数据
        } catch (error) {
            console.error(error);
        }
    };

    // 关闭窗口
    const handleModalClose = () => {
        setVisible(false);
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
        setSelectedRow(null); // 清除选中行
    };


    // 格式化时间
    const formatDate = (timestamp) => {
        const date = new Date(timestamp * 1000); // 将秒转换为毫秒
        const year = date.getFullYear(); // 获取年份
        const month = date.getMonth() + 1; // 获取月份（0-11，需要加1）
        const day = date.getDate(); // 获取日期
        const hours = date.getHours(); // 获取小时
        const minutes = date.getMinutes(); // 获取分钟

        // 补零函数，确保月份、日期、小时、分钟、秒为两位数
        const padZero = (num) => (num < 10 ? `0${num}` : num);

        // 返回格式化后的时间字符串
        return `${year}-${padZero(month)}-${padZero(day)} ${padZero(hours)}:${padZero(minutes)}`;
    };

    // 显示删除确认弹窗
    const showDeleteConfirm = (record) => {
        confirm({
            title: '确认删除',
            icon: <ExclamationCircleOutlined />,
            content: `确定删除静默规则 ${record.name} 吗？`,
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                handleDelete(record);
            },
        });
    };

    // 三个点的下拉菜单
    const renderMenu = (record) => (
        <Menu>
            <Menu.Item
                key="delete"
                icon={<DeleteOutlined />}
                onClick={(e) => {
                    e.domEvent.stopPropagation(); // 阻止事件冒泡
                    showDeleteConfirm(record); // 显示删除确认弹窗
                }}
            >
                删除
            </Menu.Item>
        </Menu>
    );

    // 表格列定义
    const columns = [
        {
            title: '规则名称',
            dataIndex: 'name',
            key: 'name',
            width: '15%',
            render: (text, record) => (
                <Space>
                    <span 
                        style={{ 
                            cursor: 'pointer', 
                            color: '#1890ff',
                        }}
                        onClick={() => {
                            setSelectedRow(record);
                            setUpdateVisible(true);
                        }}
                    >
                        {text}
                    </span>
                </Space>
            ),
        },
        {
            title: '标签',
            key: 'labels',
            width: '30%',
            render: (_, record) => {
                const labels = record.labels || [];
                return (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                        {labels.map((label, index) => (
                            <Tag 
                                key={index}
                                color="blue"
                                style={{
                                    margin: 0,
                                    fontSize: '10px',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {label.key}{label.operator}{label.value}
                            </Tag>
                        ))}
                    </div>
                );
            },
        },
        {
            title: '时间范围',
            key: 'timeRange',
            width: '20%',
            render: (_, record) => (
                <div>
                    <span style={{ fontSize: '12px', color: '#999' }}>{formatDate(record.startsAt)}</span> <span style={{ fontSize: '12px', color: '#999' , marginRight: '8px' }}>~ {formatDate(record.endsAt)}</span>
                </div>
            ),
        },
        {
            title: '操作人',
            key: 'updateInfo',
            width: '13%',
            render: (_, record) => (
                <>
                    <div>
                        <span>{record.updateBy}</span>
                    </div>
                    <div>
                        <span style={{ fontSize: '11px', color: '#999' }}>{formatDate(record.updateAt)}</span>
                    </div>
                </>
            ),
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: '5%',
            render: (status) => (
                <Tag 
                    color={status === 1 ? 'success' : 'default'}
                    style={{
                        borderRadius: '12px',
                        padding: '0 10px',
                        fontSize: '12px',
                        fontWeight: '500'
                    }}
                >
                    {status === 1 ? '启用' : '失效'}
                </Tag>
            ),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            width: '5%',
            fixed: 'right',
            render: (_, record) =>
                list.length >= 1 ? (
                    <Space size="middle">
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
                    </Space>
                ) : null,
        },
    ];

    // 处理搜索
    const handleSearch = (value) => {
        setSearchText(value);
        setPagination((current) => ({
            ...current,
            index: 1,
        }));
        handleList({ query: value, pageIndex: 1 });
    };

    const changeStatus = ({ target: { value } }) => {
        setSelectStatus(value)
        setPagination((current) => ({
            ...current,
            index: 1,
        }))
        handleList({ status: value, pageIndex: 1 })
    }

    return (
        <div>
            <Breadcrumb items={['通知管理', '通知对象']} />            
            <div style={{ 
                display: 'flex', 
                marginBottom: '16px',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    <Radio.Group
                        options={[
                            { label: "全部", value: "all" },
                            { label: "未生效", value: "0" },
                            { label: "生效中", value: "1" },
                            { label: "已失效", value: "2" },
                        ]}
                        value={selectStatus}
                        onChange={changeStatus}
                        optionType="button"
                    />
                    <Search
                        placeholder="搜索规则名称"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        onSearch={handleSearch}
                        style={{ 
                            marginLeft: '10px',
                            width: '300px',
                        }}
                        allowClear
                        prefix={<SearchOutlined />}
                    />
                </div>
                <Button 
                    type="primary" 
                    icon={<PlusOutlined />}
                    onClick={() => setVisible(true)}
                    style={{ 
                        backgroundColor: '#000',
                        borderColor: '#000'
                    }}
                >
                    添加新规则
                </Button>
            </div>

            <div style={{ display: 'flex' }}>
                <CreateSilenceModal visible={visible} onClose={handleModalClose} type='create' handleList={handleList} faultCenterId={selectedFaultCenter} />

                <CreateSilenceModal visible={updateVisible} onClose={handleUpdateModalClose} selectedRow={selectedRow}
                                    type='update' handleList={handleList} faultCenterId={selectedRow?.faultCenterId || selectedRow?.fault_center_id || selectedFaultCenter} />
            </div>

            <div style={{
                borderRadius: "8px",
                border: "1px solid #f0f0f0"
            }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    loading={loading}
                    scroll={{ y: height - 250 }}
                    pagination={{
                        current: pagination.index,
                        pageSize: pagination.size,
                        total: pagination.total,
                        onChange: handlePageChange,
                        showSizeChanger: true,
                        showTotal: HandleShowTotal,
                        pageSizeOptions: ["10", "20", "50"],
                    }}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                    rowKey={(record) => record.id}
                    locale={{
                        emptyText: (
                            <Empty 
                                description="暂无静默规则" 
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )
                    }}
                />
            </div>
        </div>
    );
};