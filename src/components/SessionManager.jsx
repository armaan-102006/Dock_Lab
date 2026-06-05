// src/components/SessionManager.jsx
import { useState } from "react";
import axios from "axios";
import TerminalComponent from "./Terminal";
import JupyterPanel from "./JupyterPanel";

const API_URL = "http://localhost:8000";

export default function SessionManager() {
  const [status, setStatus] = useState("idle");
  const [sessionId, setSessionId] = useState(null);
  const [jupyterUrl, setJupyterUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("terminal");

  const getToken = () => localStorage.getItem("token");

  const startEnvironment = async () => {
    setStatus("loading");
    try {
      // Hamza's endpoint is GET /session/
      const response = await axios.get(`${API_URL}/session/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      const data = response.data;

      // data is the container_id returned from docker_service
      setSessionId(data);
      setStatus("running");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  const stopEnvironment = () => {
    // Hamza hasn't built stop yet — just reset UI for now
    setStatus("ended");
    setSessionId(null);
  };

  return (
    <div className="p-6 bg-gray-900 min-h-screen text-white">
      <h2 className="text-2xl font-bold mb-4">My Computing Environment</h2>

      {status === "idle" && (
        <button
          onClick={startEnvironment}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-8 rounded-lg text-lg"
        >
          🚀 Start My Environment
        </button>
      )}

      {status === "loading" && (
        <div className="flex items-center gap-3 text-yellow-400">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" />
          <span>Starting your environment...</span>
        </div>
      )}

      {status === "error" && (
        <div className="bg-red-900 border border-red-500 rounded-lg p-4">
          <p className="text-red-300">❌ Failed to start. Is the backend running?</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-3 bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "ended" && (
        <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
          <p className="text-gray-300">Session ended.</p>
          <button
            onClick={() => setStatus("idle")}
            className="mt-3 bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Start New Session
          </button>
        </div>
      )}

      {status === "running" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-green-400 font-semibold">
              🟢 Container: <code className="text-xs bg-gray-800 px-2 py-1 rounded">{sessionId}</code>
            </span>
            <button
              onClick={stopEnvironment}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-sm"
            >
              Stop Session
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveTab("terminal")}
              className={`px-4 py-2 rounded ${activeTab === "terminal" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
            >
              Terminal
            </button>
            {jupyterUrl && (
              <button
                onClick={() => setActiveTab("jupyter")}
                className={`px-4 py-2 rounded ${activeTab === "jupyter" ? "bg-blue-600" : "bg-gray-700 hover:bg-gray-600"}`}
              >
                JupyterLab
              </button>
            )}
          </div>

          {activeTab === "terminal" && (
            <TerminalComponent
              sessionId={sessionId}
              onDisconnect={() => setStatus("ended")}
            />
          )}

          {activeTab === "jupyter" && jupyterUrl && (
            <JupyterPanel url={jupyterUrl} />
          )}
        </div>
      )}
    </div>
  );
}