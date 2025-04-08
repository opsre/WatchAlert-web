import React, { useState, useEffect } from 'react';
import {Button, Table, Popconfirm, message, Input, Tag} from 'antd';
import { CreateNoticeObjectModal } from './NoticeObjectCreateModal';
import { deleteNotice, getNoticeList, searchNotice } from '../../api/notice';
import { ReactComponent as FeiShuIcon } from './img/feishu.svg'
import { ReactComponent as DingdingIcon } from './img/dingding.svg'
import { ReactComponent as EmailIcon } from './img/Email.svg'
import { ReactComponent as WeChatIcon } from './img/qywechat.svg'
import { ReactComponent as CustomHookIcon } from './img/customhook.svg'
import {getDutyManagerList} from "../../api/duty";

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
                } else if (record.noticeType === 'WeChat') {
                    return (
                        <div style={{display: 'flex'}}>
                            <WeChatIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>企业微信</div>
                        </div>
                    )
                } else if (record.noticeType === 'CustomHook') {
                    return (
                        <div style={{display: 'flex'}}>
                            <CustomHookIcon style={{height: '25px', width: '25px'}}/>
                            <div style={{marginLeft: "5px",marginTop: '5px', fontSize:'12px' }}>自定义Hook</div>
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
            render: (text, record) => (
                <span>
                  {getDutyNameById(record.dutyId)
                      .split(", ")
                      .map((name, index) => (
                          <Tag color="processing" key={index}>
                              {name}
                          </Tag>
                      ))}
                </span>
            ),
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
    const [dutyList, setDutyList] = useState([])

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
        handleDutyManagerList()

        try {
            const res = await getNoticeList()
            setList(res.data);
        } catch (error) {
            message.error(error);
        }
    };

    const handleDutyManagerList = async () => {
        try {
            const res = await getDutyManagerList()
            setDutyList(res.data);
        } catch (error) {
            message.error(error);
        }
    };

    const getDutyNameById = (id) =>{
        const datasource = dutyList.find((d) => d.id === id)
        return datasource ? datasource.name : "-"
    }

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

            <CreateNoticeObjectModal visible={visible} onClose={handleModalClose} type='create' handleList={handleList} />

            <CreateNoticeObjectModal visible={updateVisible} onClose={handleUpdateModalClose} selectedRow={selectedRow} type='update' handleList={handleList} />

            <div style={{ overflowX: 'auto', marginTop: 10, height: '71vh' }}>
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
        </>
    );
};