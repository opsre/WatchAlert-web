import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, message } from 'antd';
import { TopologyGetDetail } from '../../api/topology';
import FlowPage from './index';

const TopologyDetail = () => {
  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { id } = useParams();

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await TopologyGetDetail({ id });
      if (res.code === 200) {
        setDetailData(res.data || {});
      } else {
        message.error(res.message || '获取详情失败');
      }
    } catch (error) {
      console.error('获取详情失败:', error);
      message.error('获取详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  // 如果还没有获取到详情数据，则显示加载状态
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div>
        {detailData ? (
          <FlowPage detailData={detailData} topologyId={id} />
        ) : (
          <div>暂无数据</div>
        )}
    </div>
  );
};

export default TopologyDetail;