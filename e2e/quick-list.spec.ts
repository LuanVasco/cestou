import { expect, test } from '@playwright/test'
import type { ShoppingList } from '../src/types'
import type { Page } from '@playwright/test'

async function create(page: Page, name: string, template = 'empty') {
  await page.goto('/#/')
  await page.getByRole('button', { name: 'Nova lista', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Começar com').selectOption(template)
  await dialog.getByLabel('Nome da lista', { exact: true }).fill(name)
  await dialog.getByLabel(/^Quanto você quer gastar/).fill('150,00')
  await dialog.getByRole('button', { name: 'Criar lista', exact: true }).click()
  await expect(page.getByRole('heading', { name, exact: true })).toBeVisible()
}

test('cria um modelo editável sem estimativas inventadas e persiste os itens', async ({
  page,
}) => {
  await create(page, 'Minha limpeza', 'cleaning')
  await expect(page.getByRole('listitem')).toHaveCount(5)
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Detergente · frasco' }),
  ).toContainText('2 unidades')
  await expect(page.getByText('sem estimativa', { exact: true })).toHaveCount(5)
  await page.reload()
  await expect(page.getByRole('listitem')).toHaveCount(5)
  await expect(page.locator('body')).toHaveJSProperty(
    'scrollWidth',
    await page.locator('body').evaluate((body) => body.clientWidth),
  )
})

test('revisa inclusão em lote, corrige categoria e ignora produtos já presentes', async ({
  page,
}) => {
  await create(page, 'Compra rápida')
  await page
    .getByRole('button', { name: 'Preencher rápido', exact: true })
    .click()
  let dialog = page.getByRole('dialog')
  await dialog
    .getByLabel('Quais produtos você precisa?')
    .fill('2 leites, arroz, café')
  await dialog.getByRole('button', { name: 'Revisar produtos' }).click()
  await dialog.getByLabel('Produto 1', { exact: true }).fill('Leite integral')
  await dialog
    .getByRole('combobox', { name: 'Categoria 1', exact: true })
    .selectOption('Laticínios')
  await dialog.getByRole('button', { name: 'Adicionar 3 produtos' }).click()
  await expect(page.getByRole('listitem')).toHaveCount(3)
  await expect(
    page.getByRole('listitem').filter({ hasText: 'Leite integral' }),
  ).toContainText('2 unidades')
  await page
    .getByRole('button', { name: 'Preencher rápido', exact: true })
    .click()
  dialog = page.getByRole('dialog')
  await dialog.getByLabel('Quais produtos você precisa?').fill('arroz, feijão')
  await dialog.getByRole('button', { name: 'Revisar produtos' }).click()
  await expect(
    dialog.getByText('Já está na lista', { exact: true }),
  ).toBeVisible()
  await dialog
    .getByRole('button', { name: 'Adicionar 1 produto', exact: true })
    .click()
  await page.reload()
  await expect(page.getByRole('listitem')).toHaveCount(4)
})

test('guarda favorito independentemente da lista original e reutiliza sem marcar como comprado', async ({
  page,
}) => {
  await create(page, 'Origem', 'breakfast')
  await page
    .getByRole('button', { name: 'Favoritar Café · pacote', exact: true })
    .click()
  await page
    .getByRole('button', { name: 'Excluir Café · pacote', exact: true })
    .click()
  await page.reload()
  await create(page, 'Destino')
  await page
    .getByRole('button', { name: 'Preencher rápido', exact: true })
    .click()
  const dialog = page.getByRole('dialog')
  await dialog
    .getByRole('button', { name: 'Favoritos (1)', exact: true })
    .click()
  await dialog.getByRole('checkbox').check()
  await dialog
    .getByRole('button', { name: 'Adicionar 1 produto', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: 'Comprar Café · pacote', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Favoritar Café · pacote', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await page
    .getByRole('button', { name: 'Favoritar Café · pacote', exact: true })
    .click()
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Favoritar Café · pacote', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
})

test('repete uma compra concluída preservando o original e usando preço anterior como estimativa', async ({
  page,
}) => {
  await page.goto('/#/')
  await page.getByRole('button', { name: /^Concluídas/ }).click()
  const card = page.getByRole('article').first()
  const name = await card.getByRole('heading').innerText()
  const original = (await page.evaluate((name) => {
    const state = JSON.parse(
      localStorage.getItem('cestou.shopping-lists')!,
    ).state
    return state.lists.find((list: { name: string }) => list.name === name)
  }, name)) as ShoppingList
  await card
    .getByRole('button', { name: 'Repetir compra', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: `${name} · nova`, exact: true }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: /^Desmarcar / })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /^Comprar / })).not.toHaveCount(
    0,
  )
  const copied = (await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('cestou.shopping-lists')!).state.lists[0],
  )) as ShoppingList
  expect(copied.id).not.toBe(original.id)
  expect(copied.budgetCents).toBe(original.budgetCents)
  expect(copied.items.map((item) => item.estimatedPriceCents)).toEqual(
    original.items.map(
      (item) => item.paidPriceCents ?? item.estimatedPriceCents,
    ),
  )
  expect(
    copied.items.every(
      (item) => !item.purchased && item.paidPriceCents === null,
    ),
  ).toBe(true)
  await page.reload()
  await expect(
    page.getByRole('heading', { name: `${name} · nova`, exact: true }),
  ).toBeVisible()
  await page.getByRole('link', { name: 'Minhas listas', exact: true }).click()
  await page.getByRole('button', { name: /^Concluídas/ }).click()
  await expect(
    page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name, exact: true }) }),
  ).toHaveCount(1)
})
