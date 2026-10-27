import { useState } from 'react'
import type { GroceryItem, ShoppingList } from '../types'
import { formatMoney, getTotals } from '../lib/money'
import { Icon } from '../components/Icon'

interface Props {
  list: ShoppingList
  onAdd: () => void
  onEdit: (item: GroceryItem) => void
  onPurchase: (item: GroceryItem) => void
  onDelete: (item: GroceryItem) => void
  onFinish: () => void
  onEditBudget: () => void
  onDuplicate: () => void
}

export function ListPage({
  list,
  onAdd,
  onEdit,
  onPurchase,
  onDelete,
  onFinish,
  onEditBudget,
  onDuplicate,
}: Props) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all')
  const totals = getTotals(list)
  const filtered = list.items.filter(
    (item) =>
      filter === 'all' ||
      (filter === 'purchased' ? item.purchased : !item.purchased),
  )
  const categories = [...new Set(filtered.map((item) => item.category))]
  const forecastDifference = list.budgetCents - totals.projected
  const overBudget = totals.spent > list.budgetCents
  return (
    <div className="page list-page">
      <a href="#/" className="breadcrumb">
        <Icon name="ArrowLeft" size={16} />
        Minhas listas
      </a>
      <div className="page-heading detail-heading">
        <div className="detail-title">
          <span className={`list-emoji large ${list.color}`} aria-hidden="true">
            {list.emoji}
          </span>
          <div>
            <h1 id="page-title" tabIndex={-1}>
              {list.name}
            </h1>
            <p className="page-description">{list.description}</p>
          </div>
        </div>
        <div className="heading-actions">
          <button
            className="button button-secondary duplicate-button"
            onClick={onDuplicate}
          >
            <Icon name="Copy" size={17} />
            Duplicar
          </button>
          <button className="button button-primary" onClick={onAdd}>
            <Icon name="Plus" size={18} />
            Adicionar item
          </button>
        </div>
      </div>
      <div className="shopping-layout">
        <section className="shopping-items" aria-labelledby="items-title">
          <div className="shopping-progress">
            <span className="progress-check">
              <Icon name="ShoppingBasket" size={21} />
            </span>
            <div>
              <h2 id="items-title">Sua lista está tomando forma</h2>
              <p>
                {totals.purchased} de {list.items.length} itens já estão no
                carrinho
              </p>
            </div>
            <span className="progress-percent">{totals.progress}%</span>
            <div className="progress-track">
              <span style={{ width: `${totals.progress}%` }} />
            </div>
          </div>
          <div className="item-filters" aria-label="Filtrar produtos">
            {(
              [
                ['all', 'Todos', list.items.length],
                ['pending', 'Pendentes', totals.pending],
                ['purchased', 'No carrinho', totals.purchased],
              ] as const
            ).map(([value, label, count]) => (
              <button
                key={value}
                className={
                  filter === value ? 'filter-pill active' : 'filter-pill'
                }
                aria-pressed={filter === value}
                onClick={() => setFilter(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <div className="category-list">
            {categories.map((category) => (
              <section className="category-group" key={category}>
                <h3>
                  {category}
                  <span>
                    {
                      filtered.filter((item) => item.category === category)
                        .length
                    }
                  </span>
                </h3>
                <ul>
                  {filtered
                    .filter((item) => item.category === category)
                    .map((item) => (
                      <li
                        key={item.id}
                        className={`grocery-item ${item.purchased ? 'purchased' : ''}`}
                      >
                        <button
                          className="item-checkbox"
                          aria-label={
                            item.purchased
                              ? `Desmarcar ${item.name}`
                              : `Comprar ${item.name}`
                          }
                          aria-pressed={item.purchased}
                          onClick={() => onPurchase(item)}
                        >
                          {item.purchased && <Icon name="Check" size={15} />}
                        </button>
                        <span className="food-emoji" aria-hidden="true">
                          {item.emoji}
                        </span>
                        <div className="item-info">
                          <strong>{item.name}</strong>
                          <span>
                            {item.quantity}{' '}
                            {item.quantity === 1 ? 'unidade' : 'unidades'}
                            {item.purchased && (
                              <>
                                <span className="item-dot">·</span>no carrinho
                              </>
                            )}
                          </span>
                        </div>
                        <div className="item-price">
                          <strong>
                            {(item.purchased
                              ? item.paidPriceCents
                              : item.estimatedPriceCents) === null
                              ? '—'
                              : formatMoney(
                                  (item.purchased
                                    ? item.paidPriceCents!
                                    : item.estimatedPriceCents!) *
                                    item.quantity,
                                )}
                          </strong>
                          <span>
                            {item.purchased
                              ? 'preço pago'
                              : item.estimatedPriceCents === null
                                ? 'sem estimativa'
                                : 'estimativa'}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button
                            className="icon-button"
                            aria-label={`Editar ${item.name}`}
                            onClick={() => onEdit(item)}
                          >
                            <Icon name="Pencil" size={15} />
                          </button>
                          <button
                            className="icon-button delete-button"
                            aria-label={`Excluir ${item.name}`}
                            onClick={() => onDelete(item)}
                          >
                            <Icon name="Trash2" size={15} />
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
            {filtered.length === 0 && (
              <div className="empty-state">
                <Icon
                  name={
                    filter === 'purchased' ? 'ShoppingCart' : 'ClipboardList'
                  }
                  size={36}
                />
                <h3>
                  {filter === 'purchased'
                    ? 'Seu carrinho está esperando'
                    : filter === 'pending'
                      ? 'Tudo no carrinho!'
                      : 'Uma lista cheia de possibilidades'}
                </h3>
                <p>
                  {filter === 'purchased'
                    ? 'Marque um produto para começar sua compra.'
                    : filter === 'pending'
                      ? 'Você já pode finalizar sua compra.'
                      : 'Adicione o primeiro produto para começar.'}
                </p>
                {filter === 'all' && (
                  <button className="button button-primary" onClick={onAdd}>
                    <Icon name="Plus" size={17} />
                    Adicionar item
                  </button>
                )}
              </div>
            )}
          </div>
          <button className="add-item-inline" onClick={onAdd}>
            <Icon name="Plus" size={18} />
            Adicionar mais um item
          </button>
          <p className="list-footnote">
            <Icon name="Info" size={14} />
            Os preços estimados ajudam a planejar. Confirme o valor ao comprar.
          </p>
        </section>
        <aside
          className="budget-sidebar"
          aria-label="Acompanhamento do orçamento"
        >
          <section className={`budget-card ${overBudget ? 'over-budget' : ''}`}>
            <div className="budget-card-heading">
              <span>
                <Icon name="Wallet" size={20} />
                Seu orçamento
              </span>
              <button
                className="icon-button"
                aria-label="Editar orçamento"
                onClick={onEditBudget}
              >
                <Icon name="Pencil" size={16} />
              </button>
            </div>
            <div className="budget-amount">{formatMoney(list.budgetCents)}</div>
            <div className="budget-spent">
              <span>No carrinho</span>
              <strong>{formatMoney(totals.spent)}</strong>
            </div>
            <div
              className="budget-meter"
              role="progressbar"
              aria-label="Orçamento utilizado"
              aria-valuenow={Math.min(
                100,
                Math.round((totals.spent / list.budgetCents) * 100),
              )}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span
                style={{
                  width: `${Math.min(100, (totals.spent / list.budgetCents) * 100)}%`,
                }}
              />
            </div>
            <div className="budget-remaining">
              <Icon name={overBudget ? 'Info' : 'Check'} size={16} />
              <span>
                {formatMoney(Math.abs(totals.remaining))}{' '}
                {overBudget ? 'acima do orçamento' : 'disponíveis para gastar'}
              </span>
            </div>
            <div className="forecast-box">
              <span>
                Previsão {totals.unpriced ? 'parcial' : 'final'} da compra
                <Icon name="ReceiptText" size={15} />
              </span>
              <strong>{formatMoney(totals.projected)}</strong>
              <p className={forecastDifference < 0 ? 'text-warning' : ''}>
                {forecastDifference >= 0
                  ? `${formatMoney(forecastDifference)} de folga prevista`
                  : `${formatMoney(-forecastDifference)} acima do orçamento`}
              </p>
              {totals.unpriced > 0 && (
                <span className="unpriced-note">
                  <Icon name="Info" size={13} />
                  {totals.unpriced}{' '}
                  {totals.unpriced === 1
                    ? 'item sem preço estimado'
                    : 'itens sem preço estimado'}
                </span>
              )}
            </div>
            <button
              className="button button-primary finish-button"
              disabled={totals.purchased === 0}
              onClick={onFinish}
            >
              Finalizar compra
              <Icon name="ArrowRight" size={18} />
            </button>
            <span className="budget-caption">
              Você pode deixar itens para a próxima.
            </span>
          </section>
          <div className="gentle-tip">
            <Icon name="Sparkles" size={21} />
            <div>
              <strong>Uma escolha de cada vez.</strong>
              <p>
                Antes de colocar no carrinho, veja se o produto já está na sua
                lista.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
