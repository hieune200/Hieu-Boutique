// Small helper for breadcrumb clicks: scroll + optional analytics
export function handleBreadcrumbClick(label){
    try{
        // smooth scroll to top of the page
        if (typeof window !== 'undefined' && window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' })
        // focus main content if available (accessibility)
        try{ const m = document.querySelector('main'); if(m && typeof m.focus === 'function') m.focus() }catch(e){ console.warn('breadcrumb focus failed', e) }
        // send a lightweight analytics event if common globals exist
        try{
            if (typeof window !== 'undefined'){
                if (typeof window.gtag === 'function'){
                    window.gtag('event', 'breadcrumb_click', { event_label: label || '' })
                }
                if (window.dataLayer && typeof window.dataLayer.push === 'function'){
                    window.dataLayer.push({ event: 'breadcrumb_click', label: label || '' })
                }
            }
        }catch(e){ console.warn('breadcrumb analytics failed', e) }
    }catch(e){ console.warn('breadcrumb handler error', e) }
}
