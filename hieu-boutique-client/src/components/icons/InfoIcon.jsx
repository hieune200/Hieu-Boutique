// React import not required with the new JSX transform

const InfoIcon = ({ className = '', title = 'Info icon' }) => (
  <svg className={className} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" role="img" aria-hidden={title ? 'false' : 'true'} focusable="false">
    <title>{title}</title>
    <rect width="64" height="64" rx="10" fill="none" />
    <g fill="currentColor">
      <circle cx="32" cy="20" r="6" />
      <rect x="18" y="34" width="28" height="4" rx="2" />
      <rect x="18" y="42" width="28" height="4" rx="2" />
    </g>
  </svg>
)

export default InfoIcon
