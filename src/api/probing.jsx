import http from '../utils/http';
import { message } from 'antd';

async function ProbingList(params) {
    try {
        const res = await http('get', '/api/w8t/probing/listProbing', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '拨测列表获取失败',
        });
        return error
    }
}

async function ProbingSearch(params) {
    try {
        const res = await http('get', '/api/w8t/probing/searchProbing', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '拨测规则信息获取失败',
        });
        return error
    }
}

async function ProbingCreate(params) {
    try {
        const res = await http('post', '/api/w8t/probing/createProbing', params);
        message.open({
            type: 'success',
            content: '拨测规则创建成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '拨测规则创建失败',
        });
        return error
    }
}

async function ProbingUpdate(params) {
    try {
        const res = await http('post', '/api/w8t/probing/updateProbing', params);
        message.open({
            type: 'success',
            content: '拨测规则更新成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '拨测规则更新失败',
        });
        return error
    }
}

async function ProbingDelete(params) {
    try {
        const res = await http('post', '/api/w8t/probing/deleteProbing', params);
        message.open({
            type: 'success',
            content: '拨测规则删除成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '拨测规则删除失败',
        });
        return error
    }
}

async function ProbingOnce(params) {
    try {
        const res = await http('post', '/api/w8t/probing/onceProbing', params);
        message.open({
            type: 'success',
            content: '拨测请求提交成功!',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '拨测请求提交失败!',
        });
        return error
    }
}

export {
    ProbingList,
    ProbingSearch,
    ProbingCreate,
    ProbingUpdate,
    ProbingDelete,
    ProbingOnce
}