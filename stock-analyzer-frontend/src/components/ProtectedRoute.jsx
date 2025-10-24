import React, { useContext, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);

  // Check if user data exists and has a token
  const isAuthenticated = user && user.access_token;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}