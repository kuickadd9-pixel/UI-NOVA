import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await fetch('https://ui-novaa-12.onrender.com/api/login', { 

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        setMessage(data.message || "Login failed");
      }
    } catch {
      setMessage("Server error");
    }
  };

  return (
    <div style={styles.container}>
      <h2>Login</h2>
      <form onSubmit={handleLogin} style={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          style={styles.input}
        />
        <button type="submit" style={styles.button}>Login</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

const styles = {
  container: { padding: "40px", textAlign: "center" },
  form: { display: "flex", flexDirection: "column", gap: "10px", width: "250px", margin: "0 auto" },
  input: { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" },
  button: { padding: "10px", border: "none", borderRadius: "5px", background: "#007bff", color: "white" },
};

export default Login;
