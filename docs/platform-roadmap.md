# Roadmap nâng cấp Request Desk

Ngày: 27/10/2026. Trạng thái: kế hoạch, chưa triển khai các giai đoạn bên dưới.

## Mục tiêu và quyết định đã chốt

Khắc phục toàn bộ nhóm hạn chế trong review: schema/renderer, lưu trữ, publication, workflow, rules, integration, IAM, file/audit và khả năng vận hành. Đích đến là nền tảng form và request workflow standalone hỗ trợ nhiều tenant ngay từ lần triển khai đầu. Đây là phạm vi mở rộng sau prototype, không phải tuyên bố tương đương toàn bộ sản phẩm Form.io.

Người dùng đã chọn:

- Schema nội bộ và React renderer là engine chính. Form.io chỉ duy trì tương thích legacy.
- PostgreSQL, object storage tương thích S3 và OIDC; không phụ thuộc backend sản phẩm có sẵn.
- Nhiều tenant độc lập từ đầu, không hoãn tenant isolation đến giai đoạn sau.

Tổ chức thành modular monolith Express/React và worker riêng dùng chung domain packages. Chưa cần microservices, Redis hoặc message broker riêng: dùng PostgreSQL cho session, job/outbox và phối hợp nhiều instance ở mức tải pilot; đo tải trước khi bổ sung hạ tầng.

Trade-off đã chấp nhận: tự sở hữu schema giúp kiểm soát hành vi và tránh phụ thuộc license engine nhưng phải duy trì renderer/rules/migration; PostgreSQL cung cấp transaction và truy vấn quan hệ nhưng cần migration/backup/vận hành; multitenancy tăng đáng kể phạm vi kiểm thử và phân quyền.

Các lựa chọn còn cần xác nhận tại giai đoạn liên quan: nhà cung cấp OIDC, nhà cung cấp S3 và scanner, email provider, region/deployment target, phân loại dữ liệu và thời hạn lưu giữ, quy tắc routing/SLA, tải mục tiêu và RPO/RTO. Có thể hoàn thiện adapter và môi trường local trước; không coi mock là tích hợp thật đã nghiệm thu.

## Những nguyên tắc phải giữ

- Published schema bất biến; request pin form version. Không sửa lịch sử để ép tương thích engine mới.
- Revision kiểm tra tại database; request, snapshot, audit và outbox cùng transaction khi có thay đổi nghiệp vụ.
- Server là nơi quyết định identity, tenant, quyền, transition, validation và calculated values; không tin dữ liệu dẫn xuất từ client.
- Mọi entity nghiệp vụ thuộc tenant. Tenant context phải xuất phát từ membership đã xác thực; route/header lựa chọn tenant chỉ là đầu vào cần kiểm tra.
- Tenant admin chỉ quản trị trong tenant; platform operator không mặc định được đọc nội dung request. Truy cập hỗ trợ đặc biệt phải có quyền riêng, lý do và audit.
- Không arbitrary JavaScript trong schema mới. Expressions có kiểu, giới hạn độ sâu/chi phí và evaluator dùng chung.
- Không xóa dữ liệu/file còn được snapshot tham chiếu, trừ quy trình retention/erasure được phê duyệt có dấu vết rõ ràng.
- Phân biệt version dữ liệu/schema với version ngôn ngữ schema, evaluator, workflow và cấu hình integration.
- Mỗi giai đoạn có PR/commit theo feature, kiểm tra và review trước khi tiếp tục theo cơ chế staged implementation hiện tại. Chưa tự triển khai production.

## Kiến trúc đích

- Frontend: app shell, form authoring, React renderer, workflow inbox, tenant administration. Legacy Form.io được lazy-load qua adapter riêng.
- Shared domain: schema parser/compiler, evaluator, normalization/validation, migration diff và contract types.
- API: authenticated tenant context, policy, form lifecycle, request commands/queries, files, audit và admin endpoints.
- PostgreSQL: tenants, identities, memberships, groups, grants, forms/versions/activations, requests/revisions, workflow definitions/runs/tasks, attachments/references, sessions, audit, outbox/jobs/delivery attempts.
- Worker: integration delivery, notifications, malware scan coordination, SLA schedules và retention/reconciliation.
- Infrastructure adapters: OIDC, S3-compatible storage, scanner, email/webhooks và telemetry sink.

Các bảng con dùng foreign key/unique constraint có tenant scope để không liên kết chéo tenant. Application policy kết hợp PostgreSQL row-level security; app role không được bypass RLS. Migration/operator roles tách riêng. Tenant context được thiết lập theo transaction, không rò qua connection pool; worker cũng phải thiết lập context xác thực cho từng job.

## Thứ tự và tiêu chí hoàn thành

### G0 — Baseline, contracts và bộ dữ liệu migration

Phụ thuộc: không. Mục tiêu: có baseline đáng tin trước khi thay engine/hạ tầng.

- Chạy lại check/E2E hiện tại, ghi commit, môi trường, số test thực tế; không sao chép các số cũ trong README/verification.
- Thu thập fixture synthetic cho legacy v1/v2, basic/custom/nested forms, hidden fields, invalid drafts, upgrades/restores, rejected/submitted requests và attachment lịch sử thiếu bytes.
- Viết ADR cho ba quyết định đã chốt; thêm threat model tenant boundary và compatibility matrix.
- Chốt canonical schema envelope, policy contract, trạng thái lifecycle, API error contract và migration manifest.
- Ghi rõ legacy cần gì để tái hiện validation cũ; đặc biệt trimming, required, hidden-value clearing và date/number semantics.

Nghiệm thu: baseline có kết quả chạy mới; fixture bao phủ các hành vi quan trọng; mọi hạn chế review có giai đoạn chịu trách nhiệm bên dưới. Không dùng dữ liệu thực hoặc sửa `.data` để tạo fixture.

### G1 — Một contract schema, một renderer cho custom forms

Phụ thuộc: G0.

- Canonical schema có `schemaFormatVersion`, field identity, layout/input/data type, validation, visibility, data policy và evaluator version; tài liệu hóa rõ ý nghĩa từng thuộc tính.
- Mọi custom form, kể cả basic fields, đi qua React renderer. Không tự đổi engine khi thêm visibility hoặc array.
- Form.io giữ renderer và validation profile riêng cho legacy; xuất bản envelope rõ `engine`/compatibility, không chỉ gọi mọi schema là “Form.io-shaped”.
- Adapter chuyển các custom published version cũ sang runtime model mà không ghi đè published bytes/hash. Pin semantics cũ bằng compatibility version; migration sang semantics mới phải có preview/confirm.
- Đồng nhất error path, touched/submitted state, focus lỗi đầu tiên, read-only, locale, nested row errors và form handle.
- Export/import canonical schema có version và capability checks. Nếu cung cấp export Form.io, phải báo rõ feature không ánh xạ được hoặc từ chối; không silently mất visibility.
- Định nghĩa hidden-data policy: giữ raw input trong phiên chỉnh sửa, hiển thị cảnh báo trước save làm mất dữ liệu; persisted behavior của version cũ không đổi. Permission không dựa vào visibility.

Nghiệm thu: form basic thêm rule không đổi renderer; browser/API cho cùng normalized data và errors; reopen/read-only EN/VI nhất quán; legacy và upgrade/restore vẫn pass. Unsupported semantics bị chặn trước publish/import.

### G2 — PostgreSQL và nền móng multitenancy

Phụ thuộc: G0/G1 contracts ổn định. Hoàn thiện trước mọi pilot.

- Repository/transaction interfaces thay local store; chuyển service sang async với transaction boundary rõ ràng.
- Database migrations cho toàn bộ core entities, tenant-scoped constraints, RLS và restricted application roles. Seed ít nhất hai tenant synthetic để kiểm tra isolation.
- Conditional update theo tenant + id + revision; nếu không match trả conflict. Request/snapshot/audit/outbox ghi atomically, không read-check-write ngoài transaction.
- Snapshot tách bảng, chỉ tải khi cần. Query list có cursor pagination, sort ổn định với id tie-breaker, filter/search allowlist và index theo tenant/status/owner/update time.
- Shared session, expiry/revocation và login throttling trong storage dùng được nhiều process. Không dùng Map cho production.
- Import tool JSON → DB: dry-run, manifest/checksum/counts, id mapping, source backup, explicit mapping dữ liệu cũ vào tenant được chọn. Không tự nhân bản dữ liệu sang mọi tenant.
- Re-run migration an toàn; giữ ID, timestamps, version/revision, audit, snapshot và file references. Ghi báo cáo dữ liệu thiếu/corrupt thay vì bỏ qua.

Nghiệm thu: hai API instance cập nhật cùng revision chỉ một bên thành công; restart không mất session; lỗi giữa transaction không để record/snapshot/audit lệch nhau. API, SQL bằng app role và worker không đọc/ghi/cross-reference tenant khác. Pagination không trả toàn bộ payload/history.

### G3 — OIDC, tenant membership và policy thống nhất

Phụ thuộc: G2.

- OIDC Authorization Code + PKCE, kiểm tra state/nonce/issuer/audience/signature/redirect; dùng thư viện được duy trì, không tự viết protocol validation. Session cookie phía server và CSRF tiếp tục áp dụng.
- Identity theo issuer + subject; email không là bằng chứng tự động merge account/membership. Cấu hình issuer và enrollment/invitation policy cho từng tenant.
- Một identity có nhiều membership; switch tenant phải kiểm tra lại membership. Tenant selection không cấp quyền.
- Groups/departments, scoped roles/grants: form author, publisher, requester, reviewer, auditor, tenant admin; tách quản trị account khỏi quyền đọc nội dung.
- Policy service dùng chung cho list/detail/history/export/files/lookup/jobs. Không để list API hoặc direct attachment URL đi ngoài policy.
- UI tenant switcher, membership/group administration và permission explanation. OIDC group mapping chỉ lấy từ issuer được tin cậy và map trong đúng tenant.
- Revocation khi disable account/remove membership/change role; quyết định TTL/cache/revalidation rõ ràng. Local password login chỉ dùng môi trường dev hoặc cơ chế recovery được cấu hình riêng.

Nghiệm thu: hai tenant có cùng tên form/group không lẫn dữ liệu; giả tenant ID/token claims không vượt quyền; remove membership chặn cả session còn sống và download mới. Contract test local OIDC provider và smoke test provider thật trước pilot.

### G4 — Form publication có kiểm soát

Phụ thuộc: G1–G3.

- Tách save draft, validate, publish immutable version, approve release và activate. Published không tự trở thành active.
- Activation theo tenant + form + environment, có revision và audit; rollback chỉ đổi pointer về bản hợp lệ, không đổi request đã pin.
- Preview schema/data impact: fields removed, type/options/rules changed, draft bị ảnh hưởng; không âm thầm migrate draft.
- Author/publisher separation và approval policy cấu hình theo tenant; hủy hiệu lực approval nếu nội dung thay đổi.
- Promotion package dev → staging → production có checksum, dependency manifest và tenant/environment mapping; không mang credentials hoặc production data trong package.
- Archive form để ngừng tạo request mới nhưng giữ đọc và workflow lịch sử; quản lý các bản không còn active.

Nghiệm thu: publish không ảnh hưởng new-request catalog cho tới activate; concurrent activate trả conflict; rollback làm request mới dùng bản cũ nhưng bản đã lưu không đổi; promotion sai tenant/dependency bị từ chối.

### G5 — Rules, calculated values và data sources

Phụ thuộc: G1/G3/G4.

- Typed expression AST cho calculated values, conditional required/read-only, cross-field comparison, date/number/string/collection operators và root/row/parent references.
- Dependency graph: phát hiện vòng lặp/dangling reference/type mismatch khi authoring/publish; deterministic evaluation order và execution budget.
- Định nghĩa missing/null/empty, timezone/date, decimal rounding, row deletion và hidden-field interaction. Pin evaluator version; không để cùng schema đổi nghĩa sau deploy.
- Server tự tính derived values; read-only field được giữ/lấy từ nguồn có thẩm quyền, không tin client submit value.
- Remote lookup/cascading select qua server connector allowlist: tenant credentials, SSRF controls, timeout/cancel, pagination, cache có tenant scope, dependency reset, loading/error UX.
- Validate selected ID trên server; quy định historical label/reference snapshot và xử lý lựa chọn bị xóa/đổi quyền. Lookup availability không sửa lịch sử request.
- Builder dùng controls có kiểu, preview và diagnostics; không yêu cầu business author nhập arbitrary JS.

Nghiệm thu: frontend/backend cùng kết quả cho cùng context; cycle bị chặn; giả calculated value bị bỏ qua hoặc từ chối; stale lookup response không ghi đè lựa chọn mới; tenant không dùng credential/cache tenant khác.

### G6 — Workflow cấu hình được, correction và nhiều cấp duyệt

Phụ thuộc: G2–G5.

- State machine server-side: draft → submitted → in_review → approved/rejected; bổ sung changes_requested → chỉnh sửa → resubmit. `rejected` là quyết định cuối; yêu cầu bổ sung dùng action riêng để không nhập nhằng lịch sử.
- Request đã rejected có thể tạo request mới liên kết nguồn theo policy; không tự mở khóa quyết định cũ. Submitted payload/review rounds giữ snapshot bất biến.
- Versioned workflow definition pin vào run: sequential/parallel steps, all/any/quorum được định nghĩa rõ, routing theo tenant/group và dữ liệu đã validate; form version tham chiếu workflow version.
- Task assignment/claim, reassignment, delegation có hạn, chống self-review và kiểm tra quyền tại thời điểm quyết định. Xử lý người duyệt bị disable/rời tenant.
- Chốt quy tắc reset approval khi sửa data và cách resubmit quay về bước nào. Giữ form version trừ khi người dùng đi qua explicit upgrade được phép.
- SLA/due date/reminder/escalation theo timezone/calendar cấu hình; durable scheduler, không setTimeout trong process. Withdrawal/cancel có transition policy rõ.
- Inbox cho assigned/unassigned/overdue, timeline và lý do cho mọi transition.

Nghiệm thu: bổ sung hồ sơ và gửi lại giữ lịch sử; hai reviewer tranh cùng task không tạo hai final decisions; parallel completion không vượt quorum; delegate hết hạn mất quyền; workflow mới không thay run cũ; scheduler restart không mất deadline.

### G7 — Reliable actions, notifications và integration

Phụ thuộc: G2/G3/G6. Cấu trúc outbox đã có từ G2.

- Domain events cho submit, resubmit, review, activation, assignment/SLA; outbox ghi trong cùng transaction với business state.
- Worker claim có lease, retry/backoff/jitter, giới hạn attempt, dead-letter và replay có quyền/audit. Delivery là at-least-once, không hứa exactly-once.
- Stable event/delivery idempotency key, tenant-scoped dedupe; downstream phải nhận idempotency key hoặc có reconciliation adapter. Không thể đảm bảo không duplicate ở downstream tùy ý.
- Tenant-scoped webhook configuration, secret reference/rotation, payload versioning/signature, timeout/egress allowlist và giới hạn dữ liệu gửi ra ngoài. Pin action config version cho event, lấy credential hiện hành theo secret reference.
- Email/in-app notification, recipient policy, template/localization, dedupe và preferences. Giao diện xem trạng thái delivery/retry, không lộ secrets/payload nhạy cảm.
- Một integration adapter mẫu với contract tests và sandbox thật khi có endpoint; unknown-outcome recovery và external reference tracking.

Nghiệm thu: crash sau commit vẫn dispatch; crash sau downstream success trước ack không nhân đôi với downstream hỗ trợ idempotency; outage có retry/dead-letter; replay sai tenant bị chặn; notification không gửi đến người đã mất quyền theo policy.

### G8 — File lifecycle và audit vận hành

Phụ thuộc: G2/G3/G7.

- S3-compatible adapter, tenant-scoped object identity/authorization, unique immutable keys, checksums và metadata authoritative trong DB. Không giả định chỉ prefix là đủ isolation.
- Upload states pending → quarantined/scanning → clean/rejected; chỉ clean được preview/download/submit. Scanner fail/unavailable không cho qua.
- Upload/download signed URL ngắn hạn sau kiểm tra quyền; finalize xác minh object/version/checksum. Chống overwrite sau scan bằng immutable object version hoặc server-controlled copy vào vùng clean.
- Scan/reconciliation jobs bền vững vì DB và object store không có transaction chung; orphan multipart/object cleanup và retry không mất file.
- Attachment references gồm current request và snapshots; detach chỉ bỏ reference hiện hành. Retention job xét mọi reference, legal hold, trạng thái request và tenant policy trước xóa.
- Migration local files có dry-run/hash verification và báo legacy metadata không có bytes; không tạo bytes giả. Rollback có manifest.
- Append-only audit với app role không có update/delete; export sang sink độc lập theo retention policy. Không gọi DB append-only là chống mọi DBA can thiệp.
- Audit gồm auth/membership/grants, reads/downloads, schema releases, transitions, integration replay và privileged access; redact secrets và tránh log full submission mặc định.

Nghiệm thu: cross-tenant download bị chặn; file chưa clean không được submit; scanner lỗi có recovery; restore snapshot vẫn lấy đúng bytes; GC không xóa file còn tham chiếu; audit export retry được và không lộ secrets.

### G9 — UX, hiệu năng, vận hành và phát hành

Phụ thuộc: G1–G8. Chỉ giai đoạn này mới nghiệm thu khả năng triển khai nhiều tenant.

- Error summary/focus/link tới nested field, keyboard/screen-reader, EN/VI bao gồm lỗi kỹ thuật phổ biến, lịch sử/preview rõ tác động mất dữ liệu.
- Conflict UX giữ bản đang nhập và cho so sánh/reapply có xác nhận thay vì chỉ reload làm mất công. Giữ manual save; autosave/offline là scope riêng nếu được yêu cầu.
- Query UI dùng server pagination/filter/search; lazy-load legacy Form.io và các phần authoring/history lớn. Không tải snapshots/full submission trên list.
- Structured logs, correlation IDs, metrics/traces cho API latency/error/conflict, DB pool, worker lag/retry, scan backlog và tenant throttling. Không dùng dữ liệu nhạy cảm làm metric labels.
- Readiness/liveness, graceful shutdown, backup/restore drill DB + objects, migration rollout theo expand/contract, dependency/license review, secret rotation và per-tenant quotas.
- CI dùng PostgreSQL/object storage/OIDC test environment; thêm Firefox/WebKit và accessibility checks vào journeys quan trọng. Tách deterministic tests khỏi external-provider smoke tests.
- Load test nhiều API instance và worker; workload gồm forms lớn trong budget, history dài, nhiều tenant, upload/scan/lookup và contention. Chốt trước dataset, concurrency, p95/error budget và môi trường; ghi kết quả đo, không tự tuyên bố đạt tải.
- UAT với tenant admin/author/requester/reviewer/auditor; tập diễn migration/rollback, provider outage, membership revocation và tenant isolation. Chốt RPO/RTO/retention với owner trước production.
- Cập nhật README, architecture, decisions, authentication, draft-upgrades, runbook, proposal Markdown/PDF và verification bằng bằng chứng mới.

Nghiệm thu: các mục trên có evidence và người nghiệm thu; local pass không thay hosted CI/provider smoke/UAT. Không phát hành nếu tenant isolation, migration verification, scan gate hoặc restore drill thất bại.

## Migration, cutover và rollback

1. Tạo bản sao nguồn read-only và manifest; chạy dry-run trên synthetic/staging. Chốt tenant đích cho từng legacy identity/form/request/file.
2. Deploy phiên bản tương thích schema cũ/mới. Import DB giữ các tham chiếu; import bytes riêng và reconcile trước mở traffic.
3. Kiểm tra counts/checksums/orphans, sample historical rendering và quyền dưới hai tenant. Giữ compatibility engine cho published versions cũ.
4. Trong maintenance window chặn ghi nguồn, import delta hoặc import final snapshot rồi verify; đổi traffic sang DB/object store. Không dual-write ngây thơ vào JSON và DB.
5. Trước khi có write mới, có thể quay về nguồn cũ. Sau write mới, chỉ rollback application về phiên bản tương thích DB hoặc dùng migration ngược/restore đã thử; không trỏ lại JSON cũ làm mất dữ liệu mới.
6. Theo dõi lỗi/conflict/outbox/scan và đối chiếu audit. Giữ nguồn backup theo policy; không xóa tự động ngay sau cutover.

## Coverage của các điểm review

- Schema phân mảnh, đổi renderer, export thiếu semantics: G0/G1/G5.
- JSON storage, race nhiều instance, session RAM, list tải toàn bộ: G2/G3/G9.
- Publish đồng thời activate, thiếu rollback/promotion: G4.
- Reject không sửa/gửi lại, thiếu assignment/multi-step/delegation/SLA: G6.
- Thiếu calculated/conditional/cross-field/remote rules: G5.
- Thiếu reliable webhook/notification/external workflow: G7.
- Thiếu tenant/group boundary và admin đọc toàn bộ: G2/G3, regression xuyên G4–G9.
- File local, scan/retention/orphans và audit chưa độc lập: G8/G9.
- Khả năng phục hồi lỗi, accessibility/localization, performance và evidence cũ: G0/G9.

## Cách chia việc và kiểm chứng

Mỗi giai đoạn chia thành PR nhỏ: contract/schema; backend/policy; UI; migration/compatibility; evidence/docs theo phụ thuộc thực tế. Không merge một PR làm flow chính hỏng mà chưa có feature flag hoặc compatibility path. Không dùng số PR/commit như bằng chứng tính năng đã chạy.

Mỗi PR chạy focused domain/API tests liên quan và lint/typecheck/build; thay đổi renderer/shared policy chạy browser journeys tương ứng. Mỗi stage chạy `npm run check` và E2E cần thiết; database/isolation/workers phải dùng integration tests thực, không chỉ mock. Không lặp full suite khi không có thay đổi hay rủi ro mới.

Release gate chung: preserve history, server authority, tenant isolation, atomicity, retry recovery và evidence. Status stage chỉ đổi sang completed sau nghiệm thu; cập nhật kết quả và những điều chưa xác minh ngay dưới stage đó.

Milestones: M1 = G0–G1 engine nhất quán; M2 = G2–G4 nền tảng nhiều tenant và publication; M3 = G5–G7 rules/workflow/integration; M4 = G8–G9 file/audit và production pilot. Không triển khai pilot sau M1/M2 khi các gate M4 chưa đạt.

Chưa cam kết ngày giao: cần breakdown G0 và thông tin provider/tải/UAT để ước lượng. Phạm vi này là chương trình nâng cấp nền tảng, không phải vài bugfix; ước lượng từng stage và cập nhật sau baseline thay vì dùng estimate prototype cũ.

## Nguồn thiết kế đã đối chiếu

- [PostgreSQL transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html): concurrency và yêu cầu retry/locking theo transaction.
- [PostgreSQL row security](https://www.postgresql.org/docs/17/ddl-rowsecurity.html): lớp bảo vệ database bổ sung application policy; phải kiểm tra vai trò bypass.
- [OIDC Core](https://www.openid.net/specs/openid-connect-core-1_0.html): identity và Authorization Code flow.
- [S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html): checksum và nguy cơ overwrite cùng key; compatibility của provider khác phải kiểm chứng.
- Review source hiện tại: `shared/fields.ts`, `shared/field-definition.ts`, `src/features/forms/DynamicForm.tsx`, `server/storage/requests.ts`, `server/forms/store.ts`, `server/requests/service.ts`, `server/requests/review.ts`, `server/auth/sessions.ts`, `server/attachments/store.ts`.
