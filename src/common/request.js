import axios from 'axios';
import qs from 'qs';
import { Message } from 'element-ui';
import { domainApi } from './config.js';
import store from '@/store/index.js';

// axios实例
const instance = axios.create({
    baseURL: domainApi,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    transformRequest: [function (data, headers) {
        if (headers['Content-Type'] === "multipart/form-data") {
            return data;
        } else {
            return qs.stringify({
                ...data
            })
        }
    }],
});
// 请求拦截器
instance.interceptors.request.use(
    config => {
        const token = store.getters.token;
        token && (config.headers['user-token'] = token);
        return config;
    }, error => {
        return Promise.error(error)
    },
)
// 响应拦截器
instance.interceptors.response.use(
    response => {
        if (response.status === 200) {
            let result = response.data;
            if (result.code == -201 || result.code == -202 || result.code == -203) {
                localStorage.removeItem('USERINFO');
                return Promise.reject(result);
            } else {
                return Promise.resolve(result);
            }
        } else {
            return Promise.reject(response);
        }
    },
    error => {
        console.log('拦截器', error)
        if (error.response.status) {
            switch (error.response.status) {
                // 未登录
                case 401:
                    Message.error('请登录');
                    store.commit('logout');
                    break;
                // 403 token 过期
                case 403:
                    Message.error('登录已过期');
                    store.commit('logout');
                    break;
                // 请求不存在
                case 404:
                    Message.error('请求的资源不存在');
                    break;
                default:
                    Message.error(error.response.data.message)
                    break;
            }
            return Promise.reject(error.response);
        } else {
            return Promise.reject(error.response);
        }
    }
)

export default instance;