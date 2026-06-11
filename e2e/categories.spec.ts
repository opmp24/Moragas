import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:8888';

async function loginAsAdmin(page: any) {
  await page.goto(`${BASE}/login`);
  await page.waitForSelector('input[placeholder*="clave"]', { timeout: 10000 });
  await page.getByPlaceholder('Ingresa tu clave').fill('MoragasAdmin2024');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForTimeout(1000);
  await page.goto(`${BASE}/admin`);
  await page.waitForTimeout(2000);
}

function categoryCard(page: any, name: string) {
  return page.locator(`xpath=//p[text()="${name}"]/ancestor::div[contains(@class, "rounded-lg")]`).first();
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test('1. Crear una categoría', async ({ page }) => {
  const catName = `Test-${Date.now()}`;

  // Fill the name input (first input in the last form before the category list)
  await page.locator('input[placeholder="Nombre"]').fill(catName);

  // Click Ingreso toggle in the same form
  await page.locator('xpath=//input[@placeholder="Nombre"]/following-sibling::div//button[text()="Ingreso"]').click();

  // Click Agregar
  await page.locator('button:has-text("Agregar")').last().click();
  await page.waitForTimeout(1500);

  // Verify category card exists
  await expect(categoryCard(page, catName)).toBeVisible({ timeout: 5000 });
});

test('2. Editar una categoría', async ({ page }) => {
  const originalName = `EditTest-${Date.now()}`;
  const newName = `${originalName}-modificado`;

  // Create category
  await page.locator('input[placeholder="Nombre"]').fill(originalName);
  await page.locator('button:has-text("Agregar")').last().click();
  await page.waitForTimeout(1500);

  await expect(categoryCard(page, originalName)).toBeVisible({ timeout: 3000 });

  // Click edit button
  await categoryCard(page, originalName).locator('button[title="Editar categoría"]').click();
  await page.waitForTimeout(500);

  // Input should have the name
  const nameInput = page.locator('input[placeholder="Nombre"]');
  await expect(nameInput).toHaveValue(originalName);

  // Change name and save
  await nameInput.fill(newName);
  await page.locator('button:has-text("Guardar")').click();
  await page.waitForTimeout(1500);

  // New name should be visible
  await expect(categoryCard(page, newName)).toBeVisible({ timeout: 5000 });

  // Old name card should not exist
  await expect(categoryCard(page, originalName)).toHaveCount(0);
});

test('3. Eliminar una categoría', async ({ page }) => {
  const catName = `DeleteTest-${Date.now()}`;

  // Create category
  await page.locator('input[placeholder="Nombre"]').fill(catName);
  await page.locator('button:has-text("Agregar")').last().click();
  await page.waitForTimeout(1500);

  await expect(categoryCard(page, catName)).toBeVisible({ timeout: 3000 });

  // Click delete button
  await categoryCard(page, catName).locator('button[title="Eliminar categoría"]').click();
  await page.waitForTimeout(500);

  // Confirm delete
  await page.locator('button:has-text("Sí, eliminar")').click();
  await page.waitForTimeout(1500);

  // Category should be gone
  await expect(categoryCard(page, catName)).toHaveCount(0);
});
