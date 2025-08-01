import http from '../utils/http';
import {HandleApiError} from "../utils/lib";

export async function ReqAiAnalyze(params) {
    try {
        const response = await http('post', `/api/w8t/ai/chat`,params);
        return response;
    } catch (error) {
        HandleApiError(error)
        return error
    }
}
