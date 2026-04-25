export type MenuItem =
  | {
      separator: true
      label?: string
      onClick?: () => void
      disabled?: boolean
      checked?: boolean
    }
  | {
      label: string
      onClick?: () => void
      separator?: false
      disabled?: boolean
      checked?: boolean
    }

export interface Menu {
  label: string
  items: MenuItem[]
}

export interface DialogButton {
  label: string
  onClick: () => void
  primary?: boolean
}

export type ContextMenuItem =
  | {
      separator: true
      label?: string
      onClick?: () => void
      disabled?: boolean
    }
  | {
      label: string
      onClick?: () => void
      separator?: false
      disabled?: boolean
    }
