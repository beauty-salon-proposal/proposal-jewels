/* Kalai's Jewellery — provisional personalization patch.
 * Applies branding + verified contact details to the storefront AFTER the
 * framework renders, so the underlying Next.js app stays 100% original
 * (never blank). Loaded on every page via <script data-kalai-patch>.
 *
 * Change the brand/contact once here (or re-run gen) and every page updates.
 */
(function () {
  "use strict";

  var CFG = {
    name: "Kalai's Jewellery",
    nameUpper: "KALAI'S JEWELLERY",
    short: "Kalai's",
    phoneDisplay: "+91 98420 23382",
    phoneTel: "tel:+919842023382",
    wa: "https://wa.me/919842023382",
    instagram: "https://www.instagram.com/kalai_makeupartistry/",
    igHandle: "@kalai_makeupartistry",
    oldPhoneDisplay: "+91 75054 59485",
    oldPhoneDisplay2: "+91 7505459485",
    location: "Vadavalli, Coimbatore",
    locationFull: "Vadavalli, Coimbatore, Tamil Nadu, India",
    metro: "Vadavalli, Coimbatore",
    region: "Tamil Nadu"
  };

  function isVisible(el) {
    var n = el;
    while (n) {
      var tag = n.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT" || tag === "TEMPLATE") {
        return false;
      }
      n = n.parentElement;
    }
    return true;
  }

  var PRE = /Gridaan|GRIDAAN|75054|59485|Udyam|UDYAM|Malpura|Khurja|Uttar Pradesh|203131|Vadavalli|logo-header|logo-search/i;

  function patchLogo() {
    // header brand mark + any site logo image -> client logo.png (sole logo)
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      var s = (im.getAttribute("src") || "");
      var alt = (im.getAttribute("alt") || "");
      if (/(logo-header|logo-search|logo(\.|-)|\/logo)/i.test(s) ||
          /^Gridaan$/i.test(alt) || /Kalai/i.test(alt)) {
        if (!/logo\.png/i.test(s)) {
          im.setAttribute("src", LOGO);
          im.removeAttribute("srcset");
          im.style.objectFit = "contain";
        }
      }
    }
  }
  var LOGO = "logo.png";

  function replaceBrandText(root) {
    var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, null);
    var changed = 0;
    var node;
    while ((node = walker.nextNode())) {
      var t = node.nodeValue;
      if (!t || !PRE.test(t)) continue;
      if (!isVisible(node.parentElement)) continue;
      var orig = t;
      // brand-specific phrases first
      t = t.replace(/Gridaan Jewellery Edit/g, CFG.name + " Edit");
      t = t.replace(/Gridaan edit/g, CFG.name + " edit");
      t = t.replace(/GRIDAAN/g, CFG.nameUpper);
      t = t.replace(/Gridaan/g, CFG.name);
      // phone (React may split into fragments: "+91 ", "75054", " ", "59485")
      t = t.replace(/75054/g, "98420").replace(/59485/g, "23382");
      // address phrases (verified location only; no street invented)
      t = t.replace(/Door 27, Malpura, Subhash Road\s*,?\s*/g, CFG.location + ", ");
      t = t.replace(/Khurja, District Bulandshahar/g, CFG.metro);
      t = t.replace(/Uttar Pradesh\s*[-\u2013]\s*203131/g, CFG.region);
      // Udyam number is Gridaan's registration -> repurpose line as location
      t = t.replace(/UDYAM-UP-18-0093491/g, "");
      t = t.replace(/Udyam Registration Number:\s*/gi, "Location: ");
      t = t.replace(/Location:\s*Location:/g, "Location:");
      t = t.replace(/\s*Location:\s*$/, "Location: " + CFG.locationFull);
      if (t !== orig) {
        node.nodeValue = t;
        changed++;
      }
    }
    return changed;
  }

  function patchLinks() {
    var links = document.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      var h = a.getAttribute("href") || "";
      if (h.indexOf("wa.me/917505459485") >= 0 || h.indexOf("wa.me/919842023382") >= 0) {
        a.setAttribute("href", h.replace(/wa\.me\/917505459485/, "wa.me/919842023382")
          .replace(/Hello%20Gridaan/i, "Hello%20Kalai's%20Jewellery"));
      }
      if (h.indexOf("tel:+917505459485") >= 0) a.setAttribute("href", CFG.phoneTel);
    }
  }

  function patchHead() {
    // title
    if (document.title.indexOf("Gridaan") >= 0) {
      document.title = document.title.replace(/Gridaan/g, CFG.name);
    }
    // meta
    var metas = document.querySelectorAll("meta[name], meta[property]");
    for (var i = 0; i < metas.length; i++) {
      var m = metas[i];
      var key = m.getAttribute("name") || m.getAttribute("property") || "";
      if (!/description|og:|twitter:|application-name|keywords/i.test(key)) continue;
      var c = m.getAttribute("content") || "";
      if (c.indexOf("Gridaan") >= 0) {
        m.setAttribute("content", c.replace(/Gridaan/g, CFG.name));
      }
    }
    // favicon
    var icons = document.querySelectorAll('link[rel*="icon"]');
    for (var k = 0; k < icons.length; k++) {
      icons[k].setAttribute("href", FAVICON);
    }
  }

  var FAVICON = "kalai-icon.svg";

  function addInstagram() {
    // footer: mirror the existing tel link style
    var footer = document.querySelector("footer");
    if (footer && !footer.querySelector('a[data-kalai-ig]')) {
      var tel = footer.querySelector('a[href^="tel:"]');
      if (tel) {
        var a = document.createElement("a");
        a.setAttribute("data-kalai-ig", "1");
        a.href = CFG.instagram;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = tel.className || "";
        a.textContent = "Instagram " + CFG.igHandle;
        tel.parentNode.insertBefore(a, tel.nextSibling);
      }
    }
    // contact page: mirror the WhatsApp card
    var main = document.querySelector("main");
    if (main && main.querySelector('a[href*="wa.me"]') && !main.querySelector('a[data-kalai-ig]')) {
      var wa = main.querySelector('a[href*="wa.me"]');
      var card = wa.cloneNode(false);
      card.setAttribute("data-kalai-ig", "1");
      card.href = CFG.instagram;
      card.target = "_blank";
      card.rel = "noopener noreferrer";
      card.innerHTML = "";
      var lab = document.createElement("p");
      lab.className = "mb-2 text-sm font-semibold text-neutral-900";
      lab.textContent = "Instagram";
      var val = document.createElement("p");
      val.className = "text-sm text-neutral-600";
      val.textContent = CFG.igHandle;
      card.appendChild(lab);
      card.appendChild(val);
      wa.parentNode.insertBefore(card, wa.nextSibling);
    }
  }

  function addWhatsAppEnquiry() {
    // product cards
    var cards = document.querySelectorAll('a[href*="product/"]');
    for (var i = 0; i < cards.length; i++) {
      var a = cards[i];
      if (a.parentNode && a.parentNode.querySelector('[data-wa]')) continue;
      var img = a.querySelector("img");
      var nm = img ? (img.getAttribute("alt") || "") : "";
      if (!nm) continue;
      var l = document.createElement("a");
      l.setAttribute("data-wa", "1");
      l.target = "_blank";
      l.rel = "noopener";
      l.href = CFG.wa + "?text=" + encodeURIComponent(
        "Hello " + CFG.name + ", I'm interested in " + nm +
        " (demo piece). Please share price and availability.");
      l.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;" +
        "margin-top:8px;border:1px solid #bbf7d0;background:#f0fdf4;color:#15803d;" +
        "font-size:13px;font-weight:600;padding:8px 10px;border-radius:10px;text-decoration:none";
      l.textContent = "Enquire on WhatsApp";
      a.parentNode.insertBefore(l, a.nextSibling);
    }
    // product detail page (next to Add to Bag)
    var buy = null;
    var btns = document.querySelectorAll("button");
    for (var j = 0; j < btns.length; j++) {
      if (/\bAdd to Bag\b/i.test(btns[j].textContent || "")) buy = btns[j];
    }
    if (buy && buy.parentNode && !buy.parentNode.querySelector("[data-wa-page]")) {
      var title = (document.title || "").split("|")[0].trim();
      var p = document.createElement("a");
      p.setAttribute("data-wa-page", "1");
      p.target = "_blank";
      p.rel = "noopener";
      p.href = CFG.wa + "?text=" + encodeURIComponent(
        "Hello " + CFG.name + ", I'm interested in " + title +
        " (demo piece). Please share price and availability.");
      p.style.cssText = "display:flex;align-items:center;justify-content:center;gap:6px;" +
        "margin-top:10px;border:1px solid #bbf7d0;background:#f0fdf4;color:#15803d;" +
        "font-size:14px;font-weight:600;padding:12px;border-radius:12px;text-decoration:none;width:100%";
      p.textContent = "Enquire on WhatsApp";
      buy.parentNode.appendChild(p);
    }
  }

  function applyAll() {
    try { patchHead(); } catch (e) {}
    try { patchLogo(); } catch (e) {}
    try { patchLinks(); } catch (e) {}
    try { replaceBrandText(document.body); } catch (e) {}
    try { addInstagram(); } catch (e) {}
    try { addWhatsAppEnquiry(); } catch (e) {}
  }

  function schedule() {
    applyAll();
    // re-apply after framework hydration / client navigation settles
    var delays = [150, 400, 900, 1600, 2600];
    for (var i = 0; i < delays.length; i++) setTimeout(applyAll, delays[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", schedule);
  } else {
    schedule();
  }
})();