import React from 'react';
import Hero from '../components/Hero';
import { Link } from 'react-router-dom';
import { FaInstagram, FaFacebook, FaTiktok, FaPodcast, FaPlay, FaStar, FaQuoteLeft, FaHeadphones } from 'react-icons/fa';

const Home = () => {
  // Podcast 精選集數（來自 Apple Podcast 真實資料）
  const podcastEpisodes = [
    { id: 58, title: '動作學習，你一定要知道的四個步驟！', duration: '12 分鐘', date: '2022/01/27' },
    { id: 57, title: '年度回顧，你有達成當初設立的目標嗎？', duration: '13 分鐘', date: '2021/12/30' },
    { id: 56, title: '外食族必須知道的三種飲食控制技巧', duration: '11 分鐘', date: '2021/12/19' },
    { id: 55, title: '不用計算熱量也能瘦的方法', duration: '14 分鐘', date: '2021/12/17' },
    { id: 54, title: '健身找個伴，有那麼困難嗎？', duration: '11 分鐘', date: '2021/11/29' },
    { id: 53, title: '健身提升影響力的三個方法', duration: '11 分鐘', date: '2021/11/14' },
  ];

  // 真實用戶評價（來自 Apple Podcast）
  const reviews = [
    { 
      name: '阿雅婆爆', 
      date: '2021/12/14',
      content: '昨天晚上偶然發現的Podcast，內容實在、口條清晰，而且不會無聊！邊練邊聽很有意思💪💪💪',
      rating: 5
    },
    { 
      name: 'adair014678', 
      date: '2021/10/26',
      content: '以前給教練帶過。內容優秀',
      rating: 5
    },
  ];

  return (
    <div className="bg-base-100">
      <Hero />
      
      {/* Coach Intro Section */}
      <section className="pt-24 pb-20 px-6 lg:px-24 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
             <img 
               src="/photos/coach-1.jpg" 
               alt="阿倫教官" 
               className="rounded-lg shadow-2xl w-full h-auto object-cover object-top aspect-[3/4]"
             />
          </div>
          <div className="lg:w-1/2 space-y-6">
            <p className="text-primary font-semibold tracking-widest">心理學 × 健身講師</p>
            <h2 className="text-4xl font-bold tracking-tight">關於 <span className="text-primary">阿倫教官</span></h2>
            <p className="text-lg leading-relaxed text-base-content/80">
              運動和健身是一件不容易的事情。我們好不容易跨出了第一步，
              卻因為看不到成果，加上運動帶給身體的疲勞感，而選擇放棄。
              <br/><br/>
              我的頻道結合了心理學的知識，幫助你在讓自己身體更好的路上，
              同時有著心理層次的支持。讓我們帶著身心健康，一起往前進吧！
            </p>
            
            {/* Social Stats */}
            <div className="stats shadow bg-base-200 w-full">
              <div className="stat place-items-center">
                <div className="stat-title">Podcast</div>
                <div className="stat-value text-purple-500 text-xl">陪你健身</div>
                <div className="stat-desc">58集 • 4.8⭐</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title">Instagram</div>
                <div className="stat-value text-pink-500 text-xl">@coach.luen</div>
                <div className="stat-desc">追蹤互動</div>
              </div>
              <div className="stat place-items-center">
                <div className="stat-title">活躍年代</div>
                <div className="stat-value text-primary text-xl">2021-今</div>
                <div className="stat-desc">持續更新</div>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex gap-3 flex-wrap">
              <a href="https://www.instagram.com/coach.luen/" target="_blank" rel="noopener noreferrer" 
                 className="btn btn-outline gap-2 hover:bg-pink-500 hover:border-pink-500">
                <FaInstagram /> Instagram
              </a>
              <a href="https://www.facebook.com/populuen/" target="_blank" rel="noopener noreferrer"
                 className="btn btn-outline gap-2 hover:bg-blue-600 hover:border-blue-600">
                <FaFacebook /> Facebook
              </a>
              <a href="https://www.tiktok.com/@coachluen" target="_blank" rel="noopener noreferrer"
                 className="btn btn-outline gap-2 hover:bg-black hover:border-black">
                <FaTiktok /> TikTok
              </a>
              <a href="https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280" target="_blank" rel="noopener noreferrer"
                 className="btn btn-outline gap-2 hover:bg-purple-600 hover:border-purple-600">
                <FaPodcast /> Podcast
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Podcast Section with Episodes */}
      <section className="py-16 bg-gradient-to-r from-purple-900 to-purple-700 text-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <FaPodcast className="text-6xl mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl font-bold mb-4">🎧 Podcast「陪你健身」</h2>
            <p className="text-lg opacity-90 mb-2">
              運動和健身是一件不容易的事情，讓我們結合心理學知識，
              <br/>幫助你在讓自己身體更好的路上，同時有著心理層次的支持。
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} />
                ))}
              </div>
              <span>4.8 • 54則評價</span>
            </div>
          </div>

          {/* Episode Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {podcastEpisodes.map((episode) => (
              <a 
                key={episode.id}
                href="https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/20 transition-colors group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-400 transition-colors">
                    <FaHeadphones className="text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs opacity-70 mb-1">#{episode.id} • {episode.date}</p>
                    <h3 className="font-semibold text-sm leading-tight truncate">{episode.title}</h3>
                    <p className="text-xs opacity-70 mt-1">{episode.duration}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>

          <div className="text-center">
            <a 
              href="https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-lg bg-white text-purple-700 hover:bg-gray-100 border-none gap-2"
            >
              <FaPlay /> 收聽全部 58 集
            </a>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-16 px-6 bg-base-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">聽眾<span className="text-primary">好評</span></h2>
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((review, index) => (
              <div key={index} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <FaQuoteLeft className="text-3xl text-primary/20 mb-2" />
                  <p className="text-base-content/80 italic mb-4">"{review.content}"</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{review.name}</p>
                      <p className="text-sm text-base-content/60">{review.date}</p>
                    </div>
                    <div className="flex text-yellow-500">
                      {[...Array(review.rating)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Content Topics */}
      <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">內容<span className="text-primary">主題</span></h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🏋️', title: '動作學習', desc: '正確姿勢與技巧' },
              { emoji: '🥗', title: '飲食控制', desc: '外食族也能瘦' },
              { emoji: '🧠', title: '心理建設', desc: '突破心理障礙' },
              { emoji: '📈', title: '目標設定', desc: '達成訓練目標' },
              { emoji: '💪', title: '肌力訓練', desc: '增肌減脂方法' },
              { emoji: '🤝', title: '夥伴互助', desc: '健身找伴技巧' },
              { emoji: '⭐', title: '影響力', desc: '提升個人魅力' },
              { emoji: '🩹', title: '傷害預防', desc: '避免運動傷害' },
            ].map((topic, index) => (
              <div key={index} className="card bg-base-200 hover:bg-base-300 transition-colors cursor-default">
                <div className="card-body items-center text-center p-4">
                  <span className="text-4xl mb-2">{topic.emoji}</span>
                  <h3 className="font-bold">{topic.title}</h3>
                  <p className="text-sm text-base-content/60">{topic.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-neutral text-neutral-content text-center">
        <div className="max-w-2xl mx-auto px-6">
           <h2 className="text-3xl font-bold mb-6">準備好開始了嗎？</h2>
           <p className="mb-8 text-lg">立即加入線上課程，或是預約一對一諮詢。</p>
           <div className="flex justify-center gap-4 flex-wrap">
             <Link to="/courses" className="btn btn-primary btn-lg">瀏覽課程</Link>
             <Link to="/videos" className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-neutral">看短影音</Link>
             <Link to="/contact" className="btn btn-ghost btn-lg">聯絡我</Link>
           </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
