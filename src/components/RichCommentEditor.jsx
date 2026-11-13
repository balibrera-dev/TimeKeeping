import { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Placeholder } from '@tiptap/extensions';
import { Bold, Code, Italic, Link2, List, ListOrdered, Loader2, Sparkles, Strikethrough, Underline, Undo2 } from 'lucide-react';
import { improveComment } from '../utils/ai.js';
import { isBlankComment, toHtml, toPlainText } from '../utils/richText.js';
import { AI_ENABLED } from '../config.js';

/**
 * A single rich text comment (bold, italic, lists, links…) with debounced
 * autosave, a timestamp helper and an "Improve with AI" button that rewrites
 * it via Claude (undoable), shown only when AI_ENABLED is on. Saves HTML;
 * older plain-text comments open as paragraphs.
 */
export default function RichCommentEditor({ value: saved, onSave, context, placeholder, rows = 3, autoFocus = false }) {
  const [draft, setDraft] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [previous, setPrevious] = useState(null); // HTML before the last AI rewrite
  const [linking, setLinking] = useState(false);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: toHtml(saved),
    autofocus: autoFocus ? 'end' : false,
    shouldRerenderOnTransaction: true,
    editorProps: {
      attributes: {
        class: 'rich-text px-3 py-2 text-sm outline-none',
        style: `min-height: ${rows * 1.5 + 1}rem`,
        'aria-label': placeholder || 'Comment',
        'aria-multiline': 'true',
        role: 'textbox',
        title: 'Ctrl/Cmd + click a link to open it',
      },
      // Links open with Ctrl/Cmd + click, so a plain click can still edit them.
      handleClick: (view, pos, event) => {
        const href = (event.ctrlKey || event.metaKey) && event.target.closest?.('a')?.getAttribute('href');
        if (!href) return false;
        window.open(href, '_blank', 'noopener,noreferrer');
        return true;
      },
    },
    onUpdate: ({ editor: ed }) => {
      setDraft(ed.isEmpty ? '' : ed.getHTML());
      setPrevious(null);
    },
    onBlur: () => {
      if (draftRef.current !== savedRef.current) onSaveRef.current(draftRef.current);
    },
  });

  // Saved elsewhere (another view, AI, undo): show it unless you're typing here.
  useEffect(() => {
    if (!editor || saved === draftRef.current || editor.isFocused) return;
    editor.commands.setContent(toHtml(saved), { emitUpdate: false });
    setDraft(saved);
  }, [saved, editor]);

  useEffect(() => {
    if (draft === saved || (isBlankComment(draft) && isBlankComment(saved))) return;
    const id = setTimeout(() => onSave(draft), 400);
    return () => clearTimeout(id);
  }, [draft, saved, onSave]);

  const replaceWith = (html) => {
    editor.commands.setContent(toHtml(html), { emitUpdate: false });
    setDraft(html);
    onSave(html);
  };

  const stamp = () => {
    const line = `[${new Date().toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}] `;
    if (editor.isEmpty) editor.chain().focus().insertContent(line).run();
    else editor.chain().focus('end').insertContentAt(editor.state.doc.content.size, `<p>${line}</p>`).focus('end').run();
  };

  const improve = async () => {
    const text = toPlainText(draft);
    if (!text.trim() || busy) return;
    setBusy(true);
    setError('');
    try {
      const better = await improveComment({ text, ...context });
      const before = draft;
      replaceWith(toHtml(better));
      setPrevious(before);
    } catch (err) {
      setError(err.message || 'AI request failed.');
    } finally {
      setBusy(false);
    }
  };

  const undo = () => {
    replaceWith(previous);
    setPrevious(null);
  };

  if (!editor) return null;
  const empty = isBlankComment(draft);

  return (
    <div>
      <div
        className={`overflow-hidden rounded-lg bg-white ring-1 ring-inset ring-slate-300 focus-within:ring-2 focus-within:ring-emerald-500 dark:bg-slate-950 dark:ring-slate-700 ${busy ? 'opacity-60' : ''}`}
      >
        <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-100 px-1 py-1 dark:border-slate-800" role="toolbar" aria-label="Formatting">
          <ToolButton editor={editor} icon={Bold} label="Bold (Ctrl+B)" active="bold" run={(c) => c.toggleBold()} />
          <ToolButton editor={editor} icon={Italic} label="Italic (Ctrl+I)" active="italic" run={(c) => c.toggleItalic()} />
          <ToolButton editor={editor} icon={Underline} label="Underline (Ctrl+U)" active="underline" run={(c) => c.toggleUnderline()} />
          <ToolButton editor={editor} icon={Strikethrough} label="Strikethrough" active="strike" run={(c) => c.toggleStrike()} />
          <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" aria-hidden="true" />
          <ToolButton editor={editor} icon={List} label="Bulleted list" active="bulletList" run={(c) => c.toggleBulletList()} />
          <ToolButton editor={editor} icon={ListOrdered} label="Numbered list" active="orderedList" run={(c) => c.toggleOrderedList()} />
          <ToolButton editor={editor} icon={Code} label="Code" active="code" run={(c) => c.toggleCode()} />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setLinking((l) => !l)}
            aria-pressed={editor.isActive('link') || linking}
            aria-label="Link"
            title="Link"
            className={toolClass(editor.isActive('link') || linking)}
          >
            <Link2 className="h-3.5 w-3.5" />
          </button>
        </div>
        {linking && <LinkBar editor={editor} onDone={() => setLinking(false)} />}
        <EditorContent editor={editor} />
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
        <button type="button" onClick={stamp} className="font-medium text-emerald-600 hover:underline dark:text-emerald-400">
          + timestamp
        </button>
        {AI_ENABLED && (
          <button
            type="button"
            onClick={improve}
            disabled={busy || empty}
            className="inline-flex items-center gap-1 font-medium text-violet-600 hover:underline disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:no-underline dark:text-violet-400"
            title="Rewrite this comment to be clearer and more professional"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
            {busy ? 'Improving…' : 'Improve with AI'}
          </button>
        )}
        {previous != null && !busy && (
          <button type="button" onClick={undo} className="inline-flex items-center gap-1 font-medium text-slate-500 hover:underline">
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" /> Undo AI
          </button>
        )}
        {error && <span className="text-rose-600 dark:text-rose-400">{error}</span>}
      </div>
    </div>
  );
}

const toolClass = (active) =>
  `flex h-7 w-7 items-center justify-center rounded ${
    active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
  }`;

/** A formatting button. mousedown is cancelled so the text selection stays put. */
function ToolButton({ editor, icon: Icon, label, active, run }) {
  const on = editor.isActive(active);
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => run(editor.chain().focus()).run()}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={toolClass(on)}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

/** Add, change or remove the link on the selected text. Enter applies; empty removes. */
function LinkBar({ editor, onDone }) {
  const [url, setUrl] = useState(() => editor.getAttributes('link').href ?? '');
  const apply = () => {
    const href = url.trim();
    const chain = editor.chain().focus().extendMarkRange('link');
    if (!href) chain.unsetLink().run();
    else if (editor.state.selection.empty && !editor.isActive('link')) {
      chain.insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] }).run();
    } else chain.setLink({ href }).run();
    onDone();
  };
  return (
    <div className="flex items-center gap-2 border-b border-slate-100 px-2 py-1.5 dark:border-slate-800">
      <input
        autoFocus
        type="text"
        inputMode="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            apply();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onDone();
            editor.commands.focus();
          }
        }}
        placeholder="Paste a link, e.g. https://…"
        aria-label="Link address"
        className="min-w-0 flex-1 rounded border-0 bg-slate-50 px-2 py-1 text-xs ring-1 ring-inset ring-slate-200 focus:ring-emerald-500 dark:bg-slate-900 dark:ring-slate-700"
      />
      <button type="button" onClick={apply} className="text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400">
        {url.trim() ? 'Apply' : 'Remove'}
      </button>
    </div>
  );
}
