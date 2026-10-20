import { expect, test } from '@playwright/test';
import { open } from './helpers';

async function fillGuest(page: import('@playwright/test').Page) {
  const form = page.locator('#form-dat-lich');
  await form.getByLabel('Họ và tên').fill('Hoàng Minh');
  await form.getByLabel('Số điện thoại').fill('0987 654 321');
  await form.getByLabel('Tên bé').fill('Bánh Bao');
  await form.getByRole('radio', { name: 'Chó' }).click();
  await form.getByRole('radio', { name: /Spa & Grooming/ }).click();
  await form.getByLabel('Ngày bạn mong muốn').fill('2030-01-15');
  await form.getByRole('checkbox').check();
  return form;
}

test.describe('booking request form', () => {
  test('guest submits and sees the confirmation', async ({ page }) => {
    await open(page, '/dat-lich');
    const form = await fillGuest(page);
    await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();
    await expect(page.getByText('0987 654 321')).toBeVisible();
  });

  test('empty submit shows the gentle errors and focuses the first one', async ({ page }) => {
    await open(page, '/dat-lich');
    const form = page.locator('#form-dat-lich');
    await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(form.getByText('Bạn chọn giúp dịch vụ bé cần nhé.')).toBeVisible();
    await expect(form.getByText('Bạn cho Lê Sơn biết tên của bạn nhé.')).toBeVisible();
    await expect(form.getByText(/Còn \d+ mục cần bổ sung/)).toBeVisible();
    await expect(form.getByLabel('Họ và tên')).toBeFocused();
  });

  test('an identical resubmit shows the same confirmation', async ({ page }) => {
    await open(page, '/dat-lich');
    let form = await fillGuest(page);
    await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await page.getByRole('button', { name: 'Gửi thêm yêu cầu khác' }).click();
    form = await fillGuest(page);
    await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Lê Sơn đã nhận yêu cầu của bạn' })).toBeVisible();
  });

  test('a failed save shows the failure copy and keeps the input', async ({ page }) => {
    await open(page, '/dat-lich');
    const form = await fillGuest(page);
    await page.evaluate(() => (window as unknown as { __lesonDemo: { failNextWrite(): void } }).__lesonDemo.failNextWrite());
    await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('heading', { name: 'Chưa gửi được yêu cầu' })).toBeVisible();
    await page.getByRole('button', { name: 'Thử lại' }).click();
    await expect(page.locator('#form-dat-lich').getByLabel('Tên bé')).toHaveValue('Bánh Bao');
  });

  test('a logged-in customer picks a saved pet; staff cannot submit', async ({ page }) => {
    await open(page, '/dat-lich', { as: 'lan_nguyen' });
    const form = page.locator('#form-dat-lich');
    await expect(form.getByText('Gửi với tài khoản')).toBeVisible();
    await form.getByRole('radio', { name: /Miu/ }).click();
    await form.getByRole('radio', { name: /Khám và điều trị/ }).click();
    await form.getByLabel('Ngày bạn mong muốn').fill('2030-02-01');
    await form.getByRole('button', { name: 'Gửi yêu cầu' }).click();
    await expect(page.getByRole('button', { name: 'Xem yêu cầu của tôi' }).or(page.getByRole('link', { name: 'Xem yêu cầu của tôi' }))).toBeVisible();
    await open(page, '/dat-lich', { as: 'quanly_ha' });
    await expect(page.getByText('Bạn đang đăng nhập bằng tài khoản nhân viên.')).toBeVisible();
    await expect(page.locator('#form-dat-lich').getByRole('button', { name: 'Gửi yêu cầu' })).toBeDisabled();
  });
});
