import { ICON_MAP } from '../../data/icons'

interface AppIconProps {
  name: string
  size?: number
  className?: string
}

export function AppIcon({ name, size = 32, className }: AppIconProps) {
  const icon = ICON_MAP[name] ?? '/img/web_file_0.png'
  if (icon.startsWith('/')) {
    return (
      <img
        src={icon}
        width={size}
        height={size}
        className={className}
        aria-hidden="true"
        style={{ imageRendering: 'pixelated' }}
      />
    )
  }
  return (
    <span
      className={className}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block' }}
      aria-hidden="true"
    >
      {icon}
    </span>
  )
}
