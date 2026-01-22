import React from 'react';
import { Button, Divider, Breadcrumb as AntdBreadcrumb } from 'antd';
import { LeftOutlined, HomeOutlined } from '@ant-design/icons';

export const Breadcrumb = ({ items, showBackButton = true, onBack}) => {
    const goBack = () => {
        if (onBack) {
            onBack();
        } else {
            window.history.back();
        }
    };

    const breadcrumbItems = [
        { href: '/', title: <HomeOutlined/> },
        ...items.map((item, index) => ({
            title: item,
        })),
    ];

    return (
        <>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}
            >
                {showBackButton && (
                    <Button
                        type="text"
                        icon={<LeftOutlined />}
                        onClick={goBack}
                        style={{ marginTop: "-16px", color: "#8c8c8c" }}
                    />
                )}
                <div style={{ marginBottom: 16 }}>
                    <AntdBreadcrumb items={breadcrumbItems} />
                </div>
            
            </div>
        </>
    );
};
