// frontend/src/Pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Debug: API_URL =", API_URL);
      console.log("Debug: form data =", form);

      const res = await fetch(`${API_URL}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      console.log("Debug: raw response =", res);

      const data = await res.json();
      console.log("Debug: response data =", data);

      if (!res.ok) {
        setError(data.error || "Signup failed. Check your inputs.");
      } else {
        alert("✅ Signup successful! You can now log in.");
        navigate("/login");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError("Network error. Check if backend is running and API_URL is correct.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-xl p-8 w-96">
        <h2 className="text-2xl font-semibold text-center mb-4 text-blue-700">
          Create an Account
        </h2>

        {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          className="border border-gray-300 p-2 w-full mb-3 rounded-md focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          className="border border-gray-300 p-2 w-full mb-3 rounded-md focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          className="border border-gray-300 p-2 w-full mb-4 rounded-md focus:ring-2 focus:ring-blue-500"
          required
        />

        <button
          type="submit"
          className={`bg-blue-600 text-white py-2 rounded-md w-full hover:bg-blue-700 transition-all ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
          disabled={loading}
        >
          {loading ? "Signing up..." : "Sign Up"}
        </button>

        <p className="text-center text-sm mt-4 text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
