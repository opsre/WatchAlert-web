import React from 'react';
import { Table, Pagination } from 'antd';

/**
 * 带分页的表格组件，支持可选的多选功能
 * @param {Object} props - 组件属性
 * @param {Array} props.columns - 表格列配置
 * @param {Array} props.dataSource - 表格数据源
 * @param {Object} props.pagination - 分页配置 {index, size, total}
 * @param {Function} props.onPageChange - 页码变化回调
 * @param {Function} props.onPageSizeChange - 页面大小变化回调
 * @param {number} props.scrollY - 垂直滚动高度
 * @param {string} props.rowKey - 行唯一标识字段名，默认'id'
 * @param {Function} props.showTotal - 显示总数的函数
 * @param {boolean} props.loading - 加载状态
 * @param {Object} props.locale - 国际化配置
 * @param {Object} props.rowSelection - 行选择配置（Antd原生配置）
 * @param {Array} props.selectedRowKeys - 已选择的行keys
 * @param {Function} props.onSelectChange - 选择变化回调 (selectedRowKeys, selectedRows) => void
 * @param {boolean} props.selectAll - 是否支持全选，默认false
 */
export const TableWithPagination = ({
  columns,
  dataSource,
  pagination,
  onPageChange,
  onPageSizeChange,
  scrollY,
  rowKey,
  showTotal,
  loading,
  locale,
  // 新增多选相关属性
  rowSelection,
  selectedRowKeys,
  onSelectChange,
  selectAll = false,
}) => (
  <>
    <div
      style={{
        overflowX: 'auto',
        marginTop: 10,
        // border: '1px solid #ebebebff',
        borderRadius: 6,
      }}
    >
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        scroll={{
          y: scrollY,
          x: 'max-content',
        }}
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
        rowKey={rowKey}
        rowSelection={
          rowSelection || onSelectChange
            ? {
                type: selectAll ? 'checkbox' : 'checkbox',
                selectedRowKeys: selectedRowKeys || [],
                onChange: onSelectChange,
                onSelectAll: selectAll ? (selected) => {
                  if (onSelectChange) {
                    const keys = selected 
                      ? dataSource?.map(item => item[rowKey || 'id']) || []
                      : [];
                    onSelectChange(keys, selected ? dataSource : []);
                  }
                } : undefined,
                ...rowSelection,
              }
            : undefined
        }
        // rowClassName={(record, index) =>
        //   index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
        // }
      />
    </div>
    <div
      style={{
        width: '100%',
        background: '#fff',
        padding: '8px 0',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'flex-end',
      }}
    >
      <Pagination
        size="small"
        loading={loading ?? false}
        current={pagination.index ?? 1}
        pageSize={pagination.size ?? 10}
        total={pagination?.total ?? 0}
        showTotal={showTotal}
        pageSizeOptions={['10', '30', '50', '100']}
        showSizeChanger
        onChange={onPageChange}
        onShowSizeChange={onPageSizeChange}
        locale={locale}
      />
    </div>
  </>
);