import type { Sex, Species } from '../../contracts/enums';
import { phone, type SeedCtx } from './ctx';

/** Salted SHA-256 of the demo password `leson-demo` (scripts/hash-demo-passwords.mjs). */
export const DEMO_PASSWORD = 'leson-demo';
const HASH: Record<string, [string, string]> = {
  quanly_ha: ['61b0ed57acb43aba', '544ebdc554e9e0cf2edbaee1cc2afc98791625a45b3fc0716e80e1828b7c333d'],
  bacsi_duc: ['97e78df9d303092a', '6460aedaa543c82f9e4287b219014193e578a26085ea5a1eec3abb00aa4081ce'],
  bacsi_mai: ['ab155de2f7f85cae', '4e9a4c3c9c2a9cab8786ce06c9e6704801ff6bcbc1c3e9d74f40aa217a17b53a'],
  spa_ngocanh: ['33b80f4595a1dcbd', '894e3da0a9ec707d1491ecb26022fb6c4190bd72b6b96773870809e2bee721dc'],
  lan_nguyen: ['e3f9b1f6bb19f1c3', '26df2710cad0629b783da633da4b99ac76476f0060b924a2eddab5cd94e834de'],
  thuy_pham: ['8e7db9c7c3135c80', '049e0eb83da195dceb98883407f6b543f83786a31441ee3847768e86482b7de9'],
  hoang_long: ['7a5cb3b9b8cd473a', '5a6a98ca9a4503b14e22871e53a3706000f3350ff091091f1889d642de0796ed'],
  ngoc_tran: ['abb2b7eecdfe97ad', '2d7e7d30dbc3062b33128c892e7fbc6d2f52404e406df7b3f8d82dc3a5e87b1e'],
  minh_khoa: ['e5e457a6c51c66ba', '77839b83dc51a0827a6a68e69b5820c78b7b0a9b5b83dcbb2c370ae0481b4665'],
  maianh_do: ['3dbc5476bf692562', 'f8c18ad094b47b08c7605b63fa7535ba9589eaed802571909b2cf3d44fac6c67'],
};

export const STAFF = { ha: 'stf-ha', duc: 'stf-duc', mai: 'stf-mai', ngocanh: 'stf-ngocanh' } as const;

const CUSTOMERS: [string, string][] = [
  ['KH-0001', 'Nguyễn Thị Lan'], ['KH-0002', 'Phạm Thu Thủy'], ['KH-0003', 'Vũ Hoàng Long'], ['KH-0004', 'Trần Bảo Ngọc'],
  ['KH-0005', 'Hoàng Văn Nam'], ['KH-0006', 'Đỗ Minh Khoa'], ['KH-0007', 'Lê Thị Hồng Nhung'], ['KH-0008', 'Bùi Quang Huy'],
  ['KH-0009', 'Ngô Thanh Hương'], ['KH-0010', 'Đặng Văn Tùng'], ['KH-0011', 'Trịnh Mai Phương'], ['KH-0012', 'Phan Đức Anh'],
  ['KH-0013', 'Lý Thu Trang'], ['KH-0014', 'Cao Minh Tuấn'], ['KH-0015', 'Đinh Hải Yến'], ['KH-0016', 'Võ Quốc Bảo'],
  ['KH-0017', 'Hà Thị Thu'], ['KH-0018', 'Tạ Minh Châu'],
];
export const cus = (n: number) => `cus-${String(n).padStart(2, '0')}`;

type PetSeed = [slug: string, customer: number, name: string, species: Species, breed: string, sex: Sex, ageYears: number, extra?: { neutered?: boolean; alerts?: string[]; color?: string; weight?: number }];
const PETS: PetSeed[] = [
  ['miu', 1, 'Miu', 'cat', 'Mèo ta lông vàng', 'female', 4, { neutered: true, weight: 4.2 }],
  ['bong', 1, 'Bông', 'dog', 'Poodle', 'male', 3, { weight: 5.5 }],
  ['kem', 2, 'Kem', 'dog', 'Golden Retriever', 'male', 0, { weight: 12 }],
  ['mochi', 3, 'Mochi', 'dog', 'Poodle', 'female', 7, { weight: 6.5 }],
  ['bo', 4, 'Bơ', 'dog', 'Golden Retriever', 'male', 6, { weight: 32 }],
  ['su', 4, 'Su', 'cat', 'Mèo Anh lông ngắn', 'female', 2, { weight: 4 }],
  ['lu', 5, 'Lu', 'dog', 'Corgi', 'male', 2, { weight: 11 }],
  ['gao', 6, 'Gạo', 'cat', 'Mèo mướp trắng', 'male', 1, { weight: 3.8 }],
  ['mit', 7, 'Mít', 'dog', 'Phốc sóc', 'female', 4, { weight: 2.5 }],
  ['soi', 8, 'Sói', 'dog', 'Husky', 'male', 3, { alerts: ['Có thể cắn — cần rọ mõm'], weight: 24 }],
  ['na', 9, 'Na', 'cat', 'Mèo Scottish tai cụp', 'female', 1, { weight: 3.1 }],
  ['bin', 9, 'Bin', 'cat', 'Mèo Ba Tư', 'male', 5, { weight: 4.8 }],
  ['dau', 10, 'Đậu', 'dog', 'Chó ta', 'male', 6, { weight: 16 }],
  ['tom', 11, 'Tôm', 'dog', 'Pug', 'male', 4],
  ['muop', 12, 'Mướp', 'cat', 'Mèo ta', 'female', 8, { weight: 4.5 }],
  ['lucky', 13, 'Lucky', 'dog', 'Shih Tzu', 'female', 5, { weight: 6 }],
  ['xoai', 13, 'Xoài', 'cat', 'Mèo Munchkin', 'female', 1],
  ['milo', 14, 'Milo', 'dog', 'Bắc Kinh lai', 'male', 9, { alerts: ['Bệnh mãn tính: tim (theo dõi)'], weight: 7 }],
  ['com', 15, 'Cốm', 'dog', 'Poodle', 'female', 2, { weight: 4 }],
  ['map', 16, 'Mập', 'cat', 'Mèo Anh lông ngắn', 'male', 3, { alerts: ['Dễ hoảng sợ'], weight: 5.2 }],
  ['oi', 17, 'Ổi', 'dog', 'Phốc sóc', 'female', 6, { weight: 2.8 }],
  ['sushi', 18, 'Sushi', 'dog', 'Shiba', 'male', 2, { weight: 10 }],
];
export const pet = (slug: string) => `pet-${slug}`;
export const petCustomer = (slug: string) => cus(PETS.find((p) => p[0] === slug)![1]);
export const petName = (slug: string) => PETS.find((p) => p[0] === slug)![2];

export const acc = (username: string) => `acc-${username}`;

export function seedAccounts(c: SeedCtx): void {
  const { t } = c.doc;
  const year = Number(c.base.slice(0, 4));
  const staff: [string, string, string, string, ('quan_ly' | 'bac_si' | 'spa')[], ('requests.handle')[]][] = [
    [STAFF.ha, 'quanly_ha', 'Nguyễn Thu Hà', 'Quản lý', ['quan_ly'], []],
    [STAFF.duc, 'bacsi_duc', 'BS. Trần Minh Đức', 'Bác sĩ', ['bac_si'], ['requests.handle']],
    [STAFF.mai, 'bacsi_mai', 'BS. Phạm Thanh Mai', 'Bác sĩ', ['bac_si'], []],
    [STAFF.ngocanh, 'spa_ngocanh', 'Lê Ngọc Anh', 'Nhân viên Spa', ['spa'], []],
  ];
  for (const [id, username, display_name, title, preset_ids, extra] of staff) {
    const [salt, hash] = HASH[username]!;
    t.staff_users.push({ id, username, display_name, title, preset_ids, extra_capabilities: extra, is_sample: true, active: true, password_salt: salt, password_hash: hash });
  }

  CUSTOMERS.forEach(([code, full_name], i) => {
    t.customers.push({ id: cus(i + 1), code, full_name, phone_e164: phone(i + 1), created_at: c.d(-120 + i * 5, '10:00'), created_by: STAFF.ha });
  });
  c.doc.counters.KH = CUSTOMERS.length;

  PETS.forEach(([slug, customer, name, species, breed, sex, age, extra], i) => {
    t.pets.push({
      id: pet(slug), code: `TC-${String(i + 1).padStart(4, '0')}`, customer_id: cus(customer), name, species, breed, sex,
      birth_year: year - age, alerts: extra?.alerts ?? [], neutered: extra?.neutered, color: extra?.color, weight_kg: extra?.weight,
    });
  });
  c.doc.counters.TC = PETS.length;

  const accounts: [string, string, number, 'anh' | 'chi' | 'ban', string][] = [
    ['lan_nguyen', 'Nguyễn Thị Lan', 1, 'chi', 'LS-H3VA'],
    ['thuy_pham', 'Phạm Thu Thủy', 2, 'chi', 'LS-Q8MX'],
    ['hoang_long', 'Vũ Hoàng Long', 3, 'anh', 'LS-T4NB'],
    ['ngoc_tran', 'Trần Bảo Ngọc', 4, 'chi', 'LS-W9RC'],
    ['minh_khoa', 'Đỗ Minh Khoa', 6, 'anh', 'LS-7K2Q'],
    ['maianh_do', 'Đỗ Mai Anh', 19, 'chi', 'LS-P5ZD'],
  ];
  accounts.forEach(([username, display_name, phoneN, salutation, link_code], i) => {
    const [salt, hash] = HASH[username]!;
    t.web_accounts.push({
      id: acc(username), username, display_name, phone_e164: phone(phoneN), salutation, link_code, status: 'active',
      created_at: c.d(-60 + i * 7, '20:15'), password_salt: salt, password_hash: hash,
    });
  });
  for (const [username, customer] of [['lan_nguyen', 1], ['thuy_pham', 2], ['hoang_long', 3], ['ngoc_tran', 4]] as const) {
    t.account_links.push({ id: `lnk-${username}`, account_id: acc(username), customer_id: cus(customer), linked_at: c.d(-40, '10:20'), linked_by: STAFF.ha, method: 'in_person_app', method_note: 'Khách đưa mã tại quầy (dữ liệu mẫu)' });
  }
  t.account_pets.push(
    { id: 'apet-gao', account_id: acc('minh_khoa'), name: 'Gạo', species: 'cat', breed: 'Mèo mướp trắng', sex: 'male', birth_year: year - 1, created_at: c.d(-3, '21:00') },
    { id: 'apet-bap', account_id: acc('maianh_do'), name: 'Bắp', species: 'dog', breed: 'Corgi', sex: 'male', birth_year: year - 2, created_at: c.d(-5, '19:30') },
  );
}
