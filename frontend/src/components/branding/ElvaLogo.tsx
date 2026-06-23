interface ElvaLogoProps {
  className?: string
  height?: number
  linkable?: boolean
}

export function ElvaLogo({ className = '', height = 44, linkable = true }: ElvaLogoProps) {
  const image = (
    <img
      src="/ELVA_LOGO.png"
      alt="ELVA"
      className="h-auto w-auto max-w-[160px] rounded-xl object-contain sm:max-w-[200px]"
      style={{ height }}
    />
  )

  if (!linkable) {
    return <span className={`inline-flex items-center ${className}`}>{image}</span>
  }

  return (
    <a
      href="https://elvatech.in"
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center transition-opacity hover:opacity-80 ${className}`}
      aria-label="ELVA — elvatech.in"
    >
      {image}
    </a>
  )
}
