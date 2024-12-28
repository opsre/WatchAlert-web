import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';
import axios from 'axios';

const Auth = () => {
    const navigate = useNavigate();
    const [errorCount, setErrorCount] = useState(0);

    // 检查用户是否已经登录
    useEffect(() => {
        const checkUser = async () => {
            const token = localStorage.getItem('Authorization');
            if (!token) {
                navigate('/login'); // 未登录，跳转到登录页面
            }
        };

        checkUser();
    }, [navigate]);

    // 设置全局请求头
    useEffect(() => {
        const token = localStorage.getItem('Authorization');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }, []);

    // 响应拦截器
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response?.status === 401) {
                    setErrorCount(prevCount => prevCount + 1);
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor); // 清理拦截器
        };
    }, []);

    // 检查错误次数并显示提示消息
    useEffect(() => {
        if (errorCount > 0) {
            localStorage.clear()
            navigate('/login'); // 跳转到登录页面
            message.error('登录已过期，请重新登录');
        }
    }, [errorCount, navigate]);

    return null;
};

export default Auth;