import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getSystemSetting() {
    try {
        const res = await http('get', '/api/w8t/setting/getSystemSetting');
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function saveSystemSetting(params) {
    try {
        const res = await http('post', '/api/w8t/setting/saveSystemSetting', params);
        message.open({
            type: 'success',
            content: '系统配置保存成功, 且立即生效!',
        });
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getSystemSetting,
    saveSystemSetting
}