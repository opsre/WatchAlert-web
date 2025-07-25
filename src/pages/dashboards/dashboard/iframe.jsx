import React, { useEffect, useState } from 'react';
import { getDashboardFullUrl, getFolderInfo} from '../../../api/dashboard';
import { useParams } from 'react-router-dom'

export const GrafanaDashboardComponent = () => {
    const { fid,did } = useParams()
    const [iframeSrc, setIframeSrc] = useState('')

    useEffect(() => {
        run();
    }, []);

    const run = async () => {
        try {
            const fParams = {
                id: fid
            }
            const resInfo = await getFolderInfo(fParams)
            const params = {
                theme: resInfo.data.theme,
                host:  resInfo.data.grafanaHost,
                uid: did
            }
            const res = await getDashboardFullUrl(params)
            setIframeSrc(res.data)
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            <div >Loading...</div>
            <div style={{ marginLeft: '-24px', marginTop: '-43px', height: '78vh' }}>
                <iframe
                    src={iframeSrc}
                    frameborder="0"
                    style={{
                        margin: '0',
                        width: 'calc(100% + 25px)',
                        height: 'calc(95vh)',
                        overflow: 'auto',
                    }}
                />
            </div >
        </>
    );
};