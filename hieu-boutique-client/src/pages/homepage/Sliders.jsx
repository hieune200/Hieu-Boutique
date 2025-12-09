
// homeSlides import removed (not used here)
import './homepageStyle/Sliders.scss';


import slide11 from '../../assets/imgs/home/slide11.png';
import slide12 from '../../assets/imgs/home/slide12.png';
import slide13 from '../../assets/imgs/home/slide13.png';

const Sliders = () => {
    return (
        <section className="slider">
            <div className="contain">
                <div className="contain_img">
                    <img src={slide11} alt="Bộ sưu tập 1" className='animation-img up' />
                    <img src={slide12} alt="Bộ sưu tập 2" className='animation-img down' />
                    <img src={slide13} alt="Bộ sưu tập 3" className='animation-img up' />
                </div>
                <div className="contain_content">
                    <h3 className="title">Ngọc Điểm Nghênh Xuân</h3>
                    <p className='des'>Đất trời chuyển giao đón nắng Xuân mới, những đóa hoa tinh khiết chờ gió Xuân đưa nở chính là cảm hứng để chúng tôi giới thiệu tới phái đẹp Việt BST Áo dài Tết 2026 với tên gọi: "NGỌC ĐIỂM NGHÊNH XUÂN", ý niệm chúc mỗi người phụ nữ diện lên mình tà Áo dài Ngọc Điểm đều "đẹp tựa hoa" - một vẻ đẹp yêu kiều, toát lên vẻ thanh tú, sang trọng không thể rời mắt.</p>
                </div>
            </div>
        </section>
    );
}
export default Sliders;