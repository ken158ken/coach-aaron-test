/**
 * 註冊頁面元件
 *
 * 提供使用者註冊介面,包含完整的表單驗證、密碼確認和錯誤處理。
 * 註冊成功後自動導向會員中心頁面。
 *
 * @module pages/Register
 */

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import type { Gender } from "@/types";

/**
 * 註冊表單資料介面
 */
interface RegisterFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  phoneNumber: string;
  gender?: Gender;
}

/**
 * 註冊頁面元件
 *
 * 處理使用者註冊流程,包含表單驗證、密碼確認和錯誤訊息顯示。
 *
 * @returns {JSX.Element} 註冊頁面元件
 */
const Register: React.FC = (): JSX.Element => {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    phoneNumber: "",
  });
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  /**
   * 處理表單輸入變更
   *
   * @param {React.ChangeEvent<HTMLInputElement>} e - 輸入事件
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  /**
   * 處理表單提交
   *
   * @param {React.FormEvent<HTMLFormElement>} e - 表單事件
   */
  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();
    setError("");

    // 驗證
    if (formData.password !== formData.confirmPassword) {
      setError("密碼不一致");
      return;
    }

    if (formData.password.length < 6) {
      setError("密碼至少需要 6 個字元");
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name: formData.displayName || formData.username,
        email: formData.email,
        phone_number: formData.phoneNumber,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        gender: formData.gender || "other",
      });

      setLoading(false);

      if (res?.success) {
        navigate("/member");
      } else {
        setError(res?.message || "註冊失敗");
      }
    } catch (err) {
      setLoading(false);
      setError("註冊過程發生錯誤");
      console.error("Register error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4 py-8">
      <div className="card w-full max-w-md bg-base-100 shadow-2xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold justify-center mb-4">
            會員 <span className="text-primary">註冊</span>
          </h2>

          {error && (
            <div className="alert alert-error text-sm py-2 mb-4">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">帳號 *</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="username"
                  className="input input-bordered"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">顯示名稱</span>
                </label>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  placeholder="您的名稱"
                  className="input input-bordered"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email *</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">手機號碼</span>
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                placeholder="0912345678"
                className="input input-bordered"
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">密碼 *</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="至少 6 個字元"
                className="input input-bordered"
                required
                minLength={6}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">確認密碼 *</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="再次輸入密碼"
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary ${loading ? "loading" : ""}`}
                disabled={loading}
              >
                {loading ? "註冊中..." : "註冊"}
              </button>
            </div>
          </form>

          <div className="divider">或</div>

          <p className="text-center text-sm">
            已有帳號?{" "}
            <Link to="/login" className="link link-primary">
              立即登入
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
