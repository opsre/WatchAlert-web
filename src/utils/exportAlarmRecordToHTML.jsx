// 颜色映射
import {message} from "antd";

const SEVERITY_COLORS = {
    P0: '#ff4d4f',
    P1: '#faad14',
    P2: '#b0e1fb'
};

/**
 * 生成 HTML 内容
 */
function generateHtmlContent(title, data, exportFilters, exportTimeRange) {
    const totalCount = data.length;
    const p0Count = data.filter((item) => item.severity === "P0").length;
    const p1Count = data.filter((item) => item.severity === "P1").length;
    const p2Count = data.filter((item) => item.severity === "P2").length;

    let timeRangeText = "全部时间";
    if (exportTimeRange[0] && exportTimeRange[1]) {
        const startTime = exportTimeRange[0].format("YYYY-MM-DD HH:mm:ss");
        const endTime = exportTimeRange[1].format("YYYY-MM-DD HH:mm:ss");
        timeRangeText = `${startTime} 至 ${endTime}`;
    }

    const filterTexts = [];
    if (exportFilters.ruleName) filterTexts.push(`规则名称: ${exportFilters.ruleName}`);
    if (exportFilters.ruleType) filterTexts.push(`规则类型: ${exportFilters.ruleType}`);
    if (exportFilters.alertLevel) filterTexts.push(`告警等级: ${exportFilters.alertLevel}`);
    const filterText = filterTexts.length > 0 ? filterTexts.join(", ") : "无";

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
            <td>${JSON.stringify(item.labels, null, 2)}</td>
            <td>${item.annotations ? item.annotations.substring(0, 100) : ""}</td>
            <td>${triggerTime}</td>
            <td>${recoverTime}</td>
            <td>${item.datasource_type}</td>
          </tr>
        `,
        }
    })

    // 计算总页数
    const itemsPerPage = 10;
    const totalPages = Math.ceil(data.length / itemsPerPage);

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
            rows.forEach(row => row.style.display = 'none');

            const start = (page - 1) * itemsPerPage;
            const end = Math.min(start + itemsPerPage, totalItems);

            for (let i = start; i < end; i++) {
              rows[i].style.display = '';
              rows[i].querySelector('td:first-child').textContent = i + 1;
            }

            document.getElementById('item-range').textContent = \`显示第 \${start + 1} - \${end} 条，共 \${totalItems} 条\`;
          }

          // 更新分页按钮
          function updatePagination(currentPage, totalPages) {
            const pagination = document.getElementById('pagination');
            const pageButtons = pagination.querySelectorAll('.page-btn');
            pageButtons.forEach(btn => btn.remove());

            const maxButtons = 5;
            let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);

            if (endPage - startPage + 1 < maxButtons && startPage > 1) {
              startPage = Math.max(1, endPage - maxButtons + 1);
            }

            const insertPoint = document.getElementById('prev-page');
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
              pagination.insertBefore(btn, document.getElementById('next-page'));
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
        <title>${title}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 100%;
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
        <h1>${title}</h1>
        
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
              <th>事件标签</th>
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
          <p>此报表由 WatchAlert 自动生成 - ${new Date().toLocaleDateString()}</p>
        </div>
        
        ${paginationScript}
      </body>
      </html>
    `;
}

/**
 * 导出为 HTML 报告
 */
export async function exportAlarmRecordToHTML(title, data, exportFilters, exportTimeRange = [null, null]) {
    if (!Array.isArray(data) || data.length === 0) {
        alert("没有符合条件的数据可导出");
        return;
    }

    // 生成HTML内容
    const htmlContent = generateHtmlContent(title, data, exportFilters, exportTimeRange);

    // 创建下载链接
    const blob = new Blob([htmlContent], { type: "text/html" });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${title}_${new Date().toISOString().split("T")[0]}.html`;

    // 触发下载
    document.body.appendChild(link);
    link.click();

    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    message.success("导出成功")
}