import { useState } from 'react';
import { Editor } from '@monaco-editor/react'; // 假设使用 Monaco Editor

const VSCodeEditor = ({ value, onChange, language = 'json' }) => {
    const [height, setHeight] = useState('32px'); // 初始高度

    // 监听编辑器内容变化
    const handleEditorChange = (newValue) => {
        onChange(newValue); // 调用外部的 onChange

        // 根据内容行数动态调整高度
        const lineCount = newValue.split('\n').length;
        const newHeight = Math.min(Math.max(lineCount * 20, 50), 300); // 每行 20px，最小 50px，最大 300px
        setHeight(`${newHeight}px`);
    };

    return (
        <div
            style={{
                border: '1px solid #ccc', // 边框
                borderRadius: '8px', // 弧形边框
                overflow: 'hidden', // 确保内容不超出边框
                height: height,
            }}
        >
            <Editor
                height={height} // 动态高度
                defaultLanguage={language}
                defaultValue={value}
                onChange={handleEditorChange} // 绑定内容变化事件
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnType: true,
                    formatOnPaste: true,
                }}
            />
        </div>
    );
};

export default VSCodeEditor;