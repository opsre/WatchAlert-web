import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getDutyManagerList(params) {
    try {
        const res = await http('get', '/api/w8t/dutyManage/dutyManageList', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createDutyManager(params) {
    try {
        const res = await http('post', '/api/w8t/dutyManage/dutyManageCreate', params);
        message.open({
            type: 'success',
            content: '值班表创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateDutyManager(params) {
    try {
        const res = await http('post', '/api/w8t/dutyManage/dutyManageUpdate', params);
        message.open({
            type: 'success',
            content: '值班表更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteDutyManager(params) {
    try {
        const res = await http('post', `/api/w8t/dutyManage/dutyManageDelete`, params);
        message.open({
            type: 'success',
            content: '值班表删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createCalendar(params) {
    try {
        const res = await http('post', '/api/w8t/calendar/calendarCreate', params);
        message.open({
            type: 'success',
            content: '值班表发布成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateCalendar(params) {
    try {
        const res = await http('post', '/api/w8t/calendar/calendarUpdate', params);
        message.open({
            type: 'success',
            content: '值班表更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function searchCalendar(params) {
    try {
        const res = await http('get', '/api/w8t/calendar/calendarSearch', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function GetCalendarUsers(params) {
    try {
        const res = await http('get', '/api/w8t/calendar/getCalendarUsers', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getDutyManagerList,
    createDutyManager,
    updateDutyManager,
    deleteDutyManager,
    createCalendar,
    updateCalendar,
    searchCalendar,
    GetCalendarUsers
}