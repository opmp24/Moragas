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

  test('tab Ingreso muestra graficos de ingreso por defecto', async ({ page }) => {
    await expect(page.getByText('Ingresos por Mes')).toBeVisible();
    await expect(page.getByText('Ingresos por Usuario (Total)')).toBeVisible();
  });

  test('cambia al tab Gasto y muestra sus graficos', async ({ page }) => {
    await page.getByRole('button', { name: 'Gasto' }).click();
    await expect(page.getByText('Gastos por Mes')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Gastos por Categoría', exact: true })).toBeVisible();
    await expect(page.locator('text=Ingresos por Mes')).toHaveCount(0);
  });
});
