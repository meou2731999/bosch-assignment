# Roadmap nền tảng Request Desk

Cập nhật 28/10/2026. **G0–G9 là kế hoạch, chưa triển khai.** Baseline local và nghiệm thu: [handoff](handoff.md). Hành vi đang có: [architecture](architecture.md).

## Hướng đã chọn và trade-off

- Schema nội bộ và React renderer làm engine chính; giữ Form.io cho legacy. Đổi lại phải tự duy trì semantics, validation và compatibility.
- PostgreSQL, S3-compatible storage và OIDC, không dựa vào backend sản phẩm có sẵn. Cần migration, backup và vận hành riêng.
- Tenant độc lập từ lần triển khai đầu; isolation là điều kiện phát hành, không hoãn sang giai đoạn sau.
- Modular monolith Express/React và worker riêng; PostgreSQL lưu sessions/jobs/outbox. Chỉ bổ sung broker/Redis/microservices khi có số đo và nhu cầu.

Còn cần chốt: OIDC/S3/scanner/email provider, deployment/region, phân loại dữ liệu, retention, routing/SLA, tải mục tiêu và RPO/RTO. Mock/local adapter không thay nghiệm thu provider thật.

## Nguyên tắc xuyên suốt

Published schema bất biến, request pin version; phân biệt schema-format/evaluator/workflow/config version. Không sửa lịch sử để ép engine mới. Server quyết định identity, tenant, quyền, validation, derived values và transition. Không arbitrary JavaScript trong schema.

Tenant context phải đến từ membership xác thực. Constraints/foreign keys có tenant scope; application policy kết hợp RLS với app role không bypass. Operator/migration roles tách riêng; tenant context theo transaction không rò qua connection pool. Worker cũng kiểm tra tenant. Tenant admin không có quyền ngoài tenant; platform support đọc nội dung phải có quyền riêng, lý do và audit.

Request, snapshot, audit và outbox ghi cùng transaction; concurrency dùng conditional update theo tenant/id/revision. File/object store cần reconciliation riêng. Không xóa file còn snapshot/reference/legal hold, trừ quy trình erasure được phê duyệt và lưu dấu vết.

## G0 — Baseline và contracts

Chạy check/E2E, ghi commit/môi trường/kết quả mới; tạo synthetic fixtures cho legacy/basic/nested forms, hidden data, invalid drafts, upgrade/restore và file lịch sử thiếu bytes. Chốt schema envelope, lifecycle/error/policy contracts, compatibility matrix, tenant threat model và migration manifest; ghi semantics cũ về required/trimming/date/number/hidden values.

**Gate:** có baseline tái lập và fixture cho các hành vi quan trọng; không sửa dữ liệu thật để tạo evidence.

## G1 — Engine custom form thống nhất

Sau G0: canonical schema gồm format/evaluator version, field identity, layout/input/data type, rules và data policy. Mọi custom field dùng React; Form.io giữ engine/profile riêng cho legacy. Adapter đọc published version cũ mà không ghi đè bytes/hash; đổi semantics phải preview/confirm. Thống nhất error paths, focus/touched/read-only, locale và nested row behavior. Import/export kiểm tra capabilities; export Form.io phải báo/từ chối semantics không ánh xạ được. Giữ raw hidden input khi edit, cảnh báo tác động save và bảo toàn policy lịch sử.

**Gate:** thêm rule không đổi renderer; UI/API cùng normalized data/errors; legacy/reopen/upgrade/restore vẫn pass; unsupported semantics bị chặn.

## G2 — PostgreSQL và tenant isolation

Sau G0/G1: repository async và transaction boundaries, migrations, tenant constraints/RLS, hai tenant synthetic. Tách snapshot khỏi list; cursor pagination với sort ổn định/id tie-breaker, filter allowlist và indexes. Session/throttling dùng shared storage. Import JSON có dry-run, backup, explicit tenant mapping, checksum/counts; giữ IDs/timestamps/revisions/audit/references, chạy lại an toàn và báo dữ liệu corrupt/thiếu.

**Gate:** hai API instance tranh cùng revision chỉ một thành công; restart giữ session; lỗi giữa transaction không lệch record/snapshot/audit/outbox. API, SQL app role và worker không đọc/ghi/liên kết chéo tenant; list không trả toàn bộ history.

## G3 — OIDC và policy thống nhất

Sau G2: OIDC Authorization Code + PKCE bằng thư viện duy trì, kiểm tra state/nonce/issuer/audience/signature/redirect. Identity dùng issuer + subject, không tự merge bằng email. Membership, groups và grants theo tenant; tenant selection không cấp quyền. Dùng một policy cho list/detail/history/export/files/lookups/jobs; tách quản trị khỏi quyền đọc nội dung. Thu hồi quyền khi đổi membership/role, chốt TTL/cache; group mapping chỉ tin issuer được cấu hình. Local password chỉ cho dev/recovery có kiểm soát.

**Gate:** giả tenant/token claims không vượt quyền; remove membership chặn session/download mới; có local contract test và provider smoke test trước pilot.

## G4 — Publication có kiểm soát

Sau G1–G3: tách save/validate/publish/approve/activate. Activation theo tenant/form/environment có revision/audit; rollback chỉ đổi active pointer, không đổi request đã pin. Author/publisher separation; sửa nội dung hủy approval. Preview impact, archive form và promotion package có checksum/dependencies/mapping, không mang credentials/data thật.

**Gate:** publish chưa làm đổi catalog; concurrent activation conflict; rollback giữ lịch sử; promotion sai tenant/dependency bị từ chối.

## G5 — Rules và data sources

Sau G1/G3/G4: typed AST cho calculations, conditional required/read-only, cross-field/date/number/collection rules và root/row/parent scope. Detect cycle/dangling reference/type mismatch, deterministic evaluation và execution budget; chốt empty/null/timezone/rounding/hidden interactions, pin evaluator. Server tính derived values và validate lookup IDs. Remote/cascading lookup qua connector allowlist có SSRF controls, tenant credentials/cache, timeout/cancel/pagination và reset dependencies; snapshot historical labels, xử lý option mất quyền/bị xóa.

**Gate:** UI/API cùng semantics; cycle và giả derived values bị chặn; stale lookup không ghi đè; không chia credential/cache chéo tenant.

## G6 — Workflow nhiều cấp và correction

Sau G2–G5: pin workflow definition vào run; sequential/parallel/all/any/quorum, routing theo tenant/group, assignment/claim/reassignment/delegation có hạn và chống self-review. `changes_requested` cho sửa/resubmit, còn `rejected` là final; có thể tạo request mới liên kết nguồn theo policy. Giữ submission/review-round snapshots; chốt approval reset khi sửa và bước quay lại. SLA/reminder/escalation dùng durable scheduler theo timezone/calendar; withdrawal/cancel có policy và audit.

**Gate:** resubmit giữ lịch sử; tranh task không tạo hai quyết định; đúng quorum; delegation hết hạn mất quyền; đổi workflow không đổi run cũ; restart không mất deadline.

## G7 — Actions và notifications tin cậy

Sau G2/G3/G6: events/outbox cùng business transaction; worker có lease, backoff/jitter, retry limit, dead-letter và replay có quyền/audit. At-least-once delivery với stable idempotency key, tenant dedupe và downstream idempotency/reconciliation; không hứa exactly-once. Webhook có versioned config/payload, chữ ký, secret rotation, timeout/egress allowlist; notification có recipient policy, localization và dedupe. Có adapter mẫu, delivery status và unknown-outcome recovery.

**Gate:** crash sau commit vẫn gửi; crash sau downstream success không nhân đôi với downstream hỗ trợ idempotency; outage phục hồi; replay/notification không vượt tenant/quyền.

## G8 — Files và audit vận hành

Sau G2/G3/G7: S3 objects dùng immutable identity/version/checksum, metadata authoritative trong DB. Upload pending/quarantine/scan/clean/rejected; chỉ clean được download/submit, scanner lỗi không cho qua. Signed URL ngắn hạn sau policy check; finalize xác minh object/version/hash, tránh overwrite sau scan. Durable reconciliation/orphan cleanup; retention xét current/snapshot references và legal hold. Migrate bytes có manifest/hash/dry-run, không tạo bytes giả. Audit append-only bằng app role, xuất sink độc lập, redact secrets và hạn chế log submission; không tuyên bố chống mọi DBA sửa đổi.

**Gate:** không cross-tenant download; scan fail có recovery; restore còn đúng bytes; GC không xóa file đang tham chiếu; audit export retry an toàn.

## G9 — UX, vận hành và pilot

Sau G1–G8: accessibility/error focus/EN-VI, conflict compare/reapply, pagination và lazy-load legacy/authoring/history. Giữ manual save; autosave/offline là scope riêng. Logs/correlation/metrics cho API, DB, worker/scan, không dùng sensitive labels. Readiness/liveness, shutdown, quotas, secret rotation, dependency/license review và expand/contract migrations. CI với DB/storage/OIDC thật trong môi trường test; thêm Firefox/WebKit/accessibility và tách provider smoke tests. Load test nhiều instance/worker với dataset/concurrency/p95/error budget chốt trước. UAT có tenant roles, provider outage, revocation, migration và backup/restore drill.

**Gate:** có số đo và owner ký đúng build; không pilot nếu tenant isolation, migration verification, scan hoặc restore drill thất bại. Local pass không thay hosted CI/provider/UAT.

## Cutover và rollback

1. Backup nguồn read-only và manifest; dry-run trên synthetic/staging, chốt mapping tenant.
2. Deploy code tương thích; import DB giữ references, import bytes rồi reconcile checksum/counts/orphans và historical rendering/quyền.
3. Chặn ghi trong maintenance window, import final/delta rồi verify trước đổi traffic; không dual-write JSON/DB thiếu protocol.
4. Trước write mới có thể quay về nguồn cũ. Sau write mới chỉ rollback về app tương thích DB hoặc migration ngược/restore đã thử; không trỏ về JSON cũ làm mất dữ liệu.
5. Theo dõi conflict/outbox/scan/audit; giữ backup theo policy.

## Ước lượng, ownership và cách chia việc

Estimate cũ **4 tuần / 46 person-days** chỉ dành cho tích hợp vào sản phẩm đã có backend: discovery 5, React 10, identity/storage/files/workflow 10, QA/UAT 8, leadership 5, contingency 8. Đây không phải estimate G0–G9. Chưa cam kết ngày giao; estimate G0 rồi từng stage theo contract/provider/tải/UAT thực tế.

Solution engineer giữ boundaries/evidence; frontend sở hữu authoring/rendering; backend sở hữu policy/transactions/delivery; QA kiểm tra regression/recovery; business owner nghiệm thu. Junior nhận task UI bounded với acceptance criteria, pairing trước phần integration. Chia PR theo contract, backend, UI, migration và evidence; stage phải được review trước khi tiếp tục.

M1 = G0–G1; M2 = G2–G4; M3 = G5–G7; M4 = G8–G9. Chỉ M4 mới xét production pilot. Mỗi thay đổi chạy focused checks phù hợp; thay shared renderer/policy cần browser regression, database/workers cần integration tests thực. Chỉ ghi completed khi đạt gate và có evidence.
