import http from '../utils/http';
import { message } from 'antd';

async function FaultCenterList(params) {
    try {
        const res = await http('get', '/api/w8t/faultCenter/faultCenterList', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '故障中心列表获取失败',
        });
        return error
    }
}

async function FaultCenterSearch(params) {
    try {
        const res = await http('get', '/api/w8t/faultCenter/faultCenterSearch', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '故障中心详情获取失败',
        });
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
        message.open({
            type: 'error',
            content: `故障中心创建失败`,
        });
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
        message.open({
            type: 'error',
            content: `故障中心更新失败`,
        });
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
        message.open({
            type: 'error',
            content: `故障中心删除失败`,
        });
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
        message.open({
            type: 'error',
            content: `故障中心信息编辑失败`,
        });
        return error
    }
}

export {
    FaultCenterList,
    FaultCenterSearch,
    FaultCenterCreate,
    FaultCenterUpdate,
    FaultCenterDelete,
    FaultCenterReset
}