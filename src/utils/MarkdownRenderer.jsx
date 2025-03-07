import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'github-markdown-css/github-markdown.css';
import {Empty} from "antd";

// 自定义代码块渲染器
const CodeRenderer = ({ language, value }) => {
    return (
        <SyntaxHighlighter
            style={atomDark}
            language={language || 'text'}
            PreTag="div"
            wrapLines={true}
            customStyle={{
                backgroundColor: '#2d2d2d', // 代码块背景颜色
                borderRadius: '6px', // 圆角
                padding: '12px', // 内边距
                fontSize: '14px', // 字体大小
                margin: '1em 0', // 外边距
            }}
        >
            {value}
        </SyntaxHighlighter>
    );
};

// Markdown渲染组件
const MarkdownRenderer = ({ data }) => {
    const [markdown, setMarkdown] = useState('');

    useEffect(() => {
        if (!data) {
            setMarkdown('');
            return;
        }

        // 处理换行符
        const formattedData = data
            .replace(/\\\n/g, ' ') // 处理反斜杠换行
            .replace(/(\r\n|\r|\n)/g, '\n\n'); // 处理不同类型的换行符

        setMarkdown(formattedData);
    }, [data]);

    if (!data) {
        return (
            <div className="markdown-body" style={{ padding: '20px', backgroundColor: '#f9f9f9', textAlign: 'center' }}>
                <Empty
                    imageStyle={{ height: 80 }}
                    description={
                        <span style={{ color: '#666' }}>
                            暂无分析记录
                        </span>
                    }
                >
                </Empty>
            </div>
        );
    }

    return (
        <div
            className="markdown-body"
            style={{
                padding: '20px',
                backgroundColor: '#f9f9f9', // 灰色背景
                borderRadius: '8px', // 圆角
                color: '#333', // 默认字体颜色
                lineHeight: '1.6', // 行高
            }}
        >
            <ReactMarkdown
                components={{
                    // 自定义标题渲染
                    h1: ({ node, ...props }) => (
                        <h1
                            style={{
                                fontSize: '2em',
                                borderBottom: '2px solid #eaecef',
                                paddingBottom: '0.3em',
                                marginTop: '1.5em',
                                marginBottom: '0.5em',
                                color: '#222', // 标题颜色
                            }}
                            {...props}
                        />
                    ),
                    h2: ({ node, ...props }) => (
                        <h2
                            style={{
                                fontSize: '1.5em',
                                borderBottom: '1px solid #eaecef',
                                paddingBottom: '0.3em',
                                marginTop: '1em',
                                marginBottom: '0.5em',
                                color: '#222', // 标题颜色
                            }}
                            {...props}
                        />
                    ),
                    h3: ({ node, ...props }) => (
                        <h3
                            style={{
                                fontSize: '1.25em',
                                marginTop: '1em',
                                marginBottom: '0.5em',
                                color: '#222', // 标题颜色
                            }}
                            {...props}
                        />
                    ),
                    h4: ({ node, ...props }) => (
                        <h4
                            style={{
                                fontSize: '1em',
                                marginTop: '1em',
                                marginBottom: '0.5em',
                                color: '#222', // 标题颜色
                            }}
                            {...props}
                        />
                    ),
                    h5: ({ node, ...props }) => (
                        <h5
                            style={{
                                fontSize: '0.875em',
                                marginTop: '1em',
                                marginBottom: '0.5em',
                                color: '#222', // 标题颜色
                            }}
                            {...props}
                        />
                    ),
                    h6: ({ node, ...props }) => (
                        <h6
                            style={{
                                fontSize: '0.85em',
                                marginTop: '1em',
                                marginBottom: '0.5em',
                                color: '#222', // 标题颜色
                            }}
                            {...props}
                        />
                    ),
                    // 自定义段落渲染
                    p: ({ node, ...props }) => (
                        <p
                            style={{
                                lineHeight: '1.6',
                                marginTop: '1em',
                                marginBottom: '1em',
                                color: '#333', // 段落颜色
                            }}
                            {...props}
                        />
                    ),
                    // 自定义代码块渲染
                    code: ({ node, inline, className, children, ...props }) => {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <CodeRenderer language={match[1]} value={String(children).replace(/\n$/, '')} />
                        ) : (
                            <code
                                className={className}
                                style={{
                                    backgroundColor: '#2d2d2d', // 内联代码背景颜色
                                    color: '#f8f8f2', // 内联代码字体颜色
                                    padding: '2px 4px', // 内联代码内边距
                                    borderRadius: '4px', // 内联代码圆角
                                    fontSize: '14px', // 内联代码字体大小
                                }}
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },
                }}
            >
                {markdown}
            </ReactMarkdown>
        </div>
    );
};

export default MarkdownRenderer;