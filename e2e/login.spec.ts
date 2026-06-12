import { test, expect } from '@playwright/test';

const ADMIN_KEY = '48291637';

test.describe('Login flow', () => {
  test('muestra el formulario de login', async ({ page }) => {
    await page.goto('.');
    await expect(page.getByPlaceholder('Ingresa tu clave')).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();
  });

  test('muestra error con clave invalida', async ({ page }) => {
    await page.goto('login');
    await page.getByPlaceholder('Ingresa tu clave').fill('00000000');
    await page.getByRole('button', { name: /ingresar/i }).click();

    await expect(page.locator('.bg-red-500\\/10')).toBeVisible({ timeout: 15000 });
  });

  test('redirige al dashboard tras login exitoso', async ({ page }) => {
    await page.goto('login');
    await page.getByPlaceholder('Ingresa tu clave').fill(ADMIN_KEY);
    await page.getByRole('button', { name: /ingresar/i }).click();

    await expect(page).toHaveURL(/\/Moragas\/?$/, { timeout: 15000 });
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Navigation', () => {
  test('accede al panel admin como admin', async ({ page }) => {
    await page.goto('login');
    await page.getByPlaceholder('Ingresa tu clave').fill(ADMIN_KEY);
    await page.getByRole('button', { name: /ingresar/i }).click();

    await expect(page).toHaveURL(/\/Moragas\/?$/, { timeout: 15000 });
    await page.goto('admin');

    await expect(page.getByRole('heading', { name: /Panel de Administración/i })).toBeVisible({ timeout: 10000 });
  });
});
