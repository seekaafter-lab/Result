(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CafeLogic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CHORE_PAY = 2000;
  const START_MONEY = 5000;
  const GARDENER_AT = 30000;
  const TIER_BALLAD = 7000;
  const TIER_REQUIEM = 14000;
  const VISITS_FOR_WEED = 3;
  const GOODS_FOR_BUD = 2;
  const BASEMENT_FOR_LILY = 3;

  const TRACKS = {
    waltz: {
      id: "waltz",
      style: "경쾌한 왈츠",
      title: "종달새의 맑은 한도 초과 알림음",
    },
    ballad: {
      id: "ballad",
      style: "아련한 발라드",
      title: "월요일 오전 8시 59분에 울리는 햇살의 속삭임",
    },
    requiem: {
      id: "requiem",
      style: "장엄한 레퀴엠",
      title: "통장 잔고를 바라보는 자연의 한숨 소리",
    },
  };

  const MENU = [
    { id: "cookie", name: "철모 쿠키", price: 2600, minRound: 1, pretty: "바삭한 규율 한 조각", truth: "밀가루와 설탕입니다. 규율은 이름값입니다." },
    { id: "americano", name: "뱀굴 아메리카노", price: 3200, minRound: 1, pretty: "쓴맛만 정직하게 남겼습니다", truth: "원두는 평범하고, 이름만 어둡습니다." },
    { id: "latte", name: "꽃밭 라떼", price: 4800, minRound: 1, pretty: "봄을 한 잔에 담았습니다", truth: "봄은 시럽입니다. 꽃은 색소입니다." },
    { id: "ade", name: "눈물의 에이드", price: 5200, minRound: 1, pretty: "상큼한 감정 방출", truth: "레몬과 탄산. 눈물은 손님 몫입니다." },
    { id: "croffle", name: "월요일 크로플", price: 4200, minRound: 2, pretty: "오전 8시 59분의 바삭함", truth: "출근 전에 먹기엔 이미 늦었습니다." },
    { id: "mocha", name: "레퀴엠 모카", price: 7600, minRound: 2, pretty: "달콤한 작별 인사", truth: "초콜릿으로 덮은 잔고 장례식입니다." },
    { id: "souffle", name: "야생 수플레", price: 8800, minRound: 3, pretty: "부풀어 오른 용기", truth: "식으면 꺼집니다. 인간성도 그렇게 보류됩니다." },
    { id: "tea", name: "침묵 티", price: 9800, minRound: 4, pretty: "아무것도 하지 않는 향", truth: "뜨거운 물입니다. 값은 침묵보다 비쌉니다." },
    { id: "parfait", name: "화성 꽃밭 파르페", price: 14000, minRound: 5, pretty: "루프탑에서만 피는 디저트", truth: "화성에 꽃은 없습니다. 층만 높습니다." },
  ];

  const GOODS = [
    {
      id: "beast",
      name: "짐승 합격 스티커",
      price: 3000,
      minRound: 1,
      blurb: "오늘도 야생성 장착, 인간성은 보류!",
      truth: "붙여도 합격증은 안 나옵니다. 야생만 남습니다.",
    },
    {
      id: "cliff",
      name: "낭떠러지 운전 스티커",
      price: 3400,
      minRound: 1,
      blurb: "잠시 후 낭떠러지 입니다! 즐거운 운전 되시길 바랍니다! 💛",
      truth: "목적지는 없습니다. 노란 하트만 진짜입니다.",
    },
    {
      id: "box",
      name: "현실 도피용 멜로디 영수증 오르골",
      price: 12000,
      minRound: 2,
      blurb: "결제 후 남은 영수증을 넣으면, 작은 오르골이 금액에 맞춰 짧은 멜로디를 연주합니다.",
      pitch: "통장 잔고가 불타는 현대예술을 아름다운 음악으로 감상해보세요! 💖",
      truth: "음악은 짧고 영수증은 사라집니다. 잔고는 돌아오지 않습니다.",
    },
    {
      id: "wallet",
      name: "잔고는 불만족,감성은 대만족! 지갑 굿즈",
      price: 11000,
      minRound: 3,
      blurb: "잔고는 불만족,감성은 대만족!",
      truth: "지갑에 붙여도 잔고 칸은 비어 있습니다. 감성 칸만 만석입니다.",
    },
  ];

  const BEAST_MAIN = "오늘도 야생성 장착, 인간성은 보류!";
  const BEAST_EXTRAS = ["대기열에서도 으르렁대기 합격", "인간성 보류 도장", "밤에도 야생입니다"];

  const RANKS = [
    {
      id: "sprout",
      name: "새싹",
      round: 1,
      need: "첫 방문",
      benefit: "감정 3%를 넘기면 매장 밖 꽃밭으로 안내합니다.",
      line: "새싹은 예쁘습니다. 예쁘다는 말이 제일 싼 서비스입니다.",
      check: function () { return true; },
    },
    {
      id: "weed",
      name: "잡초",
      round: 2,
      need: "이번 달 결제 3회",
      benefit: "영수증 오르골 레퀴엠 1회 무료 재생",
      line: "세 번 결제하셨습니다. 잡초는 뽑히지 않습니다. 손님만 뽑힙니다.",
      check: function (s) { return s.paidVisits >= VISITS_FOR_WEED; },
    },
    {
      id: "bud",
      name: "꽃망울",
      round: 3,
      need: "굿즈 2종류 이상 구매",
      benefit: "짐승 합격 스티커 랜덤 증정",
      line: "굿즈가 두 개. 꽃은 아직 안 피었고, 통장만 피었습니다.",
      check: function (s) { return purchasedKinds(s) >= GOODS_FOR_BUD; },
    },
    {
      id: "lily",
      name: "은방울꽃",
      round: 4,
      need: "별들의 보석함 3회 입장",
      benefit: "멍 때리고 아무것도 하지 않을 권리 12분 연장",
      line: "은방울꽃은 예쁘고 독이 있습니다. 지하에서 아무것도 안 해도 됩니다. 12분 더.",
      check: function (s) { return s.basementVisits >= BASEMENT_FOR_LILY; },
    },
    {
      id: "gardener",
      name: "정원사",
      round: 5,
      need: "본인도 이유를 모를 만큼 결제 (누적 30,000원)",
      benefit: "루프탑 화성 꽃밭 우선 입장",
      line: "왜 이 등급인지 모르셔도 됩니다. 결제가 대신 기억합니다.",
      check: function (s) { return s.totalSpent >= GARDENER_AT; },
    },
  ];

  const INTRO = [
    { who: "상병 꽃순이", text: "고객님, 불편을 드려 기쁘게 생각합니다! 😊" },
    { who: "상병 꽃순이", text: "여기는 「저는 봄이 와도 꽃을 볼 수 없답니다」. 속은 시커먼 뱀굴이지만 겉은 화사한 꽃밭입니다 🌸" },
    { who: "상병 꽃순이", text: "손님은 주문하시고, 감동하시고, 통장을 바치시면 됩니다. 잔고는 안 오르고, 등급만 오릅니다." },
    { who: "상병 꽃순이", text: "시작 잔고는 5,000원입니다. 모자라면 소일거리. 눈물 걸레, 잡초, 태엽. 한 번에 2,000원. 짜게 드립니다. 일부러요." },
  ];

  const TALKS = {
    1: [
      "고객님, 불편을 드려 기쁘게 생각합니다! 😊",
      "낮은 등급에선 아름다운 거짓을 드립니다. 높은 등급에선 그 포장 속의 진실을, 조금 기묘한 혜택으로 돌려드립니다.",
      "영수증은 합계만 기억합니다. 여러 개를 담아도 오르골은 합계만 보고 노래를 고릅니다.",
      "감정은 3%만 넘어도 넘친 겁니다. 기준이 낮은 게 아니라, 카페가 솔직한 겁니다.",
    ],
    2: [
      "레퀴엠 모카와 월요일 크로플이 올라왔습니다. 더 비쌉니다. 그게 신메뉴의 성의입니다.",
      "잡초 등급 혜택으로 레퀴엠을 한 번 공짜로 틀어 드립니다. 잔고 장례식은 셀프입니다.",
      "오르골 실물도 입고됐습니다. 카운터 진열용으로도 영수증은 넣을 수 있습니다. 실물은 가져가는 값입니다.",
    ],
    3: [
      "꽃망울입니다. 아직 안 피었습니다. 피면 가격이 보입니다.",
      "야생 수플레는 부풀었다가 꺼집니다. 인간성은 처음부터 보류였습니다.",
      "지갑 굿즈는 잔고를 채워 주지 않습니다. 감성만 만석으로 만들어 드립니다.",
    ],
    4: [
      "지하를 세 번 견디셨습니다. 은방울꽃은 꽃집에선 예쁘고, 여기선 독입니다.",
      "멍 때릴 권리가 12분 늘었습니다. 아무것도 안 하는 데 성공하십시오.",
      "침묵 티는 조용하고 비쌉니다. 말이 없는 대신 가격표가 말합니다.",
    ],
    5: [
      "정원사 등급입니다. 왜인지는 통장 내역에 있습니다. 읽지 않으셔도 됩니다.",
      "루프탑은 화성 꽃밭입니다. 우선 입장. 꽃의 원산지는 저희 창고입니다.",
      "잔고는 그대로입니다. 등급만 여기까지 왔습니다. 조금 개운하면, 그게 회복입니다 🌸",
    ],
  };

  const CHORE_SUCCESS = [
    "2,000원입니다. 통장이 잠깐 숨을 쉽니다.",
    "이 돈이 오르골 앞에서 얼마나 버틸지 보겠습니다.",
    "고생하셨으면, 이제 그 돈을 아름답게 버리십시오.",
  ];

  const HELP = [
    "당신은 손님입니다. 카페는 꽃밭의 군인들이 운영합니다.",
    "시작 잔고는 5,000원입니다. 소일거리를 마치면 2,000원이 생깁니다. 쉽게는 안 줍니다.",
    "메뉴와 굿즈를 여러 개 담으면, 영수증에는 항목과 함께 합계가 찍힙니다. 오르골은 그 합계만 봅니다.",
    "7,000원 미만은 경쾌한 왈츠, 종달새의 한도 초과 알림음. 7,000원 이상은 아련한 발라드, 들릴 듯 말 듯한 월요일 알람. 14,000원 이상은 장엄한 레퀴엠, 잔고를 보는 한숨.",
    "등급이 오르면 라운드가 1, 2, 3… 으로 넘어갑니다. 신메뉴와 굿즈가 나오고, 카페는 포장을 조금씩 벗습니다.",
    "새싹은 첫 방문. 잡초는 결제 3회. 꽃망울은 굿즈 2종류. 은방울꽃은 지하 3회. 정원사는 누적 30,000원.",
    "잔고는 오르지 않습니다. 등급만 오릅니다.",
    "아이폰에서는 사파리의 공유 버튼에서 홈 화면에 추가를 고르면 아이콘으로 열립니다. 스토어에 올리는 앱은 아닙니다.",
  ];

  function createState() {
    return {
      v: 1,
      money: START_MONEY,
      totalSpent: 0,
      paidVisits: 0,
      basementVisits: 0,
      rank: 0,
      emotion: 0,
      purchased: {},
      gifted: {},
      wildExtras: [],
      receipts: [],
      requiemTokens: 0,
      rewind: null,
      applied: {},
      criedOnce: false,
      gardenLined: false,
      gardenDryLine: false,
      roofWarned: false,
      roofGreeted: false,
      basementIntro: false,
      announced: null,
      chores: 0,
      nothingClicks: 0,
      photos: 0,
      nextId: 1,
      cart: emptyCart(),
    };
  }

  function emptyCart() {
    return { menu: {}, goods: {} };
  }

  function normalize(data) {
    if (!data || data.v !== 1) return null;
    const fresh = createState();
    Object.keys(fresh).forEach(function (key) {
      if (data[key] === undefined) data[key] = fresh[key];
    });
    if (!data.cart.menu) data.cart.menu = {};
    if (!data.cart.goods) data.cart.goods = {};
    return data;
  }

  function roundOf(state) {
    return RANKS[state.rank].round;
  }

  function currentRank(state) {
    return RANKS[state.rank];
  }

  function staff(round) {
    if (round >= 5) return { name: "소위 화분" };
    if (round >= 3) return { name: "병장 진흙" };
    return { name: "상병 꽃순이" };
  }

  function purchasedKinds(state) {
    return GOODS.filter(function (g) { return (state.purchased[g.id] || 0) > 0; }).length;
  }

  function owns(state, id) {
    return (state.purchased[id] || 0) + (state.gifted[id] || 0) > 0;
  }

  function showTruth(state) {
    return state.rank >= 3;
  }

  function tierForTotal(total) {
    if (total >= TIER_REQUIEM) return "requiem";
    if (total >= TIER_BALLAD) return "ballad";
    return "waltz";
  }

  function trackOf(totalOrTier) {
    const id = typeof totalOrTier === "number" ? tierForTotal(totalOrTier) : totalOrTier;
    return TRACKS[id];
  }

  function findMenu(id) {
    return MENU.find(function (m) { return m.id === id; }) || null;
  }

  function findGood(id) {
    return GOODS.find(function (g) { return g.id === id; }) || null;
  }

  function addToCart(state, kind, id, delta) {
    const round = roundOf(state);
    if (kind === "menu") {
      const item = findMenu(id);
      if (!item || item.minRound > round) return false;
      const next = (state.cart.menu[id] || 0) + delta;
      if (next <= 0) delete state.cart.menu[id];
      else if (next > 4) return false;
      else state.cart.menu[id] = next;
      return true;
    }
    const good = findGood(id);
    if (!good || good.minRound > round) return false;
    if (owns(state, id)) return false;
    const nextG = (state.cart.goods[id] || 0) + delta;
    if (nextG <= 0) delete state.cart.goods[id];
    else if (nextG > 1) return false;
    else state.cart.goods[id] = 1;
    return true;
  }

  function cartSummary(state) {
    const lines = [];
    let total = 0;
    MENU.forEach(function (item) {
      const qty = state.cart.menu[item.id] || 0;
      if (!qty) return;
      lines.push({ id: item.id, kind: "menu", name: item.name, price: item.price, qty: qty });
      total += item.price * qty;
    });
    GOODS.forEach(function (item) {
      const qty = state.cart.goods[item.id] || 0;
      if (!qty) return;
      lines.push({ id: item.id, kind: "goods", name: item.name, price: item.price, qty: 1 });
      total += item.price;
    });
    return { lines: lines, total: total, tier: total ? tierForTotal(total) : null };
  }

  function addEmotion(state, total) {
    const before = state.emotion;
    const gain = Math.round(total / 10) / 100;
    state.emotion = Math.min(99.9, Math.round((state.emotion + gain) * 10) / 10);
    return { before: before, after: state.emotion, crossed: before < 3 && state.emotion >= 3 };
  }

  function applyCheckout(state) {
    const summary = cartSummary(state);
    if (!summary.lines.length) return { ok: false, error: "empty" };
    if (summary.total > state.money) return { ok: false, error: "money" };
    const round = roundOf(state);
    for (let i = 0; i < summary.lines.length; i += 1) {
      const line = summary.lines[i];
      if (line.kind === "goods") {
        if (owns(state, line.id)) return { ok: false, error: "owned" };
        const good = findGood(line.id);
        if (!good || good.minRound > round) return { ok: false, error: "locked" };
      } else {
        const item = findMenu(line.id);
        if (!item || item.minRound > round) return { ok: false, error: "locked" };
      }
    }
    state.money -= summary.total;
    state.totalSpent += summary.total;
    state.paidVisits += 1;
    const emotion = addEmotion(state, summary.total);
    summary.lines.forEach(function (line) {
      if (line.kind === "goods") state.purchased[line.id] = (state.purchased[line.id] || 0) + 1;
    });
    const receipt = {
      id: "r" + state.nextId,
      lines: summary.lines.map(function (line) {
        return { id: line.id, kind: line.kind, name: line.name, price: line.price, qty: line.qty };
      }),
      total: summary.total,
      tier: summary.tier,
      round: round,
    };
    state.nextId += 1;
    state.receipts.push(receipt);
    state.cart = emptyCart();
    return {
      ok: true,
      receipt: receipt,
      crossed: emotion.crossed,
      emotionBefore: emotion.before,
      emotionAfter: emotion.after,
    };
  }

  function takeReceipt(state, id) {
    const index = state.receipts.findIndex(function (r) { return r.id === id; });
    if (index < 0) return null;
    return state.receipts.splice(index, 1)[0];
  }

  function promotionReady(state) {
    if (state.rank >= RANKS.length - 1) return null;
    const next = RANKS[state.rank + 1];
    return next.check(state) ? next : null;
  }

  function applyPromotion(state, rng) {
    const random = rng || Math.random;
    const next = promotionReady(state);
    if (!next) return null;
    state.rank += 1;
    const grant = { rank: RANKS[state.rank], id: next.id, extra: null, line: "", main: "" };
    if (next.id === "weed") {
      state.requiemTokens += 1;
      grant.extra = "requiem";
    } else if (next.id === "bud") {
      const extra = BEAST_EXTRAS[Math.floor(random() * BEAST_EXTRAS.length) % BEAST_EXTRAS.length];
      state.gifted.beast = (state.gifted.beast || 0) + 1;
      state.wildExtras.push(extra);
      grant.extra = "sticker";
      grant.main = BEAST_MAIN;
      grant.line = extra;
    } else if (next.id === "lily") {
      grant.extra = "time";
    } else if (next.id === "gardener") {
      grant.extra = "roof";
    }
    return grant;
  }

  function progress(state) {
    const next = RANKS[state.rank + 1];
    if (!next) {
      return { label: "정원사. 더 오를 등급은 없고, 결제는 됩니다.", ratio: 1, next: null };
    }
    let ratio = 0;
    let label = next.need;
    if (next.id === "weed") {
      ratio = state.paidVisits / VISITS_FOR_WEED;
      label = "잡초까지 결제 " + state.paidVisits + "/" + VISITS_FOR_WEED;
    } else if (next.id === "bud") {
      ratio = purchasedKinds(state) / GOODS_FOR_BUD;
      label = "꽃망울까지 굿즈 " + purchasedKinds(state) + "/" + GOODS_FOR_BUD;
    } else if (next.id === "lily") {
      ratio = state.basementVisits / BASEMENT_FOR_LILY;
      label = "은방울꽃까지 지하 " + state.basementVisits + "/" + BASEMENT_FOR_LILY;
    } else if (next.id === "gardener") {
      ratio = state.totalSpent / GARDENER_AT;
      label = "정원사까지 바친 돈 " + state.totalSpent + "/" + GARDENER_AT;
    }
    return { label: label, ratio: Math.max(0, Math.min(1, ratio)), next: next };
  }

  function stockOfRound(round) {
    return {
      menu: MENU.filter(function (m) { return m.minRound === round; }),
      goods: GOODS.filter(function (g) { return g.minRound === round; }),
    };
  }

  function choreSuccess(count) {
    return CHORE_SUCCESS[(Math.max(1, count) - 1) % CHORE_SUCCESS.length];
  }

  function choreFail() {
    return "노동이 무너졌습니다. 보상은 0원. 바닥은 그대로고, 자존심만 조금 줄었습니다.";
  }

  function visibleMenu(state) {
    const round = roundOf(state);
    return MENU.filter(function (m) { return m.minRound <= round + 1; });
  }

  function visibleGoods(state) {
    const round = roundOf(state);
    return GOODS.filter(function (g) { return g.minRound <= round + 1; });
  }

  return {
    CHORE_PAY: CHORE_PAY,
    START_MONEY: START_MONEY,
    GARDENER_AT: GARDENER_AT,
    TIER_BALLAD: TIER_BALLAD,
    TIER_REQUIEM: TIER_REQUIEM,
    VISITS_FOR_WEED: VISITS_FOR_WEED,
    GOODS_FOR_BUD: GOODS_FOR_BUD,
    BASEMENT_FOR_LILY: BASEMENT_FOR_LILY,
    TRACKS: TRACKS,
    MENU: MENU,
    GOODS: GOODS,
    RANKS: RANKS,
    INTRO: INTRO,
    TALKS: TALKS,
    HELP: HELP,
    BEAST_MAIN: BEAST_MAIN,
    createState: createState,
    normalize: normalize,
    roundOf: roundOf,
    currentRank: currentRank,
    staff: staff,
    purchasedKinds: purchasedKinds,
    owns: owns,
    showTruth: showTruth,
    tierForTotal: tierForTotal,
    trackOf: trackOf,
    findMenu: findMenu,
    findGood: findGood,
    addToCart: addToCart,
    cartSummary: cartSummary,
    applyCheckout: applyCheckout,
    takeReceipt: takeReceipt,
    promotionReady: promotionReady,
    applyPromotion: applyPromotion,
    progress: progress,
    stockOfRound: stockOfRound,
    choreSuccess: choreSuccess,
    choreFail: choreFail,
    visibleMenu: visibleMenu,
    visibleGoods: visibleGoods,
  };
});
