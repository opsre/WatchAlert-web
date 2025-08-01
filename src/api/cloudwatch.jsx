import http from '../utils/http';
import {HandleApiError} from "../utils/lib";

async function getMetricTypes() {
    try {
        const res = await http('get', '/api/w8t/community/cloudwatch/metricTypes');
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function getMetricNames(params) {
    try {
        const res = await http('get', '/api/w8t/community/cloudwatch/metricNames?metricType='+params.metricType);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function getStatistics() {
    try {
        const res = await http('get', '/api/w8t/community/cloudwatch/statistics');
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function getDimensions(params) {
    try {
        const res = await http('get', '/api/w8t/community/cloudwatch/dimensions?metricType='+params.metricType);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function getRdsInstances(params) {
    try {
        const res = await http('get', '/api/w8t/community/rds/instances?datasourceId='+params.datasourceId);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

async function getRdsClusters(params) {
    try {
        const res = await http('get', '/api/w8t/community/rds/clusters?datasourceId='+params.datasourceId);
        return res;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}

export {
    getMetricTypes,
    getMetricNames,
    getStatistics,
    getDimensions,
    getRdsInstances,
    getRdsClusters
}