export class ForbiddenError extends Error {
  constructor(message = 'Mục này dành cho người có quyền phù hợp. Nếu bạn cần dùng, hãy nhờ quản lý cấp quyền.') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
export class NotFoundError extends Error {
  constructor(message = 'Không tìm thấy nội dung này.') {
    super(message);
    this.name = 'NotFoundError';
  }
}
export class NotLinkedError extends Error {
  constructor(message = 'Tài khoản chưa được liên kết với hồ sơ tại Lê Sơn.') {
    super(message);
    this.name = 'NotLinkedError';
  }
}
export class ConflictError extends Error {
  constructor(message = 'Hồ sơ này vừa được cập nhật ở nơi khác. Đã tải lại bản mới nhất, bạn kiểm tra rồi thao tác lại.') {
    super(message);
    this.name = 'ConflictError';
  }
}
export class ValidationError extends Error {
  readonly fields: Record<string, string>;
  constructor(fields: Record<string, string>, message?: string) {
    super(message ?? Object.values(fields)[0] ?? 'Thông tin chưa hợp lệ.');
    this.name = 'ValidationError';
    this.fields = fields;
  }
}
export class StorageError extends Error {
  constructor(message = 'Bản demo không lưu được trên trình duyệt này.') {
    super(message);
    this.name = 'StorageError';
  }
}
export class AuthError extends Error {
  constructor(message = 'Thông tin đăng nhập chưa đúng. Bạn kiểm tra lại giúp nhé.') {
    super(message);
    this.name = 'AuthError';
  }
}
