# UI work record and focused file map

## Completed on 28 October 2026

The account, form and request workflows now use dedicated pages. The request list and form management use responsive tables with row actions; the request list paginates at 10 items and supports row navigation and eligible inline review. The form creation flow supports validated JSON upload or a blank/template starting point. Shared field spacing and admin dialog behavior remain centralized.

## Scope
2. Use the Manage users table treatment (white rounded bordered container, sage header, consistent cell padding/dividers, row hover, right-aligned actions) for **All requests** and **Manage forms**.
3. Keep this map as the starting point for follow-up Codex work. Read listed files first; expand only when a dependency requires it.

## Focused file map

| Concern | Start here | Related files |
| --- | --- | --- |
| App view and modal lifecycle | `src/app/App.tsx` | `src/app/useAppSession.ts`, `src/components/ui/Modal.tsx` |
| Change password form and copy | `src/features/auth/AuthScreen.tsx` | `src/pages/auth/AuthPage.tsx`, `src/features/auth/api.ts`, `src/features/auth/copy.ts` |
| Manage users table reference | `src/features/admin/UsersTable.tsx` | `src/features/admin/UsersPanel.tsx` |
| All requests table | `src/features/requests/components/RequestList.tsx` | `src/pages/requests/RequestsPage.tsx`, `src/i18n/en.ts`, `src/i18n/vi.ts` |
| Manage forms table | `src/features/admin/FormsPanel.tsx` | `src/features/admin/FormDraftEditor.tsx`, `src/features/forms/copy.ts` |
| Shared UI styles | `src/components/ui/field.css` | `src/styles/index.css`, `src/components/ui/Button.tsx` |

## Verification

Browser coverage lives in `e2e/forms.spec.ts`, `e2e/form-upload.spec.ts`, `e2e/request-errors.spec.ts`, and `e2e/request-review.spec.ts`. The last recorded run is documented in [handoff.md](handoff.md).
