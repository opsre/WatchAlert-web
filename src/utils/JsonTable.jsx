'use client'
import React, { useMemo, useRef, useEffect } from 'react'
const SEPARATOR = ' ▸ '
const MAX_DEPTH = 8
const flattenObject = (obj, isTopLevel = true) => {
    const result = {}
    const stack = [
        {
            obj,
            path: [],
            depth: 0,
        },
    ]
    while (stack.length > 0) {
        const current = stack.pop()
        if (current.depth > MAX_DEPTH) continue
        if (typeof current.obj === 'object' && current.obj !== null) {
            const isArray = Array.isArray(current.obj)
            const entries = isArray
                ? current.obj.map((v, i) => [i.toString(), v])
                : Object.entries(current.obj)
            if (isTopLevel && current.path.length === 0 && 'message' in current.obj) {
                result.message = current.obj.message
            } else {
                entries.reverse().forEach(([key, value]) => {
                    stack.push({
                        obj: value,
                        path: [...current.path, key],
                        depth: current.depth + 1,
                    })
                })
            }
        } else {
            const fullPath = current.path.join(SEPARATOR)
            result[fullPath] = current.obj
        }
    }
    return result
}
const generateHeaders = (data) => {
    const headerSet = new Set()
    data.forEach((item) => {
        const flattened = flattenObject(item)
        Object.keys(flattened).forEach((key) => {
            headerSet.add(key)
        })
    })
    return Array.from(headerSet).sort((a, b) => {
        if (a === 'message') return -1
        if (b === 'message') return 1
        return a.localeCompare(b, undefined, { numeric: true })
    })
}
const ValueRenderer = ({ value }) => {
    if (value === null || value === undefined) {
        return <span className="text-gray-400 italic">null</span>
    }
    if (Array.isArray(value)) {
        return (
            <div className="space-y-1">
                {value.map((item, index) => (
                    <div
                        key={index}
                        className="border-l-2 pl-2 border-blue-100"
                    >
                        <ValueRenderer value={item} />
                    </div>
                ))}
            </div>
        )
    }
    if (typeof value === 'object') {
        return (
            <pre className="m-0 p-2 bg-gray-50 rounded text-sm leading-snug break-words whitespace-pre-wrap">
                {JSON.stringify(value, null, 2)}
            </pre>
        )
    }
    return <span className="break-words">{value.toString()}</span>
}
const JsonTable = ({ data }) => {
    const containerRef = useRef(null)
    const flattenedData = useMemo(() => data.map((item) => flattenObject(item)), [data])
    const headers = useMemo(() => generateHeaders(data), [data])
    useEffect(() => {
        const container = containerRef.current
        if (!container) return
        const handleWheel = (e) => {
            // 优先处理横向滚动
            if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) return

            e.preventDefault()
            container.scrollLeft += e.deltaX + e.deltaY
        }
        container.addEventListener('wheel', handleWheel, { passive: false })
        return () => container.removeEventListener('wheel', handleWheel)
    }, [])
    if (!data || data.length === 0) {
        return <div className="p-4">No data available</div>
    }
    return (
        <div
            ref={containerRef}
            className="overflow-x-auto border border-gray-200 rounded-lg m-4 scrollbar-horizontal"
            style={{
                scrollBehavior: 'smooth',
                scrollbarWidth: 'thin',
            }}
        >
            <table
                className="min-w-full divide-y divide-gray-200"
                style={{ minWidth: headers.length * 200 }}
            >
                <thead className="bg-gray-50">
                <tr>
                    {headers.map((header) => (
                        <th
                            key={header}
                            className={[
                                'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                                header === 'message' ? 'min-w-[500px]' : 'min-w-[150px]',
                            ].join(' ')}
                        >
                            {header.split(SEPARATOR).map((part, index) => (
                                <span
                                    key={index}
                                    className={`${index % 2 === 0 ? 'text-gray-700' : 'text-gray-500'} ${
                                        index > 0 ? 'ml-2' : ''
                                    }`}
                                >
                                        {index > 0 && <span className="opacity-40 mr-1">▸</span>}
                                    {part}
                                    </span>
                            ))}
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {flattenedData.map((row, rowIndex) => (
                    <tr
                        key={rowIndex}
                        className="hover:bg-gray-50"
                    >
                        {headers.map((header) => (
                            <td
                                key={header}
                                className={[
                                    'px-6 py-4 text-sm text-gray-500 align-top',
                                    header === 'message' ? 'min-w-[500px] max-w-2xl' : '',
                                ].join(' ')}
                            >
                                <ValueRenderer
                                    value={
                                        header === 'message'
                                            ? Array.isArray(row.message)
                                                ? row.message
                                                : [row.message]
                                            : row[header] ?? null
                                    }
                                />
                            </td>
                        ))}
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
}
export default React.memo(JsonTable)