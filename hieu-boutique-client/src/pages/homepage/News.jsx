
import './homepageStyle/News.scss'
import { Link } from 'react-router-dom'
import newsArticles from '../../services/model/newsArticles'

const News = ()=>{

    return (
        <section className="news">
            <h2 className="section-title">Bài viết mới nhất</h2>
            <div className="news_list">
                {
                    newsArticles.map((data)=>{
                        return (
                            <Link to={`/news/${data.id}`} className="news-cpn pointer" key={data.id}>
                                <div className="news-cpn_img">
                                    <img src={data.img} alt={data.title} />
                                </div>
                                <h3 className="title">{data.title}</h3>
                                <p className="des">{data.short}</p>
                            </Link>
                        )
                    })
                }
            </div>
        </section>
    )
}

export default News;