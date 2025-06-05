"use client"

import { useRef } from "react"
import Editor from "@monaco-editor/react"

const SqlEditor = ({ value = "", onChange = (value) => {}, height = "50px", readOnly = false }) => {
    const editorRef = useRef(null)

    // SQL 关键词和建议
    const sqlSuggestions = [
        // 基本 SQL 关键词
        { label: "SELECT", insertText: "SELECT ", detail: "查询数据" },
        { label: "FROM", insertText: "FROM ", detail: "指定表名" },
        { label: "WHERE", insertText: "WHERE ", detail: "条件筛选" },
        { label: "ORDER BY", insertText: "ORDER BY ", detail: "排序" },
        { label: "GROUP BY", insertText: "GROUP BY ", detail: "分组" },
        { label: "HAVING", insertText: "HAVING ", detail: "分组条件" },
        { label: "LIMIT", insertText: "LIMIT ", detail: "限制结果数量" },
        { label: "OFFSET", insertText: "OFFSET ", detail: "跳过行数" },

        // DML 语句
        { label: "INSERT INTO", insertText: "INSERT INTO ", detail: "插入数据" },
        { label: "VALUES", insertText: "VALUES ", detail: "插入值" },
        { label: "UPDATE", insertText: "UPDATE ", detail: "更新数据" },
        { label: "SET", insertText: "SET ", detail: "设置值" },
        { label: "DELETE", insertText: "DELETE ", detail: "删除数据" },

        // DDL 语句
        { label: "CREATE TABLE", insertText: "CREATE TABLE ", detail: "创建表" },
        { label: "ALTER TABLE", insertText: "ALTER TABLE ", detail: "修改表" },
        { label: "DROP TABLE", insertText: "DROP TABLE ", detail: "删除表" },
        { label: "CREATE INDEX", insertText: "CREATE INDEX ", detail: "创建索引" },

        // JOIN 操作
        { label: "INNER JOIN", insertText: "INNER JOIN ", detail: "内连接" },
        { label: "LEFT JOIN", insertText: "LEFT JOIN ", detail: "左连接" },
        { label: "RIGHT JOIN", insertText: "RIGHT JOIN ", detail: "右连接" },
        { label: "FULL JOIN", insertText: "FULL JOIN ", detail: "全连接" },
        { label: "ON", insertText: "ON ", detail: "连接条件" },

        // 逻辑操作符
        { label: "AND", insertText: "AND ", detail: "逻辑与" },
        { label: "OR", insertText: "OR ", detail: "逻辑或" },
        { label: "NOT", insertText: "NOT ", detail: "逻辑非" },
        { label: "IN", insertText: "IN ", detail: "包含于" },
        { label: "NOT IN", insertText: "NOT IN ", detail: "不包含于" },
        { label: "LIKE", insertText: "LIKE ", detail: "模糊匹配" },
        { label: "BETWEEN", insertText: "BETWEEN ", detail: "范围查询" },
        { label: "IS NULL", insertText: "IS NULL", detail: "为空" },
        { label: "IS NOT NULL", insertText: "IS NOT NULL", detail: "不为空" },

        // 聚合函数
        { label: "COUNT", insertText: "COUNT(", detail: "计数函数" },
        { label: "SUM", insertText: "SUM(", detail: "求和函数" },
        { label: "AVG", insertText: "AVG(", detail: "平均值函数" },
        { label: "MIN", insertText: "MIN(", detail: "最小值函数" },
        { label: "MAX", insertText: "MAX(", detail: "最大值函数" },
        { label: "DISTINCT", insertText: "DISTINCT ", detail: "去重" },

        // 字符串函数
        { label: "CONCAT", insertText: "CONCAT(", detail: "字符串连接" },
        { label: "SUBSTRING", insertText: "SUBSTRING(", detail: "字符串截取" },
        { label: "LENGTH", insertText: "LENGTH(", detail: "字符串长度" },
        { label: "UPPER", insertText: "UPPER(", detail: "转大写" },
        { label: "LOWER", insertText: "LOWER(", detail: "转小写" },
        { label: "TRIM", insertText: "TRIM(", detail: "去除空格" },

        // 日期函数
        { label: "NOW", insertText: "NOW()", detail: "当前时间" },
        { label: "CURRENT_DATE", insertText: "CURRENT_DATE", detail: "当前日期" },
        { label: "CURRENT_TIME", insertText: "CURRENT_TIME", detail: "当前时间" },
        { label: "DATE", insertText: "DATE(", detail: "日期函数" },

        // 数据类型
        { label: "VARCHAR", insertText: "VARCHAR(", detail: "可变长字符串" },
        { label: "CHAR", insertText: "CHAR(", detail: "固定长字符串" },
        { label: "TEXT", insertText: "TEXT", detail: "文本类型" },
        { label: "INTEGER", insertText: "INTEGER", detail: "整数类型" },
        { label: "INT", insertText: "INT", detail: "整数类型" },
        { label: "BIGINT", insertText: "BIGINT", detail: "大整数类型" },
        { label: "DECIMAL", insertText: "DECIMAL(", detail: "精确数值类型" },
        { label: "FLOAT", insertText: "FLOAT", detail: "浮点数类型" },
        { label: "BOOLEAN", insertText: "BOOLEAN", detail: "布尔类型" },
        { label: "DATE", insertText: "DATE", detail: "日期类型" },
        { label: "TIMESTAMP", insertText: "TIMESTAMP", detail: "时间戳类型" },

        // 约束
        { label: "PRIMARY KEY", insertText: "PRIMARY KEY", detail: "主键约束" },
        { label: "FOREIGN KEY", insertText: "FOREIGN KEY", detail: "外键约束" },
        { label: "UNIQUE", insertText: "UNIQUE", detail: "唯一约束" },
        { label: "NOT NULL", insertText: "NOT NULL", detail: "非空约束" },
        { label: "DEFAULT", insertText: "DEFAULT ", detail: "默认值" },
        { label: "CHECK", insertText: "CHECK(", detail: "检查约束" },

        // 常用表名
        { label: "users", insertText: "users", detail: "用户表" },
        { label: "orders", insertText: "orders", detail: "订单表" },
        { label: "products", insertText: "products", detail: "产品表" },
        { label: "customers", insertText: "customers", detail: "客户表" },

        // 常用字段名
        { label: "id", insertText: "id", detail: "主键ID" },
        { label: "name", insertText: "name", detail: "名称字段" },
        { label: "email", insertText: "email", detail: "邮箱字段" },
        { label: "created_at", insertText: "created_at", detail: "创建时间" },
        { label: "updated_at", insertText: "updated_at", detail: "更新时间" },
    ]

    // 在编辑器挂载前注册语言支持
    const handleEditorWillMount = (monaco) => {
        console.log("正在注册 SQL 自动补全...")

        // 注册自动补全提供者
        monaco.languages.registerCompletionItemProvider("sql", {
            provideCompletionItems: (model, position) => {
                // 获取当前单词
                const word = model.getWordUntilPosition(position)
                const range = {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endColumn: word.endColumn,
                }

                // 转换建议格式
                const suggestions = sqlSuggestions.map((item) => ({
                    label: item.label,
                    kind: monaco.languages.CompletionItemKind.Keyword,
                    insertText: item.insertText,
                    detail: item.detail,
                    documentation: `SQL: ${item.detail}`,
                    range: range,
                }))

                return { suggestions }
            },

            // 设置触发字符
            triggerCharacters: [" ", ".", "(", ","],
        })

        console.log("SQL 自动补全注册完成")
    }

    // 编辑器挂载后的处理
    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor
        console.log("编辑器挂载完成")

        // 设置编辑器选项
        editor.updateOptions({
            suggest: {
                showKeywords: true,
                showSnippets: true,
                showFunctions: true,
                showWords: true,
                showClasses: true,
                insertMode: "replace",
                filterGraceful: true,
            },
            quickSuggestions: {
                other: true,
                comments: false,
                strings: false,
            },
            acceptSuggestionOnEnter: "on",
            tabCompletion: "on",
            wordBasedSuggestions: "matchingDocuments",
            parameterHints: {
                enabled: true,
            },
        })

        // 添加键盘快捷键来手动触发补全
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Space, () => {
            console.log("手动触发自动补全")
            editor.trigger("keyboard", "editor.action.triggerSuggest", {})
        })

        // 监听内容变化，在特定情况下自动触发补全
        editor.onDidChangeModelContent(() => {
            const position = editor.getPosition()
            const model = editor.getModel()
            const lineContent = model.getLineContent(position.lineNumber)
            const currentWord = lineContent.substring(0, position.column - 1)

            // 如果输入了 2 个或更多字符，自动触发补全
            if (currentWord.length >= 2 && /[a-zA-Z]$/.test(currentWord)) {
                setTimeout(() => {
                    editor.trigger("auto", "editor.action.triggerSuggest", {})
                }, 100)
            }
        })
    }

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
            <Editor
                language="sql"
                value={value}
                onChange={onChange}
                height={height}
                beforeMount={handleEditorWillMount}
                onMount={handleEditorDidMount}
                options={{
                    readOnly,
                    theme: "vs",
                    minimap: { enabled: false },
                    automaticLayout: true,
                    fontSize: 14,
                    lineNumbers: "on",
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    folding: true,
                    foldingStrategy: "indentation",
                    showFoldingControls: "always",
                    // 重要：确保自动补全相关选项正确设置
                    suggest: {
                        showKeywords: true,
                        showSnippets: true,
                        showFunctions: true,
                        showWords: true,
                        showClasses: true,
                        insertMode: "replace",
                        filterGraceful: true,
                        delay: 0, // 减少延迟
                    },
                    quickSuggestions: {
                        other: true,
                        comments: false,
                        strings: false,
                    },
                    acceptSuggestionOnEnter: "on",
                    tabCompletion: "on",
                    wordBasedSuggestions: "matchingDocuments",
                    parameterHints: {
                        enabled: true,
                    },
                    // 启用所有补全相关功能
                    quickSuggestionsDelay: 10,
                    suggestOnTriggerCharacters: true,
                    acceptSuggestionOnCommitCharacter: true,
                }}
            />
        </div>
    )
}

export default SqlEditor
