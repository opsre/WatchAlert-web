import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function TopologyList() {
    try {
        const res = await http('get', `/api/w8t/topology/list`);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function TopologyGetDetail(params) {
    try {
        const res = await http('get', `/api/w8t/topology/getDetail`, params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function TopologyCreate(params) {
    try {
        const res = await http('post', `/api/w8t/topology/create`, params);
        message.open({
            type: 'success',
            content: '创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function TopologyUpdate(params) {
    try {
        const res = await http('post', `/api/w8t/topology/update`, params);
        message.open({
            type: 'success',
            content: '更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function TopologyDelete(params) {
    try {
        const res = await http('post', `/api/w8t/topology/delete`,params);
        message.open({
            type: 'success',
            content: '删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    TopologyList,
    TopologyGetDetail,
    TopologyCreate,
    TopologyUpdate,
    TopologyDelete
}