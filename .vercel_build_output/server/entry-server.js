import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import React, { createContext, useState, useCallback, useEffect, useContext, useRef, useMemo, StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server.mjs";
import { useLocation, Link, Outlet, useNavigate, NavLink, Routes, Route } from "react-router-dom";
import axios from "axios";
const apiClient = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 3e4
  // 30 秒超時
});
apiClient.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    console.error("請求錯誤:", error);
    return Promise.reject(error);
  }
);
apiClient.interceptors.response.use(
  (response) => response.data,
  // 直接返回 data
  (error) => {
    var _a, _b, _c, _d, _e;
    if (((_a = error.response) == null ? void 0 : _a.status) === 401) {
      window.location.href = "/login";
    }
    const errorMessage = ((_c = (_b = error.response) == null ? void 0 : _b.data) == null ? void 0 : _c.error) || error.message || "請求失敗";
    console.error("API 錯誤:", {
      status: (_d = error.response) == null ? void 0 : _d.status,
      message: errorMessage,
      url: (_e = error.config) == null ? void 0 : _e.url
    });
    return Promise.reject(error);
  }
);
const get = (url, config) => {
  return apiClient.get(url, config);
};
const post = (url, data, config) => {
  return apiClient.post(url, data, config);
};
const authService = {
  /**
   * 登入
   */
  async login(credentials) {
    return post("/api/auth/login", credentials);
  },
  /**
   * 註冊
   */
  async register(data) {
    return post("/api/auth/register", data);
  },
  /**
   * 登出
   */
  async logout() {
    return post("/api/auth/logout");
  },
  /**
   * 檢查認證狀態
   */
  async checkAuth() {
    return get("/api/auth/me");
  }
};
const AuthContext = createContext(null);
const isServer = typeof window === "undefined";
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const checkAuth = useCallback(async () => {
    if (isServer) {
      setLoading(false);
      return;
    }
    try {
      const response = await authService.checkAuth();
      setUser(response.user);
      setIsAdmin(response.isAdmin);
    } catch (error) {
      setUser(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);
  const login = useCallback(
    async (email, password) => {
      if (isServer) {
        throw new Error("Cannot login on server");
      }
      try {
        const response = await authService.login({ email, password });
        setUser(response.user);
        await checkAuth();
      } catch (error) {
        console.error("登入失敗:", error);
        throw error;
      }
    },
    [checkAuth]
  );
  const register = useCallback(
    async (data) => {
      if (isServer) {
        throw new Error("Cannot register on server");
      }
      try {
        const { confirmPassword, ...registerData } = data;
        const response = await authService.register(registerData);
        setUser(response.user);
        await checkAuth();
      } catch (error) {
        console.error("註冊失敗:", error);
        throw error;
      }
    },
    [checkAuth]
  );
  const logout = useCallback(async () => {
    if (isServer) return;
    try {
      await authService.logout();
      setUser(null);
      setIsAdmin(false);
    } catch (error) {
      console.error("登出失敗:", error);
      throw error;
    }
  }, []);
  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    checkAuth
  };
  return /* @__PURE__ */ jsx(AuthContext.Provider, { value, children });
};
const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
const Navbar = () => {
  const { user, logout, mounted } = useAuth();
  const navRef = useRef(null);
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined" && navRef.current) {
      import("./assets/index-N6a9ipeV.js").then(({ default: gsap }) => {
        gsap.fromTo(
          navRef.current,
          { y: -100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" }
        );
      });
    }
  }, []);
  const baseNavLinks = [
    { name: "教練介紹", path: "/" },
    { name: "線上課程", path: "/courses" },
    { name: "短影音", path: "/videos" },
    { name: "聯絡我", path: "/contact" }
  ];
  const navLinks = (user == null ? void 0 : user.sex) ? [
    ...baseNavLinks.slice(0, 1),
    { name: "阿倫私密淫照", path: "/photos" },
    ...baseNavLinks.slice(1)
  ] : baseNavLinks;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: navRef,
      className: "navbar bg-base-100/95 backdrop-blur-md sticky top-0 z-50 border-b border-base-200 shadow-sm text-base-content",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "navbar-start", children: [
          /* @__PURE__ */ jsxs("div", { className: "dropdown", children: [
            /* @__PURE__ */ jsx("label", { tabIndex: 0, className: "btn btn-ghost lg:hidden", children: /* @__PURE__ */ jsx(
              "svg",
              {
                xmlns: "http://www.w3.org/2000/svg",
                className: "h-5 w-5",
                fill: "none",
                viewBox: "0 0 24 24",
                stroke: "currentColor",
                children: /* @__PURE__ */ jsx(
                  "path",
                  {
                    strokeLinecap: "round",
                    strokeLinejoin: "round",
                    strokeWidth: "2",
                    d: "M4 6h16M4 12h8m-8 6h16"
                  }
                )
              }
            ) }),
            /* @__PURE__ */ jsxs(
              "ul",
              {
                tabIndex: 0,
                className: "menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52",
                children: [
                  navLinks.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: link.path, children: link.name }) }, link.name)),
                  mounted && user && /* @__PURE__ */ jsxs(Fragment, { children: [
                    /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/member", children: "會員中心" }) }),
                    user.isAdmin && /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, { to: "/admin", children: "後台管理" }) })
                  ] })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            Link,
            {
              to: "/",
              className: "btn btn-ghost normal-case text-xl font-bold tracking-tight",
              children: [
                "阿倫",
                /* @__PURE__ */ jsx("span", { className: "text-primary", children: "教官" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "navbar-center hidden lg:flex", children: /* @__PURE__ */ jsx("ul", { className: "menu menu-horizontal px-1 gap-2", children: navLinks.map((link) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(
          Link,
          {
            to: link.path,
            className: `font-medium hover:text-primary transition-colors ${location.pathname === link.path ? "text-primary" : ""}`,
            children: link.name
          }
        ) }, link.name)) }) }),
        /* @__PURE__ */ jsx("div", { className: "navbar-end gap-2", children: mounted && user ? /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Link, { to: "/member", className: "btn btn-sm btn-ghost", children: "會員中心" }),
          user.isAdmin && /* @__PURE__ */ jsx(Link, { to: "/admin", className: "btn btn-sm btn-secondary", children: "後台管理" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: logout,
              className: "btn btn-sm btn-outline btn-error",
              children: "登出"
            }
          )
        ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Link, { to: "/login", className: "btn btn-sm btn-ghost", children: "登入" }),
          /* @__PURE__ */ jsx(Link, { to: "/register", className: "btn btn-sm btn-primary", children: "註冊" })
        ] }) })
      ]
    }
  );
};
var DefaultContext = {
  color: void 0,
  size: void 0,
  className: void 0,
  style: void 0,
  attr: void 0
};
var IconContext = React.createContext && /* @__PURE__ */ React.createContext(DefaultContext);
var _excluded = ["attr", "size", "title"];
function _objectWithoutProperties(source, excluded) {
  if (source == null) return {};
  var target = _objectWithoutPropertiesLoose(source, excluded);
  var key, i;
  if (Object.getOwnPropertySymbols) {
    var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
    for (i = 0; i < sourceSymbolKeys.length; i++) {
      key = sourceSymbolKeys[i];
      if (excluded.indexOf(key) >= 0) continue;
      if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _objectWithoutPropertiesLoose(source, excluded) {
  if (source == null) return {};
  var target = {};
  for (var key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (excluded.indexOf(key) >= 0) continue;
      target[key] = source[key];
    }
  }
  return target;
}
function _extends() {
  _extends = Object.assign ? Object.assign.bind() : function(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];
      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }
    return target;
  };
  return _extends.apply(this, arguments);
}
function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function(r2) {
      return Object.getOwnPropertyDescriptor(e, r2).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), true).forEach(function(r2) {
      _defineProperty(e, r2, t[r2]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function(r2) {
      Object.defineProperty(e, r2, Object.getOwnPropertyDescriptor(t, r2));
    });
  }
  return e;
}
function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, { value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}
function _toPropertyKey(t) {
  var i = _toPrimitive(t, "string");
  return "symbol" == typeof i ? i : i + "";
}
function _toPrimitive(t, r) {
  if ("object" != typeof t || !t) return t;
  var e = t[Symbol.toPrimitive];
  if (void 0 !== e) {
    var i = e.call(t, r);
    if ("object" != typeof i) return i;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return ("string" === r ? String : Number)(t);
}
function Tree2Element(tree) {
  return tree && tree.map((node, i) => /* @__PURE__ */ React.createElement(node.tag, _objectSpread({
    key: i
  }, node.attr), Tree2Element(node.child)));
}
function GenIcon(data) {
  return (props) => /* @__PURE__ */ React.createElement(IconBase, _extends({
    attr: _objectSpread({}, data.attr)
  }, props), Tree2Element(data.child));
}
function IconBase(props) {
  var elem = (conf) => {
    var {
      attr,
      size,
      title
    } = props, svgProps = _objectWithoutProperties(props, _excluded);
    var computedSize = size || conf.size || "1em";
    var className;
    if (conf.className) className = conf.className;
    if (props.className) className = (className ? className + " " : "") + props.className;
    return /* @__PURE__ */ React.createElement("svg", _extends({
      stroke: "currentColor",
      fill: "currentColor",
      strokeWidth: "0"
    }, conf.attr, attr, svgProps, {
      className,
      style: _objectSpread(_objectSpread({
        color: props.color || conf.color
      }, conf.style), props.style),
      height: computedSize,
      width: computedSize,
      xmlns: "http://www.w3.org/2000/svg"
    }), title && /* @__PURE__ */ React.createElement("title", null, title), props.children);
  };
  return IconContext !== void 0 ? /* @__PURE__ */ React.createElement(IconContext.Consumer, null, (conf) => elem(conf)) : elem(DefaultContext);
}
function FaFacebook(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" }, "child": [] }] })(props);
}
function FaInstagram(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z" }, "child": [] }] })(props);
}
function FaTiktok(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M448,209.91a210.06,210.06,0,0,1-122.77-39.25V349.38A162.55,162.55,0,1,1,185,188.31V278.2a74.62,74.62,0,1,0,52.23,71.18V0l88,0a121.18,121.18,0,0,0,1.86,22.17h0A122.18,122.18,0,0,0,381,102.39a121.43,121.43,0,0,0,67,20.14Z" }, "child": [] }] })(props);
}
function FaYoutube(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" }, "child": [] }] })(props);
}
function FaArrowLeft(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M257.5 445.1l-22.2 22.2c-9.4 9.4-24.6 9.4-33.9 0L7 273c-9.4-9.4-9.4-24.6 0-33.9L201.4 44.7c9.4-9.4 24.6-9.4 33.9 0l22.2 22.2c9.5 9.5 9.3 25-.4 34.3L136.6 216H424c13.3 0 24 10.7 24 24v32c0 13.3-10.7 24-24 24H136.6l120.5 114.8c9.8 9.3 10 24.8.4 34.3z" }, "child": [] }] })(props);
}
function FaArrowRight(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M190.5 66.9l22.2-22.2c9.4-9.4 24.6-9.4 33.9 0L441 239c9.4 9.4 9.4 24.6 0 33.9L246.6 467.3c-9.4 9.4-24.6 9.4-33.9 0l-22.2-22.2c-9.5-9.5-9.3-25 .4-34.3L311.4 296H24c-13.3 0-24-10.7-24-24v-32c0-13.3 10.7-24 24-24h287.4L190.9 101.2c-9.8-9.3-10-24.8-.4-34.3z" }, "child": [] }] })(props);
}
function FaBars(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z" }, "child": [] }] })(props);
}
function FaBook(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z" }, "child": [] }] })(props);
}
function FaBrain(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M208 0c-29.9 0-54.7 20.5-61.8 48.2-.8 0-1.4-.2-2.2-.2-35.3 0-64 28.7-64 64 0 4.8.6 9.5 1.7 14C52.5 138 32 166.6 32 200c0 12.6 3.2 24.3 8.3 34.9C16.3 248.7 0 274.3 0 304c0 33.3 20.4 61.9 49.4 73.9-.9 4.6-1.4 9.3-1.4 14.1 0 39.8 32.2 72 72 72 4.1 0 8.1-.5 12-1.2 9.6 28.5 36.2 49.2 68 49.2 39.8 0 72-32.2 72-72V64c0-35.3-28.7-64-64-64zm368 304c0-29.7-16.3-55.3-40.3-69.1 5.2-10.6 8.3-22.3 8.3-34.9 0-33.4-20.5-62-49.7-74 1-4.5 1.7-9.2 1.7-14 0-35.3-28.7-64-64-64-.8 0-1.5.2-2.2.2C422.7 20.5 397.9 0 368 0c-35.3 0-64 28.6-64 64v376c0 39.8 32.2 72 72 72 31.8 0 58.4-20.7 68-49.2 3.9.7 7.9 1.2 12 1.2 39.8 0 72-32.2 72-72 0-4.8-.5-9.5-1.4-14.1 29-12 49.4-40.6 49.4-73.9z" }, "child": [] }] })(props);
}
function FaBriefcase(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M320 336c0 8.84-7.16 16-16 16h-96c-8.84 0-16-7.16-16-16v-48H0v144c0 25.6 22.4 48 48 48h416c25.6 0 48-22.4 48-48V288H320v48zm144-208h-80V80c0-25.6-22.4-48-48-48H176c-25.6 0-48 22.4-48 48v48H48c-25.6 0-48 22.4-48 48v80h512v-80c0-25.6-22.4-48-48-48zm-144 0H192V96h128v32z" }, "child": [] }] })(props);
}
function FaChartBar(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M332.8 320h38.4c6.4 0 12.8-6.4 12.8-12.8V172.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v134.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V76.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v230.4c0 6.4 6.4 12.8 12.8 12.8zm-288 0h38.4c6.4 0 12.8-6.4 12.8-12.8v-70.4c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v70.4c0 6.4 6.4 12.8 12.8 12.8zm96 0h38.4c6.4 0 12.8-6.4 12.8-12.8V108.8c0-6.4-6.4-12.8-12.8-12.8h-38.4c-6.4 0-12.8 6.4-12.8 12.8v198.4c0 6.4 6.4 12.8 12.8 12.8zM496 384H64V80c0-8.84-7.16-16-16-16H16C7.16 64 0 71.16 0 80v336c0 17.67 14.33 32 32 32h464c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16z" }, "child": [] }] })(props);
}
function FaCheck(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z" }, "child": [] }] })(props);
}
function FaCog(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M487.4 315.7l-42.6-24.6c4.3-23.2 4.3-47 0-70.2l42.6-24.6c4.9-2.8 7.1-8.6 5.5-14-11.1-35.6-30-67.8-54.7-94.6-3.8-4.1-10-5.1-14.8-2.3L380.8 110c-17.9-15.4-38.5-27.3-60.8-35.1V25.8c0-5.6-3.9-10.5-9.4-11.7-36.7-8.2-74.3-7.8-109.2 0-5.5 1.2-9.4 6.1-9.4 11.7V75c-22.2 7.9-42.8 19.8-60.8 35.1L88.7 85.5c-4.9-2.8-11-1.9-14.8 2.3-24.7 26.7-43.6 58.9-54.7 94.6-1.7 5.4.6 11.2 5.5 14L67.3 221c-4.3 23.2-4.3 47 0 70.2l-42.6 24.6c-4.9 2.8-7.1 8.6-5.5 14 11.1 35.6 30 67.8 54.7 94.6 3.8 4.1 10 5.1 14.8 2.3l42.6-24.6c17.9 15.4 38.5 27.3 60.8 35.1v49.2c0 5.6 3.9 10.5 9.4 11.7 36.7 8.2 74.3 7.8 109.2 0 5.5-1.2 9.4-6.1 9.4-11.7v-49.2c22.2-7.9 42.8-19.8 60.8-35.1l42.6 24.6c4.9 2.8 11 1.9 14.8-2.3 24.7-26.7 43.6-58.9 54.7-94.6 1.5-5.5-.7-11.3-5.6-14.1zM256 336c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" }, "child": [] }] })(props);
}
function FaCommentDots(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M256 32C114.6 32 0 125.1 0 240c0 49.6 21.4 95 57 130.7C44.5 421.1 2.7 466 2.2 466.5c-2.2 2.3-2.8 5.7-1.5 8.7S4.8 480 8 480c66.3 0 116-31.8 140.6-51.4 32.7 12.3 69 19.4 107.4 19.4 141.4 0 256-93.1 256-208S397.4 32 256 32zM128 272c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm128 0c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32z" }, "child": [] }] })(props);
}
function FaDollarSign(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 288 512" }, "child": [{ "tag": "path", "attr": { "d": "M209.2 233.4l-108-31.6C88.7 198.2 80 186.5 80 173.5c0-16.3 13.2-29.5 29.5-29.5h66.3c12.2 0 24.2 3.7 34.2 10.5 6.1 4.1 14.3 3.1 19.5-2l34.8-34c7.1-6.9 6.1-18.4-1.8-24.5C238 74.8 207.4 64.1 176 64V16c0-8.8-7.2-16-16-16h-32c-8.8 0-16 7.2-16 16v48h-2.5C45.8 64-5.4 118.7.5 183.6c4.2 46.1 39.4 83.6 83.8 96.6l102.5 30c12.5 3.7 21.2 15.3 21.2 28.3 0 16.3-13.2 29.5-29.5 29.5h-66.3C100 368 88 364.3 78 357.5c-6.1-4.1-14.3-3.1-19.5 2l-34.8 34c-7.1 6.9-6.1 18.4 1.8 24.5 24.5 19.2 55.1 29.9 86.5 30v48c0 8.8 7.2 16 16 16h32c8.8 0 16-7.2 16-16v-48.2c46.6-.9 90.3-28.6 105.7-72.7 21.5-61.6-14.6-124.8-72.5-141.7z" }, "child": [] }] })(props);
}
function FaEdit(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M402.6 83.2l90.2 90.2c3.8 3.8 3.8 10 0 13.8L274.4 405.6l-92.8 10.3c-12.4 1.4-22.9-9.1-21.5-21.5l10.3-92.8L388.8 83.2c3.8-3.8 10-3.8 13.8 0zm162-22.9l-48.8-48.8c-15.2-15.2-39.9-15.2-55.2 0l-35.4 35.4c-3.8 3.8-3.8 10 0 13.8l90.2 90.2c3.8 3.8 10 3.8 13.8 0l35.4-35.4c15.2-15.3 15.2-40 0-55.2zM384 346.2V448H64V128h229.8c3.2 0 6.2-1.3 8.5-3.5l40-40c7.6-7.6 2.2-20.5-8.5-20.5H48C21.5 64 0 85.5 0 112v352c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48V306.2c0-10.7-12.9-16-20.5-8.5l-40 40c-2.2 2.3-3.5 5.3-3.5 8.5z" }, "child": [] }] })(props);
}
function FaEnvelope(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z" }, "child": [] }] })(props);
}
function FaExternalLinkAlt(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z" }, "child": [] }] })(props);
}
function FaHeadphones(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M256 32C114.52 32 0 146.496 0 288v48a32 32 0 0 0 17.689 28.622l14.383 7.191C34.083 431.903 83.421 480 144 480h24c13.255 0 24-10.745 24-24V280c0-13.255-10.745-24-24-24h-24c-31.342 0-59.671 12.879-80 33.627V288c0-105.869 86.131-192 192-192s192 86.131 192 192v1.627C427.671 268.879 399.342 256 368 256h-24c-13.255 0-24 10.745-24 24v176c0 13.255 10.745 24 24 24h24c60.579 0 109.917-48.098 111.928-108.187l14.382-7.191A32 32 0 0 0 512 336v-48c0-141.479-114.496-256-256-256z" }, "child": [] }] })(props);
}
function FaPlay(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M424.4 214.7L72.4 6.6C43.8-10.3 0 6.1 0 47.9V464c0 37.5 40.7 60.1 72.4 41.3l352-208c31.4-18.5 31.5-64.1 0-82.6z" }, "child": [] }] })(props);
}
function FaPlus(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" }, "child": [] }] })(props);
}
function FaPodcast(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M267.429 488.563C262.286 507.573 242.858 512 224 512c-18.857 0-38.286-4.427-43.428-23.437C172.927 460.134 160 388.898 160 355.75c0-35.156 31.142-43.75 64-43.75s64 8.594 64 43.75c0 32.949-12.871 104.179-20.571 132.813zM156.867 288.554c-18.693-18.308-29.958-44.173-28.784-72.599 2.054-49.724 42.395-89.956 92.124-91.881C274.862 121.958 320 165.807 320 220c0 26.827-11.064 51.116-28.866 68.552-2.675 2.62-2.401 6.986.628 9.187 9.312 6.765 16.46 15.343 21.234 25.363 1.741 3.654 6.497 4.66 9.449 1.891 28.826-27.043 46.553-65.783 45.511-108.565-1.855-76.206-63.595-138.208-139.793-140.369C146.869 73.753 80 139.215 80 220c0 41.361 17.532 78.7 45.55 104.989 2.953 2.771 7.711 1.77 9.453-1.887 4.774-10.021 11.923-18.598 21.235-25.363 3.029-2.2 3.304-6.566.629-9.185zM224 0C100.204 0 0 100.185 0 224c0 89.992 52.602 165.647 125.739 201.408 4.333 2.118 9.267-1.544 8.535-6.31-2.382-15.512-4.342-30.946-5.406-44.339-.146-1.836-1.149-3.486-2.678-4.512-47.4-31.806-78.564-86.016-78.187-147.347.592-96.237 79.29-174.648 175.529-174.899C320.793 47.747 400 126.797 400 224c0 61.932-32.158 116.49-80.65 147.867-.999 14.037-3.069 30.588-5.624 47.23-.732 4.767 4.203 8.429 8.535 6.31C395.227 389.727 448 314.187 448 224 448 100.205 347.815 0 224 0zm0 160c-35.346 0-64 28.654-64 64s28.654 64 64 64 64-28.654 64-64-28.654-64-64-64z" }, "child": [] }] })(props);
}
function FaQuoteLeft(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M464 256h-80v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8c-88.4 0-160 71.6-160 160v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48zm-288 0H96v-64c0-35.3 28.7-64 64-64h8c13.3 0 24-10.7 24-24V56c0-13.3-10.7-24-24-24h-8C71.6 32 0 103.6 0 192v240c0 26.5 21.5 48 48 48h128c26.5 0 48-21.5 48-48V304c0-26.5-21.5-48-48-48z" }, "child": [] }] })(props);
}
function FaShieldAlt(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 512 512" }, "child": [{ "tag": "path", "attr": { "d": "M466.5 83.7l-192-80a48.15 48.15 0 0 0-36.9 0l-192 80C27.7 91.1 16 108.6 16 128c0 198.5 114.5 335.7 221.5 380.3 11.8 4.9 25.1 4.9 36.9 0C360.1 472.6 496 349.3 496 128c0-19.4-11.7-36.9-29.5-44.3zM256.1 446.3l-.1-381 175.9 73.3c-3.3 151.4-82.1 261.1-175.8 307.7z" }, "child": [] }] })(props);
}
function FaShoppingBag(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M352 160v-32C352 57.42 294.579 0 224 0 153.42 0 96 57.42 96 128v32H0v272c0 44.183 35.817 80 80 80h288c44.183 0 80-35.817 80-80V160h-96zm-192-32c0-35.29 28.71-64 64-64s64 28.71 64 64v32H160v-32zm160 120c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24zm-192 0c-13.255 0-24-10.745-24-24s10.745-24 24-24 24 10.745 24 24-10.745 24-24 24z" }, "child": [] }] })(props);
}
function FaShoppingCart(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M528.12 301.319l47.273-208C578.806 78.301 567.391 64 551.99 64H159.208l-9.166-44.81C147.758 8.021 137.93 0 126.529 0H24C10.745 0 0 10.745 0 24v16c0 13.255 10.745 24 24 24h69.883l70.248 343.435C147.325 417.1 136 435.222 136 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-15.674-6.447-29.835-16.824-40h209.647C430.447 426.165 424 440.326 424 456c0 30.928 25.072 56 56 56s56-25.072 56-56c0-22.172-12.888-41.332-31.579-50.405l5.517-24.276c3.413-15.018-8.002-29.319-23.403-29.319H218.117l-6.545-32h293.145c11.206 0 20.92-7.754 23.403-18.681z" }, "child": [] }] })(props);
}
function FaStar(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M259.3 17.8L194 150.2 47.9 171.5c-26.2 3.8-36.7 36.1-17.7 54.6l105.7 103-25 145.5c-4.5 26.3 23.2 46 46.4 33.7L288 439.6l130.7 68.7c23.2 12.2 50.9-7.4 46.4-33.7l-25-145.5 105.7-103c19-18.5 8.5-50.8-17.7-54.6L382 150.2 316.7 17.8c-11.7-23.6-45.6-23.9-57.4 0z" }, "child": [] }] })(props);
}
function FaTimes(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 352 512" }, "child": [{ "tag": "path", "attr": { "d": "M242.72 256l100.07-100.07c12.28-12.28 12.28-32.19 0-44.48l-22.24-22.24c-12.28-12.28-32.19-12.28-44.48 0L176 189.28 75.93 89.21c-12.28-12.28-32.19-12.28-44.48 0L9.21 111.45c-12.28 12.28-12.28 32.19 0 44.48L109.28 256 9.21 356.07c-12.28 12.28-12.28 32.19 0 44.48l22.24 22.24c12.28 12.28 32.2 12.28 44.48 0L176 322.72l100.07 100.07c12.28 12.28 32.2 12.28 44.48 0l22.24-22.24c12.28-12.28 12.28-32.19 0-44.48L242.72 256z" }, "child": [] }] })(props);
}
function FaTrash(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 448 512" }, "child": [{ "tag": "path", "attr": { "d": "M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.72 23.72 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z" }, "child": [] }] })(props);
}
function FaUserShield(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 640 512" }, "child": [{ "tag": "path", "attr": { "d": "M622.3 271.1l-115.2-45c-4.1-1.6-12.6-3.7-22.2 0l-115.2 45c-10.7 4.2-17.7 14-17.7 24.9 0 111.6 68.7 188.8 132.9 213.9 9.6 3.7 18 1.6 22.2 0C558.4 489.9 640 420.5 640 296c0-10.9-7-20.7-17.7-24.9zM496 462.4V273.3l95.5 37.3c-5.6 87.1-60.9 135.4-95.5 151.8zM224 256c70.7 0 128-57.3 128-128S294.7 0 224 0 96 57.3 96 128s57.3 128 128 128zm96 40c0-2.5.8-4.8 1.1-7.2-2.5-.1-4.9-.8-7.5-.8h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c6.8 0 13.3-1.5 19.2-4-54-42.9-99.2-116.7-99.2-212z" }, "child": [] }] })(props);
}
function FaUsers(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 640 512" }, "child": [{ "tag": "path", "attr": { "d": "M96 224c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm448 0c35.3 0 64-28.7 64-64s-28.7-64-64-64-64 28.7-64 64 28.7 64 64 64zm32 32h-64c-17.6 0-33.5 7.1-45.1 18.6 40.3 22.1 68.9 62 75.1 109.4h66c17.7 0 32-14.3 32-32v-32c0-35.3-28.7-64-64-64zm-256 0c61.9 0 112-50.1 112-112S381.9 32 320 32 208 82.1 208 144s50.1 112 112 112zm76.8 32h-8.3c-20.8 10-43.9 16-68.5 16s-47.6-6-68.5-16h-8.3C179.6 288 128 339.6 128 403.2V432c0 26.5 21.5 48 48 48h288c26.5 0 48-21.5 48-48v-28.8c0-63.6-51.6-115.2-115.2-115.2zm-223.7-13.4C161.5 263.1 145.6 256 128 256H64c-35.3 0-64 28.7-64 64v32c0 17.7 14.3 32 32 32h65.9c6.3-47.4 34.9-87.3 75.2-109.4z" }, "child": [] }] })(props);
}
function FaVideo(props) {
  return GenIcon({ "attr": { "viewBox": "0 0 576 512" }, "child": [{ "tag": "path", "attr": { "d": "M336.2 64H47.8C21.4 64 0 85.4 0 111.8v288.4C0 426.6 21.4 448 47.8 448h288.4c26.4 0 47.8-21.4 47.8-47.8V111.8c0-26.4-21.4-47.8-47.8-47.8zm189.4 37.7L416 177.3v157.4l109.6 75.5c21.2 14.6 50.4-.3 50.4-25.8V127.5c0-25.4-29.1-40.4-50.4-25.8z" }, "child": [] }] })(props);
}
const Footer = () => {
  const socialLinks = [
    {
      icon: FaInstagram,
      url: "https://www.instagram.com/coach.luen/",
      label: "Instagram"
    },
    {
      icon: FaFacebook,
      url: "https://www.facebook.com/populuen/",
      label: "Facebook"
    },
    {
      icon: FaTiktok,
      url: "https://www.tiktok.com/@coachluen",
      label: "TikTok"
    },
    {
      icon: FaPodcast,
      url: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
      label: "Podcast"
    }
  ];
  return /* @__PURE__ */ jsxs("footer", { className: "footer footer-center p-10 bg-neutral text-neutral-content", children: [
    /* @__PURE__ */ jsxs("aside", { children: [
      /* @__PURE__ */ jsx("p", { className: "font-bold text-2xl tracking-tighter", children: /* @__PURE__ */ jsx("span", { className: "text-primary", children: "阿倫教官" }) }),
      /* @__PURE__ */ jsx("p", { className: "text-sm opacity-80", children: "心理學 × 健身講師" }),
      /* @__PURE__ */ jsx("p", { className: "font-bold mt-2", children: "Podcast「陪你健身」" })
    ] }),
    /* @__PURE__ */ jsx("nav", { children: /* @__PURE__ */ jsx("div", { className: "flex gap-4", children: socialLinks.map((social, index) => /* @__PURE__ */ jsx(
      "a",
      {
        href: social.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: "btn btn-ghost btn-circle text-xl hover:text-primary transition-colors",
        "aria-label": social.label,
        children: /* @__PURE__ */ jsx(social.icon, {})
      },
      index
    )) }) }),
    /* @__PURE__ */ jsx("aside", { children: /* @__PURE__ */ jsx("p", { className: "text-sm opacity-60", children: "Copyright © 2025 阿倫教官 - All rights reserved" }) })
  ] });
};
const Layout = () => {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col min-h-screen", children: [
    /* @__PURE__ */ jsx(Navbar, {}),
    /* @__PURE__ */ jsx("main", { className: "flex-grow", children: /* @__PURE__ */ jsx(Outlet, {}) }),
    /* @__PURE__ */ jsx(Footer, {})
  ] });
};
const Hero = () => {
  const heroRef = useRef(null);
  const textRef = useRef(null);
  const btnRef = useRef(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("./assets/index-N6a9ipeV.js").then(({ default: gsap }) => {
      const tl = gsap.timeline();
      if (heroRef.current && textRef.current && btnRef.current) {
        tl.fromTo(heroRef.current, { opacity: 0 }, { opacity: 1, duration: 1 }).fromTo(
          textRef.current.children,
          { y: 50, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.2,
            ease: "power3.out"
          }
        ).fromTo(
          btnRef.current,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
        );
      }
    });
  }, []);
  const socialLinks = [
    {
      icon: FaInstagram,
      url: "https://www.instagram.com/coach.luen/",
      color: "hover:text-pink-500"
    },
    {
      icon: FaFacebook,
      url: "https://www.facebook.com/populuen/",
      color: "hover:text-blue-500"
    },
    {
      icon: FaTiktok,
      url: "https://www.tiktok.com/@coachluen",
      color: "hover:text-white"
    },
    {
      icon: FaPodcast,
      url: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
      color: "hover:text-purple-500"
    }
  ];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref: heroRef,
      className: "hero min-h-screen bg-base-200",
      style: {
        backgroundImage: "url(/photos/coach-2.jpg)",
        backgroundPosition: "center -300px",
        backgroundSize: "cover"
      },
      children: [
        /* @__PURE__ */ jsx("div", { className: "hero-overlay bg-black bg-opacity-70" }),
        /* @__PURE__ */ jsx("div", { className: "hero-content pt-10 md:pt-14 text-center text-neutral-content", children: /* @__PURE__ */ jsxs("div", { className: "max-w-lg", children: [
          /* @__PURE__ */ jsxs("div", { ref: textRef, children: [
            /* @__PURE__ */ jsx("p", { className: "text-lg mb-2 tracking-widest opacity-80", children: "心理學 × 健身講師" }),
            /* @__PURE__ */ jsx("h1", { className: "mb-5 text-5xl md:text-6xl font-bold", children: /* @__PURE__ */ jsx("span", { className: "text-primary", children: "阿倫教官" }) }),
            /* @__PURE__ */ jsxs("p", { className: "mb-4 text-lg leading-relaxed", children: [
              "運動和健身是一件不容易的事情，",
              /* @__PURE__ */ jsx("br", {}),
              "結合心理學知識,幫助你在讓自己身體更好的路上,",
              /* @__PURE__ */ jsx("br", {}),
              "同時有著心理層次的支持。"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mb-6", children: [
              /* @__PURE__ */ jsx("div", { className: "flex text-yellow-400", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(FaStar, { className: i < 5 ? "" : "opacity-30" }, i)) }),
              /* @__PURE__ */ jsx("span", { className: "text-sm opacity-80", children: "4.8 • 54則評價 • 58集Podcast" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-4 mb-8", children: socialLinks.map((social, index) => /* @__PURE__ */ jsx(
              "a",
              {
                href: social.url,
                target: "_blank",
                rel: "noopener noreferrer",
                className: `btn btn-circle btn-ghost text-2xl ${social.color} transition-colors`,
                children: /* @__PURE__ */ jsx(social.icon, {})
              },
              index
            )) })
          ] }),
          /* @__PURE__ */ jsxs(
            "div",
            {
              ref: btnRef,
              className: "flex flex-col sm:flex-row gap-4 justify-center",
              children: [
                /* @__PURE__ */ jsx(
                  Link,
                  {
                    to: "/courses",
                    className: "btn btn-primary btn-lg border-0 shadow-lg hover:scale-105 transition-transform duration-300",
                    children: "開始訓練"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "a",
                  {
                    href: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-black",
                    children: "🎧 收聽Podcast"
                  }
                )
              ]
            }
          )
        ] }) })
      ]
    }
  );
};
const Home = () => {
  const podcastEpisodes = [
    {
      id: 58,
      title: "動作學習,你一定要知道的四個步驟!",
      duration: "12 分鐘",
      date: "2022/01/27"
    },
    {
      id: 57,
      title: "年度回顧,你有達成當初設立的目標嗎?",
      duration: "13 分鐘",
      date: "2021/12/30"
    },
    {
      id: 56,
      title: "外食族必須知道的三種飲食控制技巧",
      duration: "11 分鐘",
      date: "2021/12/19"
    },
    {
      id: 55,
      title: "不用計算熱量也能瘦的方法",
      duration: "14 分鐘",
      date: "2021/12/17"
    },
    {
      id: 54,
      title: "健身找個伴,有那麼困難嗎?",
      duration: "11 分鐘",
      date: "2021/11/29"
    },
    {
      id: 53,
      title: "健身提升影響力的三個方法",
      duration: "11 分鐘",
      date: "2021/11/14"
    }
  ];
  const reviews = [
    {
      name: "阿雅婆爆",
      date: "2021/12/14",
      content: "昨天晚上偶然發現的Podcast,內容實在、口條清晰,而且不會無聊!邊練邊聽很有意思💪💪💪",
      rating: 5
    },
    {
      name: "adair014678",
      date: "2021/10/26",
      content: "以前給教練帶過。內容優秀",
      rating: 5
    }
  ];
  const contentTopics = [
    { emoji: "🏋️", title: "動作學習", desc: "正確姿勢與技巧" },
    { emoji: "🥗", title: "飲食控制", desc: "外食族也能瘦" },
    { emoji: "🧠", title: "心理建設", desc: "突破心理障礙" },
    { emoji: "📈", title: "目標設定", desc: "達成訓練目標" },
    { emoji: "💪", title: "肌力訓練", desc: "增肌減脂方法" },
    { emoji: "🤝", title: "夥伴互助", desc: "健身找伴技巧" },
    { emoji: "⭐", title: "影響力", desc: "提升個人魅力" },
    { emoji: "🩹", title: "傷害預防", desc: "避免運動傷害" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "bg-base-100", children: [
    /* @__PURE__ */ jsx(Hero, {}),
    /* @__PURE__ */ jsx("section", { className: "pt-24 pb-20 px-6 lg:px-24 max-w-7xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-center gap-12", children: [
      /* @__PURE__ */ jsx("div", { className: "lg:w-1/2", children: /* @__PURE__ */ jsx(
        "img",
        {
          src: "/photos/coach-1.jpg",
          alt: "阿倫教官",
          className: "rounded-lg shadow-2xl w-full h-auto object-cover object-top aspect-[3/4]"
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "lg:w-1/2 space-y-6", children: [
        /* @__PURE__ */ jsx("p", { className: "text-primary font-semibold tracking-widest", children: "心理學 × 健身講師" }),
        /* @__PURE__ */ jsxs("h2", { className: "text-4xl font-bold tracking-tight", children: [
          "關於 ",
          /* @__PURE__ */ jsx("span", { className: "text-primary", children: "阿倫教官" })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg leading-relaxed text-base-content/80", children: [
          "運動和健身是一件不容易的事情。我們好不容易跨出了第一步, 卻因為看不到成果,加上運動帶給身體的疲勞感,而選擇放棄。",
          /* @__PURE__ */ jsx("br", {}),
          /* @__PURE__ */ jsx("br", {}),
          "我的頻道結合了心理學的知識,幫助你在讓自己身體更好的路上, 同時有著心理層次的支持。讓我們帶著身心健康,一起往前進吧!"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "stats shadow bg-base-200 w-full", children: [
          /* @__PURE__ */ jsxs("div", { className: "stat place-items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "stat-title", children: "Podcast" }),
            /* @__PURE__ */ jsx("div", { className: "stat-value text-purple-500 text-xl", children: "陪你健身" }),
            /* @__PURE__ */ jsx("div", { className: "stat-desc", children: "58集 • 4.8⭐" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "stat place-items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "stat-title", children: "Instagram" }),
            /* @__PURE__ */ jsx("div", { className: "stat-value text-pink-500 text-xl", children: "@coach.luen" }),
            /* @__PURE__ */ jsx("div", { className: "stat-desc", children: "追蹤互動" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "stat place-items-center", children: [
            /* @__PURE__ */ jsx("div", { className: "stat-title", children: "活躍年代" }),
            /* @__PURE__ */ jsx("div", { className: "stat-value text-primary text-xl", children: "2021-今" }),
            /* @__PURE__ */ jsx("div", { className: "stat-desc", children: "持續更新" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-3 flex-wrap", children: [
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://www.instagram.com/coach.luen/",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "btn btn-outline gap-2 hover:bg-pink-500 hover:border-pink-500",
              children: [
                /* @__PURE__ */ jsx(FaInstagram, {}),
                " Instagram"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://www.facebook.com/populuen/",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "btn btn-outline gap-2 hover:bg-blue-600 hover:border-blue-600",
              children: [
                /* @__PURE__ */ jsx(FaFacebook, {}),
                " Facebook"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://www.tiktok.com/@coachluen",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "btn btn-outline gap-2 hover:bg-black hover:border-black",
              children: [
                /* @__PURE__ */ jsx(FaTiktok, {}),
                " TikTok"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "a",
            {
              href: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
              target: "_blank",
              rel: "noopener noreferrer",
              className: "btn btn-outline gap-2 hover:bg-purple-600 hover:border-purple-600",
              children: [
                /* @__PURE__ */ jsx(FaPodcast, {}),
                " Podcast"
              ]
            }
          )
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 bg-gradient-to-r from-purple-900 to-purple-700 text-white", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
        /* @__PURE__ */ jsx(FaPodcast, { className: "text-6xl mx-auto mb-6 opacity-80" }),
        /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold mb-4", children: "🎧 Podcast「陪你健身」" }),
        /* @__PURE__ */ jsxs("p", { className: "text-lg opacity-90 mb-2", children: [
          "運動和健身是一件不容易的事情,讓我們結合心理學知識,",
          /* @__PURE__ */ jsx("br", {}),
          "幫助你在讓自己身體更好的路上,同時有著心理層次的支持。"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-2 mt-4", children: [
          /* @__PURE__ */ jsx("div", { className: "flex text-yellow-400", children: [...Array(5)].map((_, i) => /* @__PURE__ */ jsx(FaStar, {}, i)) }),
          /* @__PURE__ */ jsx("span", { children: "4.8 • 54則評價" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8", children: podcastEpisodes.map((episode) => /* @__PURE__ */ jsx(
        "a",
        {
          href: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "bg-white/10 backdrop-blur rounded-lg p-4 hover:bg-white/20 transition-colors group",
          children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-purple-400 transition-colors", children: /* @__PURE__ */ jsx(FaHeadphones, { className: "text-xl" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsxs("p", { className: "text-xs opacity-70 mb-1", children: [
                "#",
                episode.id,
                " • ",
                episode.date
              ] }),
              /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm leading-tight truncate", children: episode.title }),
              /* @__PURE__ */ jsx("p", { className: "text-xs opacity-70 mt-1", children: episode.duration })
            ] })
          ] })
        },
        episode.id
      )) }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "btn btn-lg bg-white text-purple-700 hover:bg-gray-100 border-none gap-2",
          children: [
            /* @__PURE__ */ jsx(FaPlay, {}),
            " 收聽全部 58 集"
          ]
        }
      ) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-6 bg-base-200", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold text-center mb-12", children: [
        "聽眾",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "好評" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-6", children: reviews.map((review, index) => /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
        /* @__PURE__ */ jsx(FaQuoteLeft, { className: "text-3xl text-primary/20 mb-2" }),
        /* @__PURE__ */ jsxs("p", { className: "text-base-content/80 italic mb-4", children: [
          '"',
          review.content,
          '"'
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-semibold", children: review.name }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: review.date })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex text-yellow-500", children: [...Array(review.rating)].map((_, i) => /* @__PURE__ */ jsx(FaStar, {}, i)) })
        ] })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold text-center mb-12", children: [
        "內容",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "主題" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-4", children: contentTopics.map((topic, index) => /* @__PURE__ */ jsx(
        "div",
        {
          className: "card bg-base-200 hover:bg-base-300 transition-colors cursor-default",
          children: /* @__PURE__ */ jsxs("div", { className: "card-body items-center text-center p-4", children: [
            /* @__PURE__ */ jsx("span", { className: "text-4xl mb-2", children: topic.emoji }),
            /* @__PURE__ */ jsx("h3", { className: "font-bold", children: topic.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: topic.desc })
          ] })
        },
        index
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 bg-neutral text-neutral-content text-center", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-6", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold mb-6", children: "準備好開始了嗎?" }),
      /* @__PURE__ */ jsx("p", { className: "mb-8 text-lg", children: "立即加入線上課程,或是預約一對一諮詢。" }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-center gap-4 flex-wrap", children: [
        /* @__PURE__ */ jsx(Link, { to: "/courses", className: "btn btn-primary btn-lg", children: "瀏覽課程" }),
        /* @__PURE__ */ jsx(
          Link,
          {
            to: "/videos",
            className: "btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-neutral",
            children: "看短影音"
          }
        ),
        /* @__PURE__ */ jsx(Link, { to: "/contact", className: "btn btn-ghost btn-lg", children: "聯絡我" })
      ] })
    ] }) })
  ] });
};
const Courses = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const plans = [
    {
      id: 1,
      name: "三個月",
      price: 32800,
      sessions: 12,
      description: "1對1培訓 12次",
      color: "bg-[#8B4D5C]",
      textColor: "text-white",
      popular: false
    },
    {
      id: 2,
      name: "六個月",
      price: 59800,
      sessions: 24,
      description: "1對1培訓 24次",
      color: "bg-[#9B8B7A]",
      textColor: "text-white",
      popular: true
    },
    {
      id: 3,
      name: "一年",
      price: 118e3,
      sessions: 48,
      description: "1對1培訓 48次",
      color: "bg-white border-2 border-neutral",
      textColor: "text-neutral",
      popular: false
    }
  ];
  const bonuses = [
    { name: "表達力心理學", value: 980 },
    { name: "反對問題成交話術", value: 480 },
    { name: "體驗課成交全流程", value: 1980 },
    { name: "私人教練續約必修課", value: 1980 },
    { name: "一對一陪跑訓練", value: 18e3 },
    { name: "心理韌性與職涯定位", value: 18e3 }
  ];
  const totalBonusValue = bonuses.reduce((sum, b) => sum + b.value, 0);
  const coreValues = [
    {
      icon: FaBrain,
      title: "心理韌性",
      desc: "建立強大的心理素質,面對挑戰不退縮"
    },
    {
      icon: FaBriefcase,
      title: "職涯規劃",
      desc: "找到你的定位,規劃長期發展路線"
    },
    { icon: FaDollarSign, title: "變現系統", desc: "打造系統化的收入模式" }
  ];
  const painPoints = [
    "有專業,但不擅長銷售",
    "時間投入多,沒對應報酬",
    "談單亂槍打鳥,沒有系統",
    "客戶說有效果,卻不買單",
    "不擅長破冰做現場開發"
  ];
  const phases = [
    {
      phase: "第一階段",
      period: "0-3個月",
      title: "業績衝刺期",
      subtitle: "新客成交 + 現場開發",
      items: ["體驗課成交系統", "現場開發實戰", "成交進度追蹤", "每週會議討論"]
    },
    {
      phase: "第二階段",
      period: "3-6個月",
      title: "建立長期收入",
      subtitle: "續約與轉介紹",
      items: ["會員關係心理學", "續約情緒時機", "轉介紹流程", "客戶管理表單"]
    },
    {
      phase: "第三階段",
      period: "6-12個月",
      title: "個人品牌與自媒體",
      subtitle: "打造你的影響力",
      items: [
        "自媒體定位",
        "口播腳本產出",
        "鏡頭表現力訓練",
        "打造個人商業模式"
      ]
    }
  ];
  const systemFeatures = [
    { text: "每周一次視訊會議,進度檢核與行動指導", highlight: "每周一次" },
    { text: "指標追蹤(邀約數、成交數、續約率)", highlight: "指標追蹤" },
    { text: "即時訊息24小時回復", highlight: "24小時" },
    { text: "每季成果檢核與策略調整", highlight: "每季" }
  ];
  const caseStudies = [
    {
      username: "weiyu056",
      name: "林韋佑｜阿黑｜彰化健身教練",
      posts: 199,
      followers: "4萬",
      following: 621,
      title: "新手教練→健身房老闆",
      description: "客製銷售結果、客戶經營、續約全流程\n自媒體運營、進修建議、健身房運營\n從0到1的陪跑計畫",
      image: "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&q=80&w=400"
    },
    {
      username: "jennylibra7",
      name: "Jenny Chen",
      posts: 957,
      followers: "2.8萬",
      following: 1074,
      title: "空服員轉職SUP教練",
      description: "藉由心理學引導、Life coaching\n順著自己的內在\n找到人生與職涯方向",
      image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&q=80&w=400"
    }
  ];
  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-base-100", children: [
    /* @__PURE__ */ jsx("section", { className: "py-20 px-6 bg-gradient-to-br from-base-200 to-base-100", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-primary font-semibold mb-4 tracking-widest", children: "私人教練專屬" }),
      /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-6xl font-black mb-6", children: [
        "教練",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "陪跑" }),
        "計畫"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xl text-base-content/70 mb-4", children: "這是一個從銷售、經營到自媒體的陪跑系統" }),
      /* @__PURE__ */ jsxs("p", { className: "text-2xl font-bold mb-8", children: [
        "讓你從",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "教練" }),
        "變成",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "經營者" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16 px-6 bg-base-200", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold mb-8 text-center", children: [
        "目前的",
        /* @__PURE__ */ jsx("span", { className: "text-error", children: "現狀" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-8 items-center", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsx(
            "img",
            {
              src: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&q=80&w=400",
              alt: "健身訓練",
              className: "rounded-lg shadow-lg"
            }
          ),
          /* @__PURE__ */ jsx(
            "img",
            {
              src: "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=400",
              alt: "健身訓練",
              className: "rounded-lg shadow-lg"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("ul", { className: "space-y-4", children: painPoints.map((point, index) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-3 text-lg", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 bg-error rounded-full flex-shrink-0" }),
            point
          ] }, index)) }),
          /* @__PURE__ */ jsxs("p", { className: "mt-8 text-xl font-semibold", children: [
            "大部分的教練缺一個",
            /* @__PURE__ */ jsx("span", { className: "text-primary", children: "專業變現" }),
            "系統"
          ] })
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-3xl font-bold mb-4 text-center", children: [
        "從",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "知道" }),
        "到",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "做到" }),
        "的改變"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-base-content/60 mb-12", children: "三大核心系統,帶你突破瓶頸" }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-col md:flex-row justify-center items-center gap-8", children: coreValues.map((value, index) => /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxs("div", { className: "w-40 h-40 bg-[#8B4D5C] rounded-2xl flex flex-col items-center justify-center text-white shadow-xl hover:scale-105 transition-transform", children: [
          /* @__PURE__ */ jsx(value.icon, { className: "text-4xl mb-2" }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold", children: value.title })
        ] }),
        index < coreValues.length - 1 && /* @__PURE__ */ jsx("div", { className: "hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2", children: /* @__PURE__ */ jsx("div", { className: "w-4 h-0.5 bg-[#8B4D5C]" }) })
      ] }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-16", children: phases.map((phase, index) => /* @__PURE__ */ jsx("div", { className: "py-16 px-6 bg-neutral text-white", children: /* @__PURE__ */ jsx("div", { className: "max-w-6xl mx-auto", children: /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-12 items-center", children: [
      /* @__PURE__ */ jsxs("div", { className: index % 2 === 1 ? "md:order-2" : "", children: [
        /* @__PURE__ */ jsxs("p", { className: "text-4xl font-black mb-2", children: [
          phase.phase,
          "(",
          phase.period,
          ")"
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-2xl font-bold mb-6", children: phase.title }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-4", children: phase.items.map((item, i) => /* @__PURE__ */ jsx(
          "div",
          {
            className: "bg-white/10 backdrop-blur rounded-full py-3 px-6 text-center",
            children: item
          },
          i
        )) })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `flex justify-center ${index % 2 === 1 ? "md:order-1" : ""}`,
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src: `https://images.unsplash.com/photo-${index === 0 ? "1571019614242-c5c5dee9f50b" : index === 1 ? "1534438327276-14e5300c3a48" : "1517836357463-d25dfeac3438"}?auto=format&fit=crop&q=80&w=500`,
              alt: phase.title,
              className: "rounded-lg shadow-2xl max-w-sm w-full"
            }
          )
        }
      )
    ] }) }) }, index)) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-6 bg-base-200", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black mb-12 text-center", children: "制度說明" }),
      /* @__PURE__ */ jsx("div", { className: "space-y-6", children: systemFeatures.map((feature, index) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex items-center gap-4 text-lg bg-base-100 p-4 rounded-lg shadow",
          children: [
            /* @__PURE__ */ jsx("div", { className: "w-3 h-3 bg-[#8B4D5C] rounded-full flex-shrink-0" }),
            /* @__PURE__ */ jsxs("p", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-[#8B4D5C] font-bold", children: feature.highlight }),
              feature.text.replace(feature.highlight, "")
            ] })
          ]
        },
        index
      )) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black mb-12", children: "案例分享" }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 gap-8", children: caseStudies.map((study, index) => /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
          /* @__PURE__ */ jsx("div", { className: "avatar", children: /* @__PURE__ */ jsx("div", { className: "w-16 rounded-full", children: /* @__PURE__ */ jsx("img", { src: study.image, alt: study.name }) }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-bold", children: study.username }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: study.name })
          ] }),
          /* @__PURE__ */ jsx(
            "a",
            {
              href: `https://instagram.com/${study.username}`,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "btn btn-sm btn-ghost ml-auto",
              children: /* @__PURE__ */ jsx(FaInstagram, { className: "text-pink-500" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-6 text-sm mb-4", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: study.posts }),
            " 貼文"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: study.followers }),
            " 位粉絲"
          ] }),
          /* @__PURE__ */ jsxs("span", { children: [
            /* @__PURE__ */ jsx("strong", { children: study.following }),
            " 追蹤中"
          ] })
        ] }),
        /* @__PURE__ */ jsx("h3", { className: "text-xl font-bold text-primary mb-2", children: study.title }),
        /* @__PURE__ */ jsx("p", { className: "whitespace-pre-line text-base-content/70", children: study.description })
      ] }) }, index)) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-6 bg-gradient-to-br from-base-200 to-base-100", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-4xl font-black mb-4 text-center", children: "陪跑課程" }),
      /* @__PURE__ */ jsx("p", { className: "text-center text-base-content/60 mb-12", children: "選擇適合你的方案,開始你的成長之路" }),
      /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-3 gap-6 mb-12", children: plans.map((plan) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `card ${plan.popular ? "ring-2 ring-primary" : ""} bg-base-100 shadow-xl hover:shadow-2xl transition-all cursor-pointer ${selectedPlan === plan.id ? "ring-2 ring-primary" : ""}`,
          onClick: () => handlePlanSelect(plan.id),
          children: [
            plan.popular && /* @__PURE__ */ jsx("div", { className: "absolute -top-3 left-1/2 transform -translate-x-1/2", children: /* @__PURE__ */ jsx("span", { className: "badge badge-primary", children: "最受歡迎" }) }),
            /* @__PURE__ */ jsxs("div", { className: "card-body items-center text-center", children: [
              /* @__PURE__ */ jsxs(
                "div",
                {
                  className: `w-24 h-24 rounded-full ${plan.color} ${plan.textColor} flex flex-col items-center justify-center mb-4`,
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "text-lg font-bold", children: plan.name }),
                    /* @__PURE__ */ jsxs("span", { className: "text-xs", children: [
                      plan.price.toLocaleString(),
                      "元"
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("h3", { className: "text-3xl font-black", children: [
                "NT$ ",
                plan.price.toLocaleString()
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-base-content/60", children: plan.description }),
              /* @__PURE__ */ jsx("div", { className: "divider" }),
              /* @__PURE__ */ jsxs("ul", { className: "text-left space-y-2", children: [
                /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(FaCheck, { className: "text-success" }),
                  /* @__PURE__ */ jsxs("span", { children: [
                    "1對1培訓 ",
                    plan.sessions,
                    "次"
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(FaCheck, { className: "text-success" }),
                  /* @__PURE__ */ jsx("span", { children: "每週視訊會議" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(FaCheck, { className: "text-success" }),
                  /* @__PURE__ */ jsx("span", { children: "24小時訊息回覆" })
                ] }),
                /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx(FaCheck, { className: "text-success" }),
                  /* @__PURE__ */ jsx("span", { children: "額外附贈課程" })
                ] })
              ] }),
              /* @__PURE__ */ jsx("button", { className: "btn btn-primary btn-block mt-4", children: "選擇方案" })
            ] })
          ]
        },
        plan.id
      )) }),
      /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-2xl font-bold mb-4", children: [
          "額外附贈,總值",
          " ",
          /* @__PURE__ */ jsxs("span", { className: "text-primary", children: [
            "NT$ ",
            totalBonusValue.toLocaleString()
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "grid md:grid-cols-2 lg:grid-cols-3 gap-4", children: bonuses.map((bonus, index) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center gap-3 bg-base-200 p-3 rounded-lg",
            children: [
              /* @__PURE__ */ jsx(FaCheck, { className: "text-success flex-shrink-0" }),
              /* @__PURE__ */ jsx("span", { children: bonus.name }),
              /* @__PURE__ */ jsxs("span", { className: "ml-auto text-sm text-base-content/60", children: [
                "NT$",
                bonus.value.toLocaleString()
              ] })
            ]
          },
          index
        )) })
      ] }) })
    ] }) }),
    /* @__PURE__ */ jsx("section", { className: "py-20 px-6 bg-neutral text-neutral-content", children: /* @__PURE__ */ jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-3xl font-bold mb-4", children: "教練變現實戰力" }),
      /* @__PURE__ */ jsx("p", { className: "text-xl mb-8", children: "專業變現,打造穩定收入系統" }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [
        /* @__PURE__ */ jsxs(Link, { to: "/contact", className: "btn btn-primary btn-lg gap-2", children: [
          "立即諮詢 ",
          /* @__PURE__ */ jsx(FaArrowRight, {})
        ] }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "https://www.instagram.com/coach.luen/",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "btn btn-outline btn-lg text-white border-white hover:bg-white hover:text-neutral gap-2",
            children: [
              /* @__PURE__ */ jsx(FaInstagram, {}),
              " 追蹤了解更多"
            ]
          }
        )
      ] })
    ] }) })
  ] });
};
const api = axios.create({
  baseURL: "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => response,
  (error) => {
    var _a;
    if (((_a = error.response) == null ? void 0 : _a.status) === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
const VideoCard = ({ video, className = "" }) => {
  if (video.type === "instagram") {
    return /* @__PURE__ */ jsxs(
      "a",
      {
        href: video.url,
        target: "_blank",
        rel: "noopener noreferrer",
        className: `card bg-base-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-pointer block ${className}`,
        children: [
          /* @__PURE__ */ jsxs("div", { className: "aspect-[9/16] w-full relative bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400", children: [
            video.thumbnail ? /* @__PURE__ */ jsx(
              "img",
              {
                src: video.thumbnail,
                alt: video.title,
                className: "w-full h-full object-cover"
              }
            ) : /* @__PURE__ */ jsx("div", { className: "w-full h-full flex items-center justify-center", children: /* @__PURE__ */ jsxs("div", { className: "text-center text-white", children: [
              /* @__PURE__ */ jsx(FaInstagram, { className: "text-6xl mb-4 mx-auto opacity-80" }),
              /* @__PURE__ */ jsx("p", { className: "text-sm opacity-70", children: "點擊觀看 Reel" })
            ] }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition-colors", children: /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg", children: /* @__PURE__ */ jsx(FaPlay, { className: "text-pink-500 text-2xl ml-1" }) }) }),
            /* @__PURE__ */ jsx("div", { className: "absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-md", children: /* @__PURE__ */ jsx(FaInstagram, { className: "text-pink-500 text-lg" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 bg-base-100 flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm truncate group-hover:text-primary transition-colors flex-1", children: video.title }),
            /* @__PURE__ */ jsx(FaExternalLinkAlt, { className: "text-base-content/40 text-xs flex-shrink-0 group-hover:text-primary" })
          ] })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `card bg-base-100 shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 ${className}`,
      children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-[9/16] w-full relative bg-black", children: /* @__PURE__ */ jsx(
          "iframe",
          {
            className: "w-full h-full absolute top-0 left-0",
            src: video.url,
            title: video.title,
            frameBorder: "0",
            allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
            allowFullScreen: true
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "p-4 bg-base-100", children: /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg truncate group-hover:text-primary transition-colors", children: video.title }) })
      ]
    }
  );
};
const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await api.get("/api/videos");
        setVideos(res.data);
      } catch (err) {
        console.error("Failed to fetch videos", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-base-200 py-12 px-4 sm:px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl font-bold mb-4", children: [
        "教練 ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "短影音" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-base-content/70 mb-6 max-w-2xl mx-auto", children: "跟著阿倫教官一起學習健身知識、訓練技巧,以及心理學在健身中的應用!" }),
      /* @__PURE__ */ jsxs(
        "a",
        {
          href: "https://www.instagram.com/coach.luen/",
          target: "_blank",
          rel: "noopener noreferrer",
          className: "btn btn-outline gap-2 border-pink-500 text-pink-500 hover:bg-pink-500 hover:border-pink-500 hover:text-white",
          children: [
            /* @__PURE__ */ jsx(FaInstagram, { className: "text-xl" }),
            "追蹤 @coach.luen"
          ]
        }
      )
    ] }),
    loading ? /* @__PURE__ */ jsx("div", { className: "flex justify-center py-20", children: /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-lg text-primary" }) }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 sm:gap-4", children: videos.map((video) => /* @__PURE__ */ jsx(VideoCard, { video }, video.video_id)) }),
      /* @__PURE__ */ jsxs("div", { className: "mt-12 text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "divider" }),
        /* @__PURE__ */ jsx("p", { className: "text-base-content/60 mb-4", children: "想看更多精彩內容?" }),
        /* @__PURE__ */ jsxs(
          "a",
          {
            href: "https://www.instagram.com/coach.luen/reels/",
            target: "_blank",
            rel: "noopener noreferrer",
            className: "btn btn-primary gap-2",
            children: [
              /* @__PURE__ */ jsx(FaInstagram, { className: "text-xl" }),
              "查看所有 Reels"
            ]
          }
        )
      ] })
    ] })
  ] }) });
};
const Contact = () => {
  const socialLinks = [
    {
      icon: FaInstagram,
      name: "Instagram",
      handle: "@coach.luen",
      url: "https://www.instagram.com/coach.luen/",
      color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
      desc: "追蹤我的日常訓練分享"
    },
    {
      icon: FaFacebook,
      name: "Facebook",
      handle: "阿倫好健",
      url: "https://www.facebook.com/populuen/",
      color: "bg-blue-600",
      desc: "按讚粉專獲得最新消息"
    },
    {
      icon: FaTiktok,
      name: "TikTok",
      handle: "@coachluen",
      url: "https://www.tiktok.com/@coachluen",
      color: "bg-black",
      desc: "觀看短影音教學內容"
    },
    {
      icon: FaPodcast,
      name: "Podcast",
      handle: "陪你健身",
      url: "https://podcasts.apple.com/tw/podcast/%E9%99%AA%E4%BD%A0%E5%81%A5%E8%BA%AB/id1551996280",
      color: "bg-purple-600",
      desc: "收聽 58 集健身心理學"
    }
  ];
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-base-200 py-12 px-6", children: /* @__PURE__ */ jsxs("div", { className: "max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center mb-12", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-4xl font-bold mb-4", children: [
        "聯絡 ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "阿倫教官" })
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-base-content/70 text-lg", children: "有任何問題歡迎隨時聯絡我!" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-2 gap-8", children: [
      /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-2xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
        /* @__PURE__ */ jsxs("h2", { className: "card-title text-2xl font-bold mb-4", children: [
          /* @__PURE__ */ jsx(FaEnvelope, { className: "text-primary" }),
          " 發送訊息"
        ] }),
        /* @__PURE__ */ jsxs("form", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "姓名" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "您的姓名",
                className: "input input-bordered w-full"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "Email" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                placeholder: "example@mail.com",
                className: "input input-bordered w-full"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "詢問主題" }) }),
            /* @__PURE__ */ jsxs("select", { className: "select select-bordered w-full", children: [
              /* @__PURE__ */ jsx("option", { disabled: true, selected: true, children: "選擇主題" }),
              /* @__PURE__ */ jsx("option", { children: "陪跑課程諮詢" }),
              /* @__PURE__ */ jsx("option", { children: "一對一教練服務" }),
              /* @__PURE__ */ jsx("option", { children: "企業講座邀約" }),
              /* @__PURE__ */ jsx("option", { children: "合作提案" }),
              /* @__PURE__ */ jsx("option", { children: "其他問題" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "訊息內容" }) }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "textarea textarea-bordered h-32",
                placeholder: "請輸入您的訊息..."
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "form-control mt-6", children: /* @__PURE__ */ jsxs("button", { className: "btn btn-primary w-full gap-2", children: [
            /* @__PURE__ */ jsx(FaCommentDots, {}),
            " 送出訊息"
          ] }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
          /* @__PURE__ */ jsx("h2", { className: "card-title text-2xl font-bold mb-4", children: "社群媒體" }),
          /* @__PURE__ */ jsxs("p", { className: "text-base-content/70 mb-6", children: [
            "最快的聯絡方式是透過 Instagram 私訊!",
            /* @__PURE__ */ jsx("br", {}),
            "我會盡快回覆你的訊息 💪"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "space-y-4", children: socialLinks.map((social, index) => /* @__PURE__ */ jsxs(
            "a",
            {
              href: social.url,
              target: "_blank",
              rel: "noopener noreferrer",
              className: "flex items-center gap-4 p-4 rounded-lg bg-base-200 hover:bg-base-300 transition-colors group",
              children: [
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `w-12 h-12 ${social.color} rounded-full flex items-center justify-center text-white`,
                    children: /* @__PURE__ */ jsx(social.icon, { className: "text-xl" })
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                  /* @__PURE__ */ jsx("p", { className: "font-bold group-hover:text-primary transition-colors", children: social.name }),
                  /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: social.handle }),
                  /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/50", children: social.desc })
                ] })
              ]
            },
            index
          )) })
        ] }) }),
        /* @__PURE__ */ jsx("div", { className: "card bg-primary text-primary-content", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "💡 小提示" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "如果你對「私人教練陪跑計畫」有興趣, 可以先到",
            /* @__PURE__ */ jsx("a", { href: "/courses", className: "underline font-bold", children: "課程頁面" }),
            "了解詳情, 再來諮詢會更有效率喔!"
          ] })
        ] }) })
      ] })
    ] })
  ] }) });
};
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(email, password);
      setLoading(false);
      if (res == null ? void 0 : res.success) {
        navigate("/member");
      } else {
        setError((res == null ? void 0 : res.message) || "登入失敗");
      }
    } catch (err) {
      setLoading(false);
      setError("登入過程發生錯誤");
      console.error("Login error:", err);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-base-200 flex items-center justify-center px-4", children: /* @__PURE__ */ jsx("div", { className: "card w-full max-w-sm bg-base-100 shadow-2xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
    /* @__PURE__ */ jsxs("h2", { className: "card-title text-2xl font-bold justify-center mb-4", children: [
      "會員 ",
      /* @__PURE__ */ jsx("span", { className: "text-primary", children: "登入" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "alert alert-error text-sm py-2 mb-4", children: /* @__PURE__ */ jsx("span", { children: error }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "Email" }) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: email,
            onChange: (e) => setEmail(e.target.value),
            placeholder: "your@email.com",
            className: "input input-bordered",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "密碼" }) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            value: password,
            onChange: (e) => setPassword(e.target.value),
            placeholder: "••••••••",
            className: "input input-bordered",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "form-control mt-6", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: `btn btn-primary ${loading ? "loading" : ""}`,
          disabled: loading,
          children: loading ? "登入中..." : "登入"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "divider", children: "或" }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm", children: [
      "還沒有帳號?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/register", className: "link link-primary", children: "立即註冊" })
    ] })
  ] }) }) });
};
const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
    phoneNumber: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
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
        gender: formData.gender || "other"
      });
      setLoading(false);
      if (res == null ? void 0 : res.success) {
        navigate("/member");
      } else {
        setError((res == null ? void 0 : res.message) || "註冊失敗");
      }
    } catch (err) {
      setLoading(false);
      setError("註冊過程發生錯誤");
      console.error("Register error:", err);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-base-200 flex items-center justify-center px-4 py-8", children: /* @__PURE__ */ jsx("div", { className: "card w-full max-w-md bg-base-100 shadow-2xl", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
    /* @__PURE__ */ jsxs("h2", { className: "card-title text-2xl font-bold justify-center mb-4", children: [
      "會員 ",
      /* @__PURE__ */ jsx("span", { className: "text-primary", children: "註冊" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "alert alert-error text-sm py-2 mb-4", children: /* @__PURE__ */ jsx("span", { children: error }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "帳號 *" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "username",
              value: formData.username,
              onChange: handleChange,
              placeholder: "username",
              className: "input input-bordered",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
          /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "顯示名稱" }) }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              name: "displayName",
              value: formData.displayName,
              onChange: handleChange,
              placeholder: "您的名稱",
              className: "input input-bordered"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "Email *" }) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            name: "email",
            value: formData.email,
            onChange: handleChange,
            placeholder: "your@email.com",
            className: "input input-bordered",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "手機號碼" }) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "tel",
            name: "phoneNumber",
            value: formData.phoneNumber,
            onChange: handleChange,
            placeholder: "0912345678",
            className: "input input-bordered"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "密碼 *" }) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            name: "password",
            value: formData.password,
            onChange: handleChange,
            placeholder: "至少 6 個字元",
            className: "input input-bordered",
            required: true,
            minLength: 6
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
        /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "確認密碼 *" }) }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            name: "confirmPassword",
            value: formData.confirmPassword,
            onChange: handleChange,
            placeholder: "再次輸入密碼",
            className: "input input-bordered",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "form-control mt-6", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          className: `btn btn-primary ${loading ? "loading" : ""}`,
          disabled: loading,
          children: loading ? "註冊中..." : "註冊"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "divider", children: "或" }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm", children: [
      "已有帳號?",
      " ",
      /* @__PURE__ */ jsx(Link, { to: "/login", className: "link link-primary", children: "立即登入" })
    ] })
  ] }) }) });
};
const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("courses");
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  if (loading || !user) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex justify-center items-center", children: /* @__PURE__ */ jsx("span", { className: "loading loading-spinner text-primary" }) });
  }
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-base-200 p-6 lg:p-12", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center mb-8", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-3xl font-bold", children: [
        "後台管理 ",
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "Dashboard" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-lg", children: [
        "Welcome, ",
        user.name
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "tabs tabs-boxed mb-8 bg-base-100 p-2", children: [
      /* @__PURE__ */ jsx(
        "a",
        {
          className: `tab tab-lg ${activeTab === "courses" ? "tab-active" : ""}`,
          onClick: () => setActiveTab("courses"),
          children: "課程管理"
        }
      ),
      /* @__PURE__ */ jsx(
        "a",
        {
          className: `tab tab-lg ${activeTab === "videos" ? "tab-active" : ""}`,
          onClick: () => setActiveTab("videos"),
          children: "短影音管理"
        }
      )
    ] }),
    activeTab === "courses" ? /* @__PURE__ */ jsx(CoursesManager, {}) : /* @__PURE__ */ jsx(VideosManager, {})
  ] }) });
};
const CoursesManager = () => {
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    price: "",
    image: ""
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/courses");
        setCourses(res.data);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      }
    };
    fetchCourses();
  }, [refreshTrigger]);
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/courses", newCourse);
      setNewCourse({ title: "", description: "", price: "", image: "" });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to add course", error);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("確定刪除?")) return;
    try {
      await axios.delete(`/api/courses/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete course", error);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
    /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 space-y-4", children: courses.map((course) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "card card-side bg-base-100 shadow-xl compact",
        children: [
          /* @__PURE__ */ jsx("figure", { className: "w-32", children: /* @__PURE__ */ jsx(
            "img",
            {
              src: course.image,
              alt: course.title,
              className: "h-full object-cover"
            }
          ) }),
          /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
            /* @__PURE__ */ jsx("h2", { className: "card-title", children: course.title }),
            /* @__PURE__ */ jsx("p", { className: "text-sm truncate", children: course.description }),
            /* @__PURE__ */ jsxs("div", { className: "card-actions justify-end items-center", children: [
              /* @__PURE__ */ jsxs("div", { className: "font-bold text-primary mr-4", children: [
                "$",
                course.price
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => handleDelete(course.id),
                  className: "btn btn-error btn-xs",
                  children: "刪除"
                }
              )
            ] })
          ] })
        ]
      },
      course.id
    )) }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl h-fit", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
      /* @__PURE__ */ jsx("h2", { className: "card-title mb-4", children: "新增課程" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAdd, className: "space-y-3", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "課程名稱",
            className: "input input-bordered w-full",
            value: newCourse.title,
            onChange: (e) => setNewCourse({ ...newCourse, title: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            placeholder: "描述",
            className: "textarea textarea-bordered w-full",
            value: newCourse.description,
            onChange: (e) => setNewCourse({ ...newCourse, description: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "number",
            placeholder: "價格",
            className: "input input-bordered w-full",
            value: newCourse.price,
            onChange: (e) => setNewCourse({ ...newCourse, price: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "圖片網址",
            className: "input input-bordered w-full",
            value: newCourse.image,
            onChange: (e) => setNewCourse({ ...newCourse, image: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx("button", { className: "btn btn-primary w-full mt-2", children: "新增" })
      ] })
    ] }) })
  ] });
};
const VideosManager = () => {
  const [videos, setVideos] = useState([]);
  const [newVideo, setNewVideo] = useState({
    title: "",
    url: ""
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get("/api/videos");
        setVideos(res.data);
      } catch (error) {
        console.error("Failed to fetch videos", error);
      }
    };
    fetchVideos();
  }, [refreshTrigger]);
  const handleAdd = async (e) => {
    e.preventDefault();
    let url = newVideo.url;
    if (url.includes("watch?v=")) {
      url = url.replace("watch?v=", "embed/");
    } else if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1];
      url = `https://www.youtube.com/embed/${id}`;
    }
    try {
      await axios.post("/api/videos", { ...newVideo, url });
      setNewVideo({ title: "", url: "" });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to add video", error);
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm("確定刪除?")) return;
    try {
      await axios.delete(`/api/videos/${id}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to delete video", error);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-8", children: [
    /* @__PURE__ */ jsx("div", { className: "lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4", children: videos.map((video) => /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md", children: /* @__PURE__ */ jsxs("div", { className: "card-body p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold truncate", children: video.title }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-base-content/50 truncate", children: video.url }),
      /* @__PURE__ */ jsx("div", { className: "card-actions justify-end mt-2", children: /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => handleDelete(video.id),
          className: "btn btn-error btn-xs",
          children: "刪除"
        }
      ) })
    ] }) }, video.id)) }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-xl h-fit", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
      /* @__PURE__ */ jsx("h2", { className: "card-title mb-4", children: "新增影片" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleAdd, className: "space-y-3", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "影片標題",
            className: "input input-bordered w-full",
            value: newVideo.title,
            onChange: (e) => setNewVideo({ ...newVideo, title: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "YouTube URL",
            className: "input input-bordered w-full",
            value: newVideo.url,
            onChange: (e) => setNewVideo({ ...newVideo, url: e.target.value }),
            required: true
          }
        ),
        /* @__PURE__ */ jsx("button", { className: "btn btn-primary w-full mt-2", children: "新增" })
      ] })
    ] }) })
  ] });
};
const albums = [
  {
    album: "《允碩-一個人的生活探索》（修復版）",
    count: 65,
    photos: [
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-10-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-11.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-12-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-13-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-14-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-15.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-16-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-17.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-18-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-19.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-2-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-20-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-21-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-22.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-23-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-24.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-25-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-26.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-27-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-28.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-29-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-3.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-30-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-31-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-32.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-33-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-34.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-35-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-36.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-37-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-38.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-39-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-4-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-40-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-41.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-42-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-43-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-44-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-45.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-46-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-47.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-48.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-49-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-5-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-50.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-51.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-52-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-53.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-54.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-55-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-56.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-57.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-58-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-59.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-6-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-60-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-61-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-62.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-63.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-64.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-65.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-7.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-8-2048x1504.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/Blue-Men-VOL13-9.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E4%B8%80%E5%80%8B%E4%BA%BA%E7%9A%84%E7%94%9F%E6%B4%BB%E6%8E%A2%E7%B4%A2%E3%80%8B%EF%BC%88%E4%BF%AE%E5%BE%A9%E7%89%88%EF%BC%89/S.jpg"
    ]
  },
  {
    album: "《允碩-回歸坦蕩》",
    count: 70,
    photos: [
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-1.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-10.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-11.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-12.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-13.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-14.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-15.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-16.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-17.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-18.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-19.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-20.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-22.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-23.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-24.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-25.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-26.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-27.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-28.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-29.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-30.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-31.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-32.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-33.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-34.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-35.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-36.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-37.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-38.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-39.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-40.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-41.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-42.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-43.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-44.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-45.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-46.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-47.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-48.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-49.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-50.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-51.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-52.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-53.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-54.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-55.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-56.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-57.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-58.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-6.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-60.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-61.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-62.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-64.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-65.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-66.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-67.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-68.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-69.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-7.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-70.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-71.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-72.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-73.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-74.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-75.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-76.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-77.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-8.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E5%9B%9E%E6%AD%B8%E5%9D%A6%E8%95%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.283-9.jpg"
    ]
  },
  {
    album: "《允碩-體育男神》",
    count: 75,
    photos: [
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-1-01.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-14.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-15.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-16.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-17.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-18.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-19.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-20.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-21.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-22.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-23.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-25.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-26.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-27.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-28.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-29.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-30.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-31.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-32.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-33.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-34.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-35.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-37.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-38.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-39.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-40.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-41.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-42.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-43.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-44.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-45.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-46.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-47.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-48.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-49.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-51.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-52.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-53.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-54.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-55.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-56.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-57.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-58.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-59.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-60.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-61.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-62.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-63.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-64.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-65.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-66.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-67.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-68.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-69.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-70.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-72.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-73.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-74.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-75.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-76.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-77.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-78.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-79.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-80.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-81.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-82.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-83.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-84.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-85.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-87.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-88.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-89.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-90.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-91.jpg",
      "/coach-photos/%E3%80%8A%E5%85%81%E7%A2%A9-%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.326-92.jpg"
    ]
  },
  {
    album: "《全新體育系男神允碩》（實體書電子版）Part 01",
    count: 40,
    photos: [
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/000-FM-1.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-10.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-11.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-12.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-13.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-14.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-15.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-16.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-17.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-18.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-19.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-2.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-20.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-21.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-23.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-24.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-25.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-26.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-27.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-28.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-29.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-3.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-30.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-31.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-32.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-33.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-34.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-35.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-36.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-37.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-38.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-39.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-4.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-40.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-41.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-5.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-6.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-7.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-8.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2001/Blue-Men-VOL06-YS-9.jpg"
    ]
  },
  {
    album: "《全新體育系男神允碩》（實體書電子版）Part 02",
    count: 45,
    photos: [
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-42.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-43.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-44.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-45.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-46.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-47.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-48.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-49.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-50.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-51.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-52.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-53.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-54.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-55.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-56.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-57.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-58.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-59.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-60.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-61.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-62.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-63.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-64.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-65.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-66.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-67.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-68.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-69.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-70.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-71.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-72.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-73.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-74.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-75.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-77.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-78.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-79.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-80.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-81.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-82.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-83.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-84.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-85.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/Blue-Men-VOL06-YS-86.jpg",
      "/coach-photos/%E3%80%8A%E5%85%A8%E6%96%B0%E9%AB%94%E8%82%B2%E7%B3%BB%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B%EF%BC%88%E5%AF%A6%E9%AB%94%E6%9B%B8%E9%9B%BB%E5%AD%90%E7%89%88%EF%BC%89Part%2002/S2.jpg"
    ]
  },
  {
    album: "《性感天菜男神-允碩&廷",
    count: 39,
    photos: [
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/S1-6.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-10.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-11.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-12.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-13.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-14.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-15.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-16.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-17.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-18.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-19.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-2.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-20.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-21.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-22.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-23.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-24.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-25.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-26.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-27.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-28.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-29.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-3.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-30.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-31.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-32.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-33.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-34.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-35.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-36.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-37.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-38.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-39.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-4.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-5.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-6.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-7.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-8.jpg",
      "/coach-photos/%E3%80%8A%E6%80%A7%E6%84%9F%E5%A4%A9%E8%8F%9C%E7%94%B7%E7%A5%9E-%E5%85%81%E7%A2%A9%26%E5%BB%B7/Virile-VOL10-9.jpg"
    ]
  },
  {
    album: "《超人氣體育男神允碩》",
    count: 72,
    photos: [
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-1.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-14.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-15.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-16.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-17.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-18.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-19.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-20.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-21.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-22.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-23.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-24.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-25.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-26.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-27.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-28.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-29.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-30.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-31.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-32.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-33.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-34.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-35.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-36.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-38.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-39.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-40.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-41.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-42.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-43.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-44.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-45.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-46.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-47.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-48.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-49.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-50.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-51.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-52.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-53.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-54.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-55.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-56.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-57.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-58.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-59.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-60.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-61.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-62.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-63.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-64.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-65.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-66.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-68.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-70.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-71.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-72.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-73.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-74.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-75.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-76.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-77.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-78.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-79.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-80.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-81.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-82.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-83.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-84.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-86.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-88.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E3%80%8B/BLUEMEN-%E8%97%8D%E7%94%B7%E8%89%B2-NO.306-89.jpg"
    ]
  },
  {
    album: "《超人氣體育男神允碩的斜槓日常》",
    count: 83,
    photos: [
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/000-FM.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-018.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-019.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-020.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-021.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-022.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-023-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-024-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-025.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-026.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-027.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-028.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-029.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-030.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-031.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-032.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-033.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-034.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-035.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-036.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-037-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-038-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-039.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-040.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-041.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-042.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-043-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-044.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-045.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-046.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-047.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-048.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-049.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-050-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-051.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-052.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-053-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-054.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-055.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-056.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-057.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-058.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-059.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-060.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-061.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-062.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-063.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-064-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-065.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-066.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-067.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-068.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-069.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-070.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-071.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-072.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-073.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-075.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-076.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-077-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-078.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-079.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-080.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-081.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-082.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-083.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-084.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-085-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-086.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-087.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-088.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-089.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-090-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-091.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-092.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-093.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-094.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-095.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-096.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-097-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-098-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-099-2048x1454.jpg",
      "/coach-photos/%E3%80%8A%E8%B6%85%E4%BA%BA%E6%B0%A3%E9%AB%94%E8%82%B2%E7%94%B7%E7%A5%9E%E5%85%81%E7%A2%A9%E7%9A%84%E6%96%9C%E6%A7%93%E6%97%A5%E5%B8%B8%E3%80%8B/BlueMen200-100.jpg"
    ]
  }
];
const coachPhotosManifest = {
  albums
};
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const CoachPhotos = () => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const dialogRef = useRef(null);
  const albums2 = useMemo(() => {
    const manifest = coachPhotosManifest;
    const rawAlbums = (manifest == null ? void 0 : manifest.albums) ?? [];
    return rawAlbums.filter((a) => Array.isArray(a.photos) && a.photos.length > 0).map((a) => ({
      album: a.album,
      photos: a.photos
    }));
  }, []);
  const bannerPhotos = useMemo(() => {
    const allPhotos = albums2.flatMap((a) => a.photos);
    if (allPhotos.length === 0) return [];
    const shuffled = shuffleArray(allPhotos);
    return shuffled.slice(0, Math.min(8, shuffled.length));
  }, [albums2]);
  useEffect(() => {
    if (bannerPhotos.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % bannerPhotos.length);
    }, 4e3);
    return () => clearInterval(timer);
  }, [bannerPhotos.length]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = document.querySelectorAll("[data-reveal]");
    elements.forEach((el) => {
      const htmlEl = el;
      htmlEl.style.opacity = "0";
      htmlEl.style.transform = "translateY(16px)";
    });
    import("./assets/index-N6a9ipeV.js").then(({ default: gsap }) => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            const el = entry.target;
            if (el.dataset.revealed === "1") continue;
            el.dataset.revealed = "1";
            gsap.to(el, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              ease: "power3.out"
            });
            observer.unobserve(el);
          }
        },
        { rootMargin: "80px 0px", threshold: 0.12 }
      );
      elements.forEach((el) => observer.observe(el));
      return () => observer.disconnect();
    }).catch((error) => {
      console.error("Failed to load GSAP:", error);
    });
  }, [albums2.length]);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selectedPhoto) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [selectedPhoto]);
  const onClose = () => setSelectedPhoto(null);
  const handlePrevCarousel = () => {
    setCarouselIndex(
      (prev) => (prev - 1 + bannerPhotos.length) % bannerPhotos.length
    );
  };
  const handleNextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % bannerPhotos.length);
  };
  const handleCarouselSelect = (index) => {
    setCarouselIndex(index);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-gradient-to-b from-base-100 to-base-200", children: [
    bannerPhotos.length > 0 && /* @__PURE__ */ jsxs("div", { className: "w-full h-[60vh] relative overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "carousel w-full h-full", children: bannerPhotos.map((src, idx) => /* @__PURE__ */ jsx(
        "div",
        {
          className: `carousel-item absolute w-full h-full transition-opacity duration-700 ease-in-out ${idx === carouselIndex ? "opacity-100 z-10" : "opacity-0 z-0"}`,
          children: /* @__PURE__ */ jsx(
            "img",
            {
              src,
              alt: `Banner ${idx + 1}`,
              className: "w-full h-full object-cover object-center",
              loading: idx === 0 ? "eager" : "lazy"
            }
          )
        },
        src
      )) }),
      /* @__PURE__ */ jsx("div", { className: "absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20", children: bannerPhotos.map((_, idx) => /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => handleCarouselSelect(idx),
          className: `w-3 h-3 rounded-full transition-colors ${idx === carouselIndex ? "bg-primary" : "bg-white/50 hover:bg-white/80"}`,
          "aria-label": `Go to slide ${idx + 1}`
        },
        idx
      )) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "absolute left-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-black/30 hover:bg-black/50 text-white z-20",
          onClick: handlePrevCarousel,
          "aria-label": "Previous",
          children: "❮"
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          className: "absolute right-4 top-1/2 -translate-y-1/2 btn btn-circle btn-ghost bg-black/30 hover:bg-black/50 text-white z-20",
          onClick: handleNextCarousel,
          "aria-label": "Next",
          children: "❯"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto pt-10 pb-12 px-4 sm:px-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center mb-10", "data-reveal": true, children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-4xl md:text-5xl font-bold mb-3", children: [
          "教練個人",
          /* @__PURE__ */ jsx("span", { className: "text-primary", children: "寫真" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-base-content/70 max-w-2xl mx-auto", children: "依相簿資料夾分類,瀑布流呈現;點擊照片可放大查看。" })
      ] }),
      albums2.length === 0 ? /* @__PURE__ */ jsx("div", { className: "max-w-xl mx-auto", "data-reveal": true, children: /* @__PURE__ */ jsx("div", { className: "alert alert-warning", children: /* @__PURE__ */ jsx("span", { children: "目前沒有找到任何寫真圖片。請先執行 `npm run generate:coach-photos`,或確認資料夾 `個人資料提取/個人寫真` 內有圖片。" }) }) }) : /* @__PURE__ */ jsx("div", { className: "space-y-12", children: albums2.map((album) => /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-end justify-between gap-4 mb-4",
            "data-reveal": true,
            children: [
              /* @__PURE__ */ jsx("h2", { className: "text-2xl font-bold", children: album.album }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-base-content/60", children: [
                album.photos.length,
                " 張"
              ] })
            ]
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4", children: album.photos.map((src) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "mb-4 break-inside-avoid w-full text-left",
            onClick: () => setSelectedPhoto(src),
            "aria-label": "放大查看",
            children: /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-sm hover:shadow-md transition-shadow", children: /* @__PURE__ */ jsx("figure", { className: "p-2", children: /* @__PURE__ */ jsx(
              "img",
              {
                src,
                alt: album.album,
                loading: "lazy",
                decoding: "async",
                className: "w-full h-auto rounded-box"
              }
            ) }) })
          },
          src
        )) })
      ] }, album.album)) })
    ] }),
    /* @__PURE__ */ jsxs("dialog", { ref: dialogRef, className: "modal", onClose, children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box max-w-5xl p-3", children: [
        selectedPhoto ? /* @__PURE__ */ jsx(
          "img",
          {
            src: selectedPhoto,
            alt: "放大照片",
            className: "w-full h-auto rounded-box",
            loading: "eager",
            decoding: "async"
          }
        ) : null,
        /* @__PURE__ */ jsx("div", { className: "modal-action", children: /* @__PURE__ */ jsx("button", { type: "button", className: "btn", onClick: onClose, children: "關閉" }) })
      ] }),
      /* @__PURE__ */ jsx("form", { method: "dialog", className: "modal-backdrop", children: /* @__PURE__ */ jsx("button", { "aria-label": "close" }) })
    ] })
  ] });
};
const formatDate$1 = (dateString) => {
  if (!dateString) return "未知";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  } catch {
    return "未知";
  }
};
const MemberCenter = () => {
  var _a, _b;
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-base-200", children: /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-lg text-primary" }) });
  }
  if (!user) return null;
  const extendedUser = user;
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-base-200 py-8 px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md border border-base-300 mb-6", children: /* @__PURE__ */ jsx("div", { className: "card-body", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center gap-6", children: [
      /* @__PURE__ */ jsx("div", { className: "avatar placeholder", children: /* @__PURE__ */ jsx("div", { className: "bg-primary text-primary-content rounded-full w-20", children: /* @__PURE__ */ jsx("span", { className: "text-3xl", children: (_b = (_a = extendedUser.displayName || extendedUser.name || extendedUser.email) == null ? void 0 : _a[0]) == null ? void 0 : _b.toUpperCase() }) }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 text-center sm:text-left", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: extendedUser.displayName || extendedUser.username || extendedUser.name }),
        /* @__PURE__ */ jsx("p", { className: "text-base-content/60", children: extendedUser.email }),
        (extendedUser.phoneNumber || extendedUser.phone_number) && /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/50", children: extendedUser.phoneNumber || extendedUser.phone_number }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-base-content/50 mt-1", children: [
          "加入時間:",
          formatDate$1(
            extendedUser.createdAt || extendedUser.created_at
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        extendedUser.isAdmin && /* @__PURE__ */ jsxs("span", { className: "badge badge-primary gap-1", children: [
          /* @__PURE__ */ jsx(FaShieldAlt, {}),
          " 管理員"
        ] }),
        extendedUser.sex && /* @__PURE__ */ jsx("span", { className: "badge badge-secondary", children: "私密相簿權限" })
      ] })
    ] }) }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6", children: [
      /* @__PURE__ */ jsx(
        Link,
        {
          to: "/courses",
          className: "card bg-base-100 shadow-md border border-base-300 hover:shadow-lg transition-shadow",
          children: /* @__PURE__ */ jsxs("div", { className: "card-body items-center text-center", children: [
            /* @__PURE__ */ jsx(FaBook, { className: "text-4xl text-primary mb-2" }),
            /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "瀏覽課程" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: "探索所有線上課程" })
          ] })
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md border border-base-300", children: /* @__PURE__ */ jsxs("div", { className: "card-body items-center text-center", children: [
        /* @__PURE__ */ jsx(FaShoppingBag, { className: "text-4xl text-secondary mb-2" }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "我的訂單" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: "查看購買記錄" }),
        /* @__PURE__ */ jsx("span", { className: "badge badge-ghost", children: "即將推出" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md border border-base-300", children: /* @__PURE__ */ jsxs("div", { className: "card-body items-center text-center", children: [
        /* @__PURE__ */ jsx(FaCog, { className: "text-4xl text-accent mb-2" }),
        /* @__PURE__ */ jsx("h3", { className: "font-semibold", children: "帳號設定" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: "修改個人資料" }),
        /* @__PURE__ */ jsx("span", { className: "badge badge-ghost", children: "即將推出" })
      ] }) })
    ] }),
    extendedUser.isAdmin && /* @__PURE__ */ jsx("div", { className: "card bg-neutral text-neutral-content shadow-md mb-6", children: /* @__PURE__ */ jsx("div", { className: "card-body", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(FaShieldAlt, { className: "text-3xl" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "管理員後台" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm opacity-80", children: "管理會員、課程、影片等" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/admin", className: "btn btn-primary", children: "進入後台" })
    ] }) }) }),
    extendedUser.sex && /* @__PURE__ */ jsx("div", { className: "card bg-secondary text-secondary-content shadow-md mb-6", children: /* @__PURE__ */ jsx("div", { className: "card-body", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: "🔓 私密相簿已解鎖" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm opacity-80", children: "您已獲得「阿倫私密淫照」的檢視權限" })
      ] }),
      /* @__PURE__ */ jsx(Link, { to: "/photos", className: "btn btn-outline btn-sm", children: "前往相簿" })
    ] }) }) }),
    /* @__PURE__ */ jsx("div", { className: "text-center", children: /* @__PURE__ */ jsx("button", { onClick: logout, className: "btn btn-outline btn-error", children: "登出" }) })
  ] }) });
};
const AdminLayout = () => {
  var _a, _b;
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      navigate("/login");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen flex items-center justify-center bg-base-200", children: /* @__PURE__ */ jsx("span", { className: "loading loading-spinner loading-lg text-primary" }) });
  }
  if (!(user == null ? void 0 : user.isAdmin)) {
    return null;
  }
  const navItems = [
    { path: "/admin", icon: /* @__PURE__ */ jsx(FaChartBar, {}), label: "總覽", end: true },
    { path: "/admin/users", icon: /* @__PURE__ */ jsx(FaUsers, {}), label: "會員管理" },
    { path: "/admin/courses", icon: /* @__PURE__ */ jsx(FaBook, {}), label: "課程管理" },
    { path: "/admin/videos", icon: /* @__PURE__ */ jsx(FaVideo, {}), label: "影片管理" },
    { path: "/admin/whitelist", icon: /* @__PURE__ */ jsx(FaShieldAlt, {}), label: "管理員白名單" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-base-200 flex", children: [
    /* @__PURE__ */ jsxs("aside", { className: "hidden lg:flex lg:flex-col w-64 bg-base-100 border-r border-base-300", children: [
      /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-base-300", children: /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold", children: [
        /* @__PURE__ */ jsx("span", { className: "text-primary", children: "阿倫教官" }),
        " 後台"
      ] }) }),
      /* @__PURE__ */ jsx("nav", { className: "flex-1 p-4", children: /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: navItems.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        NavLink,
        {
          to: item.path,
          end: item.end,
          className: ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-primary text-primary-content" : "hover:bg-base-200 text-base-content"}`,
          children: [
            item.icon,
            /* @__PURE__ */ jsx("span", { children: item.label })
          ]
        }
      ) }, item.path)) }) }),
      /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-base-300", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => navigate("/"),
          className: "btn btn-ghost btn-sm w-full justify-start gap-2",
          children: [
            /* @__PURE__ */ jsx(FaArrowLeft, {}),
            " 返回前台"
          ]
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `lg:hidden fixed inset-0 z-50 ${sidebarOpen ? "" : "pointer-events-none"}`,
        children: [
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `absolute inset-0 bg-black transition-opacity ${sidebarOpen ? "opacity-50" : "opacity-0"}`,
              onClick: () => setSidebarOpen(false)
            }
          ),
          /* @__PURE__ */ jsxs(
            "aside",
            {
              className: `absolute left-0 top-0 bottom-0 w-64 bg-base-100 transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`,
              children: [
                /* @__PURE__ */ jsxs("div", { className: "p-4 border-b border-base-300 flex items-center justify-between", children: [
                  /* @__PURE__ */ jsxs("h1", { className: "text-xl font-bold", children: [
                    /* @__PURE__ */ jsx("span", { className: "text-primary", children: "阿倫教官" }),
                    " 後台"
                  ] }),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      className: "btn btn-ghost btn-sm",
                      onClick: () => setSidebarOpen(false),
                      children: /* @__PURE__ */ jsx(FaTimes, {})
                    }
                  )
                ] }),
                /* @__PURE__ */ jsx("nav", { className: "p-4", children: /* @__PURE__ */ jsx("ul", { className: "space-y-1", children: navItems.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
                  NavLink,
                  {
                    to: item.path,
                    end: item.end,
                    onClick: () => setSidebarOpen(false),
                    className: ({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? "bg-primary text-primary-content" : "hover:bg-base-200 text-base-content"}`,
                    children: [
                      item.icon,
                      /* @__PURE__ */ jsx("span", { children: item.label })
                    ]
                  }
                ) }, item.path)) }) }),
                /* @__PURE__ */ jsx("div", { className: "p-4 border-t border-base-300", children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    onClick: () => navigate("/"),
                    className: "btn btn-ghost btn-sm w-full justify-start gap-2",
                    children: [
                      /* @__PURE__ */ jsx(FaArrowLeft, {}),
                      " 返回前台"
                    ]
                  }
                ) })
              ]
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-h-screen", children: [
      /* @__PURE__ */ jsxs("header", { className: "bg-base-100 border-b border-base-300 px-4 py-3 flex items-center justify-between lg:justify-end", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-ghost btn-sm lg:hidden",
            onClick: () => setSidebarOpen(true),
            children: /* @__PURE__ */ jsx(FaBars, { className: "text-xl" })
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm text-base-content/70", children: (user == null ? void 0 : user.displayName) || (user == null ? void 0 : user.email) }),
          /* @__PURE__ */ jsx("div", { className: "avatar placeholder", children: /* @__PURE__ */ jsx("div", { className: "bg-primary text-primary-content rounded-full w-8", children: /* @__PURE__ */ jsx("span", { className: "text-sm", children: (_b = (_a = (user == null ? void 0 : user.displayName) || (user == null ? void 0 : user.email)) == null ? void 0 : _a[0]) == null ? void 0 : _b.toUpperCase() }) }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("main", { className: "flex-1 p-4 lg:p-6 overflow-auto", children: /* @__PURE__ */ jsx(Outlet, {}) })
    ] })
  ] });
};
const UI = {
  // 狀態顏色映射
  status: {
    published: "badge badge-success",
    draft: "badge badge-warning",
    archived: "badge badge-ghost",
    pending: "badge badge-warning",
    paid: "badge badge-success",
    cancelled: "badge badge-error",
    refunded: "badge badge-info",
    active: "badge badge-success",
    inactive: "badge badge-ghost"
  }
};
const STATUS_TEXT = {
  // 課程狀態
  published: "已發布",
  draft: "草稿",
  archived: "已封存",
  // 訂單狀態
  pending: "待付款",
  paid: "已付款",
  cancelled: "已取消",
  refunded: "已退款",
  // 通用狀態
  active: "啟用",
  inactive: "停用"
};
const formatCurrency = (amount, currency = "TWD") => {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0
  }).format(amount);
};
const formatDate = (date) => {
  if (!date) return "-";
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(date));
};
const StatCard = ({
  title,
  value,
  icon,
  description,
  trend,
  className = ""
}) => {
  return /* @__PURE__ */ jsx("div", { className: `card bg-base-100 shadow-xl ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60", children: title }),
        /* @__PURE__ */ jsx("p", { className: "text-3xl font-bold mt-1", children: value }),
        description && /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/50 mt-1", children: description })
      ] }),
      icon && /* @__PURE__ */ jsx("div", { className: "text-4xl text-primary/30", children: icon })
    ] }),
    trend !== void 0 && /* @__PURE__ */ jsxs(
      "div",
      {
        className: `mt-2 text-sm ${trend > 0 ? "text-success" : "text-error"}`,
        children: [
          trend > 0 ? "↑" : "↓",
          " ",
          Math.abs(trend),
          "%"
        ]
      }
    )
  ] }) });
};
const DataTable = ({
  columns,
  data,
  onRowClick,
  emptyText = "暫無資料",
  className = ""
}) => {
  return /* @__PURE__ */ jsx("div", { className: `overflow-x-auto ${className}`, children: /* @__PURE__ */ jsxs("table", { className: "table table-zebra w-full", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsx("tr", { children: columns.map((col, i) => /* @__PURE__ */ jsx("th", { className: col.headerClassName || "", children: col.header }, i)) }) }),
    /* @__PURE__ */ jsx("tbody", { children: data.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
      "td",
      {
        colSpan: columns.length,
        className: "text-center text-base-content/60",
        children: emptyText
      }
    ) }) : data.map((row, i) => /* @__PURE__ */ jsx(
      "tr",
      {
        className: onRowClick ? "cursor-pointer hover:bg-base-200" : "",
        onClick: () => onRowClick == null ? void 0 : onRowClick(row),
        children: columns.map((col, j) => /* @__PURE__ */ jsx("td", { className: col.cellClassName || "", children: col.render ? col.render(row) : col.accessor ? row[col.accessor] : null }, j))
      },
      i
    )) })
  ] }) });
};
const StatusBadge = ({
  status,
  text,
  className = ""
}) => {
  const statusClass = UI.status[status] || "badge badge-ghost";
  return /* @__PURE__ */ jsx("span", { className: `${statusClass} ${className}`, children: text || status });
};
const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "確認",
  cancelText = "取消",
  danger = false
}) => {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsxs("div", { className: "modal modal-open", children: [
    /* @__PURE__ */ jsxs("div", { className: "modal-box", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg", children: title }),
      /* @__PURE__ */ jsx("p", { className: "py-4", children: message }),
      /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
        /* @__PURE__ */ jsx("button", { className: "btn btn-ghost", onClick: onCancel, children: cancelText }),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: danger ? "btn btn-error" : "btn btn-primary",
            onClick: onConfirm,
            children: confirmText
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "modal-backdrop", onClick: onCancel })
  ] });
};
const LoadingSpinner = ({
  size = "md",
  text,
  className = ""
}) => {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex flex-col items-center justify-center py-8 ${className}`,
      children: [
        /* @__PURE__ */ jsx(
          "span",
          {
            className: `loading loading-spinner loading-${size} text-primary`
          }
        ),
        text && /* @__PURE__ */ jsx("p", { className: "mt-2 text-base-content/60", children: text })
      ]
    }
  );
};
const PageHeader = ({
  title,
  subtitle,
  actions,
  className = ""
}) => {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 ${className}`,
      children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: title }),
          subtitle && /* @__PURE__ */ jsx("p", { className: "text-base-content/60 mt-1", children: subtitle })
        ] }),
        actions && /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: actions })
      ]
    }
  );
};
const SearchInput = ({
  value,
  onChange,
  placeholder = "搜尋...",
  className = ""
}) => {
  return /* @__PURE__ */ jsx("div", { className: `form-control ${className}`, children: /* @__PURE__ */ jsxs("div", { className: "input-group", children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "text",
        placeholder,
        className: "input input-bordered w-full",
        value,
        onChange: (e) => onChange(e.target.value)
      }
    ),
    /* @__PURE__ */ jsx("button", { className: "btn btn-square btn-ghost", children: /* @__PURE__ */ jsx(
      "svg",
      {
        xmlns: "http://www.w3.org/2000/svg",
        className: "h-5 w-5",
        fill: "none",
        viewBox: "0 0 24 24",
        stroke: "currentColor",
        children: /* @__PURE__ */ jsx(
          "path",
          {
            strokeLinecap: "round",
            strokeLinejoin: "round",
            strokeWidth: 2,
            d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          }
        )
      }
    ) })
  ] }) });
};
const Toggle = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = ""
}) => {
  return /* @__PURE__ */ jsxs("label", { className: `label cursor-pointer justify-start gap-3 ${className}`, children: [
    /* @__PURE__ */ jsx(
      "input",
      {
        type: "checkbox",
        className: "toggle toggle-primary",
        checked,
        onChange: (e) => onChange(e.target.checked),
        disabled
      }
    ),
    label && /* @__PURE__ */ jsx("span", { className: "label-text", children: label })
  ] });
};
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchStats();
  }, []);
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      setError("載入統計資料失敗，請稍後再試");
    } finally {
      setLoading(false);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx(LoadingSpinner, { text: "載入中..." });
  }
  if (error) {
    return /* @__PURE__ */ jsx("div", { className: "alert alert-error", children: /* @__PURE__ */ jsx("span", { children: error }) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mb-6", children: "後台總覽" }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8", children: [
      /* @__PURE__ */ jsx(
        StatCard,
        {
          title: "會員總數",
          value: (stats == null ? void 0 : stats.userCount) || 0,
          icon: /* @__PURE__ */ jsx(FaUsers, {})
        }
      ),
      /* @__PURE__ */ jsx(
        StatCard,
        {
          title: "課程數量",
          value: (stats == null ? void 0 : stats.courseCount) || 0,
          icon: /* @__PURE__ */ jsx(FaBook, {})
        }
      ),
      /* @__PURE__ */ jsx(
        StatCard,
        {
          title: "訂單數量",
          value: (stats == null ? void 0 : stats.orderCount) || 0,
          icon: /* @__PURE__ */ jsx(FaShoppingCart, {})
        }
      ),
      /* @__PURE__ */ jsx(
        StatCard,
        {
          title: "本月營收",
          value: formatCurrency((stats == null ? void 0 : stats.monthlyRevenue) || 0),
          icon: /* @__PURE__ */ jsx(FaDollarSign, {})
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md border border-base-300", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
      /* @__PURE__ */ jsx("h2", { className: "card-title text-lg mb-4", children: "快捷操作" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsx("a", { href: "/admin/users", className: "btn btn-outline btn-sm", children: "管理會員" }),
        /* @__PURE__ */ jsx("a", { href: "/admin/courses", className: "btn btn-outline btn-sm", children: "新增課程" }),
        /* @__PURE__ */ jsx("a", { href: "/admin/videos", className: "btn btn-outline btn-sm", children: "新增影片" }),
        /* @__PURE__ */ jsx("a", { href: "/admin/whitelist", className: "btn btn-outline btn-sm", children: "白名單設定" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 card bg-base-100 shadow-md border border-base-300", children: /* @__PURE__ */ jsxs("div", { className: "card-body", children: [
      /* @__PURE__ */ jsx("h2", { className: "card-title text-lg mb-4", children: "系統資訊" }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-base-content/60", children: "資料庫：" }),
          "Supabase PostgreSQL"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-base-content/60", children: "前端：" }),
          "React + Vite + TailwindCSS + DaisyUI"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-base-content/60", children: "後端：" }),
          "Express.js"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-base-content/60", children: "部署：" }),
          "Vercel"
        ] })
      ] })
    ] }) })
  ] });
};
const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchUsers();
  }, [page, search]);
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/admin/users", {
        params: { page, limit: 20, search }
      });
      setUsers(res.data.users);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("Failed to fetch users:", err);
      setError("載入會員資料失敗");
    } finally {
      setLoading(false);
    }
  };
  const handleUpdateUser = async (userId, data) => {
    try {
      setError("");
      await api.put(`/api/admin/users/${userId}`, data);
      await fetchUsers();
      setEditUser(null);
    } catch (err) {
      console.error("Failed to update user:", err);
      setError("更新會員資料失敗");
    }
  };
  const handleDeleteUser = async (userId) => {
    try {
      setError("");
      await api.delete(`/api/admin/users/${userId}`);
      await fetchUsers();
      setDeleteUser(null);
    } catch (err) {
      console.error("Failed to delete user:", err);
      setError("刪除會員失敗");
    }
  };
  const handleToggleSex = async (user) => {
    try {
      setError("");
      await handleUpdateUser(user.user_id, { sex: !user.sex });
    } catch (err) {
      console.error("Failed to toggle sex permission:", err);
      setError("切換權限失敗");
    }
  };
  const columns = [
    {
      header: "使用者",
      render: (row) => {
        var _a, _b;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "avatar placeholder", children: /* @__PURE__ */ jsx("div", { className: "bg-neutral text-neutral-content rounded-full w-10", children: /* @__PURE__ */ jsx("span", { children: (_b = (_a = row.display_name || row.email) == null ? void 0 : _a[0]) == null ? void 0 : _b.toUpperCase() }) }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "font-semibold", children: row.display_name || row.username }),
            /* @__PURE__ */ jsx("div", { className: "text-sm text-base-content/60", children: row.email })
          ] })
        ] });
      }
    },
    {
      header: "狀態",
      render: (row) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
        /* @__PURE__ */ jsx(
          StatusBadge,
          {
            status: row.is_active ? "active" : "inactive",
            text: row.is_active ? "啟用" : "停用"
          }
        ),
        row.isAdmin && /* @__PURE__ */ jsxs("span", { className: "badge badge-primary badge-sm gap-1", children: [
          /* @__PURE__ */ jsx(FaUserShield, {}),
          " 管理員"
        ] })
      ] })
    },
    {
      header: "私密相簿權限",
      render: (row) => /* @__PURE__ */ jsx(
        Toggle,
        {
          checked: row.sex,
          onChange: () => handleToggleSex(row),
          label: row.sex ? "可檢視" : "不可檢視"
        }
      )
    },
    {
      header: "最後登入",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "text-sm", children: formatDate(row.last_login_at) })
    },
    {
      header: "註冊時間",
      render: (row) => /* @__PURE__ */ jsx("span", { className: "text-sm", children: formatDate(row.created_at) })
    },
    {
      header: "操作",
      render: (row) => /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-ghost btn-xs",
            onClick: () => setEditUser(row),
            children: /* @__PURE__ */ jsx(FaEdit, {})
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-ghost btn-xs text-error",
            onClick: () => setDeleteUser(row),
            disabled: row.isAdmin,
            children: /* @__PURE__ */ jsx(FaTrash, {})
          }
        )
      ] })
    }
  ];
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(PageHeader, { title: "會員管理", subtitle: `共 ${users.length} 位會員` }),
    error && /* @__PURE__ */ jsx("div", { className: "alert alert-error mb-4", children: /* @__PURE__ */ jsx("span", { children: error }) }),
    /* @__PURE__ */ jsx("div", { className: "mb-4 max-w-xs", children: /* @__PURE__ */ jsx(
      SearchInput,
      {
        value: search,
        onChange: (v) => {
          setSearch(v);
          setPage(1);
        },
        placeholder: "搜尋 Email / 名稱..."
      }
    ) }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md border border-base-300", children: /* @__PURE__ */ jsx("div", { className: "card-body p-0", children: loading ? /* @__PURE__ */ jsx(LoadingSpinner, {}) : /* @__PURE__ */ jsx(DataTable, { columns, data: users, emptyText: "找不到會員" }) }) }),
    totalPages > 1 && /* @__PURE__ */ jsx("div", { className: "flex justify-center mt-4", children: /* @__PURE__ */ jsxs("div", { className: "join", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "join-item btn btn-sm",
          disabled: page <= 1,
          onClick: () => setPage((p) => p - 1),
          children: "«"
        }
      ),
      /* @__PURE__ */ jsxs("button", { className: "join-item btn btn-sm", children: [
        page,
        " / ",
        totalPages
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "join-item btn btn-sm",
          disabled: page >= totalPages,
          onClick: () => setPage((p) => p + 1),
          children: "»"
        }
      )
    ] }) }),
    editUser && /* @__PURE__ */ jsxs("div", { className: "modal modal-open", children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-4", children: "編輯會員" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "顯示名稱" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                value: editUser.display_name || "",
                onChange: (e) => setEditUser({ ...editUser, display_name: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "form-control", children: /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: editUser.is_active,
              onChange: (v) => setEditUser({ ...editUser, is_active: v }),
              label: "帳號啟用"
            }
          ) }),
          /* @__PURE__ */ jsx("div", { className: "form-control", children: /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: editUser.sex,
              onChange: (v) => setEditUser({ ...editUser, sex: v }),
              label: "私密相簿檢視權限"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-ghost",
              onClick: () => setEditUser(null),
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-primary",
              onClick: () => handleUpdateUser(editUser.user_id, {
                displayName: editUser.display_name,
                isActive: editUser.is_active,
                sex: editUser.sex
              }),
              children: "儲存"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "modal-backdrop",
          onClick: () => setEditUser(null)
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        isOpen: !!deleteUser,
        title: "確認刪除",
        message: `確定要刪除會員「${(deleteUser == null ? void 0 : deleteUser.display_name) || (deleteUser == null ? void 0 : deleteUser.email)}」嗎？此操作無法復原。`,
        onConfirm: () => deleteUser && handleDeleteUser(deleteUser.user_id),
        onCancel: () => setDeleteUser(null),
        confirmText: "刪除",
        danger: true
      }
    )
  ] });
};
const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editCourse, setEditCourse] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchCourses();
  }, []);
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/courses/admin/all");
      setCourses(res.data);
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      setError("載入課程失敗");
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!editCourse) return;
    try {
      setError("");
      const data = {
        courseTitle: editCourse.course_title,
        courseSlug: editCourse.course_slug,
        courseDescription: editCourse.course_description,
        courseContent: editCourse.course_content,
        courseThumbnailUrl: editCourse.course_thumbnail_url,
        courseVideoUrl: editCourse.course_video_url,
        price: parseFloat(String(editCourse.price)) || 0,
        status: editCourse.status
      };
      if (isNew) {
        await api.post("/api/courses", data);
      } else {
        await api.put(`/api/courses/${editCourse.course_id}`, data);
      }
      await fetchCourses();
      setEditCourse(null);
      setIsNew(false);
    } catch (err) {
      console.error("Failed to save course:", err);
      setError(isNew ? "新增課程失敗" : "更新課程失敗");
    }
  };
  const handleDelete = async () => {
    if (!deleteCourse) return;
    try {
      setError("");
      await api.delete(`/api/courses/${deleteCourse.course_id}`);
      await fetchCourses();
      setDeleteCourse(null);
    } catch (err) {
      console.error("Failed to delete course:", err);
      setError("刪除課程失敗");
    }
  };
  const handleNew = () => {
    setEditCourse({
      course_id: 0,
      course_title: "",
      course_slug: "",
      course_description: "",
      course_content: "",
      course_thumbnail_url: "",
      course_video_url: "",
      price: 0,
      status: "draft",
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    });
    setIsNew(true);
  };
  if (loading) {
    return /* @__PURE__ */ jsx(LoadingSpinner, { text: "載入課程中..." });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      PageHeader,
      {
        title: "課程管理",
        subtitle: `共 ${courses.length} 個課程`,
        actions: /* @__PURE__ */ jsxs("button", { className: "btn btn-primary btn-sm gap-2", onClick: handleNew, children: [
          /* @__PURE__ */ jsx(FaPlus, {}),
          " 新增課程"
        ] })
      }
    ),
    error && /* @__PURE__ */ jsx("div", { className: "alert alert-error mb-4", children: /* @__PURE__ */ jsx("span", { children: error }) }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", children: courses.map((course) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "card bg-base-100 shadow-md border border-base-300",
        children: [
          /* @__PURE__ */ jsx("figure", { className: "h-40 bg-base-200", children: course.course_thumbnail_url ? /* @__PURE__ */ jsx(
            "img",
            {
              src: course.course_thumbnail_url,
              alt: course.course_title,
              className: "w-full h-full object-cover"
            }
          ) : /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center w-full h-full text-base-content/30", children: "無圖片" }) }),
          /* @__PURE__ */ jsxs("div", { className: "card-body p-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
              /* @__PURE__ */ jsx("h3", { className: "card-title text-base line-clamp-1", children: course.course_title }),
              /* @__PURE__ */ jsx(
                StatusBadge,
                {
                  status: course.status,
                  text: STATUS_TEXT[course.status]
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-sm text-base-content/60 line-clamp-2", children: course.course_description || "無描述" }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mt-2", children: [
              /* @__PURE__ */ jsx("span", { className: "font-bold text-primary", children: formatCurrency(course.price) }),
              /* @__PURE__ */ jsxs("span", { className: "text-xs text-base-content/50", children: [
                course.total_enrolled || 0,
                " 人購買"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "card-actions justify-end mt-2", children: [
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "btn btn-ghost btn-xs",
                  onClick: () => {
                    setEditCourse(course);
                    setIsNew(false);
                  },
                  children: [
                    /* @__PURE__ */ jsx(FaEdit, {}),
                    " 編輯"
                  ]
                }
              ),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  className: "btn btn-ghost btn-xs text-error",
                  onClick: () => setDeleteCourse(course),
                  children: [
                    /* @__PURE__ */ jsx(FaTrash, {}),
                    " 刪除"
                  ]
                }
              )
            ] })
          ] })
        ]
      },
      course.course_id
    )) }),
    courses.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-center py-12 text-base-content/50", children: "尚無課程，點擊「新增課程」開始" }),
    editCourse && /* @__PURE__ */ jsxs("div", { className: "modal modal-open", children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box max-w-2xl", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-4", children: isNew ? "新增課程" : "編輯課程" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "課程名稱 *" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                value: editCourse.course_title,
                onChange: (e) => setEditCourse({
                  ...editCourse,
                  course_title: e.target.value
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "網址代稱 (slug)" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                placeholder: "例如: beginner-workout",
                value: editCourse.course_slug || "",
                onChange: (e) => setEditCourse({
                  ...editCourse,
                  course_slug: e.target.value
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "簡短描述 (SEO用，50字內)" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                maxLength: 50,
                value: editCourse.course_description || "",
                onChange: (e) => setEditCourse({
                  ...editCourse,
                  course_description: e.target.value
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "詳細內容" }) }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                className: "textarea textarea-bordered h-32",
                value: editCourse.course_content || "",
                onChange: (e) => setEditCourse({
                  ...editCourse,
                  course_content: e.target.value
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "縮圖網址" }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: "input input-bordered",
                  value: editCourse.course_thumbnail_url || "",
                  onChange: (e) => setEditCourse({
                    ...editCourse,
                    course_thumbnail_url: e.target.value
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "影片網址" }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  className: "input input-bordered",
                  value: editCourse.course_video_url || "",
                  onChange: (e) => setEditCourse({
                    ...editCourse,
                    course_video_url: e.target.value
                  })
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "價格 (TWD) *" }) }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "number",
                  className: "input input-bordered",
                  value: editCourse.price,
                  onChange: (e) => setEditCourse({
                    ...editCourse,
                    price: parseFloat(e.target.value) || 0
                  })
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
              /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "狀態" }) }),
              /* @__PURE__ */ jsxs(
                "select",
                {
                  className: "select select-bordered",
                  value: editCourse.status,
                  onChange: (e) => setEditCourse({
                    ...editCourse,
                    status: e.target.value
                  }),
                  children: [
                    /* @__PURE__ */ jsx("option", { value: "draft", children: "草稿" }),
                    /* @__PURE__ */ jsx("option", { value: "published", children: "已發布" }),
                    /* @__PURE__ */ jsx("option", { value: "archived", children: "已封存" })
                  ]
                }
              )
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-ghost",
              onClick: () => {
                setEditCourse(null);
                setIsNew(false);
              },
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsx("button", { className: "btn btn-primary", onClick: handleSave, children: isNew ? "建立" : "儲存" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "modal-backdrop",
          onClick: () => {
            setEditCourse(null);
            setIsNew(false);
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        isOpen: !!deleteCourse,
        title: "確認刪除",
        message: `確定要刪除課程「${deleteCourse == null ? void 0 : deleteCourse.course_title}」嗎？`,
        onConfirm: handleDelete,
        onCancel: () => setDeleteCourse(null),
        confirmText: "刪除",
        danger: true
      }
    )
  ] });
};
const AdminVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editVideo, setEditVideo] = useState(null);
  const [deleteVideo, setDeleteVideo] = useState(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    fetchVideos();
  }, []);
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/videos/admin/all");
      setVideos(res.data);
    } catch (err) {
      console.error("Failed to fetch videos:", err);
      setError("載入影片失敗");
    } finally {
      setLoading(false);
    }
  };
  const handleSave = async () => {
    if (!editVideo) return;
    try {
      setError("");
      const data = {
        title: editVideo.title,
        url: editVideo.url,
        type: editVideo.type,
        sortOrder: editVideo.sort_order,
        isVisible: editVideo.is_visible
      };
      if (isNew) {
        await api.post("/api/videos", data);
      } else {
        await api.put(`/api/videos/${editVideo.video_id}`, data);
      }
      await fetchVideos();
      setEditVideo(null);
      setIsNew(false);
    } catch (err) {
      console.error("Failed to save video:", err);
      setError(isNew ? "新增影片失敗" : "更新影片失敗");
    }
  };
  const handleDelete = async () => {
    if (!deleteVideo) return;
    try {
      setError("");
      await api.delete(`/api/videos/${deleteVideo.video_id}`);
      await fetchVideos();
      setDeleteVideo(null);
    } catch (err) {
      console.error("Failed to delete video:", err);
      setError("刪除影片失敗");
    }
  };
  const handleToggleVisible = async (video) => {
    try {
      setError("");
      await api.put(`/api/videos/${video.video_id}`, {
        isVisible: !video.is_visible
      });
      await fetchVideos();
    } catch (err) {
      console.error("Failed to toggle visibility:", err);
      setError("切換顯示狀態失敗");
    }
  };
  const handleNew = () => {
    setEditVideo({
      video_id: 0,
      title: "",
      url: "",
      type: "instagram",
      sort_order: videos.length,
      is_visible: true
    });
    setIsNew(true);
  };
  const getTypeIcon = (type) => {
    switch (type) {
      case "instagram":
        return /* @__PURE__ */ jsx(FaInstagram, { className: "text-pink-500" });
      case "youtube":
        return /* @__PURE__ */ jsx(FaYoutube, { className: "text-red-500" });
      default:
        return null;
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx(LoadingSpinner, { text: "載入影片中..." });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      PageHeader,
      {
        title: "影片管理",
        subtitle: `共 ${videos.length} 部影片`,
        actions: /* @__PURE__ */ jsxs("button", { className: "btn btn-primary btn-sm gap-2", onClick: handleNew, children: [
          /* @__PURE__ */ jsx(FaPlus, {}),
          " 新增影片"
        ] })
      }
    ),
    error && /* @__PURE__ */ jsx("div", { className: "alert alert-error mb-4", children: /* @__PURE__ */ jsx("span", { children: error }) }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md border border-base-300", children: /* @__PURE__ */ jsx("div", { className: "card-body p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "table table-zebra", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "w-12", children: "排序" }),
        /* @__PURE__ */ jsx("th", { children: "標題" }),
        /* @__PURE__ */ jsx("th", { children: "類型" }),
        /* @__PURE__ */ jsx("th", { children: "網址" }),
        /* @__PURE__ */ jsx("th", { children: "顯示" }),
        /* @__PURE__ */ jsx("th", { className: "w-24", children: "操作" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: videos.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
        "td",
        {
          colSpan: 6,
          className: "text-center py-8 text-base-content/50",
          children: "尚無影片"
        }
      ) }) : videos.map((video, index) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("span", { className: "text-base-content/50", children: index + 1 }) }),
        /* @__PURE__ */ jsx("td", { className: "font-medium", children: video.title }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
          getTypeIcon(video.type),
          video.type
        ] }) }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
          "a",
          {
            href: video.url,
            target: "_blank",
            rel: "noopener noreferrer",
            className: "link link-primary text-sm truncate block max-w-xs",
            children: video.url
          }
        ) }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
          Toggle,
          {
            checked: video.is_visible,
            onChange: () => handleToggleVisible(video)
          }
        ) }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-ghost btn-xs",
              onClick: () => {
                setEditVideo(video);
                setIsNew(false);
              },
              children: /* @__PURE__ */ jsx(FaEdit, {})
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-ghost btn-xs text-error",
              onClick: () => setDeleteVideo(video),
              children: /* @__PURE__ */ jsx(FaTrash, {})
            }
          )
        ] }) })
      ] }, video.video_id)) })
    ] }) }) }) }),
    editVideo && /* @__PURE__ */ jsxs("div", { className: "modal modal-open", children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-4", children: isNew ? "新增影片" : "編輯影片" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "標題 *" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                value: editVideo.title,
                onChange: (e) => setEditVideo({ ...editVideo, title: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "影片網址 *" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                placeholder: "https://www.instagram.com/reel/...",
                value: editVideo.url,
                onChange: (e) => setEditVideo({ ...editVideo, url: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "類型" }) }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                className: "select select-bordered",
                value: editVideo.type,
                onChange: (e) => setEditVideo({
                  ...editVideo,
                  type: e.target.value
                }),
                children: [
                  /* @__PURE__ */ jsx("option", { value: "instagram", children: "Instagram" }),
                  /* @__PURE__ */ jsx("option", { value: "youtube", children: "YouTube" }),
                  /* @__PURE__ */ jsx("option", { value: "tiktok", children: "TikTok" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "排序" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "input input-bordered",
                value: editVideo.sort_order,
                onChange: (e) => setEditVideo({
                  ...editVideo,
                  sort_order: parseInt(e.target.value) || 0
                })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "form-control", children: /* @__PURE__ */ jsx(
            Toggle,
            {
              checked: editVideo.is_visible,
              onChange: (v) => setEditVideo({ ...editVideo, is_visible: v }),
              label: "顯示在前台"
            }
          ) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-ghost",
              onClick: () => {
                setEditVideo(null);
                setIsNew(false);
              },
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsx("button", { className: "btn btn-primary", onClick: handleSave, children: isNew ? "建立" : "儲存" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "modal-backdrop",
          onClick: () => {
            setEditVideo(null);
            setIsNew(false);
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        isOpen: !!deleteVideo,
        title: "確認刪除",
        message: `確定要刪除影片「${deleteVideo == null ? void 0 : deleteVideo.title}」嗎？`,
        onConfirm: handleDelete,
        onCancel: () => setDeleteVideo(null),
        confirmText: "刪除",
        danger: true
      }
    )
  ] });
};
const AdminWhitelist = () => {
  const [whitelist, setWhitelist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [newItem, setNewItem] = useState({
    email: "",
    phoneNumber: "",
    note: ""
  });
  const [error, setError] = useState("");
  useEffect(() => {
    fetchWhitelist();
  }, []);
  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/api/admin/whitelist");
      setWhitelist(res.data);
    } catch (err) {
      console.error("Failed to fetch whitelist:", err);
      setError("載入白名單失敗");
    } finally {
      setLoading(false);
    }
  };
  const handleAdd = async () => {
    var _a, _b;
    try {
      setError("");
      if (!newItem.email && !newItem.phoneNumber) {
        setError("請填寫 Email 或手機號碼");
        return;
      }
      await api.post("/api/admin/whitelist", {
        email: newItem.email || null,
        phoneNumber: newItem.phoneNumber || null,
        note: newItem.note
      });
      await fetchWhitelist();
      setShowAdd(false);
      setNewItem({ email: "", phoneNumber: "", note: "" });
    } catch (err) {
      console.error("Failed to add whitelist item:", err);
      setError(((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "新增失敗");
    }
  };
  const handleToggle = async (item) => {
    try {
      setError("");
      const data = {
        isActive: !item.is_active
      };
      await api.put(`/api/admin/whitelist/${item.whitelist_id}`, data);
      await fetchWhitelist();
    } catch (err) {
      console.error("Failed to toggle:", err);
      setError("切換狀態失敗");
    }
  };
  const handleDelete = async () => {
    var _a, _b;
    if (!deleteItem) return;
    try {
      setError("");
      await api.delete(`/api/admin/whitelist/${deleteItem.whitelist_id}`);
      await fetchWhitelist();
      setDeleteItem(null);
    } catch (err) {
      console.error("Failed to delete whitelist item:", err);
      const errorMsg = ((_b = (_a = err.response) == null ? void 0 : _a.data) == null ? void 0 : _b.error) || "刪除失敗";
      alert(errorMsg);
      setDeleteItem(null);
    }
  };
  if (loading) {
    return /* @__PURE__ */ jsx(LoadingSpinner, { text: "載入白名單中..." });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(
      PageHeader,
      {
        title: "管理員白名單",
        subtitle: "只有在白名單中的 Email 或手機才能登入管理後台",
        actions: /* @__PURE__ */ jsxs(
          "button",
          {
            className: "btn btn-primary btn-sm gap-2",
            onClick: () => setShowAdd(true),
            children: [
              /* @__PURE__ */ jsx(FaPlus, {}),
              " 新增管理員"
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "alert alert-info mb-4", children: [
      /* @__PURE__ */ jsx(FaShieldAlt, {}),
      /* @__PURE__ */ jsx("span", { children: "白名單中的 Email/手機，在註冊或登入後會自動獲得管理員權限。" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "alert alert-error mb-4", children: /* @__PURE__ */ jsx("span", { children: error }) }),
    /* @__PURE__ */ jsx("div", { className: "card bg-base-100 shadow-md border border-base-300", children: /* @__PURE__ */ jsx("div", { className: "card-body p-0", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "table", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "Email" }),
        /* @__PURE__ */ jsx("th", { children: "手機號碼" }),
        /* @__PURE__ */ jsx("th", { children: "備註" }),
        /* @__PURE__ */ jsx("th", { children: "狀態" }),
        /* @__PURE__ */ jsx("th", { children: "建立時間" }),
        /* @__PURE__ */ jsx("th", { className: "w-20", children: "操作" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: whitelist.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx(
        "td",
        {
          colSpan: 6,
          className: "text-center py-8 text-base-content/50",
          children: "白名單為空"
        }
      ) }) : whitelist.map((item) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { className: "font-medium", children: item.email || "-" }),
        /* @__PURE__ */ jsx("td", { children: item.phone_number || "-" }),
        /* @__PURE__ */ jsx("td", { className: "text-sm text-base-content/60", children: item.note || "-" }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
          Toggle,
          {
            checked: item.is_active,
            onChange: () => handleToggle(item),
            label: item.is_active ? "啟用" : "停用"
          }
        ) }),
        /* @__PURE__ */ jsx("td", { className: "text-sm", children: formatDate(item.created_at) }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx(
          "button",
          {
            className: "btn btn-ghost btn-xs text-error",
            onClick: () => setDeleteItem(item),
            children: /* @__PURE__ */ jsx(FaTrash, {})
          }
        ) })
      ] }, item.whitelist_id)) })
    ] }) }) }) }),
    showAdd && /* @__PURE__ */ jsxs("div", { className: "modal modal-open", children: [
      /* @__PURE__ */ jsxs("div", { className: "modal-box", children: [
        /* @__PURE__ */ jsx("h3", { className: "font-bold text-lg mb-4", children: "新增管理員" }),
        error && /* @__PURE__ */ jsx("div", { className: "alert alert-error mb-4", children: /* @__PURE__ */ jsx("span", { children: error }) }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "Email" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                className: "input input-bordered",
                placeholder: "admin@example.com",
                value: newItem.email,
                onChange: (e) => setNewItem({ ...newItem, email: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "divider", children: "或" }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "手機號碼" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                placeholder: "0912345678",
                value: newItem.phoneNumber,
                onChange: (e) => setNewItem({ ...newItem, phoneNumber: e.target.value })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "form-control", children: [
            /* @__PURE__ */ jsx("label", { className: "label", children: /* @__PURE__ */ jsx("span", { className: "label-text", children: "備註 (選填)" }) }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                className: "input input-bordered",
                placeholder: "例如：主要管理員",
                value: newItem.note,
                onChange: (e) => setNewItem({ ...newItem, note: e.target.value })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "modal-action", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              className: "btn btn-ghost",
              onClick: () => {
                setShowAdd(false);
                setError("");
              },
              children: "取消"
            }
          ),
          /* @__PURE__ */ jsx("button", { className: "btn btn-primary", onClick: handleAdd, children: "新增" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "modal-backdrop",
          onClick: () => {
            setShowAdd(false);
            setError("");
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsx(
      ConfirmDialog,
      {
        isOpen: !!deleteItem,
        title: "確認刪除",
        message: `確定要從白名單移除「${(deleteItem == null ? void 0 : deleteItem.email) || (deleteItem == null ? void 0 : deleteItem.phone_number)}」嗎？`,
        onConfirm: handleDelete,
        onCancel: () => setDeleteItem(null),
        confirmText: "刪除",
        danger: true
      }
    )
  ] });
};
function App() {
  return /* @__PURE__ */ jsx(AuthProvider, { children: /* @__PURE__ */ jsxs(Routes, { children: [
    /* @__PURE__ */ jsxs(Route, { path: "/", element: /* @__PURE__ */ jsx(Layout, {}), children: [
      /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(Home, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "courses", element: /* @__PURE__ */ jsx(Courses, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "videos", element: /* @__PURE__ */ jsx(Videos, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "photos", element: /* @__PURE__ */ jsx(CoachPhotos, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "contact", element: /* @__PURE__ */ jsx(Contact, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "login", element: /* @__PURE__ */ jsx(Login, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "register", element: /* @__PURE__ */ jsx(Register, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "member", element: /* @__PURE__ */ jsx(MemberCenter, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "dashboard", element: /* @__PURE__ */ jsx(Dashboard, {}) })
    ] }),
    /* @__PURE__ */ jsxs(Route, { path: "/admin", element: /* @__PURE__ */ jsx(AdminLayout, {}), children: [
      /* @__PURE__ */ jsx(Route, { index: true, element: /* @__PURE__ */ jsx(AdminDashboard, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "users", element: /* @__PURE__ */ jsx(AdminUsers, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "courses", element: /* @__PURE__ */ jsx(AdminCourses, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "videos", element: /* @__PURE__ */ jsx(AdminVideos, {}) }),
      /* @__PURE__ */ jsx(Route, { path: "whitelist", element: /* @__PURE__ */ jsx(AdminWhitelist, {}) })
    ] })
  ] }) });
}
function render(url) {
  const pathname = url.split("?")[0].split("#")[0];
  const html = renderToString(
    /* @__PURE__ */ jsx(StrictMode, { children: /* @__PURE__ */ jsx(StaticRouter, { location: pathname, future: { v7_relativeSplatPath: true }, children: /* @__PURE__ */ jsx(App, {}) }) })
  );
  return { html };
}
export {
  render
};
