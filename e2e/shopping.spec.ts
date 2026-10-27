import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function createList(page: Page, name: string, budget: string) {
  await page.getByRole('button', { name: 'Nova lista', exact: true }).click()
  const dialog = page.getByRole('dialog', {
    name: 'Uma nova boa compra',
    exact: true,
  })
  await dialog.getByLabel('Nome da lista', { exact: true }).fill(name)
  await dialog.getByLabel(/^Quanto você quer gastar\?/).fill(budget)
  await dialog.getByRole('button', { name: 'Criar lista', exact: true }).click()
  await expect(page).toHaveURL(/#\/lista\/[^/]+$/)
  await expect(
    page.getByRole('heading', { name, level: 1, exact: true }),
  ).toBeVisible()
}

async function addProduct(
  page: Page,
  product: {
    name: string
    quantity?: string
    category?: string
    price?: string
  },
) {
  await page
    .getByRole('button', { name: 'Adicionar mais um item', exact: true })
    .click()
  const dialog = page.getByRole('dialog', {
    name: 'O que vai na sua cesta?',
    exact: true,
  })
  await dialog.getByLabel('Produto', { exact: true }).fill(product.name)
  await dialog
    .getByRole('spinbutton', { name: 'Quantidade', exact: true })
    .fill(product.quantity ?? '1')
  await dialog
    .getByRole('combobox', { name: 'Categoria', exact: true })
    .selectOption(product.category ?? 'Mercearia')
  if (product.price !== undefined)
    await dialog.getByLabel(/^Preço estimado por unidade/).fill(product.price)
  await dialog
    .getByRole('button', { name: 'Adicionar produto', exact: true })
    .click()
  await expect(productRow(page, product.name)).toBeVisible()
}

function productRow(page: Page, name: string) {
  return page
    .getByRole('listitem')
    .filter({ has: page.getByText(name, { exact: true }) })
}

function budgetPanel(page: Page) {
  return page.getByRole('complementary', {
    name: 'Acompanhamento do orçamento',
    exact: true,
  })
}

async function buyProduct(page: Page, name: string, price: string) {
  await page
    .getByRole('button', { name: `Comprar ${name}`, exact: true })
    .click()
  const dialog = page.getByRole('dialog', {
    name: 'Encontrou o que precisava?',
    exact: true,
  })
  await dialog.getByLabel(/^Qual o preço por unidade\?/).fill(price)
  await dialog
    .getByRole('button', { name: 'Colocar no carrinho', exact: true })
    .click()
  await expect(
    page.getByRole('button', { name: `Desmarcar ${name}`, exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
}

async function reloadList(page: Page, name: string) {
  await page.reload()
  await expect(
    page.getByRole('heading', { name, level: 1, exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Salvo aqui', exact: true }),
  ).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.goto('/#/')
  await expect(
    page.getByRole('heading', {
      name: 'Suas compras, sem surpresas.',
      exact: true,
    }),
  ).toBeVisible()
})

test('cria uma lista vazia e a recupera após recarregar', async ({ page }) => {
  const name = 'Compras de sábado'
  await createList(page, name, '180,00')

  await expect(budgetPanel(page).getByText(/^R\$\s*180,00$/)).toBeVisible()
  await expect(
    page.getByRole('heading', {
      name: 'Uma lista cheia de possibilidades',
      exact: true,
    }),
  ).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Finalizar compra', exact: true }),
  ).toBeDisabled()

  await reloadList(page, name)
  await expect(budgetPanel(page).getByText(/^R\$\s*180,00$/)).toBeVisible()
  await expect(page.getByRole('listitem')).toHaveCount(0)

  await page.getByRole('link', { name: 'Minhas listas', exact: true }).click()
  await expect(
    page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name, exact: true }) }),
  ).toHaveCount(1)
})

test('inclui produtos com quantidade, categoria e estimativa e recupera os dados', async ({
  page,
}) => {
  const name = 'Hortifruti da semana'
  await createList(page, name, '100,00')
  await addProduct(page, {
    name: 'Maçã gala',
    quantity: '3',
    category: 'Hortifruti',
    price: '2,50',
  })
  await addProduct(page, { name: 'Pão integral', category: 'Padaria' })

  await reloadList(page, name)
  await expect(page.getByRole('listitem')).toHaveCount(2)
  await expect(productRow(page, 'Maçã gala')).toContainText('3 unidades')
  await expect(productRow(page, 'Maçã gala')).toContainText(/R\$\s*7,50/)
  await expect(productRow(page, 'Pão integral')).toContainText('sem estimativa')
  await expect(budgetPanel(page)).toContainText('Previsão parcial da compra')
  await expect(budgetPanel(page)).toContainText('1 item sem preço estimado')

  await page
    .getByRole('button', { name: 'Editar Maçã gala', exact: true })
    .click()
  const dialog = page.getByRole('dialog', {
    name: 'Cada detalhe faz diferença',
    exact: true,
  })
  await expect(
    dialog.getByRole('spinbutton', { name: 'Quantidade', exact: true }),
  ).toHaveValue('3')
  await expect(
    dialog.getByRole('combobox', { name: 'Categoria', exact: true }),
  ).toHaveValue('Hortifruti')
  await expect(dialog.getByLabel(/^Preço estimado por unidade/)).toHaveValue(
    '2,50',
  )
})

test('valida a alteração do orçamento e mantém o novo valor ao recarregar', async ({
  page,
}) => {
  const name = 'Reposição da despensa'
  await createList(page, name, '200,00')
  await page
    .getByRole('button', { name: 'Editar orçamento', exact: true })
    .click()
  const dialog = page.getByRole('dialog', {
    name: 'Um orçamento que acompanha você',
    exact: true,
  })
  await dialog.getByLabel(/^Novo orçamento/).fill('0')
  await dialog
    .getByRole('button', { name: 'Salvar orçamento', exact: true })
    .click()
  await expect(dialog.getByRole('alert')).toHaveText(
    'O orçamento deve ser maior que zero.',
  )

  await dialog.getByLabel(/^Novo orçamento/).fill('85,50')
  await dialog
    .getByRole('button', { name: 'Salvar orçamento', exact: true })
    .click()
  await expect(dialog).not.toBeVisible()
  await reloadList(page, name)
  await expect(budgetPanel(page).getByText(/^R\$\s*85,50$/)).toBeVisible()

  await page
    .getByRole('button', { name: 'Editar orçamento', exact: true })
    .click()
  await expect(
    page.getByRole('dialog').getByLabel(/^Novo orçamento/),
  ).toHaveValue('85,50')
})

test('registra o preço pago e preserva quantidades e marcações do carrinho', async ({
  page,
}) => {
  const name = 'Café da manhã'
  await createList(page, name, '100,00')
  await addProduct(page, {
    name: 'Iogurte natural',
    quantity: '3',
    category: 'Laticínios',
    price: '5,00',
  })
  await addProduct(page, { name: 'Granola', price: '12,90' })
  await buyProduct(page, 'Iogurte natural', '4,75')

  await reloadList(page, name)
  await expect(
    page.getByRole('button', {
      name: 'Desmarcar Iogurte natural',
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(
    page.getByRole('button', { name: 'Comprar Granola', exact: true }),
  ).toHaveAttribute('aria-pressed', 'false')
  await expect(productRow(page, 'Iogurte natural')).toContainText(/R\$\s*14,25/)
  await expect(productRow(page, 'Iogurte natural')).toContainText('preço pago')
  await expect(budgetPanel(page).getByText(/^R\$\s*14,25$/)).toBeVisible()
  await expect(budgetPanel(page).getByText(/^R\$\s*27,15$/)).toBeVisible()

  await page
    .getByRole('button', { name: 'Editar Iogurte natural', exact: true })
    .click()
  await expect(
    page.getByRole('dialog').getByLabel(/^Preço pago por unidade/),
  ).toHaveValue('4,75')
})

test('conclui o fluxo completo e restaura o resumo com os valores pagos', async ({
  page,
  context,
}) => {
  const name = 'Compra completa da semana'

  await test.step('Criar a lista e incluir produtos', async () => {
    await createList(page, name, '100,00')
    await addProduct(page, {
      name: 'Café moído',
      quantity: '2',
      price: '20,00',
    })
    await addProduct(page, {
      name: 'Leite integral',
      category: 'Laticínios',
      price: '6,50',
    })
  })

  await test.step('Ajustar o orçamento e registrar a compra', async () => {
    await page
      .getByRole('button', { name: 'Editar orçamento', exact: true })
      .click()
    const dialog = page.getByRole('dialog', {
      name: 'Um orçamento que acompanha você',
      exact: true,
    })
    await dialog.getByLabel(/^Novo orçamento/).fill('120,00')
    await dialog
      .getByRole('button', { name: 'Salvar orçamento', exact: true })
      .click()
    await buyProduct(page, 'Café moído', '17,90')
    await reloadList(page, name)
    await expect(budgetPanel(page).getByText(/^R\$\s*120,00$/)).toBeVisible()
    await expect(budgetPanel(page).getByText(/^R\$\s*35,80$/)).toBeVisible()
    await expect(budgetPanel(page).getByText(/^R\$\s*42,30$/)).toBeVisible()
  })

  await test.step('Finalizar somente os produtos comprados', async () => {
    await page
      .getByRole('button', { name: 'Finalizar compra', exact: true })
      .click()
    const dialog = page.getByRole('dialog', {
      name: 'Tudo certo para fechar a compra?',
      exact: true,
    })
    await expect(dialog.getByText(/^R\$\s*35,80$/)).toBeVisible()
    await expect(dialog).toContainText('1 ficam para a próxima')
    await dialog.getByRole('button', { name: 'Finalizar', exact: true }).click()
    await expect(page).toHaveURL(/#\/resumo\/[^/]+$/)
    await expect(page.getByRole('region', { name, exact: true })).toBeVisible()
  })

  await test.step('Recuperar a compra concluída após recarregar', async () => {
    await page.reload()
    const receipt = page.getByRole('region', { name, exact: true })
    await expect(receipt.getByRole('listitem')).toHaveCount(1)
    await expect(receipt).toContainText('Concluída')
    await expect(receipt).toContainText(/Total da compra\s*R\$\s*35,80/)
    await expect(receipt).toContainText('Café moído')
    await expect(
      receipt.getByText('Leite integral', { exact: true }),
    ).toHaveCount(0)
    await expect(
      page.getByRole('heading', { name: 'Ficou para a próxima', exact: true }),
    ).toBeVisible()
    await expect(
      page.getByText('Leite integral.', { exact: true }),
    ).toBeVisible()
  })

  await test.step('Reabrir a compra em outra aba do mesmo navegador', async () => {
    const reopened = await context.newPage()
    await reopened.goto(page.url())
    await expect(
      reopened.getByRole('region', { name, exact: true }),
    ).toContainText(/Total da compra\s*R\$\s*35,80/)
    await reopened.close()
  })
})
