import React, { useEffect, useState } from 'react';
import { Spin, Tag, Divider, Empty } from "antd";
import {SearchViewLogsContent} from "../../../api/datasource";

export const SearchViewLogs = ({ type, datasourceId, index, query }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true);
                setError(null);
                const { code, data, msg } = await SearchViewLogsContent({
                    type,
                    datasourceId,
                    index,
                    query
                });

                if (code === 200) {
                    setLogs(data || []);
                } else {
                    setError(msg || 'Failed to load logs');
                }
            } catch (err) {
                setError('Network error occurred');
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const renderLogMessage = (message) => {
        try {
            // 如果 message 是对象，就格式化显示 JSON
            const prettyJson = JSON.stringify(message, null, 2);

            return (
                <pre style={{
                    background: '#f3dede',
                    padding: '12px',
                    borderRadius: '4px',
                    borderLeft: '4px solid #f33131',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    margin: '16px 0'
                }}>
                {prettyJson}
            </pre>
            );
        } catch (e) {
            // 如果不是对象或无法转换为 JSON，则显示原始文本
            return (
                <div style={{
                    background: '#f3dede',
                    padding: '12px',
                    borderRadius: '4px',
                    borderLeft: '4px solid #f33131',
                    marginBottom: '16px'
                }}>
                    <Tag color="orange">Invalid Format</Tag>
                    <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {String(message)}
                </pre>
                </div>
            );
        }
    };

    const renderLogItem = (item, index) => (
        <>
            <span style={{marginRight: 8, fontSize: 18}}>{item.ProviderName}</span>
            <Tag color="blue">{item.Message?.length || 0} messages</Tag>
            <Divider style={{margin: '16px 0'}}/>

            <div style={{marginBottom: 16}}>
                <h4 style={{marginBottom: 8}}>Metadata</h4>
                <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                    {Object.entries(item.Metric || {}).map(([key, value]) => (
                        <Tag key={key} style={{margin: 0}}>
                            <strong>{key}:</strong> {value}
                        </Tag>
                    ))}
                </div>
            </div>

            <Divider style={{margin: '16px 0'}}/>

            <div>
                <h4 style={{marginBottom: 12}}>Log Messages</h4>
                {item.Message?.length > 0 ? (
                    <div style={{maxHeight: 400, overflowY: 'auto', paddingRight: 8}}>
                        {item.Message.map((msg, i) => (
                            <div key={i}>{renderLogMessage(msg)}</div>
                        ))}
                    </div>
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No messages"/>
                )}
            </div>
        </>
    );

    return (
        <div style={{height: '100%'}}>
            {loading ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <Spin tip="Loading logs..." size="large"/>
                </div>
            ) : error ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <Empty description={error} />
                </div>
            ) : logs.length === 0 ? (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%'
                }}>
                    <Empty description="No logs available" />
                </div>
            ) : (
                <div style={{
                    height: '100%',
                    overflowY: 'auto'
                }}>
                    {logs.map(renderLogItem)}
                </div>
            )}
        </div>
    );
};