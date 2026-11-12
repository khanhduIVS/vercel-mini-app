/**
 * Danh sách loại từ (word type) chuẩn — dùng chung cho:
 * - Word Editor (multi-select checkbox để chọn loại từ cho 1 bản ghi)
 * - Learn View (hiển thị mô tả tiếng Việt khi học)
 *
 * Dữ liệu wordType trong DB lưu dạng chuỗi, có thể là 1 mã đơn ("adj") hoặc nhiều mã
 * ghép bởi dấu phẩy ("n, v") — đến từ việc import CSV với từ có nhiều loại từ.
 * Các hàm dưới đây xử lý cả 2 trường hợp một cách nhất quán.
 */
export interface WordTypeOption {
  code: string;
  label: string;
}

export const WORD_TYPE_OPTIONS: WordTypeOption[] = [
  { code: 'n', label: 'Danh từ' },
  { code: 'v', label: 'Động từ' },
  { code: 'adj', label: 'Tính từ' },
  { code: 'adv', label: 'Trạng từ' },
  { code: 'pron', label: 'Đại từ' },
  { code: 'prep', label: 'Giới từ' },
  { code: 'conj', label: 'Liên từ' },
  { code: 'interj', label: 'Thán từ' },
  { code: 'det', label: 'Từ hạn định' },
  { code: 'art', label: 'Mạo từ' },
  { code: 'num', label: 'Số từ' },
  { code: 'number', label: 'Số từ' },
  { code: 'aux', label: 'Trợ động từ' },
  { code: 'modal', label: 'Động từ khuyết thiếu' },
  { code: 'phr', label: 'Cụm động từ' },
  { code: 'abbr', label: 'Từ viết tắt' },
];

export const WORD_TYPE_MAP: Record<string, string> = Object.fromEntries(
  WORD_TYPE_OPTIONS.map((o) => [o.code, o.label])
);

/** Parse chuỗi wordType (có thể ghép nhiều mã bởi dấu phẩy) thành danh sách mã đã chuẩn hóa (trim, lowercase). */
export function parseWordTypeCodes(wordType: string): string[] {
  return wordType
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
}

/**
 * Lọc danh sách mã chỉ giữ các mã khớp danh sách chuẩn (WORD_TYPE_OPTIONS).
 * Mã lạ không khớp (ví dụ "to", "exclamation", lỗi chính tả) bị bỏ qua.
 */
export function filterKnownWordTypeCodes(codes: string[]): string[] {
  const known = new Set(WORD_TYPE_OPTIONS.map((o) => o.code));
  return codes.filter((c) => known.has(c));
}

/** Ghép danh sách mã (theo đúng thứ tự WORD_TYPE_OPTIONS) thành chuỗi wordType để lưu DB. */
export function buildWordTypeString(selectedCodes: Set<string>): string {
  return WORD_TYPE_OPTIONS
    .filter((o) => selectedCodes.has(o.code))
    .map((o) => o.code)
    .join(', ');
}
