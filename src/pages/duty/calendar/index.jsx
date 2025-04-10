import { Calendar, Divider, Button, message } from 'antd';
import React, { useState, useEffect, useCallback } from 'react';
import { CreateCalendarModal } from './CreateCalendar';
import { UpdateCalendarModal } from './UpdateCalendar';
import { searchCalendar } from '../../../api/duty';
import { useParams } from "react-router-dom";
import './index.css';

export const fetchDutyData = async (dutyId, year, month) => {
    try {
        const params = {
            dutyId: dutyId,
            ...(year && month && {
                year,
                month: month + 1 // 后端通常期望月份是1-12
            })
        };
        const res = await searchCalendar(params);
        return res.data;
    } catch (error) {
        console.error(error);
        message.error('获取日程数据失败');
        return [];
    }
};

export const CalendarApp = ({ tenantId }) => {
    const url = new URL(window.location);
    const calendarName = url.searchParams.get('calendarName');
    const { id } = useParams();
    const [dutyData, setDutyData] = useState([]);
    const [createCalendarModal, setCreateCalendarModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [height, setHeight] = useState(window.innerHeight);

    const fetchData = useCallback(async () => {
        try {
            const data = await fetchDutyData(id, currentYear, currentMonth);
            setDutyData(data);
        } catch (error) {
            console.error('Error:', error);
            message.error('加载数据失败');
        }
    }, [id, currentYear, currentMonth]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const handleResize = () => setHeight(window.innerHeight);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handlePanelChange = (date) => {
        const year = date.year();
        const month = date.month();
        setCurrentYear(year);
        setCurrentMonth(month);
    };

    const dateCellRender = (value) => {
        const matchingDutyData = dutyData.find((item) => {
            const itemDate = new Date(item.time);
            return (
                itemDate.getFullYear() === value.year() &&
                itemDate.getMonth() === value.month() &&
                itemDate.getDate() === value.date()
            );
        });

        return (
            <div
                onDoubleClick={() => handleDoubleClick(value)}
                style={{
                    height: '100%',
                    width: '100%',
                    cursor: 'pointer' // 添加指针样式提示可点击
                }}
            >
                {matchingDutyData && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            {dateFullCellRender(value)}
                        </div>
                        <div style={{ marginTop: '10px', textAlign: 'center' }}>
                            {matchingDutyData.username}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const handleDoubleClick = (date) => {
        if (!dutyData.some(item => {
            const itemDate = new Date(item.time);
            return (
                itemDate.getFullYear() === date.year() &&
                itemDate.getMonth() === date.month() &&
                itemDate.getDate() === date.date()
            );
        })) {
            return; // 如果没有数据则不处理
        }

        const formattedDate = `${date.year()}-${(date.month() + 1)
            .toString()
            .padStart(2, '0')}-${date.date()
            .toString()
            .padStart(2, '0')}`;

        setSelectedDate(formattedDate);
        setModalVisible(true);
    };

    const dateFullCellRender = (date) => {
        const day = date.day();
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][day];
        return <div>{`周${weekday}`}</div>;
    };

    return (
        <div style={{
            textAlign: 'left',
            width: '100%',
            alignItems: 'flex-start',
            height: height - 210,
            overflowY: 'auto',
            marginTop: '-10px'
        }}>
            <div style={{ position: 'relative', overflowY: "auto", height: '830px' }}>
                <div style={{ position: 'absolute', width: '100%', marginTop: '3px' }}>
                    <Button
                        type="primary"
                        style={{ backgroundColor: '#000000' }}
                        onClick={() => setCreateCalendarModal(true)}
                    >
                        发布日程
                    </Button>
                    <div style={{ textAlign: 'center', marginTop: '-45px' }}>
                        <h3>日程表名称：{calendarName}</h3>
                    </div>
                </div>

                <CreateCalendarModal
                    visible={createCalendarModal}
                    onClose={() => setCreateCalendarModal(false)}
                    dutyId={id}
                    onSuccess={fetchData}
                />

                <Divider />
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '-60px',
                }}>
                    <Calendar
                        onPanelChange={handlePanelChange}
                        cellRender={dateCellRender}
                        fullscreen={true}
                    />
                </div>
            </div>

            <UpdateCalendarModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSuccess={fetchData}
                time={selectedDate}
                tenantId={tenantId}
                dutyId={id}
                date={selectedDate}
            />
        </div>
    );
};