import { useState, useRef, useEffect } from 'react';
import { Editor } from '@monaco-editor/react'; // 假设使用 Monaco Editor

const VSCodeEditor = ({ value, onChange, language = 'json' }) => {
    const [height, setHeight] = useState('32px'); // 初始高度
    const editorRef = useRef(null);
    const containerRef = useRef(null);

    // 初始化编辑器
    const handleEditorDidMount = (editor) => {
        editorRef.current = editor;
        updateHeight();
    };

    // 组件卸载时清理
    useEffect(() => {
        return () => {
            if (editorRef.current) {
                editorRef.current.dispose();
            }
        };
    }, []);

    // 精确计算编辑器高度
    const updateHeight = () => {
        const editor = editorRef.current;
        if (!editor) return;

        const lineHeight = editor.getOption(47); // 获取编辑器行高配置
        const lineCount = editor.getModel().getLineCount();
        const contentHeight = lineCount * lineHeight;

        // 考虑滚动条和容器的padding
        const containerStyle = window.getComputedStyle(containerRef.current);
        const padding = parseFloat(containerStyle.paddingTop) + parseFloat(containerStyle.paddingBottom);

        const newHeight = Math.min(
            Math.max(contentHeight + padding, 50), // 最小高度
            300 // 最大高度
        );

        setHeight(`${newHeight}px`);
    };

    // 使用ResizeObserver实现自适应
    useEffect(() => {
        const resizeObserver = new ResizeObserver(() => {
            if (editorRef.current) {
                editorRef.current.layout();
            }
        });

        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        return () => resizeObserver.disconnect();
    }, []);

    // 防抖处理变化事件
    const handleEditorChange = (newValue) => {
        onChange(newValue);
        requestAnimationFrame(updateHeight);
    };


    // 添加polyfill检查
    useEffect(() => {
        if (typeof window.ResizeObserver === 'undefined') {
            import('resize-observer-polyfill').then((module) => {
                window.ResizeObserver = module.default;
            });
        }
    }, []);


    // 添加加载状态
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    // 处理加载完成
    const handleLoad = () => {
        setIsLoading(false);
        setHasError(false);
    };

    // 处理加载错误
    const handleLoadError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    return (
        <div
            ref={containerRef}
            style={{
                border: '1px solid #ccc',
                borderRadius: '8px',
                overflow: 'hidden',
                minHeight: '50px',
                maxHeight: '300px',
                height: height,
                position: 'relative'
            }}
        >
            {isLoading && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255,255,255,0.8)'
                }}>
                    Loading editor...
                </div>
            )}

            {hasError && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#ffe6e6'
                }}>
                    Editor failed to load
                </div>
            )}

            <Editor
                height={height}
                language={language}
                value={value}
                onChange={handleEditorChange}
                onMount={handleEditorDidMount}
                beforeMount={handleLoad}
                onValidate={handleLoad}
                loading={<div>Loading editor...</div>}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    formatOnType: true,
                    formatOnPaste: true,
                    scrollbar: {
                        vertical: 'auto',
                        horizontal: 'auto',
                        useShadows: true
                    }
                }}
            />
        </div>
    );
};

export default VSCodeEditor;