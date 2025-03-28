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
            const { log, time } = JSON.parse(message);
            return (
                <div style={{
                    marginBottom: 16,
                    padding: 12,
                    background: '#f3dede',
                    borderLeft: `4px solid ${'#f33131'}`,
                    borderRadius: 4
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ color: '#666', fontSize: 12 }}>
                          {new Date(time).toLocaleString()}
                        </span>
                    </div>
                    <pre style={{
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'monospace',
                        fontSize: 13,
                        lineHeight: '1.5'
                    }}>
                        {log}
                    </pre>
                </div>
            );
        } catch (e) {
            return (
                <div style={{
                    padding: 12,
                    background: '#f3dede',
                    borderLeft: `4px solid ${'#f33131'}`,
                    marginBottom: 16
                }}>
                    <Tag color="orange">Invalid Format</Tag>
                    <pre style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>{message}</pre>
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
                    <div style={{maxHeight: 500, overflowY: 'auto', paddingRight: 8}}>
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
                <div style={{ maxHeight: 'calc(100vh - 100px)', overflowY: 'auto' }}>
                    {logs.map(renderLogItem)}
                </div>
            )}
        </div>
    );
};