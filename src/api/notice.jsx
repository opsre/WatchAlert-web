import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getNoticeList(params) {
    try {
        const res = await http('get', '/api/w8t/notice/noticeList', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createNotice(params) {
    try {
        const res = await http('post', '/api/w8t/notice/noticeCreate', params);
        message.open({
            type: 'success',
            content: '通知对象创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateNotice(params) {
    try {
        const res = await http('post', '/api/w8t/notice/noticeUpdate', params);
        message.open({
            type: 'success',
            content: '通知对象更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteNotice(params) {
    try {
        const res = await http('post', `/api/w8t/notice/noticeDelete`, params);
        message.open({
            type: 'success',
            content: '通知对象删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function noticeRecordList(params) {
    try {
        const res = await http('get', '/api/w8t/notice/noticeRecordList',params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function noticeRecordMetric() {
    try {
        const res = await http('get', '/api/w8t/notice/noticeRecordMetric');
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}


async function noticeTest(params) {
    try {
        const res = await http('post', '/api/w8t/notice/noticeTest', params);
        message.open({
            type: 'success',
            content: '测试消息发送成功!',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getNoticeList,
    createNotice,
    updateNotice,
    deleteNotice,
    noticeRecordList,
    noticeRecordMetric,
    noticeTest
}