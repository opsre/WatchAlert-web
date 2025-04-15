import {Button, Input, Table, Popconfirm, Space, Tooltip} from 'antd';
import React, { useState, useEffect } from 'react';
import NoticeTemplateCreateModal from './NoticeTemplateCreateModal';
import { getNoticeTmplList, deleteNoticeTmpl, searchNoticeTmpl } from '../../../api/noticeTmpl';
import { ReactComponent as FeiShuIcon } from '../img/feishu.svg';
import { ReactComponent as DingdingIcon } from '../img/dingding.svg';
import { ReactComponent as EmailIcon } from '../img/Email.svg';
import { ReactComponent as WeChatIcon } from '../img/qywechat.svg'
import {DeleteOutlined, EditOutlined} from "@ant-design/icons";

const { Search } = Input;

export const NoticeTemplate = () => {
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]);

    // 表头
    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
        },
        {
            title: '模版类型',
            dataIndex: 'noticeType',
            key: 'noticeType',
            width: 'auto',
            render: (text, record) => {
                if (record.noticeType === 'FeiShu') {
                    return (
                        <div style={{ display: 'flex' }}>
                            <FeiShuIcon style={{ height: '25px', width: '25px' }} />
                            <div style={{ marginLeft: '5px', marginTop: '5px', fontSize: '12px' }}>飞书</div>
                        </div>
                    );
                } else if (record.noticeType === 'DingDing') {
                    return (
                        <div style={{ display: 'flex' }}>
                            <DingdingIcon style={{ height: '25px', width: '25px' }} />
                            <div style={{ marginLeft: '5px', marginTop: '5px', fontSize: '12px' }}>钉钉</div>
                        </div>
                    );
                } else if (record.noticeType === 'Email') {
                    return (
                        <div style={{ display: 'flex' }}>
                            <EmailIcon style={{ height: '25px', width: '25px' }} />
                            <div style={{ marginLeft: '5px', marginTop: '5px', fontSize: '12px' }}>邮件</div>
                        </div>
                    );
                }  else if (record.noticeType === 'WeChat') {
                    return (
                        <div style={{ display: 'flex' }}>
                            <WeChatIcon style={{ height: '25px', width: '25px' }} />
                            <div style={{ marginLeft: '5px', marginTop: '5px', fontSize: '12px' }}>企业微信</div>
                        </div>
                    );
                }
                return '-';
            },
        },
        {
            title: '描述',
            dataIndex: 'description',
            key: 'description',
            width: 'auto',
            render: (text) => (!text ? '-' : text),
        },
        {
            title: '操作',
            dataIndex: 'operation',
            width: 120,
            fixed: 'right',
            render: (_, record) =>
                list.length >= 1 ? (
                    <Space size="middle">
                        <Tooltip title="更新">
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleUpdateModalOpen(record)}
                                style={{ color: "#1677ff" }}
                            />
                        </Tooltip>
                        <Tooltip title="删除">
                            <Popconfirm
                                title="确定要删除此模版组吗?"
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

    const [height, setHeight] = useState(window.innerHeight);

    useEffect(() => {
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
        const res = await getNoticeTmplList();
        setList(res.data);
    };

    const handleDelete = async (record) => {
        const params = {
            id: record.id,
        };
        await deleteNoticeTmpl(params);
        handleList();
    };

    const handleModalClose = () => {
        setVisible(false);
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
    };

    const handleUpdateModalOpen = (record) => {
        setSelectedRow(record);
        setUpdateVisible(true);
    };

    useEffect(() => {
        handleList();
    }, []);

    const onSearch = async (value) => {
        try {
            const params = {
                query: value,
            };
            const res = await searchNoticeTmpl(params);
            setList(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Search
                        allowClear
                        placeholder="输入搜索关键字"
                        onSearch={onSearch}
                        style={{ width: 300 }}
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

            <NoticeTemplateCreateModal visible={visible} onClose={handleModalClose} type="create" handleList={handleList} />

            <NoticeTemplateCreateModal
                visible={updateVisible}
                onClose={handleUpdateModalClose}
                selectedRow={selectedRow}
                type="update"
                handleList={handleList}
            />

            <div style={{ overflowX: 'auto', marginTop: 10}}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        y: height - 350, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
                    }}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                    rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                    rowKey={(record) => record.id} // 设置行唯一键
                />
            </div>
        </>
    );
};
