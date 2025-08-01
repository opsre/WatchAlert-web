import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getDatasourceList(params) {
    try {
        const res = await http('get', '/api/w8t/datasource/dataSourceList', params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function getDatasource(params) {
    try {
        const queryString = Object.keys(params)
            .map(key => params[key] !== undefined ? `${key}=${params[key]}` : '')
            .filter(Boolean)
            .join('&');
        const res = await http('get', `/api/w8t/datasource/dataSourceGet?${queryString}`);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function createDatasource(params) {
    try {
        const res = await http('post', '/api/w8t/datasource/dataSourceCreate', params);
        message.open({
            type: 'success',
            content: '数据源创建成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function updateDatasource(params) {
    try {
        const res = await http('post', '/api/w8t/datasource/dataSourceUpdate', params);
        message.open({
            type: 'success',
            content: '数据源更新成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function deleteDatasource(params) {
    try {
        const res = await http('post', `/api/w8t/datasource/dataSourceDelete`, params);
        message.open({
            type: 'success',
            content: '数据源删除成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function DatasourcePing(params) {
    try {
        const res = await http('post', `/api/w8t/datasource/dataSourcePing`, params);
        message.open({
            type: 'success',
            content: '数据源测试通过',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function ElasticSearchData(params) {
    try {
        const res = await http('post', `/api/w8t/datasource/esSearch`, params);
        message.open({
            type: 'success',
            content: '查询ES内容成功',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function SearchViewLogsContent(params) {
    try {
        const res = await http('post', `/api/w8t/datasource/searchViewLogsContent`, params);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getDatasourceList,
    createDatasource,
    updateDatasource,
    deleteDatasource,
    getDatasource,
    DatasourcePing,
    ElasticSearchData,
    SearchViewLogsContent
}