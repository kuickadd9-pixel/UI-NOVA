import React, { useState } from "react";
import axios from "axios";

const AddProject = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    link: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/projects`, formData);
      alert("✅ Project added successfully!");
      setFormData({ name: "", description: "", link: "" });
    } catch (error) {
      console.error("Error adding project:", error);
      alert("❌ Failed to add project");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Add Project</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          name="name"
          placeholder="Project Name"
          value={formData.name}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={formData.description}
          onChange={handleChange}
          className="border p-2 w-full rounded"
          required
        />
        <input
          type="text"
          name="link"
          placeholder="Project Link"
          value={formData.link}
          onChange={handleChange}
          className="border p-2 w-full rounded"
        />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Add Project
        </button>
      </form>
    </div>
  );
};

export default AddProject;
