/* Field Notes on Handpan Sound Models & Instruments — shared JS */

const NOTE_FREQS = {
  "C2":65.41,"D2":73.42,"Eb2":77.78,"F2":87.31,
  "C3":130.81,"F3":174.61,"G3":196.00,"Ab3":207.65,
  "Bb3":233.08,"C4":261.63,"D4":293.66,"Eb4":311.13,"F4":349.23,
  "G4":392.00,"Ab4":415.30,"Bb4":466.16,"C5":523.25,"D5":587.33,"Eb5":622.25
};

const NOTE_COLORS = {F:"#c87941",G:"#b8955a",Ab:"#7a9e87",C:"#8fa8b8",Eb:"#9b7db5",D:"#b8a45a",Bb:"#a06878"};
const PC_REPRESENTATIVE = {F:"F3",G:"G3",Ab:"Ab3",C:"C4",Eb:"Eb4",D:"D4",Bb:"Bb3"};
const QUALITY_COLORS = {bright:"#c8b441",soulful:"#9b7db5",strong:"#5a9a6a",open:"#8fa8b8",tense:"#b05040",melancholic:"#7a8a9a",warm:"#c87941",lyrical:"#7a9e87"};

let audioCtx = null;
let ringing = null;

// ── Audio ──────────────────────────────────────────────────────

function playHandpan(freq) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const now = audioCtx.currentTime;
    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.4, now);
    master.gain.exponentialRampToValueAtTime(0.001, now + 4);
    master.connect(audioCtx.destination);
    [[1,1],[2,0.35],[3,0.12],[4.02,0.06],[5.9,0.04]].forEach(([r,a]) => {
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * r;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(a, now + 0.008);
      g.gain.exponentialRampToValueAtTime(a * 0.3, now + 0.3);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 4);
      osc.connect(g); g.connect(master);
      osc.start(now); osc.stop(now + 4.1);
    });
  } catch(e) { console.error(e); }
}

function noteClick(noteName, btn) {
  const freq = NOTE_FREQS[noteName];
  if (!freq) return;
  playHandpan(freq);
  if (ringing && ringing.el) {
    ringing.el.style.boxShadow = 'none';
    ringing.el.style.transform = ringing.isCenter ? 'translate(-50%,-50%)' : '';
  }
  ringing = { el: btn, isCenter: btn.classList.contains('ding-btn') };
  btn.style.boxShadow = `0 0 18px ${ringing.color || '#c8794155'}`;
  btn.style.transform = ringing.isCenter ? 'translate(-50%,-50%) scale(1.1)' : 'scale(1.12)';
  setTimeout(() => {
    if (ringing && ringing.el === btn) {
      btn.style.boxShadow = 'none';
      btn.style.transform = ringing.isCenter ? 'translate(-50%,-50%)' : '';
      ringing = null;
    }
  }, 700);
}

function playPC(pc) {
  const note = PC_REPRESENTATIVE[pc];
  if (note) playHandpan(NOTE_FREQS[note]);
}

function playSequence(el) {
  const notes = el.getAttribute('data-notes');
  if (!notes) return;
  notes.split(',').forEach((note, i) => {
    setTimeout(() => {
      const freq = NOTE_FREQS[note];
      if (freq) playHandpan(freq);
      el.style.opacity = '0.6';
      setTimeout(() => { el.style.opacity = '1'; }, 150);
    }, i * 220);
  });
}

// ── Footnote rendering ─────────────────────────────────────────

function renderFn(text, footnotes) {
  return text.replace(/\[(\d+)\]/g, (m, n) => {
    const note = (footnotes || [])[+n - 1] || '';
    return '<sup class="fn-ref" onclick="toggleFootnote(this)" data-note="' + note.replace(/"/g, '&quot;') + '">' + n + '</sup>';
  });
}

function toggleFootnote(el) {
  document.querySelectorAll('.fn-popup').forEach(p => p.remove());
  if (el._open) { el._open = false; return; }
  document.querySelectorAll('.fn-ref').forEach(r => r._open = false);
  const parent = el.closest('.character, .origin, .prov-value') || el.parentNode;
  const popup = document.createElement('div');
  popup.className = 'fn-popup';
  popup.textContent = el.dataset.note;
  parent.parentNode.insertBefore(popup, parent.nextSibling);
  el._open = true;
}

// ── Nav popup ──────────────────────────────────────────────────

function initNav() {
  const trigger = document.getElementById('nav-trigger');
  const popup = document.getElementById('nav-popup');
  if (!trigger || !popup) return;
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    popup.classList.toggle('open');
  });
  document.addEventListener('click', () => popup.classList.remove('open'));
}

// ── Tone circle ────────────────────────────────────────────────

function buildToneCircle(inst) {
  const ring = document.getElementById('tone-ring');
  ring.querySelectorAll('.note-btn,.ding-btn').forEach(e => e.remove());

  const sorted = [...inst.toneNotes].sort((a,b) => NOTE_FREQS[b] - NOTE_FREQS[a]);
  const positionOrder = [0,1,7,2,6,3,5,4];
  const arranged = new Array(sorted.length);
  positionOrder.forEach((pos,i) => { arranged[pos] = sorted[i]; });

  const fieldNums = {};
  [...inst.toneNotes].sort((a,b) => NOTE_FREQS[a] - NOTE_FREQS[b]).forEach((note,i) => { fieldNums[note] = i+1; });

  arranged.forEach((note, i) => {
    const angle = (i / arranged.length) * 2 * Math.PI - Math.PI / 2;
    const r = 88, cx = 130, cy = 130;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const pc = note.replace(/\d/g,'');
    const color = NOTE_COLORS[pc] || '#6a5a40';
    const btn = document.createElement('button');
    btn.className = 'note-btn';
    btn.style.cssText = `left:${x-27}px;top:${y-27}px;background:radial-gradient(circle at 40% 35%,${color}2a,${color}0a);border:1.5px solid ${color}44;`;
    btn.innerHTML = `<span class="note-deg">${fieldNums[note]}</span><span class="note-label"><span class="note-name" style="color:${color}cc">${pc}</span><span class="note-oct">${note.replace(/[A-Za-z♭♯b#]+/g,'')}</span></span>`;
    btn.addEventListener('click', () => {
      btn.style.background = `radial-gradient(circle at 40% 35%,${color}66,${color}22)`;
      btn.style.border = `1.5px solid ${color}cc`;
      ringing = {el: btn, color: `${color}55`, isCenter: false};
      noteClick(note, btn);
      setTimeout(() => {
        btn.style.background = `radial-gradient(circle at 40% 35%,${color}2a,${color}0a)`;
        btn.style.border = `1.5px solid ${color}44`;
      }, 700);
    });
    ring.appendChild(btn);
  });

  const ding = document.createElement('button');
  ding.className = 'ding-btn';
  ding.style.cssText = `background:radial-gradient(circle at 40% 35%,#c8794120,#c8794108);border:1.5px solid #c8794155;`;
  const dingPc = inst.ding.replace(/\d/g, '');
  const dingOct = inst.ding.replace(/[A-Za-z♭♯b#]+/g, '');
  ding.innerHTML = `<span class="ding-label">DING</span><span class="ding-note-row"><span class="ding-note">${dingPc}</span><span class="ding-oct">${dingOct}</span></span>`;
  ding.addEventListener('click', () => {
    ding.style.background = 'radial-gradient(circle at 40% 35%,#c8794155,#c8794120)';
    ding.style.border = '1.5px solid #c87941cc';
    ding.style.boxShadow = '0 0 20px #c8794155';
    ringing = {el: ding, isCenter: true};
    noteClick(inst.ding, ding);
    setTimeout(() => {
      ding.style.background = 'radial-gradient(circle at 40% 35%,#c8794120,#c8794108)';
      ding.style.border = '1.5px solid #c8794155';
      ding.style.boxShadow = 'none';
    }, 700);
  });
  ring.appendChild(ding);

  const bassBtn = document.getElementById('bass-btn');
  if (inst.extraBass) {
    bassBtn.style.display = '';
    bassBtn.textContent = '♩ Helmholtz ' + inst.extraBass;
    bassBtn.onclick = () => {
      bassBtn.style.borderColor = 'rgba(200,121,65,0.4)';
      bassBtn.style.boxShadow = '0 0 10px #c8794133';
      noteClick(inst.extraBass, bassBtn);
      setTimeout(() => {
        bassBtn.style.borderColor = 'rgba(200,121,65,0.13)';
        bassBtn.style.boxShadow = 'none';
      }, 700);
    };
  } else {
    bassBtn.style.display = 'none';
  }
}

// ── Overview tab ───────────────────────────────────────────────

function buildOverview(inst) {
  const p = document.getElementById('panel-overview');
  const pcHTML = inst.pitchClasses.map(n => {
    const c = NOTE_COLORS[n];
    return `<button class="pc-btn" style="background:${c}18;border:1px solid ${c}44;color:${c}" onclick="playPC('${n}')">${n}</button>`;
  }).join('');
  const aliasHTML = inst.scaleAliases.map(a => `<div class="alias">— ${a}</div>`).join('');
  let voiceHTML = '';
  if (inst.voice) {
    const rendered = renderFn(inst.voice.text, inst.voice.footnotes);
    voiceHTML = '<div class="span-2"><div class="lbl">Unique Voice &amp; Timbre</div><div class="character">' + rendered + '</div></div>';
  }
  const originHTML = (() => {
    if (!inst.origin) return '';
    const rendered = renderFn(inst.origin.text, inst.origin.footnotes);
    return '<div class="span-2"><div class="lbl">Scale Origin</div><div class="origin">' + rendered + '</div></div>';
  })();
  p.innerHTML = `
    <div class="grid-2">
      <div><div class="lbl">Pitch Classes</div><div class="pc-badges">${pcHTML}</div></div>
      <div><div class="lbl">Scale Aliases</div>${aliasHTML}</div>
      <div class="span-2"><div class="lbl">Scale Character</div><div class="character">${inst.character}</div></div>
      ${inst.soundModel ? '<div class="span-2"><div class="lbl">Sound Model</div><div class="character">' + renderFn(inst.soundModel.text, inst.soundModel.footnotes) + '</div></div>' : ''}
      ${inst.soundModelCharacter ? '<div class="span-2"><div class="lbl">Sound Model Character</div><div class="character">' + inst.soundModelCharacter + '</div></div>' : ''}
      ${originHTML}
      ${voiceHTML}
      <div class="span-2 prov-card">
        <div class="lbl">Provenance</div>
        <div class="prov-grid">
          <div><div class="prov-field-label">Maker</div><div class="prov-value">${inst.maker}</div></div>
          <div><div class="prov-field-label">Date</div><div class="prov-value">${inst.madeDate}</div></div>
          <div><div class="prov-field-label">Serial Number</div><div class="${inst.serialNumber ? 'prov-value' : 'prov-none'}">${inst.serialNumber || 'None'}</div></div>
          <div><div class="prov-field-label">Maker's Mark</div><div class="${inst.makersMark ? 'prov-value' : 'prov-none'}">${inst.makersMark || 'None'}</div></div>
          <div><div class="prov-field-label">Material</div><div class="prov-value">${inst.material}</div></div>
          <div><div class="prov-field-label">Construction</div><div class="prov-value">${typeof inst.construction === 'string' ? inst.construction : renderFn(inst.construction.text + (inst.construction.footnote ? '[1]' : ''), inst.construction.footnote ? [inst.construction.footnote] : [])}</div></div>
          ${inst.generation ? '<div><div class="prov-field-label">Generation</div><div class="prov-value">' + inst.generation + '</div></div>' : ''}
        </div>
        ${inst.distinction ? '<div style="margin-top:0.75rem;padding-top:0.65rem;border-top:1px solid #3a3020;font-size:0.87rem;color:#a28e66;font-style:italic;">' + (typeof inst.distinction === 'string' ? inst.distinction : renderFn(inst.distinction.text, inst.distinction.footnotes)) + '</div>' : ''}
      </div>
    </div>`;
}

// ── Modes tab ──────────────────────────────────────────────────

function buildModes(inst) {
  const p = document.getElementById('panel-modes');
  const cards = inst.modalCenters.map(m => {
    const color = NOTE_COLORS[m.root] || '#c8a870';
    const noteBadges = m.notes.map(n => {
      const c = NOTE_COLORS[n] || '#6a5a40';
      const rep = PC_REPRESENTATIVE[n];
      const onclick = rep ? `onclick="playHandpan(NOTE_FREQS['${rep}'])"` : '';
      return `<span class="mode-note" style="background:${c}18;border:1px solid ${c}44;color:${c};cursor:pointer" ${onclick}>${n}</span>`;
    }).join('');
    const modeNoteReps = m.notes.map(n => PC_REPRESENTATIVE[n]).filter(Boolean).join(',');
    const playAllBtn = `<span data-notes="${modeNoteReps}" onclick="playSequence(this)" style="cursor:pointer;font-size:0.72rem;color:#4a3e22;letter-spacing:0.15em;padding:0.1rem 0.4rem;border:1px solid #2a2010;border-radius:2px;align-self:center">▶</span>`;
    return `<div class="mode-card">
      <div class="mode-header">
        <div><span class="mode-root" style="color:${color}">${m.root}</span><span class="mode-name">${m.mode}</span></div>
        <div class="mode-notes" style="align-items:center">${noteBadges}${playAllBtn}</div>
      </div>
      <div class="mode-body">
        <div class="mode-formula">${m.formula}</div>
        <div class="mode-char">${m.character}</div>
        <div class="mode-row"><span class="mode-row-lbl">Key</span><span class="mode-row-val">${m.fingerprint}</span></div>
        <div class="mode-row"><span class="mode-row-lbl">Range</span><span class="mode-row-val">${m.range}</span></div>
      </div>
    </div>`;
  }).join('');
  const subtitle = inst.modalCenters.length === 3 ? 'These notes shift personality entirely depending on which note your ear treats as home.' : 'Modal centers available on this instrument.';
  p.innerHTML = `<div class="lbl">Modal Centers</div>
    <div style="font-size:0.72rem;color:#3a3020;line-height:1.6;margin-bottom:1.25rem;font-style:italic">${subtitle}</div>
    ${cards}`;
}

// ── Intervals tab ──────────────────────────────────────────────

function buildHarmony(inst) {
  const p = document.getElementById('panel-harmony');
  const intervalHTML = inst.intervals.map(iv => {
    const noteSpans = iv.notes.map(n => {
      const pc = n.replace(/\d/g,'');
      const c = NOTE_COLORS[pc] || '#c8a878';
      return `<span class="interval-note" style="color:${c}">${n}</span>`;
    }).join('');
    return `<div class="interval-row" data-notes="${iv.notes.join(',')}" style="cursor:pointer" onclick="playSequence(this)"><div class="interval-notes">${noteSpans}</div><div class="interval-name">${iv.name}</div><span class="quality-dot" style="background:${QUALITY_COLORS[iv.quality]}"></span></div>`;
  }).join('');
  p.innerHTML = `
    <div style="margin-bottom:1.25rem">
      <div class="lbl">Formula</div><div class="formula-big">${inst.formula}</div>
    </div>
    <div class="lbl">All Scale Intervals</div>
    <div class="intervals-grid">${intervalHTML}</div>`;
}

// ── Chords tab ─────────────────────────────────────────────────

function buildChords(inst) {
  const p = document.getElementById('panel-chords');
  const chordsHTML = inst.chords.map(ch => {
    const noteSpans = ch.notes.map(n => {
      const pc = n.replace(/\d/g,'');
      const c = NOTE_COLORS[pc] || '#6a5a40';
      return `<span class="chord-note" style="background:${c}18;border:1px solid ${c}44;color:${c}">${n}</span>`;
    }).join('');
    return `<div class="chord-row" data-notes="${ch.notes.join(',')}" style="cursor:pointer" onclick="playSequence(this)">
      <div><div class="chord-sym">${ch.symbol}</div><div class="chord-type">${ch.type}</div></div>
      <div class="chord-notes">${noteSpans}</div>
      <div class="chord-desc">${ch.desc}</div>
    </div>`;
  }).join('');
  p.innerHTML = `<div class="lbl">Three-Note Voicings</div>
    <div class="chords-list">${chordsHTML}</div>
    <div class="chord-note-box">
      <div class="chord-note-lbl">Note</div>
      <div class="chord-note-text">Handpans are primarily melodic. These voicings are best expressed through arpeggiation — playing notes in rapid succession rather than simultaneously.</div>
    </div>`;
}

// ── Compatibility tab ──────────────────────────────────────────

function buildClashes(inst) {
  const p = document.getElementById('panel-clashes');
  const playsWellWithHTML = (inst.playsWellWith || []).map(pw => {
    const noteSpans = pw.sharedNotes.map(n => {
      const c = NOTE_COLORS[n] || '#6a5a40';
      return `<span style="padding:0.1rem 0.4rem;border-radius:2px;background:${c}18;border:1px solid ${c}44;color:${c};font-size:0.7rem">${n}</span>`;
    }).join('');
    const linkTarget = typeof pw.url === 'string' ? `<a href="${pw.url}" style="color:#6abf7a;text-decoration:none" onmouseover="this.style.color='#8adfa0'" onmouseout="this.style.color='#6abf7a'">${pw.name}</a>` : `<span style="color:#6abf7a">${pw.name}</span>`;
    return `<div class="compat-row-green" style="flex-direction:column;align-items:flex-start;gap:0.3rem;padding:0.6rem 0.75rem">
      <div style="display:flex;align-items:center;gap:0.5rem;width:100%">
        <span class="compat-indicator green"></span>
        <span class="compat-key-name">${linkTarget}</span>
        <span class="compat-verdict" style="margin-left:auto">${pw.context}</span>
      </div>
      <div style="display:flex;gap:3px;padding-left:1.2rem;flex-wrap:wrap">${noteSpans}</div>
      <div style="font-size:0.72rem;color:#3a6a40;line-height:1.5;padding-left:1.2rem">${pw.desc}</div>
    </div>`;
  }).join('');

  const soloHTML = `<div class="compat-featured" style="margin-bottom:0.75rem;background:#0e0e08;border-color:#3a3010;">
    <div class="compat-featured-label" style="color:#86703d">Solo Key</div>
    <div class="compat-featured-key" style="color:#ede0c7;font-size:1.25rem">${inst.key}</div>
    <div class="compat-featured-desc" style="color:#7a6a44">${inst.tonalAnchor || ''}</div>
  </div>`;

  const ensembleHTML = `<div class="compat-featured">
    <div class="compat-featured-label">Ensemble Key</div>
    <div class="compat-featured-key">${inst.ensembleKey}</div>
    <div class="compat-featured-desc">${inst.harmonicIdentity || 'Primary ensemble context — the Ding sits on the 5th degree of this key.'}</div>
  </div>`;

  const modalCenterHTML = (inst.modalCenterKeys || []).map(mk =>
    `<div class="compat-row-teal">
      <div style="display:flex;align-items:center;gap:0.65rem;width:100%">
        <span class="compat-indicator teal"></span>
        <span class="compat-key-name" style="color:#5aaabb">${mk.key}</span>
        <span class="compat-verdict" style="color:#7ab8c4;margin-left:auto">◈ ${mk.mode}</span>
      </div>
      <div style="font-size:0.72rem;color:#7ab8c4;line-height:1.5;padding-left:1.2rem">${mk.desc}</div>
    </div>`
  ).join('');

  const fullCompatHTML = inst.compatibleKeys.map(k =>
    `<div class="compat-row-green"><span class="compat-indicator green"></span><span class="compat-key-name">${k}</span><span class="compat-verdict">✓ fully compatible</span></div>`
  ).join('');

  const playableHTML = (inst.playableKeys || []).map(pk =>
    `<div class="compat-row-amber">
      <div class="compat-row-top"><span class="compat-indicator amber"></span><span class="compat-key-name">${pk.key}</span><span class="compat-verdict amber-text">~ 1 clash — playable with care</span></div>
      <div class="compat-clash-detail"><span class="compat-clash-note amber-note">${pk.note}</span><span class="compat-clash-reason">${pk.reason}</span></div>
    </div>`
  ).join('');

  const avoidHTML = inst.clashKeys.map(k => {
    const clashes = inst.clashNotes[k] || [];
    const rows = clashes.map(c =>
      `<div class="compat-clash-detail"><span class="compat-clash-note red-note">${c.note}</span><span class="compat-clash-reason">${c.reason}</span></div>`
    ).join('');
    return `<div class="compat-row-red">
      <div class="compat-row-top"><span class="compat-indicator red"></span><span class="compat-key-name">${k}</span><span class="compat-verdict red-text">✕ ${clashes.length} clashes — avoid</span></div>
      ${rows}
    </div>`;
  }).join('');

  p.innerHTML = `
    ${inst.playsWellWith && inst.playsWellWith.length ? `<div class="lbl">Plays Well With</div><div style="margin-bottom:1.25rem">${playsWellWithHTML}</div>` : ''}
    ${soloHTML}
    ${ensembleHTML}
    <div class="lbl" style="margin-top:1.25rem">Fully Compatible</div>
    <div style="margin-bottom:1rem">${fullCompatHTML}</div>
    ${inst.modalCenterKeys && inst.modalCenterKeys.length ? `<div class="lbl">Shared Modal Center</div><div style="margin-bottom:1rem">${modalCenterHTML}</div>` : ''}
    ${inst.playableKeys && inst.playableKeys.length ? `<div class="lbl">Playable With Care</div><div style="margin-bottom:1rem">${playableHTML}</div>` : ''}
    <div class="lbl">Avoid</div>
    <div>${avoidHTML}</div>
    <div style="margin-top:1rem;padding:0.65rem 0.75rem;background:#0a0905;border:1px solid #1a1608;border-radius:3px;font-size:0.72rem;color:#3a3020;line-height:1.6">More than 1 clash and the instrument will likely undermine the group's tonal center.</div>
  `;
}

// ── Tabs ───────────────────────────────────────────────────────

function buildTabs() {
  const tabs = ['overview','modes','intervals','chords','compatibility'];
  const container = document.getElementById('tabs');
  container.innerHTML = '';
  tabs.forEach(tab => {
    const btn = document.createElement('button');
    btn.className = 'tab-btn' + (tab === 'overview' ? ' active' : '');
    btn.textContent = tab;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const panelId = tab === 'intervals' ? 'panel-harmony' : tab === 'compatibility' ? 'panel-clashes' : 'panel-' + tab;
      document.getElementById(panelId).classList.add('active');
    });
    container.appendChild(btn);
  });
}

// ── Card header ────────────────────────────────────────────────

function buildCardHeader(inst) {
  const makerParts = [inst.brand + ' ' + inst.type];
  if (inst.generation) makerParts.push(inst.generation);
  makerParts.push(inst.madeDate);
  document.getElementById('card-maker').textContent = makerParts.join(' · ');
  const keyRoot = inst.key.split(' ')[0];
  const displayScale = inst.scaleName.startsWith(keyRoot) ? inst.scaleName : keyRoot + ' ' + inst.scaleName;
  document.getElementById('card-type').textContent = displayScale;
  document.getElementById('card-key').textContent = inst.key;
  document.getElementById('card-formula').textContent = inst.formula + ' solo';
  document.getElementById('card-ensemble-key').textContent = inst.ensembleKey;
  document.getElementById('card-ensemble-formula').textContent = inst.ensembleFormula + ' ensemble';
}

// ── Main render ────────────────────────────────────────────────

function renderInstrument(inst) {
  document.title = inst.selectorName + ' — Field Notes';
  buildCardHeader(inst);
  buildToneCircle(inst);
  buildOverview(inst);
  buildModes(inst);
  buildHarmony(inst);
  buildChords(inst);
  buildClashes(inst);
  buildTabs();
  initNav();
  document.getElementById('year').textContent = new Date().getFullYear();
}
