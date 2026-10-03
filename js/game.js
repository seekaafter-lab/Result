(function () {
  "use strict";

  const L = window.CafeLogic;
  const scenes = window.CafeScenes;
  const audio = window.CafeAudio();
  const SAVE_KEY = "blind-spring-cafe-v1";

  const titleCv = document.getElementById("titleCv");
  const titleCtx = titleCv.getContext("2d");
  const cv = document.getElementById("cv");
  const ctx = cv.getContext("2d");
  const modalRoot = document.getElementById("modal");

  let mode = "title";
  let state = L.createState();
  let room = "cafe";
  let modal = null;
  let modalDirty = true;
  let queue = [];
  let pending = [];
  let onDone = null;
  let talking = false;
  let typing = false;
  let typeTimer = null;
  let chore = null;
  let concert = null;
  let basement = null;
  let roof = { inside: false, waitUntil: 0 };
  let cryUntil = 0;
  let last = 0;
  let titleRoundShown = 1;
  let afterClose = null;

  function won(n) {
    return Math.floor(n).toLocaleString("ko-KR") + "원";
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (err) { /* ignore */ }
  }

  function readSave() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return L.normalize(JSON.parse(raw));
    } catch (err) {
      return null;
    }
  }

  function toast(text, bad) {
    const el = document.createElement("div");
    el.className = "toast" + (bad ? " bad" : "");
    el.textContent = text;
    document.getElementById("toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 2200);
  }

  function staffName() {
    return L.staff(L.roundOf(state)).name;
  }

  function refreshTitle() {
    const has = !!readSave();
    document.getElementById("continueBtn").hidden = !has;
  }

  function standaloneApp() {
    return window.navigator.standalone === true || window.matchMedia("(display-mode: standalone)").matches;
  }

  function refreshInstall() {
    const card = document.getElementById("installCard");
    if (!card) return;
    let dismissed = false;
    try { dismissed = sessionStorage.getItem("cafe-install-hide") === "1"; } catch (err) { dismissed = false; }
    card.hidden = standaloneApp() || dismissed;
    const chrome = document.getElementById("installChrome");
    if (chrome) chrome.hidden = !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent || "");
  }

  function showTitle() {
    mode = "title";
    document.getElementById("titleScreen").hidden = false;
    document.getElementById("gameScreen").hidden = true;
    modal = null;
    modalRoot.hidden = true;
    refreshTitle();
    refreshInstall();
  }

  function showPlay() {
    mode = "play";
    document.getElementById("titleScreen").hidden = true;
    document.getElementById("gameScreen").hidden = false;
    render();
  }

  function enqueue(lines, cb) {
    const items = lines.map(function (line) {
      return typeof line === "string" ? { who: staffName(), text: line } : line;
    });
    if (talking || queue.length) {
      pending.push({ items: items, cb: cb || null });
      return;
    }
    startLines(items, cb || null);
  }

  function startLines(items, cb) {
    queue = items.slice();
    onDone = cb;
    talking = true;
    nextLine();
  }

  function nextLine() {
    if (!queue.length) {
      talking = false;
      typing = false;
      const cb = onDone;
      onDone = null;
      render();
      if (cb) cb();
      if (!talking && pending.length) {
        const job = pending.shift();
        startLines(job.items, job.cb);
      }
      return;
    }
    const line = queue[0];
    document.getElementById("speaker").textContent = line.who || staffName();
    const target = document.getElementById("line");
    const text = line.text;
    target.textContent = "";
    typing = true;
    render();
    let i = 0;
    clearInterval(typeTimer);
    typeTimer = setInterval(function () {
      i += 1;
      target.textContent = text.slice(0, i);
      if (i >= text.length) {
        clearInterval(typeTimer);
        typing = false;
        const btn = document.querySelector("#choices [data-act='advance']");
        if (btn) btn.textContent = "다음";
      }
    }, 18);
    renderChoices();
  }

  function advance() {
    if (!talking) return;
    if (typing) {
      clearInterval(typeTimer);
      typing = false;
      document.getElementById("line").textContent = queue[0].text;
      return;
    }
    queue.shift();
    nextLine();
  }

  function maybeAnnounce() {
    const next = L.promotionReady(state);
    if (!next) return;
    if (state.announced === next.id) return;
    state.announced = next.id;
    save();
    enqueue([
      next.name + " 등급 심사가 가능합니다. 라운드는 하나씩만 넘어갑니다.",
      "잔고는 그대로입니다. 긴장만 하십시오.",
    ]);
  }

  function openModal(type, data) {
    modal = { type: type, data: data || {} };
    modalDirty = true;
    if (mode !== "play") {
      renderModal();
      return;
    }
    render();
    if (type === "shop" && data && data.focus === "goods") {
      const el = document.getElementById("goodsHead");
      if (el) el.scrollIntoView({ block: "start" });
    }
  }

  function closeModal() {
    const was = modal ? modal.type : null;
    modal = null;
    modalDirty = true;
    modalRoot.hidden = true;
    modalRoot.innerHTML = "";
    const follow = afterClose;
    afterClose = null;
    if (mode !== "play") return;
    render();
    if (follow) follow(was);
  }

  function roomLabel() {
    if (room === "garden") return "매장 밖 · 꽃밭";
    if (room === "basement") return "지하 1층 · 별들의 보석함";
    if (room === "roof") return "루프탑 · 화성 꽃밭";
    return "지상 · 카페";
  }

  function renderHud() {
    const rank = L.currentRank(state);
    const prog = L.progress(state);
    document.getElementById("hudRound").textContent = "ROUND " + rank.round;
    document.getElementById("hudRank").textContent = rank.name + " 등급";
    document.getElementById("hudRoom").textContent = roomLabel();
    const money = document.getElementById("hudMoney");
    money.textContent = won(state.money);
    money.classList.toggle("low", state.money < 2000);
    document.getElementById("hudEmotion").textContent = "감정 " + state.emotion.toFixed(1) + "%";
    document.getElementById("hudSpent").textContent = "바친 돈 " + won(state.totalSpent);
    document.getElementById("hudNext").textContent = prog.label;
    document.getElementById("hudBar").style.width = Math.round(prog.ratio * 100) + "%";
    const tags = document.getElementById("hudTags");
    const bits = [];
    if (state.applied.beast) bits.push(L.BEAST_MAIN);
    if (state.applied.cliff) bits.push("잠시 후 낭떠러지 입니다! 💛");
    if (state.applied.wallet) bits.push("잔고는 불만족,감성은 대만족!");
    tags.textContent = bits.join("  ");
    document.getElementById("muteBtn").textContent = audio.isMuted() ? "소리 꺼짐" : "소리 켜짐";
    document.getElementById("dialogBox").style.setProperty("--helmet", L.roundOf(state) >= 5 ? "#3e4634" : "#738255");
    document.getElementById("dialogBox").style.setProperty("--uniform", L.roundOf(state) >= 3 ? "#243028" : "#2f6a4a");
  }

  function renderSpots() {
    const root = document.getElementById("spots");
    root.innerHTML = "";
    if (room !== "cafe") return;
    const lay = scenes.LAYOUT;
    const spots = [
      { box: lay.barista, act: "talk", label: "바리스타" },
      { box: lay.counter, act: "shop", label: "주문" },
      { box: lay.box, act: "box", label: "오르골" },
      { box: lay.shelf, act: "goods", label: "굿즈" },
      { box: lay.board, act: "chores", label: "소일거리" },
      { box: lay.door, act: "garden", label: "꽃밭" },
      { box: lay.hatch, act: "basement", label: "지하" },
      { box: lay.ladder, act: "roof", label: "루프탑" },
    ];
    spots.forEach(function (spot) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "spot";
      btn.dataset.act = spot.act;
      btn.style.left = (spot.box.x / 320 * 100) + "%";
      btn.style.top = (spot.box.y / 180 * 100) + "%";
      btn.style.width = (spot.box.w / 320 * 100) + "%";
      btn.style.height = (spot.box.h / 180 * 100) + "%";
      btn.innerHTML = '<span class="dot"></span><span class="tag">' + esc(spot.label) + "</span>";
      btn.setAttribute("aria-label", spot.label);
      root.appendChild(btn);
    });
  }

  function renderChoices() {
    const root = document.getElementById("choices");
    root.innerHTML = "";
    if (mode !== "play") return;
    if (talking) {
      root.appendChild(button("advance", typing ? "넘어간다" : "다음", "next"));
      return;
    }
    if (modal) return;
    const list = actionsForRoom();
    list.forEach(function (item) {
      root.appendChild(button(item.act, item.label, item.klass || ""));
    });
  }

  function button(act, label, klass, extra) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.act = act;
    if (extra) Object.keys(extra).forEach(function (key) { btn.dataset[key] = extra[key]; });
    btn.className = klass || "";
    btn.textContent = label;
    return btn;
  }

  function actionsForRoom() {
    if (room === "garden") {
      return [
        { act: "cry", label: state.emotion >= 3 ? "운다" : "눈이 건조하다", klass: state.emotion >= 3 ? "hot" : "" },
        { act: "cafe", label: "카페로 돌아간다" },
      ];
    }
    if (room === "basement") {
      return [
        { act: "nothing", label: "아무것도 안 한다" },
        { act: "cafe", label: "카페로 돌아간다" },
      ];
    }
    if (room === "roof") {
      const list = [];
      if (state.rank >= 4 && !roof.inside) list.push({ act: "roof-skip", label: "우선 입장", klass: "rankup" });
      if (state.rank < 4 && !roof.inside && !roof.waitUntil) list.push({ act: "roof-wait", label: "줄 서기" });
      if (roof.inside) list.push({ act: "photo", label: "사진 찍는다", klass: "hot" });
      list.push({ act: "cafe", label: "카페로 돌아간다" });
      return list;
    }
    const list = [];
    if (L.promotionReady(state)) list.push({ act: "review", label: "승급 심사", klass: "rankup" });
    list.push(
      { act: "shop", label: "주문한다" },
      { act: "goods", label: "굿즈를 본다" },
      { act: "box", label: "오르골" },
      { act: "chores", label: "소일거리" },
      { act: "garden", label: "꽃밭으로", klass: state.emotion >= 3 ? "hot" : "" },
      { act: "basement", label: "지하로" },
      { act: "roof", label: "루프탑" },
      { act: "wallet", label: "지갑" },
      { act: "talk", label: "이야기" }
    );
    return list;
  }

  function renderDecor() {
    const el = document.getElementById("decor");
    if (room === "cafe") {
      el.innerHTML = '<div class="clock">8:59</div>';
    } else if (room === "basement") {
      const extra = state.rank >= 3;
      el.innerHTML = '<div class="stay"><p>' + (extra ? "기본 12분 + 연장 12분" : "아무것도 안 할 권리 12분") + '</p><div id="stayClock">' + (extra ? "24:00" : "12:00") + '</div><p id="stare">멍</p></div>';
    } else if (room === "roof") {
      el.innerHTML = '<div class="garden-flag">화성 꽃밭</div>' + (roof.inside ? "" : '<div class="queue-flag" id="queueNum">대기 12팀</div>');
    } else if (room === "garden") {
      el.innerHTML = '<div class="garden-flag">감정 배출 구역</div>';
    } else {
      el.innerHTML = "";
    }
  }

  function render() {
    if (mode !== "play") return;
    renderHud();
    renderSpots();
    renderChoices();
    renderDecor();
    if (!talking && queue.length === 0 && document.getElementById("line").dataset.hold !== "1") {
      if (!document.getElementById("line").textContent) {
        document.getElementById("speaker").textContent = staffName();
        document.getElementById("line").textContent = "고객님, 불편을 드려 기쁘게 생각합니다! 😊";
      }
    }
    if (modalDirty) renderModal();
  }

  function renderModal() {
    modalDirty = false;
    if (!modal) {
      modalRoot.hidden = true;
      modalRoot.innerHTML = "";
      return;
    }
    modalRoot.hidden = false;
    const scroll = modalRoot.querySelector(".sheet");
    const top = scroll ? scroll.scrollTop : 0;
    modalRoot.innerHTML = '<div class="backdrop" data-act="backdrop"></div><div class="sheet" role="dialog" aria-modal="true">' + modalHtml() + "</div>";
    const next = modalRoot.querySelector(".sheet");
    if (next) next.scrollTop = top;
  }

  function modalHtml() {
    if (modal.type === "help") return helpHtml();
    if (modal.type === "shop") return shopHtml();
    if (modal.type === "receipt") return receiptHtml(modal.data.receipt, modal.data);
    if (modal.type === "box") return boxHtml();
    if (modal.type === "chores") return chorePickHtml();
    if (modal.type === "mop") return mopHtml();
    if (modal.type === "weed") return weedHtml();
    if (modal.type === "spring") return springHtml();
    if (modal.type === "rank") return rankHtml(modal.data.applied);
    if (modal.type === "wallet") return walletHtml();
    if (modal.type === "concert") return concertHtml();
    if (modal.type === "photo") return photoHtml();
    if (modal.type === "confirm-reset") return confirmResetHtml();
    return "";
  }

  function helpHtml() {
    return "<h3>이용 안내</h3>" + L.HELP.map(function (line) {
      return "<p>" + esc(line) + "</p>";
    }).join("") + '<button type="button" data-act="close">접는다</button>';
  }

  function shopHtml() {
    const truth = L.showTruth(state);
    const round = L.roundOf(state);
    const summary = L.cartSummary(state);
    const menu = L.visibleMenu(state).map(function (item) { return itemRow(item, "menu", round, truth); }).join("");
    const goods = L.visibleGoods(state).map(function (item) { return itemRow(item, "goods", round, truth); }).join("");
    const lines = summary.lines.map(function (line) {
      return "<li><span>" + esc(line.name) + (line.qty > 1 ? " ×" + line.qty : "") + "</span><b>" + won(line.price * line.qty) + "</b></li>";
    }).join("");
    const tier = summary.tier ? L.trackOf(summary.tier) : null;
    const canPay = summary.total > 0 && summary.total <= state.money;
    let why = "담으면 영수증에 합계로 찍힙니다.";
    if (summary.total > state.money) why = "잔고가 먼저 항복했습니다.";
    else if (tier) why = "합계 " + won(summary.total) + " → " + tier.style;
    return "<h3>주문과 굿즈</h3><p class=\"whisper\">고객님, 불편을 드려 기쁘게 생각합니다! 😊</p>"
      + '<div class="shop"><div class="catalog"><h4 id="menuHead">메뉴</h4>' + menu
      + '<h4 id="goodsHead">굿즈</h4>' + goods + "</div><aside class=\"cart\"><h4>계산서</h4><ul>"
      + (lines || "<li>비어 있습니다.</li>") + "</ul><p class=\"sum\">합계 " + won(summary.total) + "</p><p>"
      + esc(why) + "</p><button type=\"button\" data-act=\"pay\"" + (canPay ? "" : " disabled") + ">결제한다</button>"
      + '<button type="button" class="ghost" data-act="clear-cart">비운다</button>'
      + '<button type="button" class="ghost" data-act="close">돌아간다</button></aside></div>';
  }

  function itemRow(item, kind, round, truth) {
    const locked = item.minRound > round;
    const owned = kind === "goods" && L.owns(state, item.id);
    const qty = kind === "menu" ? (state.cart.menu[item.id] || 0) : (state.cart.goods[item.id] || 0);
    const desc = truth && item.truth ? item.truth : (item.pretty || item.blurb);
    let badge = "";
    if (locked) badge = '<span class="badge">다음 라운드</span>';
    else if (item.minRound === round && round > 1) badge = '<span class="badge new">신상</span>';
    if (owned) badge += '<span class="badge">보유</span>';
    const controls = locked || owned
      ? ""
      : '<div class="qty"><button type="button" data-act="qty" data-kind="' + kind + '" data-id="' + item.id + '" data-dir="-1">-</button><span>'
        + qty + '</span><button type="button" data-act="qty" data-kind="' + kind + '" data-id="' + item.id + '" data-dir="1">+</button></div>';
    return '<article class="item' + (locked ? " locked" : "") + '"><header><b>' + esc(item.name) + "</b>" + badge + "<em>"
      + won(item.price) + "</em></header><p>" + esc(desc) + "</p>" + (item.pitch && !truth ? "<p>" + esc(item.pitch) + "</p>" : "") + controls + "</article>";
  }

  function receiptHtml(receipt, data) {
    const track = L.trackOf(receipt.tier);
    const rows = receipt.lines.map(function (line) {
      return "<li><span>" + esc(line.name) + (line.qty > 1 ? " ×" + line.qty : "") + "</span><span>" + won(line.price * line.qty) + "</span></li>";
    }).join("");
    return '<div class="paper"><p class="center">저는 봄이 와도 꽃을 볼 수 없답니다</p><ul>' + rows
      + '</ul><p class="total">합계 ' + won(receipt.total) + "</p><p>" + esc(track.style) + "<br>" + esc(track.title) + "</p><p>감정 "
      + data.emotionBefore.toFixed(1) + "% → " + data.emotionAfter.toFixed(1) + "%</p></div>"
      + '<button type="button" data-act="play-new" data-id="' + esc(receipt.id) + '">오르골에 넣는다</button>'
      + '<button type="button" class="ghost" data-act="close">주머니에 넣는다</button>';
  }

  function boxHtml() {
    const owns = L.owns(state, "box");
    const head = owns
      ? "내 오르골입니다. 통장 잔고가 불타는 현대예술을 아름다운 음악으로 감상해보세요! 💖"
      : "진열용 오르골입니다. 결제 후 남은 영수증을 넣으면, 작은 오르골이 금액에 맞춰 짧은 멜로디를 연주합니다.";
    const guide = "<ul class=\"tracks\"><li>7,000원 미만 · 경쾌한 왈츠 · 종달새의 맑은 한도 초과 알림음</li>"
      + "<li>7,000원 이상 · 아련한 발라드 · 월요일 오전 8시 59분에 울리는 햇살의 속삭임</li>"
      + "<li>14,000원 이상 · 장엄한 레퀴엠 · 통장 잔고를 바라보는 자연의 한숨 소리</li></ul>";
    const cards = state.receipts.map(function (receipt) {
      const track = L.trackOf(receipt.tier);
      return '<article class="item"><b>합계 ' + won(receipt.total) + "</b><p>" + esc(track.style) + " · " + esc(track.title)
        + '</p><button type="button" data-act="play-new" data-id="' + esc(receipt.id) + '">넣는다</button></article>';
    }).join("");
    let extras = "";
    if (state.requiemTokens > 0) extras += '<button type="button" data-act="free-requiem">레퀴엠 무료 재생 (' + state.requiemTokens + ")</button>";
    if (state.rewind && owns) extras += '<button type="button" data-act="rewind">한 번 되감기</button>';
    return "<h3>멜로디 영수증 오르골</h3><p>" + esc(head) + "</p>" + guide
      + (cards || "<p>영수증이 없습니다. 먼저 결제하십시오. 음악은 낭비 뒤에 옵니다.</p>")
      + extras + '<button type="button" class="ghost" data-act="close">닫는다</button>';
  }

  function chorePickHtml() {
    return "<h3>오늘의 소일거리</h3><p>보상은 2,000원. 카페는 인건비에 인색합니다. 실패하면 0원.</p>"
      + '<button type="button" data-act="start-chore" data-kind="mop">흘린 눈물 닦기</button>'
      + '<button type="button" data-act="start-chore" data-kind="weed">꽃밭 잡초뽑기</button>'
      + '<button type="button" data-act="start-chore" data-kind="spring">오르골 태엽감기</button>'
      + '<button type="button" class="ghost" data-act="close">돌아간다</button>';
  }

  function mopHtml() {
    return "<h3>흘린 눈물 닦기</h3><p>막대가 초록 칸에 들어오면 닦습니다. 3번. 3번 놓치면 실패.</p>"
      + '<div class="track"><div class="zone" id="mopZone"></div><div class="marker" id="mopMarker"></div></div>'
      + '<p id="mopStat">0/3</p><button type="button" data-act="mop-hit">닦기</button>'
      + '<button type="button" class="ghost" data-act="chore-giveup">도망친다</button>';
  }

  function weedHtml() {
    return "<h3>꽃밭 잡초뽑기</h3><p>잡초가 보이면 바로 뽑습니다. 6개. 2개를 넘기면 실패.</p>"
      + '<div class="weed-field" id="weedField"></div><p id="weedStat">0/6</p>'
      + '<button type="button" class="ghost" data-act="chore-giveup">도망친다</button>';
  }

  function springHtml() {
    return "<h3>오르골 태엽감기</h3><p>누르고 있다가, 칸 안에서 손을 뗍니다. 3번. 넘어가거나 두 번 실패하면 튕깁니다.</p>"
      + '<div class="spring-gauge"><div class="zone" id="springZone"></div><div class="fill" id="springFill"></div></div>'
      + '<p id="springStat">0/3</p><button type="button" id="windBtn">태엽 감기 (누르고 있기)</button>'
      + '<button type="button" class="ghost" data-act="chore-giveup">도망친다</button>';
  }

  function rankHtml(applied) {
    const rank = applied.rank;
    const stock = L.stockOfRound(rank.round);
    const goods = stock.goods.map(function (g) { return "<li>신굿즈 · " + esc(g.name) + " " + won(g.price) + "</li>"; }).join("");
    const menu = stock.menu.map(function (m) { return "<li>신메뉴 · " + esc(m.name) + " " + won(m.price) + "</li>"; }).join("");
    let gift = "";
    if (applied.extra === "sticker") {
      gift = "<p><b>" + esc(applied.main) + "</b><br>랜덤 증정: " + esc(applied.line) + "</p>";
    } else if (applied.extra === "requiem") {
      gift = "<p>레퀴엠 1회가 오르골에 들어 있습니다.</p>";
    } else if (applied.extra === "time") {
      gift = "<p>별들의 보석함 체류가 24분(기본 12 + 연장 12)으로 늘었습니다.</p>";
    } else if (applied.extra === "roof") {
      gift = "<p>루프탑 줄을 그냥 지나갑니다.</p>";
    }
    return '<div class="stamp">ROUND ' + rank.round + "</div><h3>" + esc(rank.name) + " 등급</h3><p>조건: " + esc(rank.need)
      + "</p><p>혜택: " + esc(rank.benefit) + "</p><p>" + esc(rank.line) + "</p>" + gift
      + ((menu || goods) ? "<ul>" + menu + goods + "</ul>" : "")
      + '<button type="button" data-act="close">확인</button>';
  }

  function walletHtml() {
    const goods = L.GOODS.map(function (g) {
      if (!L.owns(state, g.id)) return "<li>" + esc(g.name) + " · 없음</li>";
      return "<li>" + esc(g.name) + ' <button type="button" data-act="use-good" data-id="' + g.id + '">사용</button></li>';
    }).join("");
    return "<h3>지갑</h3><p>잔고 " + won(state.money) + "</p><p>바친 돈 " + won(state.totalSpent) + "</p><p>결제 방문 "
      + state.paidVisits + "회 · 지하 " + state.basementVisits + "회 · 영수증 " + state.receipts.length + "장</p><ul>"
      + goods + "</ul>" + (state.wildExtras.length ? "<p>" + esc(state.wildExtras[state.wildExtras.length - 1]) + "</p>" : "")
      + '<button type="button" class="ghost" data-act="ask-reset">통장을 버린다</button>'
      + '<button type="button" data-act="close">접는다</button>';
  }

  function concertHtml() {
    const track = concert ? L.trackOf(concert.tier) : L.TRACKS.waltz;
    return '<div class="concert"><p class="eyebrow">' + esc(track.style) + "</p><h3>" + esc(track.title) + "</h3>"
      + '<div class="track thin"><div class="marker wide" id="concertBar"></div></div>'
      + "<p>통장이 타는 속도에 맞춰, 짧게 연주됩니다.</p>"
      + '<button type="button" data-act="stop-concert">그만 듣는다</button></div>';
  }

  function photoHtml() {
    const phrase = state.applied.wallet ? "잔고는 불만족,감성은 대만족!" : "속은 시커먼 뱀굴이지만 겉은 화사한 꽃밭입니다 🌸";
    return '<div class="polaroid"><div class="sky"></div><p>저는 봄이 와도<br>꽃을 볼 수 없답니다</p><b>' + esc(L.currentRank(state).name)
      + " 등급</b><p>잔고 " + won(state.money) + "</p><p>" + esc(phrase) + "</p></div>"
      + '<button type="button" data-act="save-photo">사진으로 남긴다</button>'
      + '<button type="button" class="ghost" data-act="close">내려간다</button>';
  }

  function confirmResetHtml() {
    return "<h3>통장을 버립니까?</h3><p>등급도, 영수증도, 스티커도 같이 사라집니다. 잔고는 처음부터 다시 간당간당해집니다.</p>"
      + '<button type="button" data-act="do-reset">버린다</button>'
      + '<button type="button" class="ghost" data-act="close">남긴다</button>';
  }

  function onAct(act, data) {
    audio.unlock();
    if (act === "enter") return startNew();
    if (act === "continue") return startContinue();
    if (act === "help") return openModal("help");
    if (act === "hide-install") {
      try { sessionStorage.setItem("cafe-install-hide", "1"); } catch (err) { /* private mode */ }
      const card = document.getElementById("installCard");
      if (card) card.hidden = true;
      return;
    }
    if (act === "advance" || act === "next") return advance();
    if (act === "backdrop") {
      if (modal && (modal.type === "help" || modal.type === "wallet" || modal.type === "photo")) closeModal();
      return;
    }
    if (act === "close") return closeModal();
    if (mode !== "play") return;
    if (talking && act !== "advance") return;
    if (modal) {
      modalAct(act, data);
      return;
    }

    if (act === "talk") {
      const lines = L.TALKS[L.roundOf(state)] || L.TALKS[1];
      const line = lines[state.chores % lines.length];
      enqueue([line]);
      return;
    }
    if (act === "shop") return openModal("shop");
    if (act === "goods") return openModal("shop", { focus: "goods" });
    if (act === "box") return openModal("box");
    if (act === "chores") return openModal("chores");
    if (act === "wallet") return openModal("wallet");
    if (act === "garden") return enterGarden();
    if (act === "basement") return enterBasement();
    if (act === "roof") return enterRoof();
    if (act === "cafe") return enterCafe();
    if (act === "cry") return cry();
    if (act === "nothing") return doNothing();
    if (act === "review") return doReview();
    if (act === "roof-wait") return startQueue();
    if (act === "roof-skip") return skipQueue();
    if (act === "photo") return openModal("photo");
  }

  function modalAct(act, data) {
    if (act === "qty") {
      L.addToCart(state, data.kind, data.id, Number(data.dir));
      modalDirty = true;
      render();
      return true;
    }
    if (act === "clear-cart") {
      state.cart = { menu: {}, goods: {} };
      modalDirty = true;
      render();
      return true;
    }
    if (act === "pay") {
      doPay();
      return true;
    }
    if (act === "play-new") {
      playReceipt(data.id);
      return true;
    }
    if (act === "free-requiem") {
      if (state.requiemTokens > 0) {
        state.requiemTokens -= 1;
        save();
        startConcert("requiem");
      }
      return true;
    }
    if (act === "rewind") {
      if (state.rewind) {
        const tier = state.rewind;
        state.rewind = null;
        save();
        startConcert(tier);
      }
      return true;
    }
    if (act === "start-chore") {
      startChore(data.kind);
      return true;
    }
    if (act === "mop-hit") {
      mopHit();
      return true;
    }
    if (act === "pull") {
      pullWeed(data.wid);
      return true;
    }
    if (act === "chore-giveup") {
      finishChore(false);
      return true;
    }
    if (act === "stop-concert") {
      stopConcert();
      return true;
    }
    if (act === "use-good") {
      useGood(data.id);
      return true;
    }
    if (act === "ask-reset") {
      openModal("confirm-reset");
      return true;
    }
    if (act === "do-reset") {
      hardReset();
      return true;
    }
    if (act === "save-photo") {
      savePhoto();
      return true;
    }
    return false;
  }

  function startNew() {
    state = L.createState();
    room = "cafe";
    roof = { inside: false, waitUntil: 0 };
    basement = null;
    concert = null;
    chore = null;
    save();
    showPlay();
    document.getElementById("speaker").textContent = "상병 꽃순이";
    document.getElementById("line").textContent = "";
    enqueue(L.INTRO, function () {
      openModal("rank", { applied: { rank: L.RANKS[0], id: "sprout", extra: null, line: "", main: "" } });
      afterClose = function () {
        enqueue(["주문은 아래 버튼입니다. 돈이 모자라면 소일거리. 2,000원씩, 짜게."]);
      };
    });
  }

  function startContinue() {
    const loaded = readSave();
    if (!loaded) return startNew();
    state = loaded;
    room = "cafe";
    roof = { inside: false, waitUntil: 0 };
    basement = null;
    showPlay();
    enqueue(["통장을 다시 펼쳤습니다. 잔고는 저장된 그대로, 즉 여전히 위험합니다."]);
  }

  function doPay() {
    const result = L.applyCheckout(state);
    if (!result.ok) {
      const line = result.error === "money"
        ? "고객님, 그 잔고로는 꽃향도 향료가 안 됩니다. 소일거리를 권합니다. 😊"
        : "담은 게 없습니다. 빈 영수증은 음악이 안 됩니다.";
      closeModal();
      enqueue([line]);
      return;
    }
    audio.playSpend();
    shake();
    save();
    if (result.crossed) state.gardenLined = false;
    openModal("receipt", result);
    afterClose = function () {
      const jobs = [];
      if (result.crossed) {
        state.gardenLined = true;
        jobs.push("고객님! 나가서 울어주시면 감사하겠습니다 😊🌸");
        jobs.push("감정 " + result.emotionAfter.toFixed(1) + "%입니다. 기준은 3%. 매장 밖 꽃밭으로 가시면 됩니다.");
      }
      if (jobs.length) enqueue(jobs, maybeAnnounce);
      else maybeAnnounce();
    };
  }

  function playReceipt(id) {
    const receipt = L.takeReceipt(state, id);
    if (!receipt) return;
    if (L.owns(state, "box")) state.rewind = receipt.tier;
    save();
    try {
      startConcert(receipt.tier);
    } catch (err) {
      state.receipts.push(receipt);
      save();
      enqueue(["오르골이 먹통입니다. 영수증은 돌려드렸습니다. 돈은 이미 없습니다."]);
    }
  }

  function startConcert(tier) {
    const dur = audio.play(tier);
    concert = { tier: tier, until: performance.now() + dur * 1000, dur: dur };
    openModal("concert");
  }

  function stopConcert() {
    audio.stopAll();
    concert = null;
    closeModal();
  }

  function doReview() {
    const applied = L.applyPromotion(state, Math.random);
    if (!applied) return;
    audio.playRank();
    state.announced = null;
    if (L.owns(state, "beast")) delete state.cart.goods.beast;
    save();
    shake();
    openModal("rank", { applied: applied });
    afterClose = function () {
      const rank = L.currentRank(state);
      const who = L.staff(rank.round).name;
      enqueue([
        { who: who, text: "ROUND " + rank.round + ". " + rank.line },
        { who: who, text: "고객님, 불편을 드려 기쁘게 생각합니다! 😊" },
      ], function () {
        if (L.promotionReady(state)) {
          enqueue(["다음 등급 심사도 이미 대기 중입니다. 라운드는 한 칸씩만 넘어갑니다."]);
        }
      });
    };
  }

  function startChore(kind) {
    const now = performance.now();
    if (kind === "mop") {
      chore = { type: "mop", hits: 0, misses: 0, need: 3, maxMiss: 3, t0: now, period: 1500, zoneStart: 0.62, zoneW: 0.2 };
      openModal("mop");
    } else if (kind === "weed") {
      chore = { type: "weed", got: 0, missed: 0, spawned: 0, nextAt: now + 400, active: null, seq: 1 };
      openModal("weed");
    } else {
      chore = { type: "spring", holding: false, value: 0, success: 0, fails: 0, zoneStart: 0.68, zoneW: 0.2 };
      openModal("spring");
    }
  }

  function finishChore(ok) {
    chore = null;
    modal = null;
    modalDirty = true;
    if (ok) {
      state.money += L.CHORE_PAY;
      state.chores += 1;
      audio.playEarn();
      toast("+2,000원");
      save();
      enqueue([L.choreSuccess(state.chores)]);
    } else {
      audio.playFail();
      enqueue([L.choreFail()]);
    }
  }

  function mopPos(now) {
    const u = ((now - chore.t0) % chore.period) / chore.period;
    return u < 0.5 ? u * 2 : 2 - u * 2;
  }

  function mopHit() {
    if (!chore || chore.type !== "mop") return;
    const p = mopPos(performance.now());
    const hit = p >= chore.zoneStart && p <= chore.zoneStart + chore.zoneW;
    if (hit) {
      chore.hits += 1;
      chore.period = Math.max(860, chore.period * 0.9);
      chore.zoneStart = 0.08 + Math.random() * (0.92 - chore.zoneW - 0.08);
      audio.playEarn();
      if (chore.hits >= chore.need) finishChore(true);
    } else {
      chore.misses += 1;
      audio.playFail();
      if (chore.misses >= chore.maxMiss) finishChore(false);
    }
  }

  function updateMop(now) {
    const zone = document.getElementById("mopZone");
    const marker = document.getElementById("mopMarker");
    const stat = document.getElementById("mopStat");
    if (!zone || !marker) return;
    zone.style.left = (chore.zoneStart * 100) + "%";
    zone.style.width = (chore.zoneW * 100) + "%";
    marker.style.left = (mopPos(now) * 100) + "%";
    if (stat) stat.textContent = chore.hits + "/" + chore.need + " · 실수 " + chore.misses + "/" + chore.maxMiss;
  }

  function updateWeed(now) {
    if (!chore.active && now >= chore.nextAt && chore.spawned < 8 && chore.got < 6 && chore.missed <= 2) {
      chore.spawned += 1;
      const id = String(chore.seq);
      chore.seq += 1;
      chore.active = { id: id, until: now + 1150 };
      const field = document.getElementById("weedField");
      if (field) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "weed";
        btn.dataset.act = "pull";
        btn.dataset.wid = id;
        btn.style.left = (8 + Math.random() * 68) + "%";
        btn.style.top = (8 + Math.random() * 58) + "%";
        btn.textContent = "잡초";
        field.appendChild(btn);
      }
    }
    if (chore.active && now > chore.active.until) missWeed(chore.active.id);
    const stat = document.getElementById("weedStat");
    if (stat) stat.textContent = chore.got + "/6 · 놓침 " + chore.missed;
  }

  function pullWeed(id) {
    if (!chore || !chore.active || chore.active.id !== id) return;
    const btn = document.querySelector('.weed[data-wid="' + id + '"]');
    if (btn) btn.remove();
    chore.active = null;
    chore.got += 1;
    chore.nextAt = performance.now() + 280;
    audio.playEarn();
    if (chore.got >= 6) finishChore(true);
  }

  function missWeed(id) {
    if (!chore || !chore.active || chore.active.id !== id) return;
    const btn = document.querySelector('.weed[data-wid="' + id + '"]');
    if (btn) btn.remove();
    chore.active = null;
    chore.missed += 1;
    chore.nextAt = performance.now() + 280;
    if (chore.missed > 2) finishChore(false);
  }

  function updateSpring(dt) {
    if (!chore) return;
    if (chore.holding) {
      chore.value = Math.min(1, chore.value + dt * 0.42);
      if (chore.value >= 1) {
        chore.holding = false;
        failSpring();
      }
    }
    const fill = document.getElementById("springFill");
    const zone = document.getElementById("springZone");
    const stat = document.getElementById("springStat");
    if (fill) fill.style.height = (chore.value * 100) + "%";
    if (zone) {
      zone.style.bottom = (chore.zoneStart * 100) + "%";
      zone.style.height = (chore.zoneW * 100) + "%";
    }
    if (stat) stat.textContent = chore.success + "/3 · 실패 " + chore.fails + "/2";
  }

  function releaseSpring() {
    if (!chore || chore.type !== "spring" || !chore.holding) return;
    chore.holding = false;
    const inZone = chore.value >= chore.zoneStart && chore.value <= chore.zoneStart + chore.zoneW;
    chore.value = 0;
    if (inZone) {
      chore.success += 1;
      chore.zoneStart = 0.55 + Math.random() * 0.2;
      audio.playEarn();
      if (chore.success >= 3) finishChore(true);
    } else failSpring();
  }

  function failSpring() {
    if (!chore) return;
    chore.fails += 1;
    chore.value = 0;
    audio.playFail();
    if (chore.fails >= 2) finishChore(false);
  }

  function enterGarden() {
    leaveBasement();
    room = "garden";
    render();
    if (state.emotion >= 3 && !state.gardenLined) {
      state.gardenLined = true;
      save();
      enqueue(["고객님! 나가서 울어주시면 감사하겠습니다 😊🌸"]);
    } else if (state.emotion < 3 && !state.gardenDryLine) {
      state.gardenDryLine = true;
      save();
      enqueue(["꽃은 피어 있습니다. 감정은 아직 3% 이하입니다. 이 꽃밭은 넘친 손님용입니다."]);
    }
  }

  function cry() {
    if (state.emotion < 3) {
      enqueue(["눈이 건조합니다. 감정이 3%는 넘어야 이 꽃밭이 일을 합니다."]);
      return;
    }
    cryUntil = performance.now() + 2200;
    const money = state.money;
    state.emotion = 0.4;
    state.gardenLined = false;
    state.criedOnce = true;
    audio.playSigh();
    save();
    enqueue([
      "아, 내 통장잔고가 이렇게 알차게 낭비됐구나 🌸",
      "눈물은 났습니다. 잔고는 " + won(money) + " 그대로입니다.",
    ]);
  }

  function enterBasement() {
    room = "basement";
    const seconds = state.rank >= 3 ? 144 : 72;
    const now = performance.now();
    basement = { enteredAt: now, endsAt: now + seconds * 1000, counted: false, kicked: false };
    render();
    if (!state.basementIntro) {
      state.basementIntro = true;
      save();
      enqueue(["별들의 보석함입니다. 별도 보석도 없습니다. 아무것도 안 해도 되는 시간. 8초 안에 나가면 입장으로 안 칩니다."]);
    }
  }

  function leaveBasement() {
    if (!basement) return;
    const stayed = (performance.now() - basement.enteredAt) / 1000;
    const tooFast = stayed < 8 && !basement.counted;
    basement = null;
    if (tooFast) enqueue(["너무 빨리 나오셨습니다. 8초는 있어야 입장으로 칩니다. 아무것도 안 하는 데도 최소 시간이 있습니다."]);
  }

  function enterRoof() {
    leaveBasement();
    room = "roof";
    roof.waitUntil = 0;
    roof.inside = state.rank >= 4;
    render();
    if (roof.inside && !state.roofGreeted) {
      state.roofGreeted = true;
      save();
      enqueue(["우선 입장입니다. 루프탑 화성 꽃밭. 꽃은 화성에 없고, 포토존만 있습니다."]);
    } else if (!roof.inside && !state.roofWarned) {
      state.roofWarned = true;
      save();
      enqueue(["대기가 깁니다. 정원사 등급은 줄을 무시합니다. 지금은 그 등급이 아닙니다."]);
    }
  }

  function startQueue() {
    roof.waitUntil = performance.now() + 20000;
    enqueue(["줄을 섰습니다. 대부분은 중간에 통장을 지키러 돌아갑니다. 약 20초."]);
  }

  function skipQueue() {
    roof.inside = true;
    roof.waitUntil = 0;
    render();
  }

  function enterCafe() {
    const fromBase = room === "basement";
    if (fromBase) leaveBasement();
    room = "cafe";
    roof.inside = false;
    roof.waitUntil = 0;
    render();
  }

  function doNothing() {
    state.nothingClicks += 1;
    save();
    const stares = ["......", "숨만 쉽니다.", "아무것도 안 했습니다. 잘하셨습니다.", "별은 장식이고, 보석은 없습니다."];
    toast(stares[state.nothingClicks % stares.length]);
  }

  function useGood(id) {
    if (id === "beast") {
      state.applied.beast = true;
      save();
      closeModal();
      enqueue([L.BEAST_MAIN]);
      return;
    }
    if (id === "cliff") {
      state.applied.cliff = true;
      save();
      closeModal();
      enqueue(["잠시 후 낭떠러지 입니다! 즐거운 운전 되시길 바랍니다! 💛"]);
      return;
    }
    if (id === "wallet") {
      state.applied.wallet = true;
      save();
      closeModal();
      enqueue(["잔고는 불만족,감성은 대만족!"]);
      return;
    }
    if (id === "box") {
      openModal("box");
    }
  }

  function savePhoto() {
    state.photos += 1;
    save();
    const c = document.createElement("canvas");
    c.width = 280;
    c.height = 340;
    const g = c.getContext("2d");
    g.fillStyle = "#fff6ea";
    g.fillRect(0, 0, 280, 340);
    g.fillStyle = "#e7a07a";
    g.fillRect(20, 20, 240, 160);
    g.fillStyle = "#c4543a";
    g.fillRect(20, 140, 240, 40);
    g.fillStyle = "#241418";
    g.font = "16px NeoDunggeunmo, monospace";
    g.fillText("저는 봄이 와도", 36, 210);
    g.fillText("꽃을 볼 수 없답니다", 36, 232);
    g.fillText(L.currentRank(state).name + " 등급", 36, 264);
    g.fillText("잔고 " + won(state.money), 36, 288);
    const a = document.createElement("a");
    a.href = c.toDataURL("image/png");
    a.download = "mars-flower-field.png";
    a.click();
    toast("사진을 남겼습니다. 잔고는 그대로.");
    closeModal();
  }

  function hardReset() {
    try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ }
    audio.stopAll();
    concert = null;
    chore = null;
    basement = null;
    roof = { inside: false, waitUntil: 0 };
    queue = [];
    pending = [];
    talking = false;
    state = L.createState();
    modal = null;
    showTitle();
  }

  function shake() {
    const stage = document.getElementById("stage");
    stage.classList.remove("shake");
    void stage.offsetWidth;
    stage.classList.add("shake");
  }

  function updateBasement(now) {
    if (!basement || room !== "basement") return;
    const stayed = (now - basement.enteredAt) / 1000;
    if (!basement.counted && stayed >= 8) {
      basement.counted = true;
      state.basementVisits += 1;
      save();
      toast("입장으로 인정되었습니다");
      maybeAnnounce();
    }
    const remainReal = Math.max(0, (basement.endsAt - now) / 1000);
    const shown = Math.ceil(remainReal * 10);
    const mm = String(Math.floor(shown / 60)).padStart(2, "0");
    const ss = String(shown % 60).padStart(2, "0");
    const clock = document.getElementById("stayClock");
    if (clock && clock.textContent !== mm + ":" + ss) clock.textContent = mm + ":" + ss;
    const stare = document.getElementById("stare");
    if (stare) {
      const dots = ".".repeat((Math.floor(now / 500) % 6) + 1);
      const text = "멍" + dots;
      if (stare.textContent !== text) stare.textContent = text;
    }
    if (remainReal <= 0 && !basement.kicked) {
      basement.kicked = true;
      const line = state.rank >= 3
        ? "연장까지 끝났습니다. 아무것도 안 한 채로요. 성공입니다."
        : "12분이 끝났습니다. 아무것도 안 한 채로요. 성공입니다.";
      enqueue([line], function () { enterCafe(); });
    }
  }

  function updateRoof(now) {
    if (room !== "roof" || !roof.waitUntil) return;
    const remain = Math.max(0, roof.waitUntil - now);
    const teams = Math.max(0, Math.ceil(remain / 20000 * 12));
    const el = document.getElementById("queueNum");
    if (el) el.textContent = teams ? "대기 " + teams + "팀" : "입장";
    if (remain <= 0 && !roof.inside) {
      roof.inside = true;
      roof.waitUntil = 0;
      enqueue(["대기가 끝났습니다. 앞사람들은 이미 통장을 지키러 갔습니다."]);
    }
  }

  function updateConcert(now) {
    if (!concert) return;
    const bar = document.getElementById("concertBar");
    if (bar) {
      const p = Math.max(0, Math.min(1, 1 - (concert.until - now) / (concert.dur * 1000)));
      bar.style.width = (p * 100) + "%";
    }
    if (now >= concert.until) {
      concert = null;
      if (modal && modal.type === "concert") closeModal();
    }
  }

  function titleRound(time) {
    const u = (time % 10) / 10;
    return u > 0.55 && u < 0.82 ? 5 : 1;
  }

  function loop(now) {
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0);
    last = now;
    if (mode === "title") {
      const round = titleRound(now / 1000);
      const view = { room: "cafe", round: round, time: now / 1000, emotion: round === 5 ? 8 : 0, money: 5000, concertOn: false, crying: false, roofInside: false };
      scenes.step(dt, view);
      scenes.draw(titleCtx, view);
      if (round !== titleRoundShown) {
        titleRoundShown = round;
        const hint = document.getElementById("titleHint");
        if (hint) hint.textContent = round >= 5 ? "포장이 벗겨진 카페." : "아직은 화사한 꽃밭입니다.";
      }
    } else {
      const view = {
        room: room,
        round: L.roundOf(state),
        time: now / 1000,
        emotion: state.emotion,
        money: state.money,
        concertOn: !!concert,
        crying: now < cryUntil,
        roofInside: roof.inside,
      };
      scenes.step(dt, view);
      scenes.draw(ctx, view);
      if (chore && chore.type === "mop") updateMop(now);
      if (chore && chore.type === "weed") updateWeed(now);
      if (chore && chore.type === "spring") updateSpring(dt);
      updateBasement(now);
      updateRoof(now);
      updateConcert(now);
    }
    requestAnimationFrame(loop);
  }

  document.body.addEventListener("click", function (e) {
    const btn = e.target.closest("[data-act]");
    if (!btn || btn.disabled) return;
    onAct(btn.dataset.act, btn.dataset);
  });

  document.getElementById("dialogBox").addEventListener("click", function (e) {
    if (e.target.closest("button")) return;
    if (talking) advance();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal) {
      if (chore) finishChore(false);
      else if (modal.type === "concert") stopConcert();
      else closeModal();
    } else if (e.key === "Enter" && talking) {
      advance();
    } else if (e.code === "Space" && chore && chore.type === "mop") {
      e.preventDefault();
      mopHit();
    }
  });

  window.addEventListener("pointerdown", function (e) {
    if (e.target.closest("#windBtn") && chore && chore.type === "spring") chore.holding = true;
  });
  window.addEventListener("pointerup", function () {
    if (chore && chore.type === "spring") releaseSpring();
  });

  document.getElementById("muteBtn").addEventListener("click", function (e) {
    e.stopPropagation();
    audio.unlock();
    audio.setMuted(!audio.isMuted());
    renderHud();
  });

  showTitle();
  requestAnimationFrame(loop);

  if ((location.protocol === "http:" || location.protocol === "https:") && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  }
})();
