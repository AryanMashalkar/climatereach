"use client";
import { useEffect, useState } from "react";
import { Bookmark, ExternalLink, FileText, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
type Note = { url: string; text: string; savedAt: string };
function safeURL(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" && !u.username && !u.password
      ? u.href
      : null;
  } catch {
    return null;
  }
}
export default function WarningNote() {
  const [url, setURL] = useState("");
  const [text, setText] = useState("");
  const [note, setNote] = useState<Note | null>(null);
  useEffect(() => {
    try {
      const item = JSON.parse(
        localStorage.getItem("climatereach-warning-v1") || "null",
      );
      if (item && safeURL(item.url) && typeof item.text === "string") {
        setNote(item);
        setURL(item.url);
        setText(item.text);
      }
    } catch {}
  }, []);
  const save = () => {
    const source = safeURL(url);
    if (!source || !text.trim()) {
      toast.error(
        "Add an HTTPS source link and the warning text you want to keep.",
      );
      return;
    }
    const next = {
      url: source,
      text: text.trim(),
      savedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem("climatereach-warning-v1", JSON.stringify(next));
      setNote(next);
      toast.success("Source and original text saved on this device.");
    } catch {
      toast.error("Device storage is unavailable.");
    }
  };
  return (
    <section className="warning-note">
      <div>
        <span className="eyebrow">KEEP THE ORIGINAL INSTRUCTIONS</span>
        <h3>A warning worth keeping close.</h3>
        <p>
          Copy a warning from your local authority. We preserve your text as
          entered; we do not verify the source or turn it into an evacuation
          route.
        </p>
      </div>
      <label htmlFor="warning-url">Source link</label>
      <Input
        id="warning-url"
        type="url"
        placeholder="https://your-local-authority.gov/…"
        value={url}
        maxLength={1000}
        onChange={(e) => setURL(e.target.value)}
      />
      <label htmlFor="warning-text">Original warning text</label>
      <Textarea
        id="warning-text"
        placeholder="Paste the official instructions you want to keep offline."
        value={text}
        maxLength={6000}
        onChange={(e) => setText(e.target.value)}
        rows={4}
      />
      <button className="secondary-action" onClick={save}>
        <Bookmark size={16} />
        Save warning on this device
      </button>
      {note && (
        <div className="warning-saved">
          <FileText size={20} />
          <div>
            <strong>Saved copy · not a live alert</strong>
            <span>{new Date(note.savedAt).toLocaleString()}</span>
            <p>{note.text}</p>
            <a href={note.url} target="_blank" rel="noreferrer">
              Open supplied source
              <ExternalLink size={14} />
            </a>
          </div>
          <button
            aria-label="Remove saved warning"
            onClick={() => {
              try {
                localStorage.removeItem("climatereach-warning-v1");
                setNote(null);
                setURL("");
                setText("");
                toast("Saved warning removed.");
              } catch {
                toast.error("Could not remove the saved warning.");
              }
            }}
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </section>
  );
}
