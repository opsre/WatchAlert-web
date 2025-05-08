"use client"

import React, { useState, useEffect } from "react"
import {
    Table,
    Button,
    Drawer,
    Tag,
    Select,
    Space,
    DatePicker,
    Input,
    message,
    Modal,
    Checkbox,
    Radio,
    Descriptions
} from "antd"
import { DownloadOutlined } from "@ant-design/icons"
import dayjs from "dayjs"
import { getHisEventList } from "../../api/event"
import TextArea from "antd/es/input/TextArea"
import {AlertTriangle} from "lucide-react";

export const AlertHistoryEvent = (props) => {
    const { id } = props
    const { RangePicker } = DatePicker
    const { Search } = Input

    // 状态管理
    const [historyEventList, setHistoryEventList] = useState([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDataSource, setSelectedDataSource] = useState("")
    const [selectedAlertLevel, setSelectedAlertLevel] = useState("")
    const [startTimestamp, setStartTimestamp] = useState(null)
    const [endTimestamp, setEndTimestamp] = useState(null)
    const [drawerOpen, setDrawerOpen] = useState(false)
    const [selectedEvent, setSelectedEvent] = useState(null)
    const [historyPagination, setHistoryPagination] = useState({
        pageIndex: 1,
        pageSize: 10,
        pageTotal: 0,
    })
    const [loading, setLoading] = useState(true)
    const [height, setHeight] = useState(window.innerHeight)

    // 导出相关状态
    const [exportModalVisible, setExportModalVisible] = useState(false)
    const [exportTimeRange, setExportTimeRange] = useState([null, null])
    const [exportFilters, setExportFilters] = useState({
        ruleName: "",
        ruleType: "",
        alertLevel: "",
    })
    const [exportLoading, setExportLoading] = useState(false)
    const [exportOptions, setExportOptions] = useState({
        timeRange: "all", // all, custom
        filterOptions: [], // ruleName, ruleType, alertLevel
        itemsPerPage: 10, // 导出HTML的每页项目数
    })
    // Constants
    const SEVERITY_COLORS = {
        P0: '#ff4d4f',
        P1: '#faad14',
        P2: '#b0e1fb'
    }

    const SEVERITY_LABELS = {
        P0: "P0",
        P1: "P1",
        P2: "P2",
    }

    // 表格列定义
    const columns = [
        {
            title: "规则名称",
            dataIndex: "rule_name",
            key: "rule_name",
        },
        {
            title: "告警等级",
            dataIndex: "severity",
            key: "severity",
            width: "100px",
            render: (text) => (
                <Tag
                    color={SEVERITY_COLORS[text]}
                    style={{
                        borderRadius: "12px",
                        padding: "0 10px",
                        fontSize: "12px",
                        fontWeight: "500",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                    }}
                >
                    <AlertTriangle size={12} />
                    {SEVERITY_LABELS[text] || text}
                </Tag>
            ),
        },
        {
            title: "事件详情",
            dataIndex: "annotations",
            key: "annotations",
            width: "auto",
            ellipsis: true,
            render: (text, record) => (
                <span>
                    { (record.datasource_type === "AliCloudSLS"
                        || record.datasource_type === "Loki"
                        || record.datasource_type === "ElasticSearch"
                        || record.datasource_type === "VictoriaLogs") && (
                        <span>
                            {JSON.stringify(record?.log, null, 2).substring(0, 50)}...
                        </span>
                    ) || (
                        <span>
                            {record.annotations.substring(0, 50)}...
                        </span>
                    ) }
                </span>
            ),
        },
        {
            title: "触发时间",
            dataIndex: "first_trigger_time",
            key: "first_trigger_time",
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: "恢复时间",
            dataIndex: "recover_time",
            key: "recover_time",
            render: (text) => {
                const date = new Date(text * 1000)
                return date.toLocaleString()
            },
        },
        {
            title: "事件状态",
            dataIndex: "status",
            key: "status",
            render: () => {
                return  <Tag color={"green"}>{"已恢复"}</Tag>
            },
        },
        {
            title: "处理人",
            dataIndex: "upgradeState",
            key: "upgradeState",
            render: (text) => {
                return (
                    <>
                        {text.whoAreConfirm === text.whoAreHandle && (
                            <Tag
                                style={{
                                    borderRadius: "12px",
                                    padding: "0 10px",
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                {text.whoAreHandle || "无"}
                            </Tag>
                        ) || (
                            <>
                                {text.whoAreConfirm !== "" && (
                                    <Tag
                                        style={{
                                            borderRadius: "12px",
                                            padding: "0 10px",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                        }}
                                    >
                                        {text.whoAreConfirm}
                                    </Tag>
                                )}
                                {text.whoAreHandle !== "" && (
                                    <Tag
                                        style={{
                                            borderRadius: "12px",
                                            padding: "0 10px",
                                            fontSize: "12px",
                                            fontWeight: "500",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "4px",
                                        }}
                                    >
                                        {text.whoAreHandle}
                                    </Tag>
                                )}
                            </>
                        )}
                    </>
                )
            },
        },
        {
            title: "操作",
            key: "action",
            width: "50px",
            render: (_, record) => <Button onClick={() => showDrawer(record)}>详情</Button>,
        },
    ]

    const rangePresets = [
        {
            label: "Last 7 Days",
            value: [dayjs().subtract(7, "d"), dayjs()],
        },
        {
            label: "Last 14 Days",
            value: [dayjs().subtract(14, "d"), dayjs()],
        },
        {
            label: "Last 30 Days",
            value: [dayjs().subtract(30, "d"), dayjs()],
        },
        {
            label: "Last 90 Days",
            value: [dayjs().subtract(90, "d"), dayjs()],
        },
    ]

    // 副作用
    useEffect(() => {
        // 处理窗口大小变化
        const handleResize = () => {
            setHeight(window.innerHeight)
        }

        window.addEventListener("resize", handleResize)
        return () => {
            window.removeEventListener("resize", handleResize)
        }
    }, [])

    useEffect(() => {
        const url = new URL(window.location)
        const queryParam = url.searchParams.get("query")
        if (queryParam) {
            setSearchQuery(queryParam)
        }
    }, [])

    useEffect(() => {
        handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)
    }, [
        selectedDataSource,
        selectedAlertLevel,
        startTimestamp,
        endTimestamp,
        searchQuery,
        historyPagination.pageIndex,
        historyPagination.pageSize,
    ])

    // 事件处理函数
    const showDrawer = (record) => {
        setSelectedEvent(record)
        setDrawerOpen(true)
    }

    const onCloseDrawer = () => {
        setDrawerOpen(false)
    }

    const handleDataSourceChange = (value) => {
        setSelectedDataSource(value)
    }

    const handleHistoryEventList = async (pageIndex, pageSize) => {
        try {
            const params = {
                faultCenterId: id,
                index: pageIndex,
                size: pageSize,
                query: searchQuery || undefined,
                datasourceType: selectedDataSource || undefined,
                severity: selectedAlertLevel || undefined,
                startAt: startTimestamp || undefined,
                endAt: endTimestamp || undefined,
            }
            setLoading(true)
            const res = await getHisEventList(params)
            setLoading(false)
            setHistoryEventList(res.data.list)
            setHistoryPagination({
                ...historyPagination,
                pageIndex: res.data.index,
                pageTotal: res.data.total,
            })
        } catch (error) {
            console.error(error)
            setLoading(false)
        }
    }

    const handleShowTotal = (total, range) => `第 ${range[0]} - ${range[1]} 条 共 ${total} 条`

    const handleHistoryPageChange = (page) => {
        setHistoryPagination({ ...historyPagination, pageIndex: page.current, pageSize: page.pageSize })
        handleHistoryEventList(page.current, page.pageSize)
    }

    const handleSearch = (value) => {
        setSearchQuery(value)
        handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)
    }

    const handleSeverityChange = (value) => {
        setSelectedAlertLevel(value)
    }

    const onChange = (dates) => {
        if (dates && dates.length === 2) {
            onOk(dates)
        }
    }

    const onOk = (dates) => {
        if (dates && dates[0] && dates[1]) {
            setStartTimestamp(dates[0].unix())
            setEndTimestamp(dates[1].unix())
        }
    }

    // 打开导出对话框
    const openExportModal = () => {
        // 使用当前筛选条件作为默认值
        setExportFilters({
            ruleName: searchQuery,
            ruleType: selectedDataSource,
            alertLevel: selectedAlertLevel,
        })
        setExportTimeRange([
            startTimestamp ? dayjs.unix(startTimestamp) : null,
            endTimestamp ? dayjs.unix(endTimestamp) : null,
        ])
        setExportOptions({
            ...exportOptions,
            timeRange: startTimestamp && endTimestamp ? "custom" : "all",
            filterOptions: [
                ...(searchQuery ? ["ruleName"] : []),
                ...(selectedDataSource ? ["ruleType"] : []),
                ...(selectedAlertLevel ? ["alertLevel"] : []),
            ],
        })
        setExportModalVisible(true)
    }

    // 导出相关函数
    const fetchExportData = async () => {
        try {
            // 构建导出参数
            const params = {
                faultCenterId: id,
                index: 1,
                size: 10000, // 获取足够多的数据用于导出
                query: exportFilters.ruleName || undefined,
                datasourceType: exportFilters.ruleType || undefined,
                severity: exportFilters.alertLevel || undefined,
                startAt: exportOptions.timeRange === "custom" && exportTimeRange[0] ? exportTimeRange[0].unix() : undefined,
                endAt: exportOptions.timeRange === "custom" && exportTimeRange[1] ? exportTimeRange[1].unix() : undefined,
            }

            setExportLoading(true)
            const res = await getHisEventList(params)
            setExportLoading(false)

            return res.data.list
        } catch (error) {
            console.error(error)
            setExportLoading(false)
            message.error("获取导出数据失败")
            return []
        }
    }

    // 生成HTML内容
    const generateHtmlContent = (data) => {
        // 计算统计信息
        const totalCount = data.length
        const p0Count = data.filter((item) => item.severity === "P0").length
        const p1Count = data.filter((item) => item.severity === "P1").length
        const p2Count = data.filter((item) => item.severity === "P2").length

        // 生成时间范围文本
        let timeRangeText = "全部时间"
        if (exportOptions.timeRange === "custom" && exportTimeRange[0] && exportTimeRange[1]) {
            const startTime = exportTimeRange[0].format("YYYY-MM-DD HH:mm:ss")
            const endTime = exportTimeRange[1].format("YYYY-MM-DD HH:mm:ss")
            timeRangeText = `${startTime} 至 ${endTime}`
        }

        // 生成筛选条件文本
        const filterTexts = []
        if (exportFilters.ruleName) {
            filterTexts.push(`规则名称: ${exportFilters.ruleName}`)
        }
        if (exportFilters.ruleType) {
            filterTexts.push(`规则类型: ${exportFilters.ruleType}`)
        }
        if (exportFilters.alertLevel) {
            filterTexts.push(`告警等级: ${exportFilters.alertLevel}`)
        }
        const filterText = filterTexts.length > 0 ? filterTexts.join(", ") : "无"

        // 生成表格行数据（所有数据）
        const allTableRows = data.map((item, index) => {
            const triggerTime = new Date(item.first_trigger_time * 1000).toLocaleString()
            const recoverTime = new Date(item.recover_time * 1000).toLocaleString()

            // 根据告警等级设置颜色
            const severityColor = SEVERITY_COLORS[item.severity] || "gray"

            return {
                index: index + 1,
                html: `
          <tr class="data-row" data-page="1">
            <td>${index + 1}</td>
            <td>${item.rule_name}</td>
            <td>
              <div style="display: flex; align-items: center;">
                <div style="width: 8px; height: 8px; background-color: ${severityColor}; border-radius: 50%; margin-right: 8px;"></div>
                ${item.severity}
              </div>
            </td>
            <td>${item.annotations ? item.annotations.substring(0, 100) : ""}</td>
            <td>${triggerTime}</td>
            <td>${recoverTime}</td>
            <td>${item.datasource_type}</td>
          </tr>
        `,
            }
        })

        // 计算总页数
        const itemsPerPage = exportOptions.itemsPerPage
        const totalPages = Math.ceil(data.length / itemsPerPage)

        // 生成分页JavaScript
        const paginationScript = `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const itemsPerPage = ${itemsPerPage};
          const totalItems = ${data.length};
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          
          // 初始化分页
          showPage(1);
          updatePagination(1, totalPages);
          
          // 添加分页按钮事件监听
          document.getElementById('pagination').addEventListener('click', function(e) {
            if (e.target.classList.contains('page-btn')) {
              const page = parseInt(e.target.dataset.page);
              showPage(page);
              updatePagination(page, totalPages);
            }
          });
          
          // 上一页按钮
          document.getElementById('prev-page').addEventListener('click', function() {
            const currentPage = parseInt(document.querySelector('.page-btn.active').dataset.page);
            if (currentPage > 1) {
              showPage(currentPage - 1);
              updatePagination(currentPage - 1, totalPages);
            }
          });
          
          // 下一页按钮
          document.getElementById('next-page').addEventListener('click', function() {
            const currentPage = parseInt(document.querySelector('.page-btn.active').dataset.page);
            if (currentPage < totalPages) {
              showPage(currentPage + 1);
              updatePagination(currentPage + 1, totalPages);
            }
          });
          
          // 显示指定页
          function showPage(page) {
            // 隐藏所有行
            const rows = document.querySelectorAll('.data-row');
            rows.forEach(row => {
              row.style.display = 'none';
            });
            
            // 计算当前页应该显示的行
            const start = (page - 1) * itemsPerPage;
            const end = Math.min(start + itemsPerPage, totalItems);
            
            // 显示当前页的行
            for (let i = start; i < end; i++) {
              rows[i].style.display = '';
              // 更新行号
              rows[i].querySelector('td:first-child').textContent = i + 1;
            }
            
            // 更新显示的项目范围
            document.getElementById('item-range').textContent = 
              \`显示第 \${start + 1} - \${end} 条，共 \${totalItems} 条\`;
          }
          
          // 更新分页按钮
          function updatePagination(currentPage, totalPages) {
            const pagination = document.getElementById('pagination');
            const pageButtons = pagination.querySelectorAll('.page-btn');
            
            // 移除所有现有的页码按钮
            pageButtons.forEach(btn => {
              if (!btn.classList.contains('nav-btn')) {
                btn.remove();
              }
            });
            
            // 添加新的页码按钮
            const maxButtons = 5; // 最多显示的按钮数
            let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);
            
            // 调整起始页，确保显示足够的按钮
            if (endPage - startPage + 1 < maxButtons && startPage > 1) {
              startPage = Math.max(1, endPage - maxButtons + 1);
            }
            
            // 插入点是上一页按钮
            const insertPoint = document.getElementById('prev-page');
            
            // 添加第一页按钮（如果不是从第一页开始）
            if (startPage > 1) {
              const firstBtn = document.createElement('button');
              firstBtn.className = 'page-btn';
              firstBtn.dataset.page = 1;
              firstBtn.textContent = '1';
              pagination.insertBefore(firstBtn, insertPoint.nextSibling);
              
              // 添加省略号
              if (startPage > 2) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'ellipsis';
                ellipsis.textContent = '...';
                pagination.insertBefore(ellipsis, firstBtn.nextSibling);
              }
            }
            
            // 添加页码按钮
            for (let i = startPage; i <= endPage; i++) {
              const btn = document.createElement('button');
              btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
              btn.dataset.page = i;
              btn.textContent = i;
              pagination.insertBefore(btn, document.getElementById('next-page'));
            }
            
            // 添加最后一页按钮（如果不是到最后一页结束）
            if (endPage < totalPages) {
              // 添加省略号
              if (endPage < totalPages - 1) {
                const ellipsis = document.createElement('span');
                ellipsis.className = 'ellipsis';
                ellipsis.textContent = '...';
                pagination.insertBefore(ellipsis, document.getElementById('next-page'));
              }
              
              const lastBtn = document.createElement('button');
              lastBtn.className = 'page-btn';
              lastBtn.dataset.page = totalPages;
              lastBtn.textContent = totalPages;
              pagination.insertBefore(lastBtn, document.getElementById('next-page'));
            }
            
            // 更新上一页/下一页按钮状态
            document.getElementById('prev-page').disabled = currentPage === 1;
            document.getElementById('next-page').disabled = currentPage === totalPages;
          }
        });
      </script>
    `

        // 生成完整HTML
        return `
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>告警历史报表</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          h1 {
            text-align: center;
            margin-bottom: 20px;
            color: #1a1a1a;
          }
          .summary-container {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
            background-color: #f9f9f9;
            padding: 15px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .summary-box {
            text-align: center;
            padding: 10px 20px;
            border-radius: 4px;
            min-width: 120px;
          }
          .total-box {
            background-color: #e6f7ff;
            border: 1px solid #91d5ff;
          }
          .p0-box {
            background-color: #fff1f0;
            border: 1px solid #ffa39e;
          }
          .p1-box {
            background-color: #fff7e6;
            border: 1px solid #ffd591;
          }
          .p2-box {
            background-color: #feffe6;
            border: 1px solid #fffb8f;
          }
          .summary-number {
            font-size: 24px;
            font-weight: bold;
            margin: 5px 0;
          }
          .filter-info {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
            border-radius: 4px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          th, td {
            padding: 12px 15px;
            text-align: left;
            border-bottom: 1px solid #ddd;
          }
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }
          tr:hover {
            background-color: #f5f5f5;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #888;
          }
          .pagination-container {
            margin-top: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .pagination {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-top: 10px;
          }
          .page-btn, .nav-btn {
            margin: 0 5px;
            padding: 5px 10px;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 3px;
            cursor: pointer;
            min-width: 30px;
            text-align: center;
          }
          .page-btn:hover, .nav-btn:hover {
            background-color: #e0e0e0;
          }
          .page-btn.active {
            background-color: #1890ff;
            color: white;
            border-color: #1890ff;
          }
          .ellipsis {
            margin: 0 5px;
          }
          .item-range {
            margin-bottom: 10px;
            color: #666;
          }
          button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }
          @media print {
            .pagination-container {
              display: none;
            }
            .data-row {
              display: table-row !important;
            }
          }
        </style>
      </head>
      <body>
        <h1>告警历史报表</h1>
        
        <div class="summary-container">
          <div class="summary-box total-box">
            <div>总告警数</div>
            <div class="summary-number">${totalCount}</div>
          </div>
          <div class="summary-box p0-box">
            <div>P0级告警</div>
            <div class="summary-number">${p0Count}</div>
            <div>${totalCount > 0 ? Math.round((p0Count / totalCount) * 100) : 0}%</div>
          </div>
          <div class="summary-box p1-box">
            <div>P1级告警</div>
            <div class="summary-number">${p1Count}</div>
            <div>${totalCount > 0 ? Math.round((p1Count / totalCount) * 100) : 0}%</div>
          </div>
          <div class="summary-box p2-box">
            <div>P2级告警</div>
            <div class="summary-number">${p2Count}</div>
            <div>${totalCount > 0 ? Math.round((p2Count / totalCount) * 100) : 0}%</div>
          </div>
        </div>
        
        <div class="filter-info">
          <p><strong>时间范围:</strong> ${timeRangeText}</p>
          <p><strong>筛选条件:</strong> ${filterText}</p>
          <p><strong>导出时间:</strong> ${new Date().toLocaleString()}</p>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>序号</th>
              <th>规则名称</th>
              <th>告警等级</th>
              <th>事件详情</th>
              <th>触发时间</th>
              <th>恢复时间</th>
              <th>数据源类型</th>
            </tr>
          </thead>
          <tbody>
            ${allTableRows.map((row) => row.html).join("")}
          </tbody>
        </table>
        
        <div class="pagination-container">
          <div id="item-range" class="item-range">显示第 1 - ${Math.min(itemsPerPage, data.length)} 条，共 ${data.length} 条</div>
          <div id="pagination" class="pagination">
            <button id="prev-page" class="nav-btn" disabled>&lt; 上一页</button>
            <button id="next-page" class="nav-btn" ${totalPages <= 1 ? "disabled" : ""}>&gt; 下一页</button>
          </div>
        </div>
        
        <div class="footer">
          <p>此报表由系统自动生成 - ${new Date().toLocaleDateString()}</p>
        </div>
        
        ${paginationScript}
      </body>
      </html>
    `
    }

    // 导出为HTML文件
    const exportToHtml = async () => {
        const data = await fetchExportData()

        if (data.length === 0) {
            message.warning("没有符合条件的数据可导出")
            return
        }

        // 生成HTML内容
        const htmlContent = generateHtmlContent(data)

        // 创建Blob对象
        const blob = new Blob([htmlContent], { type: "text/html" })

        // 创建下载链接
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `告警历史报表_${new Date().toISOString().split("T")[0]}.html`

        // 触发下载
        document.body.appendChild(link)
        link.click()

        // 清理
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        // 关闭导出对话框
        setExportModalVisible(false)
        message.success("导出成功")
    }

    const handleExportOptionsChange = (type, value) => {
        if (type === "timeRange") {
            setExportOptions({
                ...exportOptions,
                timeRange: value,
            })
        } else if (type === "filterOptions") {
            setExportOptions({
                ...exportOptions,
                filterOptions: value,
            })
        } else if (type === "itemsPerPage") {
            setExportOptions({
                ...exportOptions,
                itemsPerPage: value,
            })
        }
    }

    // 渲染JSX
    return (
        <React.Fragment>
            {/* 筛选和操作区域 */}
            <Space style={{ marginBottom: 16 }} wrap>
                <Search
                    allowClear
                    placeholder="输入搜索关键字"
                    onSearch={handleSearch}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: 200 }}
                />
                <Select
                    placeholder="选择类型"
                    style={{ width: 150 }}
                    allowClear
                    value={selectedDataSource || null}
                    onChange={handleDataSourceChange}
                    options={[
                        { value: "Prometheus", label: "Prometheus" },
                        { value: "VictoriaMetrics", label: "VictoriaMetrics" },
                        { value: "AliCloudSLS", label: "AliCloudSLS" },
                        { value: "Jaeger", label: "Jaeger" },
                        { value: "Loki", label: "Loki" },
                        { value: "ElasticSearch", label: "ElasticSearch" },
                        { value: "VictoriaLogs", label: "VictoriaLogs" },
                    ]}
                />
                <Select
                    placeholder="选择告警等级"
                    style={{ width: 150 }}
                    allowClear
                    value={selectedAlertLevel || null}
                    onChange={handleSeverityChange}
                    options={[
                        { value: "P0", label: "P0级告警" },
                        { value: "P1", label: "P1级告警" },
                        { value: "P2", label: "P2级告警" },
                    ]}
                />
                <RangePicker showTime format="YYYY-MM-DD HH:mm:ss" onChange={onChange} onOk={onOk} presets={rangePresets} />
                <Button onClick={() => handleHistoryEventList(historyPagination.pageIndex, historyPagination.pageSize)}>
                    刷新
                </Button>
                <Button icon={<DownloadOutlined />} onClick={openExportModal}>
                    导出
                </Button>
            </Space>

            {/* 数据表格 */}
            <Table
                columns={columns}
                dataSource={historyEventList}
                loading={loading}
                pagination={{
                    current: historyPagination.pageIndex,
                    pageSize: historyPagination.pageSize,
                    total: historyPagination.pageTotal,
                    showTotal: handleShowTotal,
                }}
                onChange={handleHistoryPageChange}
                style={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    overflow: "hidden",
                }}
                rowClassName={(record, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50")}
                rowKey={(record) => record.id}
                scroll={{
                    y: height - 480,
                    x: "max-content",
                }}
            />

            {/* 详情抽屉 */}
            <Drawer
                title="事件详情"
                placement="right"
                onClose={onCloseDrawer}
                open={drawerOpen}
                width={520}
                styles={{
                    body: { padding: "16px" },
                }}
            >
                {selectedEvent && (
                    <div>
                        <Descriptions
                            title="基本信息"
                            bordered
                            column={1}
                            style={{ marginBottom: "24px" }}
                            items={[
                                {
                                    key: "rule_name",
                                    label: "规则名称",
                                    children: selectedEvent.rule_name,
                                },
                                {
                                    key: "fingerprint",
                                    label: "告警指纹",
                                    children: selectedEvent.fingerprint,
                                },
                                {
                                    key: "datasource",
                                    label: "数据源",
                                    children: `${selectedEvent.datasource_type} (${selectedEvent.datasource_id})`,
                                },
                                {
                                    key: "severity",
                                    label: "告警等级",
                                    children: <Tag color={SEVERITY_COLORS[selectedEvent.severity]}>{selectedEvent.severity}</Tag>,
                                },
                                {
                                    key: "status",
                                    label: "事件状态",
                                    children: (
                                        <Tag color={"green"}>{"已恢复"}</Tag>
                                    ),
                                },
                                {
                                    key: "value",
                                    label: "触发时值",
                                    children: selectedEvent.metric["value"],
                                },
                                {
                                    key: "value",
                                    label: "恢复时值",
                                    children: selectedEvent.metric["recover_value"],
                                },
                                {
                                    key: "handle",
                                    label: "处理人",
                                    children: (
                                        <>
                                            {selectedEvent?.upgradeState?.whoAreConfirm === selectedEvent?.upgradeState?.whoAreHandle && (
                                                <Tag
                                                    style={{
                                                        borderRadius: "12px",
                                                        padding: "0 10px",
                                                        fontSize: "12px",
                                                        fontWeight: "500",
                                                        display: "inline-flex",
                                                        alignItems: "center",
                                                        gap: "4px",
                                                    }}
                                                >
                                                    {selectedEvent?.upgradeState?.whoAreHandle || "无"}
                                                </Tag>
                                            ) || (
                                                <>
                                                    {selectedEvent?.upgradeState?.whoAreConfirm !== "" && (
                                                        <Tag
                                                            style={{
                                                                borderRadius: "12px",
                                                                padding: "0 10px",
                                                                fontSize: "12px",
                                                                fontWeight: "500",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                            }}
                                                        >
                                                            {selectedEvent?.upgradeState?.whoAreConfirm}
                                                        </Tag>
                                                    )}
                                                    {selectedEvent?.upgradeState?.whoAreHandle !== "" && (
                                                        <Tag
                                                            style={{
                                                                borderRadius: "12px",
                                                                padding: "0 10px",
                                                                fontSize: "12px",
                                                                fontWeight: "500",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: "4px",
                                                            }}
                                                        >
                                                            {selectedEvent?.upgradeState?.whoAreHandle}
                                                        </Tag>
                                                    )}
                                                </>
                                            )}
                                        </>
                                    ),
                                },
                            ]}
                        />

                        <div style={{ marginBottom: "16px" }}>
                            <h4>事件标签:</h4>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                {Object.entries(selectedEvent.metric).map(([key, value]) => (
                                    <Tag color="processing" key={key}>{`${key}: ${value}`}</Tag>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4>事件详情:</h4>
                            { (selectedEvent.datasource_type === "AliCloudSLS"
                                || selectedEvent.datasource_type === "Loki"
                                || selectedEvent.datasource_type === "ElasticSearch"
                                || selectedEvent.datasource_type === "VictoriaLogs") && (
                                <TextArea
                                    value={JSON.stringify(selectedEvent.log, null, 2)}
                                    style={{
                                        height: 400,
                                        resize: "none",
                                        marginTop: "8px",
                                    }}
                                    readOnly
                                />
                            ) || (
                                <TextArea
                                    value={selectedEvent.annotations}
                                    style={{
                                        height: 400,
                                        resize: "none",
                                        marginTop: "8px",
                                    }}
                                    readOnly
                                />
                            ) }
                        </div>
                    </div>
                )}
            </Drawer>

            {/* 导出配置对话框 */}
            <Modal
                title="导出告警历史"
                open={exportModalVisible}
                onCancel={() => setExportModalVisible(false)}
                footer={[
                    <Button key="cancel" onClick={() => setExportModalVisible(false)}>
                        取消
                    </Button>,
                    <Button key="export" type="primary" loading={exportLoading} onClick={exportToHtml}>
                        导出
                    </Button>,
                ]}
                width={600}
            >
                <div style={{ marginBottom: 16 }}>
                    <h4>时间范围</h4>
                    <Radio.Group
                        value={exportOptions.timeRange}
                        onChange={(e) => handleExportOptionsChange("timeRange", e.target.value)}
                    >
                        <Radio value="all">全部时间</Radio>
                        <Radio value="custom">自定义时间范围</Radio>
                    </Radio.Group>

                    {exportOptions.timeRange === "custom" && (
                        <div style={{ marginTop: 8 }}>
                            <RangePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                value={exportTimeRange}
                                onChange={(dates) => setExportTimeRange(dates)}
                                style={{ width: "100%" }}
                                presets={rangePresets}
                            />
                        </div>
                    )}
                </div>

                <div style={{ marginBottom: 16 }}>
                    <h4>筛选条件</h4>
                    <Checkbox.Group
                        value={exportOptions.filterOptions}
                        onChange={(values) => handleExportOptionsChange("filterOptions", values)}
                    >
                        <Space direction="vertical">
                            <Checkbox value="ruleName">按规则名称筛选</Checkbox>
                            {exportOptions.filterOptions.includes("ruleName") && (
                                <Input
                                    placeholder="输入规则名称关键字"
                                    value={exportFilters.ruleName}
                                    onChange={(e) => setExportFilters({ ...exportFilters, ruleName: e.target.value })}
                                    style={{ width: 300, marginLeft: 24 }}
                                />
                            )}

                            <Checkbox value="ruleType">按规则类型筛选</Checkbox>
                            {exportOptions.filterOptions.includes("ruleType") && (
                                <Select
                                    placeholder="选择规则类型"
                                    style={{ width: 300, marginLeft: 24 }}
                                    allowClear
                                    value={exportFilters.ruleType || null}
                                    onChange={(value) => setExportFilters({ ...exportFilters, ruleType: value })}
                                    options={[
                                        { value: "Prometheus", label: "Prometheus" },
                                        { value: "VictoriaMetrics", label: "VictoriaMetrics" },
                                        { value: "AliCloudSLS", label: "AliCloudSLS" },
                                        { value: "Jaeger", label: "Jaeger" },
                                        { value: "Loki", label: "Loki" },
                                    ]}
                                />
                            )}

                            <Checkbox value="alertLevel">按告警等级筛选</Checkbox>
                            {exportOptions.filterOptions.includes("alertLevel") && (
                                <Select
                                    placeholder="选择告警等级"
                                    style={{ width: 300, marginLeft: 24 }}
                                    allowClear
                                    value={exportFilters.alertLevel || null}
                                    onChange={(value) => setExportFilters({ ...exportFilters, alertLevel: value })}
                                    options={[
                                        { value: "P0", label: "P0级告警" },
                                        { value: "P1", label: "P1级告警" },
                                        { value: "P2", label: "P2级告警" },
                                    ]}
                                />
                            )}
                        </Space>
                    </Checkbox.Group>
                </div>

                <div style={{ marginBottom: 16 }}>
                    <h4>分页设置</h4>
                    <div style={{ marginTop: 8 }}>
                        <span style={{ marginRight: 8 }}>每页显示条数:</span>
                        <Select
                            value={exportOptions.itemsPerPage}
                            onChange={(value) => handleExportOptionsChange("itemsPerPage", value)}
                            style={{ width: 120 }}
                            options={[
                                { value: 10, label: "10条/页" },
                                { value: 20, label: "20条/页" },
                                { value: 50, label: "50条/页" },
                                { value: 100, label: "100条/页" },
                            ]}
                        />
                    </div>
                </div>
            </Modal>
        </React.Fragment>
    )
}

