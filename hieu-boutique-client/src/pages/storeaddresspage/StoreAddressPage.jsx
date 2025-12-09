

import './storeaddresspage.scss'
import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Use ESM imports for Leaflet icon images so Vite can resolve them
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow
})

const makeRandomAround = (center, meters) => {
    // random point within circle (meters)
    const r = meters/111300 // approx degrees
    const u = Math.random()
    const v = Math.random()
    const w = r * Math.sqrt(u)
    const t = 2 * Math.PI * v
    const dx = w * Math.cos(t)
    const dy = w * Math.sin(t)
    return { lat: center.lat + dy, lng: center.lng + dx }
}

function FlyTo({ position }){
    const map = useMap()
    useEffect(()=>{ if (position) map.flyTo(position, 16, {duration: 0.8}) },[position, map])
    return null
}

const StoreAddressPage = () => {
    window.scrollTo({top: 0, behavior: 'smooth'})

    // center of the city (adjust as you like)
    const center = { lat: 21.273, lng: 106.071 }
    const [stores] = useState(()=>{
        // sample list of store names (can be replaced by real data)
        const names = [
            'Hieu Boutique - Bắc Giang',
            'Hieu Boutique - Hiệp Hòa',
            'Hieu Boutique - Lạng Giang',
            'Hieu Boutique - Yên Thế',
            'Hieu Boutique - Việt Yên'
        ]
        return names.map((name,i)=>({
            id: `store-${i}`,
            name,
            phone: '18008118',
            // randomize positions ~ within 1.5km
            pos: makeRandomAround(center, 1500)
        }))
    })

    const [activePos, setActivePos] = useState(center)
    const mapRef = useRef()

    const preview = useMemo(()=> stores.slice(0, stores.length), [stores])

    return (
        <main className='storeaddresspage'>
            <div className='storeaddress_inner'>
                <div className='store_list'>
                    <h2>Hệ thống cửa hàng</h2>
                    <div className='list_items'>
                        {preview.map((s)=> (
                            <div key={s.id} className='store_item' onClick={()=> setActivePos(s.pos)}>
                                <h3>{s.name}</h3>
                                <p>Điện thoại: <a href={`tel:${s.phone}`}>{s.phone}</a></p>
                                <p className='store_actions'>
                                    <button onClick={(e)=>{ e.stopPropagation(); setActivePos(s.pos) }}>Xem trên bản đồ</button>
                                    <a className='directions' href={`https://www.google.com/maps/dir/?api=1&destination=${s.pos.lat},${s.pos.lng}`} target='_blank' rel='noreferrer'>Chỉ đường</a>
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className='store_map'>
                    <MapContainer center={center} zoom={13} style={{height:'100%', width:'100%'}} whenCreated={map=> mapRef.current = map}>
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                        />
                        {stores.map(s=> (
                            <Marker key={s.id} position={[s.pos.lat, s.pos.lng]}>
                                <Popup>
                                    <strong>{s.name}</strong><br/>
                                    <a href={`https://www.google.com/maps/dir/?api=1&destination=${s.pos.lat},${s.pos.lng}`} target='_blank' rel='noreferrer'>Chỉ đường tới đây</a>
                                </Popup>
                            </Marker>
                        ))}
                        <FlyTo position={activePos} />
                    </MapContainer>
                </div>
            </div>
        </main>
    )
}

export default StoreAddressPage