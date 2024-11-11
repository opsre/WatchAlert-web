import http from '../utils/http';
import { message } from 'antd';

async function getRuleList(params) {
    try {
        const res = await http('get', `/api/w8t/rule/ruleList`, params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '规则获取失败',
        });
        return error
    }
}

async function createRule(params) {
    try {
        const res = await http('post', '/api/w8t/rule/ruleCreate', params);
        message.open({
            type: 'success',
            content: '创建规则成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '创建规则失败',
        });
        return error
    }
}

async function updateRule(params) {
    try {
        const res = await http('post', '/api/w8t/rule/ruleUpdate', params);
        message.open({
            type: 'success',
            content: '规则更新成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '规则更新失败',
        });
        return error
    }
}

async function deleteRule(params) {
    try {
        const res = await http('post', `/api/w8t/rule/ruleDelete`, params);
        message.open({
            type: 'success',
            content: '规则删除成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '规则删除失败',
        });
        return error
    }
}

async function searchRuleInfo(params) {
    try {
        const res = await http('get', `/api/w8t/rule/ruleSearch`, params);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '规则信息查询失败',
        });
        return error
    }
}

async function getRuleGroupList(params) {
    try {
        const headers = {
            'TenantID': 'xxxxxxxxx'
        }
        const res = await http('get', '/api/w8t/ruleGroup/ruleGroupList', params, headers);
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '规则组列表获取失败',
        });
        return error
    }
}

async function createRuleGroup(params) {
    try {
        const res = await http('post', '/api/w8t/ruleGroup/ruleGroupCreate', params);
        message.open({
            type: 'success',
            content: '规则组创建成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '创建规则组失败',
        });
        return error
    }
}

async function updateRuleGroup(params) {
    try {
        const res = await http('post', '/api/w8t/ruleGroup/ruleGroupUpdate', params);
        message.open({
            type: 'success',
            content: '规则组更新成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '规则组更新失败',
        });
        return error
    }
}

async function deleteRuleGroup(params) {
    try {
        const res = await http('post', `/api/w8t/ruleGroup/ruleGroupDelete`,params);
        message.open({
            type: 'success',
            content: '规则组删除成功',
        });
        return res;
    } catch (error) {
        message.open({
            type: 'error',
            content: '规则组删除失败',
        });
        return error
    }
}

export {
    getRuleList,
    createRule,
    updateRule,
    deleteRule,
    searchRuleInfo,
    getRuleGroupList,
    createRuleGroup,
    updateRuleGroup,
    deleteRuleGroup,
} 