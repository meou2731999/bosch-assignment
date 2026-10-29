# Nội dung thuyết trình Request Desk

Bản ngày 28/10/2026, đi cùng presentation v6 gồm 15 slide tiếng Anh. Lời nói dưới đây bằng tiếng Việt, có thể điều chỉnh cách xưng hô. Thời lượng gợi ý: 18–20 phút trình bày, 10–15 phút demo, sau đó Q&A. Nội dung từng slide cũng được nhúng vào Speaker Notes của PowerPoint.

## Slide 01 — Request Desk (45 giây)

Em xin giới thiệu Request Desk, một ứng dụng quản lý yêu cầu bằng biểu mẫu cấu hình động. Dự án hiện có một luồng chạy được từ quản trị tài khoản và form, đến lưu nháp, gửi yêu cầu, đính kèm tài liệu và phê duyệt.

Em sẽ trình bày bài toán, cách tổ chức frontend/backend, cách bảo vệ dữ liệu khi form thay đổi, bằng chứng kiểm thử và hướng phát triển tiếp theo. Em sẽ phân biệt rõ phần đang chạy trong prototype với roadmap nền tảng standalone chưa triển khai. Toàn bộ dữ liệu demo là dữ liệu giả lập.

Nguồn code/docs: README.md, docs/proposal.md.

## Slide 02 — The customer problem (1 phút)

Bài toán xuất phát từ việc thông tin yêu cầu và trạng thái phê duyệt thường nằm rải rác trong email hoặc bảng tính. Khi thiếu thông tin, người xử lý phải hỏi lại; khi biểu mẫu thay đổi, dữ liệu cũ có thể khó giải thích.

Request Desk tập trung việc nhập thông tin, lưu nháp và xem lịch sử vào một nơi. Admin có thể thay đổi những field và rule đã được hệ thống hỗ trợ qua cấu hình, thay vì sửa từng màn hình riêng.

Giá trị cần đo là tỷ lệ hoàn tất, số lần trả lại vì thiếu thông tin và thời gian đến lần review đầu tiên. Hiện chưa có baseline hoặc kết quả đo với người dùng thật, nên em không đưa ra con số tiết kiệm thời gian. Việc chốt quy trình và người sở hữu kết quả là một phần của discovery.

Nguồn: docs/proposal.md, docs/handoff.md.

## Slide 03 — Current scope and selected direction (1 phút 15 giây)

Phạm vi đang có là một ứng dụng React/Express độc lập để chạy local. Backend có session thật, lưu JSON và lưu file thật. Admin có thể nhập một phần JSON Form.io được hỗ trợ, dùng template IT cũ hoặc tạo blank form; request được xem trong bảng có phân trang.

Hướng phát triển đã chọn là tự sở hữu schema engine bằng React, dùng PostgreSQL, OIDC và object storage tương thích S3, đồng thời hỗ trợ tenant độc lập từ lần triển khai đầu. Đây là roadmap, chưa phải trạng thái hiện tại của code.

Điểm cần nhấn mạnh là đề xuất tích hợp vào một sản phẩm có sẵn trước đây có phạm vi nhỏ hơn. Vì hướng standalone phải tự lo identity integration, dữ liệu, workflow và vận hành, estimate cũ không áp dụng nguyên vẹn. Provider, tải mục tiêu, retention và chính sách phê duyệt vẫn cần làm rõ trước khi cam kết tiến độ.

Nguồn: server/app.ts, docs/platform-roadmap.md.

## Slide 04 — The request journey (1 phút 15 giây)

Luồng bắt đầu ở admin: tạo form, xem preview, lưu draft rồi publish. Admin cấp quyền create cho requester và quyền review cho reviewer trên đúng form. Tài khoản mới phải đổi mật khẩu rồi đăng nhập lại.

Requester chọn form, nhập dữ liệu và có thể lưu một bản nháp chưa đủ field bắt buộc. Bảng request cho phép mở chi tiết theo hàng, phân trang và giữ route để dùng back/forward. Tuy nhiên giá trị đã nhập vẫn phải đúng kiểu và giới hạn. Sau khi mở lại, hệ thống khôi phục dữ liệu, schema version và attachment. Khi submit, tất cả field bắt buộc đang hiển thị phải hợp lệ và request trở thành read-only.

Reviewer có quyền trên form được đọc dữ liệu/file và approve hoặc reject yêu cầu của người khác, từ màn chi tiết hoặc menu hàng trong danh sách. Reject tại màn chi tiết bắt buộc có lý do. Quyết định cuối không mở lại để sửa; correction/resubmit là phần roadmap. File hiện hỗ trợ PDF, PNG, JPEG và TXT, tối đa ba file, mỗi file 5 MiB; quét malware chưa có.

Nguồn: server/requests/service.ts, server/requests/review.ts, server/attachments/routes.ts.

## Slide 05 — Application architecture (1 phút 30 giây)

Frontend được chia theo feature. App shell giữ lựa chọn request, locale và trạng thái điều hướng. Admin authoring nằm riêng, attachment và request history cũng có boundary riêng. Các control dùng lại nằm trong components/ui.

DynamicForm là nơi chọn renderer. Form.io xử lý legacy và các custom field cơ bản; structured React renderer xử lý array/object hoặc custom visibility. Cả hai cùng đi qua FormHandle để phần sản phẩm gọi validation và lấy submission mà không phải biết chi tiết renderer.

Backend Express là nơi quyết định identity, quyền, status, revision và dữ liệu được lưu. Với custom fields, frontend/backend dùng chung hàm visibility và validation. Legacy template vẫn có validator riêng. Việc dùng chung hàm giúp giảm lệch hành vi, nhưng backend vẫn tự validate mọi request HTTP.

Request, snapshots và audit được ghi bằng một lần thay file JSON của request store. Form và attachment có store riêng, nên không có transaction chung giữa tất cả các store. Đây là ranh giới quan trọng khi chuyển sang PostgreSQL và object storage.

Nguồn: src/app, src/features/forms/DynamicForm.tsx, shared/field-validation.ts, server/storage/requests.ts.

## Slide 06 — Authoring and renderer decisions (1 phút 30 giây)

Editor chỉ cho phép các field và rule có kiểu rõ ràng, không nhận JavaScript tùy ý từ người tạo form. Admin có thể upload JSON Form.io tối đa 256 KB, xác thực trước khi thay nội dung editor, rồi tiếp tục chỉnh field và preview trong bước kế tiếp. Import chỉ hỗ trợ một tập component/validation/conditional; component lạ, rule thực thi và nguồn dữ liệu từ xa bị từ chối. Có bảy input cơ bản, cùng multi-select, object, repeat và table. Visibility hỗ trợ AND/OR và điều kiện tham chiếu root, row hoặc parent.

Blank form giúp tạo quy trình không có field IT mặc định. Người dùng chỉnh label thay vì key kỹ thuật. Field mới có reference tạm khi đang edit; backend cấp ID ổn định lúc save và viết lại reference trong condition. Đổi label hoặc thứ tự không làm mất liên kết với dữ liệu đã lưu.

Hai renderer là một trade-off: giữ tương thích Form.io cũ và hỗ trợ structured rules bằng React, nhưng phải duy trì hai đường hành vi. Adapter chỉ gom lifecycle; nó không tự xóa sự phụ thuộc schema. JSON Form.io được generate cũng không chứa đầy đủ semantics của custom scoped visibility. Vì vậy engine riêng trong roadmap cần compatibility fixtures và migration rõ ràng.

Nguồn: shared/fields.ts, shared/field-definition.ts, server/forms/field-identity.ts, src/features/forms/DynamicForm.tsx.

## Slide 07 — Form changes and historical meaning (1 phút 45 giây)

Có hai khái niệm khác nhau: form version là phiên bản định nghĩa, request revision là lần thay đổi record. Khi publish v2, request mới dùng v2, còn draft đã lưu bằng v1 vẫn ở v1. Điều này giữ nguyên ý nghĩa của dữ liệu lịch sử.

Nếu muốn nâng cấp draft, chủ sở hữu phải preview. Hệ thống cho xem field thêm/xóa, rule thay đổi và dữ liệu dự kiến. Giá trị sai được giữ để sửa; dữ liệu bị loại do field bị xóa hoặc ẩn được chỉ rõ. Người dùng phải sửa đầy đủ rồi validate trước khi xác nhận.

Backend tính lại candidate và kiểm tra revision, active target version cùng fingerprint. Nếu có người save hoặc publish bản mới trong lúc preview, thao tác bị từ chối và cần reload. Fingerprint ràng buộc nội dung preview, còn session và permission mới là cơ chế xác thực/phân quyền.

Restore lấy đúng dữ liệu, file và form version của snapshot cũ, nhưng tạo revision mới và giữ audit. Nếu file/schema lịch sử thiếu, restore thất bại thay vì dựng dữ liệu giả. Request đã submit hoặc có quyết định cuối không được upgrade/restore.

Nguồn: docs/architecture.md, server/requests/draft-routes.ts, server/requests/draft-preview.ts.

## Slide 08 — Security and validation (1 phút 30 giây)

API lấy user từ session do server cấp; không tin owner hoặc status do client khai báo. Cookie là HttpOnly, SameSite Strict, thời hạn tuyệt đối tám giờ. Mutation yêu cầu custom header và CSRF token. Mật khẩu dùng scrypt; reset, disable hoặc thay quyền làm session cũ mất hiệu lực.

Quyền admin tách khỏi quyền create/review theo form. Admin quản lý tài khoản/form và đọc request; muốn tạo hoặc review vẫn phải có grant. Review không cho tự duyệt request của mình. History và upgrade còn chặt hơn: chỉ chủ draft có create grant được thao tác.

Validation không dừng ở required field: còn có kiểu dữ liệu, bounds, options, key an toàn và giới hạn độ sâu/kích thước schema. Hidden/unknown data bị loại theo validator trước khi lưu. Ẩn field không phải biện pháp phân quyền; tenant hoặc dữ liệu hạn chế cần policy riêng.

Các kiểm soát này có test local. Session và rate limit vẫn trong RAM; file chưa scan, audit chưa đẩy sang hệ thống độc lập. Vì vậy chưa thể gọi đây là hệ thống đã sẵn sàng production.

Nguồn: server/auth/sessions.ts, server/requests/service.ts, shared/fields.ts, shared/schema-budget.ts.

## Slide 09 — Frontend boundaries and usability (1 phút)

UI đã tách Button, MenuItem, Modal, ErrorNotice và styling field dùng chung. Quản lý form và danh sách request dùng bảng có hành động theo hàng; request list phân trang 10 mục. Các màn hình feature chủ yếu ghép control và xử lý nghiệp vụ, giảm việc lặp CSS hoặc khác hành vi giữa các màn hình.

Modal quản trị có focus handling, hỗ trợ Escape và giữ input khi save lỗi; lúc đang save thì không cho đóng. Menu tài khoản chứa đổi ngôn ngữ, mật khẩu và logout. Chuyển EN/VI giữ dữ liệu đang nhập; điều hướng khỏi dữ liệu chưa lưu có cảnh báo.

Một điểm tích hợp là Tailwind và Bootstrap có thể ảnh hưởng lẫn nhau. Plugin build scope CSS Bootstrap/Form.io vào formio-surface và đặt trong vendor layer, còn React structured UI nằm ngoài scope. Test kiểm tra computed styles thật, viewport mobile và spacing. Đây là evidence cho những hành vi cụ thể, chưa phải chứng nhận accessibility đầy đủ.

Nguồn: src/components/ui, src/app/UserMenu.tsx, tooling/scoped-vendor.ts, docs/architecture.md.

## Slide 10 — Local evidence and limits (1 phút 15 giây)

Lần chạy ngày 28/10/2026 có 93 unit/API test trong 25 file và 19 kịch bản Chromium headless đều pass. TypeScript, production build, lint và format cũng pass. E2E bao gồm upload JSON, bảng request phân trang, điều hướng browser history và duyệt trực tiếp từ menu hàng. Số liệu cần được thay bằng kết quả mới nhất sau mỗi lần chạy.

Test quan trọng cho schema-only change đo hash bundle trước/sau khi publish và kiểm tra document của requester không đổi. Sau đó test đi hết luồng upgrade, submit và approve. Vì vậy có bằng chứng rằng thay đổi cấu hình được hỗ trợ không cần frontend release, trong phạm vi scenario đã kiểm tra.

Repo có GitHub remote và workflow CI, nhưng lần cập nhật này không kiểm tra kết quả hosted CI. Bundle JavaScript khoảng 2.25 MB minified, còn warning kích thước. Chưa có load test, đầy đủ cross-browser/screen-reader hay UAT thật.

Codex đã hỗ trợ soạn code, test và tài liệu. Việc review độc lập của ứng viên chưa được ghi nhận; khi trình bày cần mô tả đúng phần mình đã đọc, thử và hiểu, không tự nhận những hoạt động chưa thực hiện.

Nguồn: docs/handoff.md, e2e/release-independent.spec.ts, .github/workflows/check.yml.

## Slide 11 — Earlier integration estimate (1 phút)

Slide này giữ lại estimate của phương án cũ để giải thích nguồn gốc kế hoạch: bốn tuần, 38 person-days cơ sở và tám ngày contingency, tổng 46. Phương án đó giả định sản phẩm đã có identity, database, file service và workflow để tích hợp.

Phân bổ gồm discovery, frontend, backend integration, QA/UAT và leadership/handover. Bốn tuần là thời gian lịch với các vai trò làm song song, không phải một người hoàn thành 46 ngày công trong bốn tuần.

Đối với hướng standalone đã chọn, estimate này không còn là cam kết. Cần estimate G0 trước, sau đó chia engine, database/tenant, identity, publication, workflow và vận hành thành các stage có gate. Nếu provider hoặc scope chưa rõ, phải ghi assumption và cập nhật estimate sau spike thay vì kéo dài một con số cũ.

Nguồn: docs/platform-roadmap.md.

## Slide 12 — Standalone platform roadmap (1 phút 30 giây)

Roadmap có bốn nhóm lớn. G0–G1 thiết lập baseline và schema engine thống nhất nhưng giữ lịch sử tương thích. G2–G4 xây database transaction, tenant membership/OIDC và publication có approve, activate, rollback tách biệt.

G5–G7 bổ sung typed rules, calculated values, remote lookup, workflow nhiều bước/correction và outbox cho action/notification. G8–G9 xử lý object storage, scan, retention theo snapshot, audit vận hành, hiệu năng và UAT.

Các nhóm này có phụ thuộc thực, không thể xem tenant isolation hay scan gate như việc bổ sung sau production. Request, snapshot, audit và outbox dự kiến cùng transaction DB; object storage cần reconciliation vì không chung transaction. Outbox là at-least-once, downstream vẫn cần idempotency hoặc đối soát.

Về ownership, solution engineer giữ contract và evidence, backend chịu trách nhiệm policy/transaction, frontend giữ authoring/rendering, QA kiểm tra regression/recovery, business owner nghiệm thu. Mỗi stage cần thay đổi nhỏ và review trước khi đi tiếp. Toàn bộ phần này vẫn là kế hoạch.

Nguồn: docs/platform-roadmap.md.

## Slide 13 — Risk register and release gates (1 phút)

Rủi ro đáng ưu tiên là sai boundary quyền, mất ý nghĩa lịch sử và file không an toàn. Local đã có permission checks, immutable schema và explicit upgrades. Những phần platform như tenant isolation, scan/quarantine và restore drill vẫn phải xây và kiểm chứng.

Nếu API hoặc provider contract thay đổi, cần làm spike rồi re-estimate. Nếu đổi engine, regression phải chứng minh dữ liệu cũ vẫn render/validate đúng. Khi migrate JSON sang DB, phải có backup, mapping, checksum/counts và báo dữ liệu thiếu, không bỏ qua record lỗi.

Release gate cần rõ: không có lỗi critical/high, có rollback/runbook đã thử và có người nhận trách nhiệm nghiệm thu. Đối với platform, tenant isolation, scan gate hoặc restore drill thất bại thì không mở pilot. Test pass trên local không thay được bằng chứng vận hành và business acceptance.

Nguồn: docs/handoff.md, docs/platform-roadmap.md.

## Slide 14 — UAT and acceptance (1 phút)

UAT cần được chuẩn bị từ đầu: ai là requester/reviewer đại diện, form nào dùng thử, tiêu chí đúng là gì và build nào được nghiệm thu. QA ghi account/role, input, kết quả mong đợi/thực tế, evidence và defect owner.

Với prototype, các journey chính là điều kiện field, lưu/mở draft, phân quyền, file, upgrade/restore, conflict và quyết định review. Với platform, phải thêm tenant isolation, membership revocation, workflow correction, retry delivery, scan và backup/restore.

Điều kiện kết thúc là các journey quan trọng đạt, không còn critical/high defect, vấn đề nhẹ hơn có người chịu trách nhiệm và thời hạn xử lý. Business owner ký đúng build và scope. Hiện chỉ có engineering checks local; chưa có người dùng khách hàng chạy UAT hoặc ký acceptance.

Nguồn: docs/handoff.md.

## Slide 15 — Change impact and next steps (1 phút)

Ví dụ khách hàng yêu cầu request vượt một ngưỡng chi phí phải qua quản lý. Trước tiên cần hỏi ngưỡng, tiền tệ, người duyệt, đối tượng áp dụng và cách xử lý request đang chạy.

Field cost và validation cơ bản có thể cấu hình nếu nằm trong loại đã hỗ trợ. Nhưng chọn approver, nhiều bước duyệt, correction và thông báo là backend/workflow scope; không thể chỉ thêm một condition ở UI rồi gọi là hoàn thành. Cần bổ sung contract, test và UAT trước khi cam kết.

Kết quả hiện tại là một luồng local đầy đủ với versioning và quyền do server kiểm soát. Bước tiếp theo về kỹ thuật là review baseline G0 và estimate roadmap theo stage; chưa triển khai platform trong lần cập nhật tài liệu này. Sau phần trình bày, em sẽ demo blank form, draft có file, publish version mới, upgrade có xác nhận và review cuối để đối chiếu trực tiếp những gì vừa mô tả.

Nguồn: docs/platform-roadmap.md, docs/presentation-notes.vi.md.

## Kịch bản demo và phương án rút gọn

Chuẩn bị trước admin/requester/reviewer và grant, hoàn tất đổi mật khẩu. Dùng ba profile/context riêng; thay grant sẽ revoke session nên đăng nhập lại trước buổi demo. Dùng DATA_DIR riêng, một file TXT synthetic và một draft v1 đã lưu.

1. Tạo blank form với tên, số lượng và một field điều kiện. Preview, save, publish; chỉ ra label tách khỏi ID.
2. Requester lưu thiếu field required để minh họa draft; nhập giá trị sai để minh họa validation. Upload TXT, lưu rồi mở lại.
3. Admin publish v2 thêm một field required. Requester chọn New request để thấy v2, mở draft cũ để thấy vẫn v1.
4. Preview upgrade, cho thấy confirm bị chặn, sửa và validate rồi confirm. Nếu còn thời gian, preview/cancel restore hoặc restore snapshot có file.
5. Submit; reviewer xem file và approve. Chỉ ra read-only, revision, form version và audit.
6. Mở report schema-only để giải thích bundle hash. Kết thúc bằng giới hạn local và roadmap chưa triển khai.

Nếu chỉ có 10 phút tổng: dùng slide 1, 3, 5, 7, 10, 12 rồi demo một draft đã chuẩn bị. Nếu demo lỗi, dùng report/screenshot đã tạo và nói rõ đó là bằng chứng lần chạy trước, không mô tả như kết quả live. Không reset dữ liệu thật để chữa demo.

## Câu hỏi kỹ thuật thường gặp

**Tại sao chọn JSON schema thay vì hard-code từng form?** Cùng renderer và policy có thể xử lý nhiều cấu hình được hỗ trợ. Đổi lại cần định nghĩa semantics, giới hạn schema, versioning và compatibility test. Không phải mọi thay đổi nghiệp vụ đều trở thành config.

**Tại sao hai renderer?** Giữ hành vi legacy/basic Form.io trong khi React xử lý cấu trúc và scoped visibility. Chi phí là hai đường cần regression. Roadmap chọn engine React thống nhất nhưng vẫn giữ compatibility cho lịch sử.

**Tại sao backend validate khi UI đã validate?** Client có thể bị bypass, stale hoặc gửi payload trực tiếp. API phải dùng schema đã publish và session hiện tại, tự quyết định dữ liệu hợp lệ và quyền ghi.

**Hidden field có phải dữ liệu bí mật không?** Không. Visibility là hành vi form; validator loại hidden data khỏi payload lưu. Dữ liệu hạn chế cần policy read/write riêng và không được gửi cho người không có quyền.

**Version khác revision thế nào?** Version mô tả schema đã publish; revision mô tả lần thay đổi request hoặc admin draft. Save thông thường giữ version, tăng revision. Upgrade/restore mới được đổi version của request draft qua xác nhận.

**Tại sao upgrade yêu cầu đủ required field dù draft được thiếu?** Đây là policy hiện tại để chỉ xác nhận candidate hoàn toàn hợp lệ theo target schema. Preview vẫn cho sửa, cancel không thay draft. Nếu muốn nâng cấp draft chưa hoàn chỉnh, đó là thay đổi policy cần test và thống nhất.

**Rename label có mất data không?** Không nếu giữ field ID. Xóa field rồi tạo field khác là identity khác; hệ thống không tự đoán mapping/rename khi migrate. Preview cho người dùng thấy tác động.

**Fingerprint preview có thay CSRF/session không?** Không. Nó ràng buộc state/candidate để phát hiện preview thay đổi. Authentication, authorization, CSRF và revision checks vẫn cần độc lập.

**File có thật không, có an toàn production chưa?** Có bytes thật và kiểm tra policy/signature/quyền đọc. Chưa scan/quarantine/retention; không tuyên bố bảo đảm file sạch. Restore snapshot cần file lịch sử còn tồn tại.

**Đồng thời hai người save thì sao?** Revision cũ bị conflict trong local single-process service; UI yêu cầu reload. Nhiều API instance cần conditional update/transaction trong DB và test contention, chưa được local JSON store bảo đảm.

**Publish rollback khác restore request thế nào?** Hiện publish cập nhật active version, chưa có UI rollback pointer. Restore chỉ phục hồi draft của một người. Roadmap G4 tách publish/activate và thêm rollback; không sửa schema/request lịch sử.

**Tại sao chưa dùng Redux hoặc microservices?** State hiện tập trung theo feature và lưu local React state/ref đủ cho phạm vi này. Roadmap dùng modular monolith cùng worker để giữ transaction/domain boundaries đơn giản; chỉ tăng hạ tầng khi có nhu cầu và số đo.

**SSO, tenant và workflow nhiều cấp đã có chưa?** Chưa. Hiện login password local, admin có read access toàn bộ và review là quyết định cuối một bước. OIDC/tenant/workflow versioned thuộc G2–G7.

**Điểm khó nhất để giải thích là gì?** Giữ lịch sử đúng khi schema đổi: pin version, snapshot, preview tác động, validation target, chống stale và restore không mất audit. Hãy mở code/test cho một flow thay vì chỉ mô tả abstraction.

**Em đã tự làm phần nào?** Trả lời theo công việc thực tế đã thực hiện. Tài liệu ghi Codex hỗ trợ code/test/docs; không tự nhận đã review toàn bộ hay đo hiệu năng nếu chưa làm. Trước buổi trình bày, tự chạy demo và đọc các module được dẫn ở từng slide.
