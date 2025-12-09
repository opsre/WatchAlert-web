import React from 'react'
import { Card, Space, Typography, Button } from 'antd'
import { SearchViewMetrics, DisplayMode } from './searchViewMetrics'

const { Title, Paragraph } = Typography

export const SearchViewMetricsExample = () => {
    // 示例数据
    const exampleProps = {
        datasourceType: "Prometheus",
        datasourceId: ["datasource-1", "datasource-2"],
        promQL: "up{job=\"prometheus\"}"
    }

    return (
        <div style={{ padding: '20px' }}>
            <Title level={2}>SearchViewMetrics 组件使用示例</Title>
            
            <Paragraph>
                该组件支持三种显示模式：
            </Paragraph>
            
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {/* 卡片模式 */}
                <Card title="1. 卡片模式 (displayMode='card')" style={{ marginBottom: '20px' }}>
                    <Paragraph>
                        默认模式，以卡片形式展示每个 metric 的详细信息
                    </Paragraph>
                    <SearchViewMetrics 
                        {...exampleProps}
                        displayMode="card"
                    />
                </Card>

                {/* 图表模式 */}
                <Card title="2. 图表模式 (displayMode='chart')" style={{ marginBottom: '20px' }}>
                    <Paragraph>
                        以线性图表 + 表格的形式展示数据
                    </Paragraph>
                    <SearchViewMetrics 
                        {...exampleProps}
                        displayMode="chart"
                    />
                </Card>

                {/* 双模式 */}
                <Card title="3. 双模式 (displayMode='both')" style={{ marginBottom: '20px' }}>
                    <Paragraph>
                        提供 Tab 切换，用户可以选择查看卡片视图或图表视图
                    </Paragraph>
                    <SearchViewMetrics 
                        {...exampleProps}
                        displayMode="both"
                    />
                </Card>
            </Space>

            <Card title="使用方法" style={{ marginTop: '40px' }}>
                <Paragraph>
                    <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
{`import { SearchViewMetrics, DisplayMode } from './searchViewMetrics'

// 基本使用 - 默认卡片模式
<SearchViewMetrics 
    datasourceType="Prometheus"
    datasourceId={["datasource-1"]}
    promQL="up{job=\\"prometheus\\"}"
/>

// 指定图表模式
<SearchViewMetrics 
    datasourceType="Prometheus"
    datasourceId={["datasource-1"]}
    promQL="up{job=\\"prometheus\\"}"
    displayMode="chart"
/>

// 双模式，用户可切换
<SearchViewMetrics 
    datasourceType="Prometheus"
    datasourceId={["datasource-1"]}
    promQL="up{job=\\"prometheus\\"}"
    displayMode="both"
/>`}
                    </pre>
                </Paragraph>
            </Card>
        </div>
    )
}