(function (root) {
  "use strict";

  const LAYOUT = {
    door: { x: 6, y: 36, w: 42, h: 72 },
    board: { x: 54, y: 16, w: 44, h: 42 },
    window: { x: 104, y: 12, w: 78, h: 44 },
    barista: { x: 132, y: 44, w: 36, h: 58 },
    counter: { x: 108, y: 98, w: 124, h: 36 },
    box: { x: 196, y: 78, w: 28, h: 22 },
    shelf: { x: 228, y: 26, w: 62, h: 78 },
    ladder: { x: 298, y: 6, w: 18, h: 56 },
    hatch: { x: 8, y: 124, w: 48, h: 48 },
    player: { x: 78, y: 126 },
  };

  const petals = [];
  const steams = [];
  let stars = null;

  function mix(a, b, t) {
    const pa = parseInt(a.slice(1), 16);
    const pb = parseInt(b.slice(1), 16);
    const ar = (pa >> 16) & 255;
    const ag = (pa >> 8) & 255;
    const ab = pa & 255;
    const br = (pb >> 16) & 255;
    const bg = (pb >> 8) & 255;
    const bb = pb & 255;
    const r = Math.round(ar + (br - ar) * t);
    const g = Math.round(ag + (bg - ag) * t);
    const bl = Math.round(ab + (bb - ab) * t);
    return "rgb(" + r + "," + g + "," + bl + ")";
  }

  function palette(round) {
    const t = Math.max(0, Math.min(1, (round - 1) / 4));
    return {
      t: t,
      wall: mix("#f6d5c6", "#3a2a32", t * 0.72),
      stripe: mix("#f3c3cf", "#2c2028", t * 0.72),
      floor: mix("#d39274", "#3a2428", t * 0.62),
      floorAlt: mix("#c48468", "#2a1a20", t * 0.62),
      wood: mix("#b67a49", "#5a382c", t * 0.45),
      woodDark: mix("#7c4a2e", "#3a241c", t * 0.5),
      leaf: mix("#6ea85a", "#3d4a38", t * 0.75),
      flower: mix("#ff8fab", "#6a3048", t * 0.7),
      flower2: mix("#ffd36b", "#8a7040", t * 0.6),
      sky: mix("#f8c9d6", "#241c2c", t * 0.82),
      sky2: mix("#ffe3bf", "#3a2a38", t * 0.78),
      helmet: mix("#738255", "#3e4634", t * 0.55),
      helmetDark: mix("#3f4a32", "#241c18", t * 0.4),
      uniform: mix("#2f6a4a", "#243028", t * 0.45),
      skin: "#f3c2a4",
      ink: "#241418",
      apron: mix("#fff6ea", "#c8b0a4", t * 0.35),
      grass: mix("#8fce78", "#3e4a32", t * 0.7),
      grassDark: mix("#69a85a", "#2a3324", t * 0.7),
    };
  }

  function R(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, w | 0, h | 0);
  }

  function ensureStars() {
    if (stars) return;
    stars = [];
    for (let i = 0; i < 48; i += 1) {
      stars.push({
        x: (i * 53) % 320,
        y: (i * 37) % 150,
        s: i % 5 === 0 ? 2 : 1,
        p: (i % 7) * 0.4,
      });
    }
  }

  function step(dt, view) {
    const room = view.room;
    const lively = room === "cafe" || room === "garden";
    if (lively && petals.length < 16) {
      petals.push({
        x: Math.random() * 320,
        y: -4,
        v: 10 + Math.random() * 16,
        s: Math.random() > 0.5 ? 2 : 3,
        drift: Math.random() * 6 - 3,
        c: Math.random() > 0.5 ? 0 : 1,
      });
    }
    for (let i = petals.length - 1; i >= 0; i -= 1) {
      const p = petals[i];
      p.y += p.v * dt;
      p.x += p.drift * dt;
      if (p.y > 180) petals.splice(i, 1);
    }
    if (room === "cafe" && steams.length < 8 && Math.random() < dt * 6) {
      steams.push({ x: 150 + Math.random() * 8, y: 96, v: 8 + Math.random() * 6 });
    }
    for (let j = steams.length - 1; j >= 0; j -= 1) {
      steams[j].y -= steams[j].v * dt;
      steams[j].x += Math.sin(steams[j].y * 0.2) * 4 * dt;
      if (steams[j].y < 70) steams.splice(j, 1);
    }
  }

  function drawFlower(ctx, x, y, pal, wilt) {
    const c = wilt ? pal.flower : pal.flower;
    R(ctx, x + 2, y + 4, 2, 4, pal.leaf);
    R(ctx, x, y + 2, 3, 3, c);
    R(ctx, x + 3, y + 2, 3, 3, c);
    R(ctx, x + 1, y, 4, 3, pal.flower2);
    R(ctx, x + 2, y + 2, 2, 2, "#fff6ea");
  }

  function drawSnake(ctx, x, y, pal) {
    R(ctx, x, y + 4, 16, 5, "#1a1214");
    R(ctx, x + 12, y + 2, 8, 8, "#1a1214");
    R(ctx, x + 16, y + 4, 2, 2, "#f6e27a");
    R(ctx, x + 14, y, 4, 3, pal.flower);
    R(ctx, x + 15, y + 1, 2, 1, pal.flower2);
  }

  function drawBarista(ctx, x, y, pal, time) {
    const bob = Math.round(Math.sin(time * 1.6) * 1);
    const yy = y + bob;
    const blink = Math.sin(time * 1.3) > 0.97;
    R(ctx, x + 6, yy + 52, 24, 4, "rgba(20,10,14,0.25)");
    R(ctx, x + 6, yy + 44, 8, 8, "#241418");
    R(ctx, x + 20, yy + 44, 8, 8, "#241418");
    R(ctx, x + 8, yy + 30, 6, 16, pal.uniform);
    R(ctx, x + 20, yy + 30, 6, 16, pal.uniform);
    R(ctx, x + 4, yy + 18, 26, 16, pal.uniform);
    R(ctx, x + 8, yy + 22, 16, 14, pal.apron);
    R(ctx, x + 20, yy + 20, 5, 5, pal.flower);
    R(ctx, x + 21, yy + 19, 3, 2, pal.flower2);
    R(ctx, x, yy + 22, 5, 12, pal.skin);
    R(ctx, x + 29, yy + 22, 5, 12, pal.skin);
    R(ctx, x + 5, yy + 2, 24, 16, pal.helmet);
    R(ctx, x + 2, yy + 8, 30, 10, pal.helmet);
    R(ctx, x, yy + 16, 34, 4, pal.helmetDark);
    R(ctx, x + 8, yy + 4, 8, 3, "rgba(255,255,255,0.35)");
    R(ctx, x + 9, yy + 12, 16, 8, pal.skin);
    R(ctx, x + 10, yy + 18, 4, 2, "#e89a9a");
    R(ctx, x + 20, yy + 18, 4, 2, "#e89a9a");
    if (blink) {
      R(ctx, x + 12, yy + 15, 4, 2, pal.ink);
      R(ctx, x + 19, yy + 15, 4, 2, pal.ink);
    } else {
      R(ctx, x + 12, yy + 14, 3, 3, pal.ink);
      R(ctx, x + 20, yy + 14, 3, 3, pal.ink);
    }
    R(ctx, x + 15, yy + 18, 5, 1, pal.ink);
  }

  function drawCustomer(ctx, x, y, view, pal) {
    const bob = Math.round(Math.sin(view.time * 2) * 1);
    const yy = y + bob;
    const blink = Math.sin(view.time * 1.7) > 0.98;
    R(ctx, x + 4, yy + 40, 20, 3, "rgba(20,10,14,0.25)");
    R(ctx, x + 5, yy + 34, 6, 6, "#3a2a32");
    R(ctx, x + 15, yy + 34, 6, 6, "#3a2a32");
    R(ctx, x + 6, yy + 22, 5, 14, "#5c4a55");
    R(ctx, x + 15, yy + 22, 5, 14, "#5c4a55");
    R(ctx, x + 4, yy + 14, 18, 12, "#fff6ea");
    R(ctx, x + 6, yy + 16, 14, 8, "#f0b7c4");
    R(ctx, x, yy + 16, 4, 10, pal.skin);
    R(ctx, x + 22, yy + 16, 4, 10, pal.skin);
    const walletW = view.money < 2000 ? 5 : view.money < 5000 ? 8 : 11;
    R(ctx, x + 22, yy + 22, walletW, 5, "#c4556a");
    R(ctx, x + 6, yy + 2, 14, 10, "#3a2a32");
    R(ctx, x + 5, yy + 6, 16, 10, pal.skin);
    R(ctx, x + 4, yy + 4, 18, 4, "#3a2a32");
    if (view.round >= 5) {
      R(ctx, x + 8, yy, 4, 3, pal.flower);
      R(ctx, x + 13, yy - 1, 4, 3, pal.flower2);
    }
    if (blink) {
      R(ctx, x + 8, yy + 10, 3, 1, pal.ink);
      R(ctx, x + 15, yy + 10, 3, 1, pal.ink);
    } else {
      R(ctx, x + 8, yy + 9, 2, 2, pal.ink);
      R(ctx, x + 15, yy + 9, 2, 2, pal.ink);
    }
    if (view.crying) {
      R(ctx, x + 8, yy + 12, 1, 3, "#8ec8e8");
      R(ctx, x + 16, yy + 12, 1, 3, "#8ec8e8");
    }
  }

  function drawMusicBox(ctx, x, y, pal, spinning) {
    R(ctx, x, y + 6, 26, 14, pal.wood);
    R(ctx, x + 2, y + 8, 22, 8, pal.woodDark);
    R(ctx, x + 4, y + 10, 3, 3, pal.flower);
    R(ctx, x + 10, y + 11, 2, 2, "#fff6ea");
    R(ctx, x + 14, y + 11, 2, 2, "#fff6ea");
    R(ctx, x + 18, y + 11, 2, 2, "#fff6ea");
    const ang = spinning ? Date.now() / 80 : 0.4;
    const cx = x + 24;
    const cy = y + 8;
    R(ctx, cx, cy, 3, 3, "#d7c4a4");
    R(ctx, cx + Math.round(Math.cos(ang) * 5), cy + Math.round(Math.sin(ang) * 4), 4, 2, "#efe4d4");
  }

  function drawCafe(ctx, view) {
    const pal = palette(view.round);
    R(ctx, 0, 0, 320, 180, pal.wall);
    for (let y = 0; y < 108; y += 8) {
      if ((y / 8) % 2 === 0) R(ctx, 0, y, 320, 4, pal.stripe);
    }
    for (let y = 108; y < 180; y += 8) {
      for (let x = 0; x < 320; x += 8) {
        R(ctx, x, y, 8, 8, ((x + y) / 8) % 2 === 0 ? pal.floor : pal.floorAlt);
      }
    }
    const win = LAYOUT.window;
    R(ctx, win.x - 2, win.y - 2, win.w + 4, win.h + 4, pal.woodDark);
    R(ctx, win.x, win.y, win.w, win.h, pal.sky);
    R(ctx, win.x, win.y + win.h - 10, win.w, 10, pal.grass);
    for (let i = 0; i < 5; i += 1) drawFlower(ctx, win.x + 6 + i * 14, win.y + 18, pal, view.round > 3);
    R(ctx, win.x + win.w / 2, win.y, 2, win.h, "rgba(255,246,234,0.45)");

    const door = LAYOUT.door;
    R(ctx, door.x, door.y, door.w, door.h, pal.wood);
    R(ctx, door.x + 4, door.y + 4, door.w - 8, door.h - 16, view.emotion >= 3 ? pal.flower : pal.woodDark);
    R(ctx, door.x + door.w - 10, door.y + 36, 3, 3, "#ffd36b");
    if (view.emotion >= 3) {
      R(ctx, door.x + door.w, door.y + 8, 3, 3, pal.flower2);
    }

    const board = LAYOUT.board;
    R(ctx, board.x, board.y, board.w, board.h, "#2a4034");
    R(ctx, board.x + 4, board.y + 6, board.w - 8, 3, "#efe4d4");
    R(ctx, board.x + 4, board.y + 14, board.w - 12, 3, "#efe4d4");
    R(ctx, board.x + 4, board.y + 22, board.w - 16, 3, "#efe4d4");
    R(ctx, board.x + 6, board.y + 30, 10, 6, "#c4556a");

    const counter = LAYOUT.counter;
    R(ctx, counter.x, counter.y + 8, counter.w, counter.h - 8, pal.woodDark);
    R(ctx, counter.x, counter.y, counter.w, 10, pal.wood);
    R(ctx, counter.x + 18, counter.y - 4, 10, 6, "#fff6ea");
    R(ctx, counter.x + 20, counter.y - 8, 6, 4, pal.flower);
    steams.forEach(function (s) {
      R(ctx, s.x, s.y, 2, 2, "rgba(255,246,234,0.8)");
    });

    drawMusicBox(ctx, LAYOUT.box.x, LAYOUT.box.y, pal, !!view.concertOn);

    const shelf = LAYOUT.shelf;
    R(ctx, shelf.x, shelf.y, shelf.w, shelf.h, pal.woodDark);
    R(ctx, shelf.x + 2, shelf.y + 16, shelf.w - 4, 3, pal.wood);
    R(ctx, shelf.x + 2, shelf.y + 40, shelf.w - 4, 3, pal.wood);
    R(ctx, shelf.x + 6, shelf.y + 4, 12, 12, "#f0b7c4");
    R(ctx, shelf.x + 22, shelf.y + 6, 14, 10, "#ffd36b");
    R(ctx, shelf.x + 42, shelf.y + 4, 16, 12, pal.uniform);
    R(ctx, shelf.x + 8, shelf.y + 24, 18, 14, pal.wood);
    R(ctx, shelf.x + 32, shelf.y + 26, 16, 12, "#c4556a");

    const hatch = LAYOUT.hatch;
    R(ctx, hatch.x, hatch.y, hatch.w, hatch.h, "#3a241c");
    R(ctx, hatch.x + 4, hatch.y + 4, hatch.w - 8, hatch.h - 8, "#1a1218");
    R(ctx, hatch.x + 8, hatch.y + 16, hatch.w - 16, 4, "#738255");
    for (let i = 0; i < 3; i += 1) R(ctx, hatch.x + 10, hatch.y + 8 + i * 10, 4, 2, "#d7c4a4");

    const ladder = LAYOUT.ladder;
    R(ctx, ladder.x, ladder.y, 4, ladder.h + 20, pal.woodDark);
    R(ctx, ladder.x + ladder.w - 4, ladder.y, 4, ladder.h + 20, pal.woodDark);
    R(ctx, ladder.x, ladder.y + 8, ladder.w, 3, pal.wood);
    R(ctx, ladder.x, ladder.y + 18, ladder.w, 3, pal.wood);

    drawBarista(ctx, LAYOUT.barista.x, LAYOUT.barista.y, pal, view.time);

    const rugX = 86;
    const rugY = 154;
    if (view.round < 4) {
      R(ctx, rugX, rugY, 150, 16, view.round === 1 ? "#e7a0b4" : "#b56d84");
      for (let i = 0; i < 6; i += 1) {
        R(ctx, rugX + 8 + i * 24, rugY + 4, 5, 5, i % 2 ? pal.flower2 : "#fff6ea");
      }
      if (view.round >= 3) {
        R(ctx, rugX + 20, rugY + 6, 18, 4, "rgba(20,10,14,0.45)");
      }
    } else {
      R(ctx, rugX + 16, rugY + 6, 140, 8, "#1a1214");
      R(ctx, rugX, rugY + 2, 18, 14, "#1a1214");
      R(ctx, rugX + 4, rugY + 6, 3, 3, "#f6e27a");
      R(ctx, rugX + 2, rugY - 2, 6, 5, pal.flower);
      R(ctx, rugX + 120, rugY + 4, 10, 6, "#1a1214");
    }

    drawCustomer(ctx, LAYOUT.player.x, LAYOUT.player.y, view, pal);

    petals.forEach(function (p) {
      R(ctx, p.x, p.y, p.s, p.s, p.c ? pal.flower : "#fff6ea");
    });

    if (view.round >= 5) {
      drawSnake(ctx, 250, 150, pal);
    }
  }

  function drawGarden(ctx, view) {
    const pal = palette(view.round);
    R(ctx, 0, 0, 320, 110, pal.sky);
    R(ctx, 0, 70, 320, 40, pal.sky2);
    R(ctx, 0, 108, 320, 72, pal.grass);
    for (let y = 108; y < 180; y += 8) {
      for (let x = 0; x < 320; x += 16) {
        if (((x + y) / 8) % 4 === 0) R(ctx, x, y, 4, 3, pal.grassDark);
      }
    }
    R(ctx, 36, 118, 70, 10, pal.wood);
    R(ctx, 40, 128, 6, 22, pal.woodDark);
    R(ctx, 96, 128, 6, 22, pal.woodDark);
    R(ctx, 18, 86, 6, 40, pal.woodDark);
    R(ctx, 8, 78, 40, 16, "#fff6ea");
    R(ctx, 12, 82, 32, 4, pal.flower);

    const count = view.round >= 5 ? 8 : 11;
    for (let i = 0; i < count; i += 1) {
      const x = 130 + (i % 6) * 28;
      const y = 120 + Math.floor(i / 6) * 24;
      if (view.round >= 5 && i % 2 === 0) drawSnake(ctx, x, y, pal);
      else drawFlower(ctx, x, y, pal, view.round >= 4);
    }
    if (view.round >= 4) {
      for (let i = 0; i < 4; i += 1) drawSnake(ctx, 20 + i * 26, 150, pal);
    }
    drawCustomer(ctx, 168, 128, view, pal);
    if (view.crying) {
      for (let i = 0; i < 8; i += 1) {
        R(ctx, 60 + (i * 17) % 40, 150 + (i % 3) * 6, 2, 3, "#8ec8e8");
      }
    }
    petals.forEach(function (p) {
      R(ctx, p.x, p.y, p.s, p.s, p.c ? pal.flower : "#fff6ea");
    });
  }

  function drawBasement(ctx, view) {
    ensureStars();
    R(ctx, 0, 0, 320, 180, "#100e18");
    stars.forEach(function (star) {
      const on = Math.sin(view.time * 2 + star.p) > -0.2;
      if (!on && star.s === 1) return;
      R(ctx, star.x, star.y, star.s, star.s, star.s === 2 ? "#fff6ea" : "#f6e7b2");
    });
    R(ctx, 138, 108, 44, 28, "#3a2a38");
    R(ctx, 146, 100, 28, 12, "#4a3544");
    R(ctx, 132, 132, 10, 16, "#2a1c24");
    R(ctx, 178, 132, 10, 16, "#2a1c24");
    R(ctx, 230, 70, 8, 40, "#d7c4a4");
    R(ctx, 226, 64, 16, 8, "#f6e7b2");
    R(ctx, 228, 78, 12, 4, "rgba(246,231,178,0.35)");
    const pal = palette(5);
    drawCustomer(ctx, 96, 112, view, pal);
  }

  function drawRoof(ctx, view) {
    const pal = palette(Math.max(view.round, 4));
    R(ctx, 0, 0, 320, 100, "#e7a07a");
    R(ctx, 0, 60, 320, 40, "#f0c2a0");
    R(ctx, 0, 100, 320, 80, "#c4543a");
    for (let y = 100; y < 180; y += 8) {
      for (let x = 0; x < 320; x += 8) {
        if (((x / 8) + (y / 8)) % 2 === 0) R(ctx, x, y, 8, 8, "#b84a34");
      }
    }
    R(ctx, 0, 96, 320, 6, "#8d3a2c");
    for (let i = 0; i < 5; i += 1) {
      const x = 150 + i * 28;
      R(ctx, x, 112, 16, 14, "#efe4d4");
      R(ctx, x + 2, 108, 12, 6, "#d7c4a4");
      drawFlower(ctx, x + 4, 96, pal, true);
      R(ctx, x + 6, 100, 2, 2, "rgba(255,255,255,0.8)");
    }
    R(ctx, 36, 108, 36, 28, "#fff6ea");
    R(ctx, 40, 112, 28, 18, "#f0b7c4");
    R(ctx, 48, 136, 4, 18, pal.woodDark);
    R(ctx, 56, 136, 4, 18, pal.woodDark);
    if (!view.roofInside) {
      R(ctx, 70, 150, 180, 4, "#f6e27a");
      for (let i = 0; i < 4; i += 1) {
        R(ctx, 78 + i * 36, 132, 16, 22, "#5c4a55");
        R(ctx, 80 + i * 36, 124, 12, 10, "#3a2a32");
      }
    }
    drawCustomer(ctx, view.roofInside ? 48 : 24, 124, view, pal);
  }

  function draw(ctx, view) {
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, 320, 180);
    if (view.room === "garden") drawGarden(ctx, view);
    else if (view.room === "basement") drawBasement(ctx, view);
    else if (view.room === "roof") drawRoof(ctx, view);
    else drawCafe(ctx, view);
  }

  root.CafeScenes = { draw: draw, step: step, LAYOUT: LAYOUT, palette: palette };
})(typeof globalThis !== "undefined" ? globalThis : this);
