import { useEffect, useRef, useState } from 'react'
import { Shell } from './components/Shell'
import { Modal } from './components/Modal'
import {
  BudgetForm,
  ItemForm,
  ListForm,
  PurchaseForm,
} from './components/Forms'
import { Icon } from './components/Icon'
import { HomePage } from './pages/HomePage'
import { ListPage } from './pages/ListPage'
import { SummaryPage } from './pages/SummaryPage'
import { useShoppingStore } from './store/useShoppingStore'
import { navigate, useRoute } from './hooks/useRoute'
import { formatMoney, getTotals } from './lib/money'
import type { GroceryCategory, GroceryItem, ShoppingList } from './types'

type ActiveDialog =
  | { type: 'create' | 'about' }
  | { type: 'add' | 'budget' | 'finish'; listId: string }
  | { type: 'edit' | 'purchase'; listId: string; item: GroceryItem }

const categoryEmoji: Record<GroceryCategory, string> = {
  Hortifruti: '🥑',
  Mercearia: '🛒',
  Laticínios: '🥛',
  Padaria: '🥖',
  Limpeza: '🧴',
}
const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

export default function App() {
  const lists = useShoppingStore((state) => state.lists)
  const addList = useShoppingStore((state) => state.addList)
  const updateList = useShoppingStore((state) => state.updateList)
  const storageIssue = useShoppingStore((state) => state.storageIssue)
  const [dialog, setDialog] = useState<ActiveDialog | null>(null)
  const [toast, setToast] = useState<{
    message: string
    undo?: () => void
  } | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  )
  const route = useRoute()
  const selected =
    route.page === 'home'
      ? undefined
      : lists.find((list) => list.id === route.id)
  const dialogList =
    dialog && 'listId' in dialog
      ? lists.find((list) => list.id === dialog.listId)
      : undefined
  const completed = lists.filter((list) => list.status === 'completed')

  useEffect(() => {
    document.title = `${selected?.name ?? 'Suas compras, na medida'} — Cestou`
  }, [selected?.name])
  useEffect(() => () => clearTimeout(toastTimer.current), [])

  function notify(message: string, undo?: () => void) {
    clearTimeout(toastTimer.current)
    setToast({ message, undo })
    toastTimer.current = setTimeout(() => setToast(null), undo ? 10000 : 4500)
  }
  const closeDialog = () => setDialog(null)
  function duplicate(list: ShoppingList) {
    const copy: ShoppingList = {
      ...list,
      id: crypto.randomUUID(),
      name: `${list.name} · nova`,
      status: 'active',
      date: today(),
      items: list.items.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        estimatedPriceCents: item.paidPriceCents ?? item.estimatedPriceCents,
        paidPriceCents: null,
        purchased: false,
      })),
    }
    addList(copy)
    navigate(`/lista/${copy.id}`)
    notify('Uma nova lista, com tudo pronto para recomeçar.')
  }
  function deleteItem(list: ShoppingList, item: GroceryItem) {
    const index = list.items.findIndex((existing) => existing.id === item.id)
    updateList(list.id, (current) => ({
      ...current,
      items: current.items.filter((existing) => existing.id !== item.id),
    }))
    notify(`${item.name} foi removido.`, () => {
      updateList(list.id, (current) => {
        if (current.items.some((existing) => existing.id === item.id))
          return current
        const items = [...current.items]
        items.splice(index, 0, item)
        return { ...current, items }
      })
      setToast(null)
    })
  }

  return (
    <Shell
      route={route}
      activeCount={lists.filter((list) => list.status === 'active').length}
      activeListId={lists.find((list) => list.status === 'active')?.id}
      lastCompletedId={completed[0]?.id}
      storageIssue={storageIssue}
      onAbout={() => setDialog({ type: 'about' })}
    >
      {route.page === 'home' ? (
        <HomePage
          lists={lists}
          storageIssue={storageIssue}
          onCreate={() => setDialog({ type: 'create' })}
          onAbout={() => setDialog({ type: 'about' })}
        />
      ) : !selected ? (
        <div className="page empty-state">
          <Icon name="ClipboardList" size={40} />
          <h1 id="page-title" tabIndex={-1}>
            Essa lista não está por aqui.
          </h1>
          <p>A lista pode ter sido removida ou salva em outro navegador.</p>
          <a href="#/" className="button button-primary">
            Voltar para o início
          </a>
        </div>
      ) : route.page === 'summary' || selected.status === 'completed' ? (
        <SummaryPage list={selected} onReuse={() => duplicate(selected)} />
      ) : (
        <ListPage
          key={selected.id}
          list={selected}
          onAdd={() => setDialog({ type: 'add', listId: selected.id })}
          onEdit={(item) =>
            setDialog({ type: 'edit', listId: selected.id, item })
          }
          onPurchase={(item) => {
            if (item.purchased) {
              updateList(selected.id, (current) => ({
                ...current,
                items: current.items.map((existing) =>
                  existing.id === item.id
                    ? { ...existing, purchased: false, paidPriceCents: null }
                    : existing,
                ),
              }))
            } else setDialog({ type: 'purchase', listId: selected.id, item })
          }}
          onDelete={(item) => deleteItem(selected, item)}
          onFinish={() => setDialog({ type: 'finish', listId: selected.id })}
          onEditBudget={() =>
            setDialog({ type: 'budget', listId: selected.id })
          }
          onDuplicate={() => duplicate(selected)}
        />
      )}

      {dialog?.type === 'create' && (
        <Modal
          title="Uma nova boa compra"
          description="Comece com um nome e um valor para se guiar."
          onClose={closeDialog}
        >
          <ListForm
            onCancel={closeDialog}
            onSave={(name, budgetCents) => {
              const list: ShoppingList = {
                id: crypto.randomUUID(),
                name,
                budgetCents,
                description: 'Sua próxima compra, do seu jeito',
                emoji: '🛍️',
                color: 'green',
                status: 'active',
                date: today(),
                items: [],
              }
              addList(list)
              closeDialog()
              navigate(`/lista/${list.id}`)
              notify('Lista criada. Vamos ao primeiro item?')
            }}
          />
        </Modal>
      )}
      {dialog?.type === 'about' && (
        <Modal
          title="Seu planejamento fica por aqui"
          description={
            storageIssue
              ? 'O salvamento precisa de atenção'
              : 'Listas e orçamento salvos neste navegador'
          }
          onClose={closeDialog}
        >
          <div className="about-content">
            <span className="about-illustration">
              <Icon name="ShoppingBasket" size={40} />
            </span>
            <p>
              {storageIssue
                ? 'Não foi possível salvar suas alterações neste navegador. Confira o aviso na página antes de sair.'
                : 'Suas listas, produtos e preços são salvos automaticamente. Você pode fechar a página e continuar sua compra depois.'}
            </p>
            <div className="info-box">
              <Icon name="Info" size={18} />
              <p>
                Os dados ficam neste navegador e dispositivo. Limpar os dados do
                site apaga as listas salvas. Em uma janela privativa, elas podem
                ser apagadas quando a janela for fechada.
              </p>
            </div>
            <button className="button button-primary" onClick={closeDialog}>
              Continuar planejando
              <Icon name="ArrowRight" size={17} />
            </button>
          </div>
        </Modal>
      )}
      {(dialog?.type === 'add' || dialog?.type === 'edit') && dialogList && (
        <Modal
          title={
            dialog.type === 'edit'
              ? 'Cada detalhe faz diferença'
              : 'O que vai na sua cesta?'
          }
          description={
            dialog.type === 'edit'
              ? 'Ajuste o produto e mantenha sua lista em dia.'
              : 'Adicione um produto à sua próxima compra.'
          }
          onClose={closeDialog}
        >
          <ItemForm
            item={dialog.type === 'edit' ? dialog.item : undefined}
            onCancel={closeDialog}
            onSave={(values) => {
              updateList(dialogList.id, (current) => ({
                ...current,
                items:
                  dialog.type === 'edit'
                    ? current.items.map((item) =>
                        item.id === dialog.item.id
                          ? {
                              ...item,
                              ...values,
                              emoji:
                                item.category === values.category
                                  ? item.emoji
                                  : categoryEmoji[values.category],
                            }
                          : item,
                      )
                    : [
                        ...current.items,
                        {
                          ...values,
                          id: crypto.randomUUID(),
                          emoji: categoryEmoji[values.category],
                          purchased: false,
                        },
                      ],
              }))
              closeDialog()
              notify(
                dialog.type === 'edit'
                  ? 'Produto atualizado.'
                  : 'Mais um item na sua lista.',
              )
            }}
          />
        </Modal>
      )}
      {dialog?.type === 'purchase' && dialogList && (
        <Modal
          title="Encontrou o que precisava?"
          description="Confirme o preço que você viu no mercado."
          onClose={closeDialog}
        >
          <PurchaseForm
            item={dialog.item}
            onCancel={closeDialog}
            onSave={(price) => {
              updateList(dialogList.id, (current) => ({
                ...current,
                items: current.items.map((item) =>
                  item.id === dialog.item.id
                    ? { ...item, purchased: true, paidPriceCents: price }
                    : item,
                ),
              }))
              closeDialog()
              notify('Produto no carrinho. Orçamento atualizado!')
            }}
          />
        </Modal>
      )}
      {dialog?.type === 'budget' && dialogList && (
        <Modal title="Um orçamento que acompanha você" onClose={closeDialog}>
          <BudgetForm
            budget={dialogList.budgetCents}
            onCancel={closeDialog}
            onSave={(budgetCents) => {
              updateList(dialogList.id, (current) => ({
                ...current,
                budgetCents,
              }))
              closeDialog()
              notify('Orçamento atualizado.')
            }}
          />
        </Modal>
      )}
      {dialog?.type === 'finish' && dialogList && (
        <Modal
          title="Tudo certo para fechar a compra?"
          description="Confira o valor que vai para o seu resumo."
          onClose={closeDialog}
        >
          <div className="finish-summary">
            <span>Total no carrinho</span>
            <strong>{formatMoney(getTotals(dialogList).spent)}</strong>
            <p>
              {getTotals(dialogList).purchased} produtos comprados
              {getTotals(dialogList).pending > 0
                ? ` · ${getTotals(dialogList).pending} ficam para a próxima`
                : ''}
            </p>
          </div>
          <div className="form-actions">
            <button className="button button-secondary" onClick={closeDialog}>
              Continuar comprando
            </button>
            <button
              className="button button-primary"
              onClick={() => {
                updateList(dialogList.id, (current) => ({
                  ...current,
                  status: 'completed',
                  date: today(),
                }))
                closeDialog()
                navigate(`/resumo/${dialogList.id}`)
                notify('Compra concluída. Cada real no seu lugar.')
              }}
            >
              Finalizar
              <Icon name="Check" size={17} />
            </button>
          </div>
        </Modal>
      )}
      <div className="toast-region" aria-live="polite" aria-atomic="true">
        {toast && (
          <div className="toast">
            <span className="toast-icon">
              <Icon name="Check" size={16} />
            </span>
            <span>{toast.message}</span>
            {toast.undo && (
              <button className="toast-undo" onClick={toast.undo}>
                Desfazer
              </button>
            )}
            <button
              className="icon-button"
              aria-label="Fechar aviso"
              onClick={() => setToast(null)}
            >
              <Icon name="X" size={15} />
            </button>
          </div>
        )}
      </div>
    </Shell>
  )
}
