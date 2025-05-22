import {message} from "antd";

export const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
        () => {
            message.success('ID 已复制到剪贴板');
        },
        () => {
            message.error('复制失败');
        }
    );
};