import http from '../utils/http';
import { message } from 'antd';

async function getFolderList(params?: any) {
    try {
        const res = await http('get', '/api/w8t/dashboard/listFolder', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '文件夹列表获取失败',
        });
        return error
    }
}

async function getFolderInfo(params?: any) {
    try {
        const res = await http('get', '/api/w8t/dashboard/getFolder', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '文件夹信息获取失败',
        });
        return error
    }
}

async function createDashboardFolder(params) {
    try {
        const res = await http('post', '/api/w8t/dashboard/createFolder', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '文件夹创建失败',
        });
        return error
    }
}

async function deleteDashboardFolder(params) {
    try {
        const res = await http('post', '/api/w8t/dashboard/deleteFolder', params);
        message.open({
            type: 'success',
            content: '文件夹删除成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '文件夹删除失败',
        });
        return error
    }
}

async function updateDashboardFolder(params) {
    try {
        const res = await http('post', '/api/w8t/dashboard/updateFolder', params);
        message.open({
            type: 'success',
            content: '文件夹更新成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '文件夹更新失败',
        });
        return error
    }
}

async function getGrafanaDashboardList(params?: any) {
    try {
        const res = await http('get', '/api/w8t/dashboard/listGrafanaDashboards', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: 'Grafana仪表盘列表获取失败',
        });
        return error
    }
}

async function getDashboardFullUrl(params?: any) {
    try {
        const res = await http('get', '/api/w8t/dashboard/getDashboardFullUrl', params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: 'Grafana仪表盘完整URL获取失败',
        });
        return error
    }
}

export {
    getFolderList,
    getFolderInfo,
    createDashboardFolder,
    updateDashboardFolder,
    deleteDashboardFolder,
    getGrafanaDashboardList,
    getDashboardFullUrl,
}