import { copy } from "./index";
import { authCopy } from "../features/auth/copy";
import type { Locale } from "../../shared/model";
import { apiMessages } from "../../shared/i18n/api-en";
import { apiTranslations } from "../../shared/i18n/api-vi";
export const clientErrors = {
  network:
    "Cannot reach the API. Your input is still here; check the connection and retry.",
  response: "The API returned an unexpected response. Please retry.",
  initialize: "Unable to initialize the form.",
  unexpected: "Unable to complete this action. Please retry.",
};
const vi: Record<keyof typeof clientErrors, string> = {
  network:
    "Không thể kết nối API. Dữ liệu đang nhập vẫn còn; hãy kiểm tra kết nối và thử lại.",
  response: "API trả về phản hồi không hợp lệ. Hãy thử lại.",
  initialize: "Không thể khởi tạo biểu mẫu.",
  unexpected: "Không thể hoàn tất thao tác. Hãy thử lại.",
};
const entries = (en: Record<string, string>, vi: Record<string, string>) =>
  Object.keys(en).map((key) => ({ en: en[key], vi: vi[key] }));
const translations = [
  ...entries(apiMessages, apiTranslations),
  ...entries(clientErrors, vi),
  ...entries(copy("en"), copy("vi")),
  ...entries(authCopy("en"), authCopy("vi")),
];
export const errorMessage = (message: string, locale: Locale): string => {
  const entry = translations.find(
    (entry) => entry.en === message || entry.vi === message,
  );
  if (entry) return entry[locale];
  // Already localized application errors remain readable; unknown failures use a fallback.
  return locale === "en" || /[À-ỹ]/u.test(message) ? message : vi.unexpected;
};
