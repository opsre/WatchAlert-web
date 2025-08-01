import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getSilenceList(params) {
    try {
        const res = await http('get', '/api/w8t/silence/silenceList', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createSilence(params) {
    try {
        const res = await http('post', '/api/w8t/silence/silenceCreate', params);
        message.open({
            type: 'success',
            content: '静默规则创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateSilence(params) {
    try {
        const res = await http('post', '/api/w8t/silence/silenceUpdate', params);
        message.open({
            type: 'success',
            content: '静默规则更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteSilence(params) {
    try {
        const res = await http('post', `/api/w8t/silence/silenceDelete`, params);
        message.open({
            type: 'success',
            content: '静默规则删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getSilenceList,
    createSilence,
    updateSilence,
    deleteSilence
}