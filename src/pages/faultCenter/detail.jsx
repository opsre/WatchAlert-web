import React, { useState, useEffect } from 'react';
import { Input, Descriptions, Tabs, Button } from 'antd';
import { EditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import './index.css';
import { FaultCenterReset, FaultCenterSearch } from '../../api/faultCenter';
import { useParams, useNavigate, useLocation } from 'react-router-dom'; // 新增
import { AlertCurrentEvent } from '../event/currentEvent';
import { AlertHistoryEvent } from '../event/historyEvent';
import { Silences } from '../silence';
import { FaultCenterNotify } from "./notify";
import { AlarmUpgrade } from "./upgrade";

export const FaultCenterDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [detail, setDetail] = useState({});
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState('');

    // 解析 URL 中的 tab 参数，默认为 '1'
    const getInitialTabKey = () => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('tab') || '1';
    };

    const [activeTabKey, setActiveTabKey] = useState(getInitialTabKey);

    useEffect(() => {
        handleList();
    }, []);

    // 当 URL 的查询参数变化时更新 activeTabKey
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tabFromUrl = searchParams.get('tab');
        if (tabFromUrl) {
            setActiveTabKey(tabFromUrl);
        }
    }, [location.search]);

    const handleList = async () => {
        try {
            const params = { id };
            const res = await FaultCenterSearch(params);
            setDetail(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleEdit = (field) => {
        setEditingField(field);
        setTempValue(detail[field] || '');
    };

    const handleSave = async (field) => {
        try {
            setDetail({ ...detail, [field]: tempValue });
            setEditingField(null);

            const params = {
                id: id,
                [field]: tempValue,
            };
            await FaultCenterReset(params);
        } catch (error) {
            console.error('保存失败:', error);
        }
    };

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

    // Tab 切换回调函数
    const onTabChange = (key) => {
        setActiveTabKey(key);
        const searchParams = new URLSearchParams(location.search);
        searchParams.set('tab', key);
        navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
    };

    return (
        <div style={{ textAlign: 'left' }}>
            <Descriptions title="基础信息" items={describeItems} />

            <br />

            <Tabs
                activeKey={activeTabKey}
                defaultActiveKey="1"
                items={tagItems}
                onChange={onTabChange}
            />
        </div>
    );
};