"use strict";
const CFG = window.APP_CONFIG || { API_URL: "" };
const D = {
  ar: { appName: "دليل الخدمات", login: "تسجيل الدخول", register: "إنشاء حساب", email: "البريد الإلكتروني", password: "كلمة المرور", accType: "نوع الحساب",
    customer: "عميل", provider: "مقدم خدمة", name: "الاسم", business: "اسم النشاط التجاري", phone: "رقم الهاتف", pwHint: "8 أحرف على الأقل، وتحتوي حروفاً وأرقاماً.",
    logout: "تسجيل الخروج", myData: "بياناتي", myBusiness: "بيانات النشاط", save: "حفظ التغييرات", desc: "وصف النشاط", whatsapp: "رقم واتساب", city: "المدينة", area: "المنطقة",
    hours: "أوقات العمل", lat: "خط العرض", lng: "خط الطول", useLocation: "استخدم موقعي الحالي", changePw: "تغيير كلمة المرور", oldPw: "كلمة المرور الحالية", newPw: "كلمة المرور الجديدة",
    hello: "مرحباً، ", saved: "تم الحفظ", pwChanged: "تم تغيير كلمة المرور", noApi: "لم يتم ربط الخادم. ضع رابط Apps Script في config.js.", netFail: "تعذر الاتصال بالخادم. حاول مرة أخرى.",
    needFields: "أكمل الحقول المطلوبة.", chooseCity: "اختر المدينة", lang: "English", geoFail: "تعذر تحديد موقعك. أدخل الإحداثيات يدوياً.", tl: "☾", td: "☀" },
  en: { appName: "Services Directory", login: "Sign in", register: "Create account", email: "Email", password: "Password", accType: "Account type",
    customer: "Customer", provider: "Service provider", name: "Name", business: "Business name", phone: "Phone number", pwHint: "At least 8 characters, with letters and numbers.",
    logout: "Sign out", myData: "My details", myBusiness: "Business details", save: "Save changes", desc: "Business description", whatsapp: "WhatsApp number", city: "City", area: "Area",
    hours: "Working hours", lat: "Latitude", lng: "Longitude", useLocation: "Use my current location", changePw: "Change password", oldPw: "Current password", newPw: "New password",
    hello: "Hello, ", saved: "Saved", pwChanged: "Password changed", noApi: "The server is not connected. Set your Apps Script URL in config.js.", netFail: "Could not reach the server. Try again.",
    needFields: "Fill in the required fields.", chooseCity: "Choose a city", lang: "العربية", geoFail: "Could not get your location. Enter coordinates manually.", tl: "☾", td: "☀" }
};
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
let lang = "ar", theme = "light", cities = [], cur = null;
const t = k => D[lang][k];
const pref = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) {} };
const toast = m => { const x = $("#toast"); x.textContent = m; x.classList.add("on"); setTimeout(() => x.classList.remove("on"), 3200); };

async function api(action, params = {}) {
  if (!CFG.API_URL) throw new Error(t("noApi"));
  let res;
  try { res = await fetch(CFG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, params }) }); }
  catch (e) { throw new Error(t("netFail")); }
  let j; try { j = await res.json(); } catch (e) { throw new Error(t("netFail")); }
  if (!j.ok) { const er = new Error(j.error || t("netFail")); er.code = j.code; throw er; }
  return j.data;
}
const token = () => pref("token") || "";

function applyLang() {
  document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  $$("[data-t]").forEach(n => n.textContent = t(n.dataset.t));
  $("#langBtn").textContent = t("lang"); $("#themeBtn").textContent = theme === "dark" ? t("td") : t("tl");
  document.title = t("appName") + " - " + t("login");
  fillCities(); if (cur) $("#hello").textContent = t("hello") + cur.user.name;
}
function fillCities(sel) {
  const s = $("#provForm [name=city]"), v = sel !== undefined ? sel : s.value;
  s.replaceChildren(new Option(t("chooseCity"), ""), ...cities.map(c => new Option(c, c))); s.value = v || "";
}

function view() {
  $("#guest").hidden = !!cur; $("#member").hidden = !cur;
  if (!cur) return;
  $("#hello").textContent = t("hello") + cur.user.name;
  const me = $("#meForm"); me.name.value = cur.user.name; me.phone.value = cur.user.phone || "";
  const isP = cur.user.role === "provider" && cur.provider; $("#provForm").hidden = !isP;
  if (isP) {
    const f = $("#provForm"), p = cur.provider;
    ["business_name", "description", "whatsapp", "area", "hours", "lat", "lng"].forEach(k => f[k].value = p[k] || "");
    fillCities(p.city); ["facebook", "instagram", "x", "tiktok"].forEach(k => f[k].value = (p.socials || {})[k] || "");
  }
}

async function submit(form, fn) {
  const err = $("[data-err]", form), btn = $(".go", form);
  err.textContent = ""; btn.disabled = true;
  try { await fn(Object.fromEntries(new FormData(form))); }
  catch (e) { err.textContent = e.message; if (e.code === "AUTH") { pref("token", ""); cur = null; view(); } }
  finally { btn.disabled = false; }
}
function setSession(d) { pref("token", d.token); cur = { user: d.user, provider: d.provider }; view(); }

document.addEventListener("DOMContentLoaded", async () => {
  lang = pref("lang") || "ar"; theme = pref("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.dataset.theme = theme;
  $("#langBtn").onclick = () => { lang = lang === "ar" ? "en" : "ar"; pref("lang", lang); applyLang(); };
  $("#themeBtn").onclick = () => { theme = theme === "dark" ? "light" : "dark"; pref("theme", theme); document.documentElement.dataset.theme = theme; applyLang(); };
  const tl = $("#tabLogin"), tr = $("#tabReg");
  const tab = reg => { $("#loginForm").hidden = reg; $("#regForm").hidden = !reg; tl.setAttribute("aria-selected", !reg); tr.setAttribute("aria-selected", reg); };
  tl.onclick = () => tab(false); tr.onclick = () => tab(true);
  const rf = $("#regForm");
  rf.role.onchange = () => { $("[data-only=provider]", rf).hidden = rf.role.value !== "provider"; };

  $("#loginForm").onsubmit = e => { e.preventDefault(); submit(e.target, async v => setSession(await api("login", v))); };
  rf.onsubmit = e => { e.preventDefault(); submit(rf, async v => {
    if (!v.name || !v.email || !v.password || (v.role === "provider" && (!v.business_name || !v.phone))) throw new Error(t("needFields"));
    setSession(await api("register", v)); }); };
  $("#meForm").onsubmit = e => { e.preventDefault(); submit(e.target, async v => { setSession({ ...(await api("updateMe", { ...v, token: token() })), token: token() }); toast(t("saved")); }); };
  $("#provForm").onsubmit = e => { e.preventDefault(); submit(e.target, async v => {
    const socials = { facebook: v.facebook, instagram: v.instagram, x: v.x, tiktok: v.tiktok };
    setSession({ ...(await api("updateProvider", { ...v, socials, token: token() })), token: token() }); toast(t("saved")); }); };
  $("#pwForm").onsubmit = e => { e.preventDefault(); submit(e.target, async v => { setSession(await api("changePassword", { ...v, token: token() })); e.target.reset(); toast(t("pwChanged")); }); };
  $("#logoutBtn").onclick = async () => { try { await api("logout", { token: token() }); } catch (e) {} pref("token", ""); cur = null; view(); };
  $("#locBtn").onclick = () => {
    if (!navigator.geolocation) return toast(t("geoFail"));
    navigator.geolocation.getCurrentPosition(p => { const f = $("#provForm"); f.lat.value = p.coords.latitude.toFixed(6); f.lng.value = p.coords.longitude.toFixed(6); }, () => toast(t("geoFail")), { timeout: 8000 });
  };

  applyLang(); $("#guest").hidden = false;
  try { cities = ((await api("getInit")).cities || []).map(c => c.name); fillCities(); } catch (e) { toast(e.message); }
  if (token()) { try { cur = await api("me", { token: token() }); } catch (e) { pref("token", ""); } }
  view();
});
