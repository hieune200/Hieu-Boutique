// React import not required with the new JSX transform

const PaymentIcon = ({ className = '', title = 'Payment icon' }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden={title ? 'false' : 'true'} focusable="false">
    <title>{title}</title>
    <rect width="64" height="64" rx="10" fill="none" />
    <g fill="currentColor">
      <rect x="8" y="18" width="48" height="28" rx="4" />
      <rect x="14" y="24" width="12" height="8" rx="2" fill="white" />
      <rect x="34" y="24" width="12" height="8" rx="2" fill="white" />
    </g>
  </svg>
)

export default PaymentIcon
