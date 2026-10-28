import { apiMessages } from "./api-en";
export const apiTranslations: Record<keyof typeof apiMessages, string> = {
  aNewerFormDraftExistsReloadBeforeEditing:
    "Đã có bản nháp biểu mẫu mới hơn. Tải lại trước khi sửa.",
  aNewerFormDraftExistsReloadBeforePublishing:
    "Đã có bản nháp biểu mẫu mới hơn. Tải lại trước khi xuất bản.",
  aNewerRevisionExistsReloadTheRequestBeforeEditing:
    "Đã có bản lưu mới hơn. Tải lại yêu cầu trước khi sửa.",
  aNewerRevisionExistsReloadTheRequestBeforeReviewing:
    "Đã có bản lưu mới hơn. Tải lại yêu cầu trước khi xét duyệt.",
  aRejectionReasonIsRequired: "Cần nhập lý do từ chối.",
  aRequestMustKeepItsOriginalFormType:
    "Yêu cầu phải giữ nguyên loại biểu mẫu ban đầu.",
  aSavedRequestMustKeepItsOriginalFormVersion:
    "Yêu cầu đã lưu phải giữ nguyên phiên bản biểu mẫu ban đầu.",
  aVisibilityConditionReferencesAMissingField:
    "Điều kiện hiển thị tham chiếu đến trường không tồn tại.",
  apiEndpointNotFound: "Không tìm thấy chức năng API.",
  accountCredentialsChangedSignInAgain:
    "Thông tin đăng nhập đã thay đổi. Vui lòng đăng nhập lại.",
  administratorAccessRequired: "Chức năng này yêu cầu quyền quản trị.",
  anAdministratorAlreadyExists: "Đã có tài khoản quản trị.",
  blankFormsRequireAtLeastOneField: "Biểu mẫu trống cần ít nhất một trường.",
  changeYourInitialPasswordBeforeContinuing:
    "Đổi mật khẩu ban đầu trước khi tiếp tục.",
  checkTheDecisionAndCommentMaximum2000Characters:
    "Kiểm tra quyết định và nhận xét (tối đa 2.000 ký tự).",
  chooseADifferentPassword: "Chọn mật khẩu khác.",
  chooseANonEmptyFileUpTo5Mb: "Chọn tệp không rỗng, tối đa 5 MB.",
  completeTheRequiredFieldsBeforeSubmitting:
    "Điền các trường bắt buộc trước khi gửi.",
  correctAllValuesAndRequiredFieldsInTheMigration:
    "Sửa các giá trị và trường bắt buộc trong bản xem trước trước khi nâng cấp.",
  couldNotAllocateAUniqueFieldIdentityRetrySaving:
    "Không thể tạo mã trường duy nhất. Hãy thử lưu lại.",
  currentPasswordIsIncorrect: "Mật khẩu hiện tại không đúng.",
  draftNotFound: "Không tìm thấy bản nháp.",
  emailAlreadyExists: "Email đã tồn tại.",
  enterANewPassword: "Nhập mật khẩu mới.",
  enterCurrentAndNewPasswords: "Nhập mật khẩu hiện tại và mật khẩu mới.",
  enterYourEmailAndPassword: "Nhập email và mật khẩu.",
  fileContentIsUnavailable: "Nội dung tệp không khả dụng.",
  fileContentsMustMatchAPdfPngJpgOr:
    "Nội dung tệp phải đúng định dạng PDF, PNG, JPG hoặc TXT UTF-8.",
  fileNotFound: "Không tìm thấy tệp.",
  formTypeNotFound: "Không tìm thấy loại biểu mẫu.",
  invalidCsrfToken: "Phiên xác thực không hợp lệ. Hãy tải lại trang.",
  invalidAccountChanges: "Thay đổi tài khoản không hợp lệ.",
  invalidAccountDetails: "Thông tin tài khoản không hợp lệ.",
  invalidEmailOrPassword: "Email hoặc mật khẩu không đúng.",
  invalidFileName: "Tên tệp không hợp lệ.",
  invalidFormDraft: "Bản nháp biểu mẫu không hợp lệ.",
  invalidFormPermissions: "Quyền biểu mẫu không hợp lệ.",
  invalidLoginRequest: "Yêu cầu đăng nhập không hợp lệ.",
  invalidOrUnsupportedFormIoJson:
    "JSON Form.io không hợp lệ hoặc chưa được hỗ trợ.",
  invalidRequestId: "Mã yêu cầu không hợp lệ.",
  invalidRequestDataOrAttachmentMetadata:
    "Dữ liệu yêu cầu hoặc thông tin tệp đính kèm không hợp lệ.",
  keepAtLeastOneActiveAdministrator:
    "Cần giữ ít nhất một quản trị viên đang hoạt động.",
  newFormRevisionMustBeZero: "Lần lưu của biểu mẫu mới phải bằng 0.",
  onlyReviewersWithFormPermissionMayReviewAnotherUser:
    "Chỉ người xét duyệt có quyền trên biểu mẫu mới được xét duyệt yêu cầu của người khác.",
  onlySubmittedOrInReviewRequestsCanBeApproved:
    "Chỉ yêu cầu đã gửi hoặc đang xét duyệt mới có thể được duyệt hoặc từ chối.",
  pleaseCheckTheHighlightedValues:
    "Vui lòng kiểm tra các giá trị được đánh dấu.",
  previewTheLatestPublishedVersionToUpgradeThisDraft:
    "Xem trước phiên bản xuất bản mới nhất để nâng cấp bản nháp này.",
  publishedFormVersionNotFound:
    "Không tìm thấy phiên bản biểu mẫu đã xuất bản.",
  requestNotFound: "Không tìm thấy yêu cầu.",
  setAPasswordBeforeEnablingThisUser:
    "Đặt mật khẩu trước khi kích hoạt người dùng này.",
  signInToContinue: "Đăng nhập để tiếp tục.",
  snapshotNotFound: "Không tìm thấy bản lưu lịch sử.",
  supplyRevisionTargetAndExplicitPreviewConfirmation:
    "Cần cung cấp lần lưu, đích và xác nhận bản xem trước.",
  supplyTheFormDraftRevision: "Cần cung cấp lần lưu của bản nháp biểu mẫu.",
  theDemoApiIsTemporarilyUnavailableYourFormHas:
    "API demo tạm thời không khả dụng. Biểu mẫu chưa được lưu.",
  thePreviewHasChangedReloadAndPreviewAgain:
    "Bản xem trước đã thay đổi. Tải lại và xem trước lần nữa.",
  theSameUploadCannotBeAttachedTwice:
    "Không thể đính kèm cùng một tệp tải lên hai lần.",
  theSelectedFormVersionIsUnavailable:
    "Phiên bản biểu mẫu đã chọn không khả dụng.",
  thisFileBelongsToADifferentRequest: "Tệp này thuộc một yêu cầu khác.",
  thisRequestHasAlreadyBeenSubmitted: "Yêu cầu này đã được gửi.",
  tooManyFormGrants: "Đã vượt số lượng quyền biểu mẫu cho phép.",
  tooManySignInAttemptsRetryIn15Minutes:
    "Đăng nhập quá nhiều lần. Thử lại sau 15 phút.",
  uploadTheFileAsBinaryContent: "Tải tệp lên dưới dạng dữ liệu nhị phân.",
  uploadTheFileBeforeAttachingIt: "Tải tệp lên trước khi đính kèm.",
  useAPasswordOfAtLeast12CharactersAnd:
    "Dùng mật khẩu có ít nhất 12 ký tự và tối đa 256 byte.",
  userNotFound: "Không tìm thấy người dùng.",
  userPermissionsChangedReloadBeforeSaving:
    "Quyền người dùng đã thay đổi. Tải lại trước khi lưu.",
  youCannotAttachFilesToThisRequest:
    "Bạn không có quyền đính kèm tệp vào yêu cầu này.",
  youCannotChangeThisRequest: "Bạn không có quyền thay đổi yêu cầu này.",
  youCannotCreateRequestsForThisForm:
    "Bạn không có quyền tạo yêu cầu cho biểu mẫu này.",
  bodySize: "Tệp tải lên hoặc dữ liệu yêu cầu vượt giới hạn kích thước.",
  invalidJson: "Yêu cầu chứa JSON không hợp lệ.",
  operationFailed: "Không thể hoàn tất thao tác. Hãy thử lại.",
};
