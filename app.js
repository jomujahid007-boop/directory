"use strict";
/* الإعدادات تُقرأ من config.js (ضع رابط Apps Script هناك) */
const CONFIG = Object.assign({ API_URL: "", PAGE_SIZE: 24 }, window.APP_CONFIG || {});

/* ===== النصوص ===== */
const T = {
  ar: {
    appName: "دليل الخدمات", heroTitle: "ابحث عن أي خدمة، وتواصل مع مقدمها مباشرة",
    searchPh: "اسم الخدمة أو مقدمها أو المتجر", search: "بحث", results: "نتائج البحث", clear: "إزالة الفلاتر",
    categories: "التصنيفات", featured: "الخدمات المميزة", latest: "أحدث الخدمات", mostViewed: "الأكثر مشاهدة",
    topRated: "الأعلى تقييماً", offers: "العروض والخصومات", nearby: "قريبة منك",
    howTitle: "كيف تعمل المنصة؟", how1: "أنشئ حساب مقدم خدمة.", how2: "أضف إعلانك وادفع رسم النشر.",
    how3: "أرسل إثبات الدفع لتراجعه الإدارة.", how4: "بعد الموافقة يظهر إعلانك في التصنيف المناسب.",
    contact: "تواصل معنا", privacy: "سياسة الخصوصية", terms: "شروط الاستخدام",
    allCities: "كل المدن", minPrice: "أقل سعر", maxPrice: "أعلى سعر", anyRating: "أي تقييم", stars: "نجوم فأكثر",
    near: "الأقرب إليّ", back: "رجوع", call: "اتصال", whatsapp: "واتساب", share: "مشاركة", fav: "أضف للمفضلة",
    desc: "الوصف", reviews: "التقييمات", noReviews: "لا توجد تقييمات بعد.", more: "خدمات أخرى لنفس المقدم", similar: "إعلانات مشابهة",
    empty: "لا توجد إعلانات هنا بعد.", noResults: "لم نجد نتائج. جرّب كلمات أخرى أو أزل الفلاتر.",
    apiMissing: "لم يتم ربط الخادم بعد. ضع رابط Apps Script في ملف config.js.",
    loadFail: "تعذر تحميل البيانات. تحقق من الاتصال وحاول مرة أخرى.", copied: "تم نسخ رابط الإعلان",
    geoDenied: "لم نحصل على موقعك. اختر مدينتك من القائمة.", currency: "ريال", loginNeeded: "سجّل الدخول لإضافة المفضلة (يتوفر في المرحلة التالية).",
    sort: { newest: "الأحدث", rating: "الأعلى تقييماً", views: "الأكثر مشاهدة", priceAsc: "الأقل سعراً", priceDesc: "الأعلى سعراً", featured: "الإعلانات المميزة", near: "الأقرب إليّ" },
    account: "حسابي", lang: "English", themeL: "☾", themeD: "☀"
  },
  en: {
    appName: "Services Directory", heroTitle: "Find any service and contact the provider directly",
    searchPh: "Service, provider or store name", search: "Search", results: "Search results", clear: "Clear filters",
    categories: "Categories", featured: "Featured services", latest: "Latest services", mostViewed: "Most viewed",
    topRated: "Top rated", offers: "Offers and discounts", nearby: "Near you",
    howTitle: "How it works", how1: "Create a provider account.", how2: "Add your ad and pay the listing fee.",
    how3: "Send proof of payment for admin review.", how4: "Once approved, your ad appears in its category.",
    contact: "Contact us", privacy: "Privacy policy", terms: "Terms of use",
    allCities: "All cities", minPrice: "Min price", maxPrice: "Max price", anyRating: "Any rating", stars: "stars and up",
    near: "Closest to me", back: "Back", call: "Call", whatsapp: "WhatsApp", share: "Share", fav: "Add to favorites",
    desc: "Description", reviews: "Reviews", noReviews: "No reviews yet.", more: "More from this provider", similar: "Similar ads",
    empty: "No ads here yet.", noResults: "No results. Try other words or clear the filters.",
    apiMissing: "The server is not connected yet. Set your Apps Script URL in config.js.",
    loadFail: "Could not load data. Check your connection and try again.", copied: "Ad link copied",
    geoDenied: "We could not get your location. Pick your city from the list.", currency: "SAR", loginNeeded: "Sign in to save favorites (available in the next phase).",
    sort: { newest: "Newest", rating: "Top rated", views: "Most viewed", priceAsc: "Lowest price", priceDesc: "Highest price", featured: "Featured first", near: "Closest to me" },
    account: "Account", lang: "العربية", themeL: "☾", themeD: "☀"
  }
};

const S = { lang: "ar", theme: "light", cats: [], cities: [], settings: {}, pos: null };
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const t = k => T[S.lang][k];

function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") n.className = v;
    else if (k === "text") n.textContent = v;
    else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else n.setAttribute(k, v);
  }
  kids.flat().forEach(c => c != null && n.append(c));
  return n;
}
const safeUrl = u => (typeof u === "string" && /^https:\/\//i.test(u)) ? u : "";
const phoneClean = p => String(p || "").replace(/[^\d+]/g, "");
const toast = m => { const x = $("#toast"); x.textContent = m; x.classList.add("on"); setTimeout(() => x.classList.remove("on"), 3200); };

/* ===== الاتصال بالخادم ===== */
async function api(action, params = {}) {
  if (!CONFIG.API_URL) throw new Error("API_MISSING");
  const res = await fetch(CONFIG.API_URL, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action, params }) });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const j = await res.json();
  if (!j.ok) throw new Error(j.error || "API");
  return j.data;
}
const cache = new Map();
async function cached(action, params, ttl = 60000) {
  const key = action + JSON.stringify(params), hit = cache.get(key);
  if (hit && Date.now() - hit.t < ttl) return hit.d;
  const d = await api(action, params); cache.set(key, { t: Date.now(), d }); return d;
}
function fail(e) { toast(e.message === "API_MISSING" ? t("apiMissing") : t("loadFail")); console.error(e); }

/* ===== اللغة والمظهر ===== */
function applyLang() {
  document.documentElement.lang = S.lang;
  document.documentElement.dir = S.lang === "ar" ? "rtl" : "ltr";
  $$("[data-t]").forEach(n => n.textContent = t(n.dataset.t));
  $$("[data-p]").forEach(n => n.placeholder = t(n.dataset.p));
  $("#langBtn").textContent = t("lang");
  $("#themeBtn").textContent = S.theme === "dark" ? t("themeD") : t("themeL");
  fillSelects(); renderCats(); fillContact();
  $("#year").textContent = "© " + new Date().getFullYear() + " " + (S.settings.appName || t("appName"));
  document.title = S.settings.appName || t("appName");
  route();
}
function applyTheme() { document.documentElement.dataset.theme = S.theme; $("#themeBtn").textContent = S.theme === "dark" ? t("themeD") : t("themeL"); }
function loadPrefs() {
  try {
    S.lang = localStorage.getItem("lang") || ((navigator.language || "ar").startsWith("en") ? "en" : "ar");
    S.theme = localStorage.getItem("theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  } catch (e) { S.lang = "ar"; }
}
function savePref(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

function fillSelects() {
  const city = $("#city"), cur = city.value;
  city.replaceChildren(el("option", { value: "", text: t("allCities") }), ...S.cities.map(c => el("option", { value: c.id || c.name, text: c.name })));
  city.value = cur;
  const sort = $("#sort"), sc = sort.value || "newest";
  sort.replaceChildren(...Object.entries(t("sort")).map(([k, v]) => el("option", { value: k, text: v }))); sort.value = sc;
  const r = $("#minR"), rc = r.value || "0";
  r.replaceChildren(el("option", { value: "0", text: t("anyRating") }), ...[4, 3, 2].map(n => el("option", { value: n, text: n + " " + t("stars") }))); r.value = rc;
}
function fillContact() {
  const c = S.settings, box = $("#contactInfo"); box.replaceChildren();
  [c.contactPhone, c.contactEmail].filter(Boolean).forEach(x => box.append(el("div", { text: x })));
  [c.facebook, c.instagram, c.x, c.tiktok].map(safeUrl).filter(Boolean).forEach(u => box.append(el("a", { href: u, target: "_blank", rel: "noopener", text: new URL(u).hostname.replace("www.", "") }), " "));
}

/* ===== البطاقات ===== */
function money(v) { return v || v === 0 ? Number(v).toLocaleString(S.lang === "ar" ? "ar-SA" : "en-US") + " " + t("currency") : ""; }
function card(x) {
  const img = safeUrl((x.images || [])[0]);
  const c = el("article", { class: "card", tabindex: "0", role: "link", onclick: () => open(x.id), onkeydown: e => { if (e.key === "Enter") open(x.id); } },
    el("div", { class: "img", style: img ? `background-image:url("${img}")` : "" }),
    el("div", { class: "body" },
      x.featured ? el("span", { class: "badge", text: "★" }) : null,
      el("h3", { text: x.title }),
      el("div", { class: "price", text: money(x.price) }),
      el("div", { class: "meta", text: [x.city, x.area].filter(Boolean).join(" - ") }),
      el("div", { class: "meta", text: (x.rating ? "★ " + Number(x.rating).toFixed(1) + "  " : "") + (x.distanceKm != null ? x.distanceKm.toFixed(1) + " km" : "") })));
  return c;
}
function fillGrid(grid, items, emptyKey = "empty") {
  grid.replaceChildren(...(items.length ? items.map(card) : [el("div", { class: "empty", text: t(emptyKey) })]));
}
function renderCats() {
  const box = $("#cats");
  box.replaceChildren(...S.cats.filter(c => !c.parent_id && c.active !== false).map(c => {
    const name = S.lang === "ar" ? c.name_ar : (c.name_en || c.name_ar), im = safeUrl(c.image);
    return el("button", { class: "cat", type: "button", onclick: () => { $("#q").value = ""; runSearch({ category: c.id }); } },
      im ? el("img", { src: im, alt: "", loading: "lazy" }) : el("span", { class: "ico", text: c.icon || "•" }), el("span", { text: name }));
  }));
  if (!S.cats.length) box.append(el("div", { class: "empty", text: t("empty") }));
}

/* ===== الرئيسية ===== */
const BLOCKS = { featured: { sort: "featured" }, latest: { sort: "newest" }, views: { sort: "views" }, rating: { sort: "rating" }, offers: { offersOnly: true, sort: "newest" } };
async function loadHome() {
  try {
    const init = await cached("getInit", {}, 300000);
    S.cats = init.categories || []; S.cities = init.cities || []; S.settings = init.settings || {};
  } catch (e) { fail(e); }
  applyLang();
  for (const [k, p] of Object.entries(BLOCKS)) {
    const g = $(`[data-block="${k}"] .grid`);
    try { fillGrid(g, (await cached("search", { ...p, limit: 8 })).items || []); } catch (e) { fillGrid(g, []); }
  }
  $('[data-block="nearby"]').hidden = true;
  if (navigator.geolocation) navigator.geolocation.getCurrentPosition(async p => {
    S.pos = { lat: p.coords.latitude, lng: p.coords.longitude };
    try { const r = (await api("search", { sort: "near", near: S.pos, limit: 8 })).items || []; if (r.length) { $('[data-block="nearby"]').hidden = false; fillGrid($('[data-block="nearby"] .grid'), r); } } catch (e) {}
  }, () => {}, { timeout: 8000, maximumAge: 600000 });
}

/* ===== البحث ===== */
let last = {};
async function runSearch(extra = {}) {
  last = { ...extra };
  const p = { text: $("#q").value.trim(), city: $("#city").value, sort: $("#sort").value, minPrice: $("#minP").value, maxPrice: $("#maxP").value, minRating: $("#minR").value, ...extra, limit: CONFIG.PAGE_SIZE };
  if (p.sort === "near" && S.pos) p.near = S.pos;
  $("#homeBlocks").hidden = true; $("#detail").hidden = true; $("#results").hidden = false;
  try { fillGrid($("#resList"), (await api("search", p)).items || [], "noResults"); } catch (e) { fail(e); fillGrid($("#resList"), [], "noResults"); }
  $("#results").scrollIntoView({ behavior: "smooth" });
}
function clearFilters() { ["#q", "#minP", "#maxP"].forEach(s => $(s).value = ""); $("#city").value = ""; $("#minR").value = "0"; $("#sort").value = "newest"; last = {}; location.hash = ""; route(); }

/* ===== تفاصيل الإعلان ===== */
const open = id => { location.hash = "listing=" + encodeURIComponent(id); };
async function showDetail(id) {
  $("#homeBlocks").hidden = true; $("#results").hidden = true;
  const box = $("#detail"); box.hidden = false; box.replaceChildren(el("button", { class: "back", text: "‹ " + t("back"), onclick: () => { history.length > 1 ? history.back() : (location.hash = ""); } }));
  let d;
  try { d = await api("getListing", { id }); } catch (e) { fail(e); return; }
  const L = d.listing, P = d.provider || {}, tel = phoneClean(L.phone || P.phone), wa = phoneClean(P.whatsapp || L.phone);
  document.title = L.title;
  const gallery = el("div", { class: "gallery" }, ...(L.images || []).map(safeUrl).filter(Boolean).map(u => el("img", { src: u, alt: L.title, loading: "lazy" })));
  const hasMap = L.lat && L.lng;
  const d0 = 0.01, bbox = hasMap ? [L.lng - d0, L.lat - d0, +L.lng + d0, +L.lat + d0].join(",") : "";
  box.append(gallery,
    el("h2", { text: L.title }), el("div", { class: "price", text: money(L.price) }),
    el("div", { class: "meta", text: [P.business_name, L.city, L.area].filter(Boolean).join(" - ") }),
    el("div", { class: "actions" },
      tel ? el("a", { class: "btn call", href: "tel:" + tel, text: t("call") }) : null,
      wa ? el("a", { class: "btn wa", href: "https://wa.me/" + wa.replace("+", ""), target: "_blank", rel: "noopener", text: t("whatsapp") }) : null,
      el("button", { class: "btn", type: "button", text: t("share"), onclick: share.bind(null, L) }),
      el("button", { class: "btn", type: "button", text: t("fav"), onclick: () => toast(t("loginNeeded")) })),
    el("div", { class: "box" }, el("h3", { text: t("desc") }), el("p", { text: L.description || "" })),
    hasMap ? el("iframe", { class: "map", loading: "lazy", title: "map", src: `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${L.lat},${L.lng}` }) : null,
    el("div", { class: "box" }, el("h3", { text: t("reviews") }),
      ...((d.reviews || []).length ? d.reviews.map(r => el("p", { text: "★ " + r.avg + " — " + r.comment })) : [el("p", { class: "meta", text: t("noReviews") })])));
  for (const [key, list] of [["more", d.moreFromProvider], ["similar", d.similar]]) {
    if (list && list.length) { const g = el("div", { class: "grid" }); fillGrid(g, list); box.append(el("h3", { text: t(key) }), g); }
  }
  api("trackView", { id }).catch(() => {});
}
async function share(L) {
  const url = location.origin + location.pathname + "#listing=" + encodeURIComponent(L.id);
  try { if (navigator.share) { await navigator.share({ title: L.title, url }); return; } await navigator.clipboard.writeText(url); toast(t("copied")); } catch (e) {}
}

/* ===== التوجيه ===== */
function route() {
  const m = location.hash.match(/^#listing=(.+)$/);
  if (m) return showDetail(decodeURIComponent(m[1]));
  document.title = S.settings.appName || t("appName");
  $("#detail").hidden = true;
  if (Object.keys(last).length || $("#q").value) { $("#results").hidden = false; $("#homeBlocks").hidden = true; }
  else { $("#results").hidden = true; $("#homeBlocks").hidden = false; }
}

/* ===== التشغيل ===== */
document.addEventListener("DOMContentLoaded", () => {
  loadPrefs(); applyTheme();
  $("#langBtn").onclick = () => { S.lang = S.lang === "ar" ? "en" : "ar"; savePref("lang", S.lang); applyLang(); };
  $("#themeBtn").onclick = () => { S.theme = S.theme === "dark" ? "light" : "dark"; savePref("theme", S.theme); applyTheme(); };
  $("#searchForm").onsubmit = e => { e.preventDefault(); runSearch(); };
  $("#clearBtn").onclick = clearFilters;
  $("#nearBtn").onclick = () => {
    if (!navigator.geolocation) return toast(t("geoDenied"));
    navigator.geolocation.getCurrentPosition(p => { S.pos = { lat: p.coords.latitude, lng: p.coords.longitude }; $("#sort").value = "near"; runSearch(); }, () => toast(t("geoDenied")), { timeout: 8000 });
  };
  ["#sort", "#minR", "#minP", "#maxP"].forEach(s => $(s).addEventListener("change", () => runSearch(last)));
  $("[data-home]").onclick = e => { e.preventDefault(); clearFilters(); };
  window.addEventListener("hashchange", route);
  applyLang(); loadHome().then(route);
});
