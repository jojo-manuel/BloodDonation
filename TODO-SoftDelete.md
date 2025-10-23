ye# TODO: Implement User Profile Soft Delete

## Tasks
- [x] Update auth middleware to block soft-deleted users
- [x] Update frontend UserProfile.jsx to reflect soft delete behavior
- [ ] Test the soft delete functionality

## Details
- Backend already has `isDeleted` field and `deleteMe` controller sets it to true
- Auth middleware needs to check `isDeleted` and deny access
- Frontend needs to change confirmation message and post-delete behavior
