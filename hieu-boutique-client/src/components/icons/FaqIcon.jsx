// React import not required with the new JSX transform

const FaqIcon = ({ className = '', title = 'FAQ icon' }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden={title ? 'false' : 'true'} focusable="false">
    <title>{title}</title>
    <rect width="64" height="64" rx="10" fill="none" />
    <g fill="currentColor">
      <path d="M32 16a10 10 0 1 0 0 20" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="32" cy="44" r="2.5" />
    </g>
  </svg>
)

export default FaqIcon
