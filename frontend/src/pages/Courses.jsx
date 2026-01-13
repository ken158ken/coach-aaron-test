import React, { useState } from 'react';
import { FaCheck, FaVideo, FaComments, FaChartLine, FaCalendarCheck, FaInstagram, FaArrowRight, FaBrain, FaBriefcase, FaDollarSign } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Courses = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  // 陪跑課程方案
  const plans = [
    {
      id: 1,
      name: '三個月',
      price: 32800,
      sessions: 12,
      description: '1對1培訓 12次',
      color: 'bg-[#8B4D5C]',
      textColor: 'text-white',
      popular: false,
    },
    {
      id: 2,
      name: '六個月',
      price: 59800,
      sessions: 24,
      description: '1對1培訓 24次',
      color: 'bg-[#9B8B7A]',
      textColor: 'text-white',
      popular: true,
    },
    {
      id: 3,
      name: '一年',
      price: 118000,
      sessions: 48,
      description: '1對1培訓 48次',
      color: 'bg-white border-2 border-neutral',
      textColor: 'text-neutral',
      popular: false,
    },
  ];

  // 額外附贈課程
  const bonuses = [
    { name: '表達力心理學', value: 980 },
    { name: '反對問題成交話術', value: 480 },
    { name: '體驗課成交全流程', value: 1980 },
    { name: '私人教練續約必修課', value: 1980 },
    { name: '一對一陪跑訓練', value: 18000 },
    { name: '心理韌性與職涯定位', value: 18000 },
  ];

  const totalBonusValue = bonuses.reduce((sum, b) => sum + b.value, 0);

  // 三大核心
  const coreValues = [
    { icon: FaBrain, title: '心理韌性', desc: '建立強大的心理素質，面對挑戰不退縮' },
    { icon: FaBriefcase, title: '職涯規劃', desc: '找到你的定位，規劃長期發展路線' },
    { icon: FaDollarSign, title: '變現系統', desc: '打造系統化的收入模式' },
  ];

  // 教練痛點
  const painPoints = [
    '有專業，但不擅長銷售',
    '時間投入多，沒對應報酬',
    '談單亂槍打鳥，沒有系統',
    '客戶說有效果，卻不買單',
    '不擅長破冰做現場開發',
  ];

  // 三階段課程
  const phases = [
    {
      phase: '第一階段',
      period: '0-3個月',
      title: '業績衝刺期',
      subtitle: '新客成交 + 現場開發',
      items: ['體驗課成交系統', '現場開發實戰', '成交進度追蹤', '每週會議討論'],
    },
    {
      phase: '第二階段',
      period: '3-6個月',
      title: '建立長期收入',
      subtitle: '續約與轉介紹',
      items: ['會員關係心理學', '續約情緒時機', '轉介紹流程', '客戶管理表單'],
    },
    {
      phase: '第三階段',
      period: '6-12個月',
      title: '個人品牌與自媒體',
      subtitle: '打造你的影響力',
      items: ['自媒體定位', '口播腳本產出', '鏡頭表現力訓練', '打造個人商業模式'],
    },
  ];

  // 制度說明
  const systemFeatures = [
    { text: '每周一次視訊會議，進度檢核與行動指導', highlight: '每周一次' },
    { text: '指標追蹤（邀約數、成交數、續約率）', highlight: '指標追蹤' },
    { text: '即時訊息24小時回復', highlight: '24小時' },
    { text: '每季成果檢核與策略調整', highlight: '每季' },
  ];

  // 案例分享
  const caseStudies = [
    {
      username: 'weiyu056',
      name: '林韋佑｜阿黑｜彰化健身教練',
      posts: 199,
      followers: '4萬',
      following: 621,
      title: '新手教練→健身房老闆',
      description: '客製銷售結果、客戶經營、續約全流程\n自媒體運營、進修建議、健身房運營\n從0到1的陪跑計畫',
      image: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=400',
    },
    {
      username: 'jennylibra7',
      name: 'Jenny Chen',
      posts: 957,
      followers: '2.8萬',
      following: 1074,
      title: '空服員轉職SUP教練',
      description: '藉由心理學引導、Life coaching\n順著自己的內在\n找到人生與職涯方向',
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400',
    },
  ];

  return (
    <div className="min-h-screen bg-base-100">
      {/* Hero Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-base-200 to-base-100">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-primary font-semibold mb-4 tracking-widest">私人教練專屬</p>
          <h1 className="text-4xl md:text-6xl font-black mb-6">
            教練<span className="text-primary">陪跑</span>計畫
          </h1>
          <p className="text-xl text-base-content/70 mb-4">
            這是一個從銷售、經營到自媒體的陪跑系統
          </p>
          <p className="text-2xl font-bold mb-8">
            讓你從<span className="text-primary">教練</span>變成<span className="text-primary">經營者</span>
          </p>
        </div>
      </section>

      {/* 痛點區塊 */}
      <section className="py-16 px-6 bg-base-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">目前的<span className="text-error">現狀</span></h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="grid grid-cols-2 gap-4">
              <img 
                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400" 
                alt="健身訓練"
                className="rounded-lg shadow-lg"
              />
              <img 
                src="https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=400" 
                alt="健身訓練"
                className="rounded-lg shadow-lg"
              />
            </div>
            <div>
              <ul className="space-y-4">
                {painPoints.map((point, index) => (
                  <li key={index} className="flex items-center gap-3 text-lg">
                    <span className="w-2 h-2 bg-error rounded-full flex-shrink-0"></span>
                    {point}
                  </li>
                ))}
              </ul>
              <p className="mt-8 text-xl font-semibold">
                大部分的教練缺一個<span className="text-primary">專業變現</span>系統
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 核心價值 */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold mb-4 text-center">從<span className="text-primary">知道</span>到<span className="text-primary">做到</span>的改變</h2>
          <p className="text-center text-base-content/60 mb-12">三大核心系統，帶你突破瓶頸</p>
          
          <div className="flex flex-col md:flex-row justify-center items-center gap-8">
            {coreValues.map((value, index) => (
              <div key={index} className="relative">
                <div className="w-40 h-40 bg-[#8B4D5C] rounded-2xl flex flex-col items-center justify-center text-white shadow-xl hover:scale-105 transition-transform">
                  <value.icon className="text-4xl mb-2" />
                  <span className="text-xl font-bold">{value.title}</span>
                </div>
                {index < coreValues.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                    <div className="w-4 h-0.5 bg-[#8B4D5C]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 三階段課程 */}
      <section className="py-16">
        {phases.map((phase, index) => (
          <div key={index} className="py-16 px-6 bg-neutral text-white">
            <div className="max-w-6xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className={index % 2 === 1 ? 'md:order-2' : ''}>
                  <p className="text-4xl font-black mb-2">{phase.phase}（{phase.period}）</p>
                  <h3 className="text-2xl font-bold mb-6">{phase.title}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {phase.items.map((item, i) => (
                      <div key={i} className="bg-white/10 backdrop-blur rounded-full py-3 px-6 text-center">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
                <div className={`flex justify-center ${index % 2 === 1 ? 'md:order-1' : ''}`}>
                  <img 
                    src={`https://images.unsplash.com/photo-${index === 0 ? '1571019614242-c5c5dee9f50b' : index === 1 ? '1534438327276-14e5300c3a48' : '1517836357463-d25dfeac3438'}?auto=format&fit=crop&q=80&w=500`}
                    alt={phase.title}
                    className="rounded-lg shadow-2xl max-w-sm w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* 制度說明 */}
      <section className="py-20 px-6 bg-base-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-black mb-12 text-center">制度說明</h2>
          <div className="space-y-6">
            {systemFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-4 text-lg bg-base-100 p-4 rounded-lg shadow">
                <div className="w-3 h-3 bg-[#8B4D5C] rounded-full flex-shrink-0"></div>
                <p>
                  <span className="text-[#8B4D5C] font-bold">{feature.highlight}</span>
                  {feature.text.replace(feature.highlight, '')}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 案例分享 */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-12">案例分享</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {caseStudies.map((study, index) => (
              <div key={index} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="avatar">
                      <div className="w-16 rounded-full">
                        <img src={study.image} alt={study.name} />
                      </div>
                    </div>
                    <div>
                      <p className="font-bold">{study.username}</p>
                      <p className="text-sm text-base-content/60">{study.name}</p>
                    </div>
                    <a 
                      href={`https://instagram.com/${study.username}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-ghost ml-auto"
                    >
                      <FaInstagram className="text-pink-500" />
                    </a>
                  </div>
                  <div className="flex gap-6 text-sm mb-4">
                    <span><strong>{study.posts}</strong> 貼文</span>
                    <span><strong>{study.followers}</strong> 位粉絲</span>
                    <span><strong>{study.following}</strong> 追蹤中</span>
                  </div>
                  <h3 className="text-xl font-bold text-primary mb-2">{study.title}</h3>
                  <p className="whitespace-pre-line text-base-content/70">{study.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 價格方案 */}
      <section className="py-20 px-6 bg-gradient-to-br from-base-200 to-base-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-black mb-4 text-center">陪跑課程</h2>
          <p className="text-center text-base-content/60 mb-12">選擇適合你的方案，開始你的成長之路</p>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`card ${plan.popular ? 'ring-2 ring-primary' : ''} bg-base-100 shadow-xl hover:shadow-2xl transition-all cursor-pointer ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedPlan(plan.id)}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="badge badge-primary">最受歡迎</span>
                  </div>
                )}
                <div className="card-body items-center text-center">
                  <div className={`w-24 h-24 rounded-full ${plan.color} ${plan.textColor} flex flex-col items-center justify-center mb-4`}>
                    <span className="text-lg font-bold">{plan.name}</span>
                    <span className="text-xs">{plan.price.toLocaleString()}元</span>
                  </div>
                  <h3 className="text-3xl font-black">NT$ {plan.price.toLocaleString()}</h3>
                  <p className="text-base-content/60">{plan.description}</p>
                  <div className="divider"></div>
                  <ul className="text-left space-y-2">
                    <li className="flex items-center gap-2">
                      <FaCheck className="text-success" />
                      <span>1對1培訓 {plan.sessions}次</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheck className="text-success" />
                      <span>每週視訊會議</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheck className="text-success" />
                      <span>24小時訊息回覆</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <FaCheck className="text-success" />
                      <span>額外附贈課程</span>
                    </li>
                  </ul>
                  <button className="btn btn-primary btn-block mt-4">選擇方案</button>
                </div>
              </div>
            ))}
          </div>

          {/* 附贈課程 */}
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="text-2xl font-bold mb-4">
                額外附贈，總值 <span className="text-primary">NT$ {totalBonusValue.toLocaleString()}</span>
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bonuses.map((bonus, index) => (
                  <div key={index} className="flex items-center gap-3 bg-base-200 p-3 rounded-lg">
                    <FaCheck className="text-success flex-shrink-0" />
                    <span>{bonus.name}</span>
                    <span className="ml-auto text-sm text-base-content/60">NT${bonus.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-neutral text-neutral-content">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">教練變現實戰力</h2>
          <p className="text-xl mb-8">專業變現，打造穩定收入系統</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact" className="btn btn-primary btn-lg gap-2">
              立即諮詢 <FaArrowRight />
            </Link>
            <a 
              href="https://www.instagram.com/coach.luen/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-neutral gap-2"
            >
              <FaInstagram /> 追蹤了解更多
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Courses;
