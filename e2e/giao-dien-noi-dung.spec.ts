import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';

const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 768;
const nav = (page: Page) => page.getByRole('navigation', { name: 'Khu nhân viên' });

type Demo = { loginAs(u: string): Promise<unknown>; api: { staff: { team: { list(): Promise<{ id: string; username: string; version: number; name: string; title: string; presets: string[]; extraCaps: string[] }[]>; update(id: string, v: number, i: unknown): Promise<void> } } } };

/** Gives Spa the publishing right through the manager's account, then signs back in as Spa. */
async function grantSpa(page: Page) {
  await page.evaluate(async () => {
    const d = (window as unknown as { __lesonDemo: Demo }).__lesonDemo;
    await d.loginAs('quanly_ha');
    const spa = (await d.api.staff.team.list()).find((r) => r.username === 'spa_ngocanh')!;
    await d.api.staff.team.update(spa.id, spa.version, { display_name: spa.name, title: spa.title, preset_ids: spa.presets, extra_capabilities: [...spa.extraCaps, 'content.publish'] });
    await d.loginAs('spa_ngocanh');
  });
}

async function menuLink(page: Page) {
  if (wide(page)) return nav(page).getByRole('link', { name: 'Trang giới thiệu' });
  await page.getByRole('button', { name: 'Thêm', exact: true }).click();
  return page.getByRole('dialog').getByRole('link', { name: 'Trang giới thiệu' });
}

test.describe('khung màn nội dung', () => {
  for (const user of ['quanly_ha', 'bacsi_mai']) {
    test(`${user} sees the menu entry and opens the screen`, async ({ page }) => {
      await openStaff(page, '/nv', user);
      await expect(await menuLink(page)).toBeVisible();
    });
  }

  test('Spa has no menu entry and a typed address shows the no-rights page', async ({ page }) => {
    await openStaff(page, '/nv', 'spa_ngocanh');
    if (wide(page)) await expect(nav(page).getByRole('link', { name: 'Trang giới thiệu' })).toHaveCount(0);
    else {
      await page.getByRole('button', { name: 'Thêm', exact: true }).click();
      await expect(page.getByRole('dialog').getByRole('link', { name: 'Trang giới thiệu' })).toHaveCount(0);
    }
    await page.evaluate(() => { location.hash = '/nv/trang-gioi-thieu'; });
    await expect(page.getByRole('heading', { level: 1, name: 'Mục này dành cho người có quyền phù hợp' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: 'Nội dung trang giới thiệu' })).toHaveCount(0);
  });

  test('a single right granted to Spa opens the screen', async ({ page }) => {
    await openStaff(page, '/nv', 'spa_ngocanh');
    await grantSpa(page);
    await page.evaluate(() => { location.hash = '/nv/trang-gioi-thieu'; });
    await expect(page.getByRole('heading', { level: 1, name: 'Nội dung trang giới thiệu' })).toBeVisible();
  });

  test('the page has two tabs kept in the address, a current menu entry and an outside link', async ({ page }) => {
    await openStaff(page, '/nv/trang-gioi-thieu', 'quanly_ha');
    const m = main(page);
    await expect(m.getByRole('heading', { level: 1, name: 'Nội dung trang giới thiệu' })).toBeVisible();
    await expect(m.getByRole('tab', { name: /Sản phẩm/ })).toHaveAttribute('aria-selected', 'true');
    await m.getByRole('tab', { name: /Câu chuyện/ }).click();
    await expect(page).toHaveURL(/tab=cau-chuyen/);
    await expect(m.getByRole('tab', { name: /Câu chuyện/ })).toHaveAttribute('aria-selected', 'true');
    await openStaff(page, '/nv/trang-gioi-thieu?tab=cau-chuyen', 'quanly_ha');
    await expect(m.getByRole('tab', { name: /Câu chuyện/ })).toHaveAttribute('aria-selected', 'true');
    if (wide(page)) await expect(nav(page).getByRole('link', { name: 'Trang giới thiệu' })).toHaveAttribute('aria-current', 'page');
    const out = m.getByRole('link', { name: 'Xem trang giới thiệu' });
    await expect(out).toHaveAttribute('target', '_blank');
    await expect(out).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('the permission picker has its own "Nội dung" group', async ({ page }) => {
    await openStaff(page, '/nv/cai-dat/tai-khoan', 'quanly_ha');
    await page.getByRole('button', { name: /Thêm nhân viên/ }).click();
    const d = page.getByRole('dialog');
    const group = d.getByRole('group', { name: 'Nội dung' });
    await expect(group.getByText('Đăng nội dung trang giới thiệu')).toBeVisible();
    await expect(d.getByRole('group', { name: 'Báo cáo và cài đặt' }).getByText('Đăng nội dung trang giới thiệu')).toHaveCount(0);
  });
});

// A 1x1 PNG, enough for the browser to treat the file as a picture.
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
const picture = { name: 'anh.png', mimeType: 'image/png', buffer: PNG };

const rowOf = (page: Page, name: string) => main(page).getByRole('row').filter({ hasText: name });
const dialog = (page: Page) => page.getByRole('dialog');
const publicCards = async (page: Page) => {
  await page.evaluate(() => { location.hash = '/'; });
  await page.waitForSelector('#san-pham, [data-pub]');
  return page.locator('#san-pham [data-product]');
};

test.describe('sản phẩm', () => {
  test.beforeEach(async ({ page }) => { await openStaff(page, '/nv/trang-gioi-thieu', 'quanly_ha'); });

  test('lists the four sample products, one hidden, with the counter', async ({ page }) => {
    const m = main(page);
    await expect(m.getByText('Đã dùng 4/30 mục')).toBeVisible();
    await expect(m.getByRole('row').filter({ hasText: 'Nội dung mẫu' })).toHaveCount(4);
    await expect(rowOf(page, 'Dây dắt chó cỡ vừa (mẫu)').getByText('Đang ẩn')).toBeVisible();
    await expect(rowOf(page, 'Cát vệ sinh cho mèo (mẫu)').getByText('Đang hiện')).toBeVisible();
  });

  test('adds a product with a picture and it shows on the public page', async ({ page }) => {
    const m = main(page);
    await m.getByRole('button', { name: 'Thêm sản phẩm' }).click();
    const d = dialog(page);
    await d.getByLabel('Tên').fill('Hạt cho mèo con');
    await d.getByLabel('Nhóm').selectOption('food');
    await d.getByLabel(/Ghi chú/).fill('Túi 400 g');
    await d.getByLabel('Ảnh').setInputFiles(picture);
    await d.getByRole('button', { name: 'Lưu sản phẩm' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(m.getByText('Đã dùng 5/30 mục')).toBeVisible();
    await expect(rowOf(page, 'Hạt cho mèo con').locator('img')).toBeVisible();
    const cards = await publicCards(page);
    await expect(cards.filter({ hasText: 'Hạt cho mèo con' })).toHaveCount(1);
    await expect(cards.locator('img[alt="Hạt cho mèo con"]')).toBeVisible();
  });

  test('says what is wrong under the box, in the words of the rules', async ({ page }) => {
    const m = main(page);
    await m.getByRole('button', { name: 'Thêm sản phẩm' }).click();
    const d = dialog(page);
    await d.getByRole('button', { name: 'Lưu sản phẩm' }).click();
    await expect(d.getByText('Tên cần từ 1 đến 60 ký tự.')).toBeVisible();
    await d.getByLabel('Tên').fill('Hạt cho mèo con');
    await d.getByLabel(/Ghi chú/).fill('Gọi Nguyễn Văn An 0912345678');
    await d.getByRole('button', { name: 'Lưu sản phẩm' }).click();
    await expect(d.getByText(/Có số điện thoại|Có họ tên/)).toBeVisible();
    await d.getByLabel(/Ghi chú/).fill('Kèm men tiêu hóa cho mèo');
    await d.getByRole('button', { name: 'Lưu sản phẩm' }).click();
    await expect(d.getByText('Có tên thuốc hoặc liều dùng trong chữ này. Bạn bỏ phần đó đi nhé.')).toBeVisible();
    await d.getByLabel(/Ghi chú/).fill('Túi 400 g');
    await d.getByRole('button', { name: 'Lưu sản phẩm' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(rowOf(page, 'Hạt cho mèo con')).toBeVisible();
  });

  test('a file that is not a picture is refused at once, and the words still save', async ({ page }) => {
    await main(page).getByRole('button', { name: 'Thêm sản phẩm' }).click();
    const d = dialog(page);
    await d.getByLabel('Tên').fill('Cát đậu nành');
    await d.getByLabel('Ảnh').setInputFiles({ name: 'a.pdf', mimeType: 'application/pdf', buffer: Buffer.from('x') });
    await expect(d.getByText('Tệp này không phải ảnh. Bạn chọn tệp JPG, PNG hoặc WebP nhé.')).toBeVisible();
    await d.getByRole('button', { name: 'Lưu sản phẩm' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(rowOf(page, 'Cát đậu nành')).toBeVisible();
  });

  test('hide and show again take effect on the public page without asking', async ({ page }) => {
    const m = main(page);
    await m.getByRole('button', { name: 'Ẩn Cát vệ sinh cho mèo (mẫu)' }).click();
    await expect(rowOf(page, 'Cát vệ sinh cho mèo (mẫu)').getByText('Đang ẩn')).toBeVisible();
    await expect(dialog(page)).toHaveCount(0);
    let cards = await publicCards(page);
    await expect(cards.filter({ hasText: 'Cát vệ sinh cho mèo (mẫu)' })).toHaveCount(0);
    await page.evaluate(() => { location.hash = '/nv/trang-gioi-thieu'; });
    await main(page).getByRole('button', { name: 'Hiện lại Cát vệ sinh cho mèo (mẫu)' }).click();
    await expect(rowOf(page, 'Cát vệ sinh cho mèo (mẫu)').getByText('Đang hiện')).toBeVisible();
    cards = await publicCards(page);
    await expect(cards.filter({ hasText: 'Cát vệ sinh cho mèo (mẫu)' })).toHaveCount(1);
  });

  test('editing a sample loses its sample tag; a hidden item keeps its picture for staff only', async ({ page }) => {
    const m = main(page);
    await m.getByRole('button', { name: 'Sửa Dây dắt chó cỡ vừa (mẫu)' }).click();
    const d = dialog(page);
    await d.getByLabel('Tên').fill('Dây dắt chó cỡ vừa');
    await d.getByLabel('Ảnh').setInputFiles(picture);
    await d.getByRole('button', { name: 'Lưu sản phẩm' }).click();
    await expect(dialog(page)).toHaveCount(0);
    const row = rowOf(page, 'Dây dắt chó cỡ vừa');
    await expect(row.getByText('Nội dung mẫu')).toHaveCount(0);
    await expect(row.getByText('Đang ẩn')).toBeVisible();
    await expect(row.locator('img')).toBeVisible();
    const cards = await publicCards(page);
    await expect(cards.filter({ hasText: 'Dây dắt chó' })).toHaveCount(0);
    await expect(page.locator('#san-pham img[alt^="Dây dắt"]')).toHaveCount(0);
  });

  test('deleting asks first and says it is for good', async ({ page }) => {
    const m = main(page);
    await m.getByRole('button', { name: 'Xóa Dây dắt chó cỡ vừa (mẫu)' }).click();
    await expect(dialog(page).getByText(/xóa hẳn/)).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Để sau' }).click();
    await expect(rowOf(page, 'Dây dắt chó cỡ vừa (mẫu)')).toBeVisible();
    await m.getByRole('button', { name: 'Xóa Dây dắt chó cỡ vừa (mẫu)' }).click();
    await dialog(page).getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(rowOf(page, 'Dây dắt chó cỡ vừa (mẫu)')).toHaveCount(0);
    await expect(m.getByText('Đã dùng 3/30 mục')).toBeVisible();
  });

  test('picking a picture again keeps only the last preview alive', async ({ page }) => {
    await main(page).getByRole('button', { name: 'Thêm sản phẩm' }).click();
    const d = dialog(page);
    for (let i = 0; i < 3; i++) await d.getByLabel('Ảnh').setInputFiles({ ...picture, name: `a${i}.png` });
    await expect(d.locator('img[src^="blob:"]')).toHaveCount(1);
    await d.getByRole('button', { name: 'Để sau' }).click();
    await expect(dialog(page)).toHaveCount(0);
  });
});

const publicStories = async (page: Page) => {
  await page.evaluate(() => { location.hash = '/'; });
  await page.waitForSelector('[data-pub]');
  return page.locator('#cau-chuyen [data-story]');
};

test.describe('câu chuyện', () => {
  test.beforeEach(async ({ page }) => { await openStaff(page, '/nv/trang-gioi-thieu?tab=cau-chuyen', 'quanly_ha'); });

  const fill = async (page: Page, o: { title?: string; pet?: string; story?: string; consent?: boolean }) => {
    const d = dialog(page);
    if (o.title !== undefined) await d.getByLabel('Tiêu đề').fill(o.title);
    if (o.pet !== undefined) await d.getByLabel('Tên bé').fill(o.pet);
    if (o.story !== undefined) await d.getByLabel('Câu chuyện', { exact: true }).fill(o.story);
    if (o.consent) await d.getByRole('checkbox', { name: 'Chủ nuôi đã đồng ý cho đăng câu chuyện này' }).check();
  };

  test('lists the two samples with who confirmed and the counter', async ({ page }) => {
    const m = main(page);
    await expect(m.getByText('Đã dùng 2/30 mục')).toBeVisible();
    await expect(m.getByRole('row').filter({ hasText: 'Nội dung mẫu' })).toHaveCount(2);
    await expect(m.getByText(/Chủ nuôi đồng ý: Nguyễn Thu Hà, /).first()).toBeVisible();
  });

  test('refuses a story without the owner’s consent, then publishes it', async ({ page }) => {
    await main(page).getByRole('button', { name: 'Thêm câu chuyện' }).click();
    const d = dialog(page);
    await fill(page, { title: 'Bé Lu khỏe lại', pet: 'Lu', story: 'Bé về nhà sau mấy ngày điều trị và ăn uống bình thường.' });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(d.getByText('Bạn cần xác nhận chủ nuôi đã đồng ý trước khi đăng.')).toBeVisible();
    await fill(page, { consent: true });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(dialog(page)).toHaveCount(0);
    await expect(main(page).getByText('Đã dùng 3/30 mục')).toBeVisible();
    const stories = await publicStories(page);
    const card = stories.filter({ hasText: 'Bé Lu khỏe lại' });
    await expect(card).toHaveCount(1);
    await expect(card.getByText('Bé Lu · Chó')).toBeVisible();
    await card.getByRole('button', { name: /Đọc câu chuyện/ }).click();
    await expect(page.getByRole('dialog').getByText('Bé về nhà sau mấy ngày điều trị')).toBeVisible();
  });

  test('every edit asks for the consent again', async ({ page }) => {
    await main(page).getByRole('button', { name: 'Sửa Bé Mướp được chăm sóc tận tình (mẫu)' }).click();
    const d = dialog(page);
    await expect(d.getByRole('checkbox', { name: 'Chủ nuôi đã đồng ý cho đăng câu chuyện này' })).not.toBeChecked();
    await fill(page, { title: 'Bé Mướp được chăm sóc tận tình' });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(d.getByText('Bạn cần xác nhận chủ nuôi đã đồng ý trước khi đăng.')).toBeVisible();
    await fill(page, { consent: true });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(dialog(page)).toHaveCount(0);
    const row = rowOf(page, 'Bé Mướp được chăm sóc tận tình');
    await expect(row.getByText('Nội dung mẫu')).toHaveCount(0);
    await expect(row.getByText(/Chủ nuôi đồng ý: Nguyễn Thu Hà/)).toBeVisible();
  });

  test('refuses too long, a phone number, a customer’s name and a medicine name, under the right box', async ({ page }) => {
    await main(page).getByRole('button', { name: 'Thêm câu chuyện' }).click();
    const d = dialog(page);
    await fill(page, { title: 'x'.repeat(81), pet: 'y'.repeat(31), story: 'z'.repeat(601), consent: true });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(d.getByText('Tiêu đề cần từ 1 đến 80 ký tự.')).toBeVisible();
    await expect(d.getByText('Tên bé hiển thị cần từ 1 đến 30 ký tự.')).toBeVisible();
    await expect(d.getByText('Câu chuyện cần từ 1 đến 600 ký tự.')).toBeVisible();
    await fill(page, { title: 'Bé Lu', pet: 'Lu', story: 'Gọi 0912 345 678 để biết thêm.' });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(d.getByText('Có số điện thoại trong chữ này. Bạn bỏ số đi nhé.')).toBeVisible();
    await fill(page, { story: 'Bé dùng men tiêu hóa mỗi ngày.' });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(d.getByText('Có tên thuốc hoặc liều dùng trong chữ này. Bạn bỏ phần đó đi nhé.')).toBeVisible();
    await fill(page, { story: 'Chị Nguyễn Thị Lan rất vui khi bé về nhà.' });
    await d.getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(d.getByText('Có họ tên một khách hàng trong chữ này. Bạn bỏ tên đi nhé.')).toBeVisible();
  });

  test('hiding takes a story off the public page, and hiding both removes the section', async ({ page }) => {
    const m = main(page);
    await m.getByRole('button', { name: 'Ẩn Bé Bông khỏe lại sau mấy ngày nằm viện (mẫu)' }).click();
    await expect(rowOf(page, 'Bé Bông khỏe lại').getByText('Đang ẩn')).toBeVisible();
    await m.getByRole('button', { name: 'Ẩn Bé Mướp được chăm sóc tận tình (mẫu)' }).click();
    await expect(rowOf(page, 'Bé Mướp').getByText('Đang ẩn')).toBeVisible();
    await publicStories(page);
    await expect(page.locator('#cau-chuyen')).toHaveCount(0);
    await page.evaluate(() => { location.hash = '/nv/trang-gioi-thieu?tab=cau-chuyen'; });
    await main(page).getByRole('button', { name: 'Hiện lại Bé Mướp được chăm sóc tận tình (mẫu)' }).click();
    const stories = await publicStories(page);
    await expect(stories).toHaveCount(1);
  });

  test('deleting asks first; a 600-letter unbroken story and a long pet name stay inside the frame', async ({ page }) => {
    await main(page).getByRole('button', { name: 'Thêm câu chuyện' }).click();
    await fill(page, { title: 'Bé Lu', pet: 'L'.repeat(30), story: 'a'.repeat(600), consent: true });
    await dialog(page).getByRole('button', { name: 'Lưu câu chuyện' }).click();
    await expect(dialog(page)).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await main(page).getByRole('button', { name: 'Xóa Bé Lu' }).click();
    await expect(dialog(page).getByText(/xóa hẳn/)).toBeVisible();
    await dialog(page).getByRole('button', { name: 'Xóa', exact: true }).click();
    await expect(rowOf(page, 'Bé Lu')).toHaveCount(0);
  });
});
