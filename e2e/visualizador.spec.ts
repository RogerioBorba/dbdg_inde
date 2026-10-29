import { test, expect } from '@playwright/test';

test.describe('Visualizador OpenLayers', () => {
	test('deve carregar a página do visualizador', async ({ page }) => {
		await page.goto('/visualizador/ol');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText('Ferramentas')).toBeVisible();
	});

	test('deve manter o mapa base ao sair e retornar ao visualizador', async ({ page }) => {
		// Começa na home
		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Navega para o visualizador
		await page.locator('a[href="/visualizador/ol"]').first().click();
		await page.waitForURL('**/visualizador/ol');
		await expect(page.locator('#id_map canvas').first()).toBeVisible({ timeout: 10000 });

		// Clica no link 'home' na sidebar para sair do visualizador
		await page.locator('a[href="/"]').first().click();
		await page.waitForURL(url => url.pathname === '/');

		// Retorna ao visualizador via link da navbar
		await page.locator('a[href="/visualizador/ol"]').first().click();
		await page.waitForURL('**/visualizador/ol');

		// Verifica se o canvas do mapa base existe e continua visível
		const canvas = page.locator('#id_map canvas').first();
		await expect(canvas).toBeVisible({ timeout: 10000 });
	});
});
