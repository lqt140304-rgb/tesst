import { expect, test, type Page } from '@playwright/test';
import { openStaff, staffMain as main } from './helpers';

const toast = (page: Page, text: string | RegExp) => page.getByRole('status').filter({ hasText: text });
const SEARCH = 'Tìm bé, chủ nuôi hoặc số điện thoại';

/** Admits the first pet found by `search` into `cage` through the three steps (leaves the app on the new stay page). */
async function admit(page: Page, o: { search: string; cage: string; reason?: string }) {
  await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
  const dlg = page.getByRole('dialog');
  await dlg.getByRole('searchbox', { name: SEARCH }).fill(o.search);
  await dlg.locator('[data-pet-option]').first().click();
  await dlg.getByRole('button', { name: 'Tiếp' }).click();
  await dlg.getByLabel('Lý do nhập viện').fill(o.reason ?? 'Theo dõi');
  await dlg.getByRole('radio', { name: `Chuồng ${o.cage}` }).click();
  await dlg.getByRole('button', { name: 'Tiếp' }).click();
  await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
}

test.describe('admit a pet', () => {
  test("three steps: pick from today's appointments, choose a cage, confirm", async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText('Bước 1/3')).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
    await dlg.locator('[data-today-appt]', { hasText: 'Mập' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 2/3')).toBeVisible();
    await expect(dlg.getByRole('button', { name: 'Tiếp' })).toBeDisabled();
    await dlg.getByLabel('Lý do nhập viện').fill('Theo dõi sau khám');
    await dlg.getByRole('radio', { name: 'Chuồng M1' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 3/3')).toBeVisible();
    await expect(dlg.getByText(/Mập · chuồng M1/)).toBeVisible();
    await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
    await expect(toast(page, 'Đã nhập viện Mập vào chuồng M1.')).toBeVisible();
    await expect(page).toHaveURL(/#\/nv\/noi-tru\/[^/]+$/);
  });

  test('search finds a pet by its owner; a pet already in a cage cannot be chosen', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Nguyễn Thị Lan');
    await expect(dlg.locator('[data-pet-option]', { hasText: 'Bông' })).toBeVisible();
    const miu = dlg.locator('[data-pet-option]', { hasText: 'Miu' });
    await expect(miu).toBeDisabled();
    await expect(miu).toContainText('Đang nội trú');
  });

  test('an empty cage opens the dialog with that cage already chosen', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện vào chuồng C2' }).click();
    const dlg = page.getByRole('dialog');
    await expect(dlg.getByText('Bước 1/3')).toBeVisible();
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Bông');
    await dlg.locator('[data-pet-option]').first().click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByRole('radio', { name: 'Chuồng C2' })).toBeChecked();
  });

  test('a cage taken meanwhile sends the person back to the cage step with the typed reason kept', async ({ page, context }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Tôm');
    await dlg.locator('[data-pet-option]').first().click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByLabel('Lý do nhập viện').fill('Theo dõi hô hấp');
    await dlg.getByRole('radio', { name: 'Chuồng C5' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByText('Bước 3/3')).toBeVisible();

    const other = await context.newPage();
    await openStaff(other, '/nv/noi-tru', 'bacsi_mai');
    await admit(other, { search: 'Đậu', cage: 'C5' });
    await expect(toast(other, /Đã nhập viện Đậu/)).toBeVisible();

    await dlg.getByRole('button', { name: 'Nhập viện', exact: true }).click();
    await expect(dlg.getByText('Chuồng này đang có bé ở.')).toBeVisible();
    await expect(dlg.getByText('Bước 2/3')).toBeVisible();
    await expect(dlg.getByLabel('Lý do nhập viện')).toHaveValue('Theo dõi hô hấp');
    await expect(dlg.getByRole('radio', { name: 'Chuồng C5' })).toHaveCount(0);
  });

  test('a pet without a weight starts with no day charge; one with a weight gets the suggested line', async ({ page }) => {
    await openStaff(page, '/nv/noi-tru', 'bacsi_mai');
    await main(page).getByRole('button', { name: 'Nhập viện', exact: true }).click();
    const dlg = page.getByRole('dialog');
    const toStep3 = async (search: string, cage: string) => {
      await dlg.getByRole('searchbox', { name: SEARCH }).fill(search);
      await dlg.locator('[data-pet-option]').first().click();
      await dlg.getByRole('button', { name: 'Tiếp' }).click();
      await dlg.getByLabel('Lý do nhập viện').fill('Theo dõi');
      await dlg.getByRole('radio', { name: `Chuồng ${cage}` }).click();
      await dlg.getByRole('button', { name: 'Tiếp' }).click();
    };
    await toStep3('Tôm', 'C2');
    await expect(dlg.getByText('Hồ sơ bé chưa có cân nặng nên chưa ghi tiền nội trú.')).toBeVisible();
    await dlg.getByRole('button', { name: 'Quay lại' }).click();
    await dlg.getByRole('button', { name: 'Quay lại' }).click();
    await dlg.getByRole('searchbox', { name: SEARCH }).fill('Bông');
    await dlg.locator('[data-pet-option]').first().click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await dlg.getByRole('button', { name: 'Tiếp' }).click();
    await expect(dlg.getByLabel('Dòng tiền nội trú')).toHaveValue('pi-LT02');
  });
});
