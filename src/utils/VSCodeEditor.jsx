"use client"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { Editor } from "@monaco-editor/react"
import { Spin, Alert, Typography } from "antd"
import { LoadingOutlined } from "@ant-design/icons"
import { debounce } from "lodash-es"

const { Text } = Typography

const VSCodeEditor = ({
                          value,
                          onChange,
                          language = "json",
                          height = "100px",
                          options = {},
                          theme = "vs",
                          readOnly = false,
                      }) => {
    const editorRef = useRef(null)
    const containerRef = useRef(null)
    const [isEditorReady, setIsEditorReady] = useState(false)
    const [hasError, setHasError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [loadingTimeout, setLoadingTimeout] = useState(false)
    const [instanceId] = useState(() => Math.random().toString(36).substring(2, 15))

    // Create debounced onChange handler only once
    const debouncedOnChange = useRef(
        debounce((newValue) => {
            onChange?.(newValue)
        }, 300),
    ).current

    // Handle editor changes
    const handleEditorChange = useCallback(
        (newValue) => {
            debouncedOnChange(newValue)
        },
        [debouncedOnChange],
    )

    // Handle editor mounting
    const handleEditorDidMount = useCallback(
        (editor, monaco) => {
            editorRef.current = editor
            setIsEditorReady(true)
            setIsLoading(false)
            setLoadingTimeout(false)

            // Set editor options
            editor.updateOptions({
                readOnly,
                ...options,
            })

            // Initial layout
            editor.layout()
        },
        [options, readOnly],
    )

    // Sync external value changes with editor
    useEffect(() => {
        if (editorRef.current && isEditorReady) {
            const currentValue = editorRef.current.getValue()
            // Only update if values are different to prevent cursor jumping
            if (value !== currentValue) {
                // Preserve cursor position and selection
                const position = editorRef.current.getPosition()
                const selection = editorRef.current.getSelection()

                editorRef.current.setValue(value || "")

                // Restore cursor position and selection
                if (position) editorRef.current.setPosition(position)
                if (selection) editorRef.current.setSelection(selection)
            }
        }
    }, [value, isEditorReady])

    // Timeout detection
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (isLoading) {
                setLoadingTimeout(true)
            }
        }, 5000)

        return () => clearTimeout(timeoutId)
    }, [isLoading])

    // Handle loading error
    const handleLoadError = useCallback((error) => {
        console.error("Monaco Editor loading failed:", error)
        setIsEditorReady(false)
        setHasError(true)
        setIsLoading(false)
        setErrorMessage(error?.message || "Unknown error")
    }, [])

    // Resize handling
    useEffect(() => {
        const handleResize = debounce(() => {
            if (editorRef.current) {
                editorRef.current.layout()
            }
        }, 100)

        const resizeObserver = new ResizeObserver(handleResize)
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current)
        }

        window.addEventListener("resize", handleResize)

        return () => {
            resizeObserver.disconnect()
            window.removeEventListener("resize", handleResize)
            handleResize.cancel()
        }
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            debouncedOnChange.cancel()
            if (editorRef.current?.dispose) {
                editorRef.current.dispose()
            }
        }
    }, [debouncedOnChange])

    // Merge default options
    const mergedOptions = useMemo(
        () => ({
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            formatOnType: true,
            formatOnPaste: true,
            scrollbar: {
                vertical: "auto",
                horizontal: "auto",
                useShadows: true,
            },
            ...options,
        }),
        [options],
    )

    // Loading indicator
    const renderLoading = () => (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.9)",
                zIndex: 10,
            }}
        >
            <Spin
                indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
                tip={loadingTimeout ? "Loading is taking longer than expected..." : "Loading editor..."}
            />
            {loadingTimeout && (
                <Text type="secondary" style={{ marginTop: 10, fontSize: "0.8em" }}>
                    If it doesn't respond, please check your network or refresh the page
                </Text>
            )}
        </div>
    )

    // Error display
    const renderError = () => (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
                background: "#fff",
                zIndex: 10,
            }}
        >
            <Alert
                message="Editor failed to load"
                description={
                    <>
                        <p>{errorMessage || "Unable to load Monaco editor component"}</p>
                        <p>Possible reasons:</p>
                        <ul>
                            <li>Network connectivity issues</li>
                            <li>Resource path configuration error</li>
                            <li>Browser compatibility issues</li>
                        </ul>
                        <p>
                            <a
                                href="#"
                                onClick={(e) => {
                                    e.preventDefault()
                                    window.location.reload()
                                }}
                            >
                                Click to refresh the page
                            </a>
                        </p>
                    </>
                }
                type="error"
                showIcon
            />
        </div>
    )

    // Fallback editor
    const renderFallbackEditor = () => (
        <textarea
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            style={{
                width: "100%",
                height: "100%",
                padding: "8px",
                fontFamily: "monospace",
                fontSize: "14px",
                border: "none",
                resize: "none",
            }}
            readOnly={readOnly}
        />
    )

    return (
        <div
            ref={containerRef}
            style={{
                border: "1px solid #d9d9d9",
                borderRadius: "6px",
                overflow: "hidden",
                height: height,
                position: "relative",
                transition: "height 0.2s ease",
            }}
        >
            {isLoading && renderLoading()}
            {hasError && renderError()}

            {hasError ? (
                renderFallbackEditor()
            ) : (
                <Editor
                    key={`${instanceId}-${language}-${theme}`}
                    height={height}
                    language={language}
                    value={value || ""}
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    onError={handleLoadError}
                    options={mergedOptions}
                    loading={null}
                    theme={theme}
                    path={`file://model-${instanceId}.${language}`}
                    keepCurrentModel={false}
                />
            )}
        </div>
    )
}

export default VSCodeEditor
