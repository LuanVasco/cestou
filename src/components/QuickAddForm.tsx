import { useState } from 'react'
import type { GroceryItem } from '../types'
import {
  categories,
  categoryEmoji,
  parseQuickProducts,
  productKey,
  type ProductDraft,
} from '../lib/quickList'
import { formatMoney } from '../lib/money'

export function QuickAddForm({
  favorites,
  existing,
  onSave,
  onCancel,
}: {
  favorites: GroceryItem[]
  existing: GroceryItem[]
  onSave: (items: ProductDraft[]) => void
  onCancel: () => void
}) {
  const [mode, setMode] = useState<'text' | 'favorites'>('text')
  const [text, setText] = useState('')
  const [drafts, setDrafts] = useState<ProductDraft[] | null>(null)
  const [chosen, setChosen] = useState<string[]>([])
  const [error, setError] = useState('')
  const existingKeys = new Set(existing.map(productKey))
  function switchMode(next: typeof mode) {
    setMode(next)
    setDrafts(null)
    setError('')
  }
  function save() {
    const selected =
      drafts ?? favorites.filter((item) => chosen.includes(productKey(item)))
    if (
      selected.some(
        (item) =>
          !item.name.trim() ||
          item.name.trim().length > 80 ||
          !Number.isInteger(item.quantity) ||
          item.quantity < 1 ||
          item.quantity > 9999,
      )
    ) {
      setError('Revise os nomes e use quantidades inteiras entre 1 e 9.999.')
      return
    }
    const unique = new Map<string, ProductDraft>()
    for (const item of selected) {
      const key = productKey(item)
      if (!existingKeys.has(key)) {
        if (unique.has(key)) {
          setError(
            'Há produtos repetidos na revisão. Remova a repetição ou ajuste o nome.',
          )
          return
        }
        unique.set(key, { ...item, name: item.name.trim() })
      }
    }
    if (!unique.size) {
      setError(
        'Escolha pelo menos um produto que ainda não esteja nesta lista.',
      )
      return
    }
    onSave([...unique.values()])
  }
  const available = (
    drafts ?? favorites.filter((item) => chosen.includes(productKey(item)))
  ).filter((item) => !existingKeys.has(productKey(item))).length
  return (
    <div className="form quick-form">
      <div className="quick-tabs" aria-label="Modo de inclusão">
        <button
          className={`filter-pill ${mode === 'text' ? 'active' : ''}`}
          aria-pressed={mode === 'text'}
          onClick={() => switchMode('text')}
        >
          Digitar vários
        </button>
        <button
          className={`filter-pill ${mode === 'favorites' ? 'active' : ''}`}
          aria-pressed={mode === 'favorites'}
          onClick={() => switchMode('favorites')}
        >
          Favoritos ({favorites.length})
        </button>
      </div>
      {mode === 'text' && !drafts && (
        <>
          <label htmlFor="quick-products">
            Quais produtos você precisa?
            <textarea
              id="quick-products"
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={5}
              maxLength={12000}
              placeholder={'2 leites, arroz, feijão\n1x café'}
              aria-describedby="quick-help"
            />
          </label>
          <small id="quick-help">
            Separe por vírgula, ponto e vírgula ou linha. Use quantidades
            inteiras por unidade ou pacote. Até 100 produtos por vez.
          </small>
          <button
            className="button button-primary"
            onClick={() => {
              try {
                setDrafts(parseQuickProducts(text))
                setError('')
              } catch (error) {
                setError((error as Error).message)
              }
            }}
          >
            Revisar produtos
          </button>
        </>
      )}
      {drafts && (
        <>
          <p>
            Confira os nomes, quantidades e categorias. Produtos já presentes
            serão ignorados.
          </p>
          <div className="quick-review">
            {drafts.map((item, index) => (
              <div className="quick-review-row" key={index}>
                <label>
                  Produto {index + 1}
                  <input
                    value={item.name}
                    maxLength={80}
                    onChange={(event) =>
                      setDrafts(
                        drafts.map((draft, i) =>
                          i === index
                            ? { ...draft, name: event.target.value }
                            : draft,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Qtd. {index + 1}
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    step={1}
                    value={item.quantity}
                    onChange={(event) =>
                      setDrafts(
                        drafts.map((draft, i) =>
                          i === index
                            ? { ...draft, quantity: Number(event.target.value) }
                            : draft,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Categoria {index + 1}
                  <select
                    value={item.category}
                    onChange={(event) =>
                      setDrafts(
                        drafts.map((draft, i) =>
                          i === index
                            ? {
                                ...draft,
                                category: event.target
                                  .value as GroceryItem['category'],
                                emoji:
                                  categoryEmoji[
                                    event.target
                                      .value as GroceryItem['category']
                                  ],
                              }
                            : draft,
                        ),
                      )
                    }
                  >
                    {categories.map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </label>
                <button
                  className="text-link"
                  aria-label={`Remover produto ${index + 1} da revisão`}
                  onClick={() =>
                    setDrafts(drafts.filter((_, i) => i !== index))
                  }
                >
                  Remover
                </button>
                {existingKeys.has(productKey(item)) && (
                  <small className="quick-existing">Já está na lista</small>
                )}
              </div>
            ))}
          </div>
          <button
            className="text-link"
            onClick={() => {
              setDrafts(null)
              setError('')
            }}
          >
            Voltar ao texto
          </button>
        </>
      )}
      {mode === 'favorites' && (
        <>
          <p>
            Selecione para reutilizar. Os preços salvos são referências
            anteriores; confirme no mercado.
          </p>
          {favorites.length === 0 && (
            <div className="info-box">
              Marque a estrela de um produto na lista para guardá-lo aqui.
            </div>
          )}
          <div className="favorite-options">
            {favorites.map((item) => {
              const key = productKey(item)
              const present = existingKeys.has(key)
              return (
                <label className="favorite-option" key={key}>
                  <input
                    type="checkbox"
                    disabled={present}
                    checked={!present && chosen.includes(key)}
                    onChange={(event) =>
                      setChosen(
                        event.target.checked
                          ? [...chosen, key]
                          : chosen.filter((value) => value !== key),
                      )
                    }
                  />
                  <span>
                    <strong>
                      {item.emoji} {item.name}
                    </strong>
                    <small>
                      {present
                        ? 'Já está na lista'
                        : `${item.quantity} un. · ${item.category}${item.estimatedPriceCents === null ? ' · sem estimativa' : ` · ${formatMoney(item.estimatedPriceCents)} por un. (referência salva)`}`}
                    </small>
                  </span>
                </label>
              )
            })}
          </div>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="button button-secondary" onClick={onCancel}>
          Cancelar
        </button>
        {(drafts || mode === 'favorites') && (
          <button
            className="button button-primary"
            disabled={available === 0}
            onClick={save}
          >
            Adicionar {available} {available === 1 ? 'produto' : 'produtos'}
          </button>
        )}
      </div>
    </div>
  )
}
