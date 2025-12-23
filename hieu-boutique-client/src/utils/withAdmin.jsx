import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInfor } from '../services/Auth.api'

export default function withAdmin(Component){
    return function AdminWrapped(props){
        const nav = useNavigate()
        const [checking, setChecking] = useState(true)
        const [ok, setOk] = useState(false)

        useEffect(()=>{
            let mounted = true
            ;(async ()=>{
                try{
                        const resp = await getInfor()
                        if (!mounted) return
                        if (!resp) { setOk(false); }
                        else {
                            const info = resp.data ? resp.data : resp
                            if (info && info.role === 'admin') setOk(true)
                            else setOk(false)
                        }
                    }catch(e){ if (mounted) setOk(false) }
                if (mounted) setChecking(false)
            })()
            return ()=>{ mounted = false }
        }, [])

        if (checking) return null
        if (!ok){
            try{ nav('/login') }catch(e){}
            return null
        }
        return <Component {...props} />
    }
}
