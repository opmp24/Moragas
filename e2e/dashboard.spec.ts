import { test, expect } from '@playwright/test';

const ADMIN_KEY = '48291637';

test.describe('Dashboard tabs', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('login');
    await page.getByPlaceholder('Ingresa tu clave').fill(ADMIN_KEY);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/Moragas\/?$/, { timeout: 15000 });
  });

  test('renderiza los tabs Gasto e Ingreso', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Gasto' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ingreso' })).toBeVisible();
  });

  test('tab Gasto muestra graficos de gasto por defecto', async ({ page }) => {
    await expect(page.getByText('Gastos por Mes')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gastos por Categoría', exact: true })).toBeVisible();
  });

  test('cambia al tab Ingreso y muestra sus graficos', async ({ page }) => {
    await page.getByRole('button', { name: 'Ingreso' }).click();
    await expect(page.getByText('Ingresos por Mes')).toBeVisible();
    await expect(page.getByText('Ingresos por Usuario (Total)')).toBeVisible();
    await expect(page.locator('text=Gastos por Mes')).toHaveCount(0);
  });
});

test.describe('Dashboard historial', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('login');
    await page.getByPlaceholder('Ingresa tu clave').fill(ADMIN_KEY);
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/Moragas\/?$/, { timeout: 15000 });
  });

  test('muestra la tabla de historial', async ({ page }) => {
    await expect(page.getByText('Historial')).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /fecha/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /monto/i })).toBeVisible();
  });

  test('filtra por categoria', async ({ page }) => {
    const selects = page.locator('select');
    const catSelect = selects.first();
    const optionCount = await catSelect.locator('option').count();
    if (optionCount > 1) {
      await catSelect.selectOption('comida');
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
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('ordena al hacer click en headers', async ({ page }) => {
    const montoHeader = page.getByRole('columnheader', { name: /monto/i });
    await montoHeader.click();
    await expect(montoHeader).toContainText('▼');
  });
});
