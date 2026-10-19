// One-off: prints salted SHA-256 hashes of the demo password for the seed literals (src/data/mock/seed/accounts.ts).
import { createHash } from 'node:crypto';
const PASSWORD = 'leson-demo';
const users = ['quanly_ha', 'bacsi_duc', 'bacsi_mai', 'spa_ngocanh', 'lan_nguyen', 'thuy_pham', 'hoang_long', 'ngoc_tran', 'minh_khoa', 'maianh_do'];
for (const u of users) {
  const salt = createHash('sha256').update(`salt:${u}`).digest('hex').slice(0, 16);
  const hash = createHash('sha256').update(salt + PASSWORD).digest('hex');
  console.log(`  ${u}: ['${salt}', '${hash}'],`);
}
