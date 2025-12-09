
import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom'

import OrderItem from './OrderItem'
import Bank from './Bank'
import Address from './Address'
import ChangePassword from './ChangePassword'
import NotificationsSettings from './NotificationsSettings'
import PrivacySettings from './PrivacySettings'
import Notifications from './Notifications'
import Vouchers from './Vouchers'

import { getInfor, updateInfor, getOrder } from '../../services/Auth.api'
import './userpage.scss'
import { useToast } from '../../components/ToastProvider'

const UserPage = ()=>{
    const nav = useNavigate()
    const location = useLocation()
    const {feature} = useParams()
    const [ board, setBoard ] = useState()
    const [ orderList, setOrderList ] = useState()    
    const [ userID, setUserID ] = useState(localStorage.getItem('userID') || sessionStorage.getItem("userID"))
    const [ userData, setUserData ] = useState()
    const [ loading, setLoading ] = useState(false)
    const [ showSocialBanner, setShowSocialBanner ] = useState(true)
    const [ saveMessage, setSaveMessage ] = useState(null)
    useEffect(()=>{
        setBoard(feature)
        window.scrollTo({top: '0', behavior: 'smooth'})
        if (!userID) {
            const next = encodeURIComponent(location.pathname + location.search + location.hash)
            nav(`/login?next=${next}`)
        }
    }, [feature, userID, nav, location.pathname, location.search, location.hash])
    const { showToast } = useToast()
    const getUserInfor = useCallback(async ()=>{
        const response = await getInfor()
        if (response.status != 201){
            showToast(response.message || 'Lỗi khi tải thông tin người dùng', 'error')
            nav('/')
            return
        }
        setLoading(false)
        // Prefill with social data if present (after social OAuth login)
        const prefills = {}
        const socialName = sessionStorage.getItem('social_name')
        const socialEmail = sessionStorage.getItem('social_email')
        const socialAvatar = sessionStorage.getItem('social_avatar')
        if (socialName && (!response.data.name || response.data.name.trim() === '')) prefills.name = socialName
        if (socialEmail && (!response.data.email || response.data.email.trim() === '')) prefills.email = socialEmail
        if (socialAvatar && (!response.data.avatar || response.data.avatar.trim() === '')) prefills.avatar = socialAvatar
        const merged = { ...response.data, ...prefills }
        setUserData(merged)
    }, [nav, showToast])
    const getOrderList = useCallback(async ()=>{
        const res = await getOrder()
        if (res.status != 201){
            showToast(res.message || 'Lỗi khi lấy đơn hàng', 'error')
            return
        }
        setLoading(false)
        setOrderList(res.data.reverse())
    }, [showToast])
    useEffect(()=>{
        const userInfoBoards = ['profile', 'bank', 'address', 'notifications-settings', 'privacy', 'notifications', 'vouchers']
        setLoading(true)
        setUserID(localStorage.getItem('userID') || sessionStorage.getItem("userID"))
        if (userInfoBoards.includes(feature)) getUserInfor()
        if (feature == 'order') getOrderList()
        else setLoading(false)
    },[feature, userID, getUserInfor, getOrderList])

    // Persist helper: called when subpages update user data
    const persistUserData = async (nextUserData) => {
        setUserData(nextUserData)
        try{
            const res = await updateInfor(nextUserData)
            if (res && (res.status == 201 || res.status === '201')){
                setSaveMessage({ type: 'success', text: res.message || 'Lưu thông tin thành công' })
                setTimeout(()=> setSaveMessage(null), 3000)
            } else {
                setSaveMessage({ type: 'error', text: res?.message || 'Lưu thất bại' })
                setTimeout(()=> setSaveMessage(null), 3000)
                console.error('Failed to persist user data', res)
            }
        }catch(e){ console.error('persistUserData error', e) }
    }
    const handleReBuy = () => {
        // TODO: Implement re-buy functionality
        showToast('Chức năng mua lại chưa được triển khai', 'info');
    }

    const handleChangeUserData = (key, value) => {
        if (key == 'avatar'){
            var maxSizeInBytes = 1 * 1024 * 1024; 
            if (value.size > maxSizeInBytes) {
                showToast("Vui lòng chọn hình ảnh nhỏ hơn 1MB", 'error')
                return
            }
            var reader = new FileReader();
            reader.onloadend = ()=> setUserData({...userData, avatar: reader.result})
            reader.readAsDataURL(value);
            return
        }
        setUserData({...userData, [key]: value})
    }

    async function handleSaveInfor (e){
        e.preventDefault()
        const res = await updateInfor(userData)
        if (res && (res.status == 201 || res.status === '201')){
            setSaveMessage({ type: 'success', text: res.message || 'Lưu thông tin thành công' })
            setTimeout(()=> setSaveMessage(null), 3000)
        } else {
            setSaveMessage({ type: 'error', text: res?.message || 'Lưu thất bại' })
            setTimeout(()=> setSaveMessage(null), 3000)
        }
        // If update succeeded, clear temporary social prefill data
        if (res && (res.status == 201 || res.status == '201')){
            try{
                sessionStorage.removeItem('social_name')
                sessionStorage.removeItem('social_email')
                sessionStorage.removeItem('social_avatar')
            } catch(e){ console.warn(e) }
            setShowSocialBanner(false)
        }
    }
    return(
        <main className="userpage">
            <aside className="sidebar">
                <div className="sidebar_avt">
                    <img src={userData?.avatar || '/ava.svg'} alt="avt" className="sidebar_avt_img" />
                    <div className="sidebar_avt_username">
                        <p>{userData?.username}</p>
                    <Link to="/user/profile">Sửa hồ sơ</Link>
                    </div>
                </div>
                <nav className="sidebar_nav">
                    <ul>
                        <li><Link to="/user/profile">Tài khoản của tôi</Link></li>
                        <ul className="sidebar_nav_list">
                            <li><Link to="/user/profile">Hồ sơ</Link></li>
                            <li><Link to="/user/bank">Ngân Hàng</Link></li>
                            <li><Link to="/user/address">Địa Chỉ</Link></li>
                            <li><Link to="/user/change-password">Đổi Mật Khẩu</Link></li>
                            <li><Link to="/user/notifications-settings">Cài Đặt Thông Báo</Link></li>
                            <li><Link to="/user/privacy">Những  Thiết Lập Riêng Tư</Link></li>
                        </ul>
                        <li><Link to="/user/order">Đơn Mua</Link></li>
                        <li><Link to="/user/notifications">Thông báo</Link></li>
                        <li><Link to="/user/vouchers">Kho Voucher</Link></li>
                    </ul>
                </nav>
            </aside>
            <section className="board">
                {/* Loading state is now non-blocking; components render and handle missing data */}
                {
                    board === 'profile' && 
                    !loading &&
                    <div className="profile">
                        <div className="profile_header">
                            <p>Hồ Sơ Của Tôi</p>
                            <p>Quản lý thông tin hồ sơ để bảo mật tài khoản</p>
                        </div>
                        {
                            (showSocialBanner && (sessionStorage.getItem('social_name') || sessionStorage.getItem('social_email'))) &&
                            <div className="social-prefill-banner">
                                <p>Chúng tôi đã điền thông tin từ tài khoản xã hội của bạn. Vui lòng kiểm tra và nhấn "Lưu" để cập nhật.</p>
                                <div style={{display:'flex', gap:8}}>
                                    <button className="btn" onClick={()=>setShowSocialBanner(false)}>Đóng</button>
                                </div>
                            </div>
                        }
                        <form className="profile_form" onSubmit={handleSaveInfor}>
                            <div className="label-list">
                                <label htmlFor="username">Tên đăng nhập</label>
                                <label htmlFor="name">Tên</label>
                                <label htmlFor="email">Email</label>
                                <label htmlFor="phone" className="required">Sô điện thoại</label>
                                <label htmlFor="birthday">Ngày sinh</label>
                                <label htmlFor="sex">Giới tính</label>
                            </div>
                            <div className="input-list">
                                <p>{userData?.username}</p>
                                <input type="text" name="name" id="name" defaultValue={userData?.name} onChange={(e)=>handleChangeUserData('name',e.target.value)} />
                                <input type="email" name="email" id="email" defaultValue={userData?.email}/>
                                <input type="tel" name="phone" id="phone" defaultValue={userData?.phoneNumber} required pattern="[0-9]{10}" onChange={(e)=>handleChangeUserData('phoneNumber',e.target.value)} />
                                <input type="date" name="birthday" id="birthday" defaultValue={userData?.birthday} onChange={(e)=>handleChangeUserData('birthday',e.target.value)} />
                                <div className="sex-options">
                                    <input type="radio" name="sex" id="male" checked={userData?.sex == "male" ? true : false}  onChange={()=>handleChangeUserData('sex', 'male')}/>
                                    <label htmlFor="male"> Nam </label>
                                    <input type="radio" name="sex" id="female" checked={userData?.sex == "female" ? true : false} onChange={()=>handleChangeUserData('sex', 'female')} />
                                    <label htmlFor="female"> Nữ </label>
                                    <input type="radio" name="sex" id="null" checked={userData?.sex == null ? true : false} onChange={()=>handleChangeUserData('sex', null)} />
                                    <label htmlFor="null"> Khác </label>
                                </div>
                                <button className="infor_list_btn pointer">Lưu</button>
                            </div>
                            <div className="infor_avt">
                                <div className="infor_avt_img" style={{backgroundImage: `url(${userData?.avatar || '/ava.svg'})`}}></div>
                                <input type="file" name="avt" id="avt" onChange={(e)=>handleChangeUserData('avatar', e.target.files[0])} />
                                <label htmlFor="avt" className="edit-avatar-btn">Chọn Ảnh</label>
                                <p>Dung lượng file tối đa 1MB <br /> Định dạng: JPEG, PNG</p>
                            </div>
                            {saveMessage && <div className={`save-toast ${saveMessage.type}`}>{saveMessage.text}</div>}
                        </form>
                    </div>
                }
                    {
                        board === 'bank' && <Bank userData={userData} onUpdate={(next)=>persistUserData(next)} />
                    }
                    {
                        board === 'address' && <Address userData={userData} onUpdate={(next)=>persistUserData(next)} />
                    }
                    {
                        board === 'change-password' && <ChangePassword onChangePassword={(p)=>console.log('change password', p)} />
                    }
                    {
                        board === 'notifications-settings' && <NotificationsSettings userData={userData} onUpdate={(next)=>persistUserData(next)} />
                    }
                    {
                        board === 'privacy' && <PrivacySettings userData={userData} onUpdate={(next)=>persistUserData(next)} />
                    }
                    {
                        board === 'notifications' && <Notifications userData={userData} />
                    }
                    {
                        board === 'vouchers' && <Vouchers userData={userData} onUpdate={(next)=>persistUserData(next)} />
                    }
                {
                    board === 'order' &&
                    !loading &&
                    <div className="order">
                        <p className="order_title">Danh sách đơn mua</p>
                        <div className="order_list">
                            {
                                orderList?.map((order, index) => {
                                    return (
                                        <div className="order_list_item" key={index}>
                                            <div className="order_list_item_header">
                                                <div>
                                                    <p>Địa chỉ: {order.address}</p>
                                                    <p>Ngày mua: {order.orderDay}</p>
                                                </div>
                                                {
                                                    order.orderStatus === "completed" &&
                                                    <p>
                                                        <span className='state'> Giao hàng thành công </span>
                                                        <span className='oder-status'> Hoàn Thành </span>
                                                    </p>
                                                }
                                                {
                                                    order.orderStatus === "pending" &&
                                                    <p>
                                                        <span className='pending'> Đang xử lý </span>
                                                    </p>
                                                }
                                                {
                                                    order.orderStatus === "cancled" &&
                                                    <p>
                                                        <span className='cancled'> Đơn hàng đã bị huỷ </span>
                                                    </p>
                                                }
                                            </div>
                                            <div className="order_list_item_list">
                                                {
                                                    order?.orderList?.map((item, index) => <OrderItem item={item} index={index} key={index}/>)
                                                }
                                            </div>
                                            <div className="order_list_item_footer">
                                                <p>
                                                    Thành tiền: { order.totalOder.toLocaleString('it-IT', {style :"currency", currency : "VND"})}
                                                </p>
                                                <div className="footer-btn">
                                                    {
                                                        order.orderStatus !== "pending" && <div className="btn bg-black" onClick={()=>handleReBuy()}>Mua lại</div>
                                                    }
                                                    {
                                                        order.orderStatus === "pending" && <div className="btn bg-black">Hủy đơn</div>
                                                    }
                                                    <Link to="/contacts" className="btn">Liên hệ người bán</Link>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            }
                        </div>
                    </div>
                }
            </section>
        </main>
    )
}

export default UserPage;