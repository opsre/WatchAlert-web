import http from '../utils/http';
import { message } from 'antd';

async function getAllUsers(params) {
    try {
        const res = await http('get', '/api/w8t/user/searchDutyUser', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '获取用户信息失败',
        });
        return error
    }
}

async function getDashboardInfo(params) {
    try {
        const res = await http('get', '/api/system/getDashboardInfo', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '获取仪表盘数据失败',
        });
        return error
    }
}

async function getJaegerService(params) {
    try {
        const queryString = Object.keys(params)
            .map(key => params[key] !== undefined ? `${key}=${params[key]}` : '')
            .filter(Boolean)
            .join('&');
        const res = await http('get', `/api/w8t/c/getJaegerService?${queryString}`);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '获取Jaeger服务列表失败',
        });
        return error
    }
}

async function queryPromMetrics(params) {
    try {
        const res = await http('get', `/api/w8t/datasource/promQuery`, params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '查询Metrics失败',
        });
        return error
    }
}

export {
    getAllUsers,
    getDashboardInfo,
    getJaegerService,
    queryPromMetrics
}