import http from '../utils/http';
import { message } from 'antd';
import { HandleApiError } from "../utils/lib";

const baseAPI = "/api/w8t/prometheus"

// ==================== TargetGroup ====================

export async function PrometheusTargetGroupCreate(params) {
    try {
        const response = await http('post', `${baseAPI}/targetGroupCreate`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetGroupUpdate(params) {
    try {
        const response = await http('post', `${baseAPI}/targetGroupUpdate`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetGroupDelete(params) {
    try {
        const response = await http('post', `${baseAPI}/targetGroupDelete`, params);
        message.open({ type: 'success', content: '删除成功' });
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetGroupList(params) {
    try {
        const response = await http('get', `${baseAPI}/targetGroupList`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetGroupGet(params) {
    try {
        const response = await http('get', `${baseAPI}/targetGroupGet`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

// ==================== Service ====================

export async function PrometheusTargetCreate(params) {
    try {
        const response = await http('post', `${baseAPI}/targetCreate`, params);
        message.open({ type: 'success', content: '创建成功' });
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetUpdate(params) {
    try {
        const response = await http('post', `${baseAPI}/targetUpdate`, params);
        message.open({ type: 'success', content: '更新成功' });
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetDelete(params) {
    try {
        const response = await http('post', `${baseAPI}/targetDelete`, params);
        message.open({ type: 'success', content: '删除成功' });
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetList(params) {
    try {
        const response = await http('get', `${baseAPI}/targetList`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetGet(params) {
    try {
        const response = await http('get', `${baseAPI}/targetGet`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

// ==================== Version ====================

export async function PrometheusTargetVersionList(params) {
    try {
        const response = await http('get', `${baseAPI}/targetVersionList`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetVersionGet(params) {
    try {
        const response = await http('get', `${baseAPI}/targetVersionGet`, params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function PrometheusTargetVersionRollback(params) {
    try {
        const response = await http('post', `${baseAPI}/targetVersionRollback`, params);
        message.open({ type: 'success', content: '回滚成功' });
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}
