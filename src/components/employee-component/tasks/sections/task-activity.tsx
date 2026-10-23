import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowDownUp, Clock, ImagePlus, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { fieldClass } from '@/components/ui/form-fields';
import { useAuth } from '@/context/auth-context';
import { can } from '@/lib/permissions/task-permissions';
import { getUserById } from '@/lib/user-directory';
import { cn, formatRelativeTime, generateId, getInitials } from '@/lib/utils';
import { MAX_UPLOAD_BYTES, TASK_ATTACHMENT_CATEGORY } from '@/services/apis/files/file-service';
import { useUploadFiles } from '@/services/apis/files/use-files';
import { useAddComment, useTaskActivity, useTaskComments, useTaskWorkLogs } from '@/services/apis/tasks/use-tasks';
import type { Task, TaskActivity, TaskAttachment, TaskComment, TaskUser, WorkLog } from '@/types';
import { getStatusMeta } from './task-config';
import { formatShortDate } from './task-utils';

type ActivityTab = 'all' | 'comments' | 'history' | 'worklog';

const TABS: { value: ActivityTab; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'comments', label: 'Comments' },
  { value: 'history', label: 'History' },
  { value: 'worklog', label: 'Work log' },
];

// One-click starters for common updates; the text stays editable before sending
const QUICK_REPLIES = ['👍 Looks good to me', '🙋 Can someone help with this?', '⛔ I am blocked on…', '❓ Could you clarify…', '✅ This is on track'];

const MENTION_LIMIT = 8;
const MAX_COMMENT_IMAGES = 10;

// Someone who can be @mentioned, with their part in the task (Assignee, Reporter, Watcher)
export interface MentionCandidate {
  member: TaskUser;
  tag?: string;
}

function UserAvatar({ userId, size = 'md' }: { userId: string; size?: 'sm' | 'md' }) {
  const name = getUserById(userId)?.name ?? '?';
  return (
    <span
      title={name}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700',
        size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-8 w-8 text-xs',
      )}
    >
      {getInitials(name)}
    </span>
  );
}

const nameOf = (userId?: string) => (userId === 'system' ? 'Automation' : (getUserById(userId)?.name ?? 'Someone'));
const statusLabel = (status?: string) => (status ? getStatusMeta(status).label : '');
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ---------- Comment composer with @mentions ---------- */

// Highlights "@Name" for the people actually mentioned in the comment
function CommentBody({ comment }: { comment: TaskComment }) {
  const names = comment.mentionIds.map((id) => getUserById(id)?.name).filter((name): name is string => !!name);
  if (names.length === 0) return <>{comment.body}</>;
  const pattern = new RegExp(`(${names.map((name) => escapeRegExp(`@${name}`)).join('|')})`, 'g');
  return (
    <>
      {comment.body.split(pattern).map((part, index) =>
        names.some((name) => part === `@${name}`) ? (
          <span key={index} className="rounded bg-indigo-100 px-1 font-medium text-indigo-700">{part}</span>
        ) : (
          part
        ),
      )}
    </>
  );
}

// Images waiting to be sent with a comment, previewed from the browser before upload
interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
}

function CommentComposer({ task, mentionable }: { task: Task; mentionable: MentionCandidate[] }) {
  const { user } = useAuth();
  const addComment = useAddComment();
  const uploadFiles = useUploadFiles();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [mentions, setMentions] = useState<TaskUser[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(0);
  const [images, setImages] = useState<PendingImage[]>([]);
  const [imageError, setImageError] = useState('');
  const isSending = addComment.isPending || uploadFiles.isPending;

  // Previews are browser blobs; free them when they leave the composer
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)), []);

  const addImages = (files: File[]) => {
    const pictures = files.filter((file) => file.type.startsWith('image/'));
    const small = pictures.filter((file) => file.size <= MAX_UPLOAD_BYTES);
    const room = Math.max(0, MAX_COMMENT_IMAGES - images.length);
    const accepted = small.slice(0, room);
    setImageError(
      pictures.length < files.length
        ? 'Only images can be added to a comment — use Attachments for other files.'
        : small.length < pictures.length
          ? 'Images larger than 10 MB were skipped.'
          : small.length > room
            ? `Up to ${MAX_COMMENT_IMAGES} images per comment.`
            : '',
    );
    if (accepted.length === 0) return;
    setImages((current) => [...current, ...accepted.map((file) => ({ id: generateId(), file, previewUrl: URL.createObjectURL(file) }))]);
  };

  const removeImage = (id: string) =>
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return current.filter((image) => image.id !== id);
    });

  const clearComposer = () => {
    images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    setImages([]);
    setImageError('');
    setText('');
    setMentions([]);
  };

  const suggestions = useMemo(
    () =>
      query === null
        ? []
        : mentionable.filter(({ member }) => member.name.toLowerCase().includes(query.toLowerCase())).slice(0, MENTION_LIMIT),
    [query, mentionable],
  );

  // An "@word" right before the caret opens the people picker
  const updateQuery = (value: string, caret: number) => {
    const match = /(?:^|\s)@([\w]*)$/.exec(value.slice(0, caret));
    setQuery(match ? match[1] : null);
    setHighlighted(0);
  };

  const focusAt = (position: number) =>
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(position, position);
    });

  const pick = (member: TaskUser) => {
    const caret = textareaRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/@[\w]*$/, `@${member.name} `);
    setText(before + text.slice(caret));
    setMentions((current) => (current.some((item) => item.id === member.id) ? current : [...current, member]));
    setQuery(null);
    focusAt(before.length);
  };

  const insertQuickReply = (reply: string) => {
    const next = text ? `${text.trimEnd()} ${reply}` : reply;
    setText(next);
    focusAt(next.length);
  };

  const submit = async () => {
    if ((!text.trim() && images.length === 0) || isSending) return;
    // Only keep mentions whose "@Name" is still in the text
    const mentionIds = mentions.filter((member) => text.includes(`@${member.name}`)).map((member) => member.id);
    let attachments: TaskAttachment[] = [];
    if (images.length > 0) {
      try {
        const uploaded = await uploadFiles.mutateAsync({ files: images.map((image) => image.file), category: TASK_ATTACHMENT_CATEGORY, taskId: task.id });
        attachments = uploaded.map((file) => ({
          id: file.id,
          fileId: file.id,
          name: file.name,
          url: file.url,
          sizeBytes: file.size,
          uploadedById: file.uploadedById,
          uploadedAt: new Date().toISOString(),
        }));
      } catch (error) {
        setImageError(error instanceof Error ? error.message : "Couldn't upload the images. Please try again.");
        return;
      }
    }
    addComment.mutate({ task, body: text, mentionIds, attachments }, { onSuccess: clearComposer });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (suggestions.length > 0) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const step = event.key === 'ArrowDown' ? 1 : -1;
        setHighlighted((current) => (current + step + suggestions.length) % suggestions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        pick(suggestions[highlighted].member);
        return;
      }
      if (event.key === 'Escape') {
        setQuery(null);
        return;
      }
    }
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      void submit();
    }
  };

  // Screenshots pasted into the comment box are added as images
  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = Array.from(event.clipboardData.files).filter((file) => file.type.startsWith('image/'));
    if (pasted.length === 0) return;
    event.preventDefault();
    addImages(pasted);
  };

  const hasContent = !!text || images.length > 0;

  return (
    <div className="flex gap-3">
      {user && <UserAvatar userId={user.id} />}
      <div className="relative min-w-0 flex-1">
        <div className="rounded-lg border border-gray-200 bg-white focus-within:border-[#464EB8]/50 focus-within:ring-2 focus-within:ring-[#464EB8]/20">
          <Textarea
            ref={textareaRef}
            value={text}
            rows={3}
            placeholder="Add a comment… type @ to mention someone"
            className={cn(fieldClass, 'resize-none border-0 shadow-none focus-visible:ring-0')}
            aria-label="Add a comment"
            aria-expanded={suggestions.length > 0}
            aria-controls="mention-suggestions"
            onChange={(event) => {
              setText(event.target.value);
              updateQuery(event.target.value, event.target.selectionStart);
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onBlur={() => setTimeout(() => setQuery(null), 150)}
          />
          {images.length > 0 && (
            <ul className="flex flex-wrap gap-2 px-3 pb-3" aria-label="Images to send">
              {images.map((image) => (
                <li key={image.id} className="group relative h-20 w-20 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                  <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(image.id)}
                    aria-label={`Remove ${image.file.name}`}
                    disabled={isSending}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-1.5 px-3 pb-3">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => {
                addImages(Array.from(event.target.files ?? []));
                event.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={isSending || images.length >= MAX_COMMENT_IMAGES}
              title={`Add images (up to ${MAX_COMMENT_IMAGES}) — you can also paste screenshots`}
              className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:border-[#464EB8]/40 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ImagePlus className="h-3.5 w-3.5" />
              Add images
            </button>
            {!hasContent &&
              QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  onClick={() => insertQuickReply(reply)}
                  className="rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:border-[#464EB8]/40 hover:bg-indigo-50"
                >
                  {reply}
                </button>
              ))}
          </div>
        </div>
        {imageError && <p className="mt-1 text-xs text-amber-700">{imageError}</p>}

        {suggestions.length > 0 && (
          <ul id="mention-suggestions" role="listbox" className="absolute left-0 top-full z-20 mt-1 w-72 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
            {suggestions.map(({ member, tag }, index) => (
              <li key={member.id} role="option" aria-selected={index === highlighted}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(member)}
                  className={cn('flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm', index === highlighted ? 'bg-indigo-50' : 'hover:bg-gray-50')}
                >
                  <UserAvatar userId={member.id} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-gray-900">
                      {member.name}
                      {member.id === user?.id && <span className="font-normal text-gray-500"> (me)</span>}
                    </span>
                    <span className="block truncate text-xs text-gray-500">{member.designation}</span>
                  </span>
                  {tag && <span className="rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-700">{tag}</span>}
                </button>
              </li>
            ))}
          </ul>
        )}

        {hasContent && (
          <div className="mt-2 flex items-center justify-end gap-3">
            <span className="text-xs text-gray-400">Ctrl + Enter to send</span>
            <Button type="button" size="sm" variant="ghost" onClick={clearComposer} disabled={isSending}>
              Cancel
            </Button>
            <Button type="button" size="sm" onClick={() => void submit()} disabled={isSending} className="bg-[#464EB8] text-white hover:bg-[#3a3f9a]">
              {uploadFiles.isPending ? 'Uploading…' : addComment.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Items ---------- */

function describeActivity(activity: TaskActivity): ReactNode {
  switch (activity.type) {
    case 'created':
      return 'created the task';
    case 'updated':
      return activity.field === 'sprint' ? (
        <>
          moved this to <b>{activity.to}</b>
        </>
      ) : (
        'updated the details'
      );
    case 'status-changed':
      // Approvals record a note ("Approved" / "Sent back") on top of the status change
      return (
        <>
          {activity.note ? `${activity.note.toLowerCase()} this — ` : ''}changed status from <b>{statusLabel(activity.from)}</b> to{' '}
          <b>{statusLabel(activity.to)}</b>
        </>
      );
    case 'assigned':
      return (
        <>
          reassigned from <b>{nameOf(activity.from)}</b> to <b>{nameOf(activity.to)}</b>
        </>
      );
    case 'duplicated':
      return `duplicated this from ${activity.from}`;
    case 'commented':
      return 'added a comment';
    case 'subtask-added':
      return `added sub-task ${activity.to}: ${activity.note}`;
    case 'attachment-added':
      return `attached ${activity.note}`;
    case 'attachment-removed':
      return `removed attachment ${activity.note}`;
    case 'work-logged':
      return `logged ${activity.to}h${activity.note ? ` — ${activity.note}` : ''}`;
    case 'blocked':
      return `flagged as blocked: ${activity.note}`;
    case 'unblocked':
      return 'removed the blocked flag';
    case 'watched':
      return 'started watching';
    case 'unwatched':
      return 'stopped watching';
    case 'deleted':
      return 'deleted the task';
  }
}

function CommentItem({ comment }: { comment: TaskComment }) {
  return (
    <li className="flex gap-3">
      <UserAvatar userId={comment.authorId} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold text-gray-900">{nameOf(comment.authorId)}</span>
          <span className="ml-2 text-xs text-gray-400">{formatRelativeTime(comment.createdAt)}</span>
        </p>
        {comment.body && (
          <p className="mt-0.5 whitespace-pre-wrap break-words text-sm text-gray-700">
            <CommentBody comment={comment} />
          </p>
        )}
        {(comment.attachments?.length ?? 0) > 0 && (
          <ul className="mt-2 flex flex-wrap gap-2">
            {comment.attachments!.map((image) => (
              <li key={image.id}>
                <a
                  href={image.url}
                  target="_blank"
                  rel="noreferrer"
                  title={`Open ${image.name}`}
                  className="block h-28 w-28 overflow-hidden rounded-md border border-gray-200 bg-gray-50 hover:ring-2 hover:ring-[#464EB8]/40"
                >
                  {image.url ? (
                    <img src={image.url} alt={image.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <span className="flex h-full items-center justify-center p-2 text-center text-xs text-gray-500">{image.name}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

function HistoryItem({ activity }: { activity: TaskActivity }) {
  return (
    <li className="flex gap-3 text-sm">
      <UserAvatar userId={activity.actorId} size="sm" />
      <p className="min-w-0 flex-1 text-gray-700">
        <span className="font-semibold text-gray-900">{nameOf(activity.actorId)}</span> {describeActivity(activity)}
        <span className="ml-2 text-xs text-gray-400">{formatRelativeTime(activity.createdAt)}</span>
      </p>
    </li>
  );
}

function WorkLogItem({ workLog }: { workLog: WorkLog }) {
  return (
    <li className="flex gap-3 text-sm">
      <UserAvatar userId={workLog.userId} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-gray-700">
          <span className="font-semibold text-gray-900">{nameOf(workLog.userId)}</span> logged <b>{workLog.hours}h</b> on{' '}
          {formatShortDate(workLog.date)}
          <span className="ml-2 text-xs text-gray-400">{formatRelativeTime(workLog.createdAt)}</span>
        </p>
        {workLog.note && <p className="text-gray-600">{workLog.note}</p>}
      </div>
    </li>
  );
}

type FeedItem =
  | { kind: 'comment'; at: string; comment: TaskComment }
  | { kind: 'history'; at: string; activity: TaskActivity }
  | { kind: 'worklog'; at: string; workLog: WorkLog };

/* ---------- Section ---------- */

// canComment defaults to the role's comment rights; the task page also lets project members join in
export function TaskActivitySection({ task, mentionable, canComment }: { task: Task; mentionable: MentionCandidate[]; canComment?: boolean }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<ActivityTab>('comments');
  const [newestFirst, setNewestFirst] = useState(true);
  const comments = useTaskComments(task.id);
  const activity = useTaskActivity(task.id);
  const workLogs = useTaskWorkLogs(task.id);

  const feed = useMemo(() => {
    const items: FeedItem[] = [];
    if (tab === 'all' || tab === 'comments') {
      (comments.data ?? []).forEach((comment) => items.push({ kind: 'comment', at: comment.createdAt, comment }));
    }
    if (tab === 'all' || tab === 'history') {
      // In "All" the comment itself is shown, so skip its "added a comment" history line
      (activity.data ?? [])
        .filter((item) => tab === 'history' || item.type !== 'commented')
        .forEach((item) => items.push({ kind: 'history', at: item.createdAt, activity: item }));
    }
    if (tab === 'all' || tab === 'worklog') {
      (workLogs.data ?? []).forEach((workLog) => items.push({ kind: 'worklog', at: workLog.createdAt, workLog }));
    }
    return items.sort((a, b) => (newestFirst ? b.at.localeCompare(a.at) : a.at.localeCompare(b.at)));
  }, [tab, newestFirst, comments.data, activity.data, workLogs.data]);

  const sources = { all: [comments, activity, workLogs], comments: [comments], history: [activity], worklog: [workLogs] }[tab];
  const isLoading = sources.some((query) => query.isLoading);
  const isError = sources.some((query) => query.isError);
  const totalLogged = (workLogs.data ?? []).reduce((sum, workLog) => sum + workLog.hours, 0);

  return (
    <section className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Activity</h2>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="tablist" aria-label="Activity" className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => setTab(item.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === item.value ? 'bg-white text-[#464EB8] shadow-sm ring-1 ring-[#464EB8]/30' : 'text-gray-600 hover:text-gray-900',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setNewestFirst((current) => !current)}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
        >
          <ArrowDownUp className="h-4 w-4" />
          {newestFirst ? 'Newest first' : 'Oldest first'}
        </button>
      </div>

      {(tab === 'all' || tab === 'comments') && (canComment ?? can(user, 'task.comment', task)) && <CommentComposer task={task} mentionable={mentionable} />}

      {tab === 'worklog' && totalLogged > 0 && (
        <p className="flex items-center gap-1.5 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          {totalLogged}h logged in total
        </p>
      )}

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Couldn't load the activity. Try reloading the page.</p>}
      {!isLoading && !isError && feed.length === 0 && (
        <p className="flex items-center gap-2 text-sm text-gray-500">
          {tab === 'worklog' ? <Clock className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          {{ all: 'No activity yet.', comments: 'No comments yet.', history: 'No history yet.', worklog: 'No work logged yet.' }[tab]}
        </p>
      )}

      <ul className="space-y-4">
        {feed.map((item) =>
          item.kind === 'comment' ? (
            <CommentItem key={`c-${item.comment.id}`} comment={item.comment} />
          ) : item.kind === 'history' ? (
            <HistoryItem key={`h-${item.activity.id}`} activity={item.activity} />
          ) : (
            <WorkLogItem key={`w-${item.workLog.id}`} workLog={item.workLog} />
          ),
        )}
      </ul>
    </section>
  );
}
