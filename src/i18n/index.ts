import type { Locale } from "../../shared/model";
import { messages as en, formMessages as enForm } from "./en";
import { messages as vi, formMessages as viForm } from "./vi";
export type Messages = { [K in keyof typeof en]: string };
export const copy = (locale: Locale): Messages => (locale === "vi" ? vi : en);
export const formTranslations = { en: enForm, vi: viForm };
