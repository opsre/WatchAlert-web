import React, { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Button, Card, Space, Typography, Checkbox, notification, Form, Input, Select, Drawer, Modal, Collapse, Switch, message, Tag } from 'antd';
import {
  ReactFlow, MiniMap, Controls, Background,
  useNodesState, useEdgesState, addEdge,
  Handle, Position, MarkerType, ReactFlowProvider, useReactFlow,
  getBezierPath
} from 'reactflow';
import { getDatasourceList, getDatasource } from '../../api/datasource.jsx';
import { TopologyUpdate } from '../../api/topology.jsx';  
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import {
  ApiOutlined, CloudServerOutlined, SettingOutlined,
  DatabaseOutlined, PlusOutlined, EditOutlined, SaveOutlined,
  GlobalOutlined, ForkOutlined, HddOutlined, ExclamationCircleOutlined, NodeIndexOutlined
} from '@ant-design/icons';
import { PrometheusPromQL } from '../promethues/index.jsx';  
import { queryPromMetrics } from '../../api/other.jsx';
import { debounce } from 'lodash';
import { SearchViewMetrics } from '../alert/preview/searchViewMetrics.tsx';

// 添加全局 ResizeObserver 错误处理
if (typeof window !== 'undefined') {
  // 保存原始的 ResizeObserver 构造函数
  const OriginalResizeObserver = window.ResizeObserver;
  
  // 重写 ResizeObserver 以添加错误处理
  window.ResizeObserver = class extends OriginalResizeObserver {
    constructor(callback) {
      // 包装回调函数以添加错误处理
      const wrappedCallback = (...args) => {
        try {
          callback(...args);
        } catch (error) {
          // 忽略 ResizeObserver 错误
          if (error.message && 
              (error.message.includes('ResizeObserver loop completed with undelivered notifications') ||
               error.message.includes('ResizeObserver loop limit exceeded'))) {
            // 静默处理这些错误
            return;
          }
          // 重新抛出其他错误
          throw error;
        }
      };
      
      super(wrappedCallback);
    }
  };
  
  // 添加全局错误处理
  window.addEventListener('error', (e) => {
    if (e.message && 
        (e.message.includes('ResizeObserver loop completed with undelivered notifications') ||
         e.message.includes('ResizeObserver loop limit exceeded'))) {
      e.stopImmediatePropagation();
      return false;
    }
  });
  
  // 处理 Promise rejection 形式的错误
  window.addEventListener('unhandledrejection', (e) => {
    if (e.reason && typeof e.reason === 'string' && 
        (e.reason.includes('ResizeObserver loop completed with undelivered notifications') || 
         e.reason.includes('ResizeObserver loop limit exceeded'))) {
      e.stopImmediatePropagation();
      return false;
    }
  });
}

const { Text } = Typography;
const { Option } = Select;

// --- 0. 配置常量与图标映射 ---
const LOCAL_STORAGE_KEY = 'reactflow-architecture-data';
const nodeWidth = 240;
const nodeHeight = 110;
const defaultDirection = 'TB';

// Prometheus 地址（默认）
const PROMETHEUS_ADDR = 'http://localhost:9090'; 

const IconComponentMap = {
  ApiOutlined, CloudServerOutlined, SettingOutlined, DatabaseOutlined, PlusOutlined, EditOutlined, SaveOutlined,
  GlobalOutlined, ForkOutlined, HddOutlined 
};

// --- 颜色配置 ---
const PRIMARY_BLUE = '#1890ff';
const LIGHT_BLUE = '#bae0ff';
const PRIMARY_EDGE_COLOR = '#000';
const SELECTED_EDGE_HIGHLIGHT = '#f5222d';

// --- 新增连接线样式 ---
const NEW_EDGE_COLOR = '#000';
const NEW_EDGE_STYLE = { stroke: NEW_EDGE_COLOR, strokeWidth: 2 };
const NEW_EDGE_MARKER = { type: MarkerType.ArrowClosed, color: NEW_EDGE_COLOR };

// --- Dagre 布局配置 (保持不变) ---
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = defaultDirection) => {
  dagreGraph.setGraph({ rankdir: direction, ranksep: 60, nodesep: 40 });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: node.style?.width || nodeWidth, height: node.style?.height || nodeHeight });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - (node.style?.width || nodeWidth) / 2,
        y: nodeWithPosition.y - (node.style?.height || nodeHeight) / 2,
      },
      positionAbsolute: undefined,
    };
  });
  return { nodes: layoutedNodes, edges };
};

// --- Layer Map ---
const layerMap = {
  // 核心 4 种类型
  Gateway: { label: '网关', color: '#1890ff', icon: 'GlobalOutlined', background: '#e6f7ff', lightColor: '#91d5ff' }, // 蓝色系
  Service: { label: '服务', color: '#52c41a', icon: 'CloudServerOutlined', background: '#f6ffed', lightColor: '#b7eb8f' }, // 绿色系
  Middleware: { label: '中间件', color: '#fa8c16', icon: 'ForkOutlined', background: '#fff7e6', lightColor: '#ffd591' }, // 橙色系
  Database: { label: '数据库', color: '#f5222d', icon: 'HddOutlined', background: '#fff1f0', lightColor: '#ffad9a' }, // 红色系

  // 默认/新增
  new: { label: '新增', color: PRIMARY_BLUE, icon: 'PlusOutlined', background: '#fff', lightColor: LIGHT_BLUE }
};
// 提取可编辑的节点类型
const nodeTypesList = ['Gateway', 'Service', 'Middleware', 'Database'];

// 比较运算符选项
const operatorOptions = [
  { label: '小于 (<)', value: '<' },
  { label: '小于等于 (<=)', value: '<=' },
  { label: '大于 (>)', value: '>' },
  { label: '大于等于 (>=)', value: '>=' },
  { label: '等于 (==)', value: '==' },
  { label: '不等于 (!=)', value: '!=' },
];

// 比较函数：根据运算符比较两个值
const compareValues = (value, threshold, operator) => {
  const val = parseFloat(value);
  const thresh = parseFloat(threshold);
  
  if (isNaN(val) || isNaN(thresh)) return false;
  
  switch (operator) {
    case '<':
      return val < thresh;
    case '<=':
      return val <= thresh;
    case '>':
      return val > thresh;
    case '>=':
      return val >= thresh;
    case '==':
      return val === thresh;
    case '!=':
      return val !== thresh;
    default:
      return val < thresh; // 默认使用小于
  }
};


// --- FlowingEdge ---
const FlowingEdge = memo(({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  style = {}, markerEnd, data, selected, label,
}) => {
  const [edgePath] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });
  const isNew = data?.isNew || false;

  let strokeColor = style?.stroke || (isNew ? NEW_EDGE_COLOR : PRIMARY_EDGE_COLOR);
  const strokeWidth = 2;
  if (selected) { strokeColor = SELECTED_EDGE_HIGHLIGHT; }

  // 所有连接线都使用动画效果，延长动画时间使传输效果更平滑
  const animationStyle = `flow-dot-${isNew ? 'new' : 'primary'} 5s linear infinite`;
  const dashArray = isNew ? '13, 5' : '13, 5';

  const finalStyle = {
    stroke: strokeColor,
    strokeWidth: selected ? 4 : strokeWidth,
    strokeDasharray: dashArray,
    animation: animationStyle,
    transition: 'stroke 2s, stroke-width 2s',
    cursor: 'pointer', // 添加鼠标指针提示
    filter: selected ? 'drop-shadow(0 0 4px rgba(34, 154, 245, 0.5))' : 'none', // 选中时添加阴影效果
    ...style
  };

  // 创建一个透明的辅助路径来扩大点击区域
  const helperPathStyle = {
    stroke: 'transparent',
    strokeWidth: 20, // 扩大点击区域
    fill: 'none',
    cursor: 'pointer'
  };

  const finalMarkerEnd = selected
    ? { type: MarkerType.ArrowClosed, color: SELECTED_EDGE_HIGHLIGHT }
    : markerEnd;

  // 计算文本位置
  const midpoint = {
    x: (sourceX + targetX) / 2,
    y: (sourceY + targetY) / 2,
  };

  // 处理文本换行
  const maxWidth = 100;
  const words = label.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    // 简单估算文本宽度（每个字符约7像素）
    const testWidth = testLine.length * 7;
    if (testWidth > maxWidth && currentLine !== '') {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  lines.push(currentLine);
  
  // 计算文本总高度
  const textHeight = lines.length * 16; // 每行约16像素高
  const textWidth = Math.max(...lines.map(line => line.length * 7)) + 8; // 最宽行的宽度
  
  return (
    <>
      <style>{`
        @keyframes flow-dot-primary { to { stroke-dashoffset: -30; } }
        @keyframes flow-dot-new { to { stroke-dashoffset: -36; } }
      `}</style>
      {/* 透明辅助路径，用于扩大点击区域 */}
      <path d={edgePath} style={helperPathStyle} />
      <path id={id} className="react-flow__edge-path" d={edgePath} markerEnd={finalMarkerEnd} style={finalStyle} />
      {label && (
        <>
          {/* 文本背景 */}
          <rect
            x={midpoint.x - textWidth / 2}
            y={midpoint.y - textHeight / 2}
            width={textWidth}
            height={textHeight}
            rx="4"
            ry="4"
            fill={selected ? '#e6f7ff' : 'white'}
            stroke={selected ? SELECTED_EDGE_HIGHLIGHT : '#ccc'}
            filter={selected ? 'drop-shadow(0 0 2px rgba(34, 129, 245, 0.3))' : 'none'}
            strokeWidth="1"
          />
          {lines.map((line, index) => (
            <text
              key={index}
              x={midpoint.x}
              y={midpoint.y - (lines.length - 1) * 8 + index * 16}
              textAnchor="middle"
              dominantBaseline="middle"
              style={{
                fill: selected ? SELECTED_EDGE_HIGHLIGHT : '#333',
                fontSize: 12,
                fontWeight: 'bold',
                pointerEvents: 'all',
              }}
              className="react-flow__edge-text"
            >
              {line}
            </text>
          ))}
        </>
      )}
    </>
  );
});

// --- 1. 自定义卡片节点 ---
const LayeredNode = memo(({ data, style }) => {
    const { label, subLabel, type, customIcon: customIconName } = data;
    // 使用新的 layerMap 结构
    const nodeConfig = layerMap[type] || layerMap.Service; // 默认使用 Service
    const { color, icon: iconName, background, lightColor } = nodeConfig;
    const DefaultIcon = IconComponentMap[iconName] || CloudServerOutlined;
    const FinalIcon = (customIconName && IconComponentMap[customIconName]) || DefaultIcon;

    // 添加悬停状态
    const [isHovered, setIsHovered] = useState(false);

    // 为不同位置的连接点创建样式，让它们只显示一半
    const handleBaseStyle = useMemo(() => ({
        width: '10px', 
        height: '10px', 
        backgroundColor: color, 
        border: `2px solid #fff`,
        borderRadius: '50%', 
        zIndex: 100, // 提高z-index确保连接点在Card之上显示
        boxShadow: `0 0 4px rgba(0, 0, 0, 0.3)`,
        opacity: isHovered ? 1 : 0,
        transition: 'opacity 0.2s ease-in-out',
    }), [color, isHovered]);

    // 顶部连接点样式 - 靠近顶部边缘并只显示下半部分
    const handleTopStyle = useMemo(() => ({
        ...handleBaseStyle,
        transform: 'translate(-50%, -50%)', // 靠近边缘并只显示下半部分
        position: 'absolute',
        top: '0%',
    }), [handleBaseStyle]);

    // 底部连接点样式 - 靠近底部边缘并只显示上半部分
    const handleBottomStyle = useMemo(() => ({
        ...handleBaseStyle,
        transform: 'translate(-50%, 50%)', // 靠近边缘并只显示上半部分
        position: 'absolute',
        bottom: '0%',
    }), [handleBaseStyle]);

    // 左侧连接点样式 - 靠近左侧边缘并只显示右半部分
    const handleLeftStyle = useMemo(() => ({
        ...handleBaseStyle,
        transform: 'translate(-50%, -50%)', // 靠近边缘并只显示右半部分
        position: 'absolute',
        left: '0%',
    }), [handleBaseStyle]);

    // 右侧连接点样式 - 靠近右侧边缘并只显示左半部分
    const handleRightStyle = useMemo(() => ({
        ...handleBaseStyle,
        transform: 'translate(50%, -50%)', // 靠近边缘并只显示左半部分
        position: 'absolute',
        right: '0%',
    }), [handleBaseStyle]);

    // 使用 useMemo 优化 Card 样式
    const cardStyle = useMemo(() => ({
        width: style?.width || nodeWidth, 
        height: style?.height || nodeHeight, 
        padding: 0,
        backgroundColor: '#FFFFFF', // 统一背景颜色为白色
        border: `1px solid #f0f0f0`,
        boxShadow: `0 4px 12px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)`, // 添加阴影效果
        transition: 'all 0.3s cubic-bezier(.25,.8,.25,1)',
        borderRadius: '8px', 
        overflow: 'hidden', 
        cursor: 'pointer', // 提示可点击
        // 添加CSS优化以减少重排和重绘
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        contain: 'layout style paint',
        ...style
    }), [style]);

    // 使用 useMemo 优化图标样式
    const iconStyle = useMemo(() => ({
        color: color, 
        fontSize: '32px', 
        marginRight: '10px'
    }), [color]);

    // 使用 useMemo 优化文本样式
    const labelStyle = useMemo(() => ({
        display: 'block', 
        fontSize: '12.5px', 
        lineHeight: 1.2, 
        color: '#333'
    }), []);

    const subLabelStyle = useMemo(() => ({
        fontSize: '12px', 
        lineHeight: 1.2
    }), []);

    // 使用 useMemo 优化指标显示样式
    const metricsContainerStyle = useMemo(() => ({
        marginTop: '8px', 
        fontSize: '12px', 
        color: '#666', 
        textAlign: 'left', 
        display: 'flex', 
        alignItems: 'center'
    }), []);

    const metricsTextStyle = useMemo(() => ({
        fontSize: '12px', 
        color: '#666'
    }), []);

    const warningIconStyle = useMemo(() => ({
        color: '#ff4d4f', 
        fontSize: '14px', 
        marginLeft: '6px'
    }), []);

    return (
        <Card
            size="small"
            style={cardStyle}
            bodyStyle={{ 
                padding: '12px 16px', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                position: 'relative' // 添加相对定位以便连接点正确定位
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onDoubleClick={(e) => {
                // 阻止事件冒泡
                e.stopPropagation();
                // 触发节点数据中的onClick处理函数
                if (data.onClick) {
                    data.onClick(data);
                }
            }}
            onClick={(e) => {
                // 阻止事件冒泡
                e.stopPropagation();
                // 触发节点数据中的onNodeClick处理函数
                if (data.onNodeClick) {
                    data.onNodeClick(data);
                }
            }}
        >
        {/* Handles - 每个位置使用对应的样式，让连接点只显示一半 */}
        <Handle type="target" position={Position.Top} id="top-target" style={handleTopStyle} />
        <Handle type="source" position={Position.Top} id="top-source" style={handleTopStyle} />
        <Handle type="target" position={Position.Bottom} id="bottom-target" style={handleBottomStyle} />
        <Handle type="source" position={Position.Bottom} id="bottom-source" style={handleBottomStyle} />
        <Handle type="target" position={Position.Left} id="left-target" style={handleLeftStyle} />
        <Handle type="source" position={Position.Left} id="left-source" style={handleLeftStyle} />
        <Handle type="target" position={Position.Right} id="right-target" style={handleRightStyle} />
        <Handle type="source" position={Position.Right} id="right-source" style={handleRightStyle} />

        <div style={{ display: 'flex', alignItems: 'center' }}>
            <FinalIcon style={iconStyle} />
            <div style={{ flexGrow: 1 }}>
                <Text strong style={labelStyle}>{label}</Text>
                <Text type="secondary" style={subLabelStyle}>{subLabel}</Text>
            </div>
        </div>

        {/* 指标数据显示区域，仅在启用 Prometheus 时显示 */}
        {data.enablePrometheus && (
            <div style={metricsContainerStyle}>
                <span>
                    {data.metricsLabel || 'QPS'} : <Text code style={metricsTextStyle}>{data.prometheusValue || 'NA'} {data.operator || '<'} {data.threshold || 'NA'}</Text>
                </span>
                {/* 当 Prometheus 值与阈值的比较结果为 true 时显示红色感叹号 */}
                {data.prometheusValue && data.threshold && compareValues(data.prometheusValue, data.threshold, data.operator || '<') && (
                    <ExclamationCircleOutlined style={warningIconStyle} />
                )}
            </div>
        )}
        </Card>
    );
});

const saveToLocalStorage = (nodes, edges) => {
  try {
    const savableNodes = nodes.map(n => ({
        ...n, 
        positionAbsolute: undefined, 
        dragging: undefined, 
        selected: undefined,
        // 保留重要的节点属性
        data: {
          ...n.data,
          // 确保保存所有 data 字段，包括 operator, threshold, prometheusQuery 等
        },
        draggable: n.draggable,
        style: {
          width: n.style?.width || nodeWidth,
          height: n.style?.height || nodeHeight,
          ...n.style
        },
        position: n.position
    }));
    const savableEdges = edges.map(e => ({ 
      ...e, 
      selected: undefined, 
      label: e.label || '',
      // 保留重要的连接线属性
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      data: e.data
    }));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ nodes: savableNodes, edges: savableEdges }));
    return true;
  } catch (error) { return false; }
};

// --- 2. 节点编辑 Drawer 组件 ---
const NodeEditorDrawer = ({ node, onClose, onUpdateNode, datasourceOptions, selectedDatasource, handleSelectedDsItem, metricAddress }) => {
    const [form] = Form.useForm();
    const [enablePrometheus, setEnablePrometheus] = useState(false);
    const [openMetricQueryModal, setOpenMetricQueryModal] = useState(false);
    const [viewMetricsModalKey, setViewMetricsModalKey] = useState(0);

    useEffect(() => {
        if (node) {      
            setEnablePrometheus(node.data.enablePrometheus)
  
            form.setFieldsValue({
                label: node.data.label,
                subLabel: node.data.subLabel,
                type: node.data.type,
                enablePrometheus: node.data.enablePrometheus,
                datasourceId: node.data.datasourceId || null,
                prometheusQuery: node.data.prometheusQuery || '',
                threshold: node.data.threshold || '',
                operator: node.data.operator || '<',
                metricsLabel: node.data.metricsLabel || 'QPS',
            });
            
            if (node.data.datasourceId) {
                handleSelectedDsItem(node.data.datasourceId);
            }
        }
    }, [node, form, handleSelectedDsItem]);

    const handleFinish = (values) => {
        // 获取 Prometheus 查询表达式的当前值
        const prometheusQuery = form.getFieldValue('prometheusQuery') || '';
        
        const updatedNode = {
            ...node,
            data: {
                ...node.data,
                ...values,
                enablePrometheus: enablePrometheus,
                datasourceId: enablePrometheus ? (selectedDatasource || null) : null,
                prometheusQuery: enablePrometheus ? prometheusQuery : '',
                threshold: enablePrometheus ? (values.threshold || '') : '',
                operator: enablePrometheus ? (values.operator || '<') : '<',
                metricsLabel: enablePrometheus ? (values.metricsLabel || 'QPS') : 'QPS',
            },
        };
        onUpdateNode(updatedNode);
        onClose();
    };

    if (!node) return null;

    return (
        <Drawer
            title={`编辑节点: ${node.data.label}`}
            width={800}
            onClose={onClose}
            open={!!node}
            bodyStyle={{ paddingBottom: 80 }}
            // 添加优化属性以减少 ResizeObserver 触发
            forceRender={false}
            destroyOnClose={true}
            extra={
                <Space>
                    <Button onClick={onClose}>取消</Button>
                    <Button onClick={() => form.submit()} type="primary" style={{backgroundColor: '#000', borderColor: '#000'}}>
                        保存
                    </Button>
                </Space>
            }
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
            >
                <Form.Item
                    name="label"
                    label="主标题 (Label)"
                    rules={[{ required: true, message: '请输入主标题' }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="subLabel"
                    label="副标题 (SubLabel)"
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="type"
                    label="节点类型 (Type)"
                    rules={[{ required: true, message: '请选择类型' }]}
                >
                    {/* 使用新的 nodeTypesList */}
                    <Select>
                        {nodeTypesList.map(type => (
                            <Option key={type} value={type}>{layerMap[type].label} ({type})</Option>
                        ))}
                    </Select>
                </Form.Item>
                
                {/* Prometheus 配置折叠面板 */}
                <Collapse 
                    // defaultActiveKey={enablePrometheus ? ['1'] : []} 
                    style={{ marginBottom: 16 }}
                >
                    <Collapse.Panel header={
                        <>
                            <span style={{ marginRight: 8 }}>启用 Prometheus 指标查询</span>
                            <Switch 
                                style={{marginTop: "-2.5px"}}
                                checked={enablePrometheus} 
                                onChange={(checked) => setEnablePrometheus(checked)}
                            />
                        </>
                    } key="1">
                        {/* 指标标识输入框 */}
                        <Form.Item
                            name="metricsLabel"
                            label="指标标识"
                            help="自定义指标显示标识，如：QPS、TPS、CPU、内存等"
                        >
                            <Input 
                                placeholder="QPS" 
                                disabled={!enablePrometheus}
                            />
                        </Form.Item>
                        
                        {/* 数据源选择 */}
                        <Form.Item
                            name="datasourceId"
                            label="关联数据源"
                            rules={[{ required: enablePrometheus, message: '请选择数据源' }]}
                        >
                            <Select
                                placeholder="选择数据源"
                                value={selectedDatasource}
                                onChange={handleSelectedDsItem}
                                options={datasourceOptions}
                                disabled={!enablePrometheus}
                            />
                        </Form.Item>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Form.Item
                                name="prometheusQuery"
                                label="Prometheus 查询表达式"
                                help="输入 Prometheus 查询表达式以获取指标数据"
                                style={{ width: '100%' }}
                            >
                                <PrometheusPromQL 
                                    addr={metricAddress}
                                    value={form.getFieldValue('prometheusQuery') || ''}
                                    setPromQL={(value) => form.setFieldsValue({ prometheusQuery: value })}
                                    // 添加防抖属性以减少 ResizeObserver 触发
                                    debounceDuration={300}
                                    // 添加其他优化属性
                                    style={{ width: '100%' }}
                                    // 延迟渲染以避免在组件挂载时触发过多的 resize 事件
                                    deferRender={true}
                                />
                            </Form.Item>
                            <Button
                                type="primary"
                                style={{ backgroundColor: '#000', borderColor: '#000', marginTop: '5px' }}
                                onClick={() => {
                                    if (!selectedDatasource) {
                                        message.error("请先选择数据源");
                                        return;
                                    }
                                    const promQL = form.getFieldValue('prometheusQuery');
                                    if (!promQL) {
                                        message.error("请先输入 Prometheus 查询表达式");
                                        return;
                                    }
                                    setViewMetricsModalKey(prev => prev + 1);
                                    setOpenMetricQueryModal(true);
                                }}
                            >
                                数据预览
                            </Button>
                        </div>
                        
                        {/* 阈值比较设置 */}
                        <Form.Item label="阈值比较">
                            <Space.Compact style={{ width: '100%' }}>
                                <Form.Item
                                    name="operator"
                                    noStyle
                                    rules={[{ required: enablePrometheus, message: '请选择运算符' }]}
                                >
                                    <Select style={{ width: '20%' }} placeholder="选择运算符" disabled={!enablePrometheus}>
                                        {operatorOptions.map(op => (
                                            <Option key={op.value} value={op.value}>{op.label}</Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                                <Form.Item
                                    name="threshold"
                                    noStyle
                                    rules={[{ required: enablePrometheus, message: '请输入阈值' }]}
                                >
                                    <Input style={{ width: '80%' }} placeholder="例如: 0.95" disabled={!enablePrometheus} />
                                </Form.Item>
                            </Space.Compact>
                        </Form.Item>
                    </Collapse.Panel>
                </Collapse>
            </Form>
            <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {node.id} | 类型: {node.type}
            </Text>

            {/* 数据预览 Modal */}
            <Modal
                title="Prometheus 数据预览"
                open={openMetricQueryModal}
                onCancel={() => setOpenMetricQueryModal(false)}
                footer={null}
                width={1000}
                styles={{
                    body: {
                        height: '80vh',
                        overflowY: 'auto',
                        padding: '12px',
                    },
                }}
            >
                <SearchViewMetrics
                    key={`search-view-${viewMetricsModalKey}`}
                    datasourceType="Prometheus"
                    datasourceId={selectedDatasource ? [selectedDatasource] : []}
                    promQL={form.getFieldValue('prometheusQuery') || ''}
                    displayMode='both'
                />
            </Modal>
        </Drawer>
    );
};

// --- 边缘编辑 Modal 组件 ---
const EdgeEditorModal = ({ edge, open, onClose, onUpdateEdge }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (edge) {
            form.setFieldsValue({
                label: edge.label || '',
                strokeWidth: 2 ,
            });
        }
    }, [edge, form]);

    const handleFinish = (values) => {
        const updatedEdge = {
            ...edge,
            label: values.label || '',
            style: {
                ...edge.style,
                strokeWidth: 2,
            }
        };
        onUpdateEdge(updatedEdge);
        onClose();
    };

    if (!edge) return null;

    return (
        <Modal
            title={`编辑连接线`}
            open={open}
            onCancel={onClose}
            onOk={() => form.submit()}
            okText="保存"
            cancelText="取消"
            width={600}
            forceRender={false}
            destroyOnClose={true}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
            >
                <Form.Item
                    name="label"
                    label="连接线文本"
                >
                    <Input placeholder="请输入连接线文本内容" />
                </Form.Item>
                {/* 删除连接线颜色选择器，使连接线颜色固定为默认样式 */}
            </Form>
            <Text type="secondary" style={{ fontSize: '12px' }}>
                ID: {edge.id}
            </Text>
        </Modal>
    );
};


// --- 3. 主组件 FlowContent ---
const FlowContent = ({ detailData, topologyId }) => {
  const [nodes, setNodes, onNodesChangeBase] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState([]);
  
  const { fitView, getViewport } = useReactFlow();

  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // 使用 useMemo 优化 nodeTypes 和 edgeTypes，防止不必要的重新渲染
  const nodeTypes = useMemo(() => ({ layered: LayeredNode }), []);
  const edgeTypes = useMemo(() => ({ 
    flowing: FlowingEdge, 
    defaultFlowing: FlowingEdge, 
    animated: FlowingEdge 
  }), []);

  // 自定义 onNodesChange 处理函数，确保在非编辑模式下不会改变节点位置
  const onNodesChange = useCallback((changes) => {
    // 在非编辑模式下，过滤掉位置变化相关的操作
    if (!isEditing) {
      const filteredChanges = changes.filter(change => 
        !(change.type === 'position' || change.type === 'dimensions')
      );
      onNodesChangeBase(filteredChanges);
    } else {
      // 在编辑模式下，允许所有操作
      onNodesChangeBase(changes);
    }
  }, [isEditing, onNodesChangeBase]);
  
  // 自定义 onEdgesChange 处理函数，确保在非编辑模式下不会改变连接线
  const onEdgesChange = useCallback((changes) => {
    // 在非编辑模式下，过滤掉添加和删除操作
    if (!isEditing) {
      const filteredChanges = changes.filter(change => 
        !(change.type === 'add' || change.type === 'remove')
      );
      onEdgesChangeBase(filteredChanges);
    } else {
      // 在编辑模式下，允许所有操作
      onEdgesChangeBase(changes);
    }
  }, [isEditing, onEdgesChangeBase]);
  
  const [selectedNode, setSelectedNode] = useState(null); // 新增状态：当前选中节点用于编辑
  const [selectedEdge, setSelectedEdge] = useState(null); // 新增状态：当前选中边缘用于编辑
  const [isEdgeModalOpen, setIsEdgeModalOpen] = useState(false); // 修改状态：边缘编辑模态框开启状态

  // 数据源相关状态
  const [datasourceOptions, setDatasourceOptions] = useState([]); // 数据源列表
  const [selectedDatasource, setSelectedDatasource] = useState(null); // 选中的数据源
  const [metricAddress, setMetricAddress] = useState(PROMETHEUS_ADDR); // Prometheus地址

  // 添加 Prometheus 查询定时器引用
  const prometheusIntervalRef = useRef(null);
  const fetchPrometheusDataRef = useRef(null);

  // --- 节点更新函数 (在 Modal 中调用) ---
  const onUpdateNode = useCallback(debounce((updatedNode) => {
    setNodes((nds) =>
        nds.map((node) =>
            node.id === updatedNode.id ? {
                ...updatedNode,
                // 保持原有的位置和样式信息
                position: node.position,
                positionAbsolute: node.positionAbsolute,
                style: {
                    ...node.style,
                    ...updatedNode.style
                },
                // 保持其他重要属性
                draggable: node.draggable,
                selected: node.selected,
                dragging: node.dragging
            } : node
        )
    );
  }, 300), [setNodes]); // 300ms 防抖，增加延迟以减少 ResizeObserver 触发

  // 获取数据源列表
  const handleGetDatasourceList = useCallback(async (nodeToEdit) => {
    try {
      const params = {
        type: 'Prometheus'
      };
      const res = await getDatasourceList(params);
      const newData = res.data?.map((item) => ({
        label: item.name,
        value: item.id,
        url: item.http?.url || '',
      })) || [];
      
      // 将数据设置为选项对象数组
      setDatasourceOptions(newData);
      
      // 优化: 根据节点数据设置 selectedDatasource 和 metricAddress
      let currentDsId = nodeToEdit?.data?.datasourceId;
      
      // 如果当前节点有关联数据源，则设置它
      if (currentDsId && newData.some(ds => ds.value === currentDsId)) {
        setSelectedDatasource(currentDsId);
        const dsInfo = newData.find(ds => ds.value === currentDsId);
        setMetricAddress(dsInfo.url || PROMETHEUS_ADDR);
      } 
      // 否则，如果列表不为空，默认选择第一个
      else if (newData.length > 0) {
        setSelectedDatasource(newData[0].value);
        setMetricAddress(newData[0].url || PROMETHEUS_ADDR);
      } 
      // 否则，重置
      else {
        setSelectedDatasource(null);
        setMetricAddress(PROMETHEUS_ADDR);
      }
      
    } catch (error) {
      console.error('获取数据源列表失败:', error);
      notification.error({ message: '获取数据源列表失败', description: error.message || '未知错误' });
      setSelectedDatasource(null);
      setMetricAddress(PROMETHEUS_ADDR);
    }
  }, []);
  
  // 处理数据源选择 (仅获取URL，不更新列表)
  const handleSelectedDsItem = useCallback(async (value) => {
    setSelectedDatasource(value);
    
    // 尝试从已有的 options 中获取 URL，减少 API 调用
    const selectedOption = datasourceOptions.find(opt => opt.value === value);

    if (selectedOption) {
        setMetricAddress(selectedOption.url || PROMETHEUS_ADDR);
    } else if (value) {
      // 如果找不到，则进行一次 API 调用获取详细信息（作为备选）
      try {
        const params = {
          id: value,
        };
        const res = await getDatasource(params);
        
        if (res?.data?.http?.url) {
          setMetricAddress(res.data.http.url);
        } else {
          setMetricAddress(PROMETHEUS_ADDR);
        }
      } catch (error) {
        console.error('获取数据源信息失败:', error);
        setMetricAddress(PROMETHEUS_ADDR);
      }
    } else {
      setMetricAddress(PROMETHEUS_ADDR);
    }
  }, [datasourceOptions]); // 依赖 datasourceOptions

  // --- 节点点击事件 (打开 Drawer) ---
  const onNodeClick = useCallback((event, node) => {
    if (!isEditing) return; // 仅在编辑模式下响应点击打开 Drawer
    
    // 在设置 selectedNode 之前获取数据源列表，以确保 Drawer 打开时列表已加载
    handleGetDatasourceList(node).then(() => {
        // 添加延迟以避免在打开 Drawer 时触发过多的 resize 事件
        setTimeout(() => {
          setSelectedNode(node);
        }, 200); // 增加延迟到200ms
    });

  }, [isEditing, handleGetDatasourceList]);

  // --- 关闭 Modal ---
  const onCloseEdgeModal = () => {
    setIsEdgeModalOpen(false); // 修改为关闭模态框
    setSelectedEdge(null);
  }

  
  const loadAndLayout = useCallback(async (direction = defaultDirection) => {
    setIsLoading(true);
    try {
        // 如果提供了detailData且不为null，则使用detailData中的nodes和edges
        if (detailData !== null && detailData !== undefined) {
            let currentNodes = detailData.nodes || [];
            let currentEdges = detailData.edges || [];
            
            // 如果有节点数据，则进行布局计算
            // 仅当节点没有有效的position属性时才进行自动布局（即初始数据或重置数据）
            // 判断条件：节点数量大于0，且第一个节点的position为{x:0,y:0}（初始状态）
            if (currentNodes.length > 0 && currentNodes[0].position && currentNodes[0].position.x === 0 && currentNodes[0].position.y === 0) {
                const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(currentNodes, currentEdges, direction);
                currentNodes = layoutedNodes;
                currentEdges = layoutedEdges;
            }
            
            // 添加防抖处理以避免在设置节点时触发过多的 resize 事件
            setTimeout(() => {
              setNodes(currentNodes.map(n => ({
                  ...n, 
                  draggable: isEditing,
                  data: {
                      ...n.data,
                      // 确保加载时保留所有 data 字段，包括 operator
                      operator: n.data?.operator || '<', // 如果没有 operator，默认使用 '<'
                      metricsLabel: n.data?.metricsLabel || 'QPS', // 如果没有 metricsLabel，默认使用 'QPS'
                      // 添加点击处理函数
                      onNodeClick: (nodeData) => {
                          if (isEditing) {
                              handleGetDatasourceList(n).then(() => {
                                  setTimeout(() => {
                                      setSelectedNode(n);
                                  }, 200);
                              });
                          }
                      }
                  }
              })));
            }, 100); // 增加延迟到100ms
            
            setTimeout(() => {
              setEdges(currentEdges.map(e => ({
                  ...e,
                  type: e.type || 'flowing',
                  style: e.style || { stroke: PRIMARY_EDGE_COLOR, strokeWidth: 2 },
                  markerEnd: e.markerEnd || { type: MarkerType.ArrowClosed, color: PRIMARY_EDGE_COLOR },
                  label: e.label || ''
              })));
            }, 100); // 增加延迟到100ms
        } else {
            // 如果detailData为null或undefined，则不渲染任何内容
            setNodes([]);
            setEdges([]);
        }

        setTimeout(() => {
          fitView();
        }, 100); // 增加延迟到100ms
    } catch (error) {
        notification.error({ message: '加载失败', description: '数据初始化失败' });
    } finally { 
      setTimeout(() => {
        setIsLoading(false);
      }, 100); // 增加延迟到100ms
    }
  }, [setNodes, setEdges, fitView, isEditing, detailData]);

  useEffect(() => { 
    loadAndLayout(defaultDirection);
  }, [detailData]); 

  // --- 新增连接线 (保持不变) ---
  const onConnect = useCallback((params) => {
      if (!isEditing) return;

      setEdges((eds) => addEdge({
          ...params,
          type: 'defaultFlowing',
          style: { ...NEW_EDGE_STYLE },
          markerEnd: NEW_EDGE_MARKER,
          data: { isNew: true },
          label: ''
      }, eds))
  }, [setEdges, isEditing]);

  // 新增节点, 模式切换, 保存, 重置 (部分更新: 新增节点的默认类型)
  const addNewNode = useCallback(() => {
    if (!isEditing) return;
    const viewport = getViewport();
    const position = { x: (viewport.x * -1) + (window.innerWidth / 2) / viewport.zoom, y: (viewport.y * -1) + (window.innerHeight / 2) / viewport.zoom };
    const newNode = {
      id: `node_${Date.now()}`, type: 'layered', position: { x: position.x - (nodeWidth / 2), y: position.y - (nodeHeight / 2) },
      data: { 
        label: `新服务 ${nodes.length + 1}`, 
        subLabel: '自定义添加', 
        type: 'Service', 
        datasourceId: selectedDatasource, 
        operator: '<',
        metricsLabel: 'QPS',
        // 添加点击处理函数
        onNodeClick: (nodeData) => {
            if (isEditing) {
                handleGetDatasourceList(newNode).then(() => {
                    setTimeout(() => {
                        setSelectedNode(newNode);
                    }, 200);
                });
            }
        }
      }, // 新节点默认使用当前选中的数据源ID和默认运算符
      draggable: true,
      style: {
        width: nodeWidth,
        height: nodeHeight
      }
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, nodes.length, getViewport, isEditing, selectedDatasource, handleGetDatasourceList]); // 依赖 selectedDatasource

  const toggleEditing = useCallback(() => {
    const newEditingState = !isEditing;
    setIsEditing(newEditingState);
    setNodes((nds) => nds.map(node => ({ 
        ...node, 
        draggable: newEditingState,
        data: {
            ...node.data,
            // 更新点击处理函数
            onNodeClick: (nodeData) => {
                if (newEditingState) {
                    handleGetDatasourceList(node).then(() => {
                        setTimeout(() => {
                            setSelectedNode(node);
                        }, 200);
                    });
                }
            }
        }
    })));
    // 切换到编辑模式时，预加载数据源列表
    if (newEditingState && datasourceOptions.length === 0) {
        handleGetDatasourceList(null); 
    }
  }, [isEditing, setNodes, datasourceOptions.length, handleGetDatasourceList]);

  const handleSubmit = useCallback(async () => {
    // 保存到本地存储
    if (saveToLocalStorage(nodes, edges)) {
        // 调用API保存拓扑数据
        try {
            // 准备保存的节点数据，确保保留所有必要属性（包括 data 中的所有字段）
            const savableNodes = nodes.map(n => ({
                ...n,
                data: {
                    ...n.data,
                    // 确保保存所有 data 字段，包括 operator
                },
                draggable: n.draggable,
                style: {
                  width: n.style?.width || nodeWidth,
                  height: n.style?.height || nodeHeight,
                  ...n.style
                }
            }));
            
            // 准备保存的连接线数据，确保保留所有必要属性
            const savableEdges = edges.map(e => ({
                ...e,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                data: e.data
            }));
            
            const params = {
                id: topologyId,
                nodes: savableNodes,
                edges: savableEdges
            };
            await TopologyUpdate(params);
        } catch (error) {
            console.error('保存拓扑数据失败:', error);
        }
        toggleEditing();
    }
  }, [nodes, edges, toggleEditing, topologyId]);

  const handleReload = useCallback(() => {
    loadAndLayout(defaultDirection);
    if (isEditing) toggleEditing();
  }, [loadAndLayout, isEditing, toggleEditing]);

  // 添加 Prometheus 数据查询函数
  const fetchPrometheusData = useCallback(async () => {
    try {
      // 获取所有包含 Prometheus 查询信息且启用了 Prometheus 的节点
      const prometheusNodes = nodes.filter(node => 
        node.data.enablePrometheus && node.data.datasourceId && node.data.prometheusQuery
      );

      // 如果没有需要查询的节点，直接返回
      if (prometheusNodes.length === 0) {
        return;
      }

      // 为每个节点查询 Prometheus 数据
      const updatedNodes = [...nodes];
      let hasUpdates = false;

      for (const node of prometheusNodes) {
        try {
          const params = {
            datasourceIds: node.data.datasourceId,
            query: node.data.prometheusQuery,
          };

          const res = await queryPromMetrics(params);

          if (res.code === 200 && res.data && res.data.length > 0) {
            const result = res.data[0];
            if (result.status === "success" && result.data?.result?.length > 0) {
              // 获取最后一个值
              const value = parseFloat(result.data.result[0].value[1]).toFixed(2);
              
              // 查找对应的节点索引
              const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
              if (nodeIndex !== -1 && updatedNodes[nodeIndex].data.prometheusValue !== value) {
                updatedNodes[nodeIndex] = {
                  ...updatedNodes[nodeIndex],
                  data: {
                    ...updatedNodes[nodeIndex].data,
                    prometheusValue: value
                  }
                };
                hasUpdates = true;
              }
            }
          }
        } catch (error) {
          console.error(`Failed to fetch Prometheus data for node ${node.id}:`, error);
        }
      }

      // 只有在有更新时才设置节点状态
      if (hasUpdates) {
        setNodes(updatedNodes);
      }
    } catch (error) {
      console.error("Failed to fetch Prometheus data:", error);
    }
  }, [nodes, setNodes]);

  // 更新 ref 以保持最新的函数引用
  useEffect(() => {
    fetchPrometheusDataRef.current = fetchPrometheusData;
  }, [fetchPrometheusData]);

  // 启动和清理 Prometheus 查询定时器
  useEffect(() => {
    // 初始加载时查询一次，延迟1秒避免组件挂载时立即触发
    const initialTimeout = setTimeout(() => {
      if (fetchPrometheusDataRef.current) {
        fetchPrometheusDataRef.current();
      }
    }, 1000);

    // 启动定时器，每60秒查询一次数据
    prometheusIntervalRef.current = setInterval(() => {
      if (fetchPrometheusDataRef.current) {
        fetchPrometheusDataRef.current();
      }
    }, 60000); // 60秒(1分钟)

    // 组件卸载时清理定时器
    return () => {
      clearTimeout(initialTimeout);
      if (prometheusIntervalRef.current) {
        clearInterval(prometheusIntervalRef.current);
      }
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  return (
    <div style={{ height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-black rounded-lg" style={{height: "40px", width: "40px"}}>
                <NodeIndexOutlined className="text-white items-center p-1"/>
            </div>
            <div>
                <p className="text-xl font-bold text-gray-900">{detailData.name}</p>
            </div>
          </div>
          <Space>
              {isEditing ? (
                  <>
                      <Button 
                          type="primary" 
                          icon={<SaveOutlined />} 
                          onClick={handleSubmit}
                          style={{
                              backgroundColor: '#000000'
                          }}
                      >保存</Button>
                      <Button 
                          onClick={handleReload}
                      >取消编辑</Button>
                  </>
              ) : (
                <Button 
                    type="primary" 
                    icon={<EditOutlined />} 
                    onClick={toggleEditing}
                    style={{
                        backgroundColor: '#000000'
                    }}
                >编辑</Button>
              )}

            <Button icon={<PlusOutlined />} onClick={addNewNode} disabled={!isEditing}>新增</Button>
            <Button onClick={() => fitView()}>视图</Button>
          </Space>
        </div>

      {isEditing && (
          <div style={{ padding: '8px 24px', background: '#fff1f0' , borderBottom: '1px solid #f0f0f0' }}>
              <Text type={'danger'} style={{ fontSize: '13px' }}>
                  {'编辑模式：拖拽移动节点，双击节点或双击连接线弹出编辑窗口，选中连线后按 Backspace/Delete 可删除。'}
              </Text>
          </div>
      )}

      <div style={{ 
        flex: 1, 
        minHeight: 0,
        // 添加 CSS 优化来减少重排和重绘
        willChange: 'transform',
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: '1000px',
        // 添加以下样式以优化性能
        contain: 'layout style paint'
      }} className="reactflow-wrapper">
          <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick} // 关键：处理节点点击事件
          onNodeDoubleClick={(event, node) => {
              // 阻止事件冒泡
              event.stopPropagation();
              // 如果在编辑模式下，触发节点编辑
              if (isEditing) {
                  // 在双击时调用，与 onNodeClick 行为一致，确保数据源列表加载
                  handleGetDatasourceList(node).then(() => {
                      // 添加延迟以避免在打开 Drawer 时触发过多的 resize 事件
                      setTimeout(() => {
                        setSelectedNode(node);
                      }, 300); // 增加延迟到300ms
                  });
              }
          }}
          onEdgeDoubleClick={(event, edge) => {
              // 阻止事件冒泡
              event.stopPropagation();
              // 如果在编辑模式下，触发边缘编辑
              if (isEditing) {
                  // 添加延迟以避免在打开模态框时触发过多的 resize 事件
                  setTimeout(() => {
                    setSelectedEdge(edge);
                    setIsEdgeModalOpen(true);
                  }, 300); // 增加延迟到300ms
              }
          }}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode="loose"
          nodesDraggable={isEditing}
          nodesConnectable={isEditing}
          elementsSelectable={true}
          deleteKeyCode={isEditing ? ['Backspace', 'Delete'] : null}
          multiSelectionKeyCode={['Meta', 'Shift', 'Ctrl']}
          fitView={false}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
          minZoom={0.2}
          maxZoom={4}
          // 添加以下属性来优化性能和减少 ResizeObserver 触发
          elevateNodesOnSelect={false}
          elevateEdgesOnSelect={false}
          disableKeyboardA11y={true}
          // 添加性能优化属性
          connectOnClick={false}
          // 添加更多性能优化
          snapToGrid={false}
          snapGrid={[15, 15]}
          onlyRenderVisibleElements={true}
          // 添加额外的性能优化属性以减少 ResizeObserver 错误
          preventScrolling={true}
          zoomOnScroll={false}
          panOnScroll={true}
          panOnDrag={true}
          >
          <Controls showFitView={false} showInteractive={false} />
          <MiniMap />
          <Background color="#f7f7f7" gap={20} size={1} />
          </ReactFlow>
      </div>

        {/* 渲染 NodeEditorDrawer */}
        <NodeEditorDrawer
            node={selectedNode}
            onClose={() => setSelectedNode(false)}
            onUpdateNode={onUpdateNode}
            datasourceOptions={datasourceOptions}
            selectedDatasource={selectedDatasource}
            handleSelectedDsItem={handleSelectedDsItem}
            metricAddress={metricAddress}
        />
        {/* 渲染 EdgeEditorModal */}
        <EdgeEditorModal
            edge={selectedEdge}
            open={isEdgeModalOpen} // 修改为使用模态框状态
            onClose={onCloseEdgeModal} // 修改为使用模态框关闭函数
            onUpdateEdge={(updatedEdge) => {
                setEdges((eds) =>
                    eds.map((edge) =>
                        edge.id === updatedEdge.id ? updatedEdge : edge
                    )
                );
                onCloseEdgeModal(); // 修改为使用模态框关闭函数
            }}
        />
    </div>
  );
};

export const FlowPage = ({ detailData, topologyId }) => (
    <ReactFlowProvider>
        <FlowContent detailData={detailData} topologyId={topologyId} />
    </ReactFlowProvider>
);

export default FlowPage;