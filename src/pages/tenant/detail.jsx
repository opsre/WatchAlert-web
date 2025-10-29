import React, { useEffect, useState } from 'react'
import {Descriptions,Tabs} from "antd";
import {TenantSecurity} from "./security";
import {TenantQuota} from "./quota";
import {TenantUsers} from "./users";
import { useParams } from 'react-router-dom'
import {getTenant} from "../../api/tenant";

export const TenantDetail = ()=>{
    const { id } = useParams()
    const [tenantInfo,setTenantInfo] = useState({})

    useEffect(() => {
        handleGetTenantInfo();
    }, []);

    const handleGetTenantInfo = async ()=>{
        try {
            const params = {
                id: id,
            }
            const res = await getTenant(params)
            setTenantInfo(res.data);
        } catch (error) {
            console.error(error)
        }
    }

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp * 1000); // Multiply by 1000 to convert seconds to milliseconds
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
        const day = date.getDate().toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        const seconds = date.getSeconds().toString().padStart(2, '0');
        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    };

    const itemsDescriptions = [
        {
            key: '1',
            label: '租户ID',
            children: tenantInfo.id,
        },
        {
            key: '2',
            label: '租户名称',
            children: tenantInfo.name,
        },
        {
            key: '3',
            label: '描述',
            children: tenantInfo.description,
        },
        {
            key: '4',
            label: '负责人',
            children: tenantInfo.manager,
        },
        {
            key: '5',
            label: '更新时间',
            children: formatTimestamp(tenantInfo.updateAt),
        },
    ];

    const itemsTabs = [
        {
            key: '1',
            label: '配额管理',
            children: <TenantQuota tenantInfo={tenantInfo}/>,
        },
        {
            key: '2',
            label: '成员管理',
            children: <TenantUsers tenantInfo={tenantInfo}/>,
        },
        {
            key: '3',
            label: '安全配置',
            children: <TenantSecurity tenantInfo={tenantInfo}/>,
        },
    ];
    return(
       <div style={{textAlign:'left'}}>
           <Descriptions title={"基本信息"} bordered items={itemsDescriptions} />

           <div style={{marginTop:'20px'}}>
               <span style={{fontSize:'16px',color:'rgba(0, 0, 0, 0.88)',fontWeight:'600'}}>高级配置</span>
               <Tabs defaultActiveKey="1" items={itemsTabs} />
           </div>
       </div>
    )
}