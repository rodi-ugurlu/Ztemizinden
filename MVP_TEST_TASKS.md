# MVP Test Task List

## Customer Flow Findings

- [ ] Ticket creation asset dropdown: review why the location row/value `Istanbul / Tuzla` appears in the asset selection flow. It may be coming from the selected asset `location`, but the UI should make it clear that this is a location, not another asset.
- [ ] Ticket media upload: uploading media while creating a ticket returns API 404. Check the frontend upload call to `/uploads/ticket-media`, backend `POST /api/uploads/ticket-media`, API base URL handling, and security/proxy routing.
- [x] Service registration must require at least one provider document on both frontend and backend before accepting an application.
- [x] Service pending/verification errors should use polished UI copy and screens instead of raw backend messages like `Service provider is not verified`.
- [ ] General API error presentation should be made more user-friendly across auth, service, customer, and admin flows.
