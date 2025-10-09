import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axios";

function ProjectPage() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const token = localStorage.getItem("token");
  const canvasRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return navigate("/");
    fetchProject();
  }, []);

  const fetchProject = async () => {
    try {
      const res = await axios.get("/projects", { headers: { Authorization: `Bearer ${token}` } });
      const p = res.data.find((pr) => pr.id === id);
      setProject(p);
    } catch (err) {
      console.error(err);
    }
  };

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "lightblue";
    ctx.fillRect(50, 50, 100, 100);
  };

  useEffect(() => {
    draw();
  }, [canvasRef]);

  if (!project) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{project.name}</h1>
      <p>{project.description}</p>
      <canvas ref={canvasRef} width={800} height={600} className="border mt-4"></canvas>
    </div>
  );
}

export default ProjectPage;
