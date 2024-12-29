import React, { useState, useEffect } from 'react';
import {Table, Button, Drawer, Tag, Tooltip, Select, Space, DatePicker, Input, Popconfirm, Radio} from 'antd';
import { CreateSilenceModal } from '../silence/SilenceRuleCreateModal'
import dayjs from "dayjs";
import './index.css'
import {getHisEventList, getCurEventList} from "../../api/event";

export const AlertEvent = () => {
    const { RangePicker } = DatePicker
    const { TextArea, Search } = Input;
    const params = new URLSearchParams(window.location.search);
    const [selectedRow, setSelectedRow] = useState(null);
    const [silenceVisible, setSilenceVisible] = useState(false);
    const [currentEventList, setCurrentEventList] = useState([]);
    const [historyEventList, setHistoryEventList] = useState([]);
    const [viewEventType, setViewEventType] = useState('current');
    const [searchQuery,setSearchQuery] = useState('')
    const currentColumns = [
        {
            title: '规则名称',
            dataIndex: 'rule_name',
            key: 'rule_name',
            width: 'auto',
        },
        {
            title: '告警指纹',
            dataIndex: 'fingerprint',
            key: 'fingerprint',
            width: 'auto',
        },
        {
            title: '数据源',
            dataIndex: 'datasourceId',
            key: 'datasourceId',
            width: 'auto',
            render: (_, record) => (
                <span>
                    <div>{record.datasource_type} ({record.datasource_id})</div>
                </span>
            ),
        },
        {
            title: '告警等级',
            dataIndex: 'severity',
            key: 'severity',
            width: 100,
            render: (text) => (
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: severityColors[text],
                            borderRadius: '50%',
                            marginRight: '8px',
                        }}
                    />
                    {text}
                </div>
            )
        },
        {
            title: '事件标签',
            dataIndex: 'metric',
            key: 'metric',
            width: 250,
            render: (text, record) => (
                <span>{showMoreTags([], record)}</span>
            ),
        },
        {
            title: '事件详情',
            dataIndex: 'annotations',
            key: 'annotations',
            width: 'auto',
            render: (text, record) => (
                <span>
                    {record.annotations && (
                        <span>
                            {record.annotations.substring(0, 100)}
                            <Button type="link" onClick={() => { showDrawer(record.annotations) }}>
                                查看详情
                            </Button>
                        </span>
                    )}
                </span>
            )
        },
        {
            title: '触发时间',
            dataIndex: 'first_trigger_time',
            key: 'first_trigger_time',
            width: 155,
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: '操作',
            dataIndex: 'operation',
            fixed: 'right',
            width: 100,
            render: (_, record) =>
                currentEventList.length >= 1 ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        <Tooltip title={record.status === 1 || record.status === 2 ? "无法执行操作，当前状态不允许静默" : ""}>
                            <Button
                                style={{ flex: '1 0 45%', borderColor: '#b1b1b1', color: '#b1b1b1' }}
                                onClick={() => handleSilenceModalOpen(record)}
                                disabled={record.status === 1 || record.status === 2}
                            >
                                去静默
                            </Button>
                        </Tooltip>
                    </div>
                ) : null,
        },
    ]
    const historyColumns = [
        {
            title: '规则名称',
            dataIndex: 'rule_name',
            key: 'rule_name',
            width: 'auto',
        },
        {
            title: '告警指纹',
            dataIndex: 'fingerprint',
            key: 'fingerprint',
            width: 'auto',
        },
        {
            title: '数据源',
            dataIndex: 'datasourceId',
            key: 'datasourceId',
            width: 'auto',
            render: (_, record) => (
                <span>
                    <div>{record.datasource_type} ({record.datasource_id})</div>
                </span>
            ),
        },
        {
            title: '告警等级',
            dataIndex: 'severity',
            key: 'severity',
            width: 100,
            render: (text) => (
                <div style={{display: 'flex', alignItems: 'center'}}>
                    <div
                        style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: severityColors[text],
                            borderRadius: '50%',
                            marginRight: '8px',
                        }}
                    />
                    {text}
                </div>
            )
        },
        {
            title: '事件标签',
            dataIndex: 'metric',
            key: 'metric',
            width: 250,
            render: (text, record) => (
                <span>{showMoreTags([], record)}</span>
            ),
        },
        {
            title: '事件详情',
            dataIndex: 'annotations',
            key: 'annotations',
            width: 'auto',
            render: (text, record) => (
                <span>
                    {record.annotations && (
                        <span>
                            {record.annotations.substring(0, 50)}
                            <Button type="link" onClick={() => { showDrawer(record.annotations) }}>
                                查看详情
                            </Button>
                        </span>
                    )}
                </span>
            )
        },
        {
            title: '触发时间',
            dataIndex: 'first_trigger_time',
            key: 'first_trigger_time',
            width: 155,
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: '恢复时间',
            dataIndex: 'recover_time',
            key: 'recover_time',
            width: 155,
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
    ]
    const [selectedDataSource, setSelectedDataSource] = useState('');
    const [selectedSourceType, setSelectedSourceType] = useState('');
    const [selectedAlertLevel, setSelectedAlertLevel] = useState('');
    const [startTimestamp, setStartTimestamp] = useState(null)
    const [endTimestamp, setEndTimestamp] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [annotations, setAnnotations] = useState('');
    const [currentPagination, setCurrentPagination] = useState({
        pageIndex: 1,
        pageSize: 10,
        pageTotal: 0,
    });
    const [historyPagination, setHistoryPagination] = useState({
        pageIndex: 1,
        pageSize: 10,
        pageTotal: 0,
    });
    const [loading,setLoading]=useState(true)

    useEffect(() => {
        const view = params.get('view');
        if (view === 'history') {
            setViewEventType('history');
        } else {
            setViewEventType('current');
        }
        // 从 URL 中获取 query 参数，并更新 searchQuery 的状态
        const url = new URL(window.location);
        const queryParam = url.searchParams.get('query');
        if (queryParam) {
            setSearchQuery(queryParam);
        }
    }, []);


    const showDrawer = (record) => {
        setDrawerOpen(true);
        setAnnotations(record)
    };
    const onCloseDrawer = () => {
        setDrawerOpen(false);
    };

    useEffect(() => {
        if (viewEventType === 'current'){
            handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize);
        } else if (viewEventType === 'history'){
            handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)
        }
    }, [viewEventType,selectedDataSource, selectedAlertLevel, startTimestamp, endTimestamp, searchQuery]);

    const showMoreTags = (tags, record, visibleCount = 5) => {
        if (Object.entries(record.metric).length <= visibleCount) {
            // 如果标签数量小于或等于可见数量，直接显示所有标签
            return Object.entries(record.metric).map(([key, value]) => {
                // 截取value的前20个字符，并添加省略号如果value长度超过20
                const truncatedKey = key.length > 20 ? key.substring(0, 20) + '...' : key;
                const truncatedValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
                return (
                    <Tag color="processing" key={key}>{`${truncatedKey}: ${truncatedValue}`}</Tag>
                );
            });
        } else {
            // 否则，显示指定数量的标签，并通过弹窗显示剩余标签
            const visibleTags = Object.entries(record.metric).slice(0, visibleCount);
            const hiddenTags = Object.entries(record.metric).slice(0);

            return [
                ...visibleTags.map(([key, value]) => {
                    // 截取value的前20个字符，并添加省略号如果value长度超过20
                    const truncatedKey = key.length > 20 ? key.substring(0, 20) + '...' : key;
                    const truncatedValue = value.length > 20 ? value.substring(0, 20) + '...' : value;
                    return (
                        <Tag color="processing" key={key}>{`${truncatedKey}: ${truncatedValue}`}</Tag>
                    );
                }),
                <Tooltip title={<TagsList tags={hiddenTags} />} key="more-tags">
                    <Tag color="processing">+{hiddenTags.length} 所有</Tag>
                </Tooltip>,
            ];
        }
    };

    const TagsList = ({ tags }) => {
        const tagListStyle = {
            overflow: 'auto', // 如果内容超出视图区域，显示滚动条
            maxHeight: '50vh', // 可选：设置弹窗的最大高度
        };
        return (
            <div style={tagListStyle}>
                {tags.map(([key, value]) => (
                    <Tag color="processing" key={key}>{`${key}: ${value}`}</Tag>
                ))}
            </div>
        );
    };

    const handleCurrentEventList = async (pageIndex, pageSize) => {
        try {
            const params = {
                index: pageIndex,
                size: pageSize,
                query: searchQuery ? searchQuery : undefined,
                datasourceType: selectedSourceType ? selectedSourceType : undefined, // 如果selectedSourceType为空，则不包含该字段
                severity: selectedAlertLevel ? selectedAlertLevel : undefined,
                startAt: startTimestamp ? startTimestamp : undefined,
                endAt: endTimestamp ? endTimestamp : undefined,
            }
            setLoading(true)
            const res = await getCurEventList(params)
            setLoading(false)
            if (res?.data?.list === null){
                setCurrentEventList([])
            }
            let sortedList = []
            if (res?.data?.list?.length >= 1) {
                sortedList = res.data.list.sort((a, b) => b.first_trigger_time - a.first_trigger_time);
            } else {
                sortedList = []
            }
            setCurrentEventList(sortedList ? sortedList : []);

            setCurrentPagination({
                ...currentPagination,
                pageIndex: res.data.index,
                pageTotal: res.data.total,
            });
        } catch (error) {
            console.error(error)
        }
    };

    const handleDataSourceChange = (value) => {
        setSelectedSourceType(value)
        setSelectedDataSource(value);

        const url = new URL(window.location);
        url.searchParams.set('datasourceType', value); // Update or add the view parameter
        window.history.pushState({}, '', url); // Update the browser's address bar
    };

    const handleHistoryEventList = async (pageIndex, pageSize) => {
        try {
            // 构建请求参数，仅包含非空字段
            const params = {
                index: pageIndex,
                size: pageSize,
                query: searchQuery ? searchQuery : undefined,
                datasourceType: selectedSourceType ? selectedSourceType : undefined, // 如果selectedSourceType为空，则不包含该字段
                severity: selectedAlertLevel ? selectedAlertLevel : undefined,
                startAt: startTimestamp ? startTimestamp : undefined,
                endAt: endTimestamp ? endTimestamp : undefined,
            };
            // 过滤掉undefined的属性
            const filteredParams = {};
            for (const key in params) {
                if (params[key] !== undefined) {
                    filteredParams[key] = params[key];
                }
            }
            setLoading(true)
            const res = await getHisEventList(filteredParams)
            setLoading(false)
            setHistoryEventList(res.data.list);
            setHistoryPagination({
                ...historyPagination,
                pageIndex: res.data.index,
                pageTotal: res.data.total,
            });
        } catch (error) {
            console.error(error)
        }
    };

    const handleSilenceModalClose = () => {
        setSilenceVisible(false);
    };

    const handleSilenceModalOpen = (record) => {
        record.latitude = "0"   // 从当前告警中创建静默规则，默认是唯一指纹的维度
        setSelectedRow(record);
        setSilenceVisible(true);
    };

    const rangePresets = [
        {
            label: 'Last 1 Days',
            value: [dayjs().add(-1, 'd'), dayjs()],
        },
        {
            label: 'Last 3 Days',
            value: [dayjs().add(-3, 'd'), dayjs()],
        },
        {
            label: 'Last 5 Days',
            value: [dayjs().add(-5, 'd'), dayjs()],
        },
        {
            label: 'Last 7 Days',
            value: [dayjs().add(-7, 'd'), dayjs()],
        },
        {
            label: 'Last 14 Days',
            value: [dayjs().add(-14, 'd'), dayjs()],
        },
        {
            label: 'Last 30 Days',
            value: [dayjs().add(-30, 'd'), dayjs()],
        },
        {
            label: 'Last 90 Days',
            value: [dayjs().add(-90, 'd'), dayjs()],
        },
    ];

    const severityColors = {
        'P0': 'red',
        'P1': 'orange',
        'P2': 'yellow',
    };

    const optionsWithDisabled = [
        {
            label: '当前告警',
            value: 'current',
        },
        {
            label: '历史告警',
            value: 'history',
        },
    ];

    const changeViewEventType = ({ target: { value } }) => {
        console.log('radio4 checked', value);
        setViewEventType(value);

        const url = new URL(window.location);
        url.searchParams.set('view', value); // Update or add the view parameter
        window.history.pushState({}, '', url); // Update the browser's address bar
    };

    const handleShowTotal = (total, range) =>
        `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`;

    const handleCurrentPageChange = (page) => {
        setCurrentPagination({ ...currentPagination, pageIndex: page.current, pageSize: page.pageSize });
        handleCurrentEventList(page.current, page.pageSize)
    };
    const handleHistoryPageChange = (page) => {
        setHistoryPagination({ ...historyPagination, pageIndex: page.current, pageSize: page.pageSize });
        handleHistoryEventList(page.current, page.pageSize)
    };

    const handleSearch = (value)=>{
        setSearchQuery(value)

        const view = params.get('view');
        if (view === 'history') {
            handleHistoryEventList(historyPagination.current, historyPagination.pageSize)
        } else {
            handleCurrentEventList(currentPagination.current, currentPagination.pageSize)
        }

        const url = new URL(window.location);
        url.searchParams.set('query', value); // Update or add the view parameter
        window.history.pushState({}, '', url); // Update the browser's address bar
    }

    const handleSeverityChange = (value) => {
        setSelectedAlertLevel(value)

        const url = new URL(window.location);
        url.searchParams.set('severity', value); // Update or add the view parameter
        window.history.pushState({}, '', url); // Update the browser's address bar
    }

    // 时间选择器
    const onChange = (dates) => {
        if (dates && dates.length === 2) {
            onOk(dates);
        }
    }

    const onOk = (dates) => {
        if (dates && dates[0] && dates[1]) {
            const startTimestamp = dates[0].unix()
            const endTimestamp = dates[1].unix()
            setStartTimestamp(startTimestamp)
            setEndTimestamp(endTimestamp)
        }
    }

    const [height, setHeight] = useState(window.innerHeight);

    useEffect(() => {
        // 定义一个处理窗口大小变化的函数
        const handleResize = () => {
            setHeight(window.innerHeight);
        };

        // 监听窗口的resize事件
        window.addEventListener('resize', handleResize);

        // 在组件卸载时移除监听器
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div>
            <div style={{
                display: 'flex',
                gap: '10px',
            }}>
                <Radio.Group
                    options={optionsWithDisabled}
                    onChange={changeViewEventType}
                    value={viewEventType}
                    optionType="button"
                    buttonStyle="solid"
                />

                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={handleSearch}
                    value={searchQuery} // 将 searchQuery 作为输入框的值
                    onChange={(e) => setSearchQuery(e.target.value)} // 更新 searchQuery 状态
                    style={{ width: 300 }}
                />

                <Select
                    placeholder="选择类型"
                    style={{
                        width: '150px'
                    }}
                    allowClear
                    value={selectedDataSource ? selectedDataSource : null}
                    onChange={handleDataSourceChange}
                    options={[
                        {
                            value: 'Prometheus',
                            label: 'Prometheus',
                        },
                        {
                            value: 'VictoriaMetrics',
                            label: 'VictoriaMetrics',
                        },
                        {
                            value: 'AliCloudSLS',
                            label: 'AliCloudSLS',
                        },
                        {
                            value: 'Jaeger',
                            label: 'Jaeger',
                        },
                        {
                            value: 'Loki',
                            label: 'Loki',
                        },
                    ]}
                />

                <Select
                    placeholder="选择告警等级"
                    style={{ width: '150px' }}
                    allowClear
                    value={selectedAlertLevel ? selectedAlertLevel : null}
                    onChange={handleSeverityChange}
                    options={[
                        {
                            value: 'P0',
                            label: (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: severityColors['P0'],
                                            borderRadius: '50%',
                                            marginRight: '8px',
                                        }}
                                    />
                                    P0级告警
                                </div>
                            ),
                        },
                        {
                            value: 'P1',
                            label: (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: severityColors['P1'],
                                            borderRadius: '50%',
                                            marginRight: '8px',
                                        }}
                                    />
                                    P1级告警
                                </div>
                            ),
                        },
                        {
                            value: 'P2',
                            label: (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <div
                                        style={{
                                            width: '10px',
                                            height: '10px',
                                            backgroundColor: severityColors['P2'],
                                            borderRadius: '50%',
                                            marginRight: '8px',
                                        }}
                                    />
                                    P2级告警
                                </div>
                            ),
                        },
                    ]}
                />

                {viewEventType === "history" && (
                    <Space direction="vertical" style={{width: '250px'}}>
                        <RangePicker
                            showTime={{
                                format: 'HH:mm:ss',
                            }}
                            presets={[
                                {
                                    label: <span aria-label="Current Time to End of Day">Now ~ EOD</span>,
                                    value: () => [dayjs(), dayjs().endOf('day')],
                                },
                                ...rangePresets,
                            ]}
                            format="YYYY-MM-DD HH:mm:ss"
                            onChange={onChange}
                            onOk={onOk}
                        />
                    </Space>
                )}

                <Button style={{ marginLeft: 'auto' }} onClick={()=>{
                    (viewEventType === "current" ? handleCurrentEventList(currentPagination.pageIndex, currentPagination.pageSize) : handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize))
                }}>刷新</Button>
            </div>

            <Drawer
                title="事件详情"
                onClose={onCloseDrawer}
                open={drawerOpen}
                width={520}
            >
                <TextArea
                    value={annotations}
                    style={{
                        height: 500,
                        resize: 'none',
                    }}
                />
            </Drawer>

            <CreateSilenceModal visible={silenceVisible} onClose={handleSilenceModalClose} type="createForCurEvent" handleList={handleCurrentEventList}
                                selectedRow={selectedRow}/>

            <div style={{overflowX: 'auto', marginTop: 10}}>
                {viewEventType === "current" && (
                    <Table
                        columns={currentColumns}
                        dataSource={currentEventList}
                        loading={loading}
                        pagination={{
                            current: currentPagination.pageIndex ?? 1,
                            pageSize: currentPagination.pageSize ?? 10,
                            total: currentPagination?.pageTotal ?? 0,
                            showTotal: handleShowTotal,
                        }}
                        onChange={handleCurrentPageChange}
                        scroll={{
                            y: height - 400, // 动态设置滚动高度
                            x: 'max-content', // 水平滚动
                        }}
                        bordered // 添加表格边框
                        style={{ backgroundColor: '#fff' }} // 设置表格背景色
                        rowKey={(record) => record.id} // 设置行唯一键
                    />
                ) || (
                    <Table
                        columns={historyColumns}
                        dataSource={historyEventList}
                        loading={loading}
                        pagination={{
                            current: historyPagination.pageIndex ?? 1,
                            pageSize: historyPagination.pageSize ?? 10,
                            total: historyPagination?.pageTotal ?? 0,
                            showTotal: handleShowTotal,
                        }}
                        onChange={handleHistoryPageChange}
                        scroll={{
                            y: height - 400, // 动态设置滚动高度
                            x: 'max-content', // 水平滚动
                        }}
                        bordered // 添加表格边框
                        style={{ backgroundColor: '#fff' }} // 设置表格背景色
                        rowKey={(record) => record.id} // 设置行唯一键
                    />
                )}
            </div>
        </div>
    );
};
