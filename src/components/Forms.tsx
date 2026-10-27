import { useState } from 'react'
import type { FormEvent } from 'react'
import type { GroceryCategory, GroceryItem } from '../types'
import { formatMoney, parseMoney } from '../lib/money'
import { Icon } from './Icon'
import { listTemplates, type ProductDraft } from '../lib/quickList'

interface FormActions {
  onCancel: () => void
}
const moneyInput = (cents: number | null) =>
  cents === null ? '' : (cents / 100).toFixed(2).replace('.', ',')
const categories: GroceryCategory[] = [
  'Hortifruti',
  'Mercearia',
  'Laticínios',
  'Padaria',
  'Limpeza',
]

function ErrorMessage({ message }: { message: string }) {
  return message ? (
    <p className="form-error" role="alert">
      <Icon name="Info" size={15} />
      {message}
    </p>
  ) : null
}

export function ListForm({
  onCancel,
  onSave,
}: FormActions & {
  onSave: (name: string, budget: number, items: ProductDraft[]) => void
}) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const budget = parseMoney(String(data.get('budget')))
    if (!name) return setError('Dê um nome para sua lista.')
    if (budget === null || budget <= 0)
      return setError('Informe um orçamento maior que zero, como 250,00.')
    onSave(
      name,
      budget,
      listTemplates.find((template) => template.id === data.get('template'))
        ?.items ?? [],
    )
  }
  return (
    <form className="form" onSubmit={submit}>
      <label htmlFor="list-template">
        Começar com
        <select id="list-template" name="template" defaultValue="empty">
          <option value="empty">Lista vazia</option>
          {listTemplates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.emoji} {template.name} · {template.items.length}{' '}
              produtos
            </option>
          ))}
        </select>
        <small>
          Modelos editáveis, sem preços sugeridos. Escolha o que faz sentido
          para você.
        </small>
      </label>
      <label htmlFor="list-name">
        Nome da lista
        <input
          id="list-name"
          name="name"
          placeholder="Ex.: Compras da semana"
          maxLength={60}
          required
          autoFocus
        />
      </label>
      <label htmlFor="list-budget">
        Quanto você quer gastar?
        <div className="money-input">
          <span>R$</span>
          <input
            id="list-budget"
            name="budget"
            inputMode="decimal"
            placeholder="250,00"
            required
            maxLength={14}
            aria-describedby="budget-help"
          />
        </div>
        <small id="budget-help">
          Você pode ajustar o orçamento durante a compra.
        </small>
      </label>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button type="submit" className="button button-primary">
          Criar lista
          <Icon name="ArrowRight" size={17} />
        </button>
      </div>
    </form>
  )
}

export function ItemForm({
  item,
  onCancel,
  onSave,
}: FormActions & {
  item?: GroceryItem
  onSave: (
    values: Pick<
      GroceryItem,
      | 'name'
      | 'category'
      | 'quantity'
      | 'estimatedPriceCents'
      | 'paidPriceCents'
    >,
  ) => void
}) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const name = String(data.get('name')).trim()
    const quantity = Number(data.get('quantity'))
    const priceText = String(data.get('price')).trim()
    const price = priceText ? parseMoney(priceText) : null
    if (!name) return setError('Informe o nome do produto.')
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 9999)
      return setError('Use uma quantidade inteira entre 1 e 9.999.')
    if ((priceText && price === null) || (item?.purchased && price === null))
      return setError('Informe um preço válido, como 9,90.')
    onSave({
      name,
      quantity,
      category: String(data.get('category')) as GroceryCategory,
      estimatedPriceCents: item?.purchased ? item.estimatedPriceCents : price,
      paidPriceCents: item?.purchased ? price : null,
    })
  }
  return (
    <form className="form" onSubmit={submit}>
      <label htmlFor="item-name">
        Produto
        <input
          id="item-name"
          name="name"
          defaultValue={item?.name}
          placeholder="Ex.: Café moído · 500 g"
          maxLength={80}
          required
          autoFocus
        />
      </label>
      <div className="form-row">
        <label htmlFor="item-quantity">
          Quantidade
          <input
            id="item-quantity"
            name="quantity"
            type="number"
            min={1}
            max={9999}
            step={1}
            defaultValue={item?.quantity ?? 1}
            required
          />
        </label>
        <label htmlFor="item-category">
          Categoria
          <select
            id="item-category"
            name="category"
            defaultValue={item?.category ?? 'Mercearia'}
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
      </div>
      <label htmlFor="item-price">
        {item?.purchased
          ? 'Preço pago por unidade'
          : 'Preço estimado por unidade'}
        {!item?.purchased && <span className="optional">opcional</span>}
        <div className="money-input">
          <span>R$</span>
          <input
            id="item-price"
            name="price"
            inputMode="decimal"
            defaultValue={moneyInput(
              item?.purchased
                ? item.paidPriceCents
                : (item?.estimatedPriceCents ?? null),
            )}
            placeholder="0,00"
            maxLength={14}
            required={item?.purchased}
            aria-describedby="price-help"
          />
        </div>
        <small id="price-help">
          {item?.purchased
            ? 'O total será atualizado pela quantidade.'
            : 'Sem o preço, sua previsão será apresentada como parcial.'}
        </small>
      </label>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button type="submit" className="button button-primary">
          <Icon name={item ? 'Check' : 'Plus'} size={17} />
          {item ? 'Salvar alterações' : 'Adicionar produto'}
        </button>
      </div>
    </form>
  )
}

export function PurchaseForm({
  item,
  onCancel,
  onSave,
}: FormActions & { item: GroceryItem; onSave: (price: number) => void }) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const price = parseMoney(
      String(new FormData(event.currentTarget).get('price')),
    )
    if (price === null)
      return setError('Informe o preço por unidade, como 5,99.')
    onSave(price)
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="purchase-product">
        <span className="food-emoji" aria-hidden="true">
          {item.emoji}
        </span>
        <div>
          <strong>{item.name}</strong>
          <span>
            {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
          </span>
        </div>
      </div>
      <label htmlFor="purchase-price">
        Qual o preço por unidade?
        <div className="money-input">
          <span>R$</span>
          <input
            id="purchase-price"
            name="price"
            inputMode="decimal"
            defaultValue={moneyInput(item.estimatedPriceCents)}
            placeholder="0,00"
            required
            autoFocus
            maxLength={14}
            onFocus={(event) => event.target.select()}
          />
        </div>
        <small>
          {item.estimatedPriceCents !== null
            ? `Sua estimativa era ${formatMoney(item.estimatedPriceCents)} por unidade.`
            : 'Confirme o preço para atualizar o valor do carrinho.'}
        </small>
      </label>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button type="submit" className="button button-primary">
          <Icon name="ShoppingCart" size={17} />
          Colocar no carrinho
        </button>
      </div>
    </form>
  )
}

export function BudgetForm({
  budget,
  onCancel,
  onSave,
}: FormActions & { budget: number; onSave: (price: number) => void }) {
  const [error, setError] = useState('')
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = parseMoney(
      String(new FormData(event.currentTarget).get('budget')),
    )
    if (value === null || value <= 0)
      return setError('O orçamento deve ser maior que zero.')
    onSave(value)
  }
  return (
    <form className="form" onSubmit={submit}>
      <label htmlFor="edit-budget">
        Novo orçamento
        <div className="money-input">
          <span>R$</span>
          <input
            id="edit-budget"
            name="budget"
            defaultValue={moneyInput(budget)}
            inputMode="decimal"
            autoFocus
            required
            maxLength={14}
          />
        </div>
      </label>
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button
          type="button"
          className="button button-secondary"
          onClick={onCancel}
        >
          Cancelar
        </button>
        <button type="submit" className="button button-primary">
          Salvar orçamento
        </button>
      </div>
    </form>
  )
}
