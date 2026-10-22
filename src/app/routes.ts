/** Path helpers (plain paths, no '#'), shared with a future Next.js app. */
export const SECTIONS = ['dich-vu', 'gioi-thieu', 'lien-he'] as const;
export type SectionId = (typeof SECTIONS)[number];

export const paths = {
  home: '/',
  section: (id: SectionId) => `/${id}`,
  login: '/dang-nhap',
  loginStaff: '/dang-nhap/nhan-vien',
  forgot: '/dang-nhap/quen-mat-khau',
  signup: '/dang-ky',
  icons: '/_bo-icon',
  /** The booking page (part 2): its own page since 20/10/2026, no longer a homepage section. */
  book: '/dat-lich',
  uiGallery: '/_giao-dien',
  kh: {
    home: '/khach-hang',
    pets: '/khach-hang/thu-cung',
    pet: (id: string) => `/khach-hang/thu-cung/${id}`,
    appts: '/khach-hang/lich-hen',
    request: (id: string) => `/khach-hang/lich-hen/${id}`,
    book: '/khach-hang/dat-lich',
    stays: '/khach-hang/noi-tru',
    stay: (id: string) => `/khach-hang/noi-tru/${id}`,
    invoices: '/khach-hang/hoa-don',
    invoice: (id: string) => `/khach-hang/hoa-don/${id}`,
    invoicePrint: (id: string) => `/khach-hang/hoa-don/${id}/ban-in`,
    account: '/khach-hang/tai-khoan',
  },
  nv: {
    home: '/nv',
    requests: '/nv/yeu-cau',
    request: (id: string) => `/nv/yeu-cau/${id}`,
    calendar: '/nv/lich-hen',
    customers: '/nv/khach-hang',
    customer: (id: string) => `/nv/khach-hang/${id}`,
    accounts: '/nv/tai-khoan-web',
    board: '/nv/noi-tru',
    stay: (id: string) => `/nv/noi-tru/${id}`,
    invoices: '/nv/hoa-don',
    invoiceNew: '/nv/hoa-don/moi',
    invoice: (id: string) => `/nv/hoa-don/${id}`,
    invoicePrint: (id: string) => `/nv/hoa-don/${id}/ban-in`,
    stock: '/nv/kho',
    stockItem: (id: string) => `/nv/kho/${id}`,
    prices: '/nv/bang-gia',
    revenue: '/nv/doanh-thu',
  },
} as const;

/** Plain-token review links (`…#nv-hoa-don`) → in-app paths. */
export const ALIASES: Record<string, string> = {
  'trang-chu': '/', 'dich-vu': '/dich-vu', 'dat-lich': '/dat-lich', 'gioi-thieu': '/gioi-thieu', 'lien-he': '/lien-he',
  'dang-nhap': '/dang-nhap', 'dang-nhap-nhan-vien': '/dang-nhap/nhan-vien', 'dang-ky': '/dang-ky', 'bo-icon': '/_bo-icon', 'giao-dien': '/_giao-dien',
  kh: '/khach-hang', 'kh-thu-cung': '/khach-hang/thu-cung', 'kh-lich-hen': '/khach-hang/lich-hen', 'kh-noi-tru': '/khach-hang/noi-tru',
  'kh-hoa-don': '/khach-hang/hoa-don', 'kh-tai-khoan': '/khach-hang/tai-khoan', 'kh-dat-lich': '/khach-hang/dat-lich',
  nv: '/nv', 'nv-yeu-cau': '/nv/yeu-cau', 'nv-lich-hen': '/nv/lich-hen', 'nv-khach-hang': '/nv/khach-hang', 'nv-tai-khoan-web': '/nv/tai-khoan-web',
  'nv-noi-tru': '/nv/noi-tru', 'nv-hoa-don': '/nv/hoa-don', 'nv-kho': '/nv/kho', 'nv-bang-gia': '/nv/bang-gia', 'nv-doanh-thu': '/nv/doanh-thu',
};

/** Only internal zone paths are accepted as a post-login destination (no open redirect). */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return /^\/(khach-hang|nv|dat-lich)(\/[\w\-/]*)?$/.test(raw) ? raw : null;
}
