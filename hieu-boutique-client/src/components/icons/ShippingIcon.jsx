// React import not required with the new JSX transform

const ShippingIcon = ({ className = '', title = 'Shipping icon' }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden={title ? 'false' : 'true'} focusable="false">
    <title>{title}</title>
    <rect width="64" height="64" rx="10" fill="none" />
    <g fill="currentColor">
      <path d="M8 40h30v-8h12l6 8v6H8v-6z" />
      <circle cx="22" cy="50" r="4" />
      <circle cx="48" cy="50" r="4" />
    </g>
  </svg>
)

export default ShippingIcon
