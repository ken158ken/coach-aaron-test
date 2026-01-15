/**
 * 聯絡頁面元件
 *
 * 提供聯絡表單和社群媒體連結,讓用戶可以透過多種管道與教練聯繫。
 * 包含表單驗證和社群平台資訊展示。
 *
 * @module pages/Contact
 */

import React from "react";
import {
  FaInstagram,
  FaFacebook,
  FaTiktok,
  FaPodcast,
  FaEnvelope,
  FaCommentDots,
} from "react-icons/fa";
import type { IconType } from "react-icons";

/**
 * 社群連結介面
 */
interface SocialLink {
  icon: IconType;
  name: string;
  handle: string;
  url: string;
  color: string;
  desc: string;
}

/**
 * 聯絡頁面元件
 *
 * 展示聯絡表單和社群媒體資訊,提供多元的聯繫管道。
 *
 * @returns {JSX.Element} 聯絡頁面元件
 */
const Contact: React.FC = (): JSX.Element => {
  /**
   * 社群媒體連結列表
   */
  const socialLinks: SocialLink[] = [
    {
      icon: FaInstagram,
      name: "Instagram",
      handle: "@coach.luen",
      url: "https://www.instagram.com/coach.luen/",
      color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
      desc: "追蹤我的日常訓練分享",
    },
    {
      icon: FaFacebook,
      name: "Facebook",
      handle: "阿倫好健",
      url: "https://www.facebook.com/populuen/",
      color: "bg-blue-600",
      desc: "按讚粉專獲得最新消息",
    },
    {
      icon: FaTiktok,
      name: "TikTok",
      handle: "@coachluen",
      url: "https://www.tiktok.com/@coachluen",
      color: "bg-black",
      desc: "觀看短影音教學內容",
    },
    {
      icon: FaPodcast,
      name: "Podcast",
      handle: "陪你健身",
      url: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
      color: "bg-purple-600",
      desc: "收聽 58 集健身心理學",
    },
  ];

  return (
    <div className="min-h-screen bg-base-200 py-12 px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            聯絡 <span className="text-primary">阿倫教官</span>
          </h1>
          <p className="text-base-content/70 text-lg">
            有任何問題歡迎隨時聯絡我!
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="card bg-base-100 shadow-2xl">
            <div className="card-body">
              <h2 className="card-title text-2xl font-bold mb-4">
                <FaEnvelope className="text-primary" /> 發送訊息
              </h2>
              <form className="space-y-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">姓名</span>
                  </label>
                  <input
                    type="text"
                    placeholder="您的姓名"
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input
                    type="email"
                    placeholder="example@mail.com"
                    className="input input-bordered w-full"
                  />
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">詢問主題</span>
                  </label>
                  <select className="select select-bordered w-full">
                    <option disabled selected>
                      選擇主題
                    </option>
                    <option>陪跑課程諮詢</option>
                    <option>一對一教練服務</option>
                    <option>企業講座邀約</option>
                    <option>合作提案</option>
                    <option>其他問題</option>
                  </select>
                </div>
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">訊息內容</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered h-32"
                    placeholder="請輸入您的訊息..."
                  />
                </div>
                <div className="form-control mt-6">
                  <button className="btn btn-primary w-full gap-2">
                    <FaCommentDots /> 送出訊息
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Social Links */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl font-bold mb-4">社群媒體</h2>
                <p className="text-base-content/70 mb-6">
                  最快的聯絡方式是透過 Instagram 私訊!
                  <br />
                  我會盡快回覆你的訊息 💪
                </p>
                <div className="space-y-4">
                  {socialLinks.map((social, index) => (
                    <a
                      key={index}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-4 p-4 rounded-lg bg-base-200 hover:bg-base-300 transition-colors group"
                    >
                      <div
                        className={`w-12 h-12 ${social.color} rounded-full flex items-center justify-center text-white`}
                      >
                        <social.icon className="text-xl" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold group-hover:text-primary transition-colors">
                          {social.name}
                        </p>
                        <p className="text-sm text-base-content/60">
                          {social.handle}
                        </p>
                        <p className="text-xs text-base-content/50">
                          {social.desc}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Info */}
            <div className="card bg-primary text-primary-content">
              <div className="card-body">
                <h3 className="font-bold text-lg">💡 小提示</h3>
                <p>
                  如果你對「私人教練陪跑計畫」有興趣, 可以先到
                  <a href="/courses" className="underline font-bold">
                    課程頁面
                  </a>
                  了解詳情, 再來諮詢會更有效率喔!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
