import {Button, Input, Table, Popconfirm, Divider, Layout, Menu} from 'antd';
import React, { useState, useEffect } from 'react';
import RuleTemplateGroupCreateModal from './RuleTemplateGroupCreateModal';
import {Link, useParams} from 'react-router-dom';
import { deleteRuleTmplGroup, getRuleTmplGroupList } from '../../../api/ruleTmpl';
import { ReactComponent as Metric } from "../assets/metric.svg";
import { ReactComponent as Log } from "../assets/log.svg";
import { ReactComponent as Trace } from "../assets/trace.svg";
import { ReactComponent as Event } from "../assets/event.svg";

const { Search } = Input;

export const RuleTemplateGroup = () => {
    const { tmplType } = useParams()
    const [selectedType, setSelectedType] = useState(tmplType)
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]);
    const [pagination, setPagination] = useState({
        index: 1,
        size: 10,
        total: 0,
    });

    // 表头
    const columns = [
        {
            title: '模版组名称',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link to={`/tmplType/${record.type}/${record.name}/templates`}>{text}</Link>
                    </div>
                </div>
            ),
        },
        {
            title: '模版数',
            dataIndex: 'number',
            key: 'number',
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            render: (text) => (!text ? '-' : text),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            width: 120,
            render: (_, record) =>
                list.length >= 1 ? (
                    <div>
                        <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record)}>
                            <a>删除</a>
                        </Popconfirm>

                        <Button
                            type="link" onClick={() => handleUpdateModalOpen(record)} >
                            更新
                        </Button>
                    </div>
                ) : null,
        },
    ];

    const [height, setHeight] = useState(window.innerHeight);

    useEffect(() => {
        setSelectedType(tmplType)

        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight);
        };

        // 监听窗口的resize事件
        window.addEventListener('resize', handleResize);

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleList = async () => {
        const params = {
            type: selectedType,
        }
        const res = await getRuleTmplGroupList(params);
        setList(res.data);
    };

    const handleDelete = async (record) => {
        const params = {
            name: record.name,
        };
        await deleteRuleTmplGroup(params);
        handleList();
    };

    useEffect(() => {
        handleList();
    }, [pagination.index, pagination.size, selectedType]);

    const handleModalClose = () => setVisible(false);

    const handleUpdateModalClose = () => setUpdateVisible(false);

    const onSearch = async (value) => {
        try {
            const params = {
                type: selectedType,
                index: pagination.index,
                size: pagination.size,
                query: value,
            }

            const res = await getRuleTmplGroupList(params)

            setPagination({
                index: res.data.index,
                size: res.data.size,
                total: res.data.total,
            });

            setList(res.data);
        } catch (error) {
            console.error(error)
        }
    }

    const menuItems = [
        {
            key: "Metrics",
            label: "Metrics",
            icon: <Metric style={{ height: "20px", width: "20px" }} />,
        },
        {
            key: "Logs",
            label: "Logs",
            icon: <Log style={{ height: "20px", width: "20px" }} />,
        },
        {
            key: "Traces",
            label: "Traces",
            icon: <Trace style={{ height: "20px", width: "20px" }} />,
        },
        {
            key: "Events",
            label: "Events",
            icon: <Event style={{ height: "20px", width: "20px" }} />,
        },
    ];

    // 处理菜单点击事件
    const handleClick = (e) => {
        const type = e.key; // 获取点击的类型
        setSelectedType(type)
        const pathname = `/tmplType/${type}/group`;
        window.history.pushState({}, "", pathname);
    };

    const handleUpdateModalOpen = (record) => {
        setUpdateVisible(true)
        setSelectedRow(record)
        console.log(record)
    }

    return (
        <div style={{display: 'flex'}}>
            <div style={{
                width: '200px' // 调整此处宽度以适应您的需求
            }}>
                <Layout.Sider
                    style={{
                        background: "white",
                        borderRadius: "8px",
                        marginLeft: "-10px",
                        marginTop: "-5px",
                    }}
                >
                    <Menu
                        onClick={handleClick}
                        mode="vertical"
                        style={{ border: "none", width: "180px" }}
                    >
                        {menuItems.map((item) => (
                            <Menu.Item key={item.key}>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "10px", // 间距调整
                                        fontSize: "14px", // 字体大小调整
                                    }}
                                >
                                    {item.icon}
                                    {item.label}
                                </div>
                            </Menu.Item>
                        ))}
                    </Menu>
                </Layout.Sider>
            </div>

            <div>
                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    {/* 树形分割线 */}
                    <Divider type="vertical" style={{
                        position: 'absolute',
                        marginTop: '160px',
                        marginLeft: '-13px',
                        height: '75%',
                    }}/>
                </div>

                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <div>
                        <Search
                            allowClear
                            placeholder="输入搜索关键字"
                            onSearch={onSearch}
                            style={{width: 300}}
                        />
                    </div>
                    <div>
                        <Button
                            type="primary"
                            onClick={() => setVisible(true)}
                            style={{
                                backgroundColor: '#000000'
                            }}
                        >
                            创建
                        </Button>
                    </div>
                </div>

                <div>
                    <RuleTemplateGroupCreateModal
                        visible={visible}
                        onClose={handleModalClose}
                        openType="create"
                        tmplType={selectedType}
                        handleList={handleList}/>
                    <RuleTemplateGroupCreateModal
                        visible={updateVisible}
                        onClose={handleUpdateModalClose}
                        tmplType={selectedType}
                        selectedRow={selectedRow}
                        openType="update"
                        handleList={handleList}/>
                </div>

                <div style={{ overflowX: 'auto', marginTop: 10 }}>
                    <Table
                        columns={columns}
                        dataSource={list}
                        scroll={{
                            y: height - 400, // 动态设置滚动高度
                            x: 'max-content', // 水平滚动
                        }}
                        bordered // 添加表格边框
                        style={{ backgroundColor: '#fff' }} // 设置表格背景色
                        rowKey={(record) => record.id} // 设置行唯一键
                    />
                </div>
            </div>
        </div>
    );
};
