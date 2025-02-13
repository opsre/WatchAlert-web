import { Calendar, Divider, Button } from 'antd';
import React, { useState, useEffect } from 'react';
import { CreateCalendarModal } from './CreateCalendar';
import { UpdateCalendarModal } from './UpdateCalendar';
import { searchCalendar } from '../../../api/duty';
import {useParams} from "react-router-dom";
import './index.css'

export const fetchDutyData = async (dutyId) => {
    try {
        const params = {
            dutyId: dutyId,
        }
        const res = await searchCalendar(params)
        const data = await res.data
        return data
    } catch (error) {
        console.error(error)
    }
}

export const CalendarApp = ({ tenantId }) => {
    const url = new URL(window.location);
    const calendarName = url.searchParams.get('calendarName');
    const { id } = useParams()
    const [dutyData, setDutyData] = useState([])
    const [createCalendarModal, setCreateCalendarModal] = useState(false)
    const [selectedDate, setSelectedDate] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const run = async () => {
        try {
            const data = await fetchDutyData(id)
            setDutyData(data)
        } catch (error) {
            console.error('Error:', error)
        }
    }

    useEffect(() => {
        run()
    }, [])

    const dateCellRender = (value) => {
        const matchingDutyData = dutyData.find((item) => {
            const itemDate = new Date(item.time)
            return (
                itemDate.getFullYear() === value.year() &&
                itemDate.getMonth() === value.month() &&
                itemDate.getDate() === value.date()
            )
        })

        if (matchingDutyData) {
            return (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {dateFullCellRender(value)}
                    </div>
                    <div
                        style={{marginTop: '10px', textAlign: 'center', cursor: 'pointer',}}
                        onClick={handleClick}
                    >
                        {matchingDutyData.username}
                    </div>
                </>

            );
        }

        return null
    }

    const handleClick = (record) => {
        const m = record.month();
        const month = m + 1
        const year = record.year();

        setSelectedDate(`${year}-${month.toString()}-${record.date().toString()}`);
        setModalVisible(true);
    };

    const handleUpdateModalClose = () => {
        setModalVisible(false)
    }

    const handleModalClose = () => {
        setCreateCalendarModal(false)
    }

    const dateFullCellRender = (date) => {
        const day = date.day();
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][day]; // 星期几的文本

        return (
            <div>
                <div>{`周${weekday}`}</div>
            </div>
        );
    };

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

    return (
        <div style={{
            textAlign: 'left',
            width: '100%',
            alignItems: 'flex-start',
            height:height-210,
            overflowY:'auto',
            marginTop:'-15px'
        }}>
            <div style={{position: 'relative',overflowY: "auto",height: '830px'}}>
                <div style={{position: 'absolute', width: '100%',marginTop:'3px'}}>
                    <Button
                        type="primary"
                        style={{
                            backgroundColor: '#000000'
                        }}
                        onClick={() => setCreateCalendarModal(true)}
                    >
                        发布日程
                    </Button>
                    <div style={{textAlign: 'center',marginTop:'-45px'}}>
                        <h3>日程表名称：{calendarName}</h3>
                    </div>
                </div>

                <CreateCalendarModal visible={createCalendarModal} onClose={handleModalClose} dutyId={id}/>
                <Divider/>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginTop: '-60px',
                }}>
                    <Calendar
                        onChange={handleClick}
                        cellRender={dateCellRender}
                        fullscreen={true}
                    />
                </div>
            </div>


            <UpdateCalendarModal visible={modalVisible} onClose={handleUpdateModalClose} time={selectedDate}
                                 tenantId={tenantId} dutyId={id} date={selectedDate}/>

        </div>
    )
}