// src/components/JupyterPanel.jsx
export default function JupyterPanel({ url }) {
  return (
    <div className="w-full rounded-lg overflow-hidden border border-gray-600">
      <iframe
        src={url}
        title="JupyterLab"
        style={{ width: "100%", height: "600px", border: "none" }}
        allow="clipboard-read; clipboard-write"
      />
    </div>
  );
}