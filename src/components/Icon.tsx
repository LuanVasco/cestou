import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Copy,
  Ellipsis,
  History,
  House,
  Info,
  Leaf,
  ListFilter,
  Minus,
  Pencil,
  Plus,
  ReceiptText,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Sprout,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'

const icons = {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Copy,
  Ellipsis,
  History,
  House,
  Info,
  Leaf,
  ListFilter,
  Minus,
  Pencil,
  Plus,
  ReceiptText,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Sprout,
  Trash2,
  Wallet,
  X,
}

export type IconName = keyof typeof icons

export function Icon({
  name,
  size = 20,
  className = '',
}: {
  name: IconName
  size?: number
  className?: string
}) {
  const Component = icons[name]
  return (
    <Component
      size={size}
      strokeWidth={1.7}
      aria-hidden="true"
      className={className}
    />
  )
}
