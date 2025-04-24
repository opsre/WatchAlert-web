import React, { useState, useEffect } from 'react';
import { Input, Descriptions, Tabs, Button } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import './index.css';
import {FaultCenterReset, FaultCenterSearch} from '../../api/faultCenter';
import { useParams } from 'react-router-dom';
import { AlertCurrentEvent } from '../event/currentEvent';
import { AlertHistoryEvent } from '../event/historyEvent';
import { Silences } from '../silence';
import {FaultCenterNotify} from "./notify";
import {AlarmUpgrade} from "./upgrade";

export const FaultCenterDetail = () => {
    const { id } = useParams();
    const [detail, setDetail] = useState({});
    const [editingField, setEditingField] = useState(null); // 当前正在编辑的字段
    const [tempValue, setTempValue] = useState(''); // 临时存储编辑的值

    useEffect(() => {
        handleList();
    }, []);

    const handleList = async () => {
        try {
            const params = { id };
            const res = await FaultCenterSearch(params);
            setDetail(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    // 进入编辑模式
    const handleEdit = (field) => {
        setEditingField(field);
        setTempValue(detail[field] || '');
    };

    // 保存编辑
    const handleSave = async (field) => {
        try {
            // 更新本地状态
            setDetail({ ...detail, [field]: tempValue });
            setEditingField(null);

            // 调用 API 保存到后端
            const params = {
                id: id,
                [field]: tempValue,
            }
            await FaultCenterReset(params);
        } catch (error) {
            console.error('保存失败:', error);
        }
    };

    // 取消编辑
    const handleCancel = () => {
        setEditingField(null);
    };

    const tagItems = [
        {
            key: '1',
            label: '当前告警',
            children: <AlertCurrentEvent id={id} />,
        },
        {
            key: '2',
            label: '历史告警',
            children: <AlertHistoryEvent id={id} />,
        },
        {
            key: '3',
            label: '降噪配置',
            children: <Silences faultCenterId={id} aggregationType={detail.aggregationType}/>,
        },
        {
            key: '4',
            label: '通知配置',
            children: <FaultCenterNotify id={id} />,
        },
        {
            key: '5',
            label: '告警升级',
            children: <AlarmUpgrade />,
        }
    ];

    const describeItems = [
        {
            key: '1',
            label: '名称',
            children: (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '-5px' }}>
                    {editingField === 'name' ? (
                        <>
                            <Input
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                style={{ width: '200px', marginRight: '8px' }}
                            />
                            <Button
                                type="text"
                                icon={<CheckOutlined />}
                                onClick={() => handleSave('name')}
                            />
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                            />
                        </>
                    ) : (
                        <>
                            {detail.name}
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit('name')}
                            />
                        </>
                    )}
                </div>
            ),
        },
        {
            key: '2',
            label: 'ID',
            children: detail.id,
        },
        {
            key: '3',
            label: '描述',
            children: (
                <div style={{ display: 'flex', alignItems: 'center', marginTop: '-5px' }}>
                    {editingField === 'description' ? (
                        <>
                            <Input
                                value={tempValue}
                                onChange={(e) => setTempValue(e.target.value)}
                                style={{ width: '200px', marginRight: '8px' }}
                            />
                            <Button
                                type="text"
                                icon={<CheckOutlined />}
                                onClick={() => handleSave('description')}
                            />
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={handleCancel}
                            />
                        </>
                    ) : (
                        <>
                            {detail.description || '-'}
                            <Button
                                type="text"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit('description')}
                            />
                        </>
                    )}
                </div>
            ),
        },
    ];

    return (
        <div style={{ textAlign: 'left' }}>
            <Descriptions title="基础信息" items={describeItems} />

            <br />

            <Tabs defaultActiveKey="1" items={tagItems} />
        </div>
    );
};