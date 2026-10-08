import axios from "axios";

const axiosInstance = axios.create({
  // In local development, let the CRA dev server proxy /api to Spring Boot.
  // Set REACT_APP_API_URL when the frontend and API are deployed separately.
  baseURL: process.env.REACT_APP_API_URL || "",
  headers: {
    "Content-Type": "application/json",
  },
});

// axiosInstance.interceptors.request.use(
//     (config : InternalAxiosRequestConfig) => {
//         const token = localStorage.getItem("token");
//         if(token){
//             config.headers.Authorization = `Bearer ${token}`;
//         }
//         return config;
// },);

// Handle expired/invalid JWT
// axiosInstance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   (error) => {
//     if (error.response?.status === 401) {
//       localStorage.removeItem('token');
//       window.location.href = '/login';
//     }

//     return Promise.reject(error);
//   }
// );

export default axiosInstance;
