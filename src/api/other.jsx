import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getDashboardInfo(params) {
    try {
        const res = await http('get', '/api/system/getDashboardInfo', params);
        return res;
    } catch (error) {
        HandleApiError(error)
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
        HandleApiError(error)
        return error
    }
}

async function queryPromMetrics(params) {
    try {
        const res = await http('get', `/api/w8t/datasource/promQuery`, params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function queryRangePromMetrics(params) {
    try {
        const res = await http('get', `/api/w8t/datasource/promQueryRange`, params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

// API Key Management Functions
async function createAPIKey(params) {
    try {
        const res = await http('post', '/api/w8t/apikey/create', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateAPIKey(params) {
    try {
        const res = await http('post', '/api/w8t/apikey/update', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteAPIKey(params) {
    try {
        const res = await http('post', `/api/w8t/apikey/delete`, params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function listAPIKeys(params) {
    try {
        const res = await http('get', '/api/w8t/apikey/list', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getDashboardInfo,
    getJaegerService,
    queryPromMetrics,
    queryRangePromMetrics,
    createAPIKey,
    updateAPIKey,
    deleteAPIKey,
    listAPIKeys
}