import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

const EditProject = () => {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    link: "",
  });

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/projects/${id}`);
        setFormData(res.data);
      } catch (error) {
        console.error("Error fetching project:", error);
      }
    };
    fetchProject();
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${process.env.REACT_APP_API_URL}/api/projects/${id}`, formData);
      alert("✅ Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      alert("❌ Failed to update project");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Edit Project</h2>
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
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditProject;
