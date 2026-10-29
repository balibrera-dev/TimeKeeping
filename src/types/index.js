/**
 * Shared data shapes for the app. Plain JS with JSDoc so editors still give
 * autocomplete and type hints without a TypeScript build step.
 */

/** @typedef {'idle' | 'active' | 'paused' | 'completed'} TaskStatus */

/** @typedef {'task' | 'interruption'} TaskKind */

/** @typedef {'call' | 'break' | 'lunch'} InterruptionType */

/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} name
 * @property {string} color  Hex color, e.g. "#0ea5e9".
 * @property {number} createdAt
 */

/**
 * @typedef {Object} TemplateSubtask
 * @property {string} id
 * @property {string} title
 * @property {number} estimate  Default estimate in minutes.
 */

/**
 * @typedef {Object} Template
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {TemplateSubtask[]} subtasks
 * @property {number} createdAt
 */

/**
 * @typedef {Object} Subtask
 * @property {string} id
 * @property {string} title
 * @property {number} estimate  Estimate in minutes.
 * @property {boolean} done
 * @property {string} notes  The subtask's single comment.
 * @property {string} jira  Jira issue key for this subtask ('' when none).
 * @property {number | null} [timeOverride]  Manually set total (ms) for a completed subtask; replaces its tracked time.
 */

/**
 * A closed work session. All values are epoch milliseconds / milliseconds.
 * @typedef {Object} TimeLog
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 * @property {string | null} [subtaskId]  Subtask the time was allocated to, if any.
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {TaskKind} kind
 * @property {InterruptionType | null} interruptType  Set when kind is 'interruption'.
 * @property {string | null} resumeTaskId  Interruptions: task to resume when it ends.
 * @property {string | null} clientId
 * @property {string} stakeholder  Who the task is for, free text ('' when none).
 * @property {string | null} templateId
 * @property {TaskStatus} status
 * @property {Subtask[]} subtasks
 * @property {string | null} currentSubtaskId  Subtask that receives tracked time.
 * @property {TimeLog[]} logs
 * @property {number | null} activeStart  Start timestamp of the open session, if running.
 * @property {string} notes  Task-level comment (used when the task has no subtasks).
 * @property {string} jira  Jira issue key, e.g. CLA-30533 ('' when none).
 * @property {number} createdAt
 * @property {number | null} completedAt
 */

/**
 * @typedef {Object} AppSettings
 * @property {boolean} allowTimeEdits  Whether totals of completed subtasks can be edited by hand.
 * @property {boolean} estimateAlerts  Ping when the running subtask / task nears its estimate.
 * @property {number} alertLeadMinutes  How many minutes before the estimate to warn (0 = at the estimate).
 * @property {EstimateAction} onEstimateReached  'stay' (default) or 'next' to move to the next subtask automatically.
 * @property {boolean} alertSound  Play a ping with the alert.
 * @property {boolean} desktopNotifications  Also show a system notification when the tab is in the background.
 * @property {boolean} runningOnTop  Show the running task at the top of the task list (default) or keep it in its place.
 * @property {string} jiraDomain  Jira site, e.g. https://business.atlassian.net, used to open a task's story / parent.
 */

/**
 * @typedef {Object} TrackerState
 * @property {number} version
 * @property {Template[]} templates
 * @property {Task[]} tasks
 * @property {Client[]} clients
 */

export const TASK_STATUSES = /** @type {const} */ (['idle', 'active', 'paused', 'completed']);

export const CATEGORIES = ['Development', 'Reporting', 'Data Engineering', 'Analysis', 'Meetings', 'Support', 'Other'];

/** Quick interruptions that stop current work and track their own time. */
export const INTERRUPTIONS = {
  call: { label: 'Call', category: 'Meetings', color: '#8b5cf6', placeholder: 'Who / what is the call about?' },
  break: { label: 'Break', category: 'Break', color: '#64748b', placeholder: 'Break' },
  lunch: { label: 'Lunch', category: 'Break', color: '#f97316', placeholder: 'Lunch' },
  // Idle time is recorded (and shown on the calendar) but never counts toward tracked totals or exports.
  idle: { label: 'Idle', category: 'Idle', color: '#94a3b8', placeholder: 'Idle', countsAsWork: false },
};

/** @typedef {'stay' | 'next'} EstimateAction  What happens when the running subtask reaches its estimate. */

/** Default palette offered when creating a client. */
export const CLIENT_COLORS = [
  '#0ea5e9',
  '#10b981',
  '#8b5cf6',
  '#f43f5e',
  '#f59e0b',
  '#14b8a6',
  '#6366f1',
  '#ec4899',
  '#84cc16',
  '#06b6d4',
  '#a855f7',
  '#ef4444',
];
