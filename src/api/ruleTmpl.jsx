import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getRuleTmplList(params) {
    try {
        const queryString = Object.keys(params)
            .map(key => params[key] !== undefined ? `${key}=${params[key]}` : '')
            .filter(Boolean)
            .join('&');
        const res = await http('get', `/api/w8t/ruleTmpl/ruleTmplList?${queryString}`);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createRuleTmpl(params) {
    try {
        const res = await http('post', `/api/w8t/ruleTmpl/ruleTmplCreate`, params);
        message.open({
            type: 'success',
            content: '规则模版创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateRuleTmpl(params) {
    try {
        const res = await http('post', `/api/w8t/ruleTmpl/ruleTmplUpdate`, params);
        message.open({
            type: 'success',
            content: '规则模版更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteRuleTmpl(params) {
    try {

        const res = await http('post', `/api/w8t/ruleTmpl/ruleTmplDelete`, params);
        message.open({
            type: 'success',
            content: '规则模版删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function getRuleTmplGroupList(params) {
    try {
        const res = await http('get', `/api/w8t/ruleTmplGroup/ruleTmplGroupList`, params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createRuleTmplGroup(params) {
    try {
        const res = await http('post', `/api/w8t/ruleTmplGroup/ruleTmplGroupCreate`, params);
        message.open({
            type: 'success',
            content: '规则模版组创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateRuleTmplGroup(params) {
    try {
        const res = await http('post', `/api/w8t/ruleTmplGroup/ruleTmplGroupUpdate`, params);
        message.open({
            type: 'success',
            content: '规则模版组更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteRuleTmplGroup(params) {
    try {
        const res = await http('post', `/api/w8t/ruleTmplGroup/ruleTmplGroupDelete`,params);
        message.open({
            type: 'success',
            content: '规则模版组删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getRuleTmplList,
    createRuleTmpl,
    updateRuleTmpl,
    deleteRuleTmpl,
    getRuleTmplGroupList,
    createRuleTmplGroup,
    updateRuleTmplGroup,
    deleteRuleTmplGroup
}