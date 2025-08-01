import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getNoticeTmplList(params) {
    try {
        const res = await http('get', '/api/w8t/noticeTemplate/noticeTemplateList', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createNoticeTmpl(params) {
    try {
        const res = await http('post', `/api/w8t/noticeTemplate/noticeTemplateCreate`, params);
        message.open({
            type: 'success',
            content: '通知模版创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateNoticeTmpl(params) {
    try {
        const res = await http('post', `/api/w8t/noticeTemplate/noticeTemplateUpdate`, params);
        message.open({
            type: 'success',
            content: '通知模版更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteNoticeTmpl(params) {
    try {
        const res = await http('post', `/api/w8t/noticeTemplate/noticeTemplateDelete`,params);
        message.open({
            type: 'success',
            content: '通知模版删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getNoticeTmplList,
    createNoticeTmpl,
    updateNoticeTmpl,
    deleteNoticeTmpl,
}