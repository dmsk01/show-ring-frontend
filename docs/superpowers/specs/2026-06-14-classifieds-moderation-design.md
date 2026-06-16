# Classifieds moderation flow — design

Date: 2026-06-14
Status: approved (frontend implemented here; backend gate handed off separately)

## Problem

A newly created classified goes live immediately with `status=active` (backend model default).
There is no moderation gate: the `moderation` status exists in the enum and the admin queue
(`GET /admin/moderation/classifieds`, which filters `status=moderation`) reads it, but **nothing
ever sets `moderation`** — so the queue is always empty and the admin moderation UI is dead.

Desired flow: a non-admin author creates a listing → it waits in `moderation` (hidden from the
public showcase, visible to the author and to the admin queue) → an admin approves (`→ active`) or
rejects (`→ closed`).

## Decisions (from brainstorming)

1. **Who is moderated:** every new listing from a non-admin → `moderation`. Admin-created → `active`.
2. **Re-moderation on edit:** when an author edits an `active` listing, it returns to `moderation`
   (any field change). Editing a `closed` listing keeps it `closed`; editing a `moderation` listing
   keeps it `moderation`.
3. **Author self-service status control:**
   - `active` / `moderation` → `closed` (withdraw).
   - `closed` → `moderation` (re-submit; never straight to `active`).
   - Only an admin can set `active`.

## Target status machine

```
create (non-admin)            → moderation
create (admin)                → active
admin approve                 → active
admin reject                  → closed
author withdraw               active|moderation → closed
author re-submit              closed → moderation
author edits an active item   active → moderation   (automatic, server-side)
scheduler (unchanged)         active → closed (overdue) / active → archived (old)
```

Public showcase & search remain `active`-only — `moderation` is hidden from everyone except the
author (in `/classifieds/mine`) and admins (in the moderation queue).

## Backend changes (separate session/repo: `E:\Coding\python-animal-platform`)

Captured verbatim in the handoff prompt. Summary:

1. `create_classified` service/router: set `status = active` if the author is admin, else
   `moderation`. (Model default stays `active`; the service injects the value.)
2. `_USER_STATUS_TRANSITIONS` (`app/services/classified.py`): `closed → {moderation}` (was
   `{active}`), `moderation → {closed}`, `active → {closed}` (unchanged). Admin bypass unchanged.
3. `update_classified`: if a non-admin updates a listing currently in `active` and does not
   explicitly move it to `closed` in the same request → set `status = moderation` (re-moderation),
   with a `moderation_logs` entry mirroring the existing approve/reject logging.
4. Admin moderate endpoint (`approve→active` / `reject→closed`) — already correct, no change.

## Frontend changes (this repo)

Designed to be **correct regardless of backend deploy order** — status-dependent copy is derived
from the actual `status` returned by the API, never hardcoded.

1. **Create form** (`classified-create-edit-form.tsx`): after `createClassified`, branch the toast
   on the returned `status` — `moderation` → "sent to moderation" copy; otherwise the existing
   "created" copy. Add a short helper note under the form that new listings are published after a
   review. (Pre-backend the response is `active` → old toast; post-backend → moderation toast. No
   code change needed when the backend lands.)
2. **Edit form**: re-frame the `active` boolean toggle as a publish/withdraw control where
   `published = status !== 'closed'` (both `active` and `moderation` read as "published/pending").
   On submit:
   - toggle turned **off** (was published) → send `status: 'closed'`.
   - toggle turned **on** (was closed) → send `status: 'moderation'` (re-submit).
   - toggle unchanged → do **not** send `status` (lets the backend re-moderate on content edit).
   Add a helper note that publishing / editing sends the listing to moderation.
3. **List & filter:** already render `moderation` (Label color `warning`, status filter includes it
   via `CLASSIFIED_STATUSES`). No change needed — verify only.
4. **Showcase / search:** unchanged (`active`-only).

## Testing

- **E2E** (`e2e/classifieds.spec.ts`): a breeder-created listing — read its `status`; the full
  moderation assertions (visible in `/mine`, hidden from public `/classifieds`, admin approve →
  `active` → appears in public, reject → `closed`) run only when the backend gate is live. To keep
  the suite green before the backend lands, the moderation-specific test self-skips when a fresh
  create still returns `active` (`test.skip(status !== 'moderation', …)`). It auto-activates once the
  backend change is deployed.
- **Backend** (in the handoff prompt): unit/integration on the new create default, the transition
  map, and re-moderation on update.

## Out of scope

- Notifications to the author on approve/reject (separate feature).
- Rejection-reason surfacing in the author UI (reason is stored in `moderation_logs` only).
- Per-field re-moderation (we chose "any edit re-moderates an active listing").
