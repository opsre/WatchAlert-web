import React from 'react';
import { Table, Pagination } from 'antd';

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