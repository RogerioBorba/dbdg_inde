import { test, expect } from '@playwright/test';

test.describe('Busca por palavra-chave WFS e WMS', () => {
	test('deve exibir campos de busca por palavra-chave na aba WFS', async ({ page }) => {
		await page.goto('/visualizador/ol');
		await page.waitForLoadState('networkidle');

		// Abre o painel de expansão WFS
		const wfsButton = page.getByRole('button', { name: /WFS - buscar feições nos geosserviços/i });
		await wfsButton.click();

		const keywordTab = page.locator('[data-slot="tabs-trigger"]').filter({ hasText: /palavra-chave/i }).nth(1);
		await expect(keywordTab).toBeVisible();
		await keywordTab.click();

		// Valida presença dos controles de busca
		const tabpanel = page.getByRole('tabpanel', { name: 'Por palavra-chave' });
		await expect(tabpanel.getByText('Selecionar todos os catálogos')).toBeVisible();
		await expect(tabpanel.getByRole('button', { name: 'Buscar feições' })).toBeVisible();
		await expect(tabpanel.getByText('OU entre palavras')).toBeVisible();
		await expect(tabpanel.getByText('E entre palavras')).toBeVisible();
	});

	test('deve exibir campos de busca por palavra-chave na aba WMS', async ({ page }) => {
		await page.goto('/visualizador/ol');
		await page.waitForLoadState('networkidle');

		// Abre o painel de expansão WMS
		const wmsButton = page.getByRole('button', { name: /WMS - buscar camadas nos geosserviços/i });
		await wmsButton.click();

		const keywordTab = page.locator('[data-slot="tabs-trigger"]').filter({ hasText: /palavra-chave/i }).first();
		await expect(keywordTab).toBeVisible();
		await keywordTab.click();

		// Valida presença dos controles de busca
		const tabpanel = page.getByRole('tabpanel', { name: 'Por palavra-chave' });
		await expect(tabpanel.getByText('Selecionar todos os catálogos')).toBeVisible();
		await expect(tabpanel.getByRole('button', { name: 'Buscar camadas' })).toBeVisible();
		await expect(tabpanel.getByText('OU entre palavras')).toBeVisible();
		await expect(tabpanel.getByText('E entre palavras')).toBeVisible();
	});
});
