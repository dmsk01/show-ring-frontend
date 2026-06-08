# Backend task: delete a dog photo

Repo: `E:\Coding\python-animal-platform` (FastAPI). Frontend wiring is already
done and calls this endpoint; only the backend implementation is missing.

## Why
Editing a dog (frontend) lets the user attach photos (`POST /dogs/{id}/images`)
but there is **no way to detach one**. We need a per-photo delete so users can
remove a wrong/outdated photo when editing.

## Endpoint
```
DELETE /dogs/{dog_id}/images/{file_id}
```
- Path params: `dog_id: UUID`, `file_id: UUID` (the file currently linked, i.e.
  a `dog_photos.file_id`).
- Response: **200 `DogResponse`** (the updated dog, so the client gets fresh
  `avatar_file_id` / `photo_file_ids`). 204 No Content is also acceptable — the
  frontend re-fetches the dog afterwards either way.

## Auth (mirror `add_dog_images`)
Owner of the dog's kennel **or** admin. Dog without a kennel → admin only
(there is no direct `dog → user` FK). Reuse `svc._check_kennel_owner`.

## Behaviour
1. Load dog; `not_found` → 404.
2. Authorize as above; `forbidden` → 403.
3. Find the `DogPhoto` row for `(dog_id, file_id)`. If none → 404
   (`image_not_found` / reuse `not_found`).
4. Delete that `DogPhoto` row (detach the link). **Do not** delete the dog or
   other photos.
5. **Re-primary:** if the removed row had `is_primary = True` and other photos
   remain, promote the remaining photo with the lowest `position` to
   `is_primary = True`, so `avatar_file_id` stays valid.
6. Commit and return the updated dog via `_dog_response(dog, list_dog_photos(...))`.

The underlying `files` row / object storage can be left as-is for now
(detach only). Deleting the actual file is out of scope (optional follow-up;
note that `dog_photos.file_id` is `ON DELETE CASCADE`, so deleting the file row
would also drop the link).

## Suggested implementation
- `repositories/dog.py`: add
  ```python
  async def get_dog_photo(db, dog_id, file_id) -> DogPhoto | None: ...
  async def delete_dog_photo(db, photo: DogPhoto) -> None: ...   # db.delete + flush
  ```
- `services/dog.py`: add `delete_image(db, *, dog_id, file_id, requester_id, is_admin) -> Dog`
  doing steps 1–5 above (same ownership block as `add_images`).
- `routers/dogs.py`: add the `DELETE` route, map errors through the existing
  `_raise_for_error`.

## Acceptance
- Owner/admin can delete a photo; non-owner gets 403; unknown dog/file → 404.
- Deleting the primary photo promotes another to primary (avatar not broken).
- `GET /dogs/{id}` no longer lists the removed `file_id` in `photo_file_ids`
  (nor as `avatar_file_id`).

## Frontend contract already implemented (for reference)
- `src/lib/axios.ts`: `endpoints.dog.image(id, fileId)` → `/dogs/{id}/images/{fileId}`.
- `src/actions/dog.ts`: `deleteDogImage(dogId, fileId)` → `axios.delete(...)`,
  then SWR-revalidates the dog detail + list.
- `src/sections/dog/dog-create-edit-form.tsx`: each existing photo has a delete
  button → ConfirmDialog → `deleteDogImage`.
