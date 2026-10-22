import type { SeedCtx } from './ctx';

const BY = 'Nguyễn Thu Hà';

// Sample data ("Nội dung mẫu"): generic, no brand, no medicine, no figures. One product is hidden so the staff list shows both states.
const PRODUCTS = [
  { name: 'Thức ăn hạt cho chó trưởng thành (mẫu)', category: 'food', note: 'Hạt khô, hợp chó từ một tuổi.', visible: true, hours: 72 },
  { name: 'Thức ăn ướt cho mèo (mẫu)', category: 'food', visible: true, hours: 48 },
  { name: 'Cát vệ sinh cho mèo (mẫu)', category: 'litter', price_vnd: 120000, visible: true, hours: 30 },
  { name: 'Dây dắt chó cỡ vừa (mẫu)', category: 'accessory', visible: false, hours: 12 },
] as const;

const CASES = [
  { title: 'Bé Bông khỏe lại sau mấy ngày nằm viện (mẫu)', pet_name: 'Bông', species: 'dog', hours: 96,
    story: 'Bé đến Lê Sơn trong tình trạng mệt và bỏ ăn. Sau một thời gian được chăm sóc và theo dõi, bé ăn uống lại bình thường và về nhà vui vẻ cùng gia đình.' },
  { title: 'Bé Mướp được chăm sóc tận tình (mẫu)', pet_name: 'Mướp', species: 'cat', hours: 60,
    story: 'Bé về nhà sau thời gian nằm viện, lông mượt và nghịch ngợm trở lại. Gia đình đồng ý chia sẻ câu chuyện này.' },
] as const;

/** Four sample products and two sample cases; every row is flagged `sample` so the page can show "Nội dung mẫu". */
export function seedContent(c: SeedCtx) {
  PRODUCTS.forEach((p, i) => {
    const at = c.ago(p.hours * 60);
    c.doc.t.featured_products.push({
      id: `fp-${i + 1}`, name: p.name, category: p.category, ...('note' in p ? { note: p.note } : {}), ...('price_vnd' in p ? { price_vnd: p.price_vnd } : {}),
      visible: p.visible, sample: true, created_at: at, created_by_name: BY, updated_at: at, updated_by_name: BY, version: 1,
    });
  });
  CASES.forEach((k, i) => {
    const at = c.ago(k.hours * 60);
    c.doc.t.featured_cases.push({
      id: `fc-${i + 1}`, title: k.title, story: k.story, pet_name: k.pet_name, species: k.species, visible: true, sample: true,
      consent_by_name: BY, consent_at: at, created_at: at, created_by_name: BY, updated_at: at, updated_by_name: BY, version: 1,
    });
  });
}
