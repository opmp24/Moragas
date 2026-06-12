import { test, expect } from '@playwright/test';

const ADMIN_KEY = '48291637';

test.describe('Movements page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('login');
    await page.getByPlaceholder('Ingresa tu clave').fill(ADMIN_KEY);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/Moragas\/?$/, { timeout: 15000 });
    await page.goto('movements');
    await expect(page.locator('h1')).toHaveText('Movimientos');
  });

  test('muestra la tabla de historial', async ({ page }) => {
    await expect(page.getByRole('columnheader', { name: /fecha/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /monto/i })).toBeVisible();
  });

  test('filtra por categoria', async ({ page }) => {
    await page.waitForTimeout(1000);
    const selects = page.locator('select');
    const catSelect = selects.first();
    const optionCount = await catSelect.locator('option').count();
    if (optionCount > 1) {
      await catSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      const rows = page.locator('table tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThanOrEqual(1);
    }
  });

  test('filtra por usuario', async ({ page }) => {
    const input = page.getByPlaceholder('Filtrar usuario…');
    await input.fill('Juan');
    await page.waitForTimeout(500);
    const empty = page.getByText('No hay transacciones');
    await expect(empty).toBeVisible();
  });

  test('ordena al hacer click en headers', async ({ page }) => {
    const montoHeader = page.getByRole('columnheader', { name: /monto/i });
    await montoHeader.click();
    await expect(montoHeader).toContainText('▼');
  });
});
