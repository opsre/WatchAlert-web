import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function FaultCenterList(params) {
    try {
        const res = await http('get', '/api/w8t/faultCenter/faultCenterList', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function FaultCenterSearch(params) {
    try {
        const res = await http('get', '/api/w8t/faultCenter/faultCenterSearch', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function FaultCenterCreate(params) {
    try {
        const res = await http('post', '/api/w8t/faultCenter/faultCenterCreate', params);
        message.open({
            type: 'success',
            content: '故障中心创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function FaultCenterUpdate(params) {
    try {
        const res = await http('post', '/api/w8t/faultCenter/faultCenterUpdate', params);
        message.open({
            type: 'success',
            content: '故障中心更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function FaultCenterDelete(params) {
    try {
        const res = await http('post', '/api/w8t/faultCenter/faultCenterDelete', params);
        message.open({
            type: 'success',
            content: '故障中心删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function FaultCenterReset(params) {
    try {
        const res = await http('post', '/api/w8t/faultCenter/faultCenterReset', params);
        message.open({
            type: 'success',
            content: '故障中心信息编辑成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function FaultCenterSlo(params) {
    try {
        const res = await http('get', '/api/w8t/faultCenter/slo', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    FaultCenterList,
    FaultCenterSearch,
    FaultCenterCreate,
    FaultCenterUpdate,
    FaultCenterDelete,
    FaultCenterReset,
    FaultCenterSlo
}