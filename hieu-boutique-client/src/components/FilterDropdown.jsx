import { useState, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

export default function FilterDropdown({
  title,
  options = [],
  type = 'single', // 'single' | 'multi' | 'range'
  value,
  onChange,
  placeholder = 'Chọn',
}){
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(()=>{
    function onDoc(e){
      if (!ref.current) return
      if (!ref.current.contains(e.target)) setOpen(false)
    }
    // use pointerdown so the dropdown stays open on click/touch until an explicit outside press
    document.addEventListener('pointerdown', onDoc)
    return ()=> document.removeEventListener('pointerdown', onDoc)
  },[])

  function toggle(){ setOpen(v=>!v) }

  function handleSingle(opt){
    onChange(opt)
    setOpen(false)
  }

  function handleMulti(opt){
    const current = Array.isArray(value) ? value.slice() : []
    const idx = current.indexOf(opt)
    if (idx === -1) current.push(opt)
    else current.splice(idx,1)
    onChange(current)
  }

  // range expects { min, max }
  const [range, setRange] = useState({ min: value?.min || '', max: value?.max || '' })
  useEffect(()=> setRange({ min: value?.min || '', max: value?.max || '' }), [value])

  function applyRange(){
    const min = range.min === '' ? undefined : Number(range.min)
    const max = range.max === '' ? undefined : Number(range.max)
    onChange({ min, max })
    setOpen(false)
  }

  function renderSummary(){
    if (type === 'single') return value || placeholder
    if (type === 'multi') return Array.isArray(value) && value.length ? `${value.length} đã chọn` : placeholder
    if (type === 'range'){
      if (!value) return placeholder
      const min = value.min || ''
      const max = value.max || ''
      if (min === '' && max === '') return placeholder
      return `${min || ''}${min && max ? ' – ' : ''}${max || ''}`
    }
    return placeholder
  }

  return (
    <div className={"select" + (open? ' open':'')} ref={ref} style={{zIndex: open? 80: 'auto'}}>
      <p onClick={toggle}>
        <span className='select-name'>{title}</span>
        <span className='select-summary' style={{opacity:0.7, marginLeft:8}}>{renderSummary()}</span>
        <span className='dropdown-icon' />
      </p>
      <div className={'opt-list'+(open? ' open':'')} onClick={e=>e.stopPropagation()}>
        {type === 'single' && (
          <div className='opt-items'>
            {options.map(opt=> (
              <div key={opt} className='opt-item' onClick={()=>handleSingle(opt)} style={{padding:'8px 10px', borderRadius:6, cursor:'pointer'}}>
                {opt}
              </div>
            ))}
          </div>
        )}

        {type === 'multi' && (
          <div className='opt-items' style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {options.map(opt=>{
              const active = Array.isArray(value) && value.indexOf(opt)!==-1
              return (
                <button key={opt} onClick={()=>handleMulti(opt)} className={'chip'+(active? ' active':'')} style={{padding:'8px 12px',borderRadius:8,border:'1px solid rgba(0,0,0,0.08)',background: active? '#b71c1c':'#fff', color: active? '#fff':'#222', cursor:'pointer'}}>
                  {opt}
                </button>
              )
            })}
          </div>
        )}

        {type === 'range' && (
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <input type='number' placeholder='Min' value={range.min} onChange={e=>setRange(r=>({...r, min: e.target.value}))} style={{width:100,padding:8,borderRadius:6,border:'1px solid #ddd'}} />
            <span style={{opacity:0.6}}>—</span>
            <input type='number' placeholder='Max' value={range.max} onChange={e=>setRange(r=>({...r, max: e.target.value}))} style={{width:100,padding:8,borderRadius:6,border:'1px solid #ddd'}} />
            <button onClick={applyRange} style={{marginLeft:12,padding:'8px 12px',background:'#b71c1c',color:'#fff',borderRadius:8,border:0}}>Áp dụng</button>
          </div>
        )}

      </div>
    </div>
  )
}

FilterDropdown.propTypes = {
  title: PropTypes.string.isRequired,
  options: PropTypes.array,
  type: PropTypes.oneOf(['single','multi','range']),
  value: PropTypes.any,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
}

FilterDropdown.defaultProps = {
  options: [],
  type: 'single',
  value: null,
  onChange: ()=>{},
  placeholder: 'Chọn',
}
