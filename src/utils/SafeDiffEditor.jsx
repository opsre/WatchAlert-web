import React, { useRef, useEffect } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import { Spin } from 'antd'

/**
 * 封装 Monaco DiffEditor，解决卸载时
 * "TextModel got disposed before DiffEditorWidget model got reset" 问题：
 * 手动在 DiffEditor unmount 前先将 originalModel/modifiedModel 置为 null，
 * 再让内部清理逻辑安全执行。
 */
const SafeDiffEditor = (props) => {
    const editorRef = useRef(null)

    const handleMount = (editor) => {
        editorRef.current = editor
    }

    // 组件卸载前：先清空 DiffEditor 的 model，避免 TextModel 被提前 dispose
    useEffect(() => {
        return () => {
            if (editorRef.current && !editorRef.current.isDisposed?.()) {
                try {
                    editorRef.current.setModel({ original: null, modified: null })
                } catch (_) {
                    // ignore
                }
            }
        }
    }, [])

    return (
        <DiffEditor
            {...props}
            onMount={handleMount}
            loading={
                props.loading ?? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <Spin tip="加载 Diff 编辑器..." />
                    </div>
                )
            }
        />
    )
}

export default SafeDiffEditor
