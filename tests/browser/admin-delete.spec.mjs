import { test, expect } from '@playwright/test';

for (const outcome of ['cancel', 'success', 'failure']) {
  test(`permanent family deletion: ${outcome}`, async ({ page }) => {
    const family = { slug: 'delete-example', familyTreeName: 'Keluarga Uji Hapus', members: {} };
    let deleted = false;
    let deleteRequests = 0;
    await page.route('**/api/data?**', async (route) => {
      const url = new URL(route.request().url());
      const action = url.searchParams.get('action');
      if (route.request().method() === 'DELETE') {
        deleteRequests++;
        expect(url.searchParams.get('slug')).toBe(family.slug);
        if (outcome === 'failure') return route.fulfill({ status: 500, json: { error: 'Gagal menghapus data uji.' } });
        deleted = true;
        return route.fulfill({ json: { success: true } });
      }
      const body = action === 'session' ? { isAdmin: true }
        : action === 'trees' ? (deleted ? [] : [{ id: 'test-id', slug: family.slug, tree_name: family.familyTreeName }])
        : family;
      await route.fulfill({ json: body });
    });
    await page.goto('/admin/manage');
    await page.evaluate((data) => localStorage.setItem(`family_tree_data_${data.slug}`, JSON.stringify(data)), family);
    const deleteButton = page.getByRole('button', { name: `Hapus permanen ${family.familyTreeName}`, exact: true });
    await expect(deleteButton).toBeVisible();
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain(family.familyTreeName);
      expect(dialog.message()).toContain('tidak dapat dibatalkan');
      if (outcome === 'cancel') await dialog.dismiss();
      else await dialog.accept();
    });
    await deleteButton.click();
    if (outcome === 'success') {
      await expect(page.getByRole('status')).toContainText('berhasil dihapus permanen');
      await expect(deleteButton).toHaveCount(0);
      expect(await page.evaluate((slug) => localStorage.getItem(`family_tree_data_${slug}`), family.slug)).toBeNull();
      await page.reload();
      await expect(page.getByText('Belum ada keluarga. Tambahkan keluarga untuk memulai.')).toBeVisible();
    } else {
      if (outcome === 'failure') await expect(page.getByRole('status')).toContainText('Keluarga belum dihapus');
      await expect(deleteButton).toBeEnabled();
      expect(await page.evaluate((slug) => localStorage.getItem(`family_tree_data_${slug}`), family.slug)).not.toBeNull();
    }
    expect(deleteRequests).toBe(outcome === 'cancel' ? 0 : 1);
  });
}
