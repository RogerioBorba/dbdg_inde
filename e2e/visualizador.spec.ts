import { test, expect } from '@playwright/test';

test.describe('Visualizador OpenLayers', () => {
	test('deve carregar a página do visualizador', async ({ page }) => {
		await page.goto('/visualizador/ol');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText('Ferramentas')).toBeVisible();
	});
});
