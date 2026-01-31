import "./Login.css";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!username || !password) {
      toast.error("Username and password required");
      return;
    }

    const toastId = toast.loading("Logging in...");

    try {
      const res = await api.post("/auth/login", {
        username,
        password,
      });

      login(res.data.token);
      toast.success("Login successful", { id: toastId });
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid credentials", {
        id: toastId,
      });
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={submit}>Login</button>
      </div>
    </div>
  );
}
