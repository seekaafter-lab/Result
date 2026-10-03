(function (root) {
  "use strict";

  function CafeAudio() {
    let ctx = null;
    let pre = null;
    let analyser = null;
    let noiseBuffer = null;
    let live = [];
    let muted = false;

    function ac() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
        pre = ctx.createGain();
        pre.gain.value = 0.9;
        analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -16;
        comp.knee.value = 18;
        comp.ratio.value = 3.2;
        comp.attack.value = 0.01;
        comp.release.value = 0.18;
        pre.connect(comp);
        pre.connect(analyser);
        comp.connect(ctx.destination);
        const len = ctx.sampleRate * 2;
        noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        let brown = 0;
        for (let i = 0; i < len; i += 1) {
          const white = Math.random() * 2 - 1;
          brown = (brown + 0.02 * white) / 1.02;
          data[i] = brown * 3.2;
        }
      }
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }

    function unlock() {
      try { ac(); } catch (err) { /* autoplay lock */ }
    }

    function setMuted(value) {
      muted = !!value;
      if (muted) stopAll();
    }

    function isMuted() {
      return muted;
    }

    function stopAll() {
      live.forEach(function (node) {
        try { node.stop(); } catch (err) { /* already stopped */ }
      });
      live = [];
    }

    function env(time, peak, attack, dur) {
      const g = ac().createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      return g;
    }

    function tone(opts) {
      const c = ac();
      const start = opts.time;
      const o = c.createOscillator();
      const g = env(start, opts.peak || 0.08, opts.attack || 0.02, opts.dur || 0.3);
      o.type = opts.type || "sine";
      if (typeof opts.freq === "number") o.frequency.setValueAtTime(opts.freq, start);
      if (opts.glide) o.frequency.exponentialRampToValueAtTime(Math.max(40, opts.glide), start + (opts.dur || 0.3) * 0.8);
      const dest = opts.dest || pre;
      o.connect(g);
      g.connect(dest);
      o.start(start);
      o.stop(start + (opts.dur || 0.3) + 0.03);
      live.push(o);
    }

    function chirp(time, base) {
      const c = ac();
      const o = c.createOscillator();
      const g = c.createGain();
      const filter = c.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 900;
      o.type = "sine";
      o.frequency.setValueAtTime(base, time);
      o.frequency.exponentialRampToValueAtTime(base * 1.75, time + 0.07);
      o.frequency.exponentialRampToValueAtTime(Math.max(80, base * 1.2), time + 0.16);
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(0.055, time + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, time + 0.2);
      o.connect(filter);
      filter.connect(g);
      g.connect(pre);
      o.start(time);
      o.stop(time + 0.22);
      live.push(o);
    }

    function boxNote(time, freq, dur, peak) {
      tone({ type: "triangle", freq: freq, time: time, dur: dur, peak: peak, attack: 0.012 });
      tone({ type: "sine", freq: freq, time: time + 0.08, dur: dur * 0.7, peak: peak * 0.25, attack: 0.01 });
    }

    function noiseBed(time, dur, peak, fromHz, toHz, type) {
      const c = ac();
      const src = c.createBufferSource();
      src.buffer = noiseBuffer;
      src.loop = true;
      const filter = c.createBiquadFilter();
      filter.type = type || "lowpass";
      filter.Q.value = 0.7;
      filter.frequency.setValueAtTime(fromHz, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, toHz), time + dur);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, time);
      g.gain.exponentialRampToValueAtTime(peak, time + Math.min(0.5, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
      src.connect(filter);
      filter.connect(g);
      g.connect(pre);
      src.start(time);
      src.stop(time + dur + 0.02);
      live.push(src);
    }

    function playWaltz() {
      const c = ac();
      const t0 = c.currentTime + 0.06;
      const beat = 60 / 152;
      const notes = [
        659.25, 783.99, 1046.5,
        987.77, 783.99, 659.25,
        698.46, 880.0, 1046.5,
        987.77, 783.99, 659.25,
        783.99, 1046.5, 1318.5,
        1174.66, 987.77, 783.99,
        1046.5, 659.25, 783.99,
        1046.5, 0, 0,
      ];
      const roots = [196.0, 196.0, 174.61, 196.0, 261.63, 220.0, 261.63, 261.63];
      notes.forEach(function (freq, i) {
        const start = t0 + i * beat;
        if (freq > 0) boxNote(start, freq, beat * 0.9, 0.07);
        if (i % 3 === 0) tone({ type: "sine", freq: roots[Math.floor(i / 3)] || 196, time: start, dur: beat * 0.95, peak: 0.05, attack: 0.02 });
        else tone({ type: "triangle", freq: 392, time: start, dur: beat * 0.35, peak: 0.03, attack: 0.01 });
      });
      [0, 2, 4, 6].forEach(function (bar) {
        const start = t0 + bar * 3 * beat;
        chirp(start, 1680 + bar * 90);
        chirp(start + 0.11, 2140 + bar * 50);
      });
      chirp(t0 + 22 * beat, 2480);
      return 24 * beat + 0.35;
    }

    function playBallad() {
      const c = ac();
      const t0 = c.currentTime + 0.06;
      const notes = [440, 523.25, 659.25, 587.33, 523.25, 440, 493.88, 440, 392, 440];
      notes.forEach(function (freq, i) {
        const start = t0 + i * 1.05;
        boxNote(start, freq, 0.9, 0.04);
        tone({ type: "sine", freq: freq / 2, time: start, dur: 1.0, peak: 0.02, attack: 0.08 });
      });
      noiseBed(t0, 10.6, 0.018, 1800, 900, "highpass");
      for (let i = 0; i < 4; i += 1) {
        const start = t0 + 0.8 + i * 2.45;
        tone({ type: "sine", freq: 740, time: start, dur: 0.07, peak: 0.02, attack: 0.005 });
        tone({ type: "sine", freq: 740, time: start + 0.16, dur: 0.09, peak: 0.016, attack: 0.005 });
      }
      return 10.8;
    }

    function playRequiem() {
      const c = ac();
      const t0 = c.currentTime + 0.05;
      const dur = 12.4;
      noiseBed(t0, dur, 0.045, 720, 220, "lowpass");
      [0.4, 3.6, 7.2, 10.2].forEach(function (at) {
        noiseBed(t0 + at, 1.5, 0.09, 1500, 160, "lowpass");
      });
      tone({ type: "sine", freq: 220, time: t0, dur: dur - 0.2, peak: 0.035, attack: 0.6 });
      tone({ type: "sine", freq: 223, time: t0, dur: dur - 0.2, peak: 0.02, attack: 0.8 });
      tone({ type: "sine", freq: 261.63, time: t0 + 0.4, dur: dur - 0.6, peak: 0.028, attack: 0.8 });
      tone({ type: "sine", freq: 329.63, time: t0 + 1.2, dur: dur - 1.6, peak: 0.02, attack: 1.0 });
      [440, 392, 329.63, 293.66, 261.63, 220].forEach(function (freq, i) {
        boxNote(t0 + 0.6 + i * 1.8, freq, 1.5, 0.045);
      });
      [0, 4.2, 8.4].forEach(function (at) {
        tone({ type: "triangle", freq: 110, time: t0 + at, dur: 2.4, peak: 0.05, attack: 0.05 });
      });
      return dur;
    }

    function play(tier) {
      if (muted) return tier === "requiem" ? 12.4 : tier === "ballad" ? 10.8 : 9.6;
      stopAll();
      if (tier === "requiem") return playRequiem();
      if (tier === "ballad") return playBallad();
      return playWaltz();
    }

    function playRank() {
      if (muted) return;
      const c = ac();
      const t0 = c.currentTime + 0.02;
      [523.25, 659.25, 783.99, 1046.5].forEach(function (freq, i) {
        boxNote(t0 + i * 0.14, freq, 0.28, 0.07);
      });
      tone({ type: "triangle", freq: 622.25, time: t0 + 0.62, dur: 0.45, peak: 0.06, attack: 0.02 });
    }

    function playSpend() {
      if (muted) return;
      const c = ac();
      const t0 = c.currentTime + 0.02;
      tone({ type: "square", freq: 880, time: t0, dur: 0.08, peak: 0.04, attack: 0.005 });
      tone({ type: "triangle", freq: 220, time: t0 + 0.09, dur: 0.28, peak: 0.06, attack: 0.01 });
    }

    function playEarn() {
      if (muted) return;
      const c = ac();
      const t0 = c.currentTime + 0.02;
      tone({ type: "triangle", freq: 523.25, time: t0, dur: 0.12, peak: 0.05, attack: 0.01 });
      tone({ type: "triangle", freq: 659.25, time: t0 + 0.1, dur: 0.16, peak: 0.05, attack: 0.01 });
    }

    function playFail() {
      if (muted) return;
      const c = ac();
      const t0 = c.currentTime + 0.02;
      noiseBed(t0, 0.28, 0.08, 400, 80, "lowpass");
      tone({ type: "sine", freq: 140, time: t0, dur: 0.22, peak: 0.05, attack: 0.01, glide: 90 });
    }

    function playSigh() {
      if (muted) return;
      const c = ac();
      noiseBed(c.currentTime + 0.02, 1.15, 0.07, 900, 180, "lowpass");
    }

    function peak() {
      if (!analyser) return 0;
      const data = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(data);
      let max = 0;
      for (let i = 0; i < data.length; i += 1) max = Math.max(max, Math.abs(data[i] - 128));
      return max;
    }

    return {
      unlock: unlock,
      play: play,
      stopAll: stopAll,
      playRank: playRank,
      playSpend: playSpend,
      playEarn: playEarn,
      playFail: playFail,
      playSigh: playSigh,
      setMuted: setMuted,
      isMuted: isMuted,
      peak: peak,
    };
  }

  root.CafeAudio = CafeAudio;
})(typeof globalThis !== "undefined" ? globalThis : this);
