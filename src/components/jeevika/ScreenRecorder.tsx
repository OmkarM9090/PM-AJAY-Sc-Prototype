"use client";

import { useRef, useState } from "react";
import { Circle, Square } from "lucide-react";

/** Optional local screen recorder for a judge-demo backup video. Nothing is uploaded. */
export function ScreenRecorder() {
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const toggle = async () => {
    if (recording && recorder.current) { recorder.current.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      chunks.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      recorder.current = mediaRecorder;
      mediaRecorder.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a"); anchor.href = url; anchor.download = "JeevikaSetu-demo-recording.webm"; anchor.click();
        URL.revokeObjectURL(url); stream.getTracks().forEach((track) => track.stop()); setRecording(false); recorder.current = null;
      };
      stream.getVideoTracks()[0]?.addEventListener("ended", () => mediaRecorder.stop());
      mediaRecorder.start(); setRecording(true);
    } catch { setRecording(false); }
  };
  return <button className={recording ? "btn btn-danger btn-small" : "btn btn-secondary btn-small"} onClick={toggle}>{recording ? <><Square size={15}/> Stop & download</> : <><Circle size={15}/> Record demo</>}</button>;
}
