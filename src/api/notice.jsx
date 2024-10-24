import http from '../utils/http';
import { message } from 'antd';

async function getNoticeList(params) {
    try {
        const res = await http('get', '/api/w8t/notice/noticeList', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '通知对象列表获取失败',
        });
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
        message.open({
            type: 'error',
            content: '通知对象创建失败',
        });
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
        message.open({
            type: 'error',
            content: '通知对象更新失败',
        });
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
        message.open({
            type: 'error',
            content: '通知对象删除失败',
        });
        return error
    }
}

async function searchNotice(params) {
    try {
        const res = await http('get', '/api/w8t/notice/noticeSearch', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '搜索通知对象失败',
        });
        return error
    }
}

async function noticeRecordList(params) {
    try {
        const res = await http('get', '/api/w8t/notice/noticeRecordList',params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '获取通知记录列表失败',
        });
        return error
    }
}

async function noticeRecordMetric() {
    try {
        const res = await http('get', '/api/w8t/notice/noticeRecordMetric');
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '获取通知记录指标失败',
        });
        return error
    }
}

export {
    getNoticeList,
    createNotice,
    updateNotice,
    deleteNotice,
    searchNotice,
    noticeRecordList,
    noticeRecordMetric
}