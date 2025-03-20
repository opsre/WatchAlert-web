import { Table, Input } from 'antd'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
    getFolderInfo,
    getGrafanaDashboardList,
} from '../../../api/dashboard';
import { useParams } from 'react-router-dom'

export const Dashboards = () => {
    const [list, setList] = useState()
    const { id } = useParams()
    const columns = [
        {
            title: '名称',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Link
                            to={{
                                pathname: `/dashboard/f/${id}/g/${record.uid}/info`
                            }}
                        >
                            {text}
                        </Link>
                    </div>
                </div>
            ),
        },
        {
            title: 'ID',
            dataIndex: 'uid',
            key: 'uid',
        },
    ]

    useEffect(() => {
        handleList()
    }, [])

    const handleList = async () => {
        try {
            const fParams = {
                id: id
            }
            const resInfo = await getFolderInfo(fParams)
            const params = {
                grafanaHost: resInfo.data.grafanaHost,
                grafanaFolderId: resInfo.data.grafanaFolderId,
                grafanaVersion: resInfo.data.grafanaVersion,
                limit: 1000,
            }
            const res = await getGrafanaDashboardList(params)
            const d = res.data.map((item, index) => {
                return {
                    key: index,
                    ...item,
                }
            })
            setList(d)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <div style={{ overflowX: 'auto', marginTop: 10, height: '71vh' }}>
                <Table
                    columns={columns}
                    dataSource={list}
                    scroll={{
                        x: 1000,
                        y: 'calc(71vh - 71px - 40px)'
                    }}
                />
            </div>
        </>
    );
};