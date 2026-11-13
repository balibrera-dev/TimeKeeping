import { lazy, Suspense } from 'react';

// The rich text editor is loaded on first use, so it doesn't slow down opening the app.
const RichCommentEditor = lazy(() => import('./RichCommentEditor.jsx'));

/** A task or subtask comment with rich text. Same props as RichCommentEditor. */
export function CommentBox(props) {
  const rows = props.rows ?? 3;
  return (
    <Suspense
      fallback={
        <div
          className="animate-pulse rounded-lg bg-white ring-1 ring-inset ring-slate-300 dark:bg-slate-950 dark:ring-slate-700"
          style={{ minHeight: `${rows * 1.5 + 3.25}rem` }}
          aria-busy="true"
          aria-label="Loading the comment editor"
        />
      }
    >
      <RichCommentEditor {...props} />
    </Suspense>
  );
}
