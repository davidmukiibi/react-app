import axios from 'axios';
import Config from './App.Config';

let xhr = axios.create({
    timeout: 20000,
    baseURL: Config.API_BASE_URL
});

export { xhr }
