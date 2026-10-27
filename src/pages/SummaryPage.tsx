import type { ShoppingList } from '../types'
import { formatDate, formatMoney, getTotals } from '../lib/money'
import { Icon } from '../components/Icon'

export function SummaryPage({
  list,
  onReuse,
}: {
  list: ShoppingList
  onReuse: () => void
}) {
  const totals = getTotals(list)
  const difference = list.budgetCents - totals.spent
  const withinBudget = difference >= 0
  const percentage = Math.round((totals.spent / list.budgetCents) * 100)
  return (
    <div className="page summary-page">
      <a href="#/" className="breadcrumb">
        <Icon name="ArrowLeft" size={16} />
        Voltar para minhas listas
      </a>
      <div className="summary-intro">
        <span className="success-seal">
          <Icon name="CheckCheck" size={27} />
        </span>
        <p className="eyebrow">COMPRA CONCLUÍDA</p>
        <h1 id="page-title" tabIndex={-1}>
          {withinBudget
            ? 'Uma boa compra. Um bolso feliz.'
            : 'Compra feita. Hora de conferir.'}
        </h1>
        <p>Seu planejamento virou uma compra. Veja como ela ficou.</p>
      </div>
      <div className="summary-layout">
        <section className="receipt-card" aria-labelledby="receipt-title">
          <div className="receipt-heading">
            <div>
              <span className={`list-emoji ${list.color}`} aria-hidden="true">
                {list.emoji}
              </span>
              <div>
                <h2 id="receipt-title">{list.name}</h2>
                <span>
                  <Icon name="CalendarDays" size={14} />
                  {formatDate(list.date)} de {list.date.slice(0, 4)}
                  <span className="item-dot">·</span>
                  {totals.purchased} produtos
                </span>
              </div>
            </div>
            <span className="status-badge complete">
              <Icon name="Check" size={13} />
              Concluída
            </span>
          </div>
          <div className="receipt-column-labels">
            <span>O QUE VEIO PARA CASA</span>
            <span>VALOR</span>
          </div>
          <ul className="receipt-items">
            {list.items
              .filter((item) => item.purchased)
              .map((item) => (
                <li key={item.id}>
                  <span className="food-emoji" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <div>
                    <strong>{item.name}</strong>
                    <span>
                      {item.quantity}{' '}
                      {item.quantity === 1 ? 'unidade' : 'unidades'} ×{' '}
                      {formatMoney(item.paidPriceCents ?? 0)}
                    </span>
                  </div>
                  <strong>
                    {formatMoney((item.paidPriceCents ?? 0) * item.quantity)}
                  </strong>
                </li>
              ))}
          </ul>
          <div className="receipt-total">
            <span>Total da compra</span>
            <strong>{formatMoney(totals.spent)}</strong>
          </div>
          <p className="receipt-footer">
            <Icon name="ShoppingBasket" size={16} />
            Cada item com seu lugar. Cada real também.
          </p>
        </section>
        <aside className="summary-aside">
          <section className="result-card">
            <span className="mini-label">
              <Icon name="Wallet" size={16} />
              SEU ORÇAMENTO, NA PRÁTICA
            </span>
            <div
              className={`budget-ring ${withinBudget ? '' : 'ring-warning'}`}
              style={{
                background: `conic-gradient(${withinBudget ? '#385e46' : '#b05a37'} 0 ${Math.min(percentage, 100)}%, #e4e8d9 ${Math.min(percentage, 100)}% 100%)`,
              }}
            >
              <div>
                <span>Você gastou</span>
                <strong>{formatMoney(totals.spent)}</strong>
                <span>de {formatMoney(list.budgetCents)}</span>
              </div>
            </div>
            <div
              className={`result-highlight ${withinBudget ? '' : 'result-warning'}`}
            >
              <span>
                <Icon name={withinBudget ? 'Leaf' : 'Info'} size={20} />
              </span>
              <div>
                <strong>{formatMoney(Math.abs(difference))}</strong>
                <span>
                  {withinBudget
                    ? 'abaixo do orçamento. Boa escolha!'
                    : 'acima do orçamento planejado.'}
                </span>
              </div>
            </div>
            <div className="result-detail">
              <span>Orçamento inicial</span>
              <strong>{formatMoney(list.budgetCents)}</strong>
            </div>
            <div className="result-detail">
              <span>Valor gasto</span>
              <strong>{formatMoney(totals.spent)}</strong>
            </div>
          </section>
          {totals.pending > 0 && (
            <section className="pending-card">
              <span className="pending-icon">
                <Icon name="Clock3" size={19} />
              </span>
              <div>
                <h3>Ficou para a próxima</h3>
                <p>
                  {list.items
                    .filter((item) => !item.purchased)
                    .map((item) => item.name)
                    .join(', ')}
                  .
                </p>
                <span>
                  {totals.pending}{' '}
                  {totals.pending === 1
                    ? 'item não comprado'
                    : 'itens não comprados'}
                </span>
              </div>
            </section>
          )}
          <button
            className="button button-primary reuse-button"
            onClick={onReuse}
          >
            <Icon name="Copy" size={18} />
            Reutilizar esta lista
            <Icon name="ArrowRight" size={17} />
          </button>
          <p className="reuse-caption">
            Os produtos voltam como pendentes.
            <br />
            Você começa com os preços da última compra.
          </p>
        </aside>
      </div>
    </div>
  )
}
