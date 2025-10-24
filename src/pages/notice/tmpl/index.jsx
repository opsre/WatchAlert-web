import {Button, Input, Table, Popconfirm, Space, Tooltip, Tag} from 'antd';
import React, { useState, useEffect } from 'react';
import NoticeTemplateCreateModal from './NoticeTemplateCreateModal';
import { getNoticeTmplList, deleteNoticeTmpl } from '../../../api/noticeTmpl';
import { ReactComponent as FeiShuIcon } from '../img/feishu.svg';
import { ReactComponent as DingdingIcon } from '../img/dingding.svg';
import { ReactComponent as EmailIcon } from '../img/Email.svg';
import { ReactComponent as WeChatIcon } from '../img/qywechat.svg'
import { ReactComponent as SlackIcon } from '../img/slack.svg'
import {CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined} from "@ant-design/icons";
import {copyToClipboard} from "../../../utils/copyToClipboard";
import {HandleShowTotal} from "../../../utils/lib";

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
            render: (text, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {text}
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
                }  else if (record.noticeType === 'Slack') {
                    return (
                        <div style={{ display: 'flex' }}>
                            <SlackIcon style={{ height: '25px', width: '25px' }} />
                            <div style={{ marginLeft: '5px', marginTop: '5px', fontSize: '12px' }}>Slack</div>
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
            title: "更新时间",
            dataIndex: "updateAt",
            key: "updateAt",
            width: "auto",
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
            title: "更新人",
            dataIndex: "updateBy",
            key: "updateBy",
            width: "auto",
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
                                title="确定要删除此模版吗?"
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
            const res = await getNoticeTmplList(params);
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
                        icon={<PlusOutlined />}
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
                        y: height - 280, // 动态设置滚动高度
                        x: 'max-content', // 水平滚动
                    }}
                    style={{
                        backgroundColor: "#fff",
                        borderRadius: "8px",
                        overflow: "hidden",
                    }}
                    pagination={{
                        showTotal: HandleShowTotal,
                        pageSizeOptions: ['10'],
                    }}
                    rowKey={(record) => record.id} // 设置行唯一键
                />
            </div>
        </>
    );
};
