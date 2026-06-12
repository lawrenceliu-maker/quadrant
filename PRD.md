# Product Requirements Document: Quadrant

| Field | Value |
|---|---|
| Product | Quadrant |
| Document status | Draft for stakeholder review |
| Product stage | Functional MVP / early alpha |
| Owner | Product Management |
| Last updated | June 12, 2026 |
| Target release | Alpha v1.0 |

## 1. Executive Summary

Quadrant is a minimal, privacy-first task prioritization product based on the
Eisenhower Matrix. It helps individuals decide what deserves attention by
placing every task into one of four action-oriented quadrants:

- Do Now: urgent and important
- Schedule: important and not urgent
- Delegate: urgent and not important
- Eliminate: not urgent and not important

Unlike traditional task managers, Quadrant prioritizes decision-making over
task collection and project administration. The MVP provides a focused,
responsive workspace with local-only storage and no account requirement.

## 2. Problem Statement

People frequently capture tasks faster than they can prioritize them.
Traditional task-management products often produce long lists, excessive
configuration, and unclear next actions.

Target users need a fast way to:

1. Understand which tasks deserve attention.
2. Separate important work from merely urgent work.
3. Adjust priorities as circumstances change.
4. Maintain focus without managing a complex productivity system.

## 3. Product Vision

Help people consistently make time for what matters.

## 4. Product Principles

1. **Focus before organization:** The product must clarify the next decision.
2. **Simple by default:** Core value must be available without setup.
3. **Every element earns its place:** Avoid visual and functional clutter.
4. **Privacy without configuration:** Local use must require no account.
5. **Fast enough for daily use:** Common actions should feel immediate.

## 5. Goals and Non-Goals

### 5.1 MVP Goals

- Enable users to capture and prioritize tasks in under 30 seconds.
- Keep all four priority categories visible in one primary workspace.
- Allow users to change priorities through direct manipulation.
- Support a complete personal task-management loop: create, review, update,
  complete, and remove.
- Preserve task data between browser sessions.
- Provide a usable experience on desktop and mobile browsers.
- Validate whether users return to the matrix as a recurring planning habit.

### 5.2 Non-Goals

The MVP will not provide:

- Team collaboration or task assignment
- User accounts or cloud synchronization
- Calendar integrations
- Push notifications or reminders
- Recurring tasks
- Projects, subtasks, or dependencies
- Native mobile or desktop applications
- AI-generated prioritization
- Enterprise administration or compliance controls

## 6. Target Users

### 6.1 Primary Persona: Independent Knowledge Worker

Examples include product managers, freelancers, consultants, and individual
contributors.

**Needs**

- Prioritize competing work quickly
- Protect time for important but non-urgent tasks
- Reduce cognitive load
- Review progress without maintaining a complex system

### 6.2 Secondary Persona: Student or Personal Planner

**Needs**

- Balance deadlines, personal responsibilities, and longer-term goals
- Understand what must be done now versus scheduled later
- Use the product without setup or subscription

## 7. Jobs to Be Done

> When I have many competing tasks, help me quickly decide what deserves my
> attention so I can act without reorganizing an entire task-management system.

Supporting jobs:

- When priorities change, help me reclassify tasks immediately.
- When I finish work, help me see progress and reduce the remaining workload.
- When I return later, preserve my task list without requiring an account.

## 8. User Experience Overview

### 8.1 Primary User Journey

1. User opens Quadrant.
2. User sees the four-quadrant Focus Board.
3. User adds a task and chooses a quadrant.
4. User reviews tasks and acts on the highest-priority work.
5. User completes tasks or drags them into a different quadrant.
6. User reviews completed work and returns in a later session.

### 8.2 Information Architecture

The product has one primary surface and three task views:

- **Today:** Active, incomplete tasks
- **All:** Active and completed tasks
- **Completed:** Completed tasks only

The primary surface contains:

- Floating toolbar
- View selector
- Search
- Progress indicator
- Four-quadrant task matrix
- Floating task editor
- Completion summary

## 9. Functional Requirements

Priority definitions:

- **P0:** Required for MVP release
- **P1:** Important follow-up
- **P2:** Future enhancement

### 9.1 Task Management

| ID | Priority | Requirement |
|---|---|---|
| FR-001 | P0 | Users can create a task with a required title. |
| FR-002 | P0 | Users can assign a task to one of the four quadrants. |
| FR-003 | P0 | Users can optionally add a category, due date, due time, and notes. |
| FR-004 | P0 | Users can edit an existing task. |
| FR-005 | P0 | Users can delete an existing task. |
| FR-006 | P0 | Users can mark a task complete or incomplete. |
| FR-007 | P0 | Users can drag a task between quadrants on supported devices. |
| FR-008 | P1 | Users can move tasks between quadrants without drag and drop. |
| FR-009 | P1 | Users can undo destructive or state-changing actions. |

### 9.2 Views and Search

| ID | Priority | Requirement |
|---|---|---|
| FR-010 | P0 | Today view displays incomplete tasks. |
| FR-011 | P0 | All view displays all tasks. |
| FR-012 | P0 | Completed view displays completed tasks. |
| FR-013 | P0 | Search filters tasks by title, category, and notes. |
| FR-014 | P0 | View selection and search results update without a page reload. |
| FR-015 | P1 | Users can filter tasks by quadrant, category, or due date. |

### 9.3 Progress and Review

| ID | Priority | Requirement |
|---|---|---|
| FR-020 | P0 | The toolbar displays completed tasks as a fraction of total tasks. |
| FR-021 | P0 | The footer displays completed and remaining task counts. |
| FR-022 | P0 | Users can clear all completed tasks. |
| FR-023 | P1 | The product provides an end-of-day review flow. |
| FR-024 | P2 | The product provides weekly prioritization insights. |

### 9.4 Data Persistence

| ID | Priority | Requirement |
|---|---|---|
| FR-030 | P0 | Task data persists in browser local storage between sessions. |
| FR-031 | P0 | Existing locally stored task data remains compatible across visual redesigns. |
| FR-032 | P1 | Users can export tasks to a portable file. |
| FR-033 | P1 | Users can import a previously exported task file. |
| FR-034 | P2 | Users can optionally synchronize tasks across devices. |

### 9.5 Responsive Experience

| ID | Priority | Requirement |
|---|---|---|
| FR-040 | P0 | Desktop displays the matrix as a two-by-two workspace. |
| FR-041 | P0 | Mobile displays quadrants in a readable single-column sequence. |
| FR-042 | P0 | View switching, search, and add-task controls remain accessible on mobile. |
| FR-043 | P0 | The interface does not introduce horizontal page overflow at supported widths. |

## 10. Interaction Requirements

### 10.1 Add Task

1. User selects the add control in the toolbar or within a quadrant.
2. The task editor opens.
3. If opened from a quadrant, that quadrant is preselected.
4. User enters a task title and optional metadata.
5. User saves the task.
6. The task appears immediately in the selected quadrant.

### 10.2 Edit Task

1. User selects a task menu or double-clicks a task.
2. The floating task editor opens with existing values.
3. User updates fields and saves.
4. Changes appear immediately without a page reload.

### 10.3 Complete Task

1. User selects the task completion control.
2. The task completion state updates immediately.
3. Progress metrics update immediately.
4. The task visibility follows the active view.

### 10.4 Move Task

1. User drags a task into another quadrant.
2. The target quadrant provides visual feedback.
3. On drop, the task is reassigned and persisted.

## 11. Non-Functional Requirements

### 11.1 Performance

- NFR-001: Initial page load should complete within 2 seconds on a typical
  broadband connection.
- NFR-002: Common task interactions should provide visible feedback within
  100 milliseconds.
- NFR-003: The MVP should operate without a backend dependency.

### 11.2 Accessibility

- NFR-010: All interactive controls must have accessible labels.
- NFR-011: Core workflows must be operable by keyboard, excluding drag and
  drop until an accessible alternative is implemented.
- NFR-012: Text and essential controls must meet WCAG AA contrast targets.
- NFR-013: Focus states must remain visible.
- NFR-014: Touch targets should be at least 40 by 40 CSS pixels where practical.

### 11.3 Privacy and Security

- NFR-020: The MVP must not transmit task content to a remote server.
- NFR-021: The product must explain that clearing browser storage can delete
  task data.
- NFR-022: No secrets or credentials may be stored in the client application.
- NFR-023: User-provided text must be escaped before rendering.

### 11.4 Reliability

- NFR-030: Task changes must be persisted immediately after successful actions.
- NFR-031: Invalid or corrupted local data must not prevent the application
  from opening.
- NFR-032: Visual redesigns must not break the existing storage schema without
  a migration path.

### 11.5 Browser Support

The alpha release supports the latest stable versions of:

- Microsoft Edge
- Google Chrome
- Safari
- Firefox

## 12. Design Requirements

- Use native system typography.
- Keep the matrix as the dominant product surface.
- Prefer whitespace and hairline dividers over stacked cards.
- Use semantic quadrant color sparingly.
- Keep the primary add action visible.
- Avoid permanent navigation that reduces focus.
- Use motion only to clarify state changes.
- Preserve functionality and clarity at mobile breakpoints.

## 13. Analytics and Measurement Plan

The current local-only MVP does not include analytics. If analytics are added,
they must be privacy-preserving and must not collect task content.

### 13.1 North-Star Metric

**Weekly Prioritized Tasks Completed**

Definition: Number of tasks completed in a seven-day period after being placed
in a quadrant.

### 13.2 Activation Definition

A user is activated after they:

1. Create at least four tasks.
2. Use at least two quadrants.
3. Complete at least one task.

### 13.3 Proposed Product Events

| Event | Properties |
|---|---|
| `task_created` | quadrant, has_due_date, has_category |
| `task_completed` | quadrant, age_in_days |
| `task_reopened` | quadrant |
| `task_moved` | from_quadrant, to_quadrant |
| `task_deleted` | quadrant, completed |
| `view_selected` | view |
| `search_used` | result_count |
| `completed_tasks_cleared` | count |

Task titles, notes, and categories must not be collected.

### 13.4 Initial Success Targets

| Metric | Alpha target |
|---|---:|
| Activation rate | 60% |
| Week-one retention | 30% |
| Task completion rate | 40% |
| Median task-add time | Under 10 seconds |
| Data-loss incidents | 0 |

## 14. Acceptance Criteria for Alpha v1.0

The release is ready when:

1. Users can create, edit, complete, delete, search, and move tasks.
2. All four quadrants render correctly on desktop and mobile.
3. Task changes persist after browser refresh.
4. Today, All, and Completed views return the expected tasks.
5. Progress and remaining-task counts update correctly.
6. Existing local task data remains usable.
7. No horizontal overflow appears at a 390-pixel viewport.
8. JavaScript syntax and automated core-interaction checks pass.
9. Visual QA contains no unresolved P0, P1, or P2 findings.
10. The README accurately represents the current product.

## 15. Release Plan

### Phase 1: Internal Alpha

Audience:

- Product team
- Friends and colleagues
- Small group of productivity-focused users

Objectives:

- Identify usability and accessibility issues
- Validate quadrant terminology
- Detect persistence failures
- Measure whether users return after initial use

### Phase 2: Public Alpha

Distribution:

- GitHub repository
- Product-management communities
- Productivity communities
- Personal and professional networks

Required additions before public promotion:

- Clear local-storage warning
- Data export and import
- Lightweight onboarding
- Feedback collection channel
- Privacy-preserving analytics decision

### Phase 3: Beta

Entry criteria:

- Evidence of recurring weekly use
- Stable task persistence
- Validated demand for at least one expansion feature

Potential beta scope:

- Daily review
- Keyboard shortcuts
- Undo
- Recurring tasks
- Optional synchronization

## 16. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Users lose locally stored tasks | High | Add export/import, storage warning, and optional sync. |
| Users misunderstand quadrant meanings | Medium | Add concise onboarding and action-oriented labels. |
| Drag and drop is inaccessible | High | Add a keyboard and menu-based move action. |
| Product becomes feature-heavy | High | Require evidence and complexity review for roadmap additions. |
| Users do not form a repeat habit | High | Test daily review and recurring-task workflows. |
| Local-only architecture limits measurement | Medium | Use opt-in, privacy-preserving analytics without task content. |

## 17. Dependencies

- Modern browser with local-storage support
- Static hosting or local HTTP server
- Material Symbols font availability for interface icons
- GitHub repository for source control and distribution

## 18. Open Questions

1. Should Today display all incomplete tasks or only tasks due today?
2. Do users understand Delegate when using the product individually?
3. Is Eliminate valuable as a persistent task list or should it encourage
   immediate deletion?
4. Is local-only storage acceptable after the alpha phase?
5. Which accessible alternative should replace drag and drop?
6. Does the progress indicator motivate users or create pressure?
7. Should category remain free-form or become a managed set of tags?

## 19. Recommended Next Product Decision

Do not expand the product broadly until the team validates the following
hypothesis:

> Activated users return weekly because the four-quadrant workflow helps them
> make better daily prioritization decisions.

The next product milestone is to conduct an internal alpha with 10 to 15 target
users and evaluate activation, week-one retention, task movement, and task
completion behavior.
