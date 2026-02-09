import api from "./Api.js";

// signup
export const SignupApi = async (email) => {
  const res = await api.post("/auth/signup", { email });
  return res.data;
};

// login
export const LoginApi = async (identifier, password) => {
     console.log("LOGIN API HIT");
  const res = await api.post("/auth/login", { identifier, password });
  return res.data;
};

// verify otp
export const VerifyOtpApi = async (email, otp) => {
  const res = await api.post("/auth/verifyotp", { email, otp });
  return res.data;
};

// check auth
export const CheckauthApi = async () => {
  const res = await api.get("/auth/check-auth");
  return res.data;
};
