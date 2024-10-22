import React, { useState, useEffect } from 'react';
import { Button, Table, Popconfirm, message, Input } from 'antd';
import { CreateNoticeObjectModal } from './NoticeObjectCreateModal';
import { deleteNotice, getNoticeList, searchNotice } from '../../api/notice';
import { ReactComponent as FeiShuIcon } from './img/feishu.svg'
import { ReactComponent as DingdingIcon } from './img/dingding.svg'
import { ReactComponent as EmailIcon } from './img/Email.svg'

export const NoticeObjects = () => {
    const { Search } = Input
    const [selectedRow, setSelectedRow] = useState(null);
    const [updateVisible, setUpdateVisible] = useState(false);
    const [visible, setVisible] = useState(false);
    const [list, setList] = useState([]);
    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            width: 'auto',
        },
        {
            title: '通知类型',
            dataIndex: 'noticeType',
            key: 'noticeType',
            width: 'auto',
            render: (text, record) => {
                if (record.noticeType === 'FeiShu') {
                    return (
                       <div style={{display: 'flex'}}>
                           <FeiShuIcon style={{height: '25px', width: '25px'}}/>
                           <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>飞书</div>
                       </div>
                    )
                } else if (record.noticeType === 'DingDing') {
                    return (
                        <div style={{display: 'flex'}}>
                            <DingdingIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>钉钉</div>
                        </div>
                    )
                } else if (record.noticeType === 'Email') {
                    return (
                        <div style={{display: 'flex'}}>
                            <EmailIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>邮件</div>
                        </div>
                    )
                }
                return '-'
            },
        },
        {
            title: '值班表',
            dataIndex: 'dutyId',
            key: 'dutyId',
            width: 'auto',
            render: (text, record, index) => {
                if (!text) {
                    return '-';
                }
                return text;
            },
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 120,
            render: (_, record) =>
                list.length >= 1 ? (
                    <div>
                        <Popconfirm
                            title="Sure to delete?"
                            onConfirm={() => handleDelete(record)}>
                            <a>删除</a>
                        </Popconfirm>

                        <Button
                            type="link" onClick={() => handleUpdateModalOpen(record)}>
                            更新
                        </Button>
                    </div>
                ) : null,
        },
    ]

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

    useEffect(() => {
        handleList();
    }, []);

    const handleList = async () => {
        try {
            const res = await getNoticeList()
            setList(res.data);
        } catch (error) {
            message.error(error);
        }
    };

    const handleUpdateModalClose = () => {
        setUpdateVisible(false);
    };

    const handleUpdateModalOpen = (record) => {
        setSelectedRow(record);
        setUpdateVisible(true);
    };

    const handleDelete = async (record) => {
        try {
            const params = {
                uuid: record.uuid
            }
            await deleteNotice(params)
            handleList();
        } catch (error) {
            message.error(error);
        }
    };

    const handleModalClose = () => {
        setVisible(false);
    };

    const onSearch = async (value) => {
        try {
            const params = {
                query: value,
            }
            const res = await searchNotice(params)
            setList(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                    <Search allowClear placeholder="输入搜索关键字" onSearch={onSearch} style={{ width: 300 }} />
                </div>
                <div>
                    <Button type="primary" onClick={() => setVisible(true)}>
                        创建
                    </Button>
                </div>
            </div>

            <CreateNoticeObjectModal visible={visible} onClose={handleModalClose} type='create' handleList={handleList} />

            <CreateNoticeObjectModal visible={updateVisible} onClose={handleUpdateModalClose} selectedRow={selectedRow} type='update' handleList={handleList} />

            <div style={{ overflowX: 'auto', marginTop: 10, height: '71vh' }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        x: 1000,
                        y: height-400,
                    }}
                />
            </div>
        </>
    );
};