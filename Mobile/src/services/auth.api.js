import api from './api.js';

export const SignupApi = async (email) => {
    const res = await api.post('/auth/signup', { email });
    return res.data;
};

export const LoginApi = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    return res.data;
};

export const VerifyOtpApi = async (email, otp) => {
    const res = await api.post('/auth/verify', { email, otp });
    return res.data;
};

export const CheckauthApi = async () => {
    const res = await api.get('/auth/check');
    return res.data;
};

export const SetPasswordApi = async (email, password) => {
    const res = await api.post('/auth/setpassword', { email, password });
    return res.data;
};
