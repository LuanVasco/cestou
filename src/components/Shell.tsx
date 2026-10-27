import styles from './Shell.module.css'
import type { ReactNode } from 'react'
import type { Route } from '../types'
import { Icon } from './Icon'
import type { StorageIssue } from '../store/storage'

const storageMessages = {
  read: 'Não foi possível acessar os dados salvos. Você está vendo listas de exemplo, e as alterações ficam apenas nesta sessão. Verifique se o armazenamento está permitido para este site e recarregue a página.',
  write:
    'Não foi possível salvar as últimas alterações. Elas ficam apenas nesta sessão. Libere espaço ou permita o armazenamento para este site antes de continuar.',
  invalid:
    'Não foi possível abrir os dados salvos. Eles foram preservados. Você está vendo listas de exemplo, e as alterações desta sessão não serão salvas.',
  version:
    'Seus dados foram salvos por outra versão do Cestou e foram preservados. Você está vendo listas de exemplo, e as alterações desta sessão não serão salvas.',
} satisfies Record<Exclude<StorageIssue, null>, string>

export function Shell({
  children,
  route,
  activeCount,
  activeListId,
  lastCompletedId,
  storageIssue,
  onAbout,
}: {
  children: ReactNode
  route: Route
  activeCount: number
  activeListId?: string
  lastCompletedId?: string
  storageIssue: StorageIssue
  onAbout: () => void
}) {
  return (
    <div className={styles.shell}>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Pular para o conteúdo
      </a>
      <aside className={styles.sidebar} aria-label="Navegação principal">
        <a href="#/" className="brand" aria-label="Cestou, início">
          <span className="brand-icon">
            <Icon name="ShoppingBasket" size={27} />
          </span>
          cestou<span className="brand-period">.</span>
        </a>
        <p className="brand-tagline">Suas compras, na medida.</p>
        <div className="nav-label">SEU ESPAÇO</div>
        <nav className="side-nav">
          <a
            href="#/"
            className={route.page === 'home' ? 'nav-item active' : 'nav-item'}
            aria-current={route.page === 'home' ? 'page' : undefined}
          >
            <Icon name="House" />
            Visão geral
          </a>
          <a
            href={activeListId ? `#/lista/${activeListId}` : '#/'}
            className={route.page === 'list' ? 'nav-item active' : 'nav-item'}
            aria-current={route.page === 'list' ? 'page' : undefined}
          >
            <Icon name="ClipboardList" />
            Minhas listas<span className="nav-count">{activeCount}</span>
          </a>
          {lastCompletedId && (
            <a
              href={`#/resumo/${lastCompletedId}`}
              className={
                route.page === 'summary' ? 'nav-item active' : 'nav-item'
              }
              aria-current={route.page === 'summary' ? 'page' : undefined}
            >
              <Icon name="History" />
              Última compra
            </a>
          )}
        </nav>
        <div className="sidebar-tip">
          <span className="tip-icon">
            <Icon name="Leaf" size={23} />
          </span>
          <strong>
            Um pouco de planejamento.
            <br />
            Uma compra mais leve.
          </strong>
          <p>Sua lista ajuda a levar o que precisa e cuidar do seu bolso.</p>
          <span className="tip-dots" aria-hidden="true">
            ✦
          </span>
        </div>
        <div className="sidebar-bottom">
          <button onClick={onAbout} className="about-button">
            <Icon name="CircleHelp" size={18} />
            Sobre esta versão
          </button>
          <div className="local-profile">
            <span className="profile-avatar">
              <Icon name="Sprout" size={20} />
            </span>
            <div>
              <strong>Seu cantinho</strong>
              <span>
                {storageIssue
                  ? 'Alterações nesta sessão'
                  : 'Salvo neste navegador'}
              </span>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <a href="#/" className={styles.mobileBrand}>
            <Icon name="ShoppingBasket" size={24} />
            cestou.
          </a>
          <div className="topbar-label">
            <Icon name="ShoppingBasket" size={18} />
            <span>Um lugar para organizar suas compras</span>
          </div>
          <button
            className={`save-badge ${storageIssue ? 'save-badge-warning' : ''}`}
            onClick={onAbout}
          >
            <span />
            {storageIssue ? 'Não salvo' : 'Salvo aqui'}
            <Icon name="Info" size={14} />
          </button>
        </header>
        <nav className={styles.mobileNav} aria-label="Navegação no celular">
          <a
            href="#/"
            aria-current={route.page === 'home' ? 'page' : undefined}
          >
            <Icon name="House" size={17} />
            Início
          </a>
          <a
            href={activeListId ? `#/lista/${activeListId}` : '#/'}
            aria-current={route.page === 'list' ? 'page' : undefined}
          >
            <Icon name="ClipboardList" size={17} />
            Minha lista
          </a>
          {lastCompletedId && (
            <a
              href={`#/resumo/${lastCompletedId}`}
              aria-current={route.page === 'summary' ? 'page' : undefined}
            >
              <Icon name="ReceiptText" size={17} />
              Resumo
            </a>
          )}
        </nav>
        <main id="main-content" className={styles.main} tabIndex={-1}>
          {storageIssue && (
            <div className="storage-warning" role="alert">
              <Icon name="Info" size={19} />
              <p>{storageMessages[storageIssue]}</p>
            </div>
          )}
          {children}
        </main>
        <footer className="app-footer">
          <span>Feito para comprar com mais tranquilidade.</span>
          <span>
            <Icon name="Leaf" size={13} />
            Um item de cada vez.
          </span>
        </footer>
      </div>
    </div>
  )
}
