import http from '../utils/http';
import { message } from 'antd';
import {HandleApiError} from "../utils/lib";

const recordingRuleGroupBaseAPI = "/api/w8t/recordingRuleGroup"
const recordingRuleBaseAPI = "/api/w8t/recordingRule"

export async function RecordingRuleGroupCreate(params) {
    try {
        const response = await http('post', `${recordingRuleGroupBaseAPI}/recordingRuleGroupCreate`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleGroupUpdate(params) {
    try {
        const response = await http('post', `${recordingRuleGroupBaseAPI}/recordingRuleGroupUpdate`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleGroupDelete(params) {
    try {
        const response = await http('post', `${recordingRuleGroupBaseAPI}/recordingRuleGroupDelete`,params);
        message.open({
            type: 'success',
            content: '删除成功',
        });
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleGroupList(params) {
    try {
        const response = await http('get', `${recordingRuleGroupBaseAPI}/recordingRuleGroupList`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleGroupGet(params) {
    try {
        const response = await http('get', `${recordingRuleGroupBaseAPI}/recordingRuleGroupGet`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleCreate(params) {
    try {
        const response = await http('post', `${recordingRuleBaseAPI}/recordingRuleCreate`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleUpdate(params) {
    try {
        const response = await http('post', `${recordingRuleBaseAPI}/recordingRuleUpdate`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleDelete(params) {
    try {
        const response = await http('post', `${recordingRuleBaseAPI}/recordingRuleDelete`,params);
        message.open({
            type: 'success',
            content: '删除成功',
        });
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleChangeStatus(params) {
    try {
        const response = await http('post', `${recordingRuleBaseAPI}/recordingRuleChangeStatus`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleList(params) {
    try {
        const response = await http('get', `${recordingRuleBaseAPI}/recordingRuleList`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export async function RecordingRuleGet(params) {
    try {
        const response = await http('get', `${recordingRuleBaseAPI}/recordingRuleGet`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}