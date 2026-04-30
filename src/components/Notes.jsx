import React, { useMemo, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Search, Pin, PinOff, Mic, MicOff, Eye, Pencil as PencilIcon, Hash, Image as ImageIcon, Link2 } from 'lucide-react';
import { marked } from 'marked';
import { uid, NOTE_COLORS, noteColor, cn } from '../lib/utils';

marked.setOptions({ breaks: true, gfm: true });

const renderMarkdown = (body) => {
  if (!body) return '';
  // Convert [[Note title]] into markdown links to internal anchors before parse
  const transformed = body.replace(/\[\[([^\]]+)\]\]/g, (_m, t) => {
    const title = t.trim();
    return `[${title}](#note:${encodeURIComponent(title.toLowerCase())})`;
  });
  // Strip `disabled` from GFM task-list checkboxes so clicks register
  return marked.parse(transformed).replace(/<input([^>]*?)\sdisabled(=""|="disabled"|)([^>]*?)>/g, '<input$1$3>');
};

const EMPTY = { title: '', body: '', color: 'sun', pinned: false, tags: [] };

export default function Notes({ notes, setNotes, confirm, flash }) {
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(EMPTY);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [preview, setPreview] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const tagInputRef = useRef(null);

  const allTags = useMemo(() => {
    const set = new Set();
    notes.forEach((n) => (n.tags || []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [notes]);

  const noteByTitle = useMemo(() => {
    const m = new Map();
    for (const n of notes) {
      if (n.title) m.set(n.title.toLowerCase(), n);
    }
    return m;
  }, [notes]);

  const backlinksFor = (note) => {
    if (!note?.title) return [];
    const term = note.title.toLowerCase();
    return notes.filter((n) => n.id !== note.id && /\[\[([^\]]+)\]\]/.test(n.body || '') &&
      [...(n.body || '').matchAll(/\[\[([^\]]+)\]\]/g)].some((m) => m[1].trim().toLowerCase() === term));
  };

  const suggestTagsFromBody = (body) => {
    if (!body) return [];
    const tagSet = new Set(allTags);
    const matches = body.toLowerCase().match(/\b[a-z][a-z0-9_-]{2,15}\b/g) || [];
    const freq = {};
    for (const w of matches) {
      if (tagSet.has(w)) continue;
      freq[w] = (freq[w] || 0) + 1;
    }
    const top = Object.entries(freq)
      .filter(([w, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
    return top;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = notes;
    if (q) {
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          (n.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    }
    if (activeTag) {
      list = list.filter((n) => (n.tags || []).includes(activeTag));
    }
    return [...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || b.updatedAt - a.updatedAt);
  }, [notes, query, activeTag]);

  const startNew = () => {
    setEditing('new');
    setDraft(EMPTY);
    setPreview(false);
  };

  const startEdit = (n) => {
    setEditing(n.id);
    setDraft({
      title: n.title,
      body: n.body,
      color: n.color,
      pinned: n.pinned,
      tags: n.tags || [],
    });
    setPreview(false);
  };

  const cancel = () => {
    stopListening();
    setEditing(null);
    setDraft(EMPTY);
    setPreview(false);
  };

  const save = () => {
    stopListening();
    if (!draft.title.trim() && !draft.body.trim()) return cancel();
    const now = Date.now();
    if (editing === 'new') {
      setNotes((prev) => [{ id: uid(), ...draft, createdAt: now, updatedAt: now }, ...prev]);
      flash?.('Note saved');
    } else {
      setNotes((prev) => prev.map((n) => (n.id === editing ? { ...n, ...draft, updatedAt: now } : n)));
      flash?.('Note updated');
    }
    cancel();
  };

  const remove = (id) => {
    const note = notes.find((n) => n.id === id);
    if (!note) return;
    setNotes((prev) => prev.filter((n) => n.id !== id));
    flash?.('Note deleted', false, () => setNotes((prev) => [note, ...prev]));
  };

  const togglePin = (id) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, pinned: !n.pinned, updatedAt: Date.now() } : n)));
  };

  const addTag = (raw) => {
    const t = raw.trim().replace(/^#/, '').toLowerCase();
    if (!t) return;
    setDraft((prev) => (prev.tags.includes(t) ? prev : { ...prev, tags: [...prev.tags, t] }));
  };

  const removeTag = (t) => setDraft((prev) => ({ ...prev, tags: prev.tags.filter((x) => x !== t) }));

  // Image paste / drop
  const onPaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.kind === 'file' && it.type.startsWith('image/')) {
        e.preventDefault();
        const file = it.getAsFile();
        if (!file) return;
        if (file.size > 4 * 1024 * 1024) {
          flash?.('Image too large (>4MB) — won\'t fit in localStorage', true);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          setDraft((prev) => ({
            ...prev,
            body: (prev.body ? prev.body + '\n\n' : '') + `![pasted image](${reader.result})`,
          }));
          flash?.('Image embedded');
        };
        reader.readAsDataURL(file);
        return;
      }
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) {
      flash?.('Image too large (>4MB)', true);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraft((prev) => ({
        ...prev,
        body: (prev.body ? prev.body + '\n\n' : '') + `![dropped image](${reader.result})`,
      }));
      flash?.('Image embedded');
    };
    reader.readAsDataURL(file);
  };

  const toggleChecklistInNote = (noteId, idx) => {
    setNotes((prev) =>
      prev.map((n) => {
        if (n.id !== noteId) return n;
        let i = -1;
        const newBody = (n.body || '').replace(/^(\s*[-*]\s+)\[( |x|X)\]/gm, (m, prefix, mark) => {
          i += 1;
          if (i !== idx) return m;
          const next = mark === ' ' ? 'x' : ' ';
          return `${prefix}[${next}]`;
        });
        return { ...n, body: newBody, updatedAt: Date.now() };
      })
    );
  };

  // Voice to text
  const toggleListening = () => {
    if (listening) return stopListening();
    const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Rec) {
      flash?.('Voice input not supported in this browser', true);
      return;
    }
    const r = new Rec();
    r.lang = navigator.language || 'en-US';
    r.continuous = true;
    r.interimResults = false;
    r.onresult = (e) => {
      let text = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      setDraft((prev) => ({ ...prev, body: (prev.body ? prev.body + ' ' : '') + text.trim() }));
    };
    r.onerror = () => stopListening();
    r.onend = () => setListening(false);
    r.start();
    recognitionRef.current = r;
    setListening(true);
  };

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    recognitionRef.current = null;
    setListening(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-slate-500 text-sm">Markdown supported · tag, search, pin, voice-dictate.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:flex-none">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="input !pl-9 w-full sm:w-64"
              placeholder="Search notes…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button className="btn-primary" onClick={startNew} data-action="new-note">
            <Plus size={16} /> New note
          </button>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTag(null)}
            className={cn(
              'chip transition border',
              !activeTag
                ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white border-transparent'
                : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10'
            )}
          >
            All
          </button>
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTag(activeTag === t ? null : t)}
              className={cn(
                'chip transition border',
                activeTag === t
                  ? 'bg-gradient-to-tr from-violet-500 to-cyan-500 text-white border-transparent'
                  : 'bg-white/60 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-white/10'
              )}
            >
              <Hash size={11} /> {t}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className={cn('card p-5 animate-pop-in border-2', noteColor(draft.color).border)}>
          <div className="flex items-center justify-between gap-2">
            <input
              autoFocus
              className="flex-1 bg-transparent text-xl font-semibold focus:outline-none placeholder:text-slate-400"
              placeholder="Title"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            />
            <div className="flex items-center gap-1">
              <button
                onClick={toggleListening}
                className={cn(
                  'btn-ghost !px-3 !py-1.5 text-xs',
                  listening && 'text-rose-600 dark:text-rose-400 animate-pulse-soft'
                )}
                aria-label="Voice input"
                title="Voice to text"
              >
                {listening ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <button
                onClick={() => setPreview((p) => !p)}
                className={cn('btn-ghost !px-3 !py-1.5 text-xs', preview && 'text-violet-600')}
                title={preview ? 'Edit' : 'Preview'}
              >
                {preview ? <PencilIcon size={14} /> : <Eye size={14} />}
                {preview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>
          {preview ? (
            <div
              className="markdown prose prose-sm dark:prose-invert max-w-none mt-3 min-h-[140px]"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.body || '_Nothing to preview yet._') }}
            />
          ) : (
            <textarea
              className="w-full bg-transparent mt-2 min-h-[140px] resize-y focus:outline-none text-sm leading-relaxed placeholder:text-slate-400 font-mono"
              placeholder="Markdown supported — **bold**, *italic*, [[link to note]], paste/drop images, `code`, - [ ] checklists…"
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              onPaste={onPaste}
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
            />
          )}

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {draft.tags.map((t) => (
              <span key={t} className="chip bg-violet-500/15 text-violet-700 dark:text-violet-300">
                <Hash size={10} />
                {t}
                <button onClick={() => removeTag(t)} className="ml-1 hover:text-rose-500" aria-label={`Remove ${t}`}>×</button>
              </span>
            ))}
            <input
              ref={tagInputRef}
              placeholder="add tag…"
              className="bg-transparent border border-dashed border-slate-300 dark:border-white/10 rounded-full px-2.5 py-1 text-xs focus:outline-none focus:border-violet-500 w-28"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
              onBlur={(e) => {
                if (e.currentTarget.value.trim()) {
                  addTag(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 justify-between">
            <div className="flex items-center gap-2">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setDraft({ ...draft, color: c.name })}
                  className={cn(
                    'size-7 rounded-full border-2 transition',
                    c.bg, c.dark, c.border,
                    draft.color === c.name && 'ring-2 ring-offset-2 ring-offset-transparent ring-violet-500 scale-110'
                  )}
                  aria-label={c.name}
                />
              ))}
              <button
                onClick={() => setDraft({ ...draft, pinned: !draft.pinned })}
                className={cn(
                  'btn-ghost !px-3 !py-1.5 text-xs',
                  draft.pinned && 'text-amber-600 dark:text-amber-400'
                )}
              >
                {draft.pinned ? <Pin size={14} /> : <PinOff size={14} />}
                {draft.pinned ? 'Pinned' : 'Pin'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn-ghost" onClick={cancel}>
                <X size={16} /> Cancel
              </button>
              <button className="btn-primary" onClick={save}>
                <Save size={16} /> Save
              </button>
            </div>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <h3 className="text-lg font-semibold">{query || activeTag ? 'No matching notes' : 'No notes yet'}</h3>
          <p className="text-sm text-slate-500 mt-1">
            {query || activeTag ? 'Try a different keyword or tag.' : 'Create your first note to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((n) => {
            const c = noteColor(n.color);
            return (
              <article
                key={n.id}
                className={cn(
                  'rounded-2xl p-5 border-2 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition group relative animate-pop-in',
                  c.bg, c.dark, c.border
                )}
              >
                {n.pinned && (
                  <div className="absolute top-3 right-3 text-amber-600 dark:text-amber-400">
                    <Pin size={14} />
                  </div>
                )}
                {n.title && <h3 className="font-bold text-lg pr-6 mb-1.5 break-words">{n.title}</h3>}
                {n.body && (
                  <div
                    className="markdown break-words text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-[12]"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(n.body) }}
                    onClick={(e) => {
                      // Interactive checklist toggle
                      if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
                        const all = e.currentTarget.querySelectorAll('input[type="checkbox"]');
                        const idx = Array.from(all).indexOf(e.target);
                        if (idx >= 0) {
                          e.preventDefault();
                          toggleChecklistInNote(n.id, idx);
                        }
                        return;
                      }
                      // [[Internal note]] link navigation
                      const a = e.target.closest('a');
                      if (a && a.getAttribute('href')?.startsWith('#note:')) {
                        e.preventDefault();
                        const title = decodeURIComponent(a.getAttribute('href').slice(6));
                        const target = noteByTitle.get(title);
                        if (target) startEdit(target);
                        else flash?.(`No note titled "${title}" yet`);
                      }
                    }}
                  />
                )}
                {(() => {
                  const back = backlinksFor(n);
                  if (back.length === 0) return null;
                  return (
                    <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                      <Link2 size={10} />
                      <span className="uppercase tracking-wider">Linked from</span>
                      {back.slice(0, 3).map((b) => (
                        <button
                          key={b.id}
                          onClick={(e) => { e.stopPropagation(); startEdit(b); }}
                          className="chip text-[10px] bg-violet-500/15 text-violet-600 dark:text-violet-400 hover:bg-violet-500/25"
                        >
                          {b.title || 'Untitled'}
                        </button>
                      ))}
                      {back.length > 3 && <span>+{back.length - 3}</span>}
                    </div>
                  );
                })()}
                {n.tags && n.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {n.tags.map((t) => (
                      <span key={t} className="chip text-[10px] bg-white/60 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        <Hash size={9} />
                        {t}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-slate-900/5 dark:border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {new Date(n.updatedAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                    <button onClick={() => togglePin(n.id)} className="p-1.5 rounded-md hover:bg-white/60 dark:hover:bg-white/10" aria-label="Pin">
                      {n.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                    </button>
                    <button onClick={() => startEdit(n)} className="p-1.5 rounded-md hover:bg-white/60 dark:hover:bg-white/10" aria-label="Edit">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => remove(n.id)}
                      className="p-1.5 rounded-md hover:bg-rose-500/20 text-rose-600 dark:text-rose-400"
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
