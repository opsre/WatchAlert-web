import { message } from "antd";

// 颜色映射
const SEVERITY_COLORS = {
    P0: '#ff4d4f', // 红色，表示最高优先级
    P1: '#faad14', // 橙色，表示高优先级
    P2: '#b0e1fb'  // 浅蓝色，表示中优先级
};

/**
 * 生成 HTML 内容
 * @param {string} title - 报告标题
 * @param {Array<Object>} data - 告警数据
 * @param {Array<moment.Moment | null>} exportTimeRange - 导出时间范围，格式为 [startTime, endTime]
 * @returns {string} 生成的 HTML 字符串
 */
function generateHtmlContent(title, data, exportTimeRange) {
    const totalCount = data.length;
    const p0Count = data.filter((item) => item.severity === "P0").length;
    const p1Count = data.filter((item) => item.severity === "P1").length;
    const p2Count = data.filter((item) => item.severity === "P2").length;

    // 格式化时间范围
    let timeRangeText = "全部时间";
    if (exportTimeRange[0] && exportTimeRange[1]) {
        const startTime = exportTimeRange[0].format("YYYY-MM-DD HH:mm:ss");
        const endTime = exportTimeRange[1].format("YYYY-MM-DD HH:mm:ss");
        timeRangeText = `${startTime} 至 ${endTime}`;
    }

    // 生成表格行
    const allTableRows = data.map((item, index) => {
        const triggerTime = item.first_trigger_time ? new Date(item.first_trigger_time * 1000).toLocaleString() : 'N/A';
        const recoverTime = item.recover_time ? new Date(item.recover_time * 1000).toLocaleString() : 'N/A';

        // 根据告警等级设置颜色
        const severityColor = SEVERITY_COLORS[item.severity] || "gray"; // 默认灰色

        return `
      <tr class="data-row">
        <td>${index + 1}</td>
        <td>${item.rule_name || 'N/A'}</td>
        <td>
          <div style="display: flex; align-items: center;">
            <div style="width: 8px; height: 8px; background-color: ${severityColor}; border-radius: 50%; margin-right: 8px;"></div>
            ${item.severity || 'N/A'}
          </div>
        </td>
        <td class="json-cell"><pre>${item.labels ? JSON.stringify(item.labels, null, 2) : 'N/A'}</pre></td>
        <td>${item.annotations ? item.annotations.substring(0, 100) + (item.annotations.length > 100 ? '...' : '') : 'N/A'}</td>
        <td>${triggerTime}</td>
        <td>${recoverTime}</td>
        <td>${item.datasource_type || 'N/A'}</td>
      </tr>
    `;
    }).join(''); // 将所有行连接成一个字符串

    // 分页设置
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);

    // JavaScript 分页逻辑
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
          const currentPage = parseInt(document.querySelector('.page-btn.active')?.dataset.page || 1);
          if (currentPage > 1) {
            showPage(currentPage - 1);
            updatePagination(currentPage - 1, totalPages);
          }
        });

        // 下一页按钮
        document.getElementById('next-page').addEventListener('click', function() {
          const currentPage = parseInt(document.querySelector('.page-btn.active')?.dataset.page || 1);
          if (currentPage < totalPages) {
            showPage(currentPage + 1);
            updatePagination(currentPage + 1, totalPages);
          }
        });

        // 显示指定页
        function showPage(page) {
          const rows = document.querySelectorAll('.data-row');
          rows.forEach(row => row.style.display = 'none'); // 隐藏所有行

          const start = (page - 1) * itemsPerPage;
          const end = Math.min(start + itemsPerPage, totalItems);

          for (let i = start; i < end; i++) {
            rows[i].style.display = ''; // 显示当前页的行
            // 更新序号，使其始终正确显示当前页的序号
            rows[i].querySelector('td:first-child').textContent = i + 1; 
          }

          document.getElementById('item-range').textContent = \`显示第 \${start + 1} - \${end} 条，共 \${totalItems} 条\`;
        }

        // 更新分页按钮
        function updatePagination(currentPage, totalPages) {
          const pagination = document.getElementById('pagination');
          // 移除旧的分页按钮，保留前后翻页按钮
          Array.from(pagination.children).forEach(child => {
            if (child.id !== 'prev-page' && child.id !== 'next-page') {
              child.remove();
            }
          });

          const maxButtons = 5; // 最多显示5个页码按钮
          let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
          let endPage = Math.min(totalPages, startPage + maxButtons - 1);

          // 调整 startPage 和 endPage，确保始终显示 maxButtons 个按钮（如果可能）
          if (endPage - startPage + 1 < maxButtons) {
            startPage = Math.max(1, endPage - maxButtons + 1);
          }

          // 插入页码按钮
          const insertPoint = document.getElementById('prev-page'); // 在 prev-page 之后插入

          if (startPage > 1) {
            const firstBtn = document.createElement('button');
            firstBtn.className = 'page-btn';
            firstBtn.dataset.page = 1;
            firstBtn.textContent = '1';
            pagination.insertBefore(firstBtn, insertPoint.nextSibling);
            if (startPage > 2) {
              const ellipsis = document.createElement('span');
              ellipsis.className = 'ellipsis';
              ellipsis.textContent = '...';
              pagination.insertBefore(ellipsis, firstBtn.nextSibling);
            }
          }

          for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
            btn.dataset.page = i;
            btn.textContent = i;
            pagination.insertBefore(btn, document.getElementById('next-page')); // 在 next-page 之前插入
          }

          if (endPage < totalPages) {
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
  `;

    return `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - 告警报告</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          /* 移除 max-width，让内容铺满全屏幕 */
          width: 100vw; /* 视口宽度 */
          min-height: 100vh; /* 确保最小高度为视口高度 */
          margin: 0; /* 移除外边距 */
          padding: 20px; /* 保持内边距，提供内容与边缘的间距 */
          background-color: #f4f7f6;
          box-sizing: border-box; /* 确保 padding 不会增加总宽度 */
          /* 移除 box-shadow 和 border-radius，因为是全屏页面，这些效果不明显 */
        }
        h1 {
          text-align: center;
          margin-bottom: 30px;
          color: #2c3e50;
          font-size: 2.2em;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 10px;
        }
        .summary-container {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
          padding: 15px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        }
        .summary-box {
          text-align: center;
          padding: 20px;
          border-radius: 8px;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          border: 1px solid #e0e0e0;
        }
        .summary-box:hover {
          transform: translateY(-5px);
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
        .total-box { background-color: #eaf6ff; border-color: #91d5ff; }
        .p0-box { background-color: #fff0f0; border-color: #ffccc7; }
        .p1-box { background-color: #fffbe6; border-color: #ffe58f; }
        .p2-box { background-color: #e6f7ff; border-color: #a0d911; } /* Adjusted P2 color for better contrast */

        .summary-box div:first-child {
          font-size: 1.1em;
          color: #555;
          margin-bottom: 8px;
        }
        .summary-number {
          font-size: 2.5em;
          font-weight: bold;
          color: #333;
          margin: 5px 0;
        }
        .summary-box div:last-child {
          font-size: 1em;
          color: #777;
        }

        .report-info {
          margin-bottom: 25px;
          padding: 15px 20px;
          background-color: #ffffff;
          border-left: 5px solid #1890ff;
          border-radius: 4px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.05);
        }
        .report-info p {
          margin: 5px 0;
          color: #555;
        }
        .report-info strong {
          color: #333;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 25px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.08);
          border-radius: 8px;
          overflow: hidden; /* Ensures rounded corners apply to content */
        }
        th, td {
          padding: 12px 18px;
          text-align: left;
          border-bottom: 1px solid #f0f0f0;
          word-break: break-word; /* Prevent long words from breaking layout */
        }
        th {
          background-color: #f7f9fa;
          font-weight: bold;
          color: #444;
          text-transform: uppercase;
          font-size: 0.9em;
        }
        tr:nth-child(even) {
          background-color: #fafafa;
        }
        tr:hover {
          background-color: #e6f7ff;
          transition: background-color 0.1s ease-in-out;
        }
        .json-cell pre {
            white-space: pre-wrap; /* Preserve whitespace and wrap long lines */
            word-wrap: break-word; /* Break long words */
            font-size: 0.85em;
            background-color: #f8f8f8;
            padding: 5px;
            border-radius: 3px;
            max-height: 100px; /* Limit height of JSON cell */
            overflow-y: auto; /* Add scroll if content exceeds max-height */
        }

        .pagination-container {
          margin-top: 30px;
          display: flex;
          flex-direction: column;
          align-items: center;
          background-color: #ffffff;
          padding: 15px;
          border-radius: 8px;
          box-shadow: 0 1px 5px rgba(0,0,0,0.05);
        }
        .item-range {
          margin-bottom: 15px;
          color: #666;
          font-size: 0.95em;
        }
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px; /* Spacing between buttons */
        }
        .page-btn, .nav-btn {
          padding: 8px 15px;
          background-color: #f0f2f5;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          cursor: pointer;
          min-width: 40px;
          text-align: center;
          font-size: 1em;
          transition: all 0.2s ease-in-out;
        }
        .page-btn:hover, .nav-btn:hover {
          background-color: #e6f7ff;
          border-color: #91d5ff;
          color: #1890ff;
        }
        .page-btn.active {
          background-color: #1890ff;
          color: white;
          border-color: #1890ff;
          font-weight: bold;
          box-shadow: 0 2px 8px rgba(24,144,255,0.2);
        }
        .ellipsis {
          margin: 0 5px;
          color: #999;
          font-weight: bold;
        }
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background-color: #f5f5f5;
          color: #bfbfbf;
        }
        button:disabled:hover {
          background-color: #f5f5f5; /* Keep background static on hover when disabled */
          border-color: #d9d9d9;
          color: #bfbfbf;
        }

        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 0.85em;
          color: #999;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }
        @media print {
          .pagination-container {
            display: none;
          }
          .data-row {
            display: table-row !important;
          }
          body {
            box-shadow: none;
            margin: 0;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <h1>${title}告警报告</h1>
      
      <div class="summary-container">
        <div class="summary-box p0-box">
          <div>总告警数</div>
          <div class="summary-number">${totalCount}</div>
          <div> </div>
        </div>
        <div class="summary-box p0-box">
          <div>P0级告警</div>
          <div class="summary-number">${p0Count}</div>
          <div>占比: ${totalCount > 0 ? Math.round((p0Count / totalCount) * 100) : 0}%</div>
        </div>
        <div class="summary-box p1-box">
          <div>P1级告警</div>
          <div class="summary-number">${p1Count}</div>
          <div>占比: ${totalCount > 0 ? Math.round((p1Count / totalCount) * 100) : 0}%</div>
        </div>
        <div class="summary-box p2-box">
          <div>P2级告警</div>
          <div class="summary-number">${p2Count}</div>
          <div>占比: ${totalCount > 0 ? Math.round((p2Count / totalCount) * 100) : 0}%</div>
        </div>
      </div>
      
      <div class="report-info">
        <p><strong>报告生成时间:</strong> ${new Date().toLocaleString()}</p>
        <p><strong>数据时间范围:</strong> ${timeRangeText}</p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>序号</th>
            <th>规则名称</th>
            <th>告警等级</th>
            <th>事件标签</th>
            <th>事件详情</th>
            <th>触发时间</th>
            <th>恢复时间</th>
            <th>数据源类型</th>
          </tr>
        </thead>
        <tbody>
          ${allTableRows}
        </tbody>
      </table>
      
      <div class="pagination-container">
        <div id="item-range" class="item-range">显示第 1 - ${Math.min(itemsPerPage, data.length)} 条，共 ${data.length} 条</div>
        <div id="pagination" class="pagination">
          <button id="prev-page" class="nav-btn" disabled>&lt; 上一页</button>
          <button id="next-page" class="nav-btn" ${totalPages <= 1 ? "disabled" : ""}>下一页 &gt;</button>
        </div>
      </div>
      
      <div class="footer">
        <p>此报表由 WatchAlert 自动生成</p>
      </div>
      
      ${paginationScript}
    </body>
    </html>
  `;
}

/**
 * 导出为 HTML 报告
 * @param {string} title - 报告标题
 * @param {Array<Object>} data - 要导出的告警数据
 * @param {Array<moment.Moment | null>} exportTimeRange - 导出时间范围，格式为 [startTime, endTime]
 */
export async function exportAlarmRecordToHTML(title, data, exportTimeRange = [null, null]) {
    if (!Array.isArray(data) || data.length === 0) {
        message.warning("没有符合条件的数据可导出，请检查！");
        return;
    }

    // 生成HTML内容
    const htmlContent = generateHtmlContent(title, data, exportTimeRange);

    // 创建下载链接
    const blob = new Blob([htmlContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}_告警报告_${new Date().toISOString().split("T")[0]}.html`;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success("告警报告导出成功！🎉");
}