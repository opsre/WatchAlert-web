import React, { createContext, useEffect, useRef,useState,useCallback } from "react";
import {
    EditorView,
    highlightSpecialChars,
    keymap,
    ViewUpdate,
} from "@codemirror/view";
import { EditorState, Prec, Compartment } from "@codemirror/state";
import { indentOnInput } from "@codemirror/language";
import { history, historyKeymap } from "@codemirror/history";
import { defaultKeymap, insertNewlineAndIndent } from "@codemirror/commands";
import { bracketMatching } from "@codemirror/matchbrackets";
import { closeBrackets, closeBracketsKeymap } from "@codemirror/closebrackets";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { commentKeymap } from "@codemirror/comment";
import { lintKeymap } from "@codemirror/lint";
import { PromQLExtension } from 'codemirror-promql'
import {
    autocompletion,
    completionKeymap,
} from "@codemirror/autocomplete";
import { HighlightStyle, tags } from '@codemirror/highlight';
import './index.css'

const promqlExtension = new PromQLExtension()
const dynamicConfigCompartment = new Compartment();
const enableAutocomplete = true;
const enableHighlighting = true;
const enableLinter = true;
let promQL = "";

export const theme = EditorView.theme({
    '&': {
        '&.cm-focused': {
            outline: 'none',
            borderColor: '#40a9ff',
            boxShadow: '0 0 0 2px rgba(24, 144, 255, 0.2)',
        },
    },
    '.cm-scroller': {
        overflow: 'visible',
        fontFamily: '"DejaVu Sans Mono", monospace',
    },
    '.cm-placeholder': {
        fontFamily:
            '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans","Liberation Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
    },

    '.cm-matchingBracket': {
        color: '#000',
        backgroundColor: '#dedede',
        fontWeight: 'bold',
        outline: '1px dashed transparent',
    },
    '.cm-nonmatchingBracket': { borderColor: 'red' },

    '.cm-tooltip': {
        backgroundColor: '#f8f8f8',
        borderColor: 'rgba(52, 79, 113, 0.2)',
    },

    '.cm-tooltip.cm-tooltip-autocomplete': {
        '& > ul': {
            maxHeight: '350px',
            fontFamily: '"DejaVu Sans Mono", monospace',
            maxWidth: 'unset',
        },
        '& > ul > li': {
            padding: '2px 1em 2px 3px',
        },
        '& li:hover': {
            backgroundColor: '#ddd',
        },
        '& > ul > li[aria-selected]': {
            backgroundColor: '#d6ebff',
            color: 'unset',
        },
        minWidth: '30%',
    },

    '.cm-completionDetail': {
        float: 'right',
        color: '#999',
    },

    '.cm-tooltip.cm-tooltip-completionInfo': {
        marginTop: '-11px',
        padding: '10px',
        fontFamily: "'Open Sans', 'Lucida Sans Unicode', 'Lucida Grande', sans-serif;",
        border: 'none',
        backgroundColor: '#d6ebff',
        minWidth: '250px',
        maxWidth: 'min-content',
    },

    '.cm-completionInfo.cm-completionInfo-right': {
        '&:before': {
            content: "' '",
            height: '0',
            position: 'absolute',
            width: '0',
            left: '-20px',
            border: '10px solid transparent',
            borderRightColor: '#d6ebff',
        },
        marginLeft: '12px',
    },
    '.cm-completionInfo.cm-completionInfo-left': {
        '&:before': {
            content: "' '",
            height: '0',
            position: 'absolute',
            width: '0',
            right: '-20px',
            border: '10px solid transparent',
            borderLeftColor: '#d6ebff',
        },
        marginRight: '12px',
    },

    '.cm-completionMatchedText': {
        textDecoration: 'none',
        fontWeight: 'bold',
        color: '#0066bf',
    },

    '.cm-line': {
        '&::selection': {
            backgroundColor: '#add6ff',
        },
        '& > span::selection': {
            backgroundColor: '#add6ff',
        },
    },

    '.cm-selectionMatch': {
        backgroundColor: '#e6f3ff',
    },

    '.cm-diagnostic': {
        '&.cm-diagnostic-error': {
            borderLeft: '3px solid #e65013',
        },
    },

    '.cm-completionIcon': {
        boxSizing: 'content-box',
        fontSize: '16px',
        lineHeight: '1',
        marginRight: '10px',
        verticalAlign: 'top',
        '&:after': { content: "'\\ea88'" },
        fontFamily: 'codicon',
        paddingRight: '0',
        opacity: '1',
        color: '#007acc',
    },

    '.cm-completionIcon-function, .cm-completionIcon-method': {
        '&:after': { content: "'\\ea8c'" },
        color: '#652d90',
    },
    '.cm-completionIcon-class': {
        '&:after': { content: "'○'" },
    },
    '.cm-completionIcon-interface': {
        '&:after': { content: "'◌'" },
    },
    '.cm-completionIcon-variable': {
        '&:after': { content: "'𝑥'" },
    },
    '.cm-completionIcon-constant': {
        '&:after': { content: "'\\eb5f'" },
        color: '#007acc',
    },
    '.cm-completionIcon-type': {
        '&:after': { content: "'𝑡'" },
    },
    '.cm-completionIcon-enum': {
        '&:after': { content: "'∪'" },
    },
    '.cm-completionIcon-property': {
        '&:after': { content: "'□'" },
    },
    '.cm-completionIcon-keyword': {
        '&:after': { content: "'\\eb62'" },
        color: '#616161',
    },
    '.cm-completionIcon-namespace': {
        '&:after': { content: "'▢'" },
    },
    '.cm-completionIcon-text': {
        '&:after': { content: "'\\ea95'" },
        color: '#ee9d28',
    },
});

export const promqlHighlighter = HighlightStyle.define([
    { tag: tags.name, color: '#000' },
    { tag: tags.number, color: '#09885a' },
    { tag: tags.string, color: '#a31515' },
    { tag: tags.keyword, color: '#008080' },
    { tag: tags.function(tags.variableName), color: '#008080' },
    { tag: tags.labelName, color: '#800000' },
    { tag: tags.operator },
    { tag: tags.modifier, color: '#008080' },
    { tag: tags.paren },
    { tag: tags.squareBracket },
    { tag: tags.brace },
    { tag: tags.invalid, color: 'red' },
    { tag: tags.comment, color: '#888', fontStyle: 'italic' },
]);

export const PromDoc = () =>{

    return promQL
}

export const PrometheusPromQL = (props) => {
    const containerRef = useRef(null);
    const viewRef = useRef(null);
    const queryHistory: string[] = [];
    const executeQuery = (args?: any) => {
        console.info(args);
    };

    const [doc, setDoc] = useState('')
    const onExpressionChange = useCallback((expression) => {
        if (expression){
            promQL=expression
            setDoc(expression);
        }
    }, []);


    useEffect(()=>{
        if (props.value){
            setDoc(props.value)
        }

    },[props.value])

    // 监听编辑器更新事件
    const updateListener = EditorView.updateListener.of((update: ViewUpdate): void => {
        // 检查是否为用户输入事件
        if (update.docChanged) {
            const newContent = update.state.doc.toString();
            if (newContent){
                // console.log("update.state.doc.toString()->", newContent);
                // 调用传入的回调函数以反映内容变化
                onExpressionChange(newContent);
            }
        }

        if (update.focusChanged){
            if (update.state.doc.toString()){
                props.setPromQL(update.state.doc.toString())
            }
        }

    });

    useEffect(() => {
        promqlExtension.activateCompletion(enableAutocomplete);
        promqlExtension.activateLinter(enableLinter);
        promqlExtension.setComplete({ remote: { url: props.addr } });

        const dynamicConfig = [
            enableHighlighting ? promqlHighlighter : [],
            promqlExtension.asExtension(),
        ];

        const view = viewRef.current;
        if (!view) {
            if (!containerRef.current) {
                throw new Error("expected CodeMirror container element to exist");
            }

            const startState = EditorState.create({
                doc: doc,
                extensions: [
                    theme,
                    highlightSpecialChars(),
                    history(),
                    EditorState.allowMultipleSelections.of(true),
                    indentOnInput(),
                    bracketMatching(),
                    closeBrackets(),
                    autocompletion(),
                    highlightSelectionMatches(),
                    EditorView.lineWrapping,
                    keymap.of([
                        ...closeBracketsKeymap,
                        ...defaultKeymap,
                        ...searchKeymap,
                        ...historyKeymap,
                        ...commentKeymap,
                        ...completionKeymap,
                        ...lintKeymap,
                    ]),
                    dynamicConfigCompartment.of(dynamicConfig),
                    keymap.of([
                        {
                            key: "Escape",
                            run: (v) => {
                                v.contentDOM.blur();
                                return false;
                            },
                        },
                    ]),
                    Prec.override(
                        keymap.of([
                            {
                                key: "Enter",
                                run: (v) => {
                                    executeQuery();
                                    return true;
                                },
                            },
                            {
                                key: "Shift-Enter",
                                run: insertNewlineAndIndent,
                            },
                        ])
                    ),
                    updateListener,
                ],
            });

            viewRef.current = new EditorView({
                state: startState,
                parent: containerRef.current,
            });

            viewRef.current.focus();
        } else {
            view.dispatch(
                view.state.update({
                    effects: dynamicConfigCompartment.reconfigure(dynamicConfig),
                })
            );
        }
    }, [ executeQuery, onExpressionChange, queryHistory, props.value]);

    useEffect(() => {
        if (viewRef.current && props.value !== undefined) {
            const currentPosition = viewRef.current.state.selection.main.head;
            // 外部 value 变化(如指标浏览器一键生成)时, 光标位置需收敛到新文档长度内,
            // 否则新文档较短时会造成 "Selection points outside of document" 崩溃。
            const anchor = Math.min(currentPosition, props.value.length);
            const transaction = viewRef.current.state.update({
                changes: { from: 0, to: viewRef.current.state.doc.length, insert: props.value },
                selection: { anchor }
            });
            viewRef.current.dispatch(transaction);
        }
    }, [props.value]);

    return (
        <div className="promInputContent">
            <div ref={containerRef} className="cm-expression-input" />
        </div>
    );
}
