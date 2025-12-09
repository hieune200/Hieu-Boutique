// React import not required with the new JSX transform

const VipIcon = ({ className = '', title = 'VIP icon' }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden={title ? 'false' : 'true'} focusable="false">
    <title>{title}</title>
    <rect width="64" height="64" rx="10" fill="none" />
    <g fill="currentColor">
      <path d="M32 14c6 0 10 4 10 10s-4 10-10 10-10-4-10-10 4-10 10-10z" />
      <path d="M16 44c4-6 12-10 16-10s12 4 16 10v6H16v-6z" />
    </g>
  </svg>
)

export default VipIcon
