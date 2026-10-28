# UI work plan and focused file map

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
Run the focused lint/build checks after edits. Add or run tests only when explicitly requested.
