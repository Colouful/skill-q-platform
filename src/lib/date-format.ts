const SHANGHAI_LOCALE = "zh-CN";
const SHANGHAI_TIME_ZONE = "Asia/Shanghai";
const INVALID_DATE_PLACEHOLDER = "-";

export type DateFormatInput = Date | string | number | null | undefined;

const dateFormatter = new Intl.DateTimeFormat(SHANGHAI_LOCALE, {
  timeZone: SHANGHAI_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimeFormatter = new Intl.DateTimeFormat(SHANGHAI_LOCALE, {
  timeZone: SHANGHAI_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function toValidDate(input: DateFormatInput): Date | null {
  if (input == null) return null;
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input);
  return Number.isNaN(date.getTime()) ? null : date;
}

function partsToRecord(parts: Intl.DateTimeFormatPart[]): Record<string, string> {
  return parts.reduce<Record<string, string>>((acc, part) => {
    if (part.type !== "literal") {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});
}

export function formatDateShanghai(input: DateFormatInput): string {
  const date = toValidDate(input);
  if (!date) return INVALID_DATE_PLACEHOLDER;
  const parts = partsToRecord(dateFormatter.formatToParts(date));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function formatDateTimeShanghai(input: DateFormatInput): string {
  const date = toValidDate(input);
  if (!date) return INVALID_DATE_PLACEHOLDER;
  const parts = partsToRecord(dateTimeFormatter.formatToParts(date));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}
