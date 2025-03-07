import http from '../utils/http';
import { message } from 'antd';

export async function ReqAiAnalyze(params) {
    try {
        const response = await http('post', `/api/w8t/ai/chat`,params);
        return response;
    } catch (error) {
        message.open({
            type: 'error',
            content: `Ai 分析失败: ${error.message}`,
        });
        return error
    }
}
