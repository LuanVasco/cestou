import styles from './HomePage.module.css'
import { useState } from 'react'
import type { StorageIssue } from '../store/storage'
import type { ShoppingList } from '../types'
import { formatDate, formatMoney, getTotals } from '../lib/money'
import { Icon } from '../components/Icon'
import { MarketIllustration } from '../components/MarketIllustration'

function ListCard({ list }: { list: ShoppingList }) {
  const totals = getTotals(list)
  const isCompleted = list.status === 'completed'
  return (
    <article className="list-card">
      <div className="list-card-top">
        <span className={`list-emoji ${list.color}`} aria-hidden="true">
          {list.emoji}
        </span>
        <span className={`status-badge ${isCompleted ? 'complete' : ''}`}>
          <span />
          {isCompleted ? 'Concluída' : 'Em andamento'}
        </span>
      </div>
      <h3>{list.name}</h3>
      <p>{list.description}</p>
      <div className="card-progress-label">
        <span>
          {totals.purchased} de {list.items.length} itens comprados
        </span>
        <span>{totals.progress}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={`Progresso de ${list.name}`}
        aria-valuenow={totals.progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${totals.progress}%` }} />
      </div>
      <div className="list-card-footer">
        <div>
          <span>{isCompleted ? 'Valor da compra' : 'Orçamento'}</span>
          <strong>
            {formatMoney(isCompleted ? totals.spent : list.budgetCents)}
          </strong>
        </div>
        <a
          className="circle-link"
          href={`#/${isCompleted ? 'resumo' : 'lista'}/${list.id}`}
          aria-label={`${isCompleted ? 'Ver resumo de' : 'Abrir'} ${list.name}`}
        >
          <Icon name="ArrowUpRight" size={21} />
        </a>
      </div>
      <span className="card-date">
        <Icon name="CalendarDays" size={13} />
        {isCompleted ? 'Finalizada em' : 'Criada em'} {formatDate(list.date)}
      </span>
    </article>
  )
}

export function HomePage({
  lists,
  storageIssue,
  onCreate,
  onAbout,
}: {
  lists: ShoppingList[]
  storageIssue: StorageIssue
  onCreate: () => void
  onAbout: () => void
}) {
  const [tab, setTab] = useState<'active' | 'completed'>('active')
  const active = lists.filter((list) => list.status === 'active')
  const completed = lists.filter((list) => list.status === 'completed')
  const last = completed[0]
  const savings = last ? last.budgetCents - getTotals(last).spent : 0
  const visible = tab === 'active' ? active : completed
  return (
    <div className="page home-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow">COMPRAR BEM COMEÇA AQUI</p>
          <h1 id="page-title" tabIndex={-1}>
            Suas compras, sem surpresas.
          </h1>
          <p className="page-description">
            Um pouco de organização faz toda a diferença no mercado.
          </p>
        </div>
        <button className="button button-primary" onClick={onCreate}>
          <Icon name="Plus" size={18} />
          Nova lista
        </button>
      </div>
      <section className={styles.welcomeBanner} aria-labelledby="welcome-title">
        <div className={styles.welcomeCopy}>
          <span className="mini-label">
            <Icon name="Leaf" size={15} />
            MAIS PLANEJAMENTO, MAIS TRANQUILIDADE
          </span>
          <h2 id="welcome-title">
            Cabe na cesta.
            <br />
            Cabe no bolso.
          </h2>
          <p>
            Organize o que precisa e acompanhe
            <br className="desktop-break" /> cada escolha dentro do seu
            orçamento.
          </p>
          <a
            href={active[0] ? `#/lista/${active[0].id}` : '#/'}
            className={styles.bannerLink}
            onClick={
              active[0]
                ? undefined
                : (event) => {
                    event.preventDefault()
                    onCreate()
                  }
            }
          >
            {active[0] ? 'Continuar minha lista' : 'Criar minha primeira lista'}
            <Icon name="ArrowRight" size={17} />
          </a>
        </div>
        <MarketIllustration className={styles.marketIllustration} />
        <div className={styles.bannerDecoration} aria-hidden="true" />
      </section>
      <section className="stats-grid" aria-label="Seu planejamento em números">
        <div className="stat-card">
          <span className="stat-icon">
            <Icon name="ClipboardList" size={21} />
          </span>
          <div>
            <span>Listas em andamento</span>
            <strong>
              {String(active.length).padStart(2, '0')}
              <small>prontas para continuar</small>
            </strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon peach">
            <Icon name="Wallet" size={21} />
          </span>
          <div>
            <span>Orçamento planejado</span>
            <strong>
              {formatMoney(
                active.reduce((sum, list) => sum + list.budgetCents, 0),
              )}
              <small>nas listas em andamento</small>
            </strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon lavender">
            <Icon name="CheckCheck" size={21} />
          </span>
          <div>
            <span>Compras concluídas</span>
            <strong>
              {String(completed.length).padStart(2, '0')}
              <small>cada compra conta</small>
            </strong>
          </div>
        </div>
      </section>
      <section className="lists-section" aria-labelledby="lists-title">
        <div className="section-heading">
          <h2 id="lists-title">
            Suas listas<span className="count-label">{lists.length}</span>
          </h2>
          <span className="section-note">
            <Icon name="Clock3" size={14} />
            No seu ritmo, do seu jeito
          </span>
        </div>
        <div className="tabs" aria-label="Filtrar listas">
          <button
            className={tab === 'active' ? 'tab active' : 'tab'}
            aria-pressed={tab === 'active'}
            onClick={() => setTab('active')}
          >
            Em andamento<span>{active.length}</span>
          </button>
          <button
            className={tab === 'completed' ? 'tab active' : 'tab'}
            aria-pressed={tab === 'completed'}
            onClick={() => setTab('completed')}
          >
            Concluídas<span>{completed.length}</span>
          </button>
        </div>
        <div className="lists-grid">
          {visible.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
          <button className="new-list-card" onClick={onCreate}>
            <span className="new-list-plus">
              <Icon name="Plus" size={25} />
            </span>
            <strong>Uma nova boa compra</strong>
            <span>
              Crie uma lista e comece
              <br />
              pelo que você precisa.
            </span>
            <span className="new-list-link">
              Criar lista
              <Icon name="ArrowRight" size={16} />
            </span>
          </button>
        </div>
      </section>
      {last && (
        <section className="last-purchase" aria-label="Última compra">
          <div className="last-purchase-icon">
            <Icon name="ReceiptText" size={26} />
          </div>
          <div className="last-purchase-copy">
            <span>SUA ÚLTIMA COMPRA</span>
            <h3>{last.name}</h3>
            <p>
              {formatDate(last.date)}
              <span>·</span>
              {getTotals(last).purchased} produtos comprados
            </p>
          </div>
          <div className="last-purchase-saving">
            <strong>{formatMoney(Math.abs(savings))}</strong>
            <span>
              {savings >= 0 ? 'abaixo do orçamento' : 'acima do orçamento'}
            </span>
          </div>
          <a className="text-link" href={`#/resumo/${last.id}`}>
            Ver resumo
            <Icon name="ArrowRight" size={17} />
          </a>
        </section>
      )}
      <button className="storage-note" onClick={onAbout}>
        <Icon name="Info" size={15} />
        {storageIssue
          ? 'Confira o aviso de armazenamento antes de sair da página.'
          : 'Suas listas são salvas automaticamente neste navegador.'}
        <Icon name="ArrowUpRight" size={14} />
      </button>
    </div>
  )
}
