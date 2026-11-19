// 메이플통신 — 움직임과 작은 동작. 스크롤 이벤트 대신 IntersectionObserver.
(() => {
  const doc = document.documentElement;
  doc.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const io = "IntersectionObserver" in window;

  // 머리 아래 줄: 맨 위를 벗어나면 보임
  const hd = document.querySelector(".hd");
  if (hd && io) {
    const s = document.createElement("div");
    s.style.cssText = "position:absolute;top:0;height:1px;width:1px";
    document.body.prepend(s);
    new IntersectionObserver(([e]) => hd.classList.toggle("scrolled", !e.isIntersecting)).observe(s);
  }

  // 휴대폰 메뉴
  const mb = document.querySelector(".hd-menu"), sheet = document.getElementById("sheet");
  if (mb && sheet) {
    mb.addEventListener("click", () => {
      const open = sheet.hidden;
      sheet.hidden = !open;
      mb.setAttribute("aria-expanded", String(open));
      mb.setAttribute("aria-label", open ? "메뉴 닫기" : "메뉴 열기");
    });
    sheet.addEventListener("click", (e) => { if (e.target.closest("a")) { sheet.hidden = true; mb.setAttribute("aria-expanded", "false"); } });
  }

  // 화면에 들어오면 나타나기 · 개통 단계 번호 채우기 · 숫자 올라가기
  const show = (el) => {
    el.classList.add("in");
    if (el.matches("[data-step]")) el.classList.add("on");
    el.querySelectorAll("[data-count]").forEach(count);
  };
  const els = document.querySelectorAll("[data-reveal]");
  if (!io || reduce) els.forEach(show);
  else {
    const ob = new IntersectionObserver((ents) => ents.forEach((e) => { if (e.isIntersecting) { show(e.target); ob.unobserve(e.target); } }),
      { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    els.forEach((el) => ob.observe(el));
  }
  function count(el) {
    const to = +el.dataset.count;
    if (!to || reduce) return;
    const fmt = (n) => n.toLocaleString("ko-KR"), t0 = performance.now(), dur = 1100;
    el.textContent = fmt(0);
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = fmt(Math.round(to * e / 10) * 10);
      if (k < 1) requestAnimationFrame(step); else el.textContent = fmt(to);
    };
    requestAnimationFrame(step);
  }

  // 영상: 움직임 줄이기 설정이면 멈춤, 화면 밖이면 쉬기(배터리)
  document.querySelectorAll(".phone-v").forEach((v) => {
    if (reduce) { v.removeAttribute("autoplay"); v.pause(); return; }
    if (io) new IntersectionObserver(([e]) => { e.isIntersecting ? v.play().catch(() => {}) : v.pause(); }).observe(v);
  });

  // 요금제 묶음 탭(홈)
  document.querySelectorAll("[data-tabs]").forEach((list) => {
    const tabs = [...list.querySelectorAll('[role="tab"]')];
    const pick = (t) => {
      tabs.forEach((x) => {
        const on = x === t;
        x.setAttribute("aria-selected", String(on));
        x.tabIndex = on ? 0 : -1;
        document.getElementById(x.getAttribute("aria-controls")).hidden = !on;
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => pick(t));
      t.addEventListener("keydown", (e) => {
        const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (d) { const n = tabs[(i + d + tabs.length) % tabs.length]; n.focus(); pick(n); }
      });
    });
  });

  // 요금제 거르기(요금제 페이지)
  const f = document.querySelector("[data-filters]"), grid = document.querySelector("[data-plan-grid]");
  if (f && grid) {
    const cards = [...grid.querySelectorAll(".plan")], n = f.querySelector("[data-n]");
    f.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      f.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      const k = b.dataset.filter;
      let c = 0;
      cards.forEach((p) => {
        const ok = k === "all" || (k === "post" ? p.dataset.type === "post" : p.dataset.type === "pre" && k.startsWith(p.dataset.net));
        p.hidden = !ok;
        if (ok) { c++; if (!reduce) { p.style.animation = "none"; p.offsetWidth; p.style.animation = "rise .45s cubic-bezier(.16,1,.3,1) both"; } }
      });
      n.textContent = c;
    });
  }

  // 지금 개통 가능? — 한국 시간(새 번호 08:00~21:50 매일). 화면에 보이는 기본 글은 HTML 그대로, 여기선 상태만 바꾼다.
  const live = document.querySelector("[data-live]");
  if (live) {
    const t = live.querySelector("[data-live-t]");
    const tick = () => {
      const k = new Date(Date.now() + (new Date().getTimezoneOffset() + 540) * 60000), m = k.getHours() * 60 + k.getMinutes();
      const open = m >= 8 * 60 && m < 21 * 60 + 50;
      live.classList.toggle("on", open);
      t.textContent = open ? "지금 새 번호 개통 가능 · 21:50까지" : m < 8 * 60 ? "새 번호 개통은 오늘 08:00부터" : "새 번호 개통은 내일 08:00부터";
    };
    tick();
    setInterval(tick, 60000);
  }

  // 주소에 #이 붙어 들어오면 그 접힌 줄 열기
  if (location.hash) {
    const t = document.querySelector(location.hash);
    if (t && t.tagName === "DETAILS") t.open = true;
  }
})();
