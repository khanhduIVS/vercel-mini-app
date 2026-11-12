/**
 * Service cho /api/users — danh sách & tạo người dùng.
 * Chỉ chịu trách nhiệm gọi fetch và trả dữ liệu đã parse; không chứa state React.
 */

export interface CreateUserResult {
  userName: string;
  isNew: boolean;
  message: string;
}

/** GET /api/users — lấy danh sách tên người dùng. */
export async function fetchUsers(): Promise<string[]> {
  const res = await fetch('/api/users');
  if (!res.ok) throw new Error('Không thể tải danh sách người dùng');
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/** POST /api/users — tạo mới hoặc lấy lại người dùng theo tên. */
export async function createOrGetUser(name: string): Promise<CreateUserResult> {
  const res = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Không thể tạo người dùng');
  }
  return res.json();
}
