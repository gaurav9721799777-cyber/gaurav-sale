// import React, { JSX } from "react";
// import { useSelector } from "react-redux";
// import { Navigate } from "react-router-dom";

// interface PublicRouteProps {
//   children: JSX.Element;
// }

// const PublicRoutes: React.FC<PublicRouteProps> = ({ children }) => {
//   const token = useSelector((state: any) => state.jwt);
//   if (token) {
//     return <Navigate to="/admin/dashboard" replace />;
//   }
//   return children;
// };

// export default PublicRoutes;
export {};
