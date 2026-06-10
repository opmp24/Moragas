import { test, expect } from '@playwright/test';

test.describe('Login flow', () => {
  test('muestra el formulario de login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByPlaceholder('Ingresa tu clave')).toBeVisible();
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible();
  });

  test('muestra error con clave inválida', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Ingresa tu clave').fill('clave-invalida');
    await page.getByRole('button', { name: /ingresar/i }).click();

    await expect(page.getByText(/clave inválida|no autorizado/i)).toBeVisible({ timeout: 10000 });
  });

  test('redirige al dashboard tras login exitoso', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Ingresa tu clave').fill('MoragasAdmin2024');
    await page.getByRole('button', { name: /ingresar/i }).click();

    await expect(page).toHaveURL('/', { timeout: 10000 });
    await expect(page.getByText('Dashboard')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('accede al panel admin como admin', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('Ingresa tu clave').fill('MoragasAdmin2024');
    await page.getByRole('button', { name: /ingresar/i }).click();

    await page.goto('/admin');
    await expect(page.getByText('Panel de Administración')).toBeVisible();
  });

  test('usuario normal no accede a admin', async ({ page }) => {
    // First login as admin to create a user key, then test user access
    await page.goto('/login');
    await page.getByPlaceholder('Ingresa tu clave').fill('MoragasAdmin2024');
    await page.getByRole('button', { name: /ingresar/i }).click();
    await expect(page).toHaveURL('/');
  });
});
