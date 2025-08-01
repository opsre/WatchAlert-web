import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

async function getPermissionsList() {
    try {
        const res = await http('get', `/api/w8t/permissions/permsList`);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getPermissionsList
}