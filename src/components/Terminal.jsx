// src/components/Terminal.jsx
import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";

export default function TerminalComponent({ sessionId, onDisconnect }) {
  const terminalDivRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      theme: { background: "#0d1318", foreground: "#00ffaa" },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalDivRef.current);
    fitAddon.fit();
    termRef.current = term;

    // ⚠️ Update this URL once Hamza shares his WebSocket endpoint
    const ws = new WebSocket(`ws://localhost:8000/ws/${sessionId}`);
    wsRef.current = ws;

    ws.onopen = () => term.writeln("✅ Connected to your container...");
    ws.onmessage = (event) => term.write(event.data);
    ws.onclose = () => {
      term.writeln("\r\n❌ Session ended.");
      if (onDisconnect) onDisconnect();
    };
    ws.onerror = () => term.writeln("\r\n⚠️ Connection error. Is backend running?");

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(data);
    });

    return () => { ws.close(); term.dispose(); };
  }, [sessionId]);

  return (
    <div
      ref={terminalDivRef}
      style={{ height: "450px", width: "100%", borderRadius: "8px", overflow: "hidden" }}
    />
  );
}