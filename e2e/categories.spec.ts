import { test, expect } from '@playwright/test';

const ADMIN_KEY = '48291637';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('login');
  await page.getByPlaceholder('Ingresa tu clave').fill(ADMIN_KEY);
  await page.locator('button[type="submit"]').first().click();
  await expect(page).toHaveURL(/\/Moragas\/?$/, { timeout: 15000 });
}

function categoryCard(page: import('@playwright/test').Page, name: string) {
  return page.locator(`xpath=//p[text()="${name}"]/ancestor::div[contains(@class, "rounded-lg")]`).first();
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto('admin');
  await expect(page.getByRole('heading', { name: /Panel de Administración/i })).toBeVisible({ timeout: 10000 });
});

test('Crear una categoría', async ({ page }) => {
  const catName = `Test-${Date.now()}`;

  await page.locator('input[placeholder="Nombre"]').fill(catName);
  await page.locator('button:has-text("Agregar")').last().click();
  await page.waitForTimeout(1500);

  await expect(categoryCard(page, catName)).toBeVisible({ timeout: 5000 });
});

test('Editar una categoría', async ({ page }) => {
  const originalName = `EditTest-${Date.now()}`;
  const newName = `${originalName}-modificado`;

  await page.locator('input[placeholder="Nombre"]').fill(originalName);
  await page.locator('button:has-text("Agregar")').last().click();
  await page.waitForTimeout(1500);

  await expect(categoryCard(page, originalName)).toBeVisible({ timeout: 3000 });

  await categoryCard(page, originalName).locator('button[title="Editar categoría"]').click();
  await page.waitForTimeout(500);

  const nameInput = page.locator('input[placeholder="Nombre"]');
  await expect(nameInput).toHaveValue(originalName);

  await nameInput.fill(newName);
  await page.locator('button:has-text("Guardar")').last().click();
  await page.waitForTimeout(1500);

  await expect(categoryCard(page, newName)).toBeVisible({ timeout: 5000 });
  await expect(categoryCard(page, originalName)).toHaveCount(0);
});

test('Eliminar una categoría', async ({ page }) => {
  const catName = `DeleteTest-${Date.now()}`;

  await page.locator('input[placeholder="Nombre"]').fill(catName);
  await page.locator('button:has-text("Agregar")').last().click();
  await page.waitForTimeout(1500);

  await expect(categoryCard(page, catName)).toBeVisible({ timeout: 3000 });

  await categoryCard(page, catName).locator('button[title="Eliminar categoría"]').click();
  await page.waitForTimeout(1500);

  await expect(categoryCard(page, catName)).toHaveCount(0);
});
