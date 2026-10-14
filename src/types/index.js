/**
 * Shared data shapes for the app. Plain JS with JSDoc so editors still give
 * autocomplete and type hints without a TypeScript build step.
 */

/** @typedef {'idle' | 'active' | 'paused' | 'completed'} TaskStatus */

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
 */

/**
 * A closed work session. All values are epoch milliseconds / milliseconds.
 * @typedef {Object} TimeLog
 * @property {number} startTime
 * @property {number} endTime
 * @property {number} duration
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} category
 * @property {string | null} templateId
 * @property {TaskStatus} status
 * @property {Subtask[]} subtasks
 * @property {TimeLog[]} logs
 * @property {number | null} activeStart  Start timestamp of the open session, if running.
 * @property {string} notes
 * @property {number} createdAt
 * @property {number | null} completedAt
 */

/**
 * @typedef {Object} TrackerState
 * @property {number} version
 * @property {Template[]} templates
 * @property {Task[]} tasks
 */

export const TASK_STATUSES = /** @type {const} */ (['idle', 'active', 'paused', 'completed']);

export const CATEGORIES = ['Development', 'Reporting', 'Data Engineering', 'Analysis', 'Meetings', 'Support', 'Other'];
