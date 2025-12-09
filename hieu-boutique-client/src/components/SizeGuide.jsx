import { useState } from 'react'
import './componentStyle/SizeGuide.scss'

const SizeGuide = ({children})=>{
    const [open, setOpen] = useState(false)
    return (
        <>
            <button className="size-guide-link" onClick={()=> setOpen(true)}>{children || 'Hướng dẫn chọn size'}</button>
            {open && (
                <div className="size-guide-modal" role="dialog" aria-modal="true">
                    <div className="size-guide-overlay" onClick={()=> setOpen(false)}></div>
                    <div className="size-guide-box">
                        <header>
                            <h3>Hướng dẫn chọn size</h3>
                            <button className="close" onClick={()=> setOpen(false)}>×</button>
                        </header>
                        <div className="size-guide-content">
                            <p>Để chọn size phù hợp, bạn hãy đo 3 vòng cơ bản sau:</p>
                            <ol>
                                <li><b>Vòng ngực</b>: đo phần to nhất quanh ngực (cm).</li>
                                <li><b>Vòng eo</b>: đo phần nhỏ nhất quanh eo (cm).</li>
                                <li><b>Vòng mông</b>: đo phần to nhất quanh mông (cm).</li>
                            </ol>
                            <p>Sau khi có số đo, đối chiếu với bảng tương đối bên dưới. Bảng này là tham khảo, một số mẫu ôm/ rộng sẽ khác nhau.</p>
                            <table className="size-table" cellSpacing="0">
                                <thead>
                                    <tr>
                                        <th>Size</th>
                                        <th>Ngực (cm)</th>
                                        <th>Eo (cm)</th>
                                        <th>Mông (cm)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr><td>XS</td><td>76 - 80</td><td>58 - 62</td><td>82 - 86</td></tr>
                                    <tr><td>S</td><td>80 - 86</td><td>62 - 68</td><td>86 - 92</td></tr>
                                    <tr><td>M</td><td>86 - 92</td><td>68 - 74</td><td>92 - 98</td></tr>
                                    <tr><td>L</td><td>92 - 98</td><td>74 - 80</td><td>98 - 104</td></tr>
                                    <tr><td>XL</td><td>98 - 104</td><td>80 - 86</td><td>104 - 110</td></tr>
                                </tbody>
                            </table>
                            <p className="note"><i>Lưu ý: Nếu bạn nằm giữa 2 size, hãy chọn size lớn hơn nếu muốn mặc thoải mái hoặc lựa size nhỏ hơn nếu thích ôm.</i></p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default SizeGuide
