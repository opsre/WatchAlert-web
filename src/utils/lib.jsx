import moment from 'moment';
import {message, Tooltip} from "antd";
import React from "react";

export const HandleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

/**
 * 根据持续时长获取渐变颜色强度（用于黄橙红渐变）
 * 持续时长越长，强度越高，颜色越偏红。
 * @param {number} startTime 开始时间戳 (秒)
 * @param {number} [endTime] 结束时间戳 (秒)。如果未提供，则默认为当前时间。
 * @param {number} [maxDuration = 7200] 定义最大持续时长阈值 (秒)，默认为 2 小时 (7200 秒)。
 * @returns {{intensity: number}} 包含强度值 (0-1之间) 的对象
 */
export const GetDurationGradient = (startTime, endTime = Math.floor(Date.now() / 1000), maxDuration = 7200) => {
    // 如果 endTime 未提供 (undefined 或 null)，则使用当前时间
    const actualEndTime = endTime === undefined || endTime === null
        ? Math.floor(Date.now() / 1000)
        : endTime;

    // 将秒级时间戳转换为 moment 对象
    const startMoment = moment.unix(startTime);
    const endMoment = moment.unix(actualEndTime);

    // 计算实际持续时间（秒）
    const durationInSeconds = endMoment.diff(startMoment, 'seconds');

    // 将实际持续时间归一化到 0-1 之间
    // 使用 Math.min 确保强度值不会超过 1
    const normalizedDuration = Math.min(durationInSeconds / maxDuration, 1);

    return {
        intensity: normalizedDuration,
    };
};

// 获取方块颜色
export const GetBlockColor = (blockIndex, totalBlocks, intensity) => {
    const blockProgress = blockIndex / (totalBlocks - 1)

    if (blockProgress > intensity) {
        return "#e8e8e8" // 未激活的灰色
    }

    // 根据方块位置计算颜色（黄橙红）
    if (blockProgress <= 0.5) {
        // 黄色到橙色
        const red = 255
        const green = Math.floor(255 - blockProgress * 2 * 90) // 255 -> 165
        return `rgb(${red}, ${green}, 0)`
    } else {
        // 橙色到红色
        const red = 255
        const green = Math.floor(165 - (blockProgress - 0.5) * 2 * 165) // 165 -> 0
        return `rgb(${red}, 0, 0)`
    }
}

/**
 * 格式化持续时长
 * @param {number} startTime 开始时间戳 (秒)
 * @param {number} [endTime] 结束时间戳 (秒)。如果未提供，则默认为当前时间。
 * @returns {string} 格式化后的持续时长字符串
 */
export const FormatDuration = (startTime, endTime = Math.floor(Date.now() / 1000)) => {
    // 如果 endTime 未提供 (undefined 或 null)，则使用当前时间
    const actualEndTime = endTime === undefined || endTime === null
        ? Math.floor(Date.now() / 1000)
        : endTime;


    // 将秒级时间戳转换为 moment 对象
    const startMoment = moment.unix(startTime);
    const endMoment = moment.unix(actualEndTime);

    // 计算持续时间
    const duration = moment.duration(endMoment.diff(startMoment));

    const days = Math.floor(duration.asDays()); // 获取总天数
    const hours = duration.hours();             // 获取小时部分 (0-23)
    const minutes = duration.minutes();         // 获取分钟部分 (0-59)
    const seconds = duration.seconds();         // 获取秒钟部分 (0-59)

    let result = [];

    if (days > 0) {
        result.push(`${days}天`);
    }
    // 只有当有天数或小时数大于0时才显示小时，或者如果这是最大的单位
    if (days > 0 || hours > 0 || result.length === 0) {
        result.push(`${hours}小时`);
    }
    // 只有当有天、小时或分钟大于0时才显示分钟，或者如果这是最大的单位
    if (days > 0 || hours > 0 || minutes > 0 || result.length === 0) {
        result.push(`${minutes}分`);
    }
    // 始终显示秒，除非持续时间为0且没有其他单位
    if (seconds > 0 || result.length === 0) {
        result.push(`${seconds}秒`);
    }

    // 处理持续时间不足1秒的情况
    if (duration.asSeconds() < 1 && result.length === 0) {
        return "不足1秒";
    }

    return result.join(' ');
};

export const RenderTruncatedText = (text) => (
    <Tooltip title={text}>
        <div
            style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '200px', // Adjust as needed to control truncation
            }}
        >
            {text}
        </div>
    </Tooltip>
);

/**
 * 统一处理 API 请求的 catch 错误。
 * 它会尝试从错误对象中提取具体的错误信息，并使用 Ant Design 的 message.error 提示用户。
 *
 * @param {Error} error 捕获到的错误对象。
 * @param {string} [prefixMessage="错误"] 可选，在错误信息前显示的前缀消息。
 */
export const HandleApiError = (error, prefixMessage = "错误") => {
    let errorMessage = "未知错误"; // Default fallback message

    // Check if it's an Axios response error and if response.data exists
    if (error.response && error.response.data) {
        // --- THIS IS THE KEY CHANGE ---
        // Only proceed to display a message if response.data.msg is exactly "failed"
        if (error.response.data.msg === "failed") {
            // Prefer the detailed error from 'data' if available
            if (error.response.data.data) {
                errorMessage = error.response.data.data;
            } else {
                // Fallback to the 'msg' itself if 'data' is missing but 'msg' is "failed"
                errorMessage = error.response.data.msg;
            }
            // Display the error message using Ant Design's message component
            message.error(`${prefixMessage}：${errorMessage}`);
            return; // Exit the function after displaying the message for a "failed" case
        }
    }
};

// 格式化时间显示
export const FormatTime = (timestampInSeconds) => {
    // 将秒级时间戳转换为毫秒级
    const date = new Date(timestampInSeconds * 1000);

    return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};
