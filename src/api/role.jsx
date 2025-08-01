import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getRoleList() {
    try {
        const res = await http('get', `/api/w8t/role/roleList`);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createRole(params) {
    try {
        const res = await http('post', `/api/w8t/role/roleCreate`, params);
        message.open({
            type: 'success',
            content: '角色创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateRole(params) {
    try {
        const res = await http('post', `/api/w8t/role/roleUpdate`, params);
        message.open({
            type: 'success',
            content: '角色更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteRole(params) {
    try {
        const res = await http('post', `/api/w8t/role/roleDelete`,params);
        message.open({
            type: 'success',
            content: '角色删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getRoleList,
    createRole,
    updateRole,
    deleteRole
}