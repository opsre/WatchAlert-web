import http from '../utils/http';
import { message } from 'antd';

async function getCurEventList(params) {
    try {
        const queryString = Object.keys(params)
            .map(key => params[key] !== undefined ? `${key}=${params[key]}` : '')
            .filter(Boolean)
            .join('&');
        const res = await http('get', `/api/w8t/event/curEvent?${queryString}`);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '当前告警列表获取失败',
        });
        return error
    }
}

async function getHisEventList(params) {
    try {
        const queryString = Object.keys(params)
            .map(key => params[key] !== undefined ? `${key}=${params[key]}` : '')
            .filter(Boolean)
            .join('&');

        const url = `/api/w8t/event/hisEvent?${queryString}`;
        const res = await http('get', url);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '历史告警列表获取失败',
        });
        return error
    }
}

async function ProcessAlertEvent(params) {
    return await http('post', `/api/w8t/event/processAlertEvent`,params);
}

export {
    getCurEventList,
    getHisEventList,
    ProcessAlertEvent
}