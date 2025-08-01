import http from '../utils/http';
import {HandleApiError} from "../utils/lib";

async function listAuditLog(params) {
    try {
        const queryString = Object.keys(params)
            .map(key => params[key] !== undefined ? `${key}=${params[key]}` : '')
            .filter(Boolean)
            .join('&');
        const res = await http('get', `/api/w8t/auditLog/listAuditLog?${queryString}`);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function searchAuditLog(params) {
    try {
        const queryString = Object.keys(params)
            .map(key => params[key] !== undefined ? `${key}=${params[key]}` : '')
            .filter(Boolean)
            .join('&');

        const res = await http('get', `/api/w8t/auditLog/searchAuditLog?${queryString}`);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    listAuditLog,
    searchAuditLog
}