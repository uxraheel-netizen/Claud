/* Pilot — Raheel's offline day bot.
 * Everything lives in this browser's localStorage. No network calls, no accounts,
 * no AI credits, and nothing is read from the phone (no contacts, location, sensors).
 */
(() => {
  'use strict';

  // ---------- Storage ----------
  const KEY = 'pilot.v1';
  const DEFAULT_STATE = () => ({
    settings: {
      name: 'Raheel',
      wake: '08:30', leave: '09:00', arrive: '09:20', start: '09:40',
      lunchStart: '13:15', lunchEnd: '14:00', off: '18:00', sleep: '00:00',
      workdays: [1, 2, 3, 4, 5],
      waterGoal: 8,
      cigBaseline: 6,
      personalCap: 90,
      fianceGoal: 150,
      notify: false,
      startedOn: todayKey()
    },
    team: [
      { id: 'mridul', name: 'Mridul', role: 'Sr Framer Developer', brief: true },
      { id: 'agha', name: 'Agha Hyder', role: 'Junior Framer Developer', brief: true },
      { id: 'ahmad', name: 'Ahmad Bajwa', role: 'Sr Developer (Custom / WordPress)', brief: true },
      { id: 'abdullah', name: 'Abdullah Ali', role: 'Mid-level Designer', brief: true },
      { id: 'wajahat', name: 'Wajahat Ali', role: 'SEO Expert (independent)', brief: false }
    ],
    clients: [],
    tasks: [],
    meetings: [],
    days: {},
    chat: [],
    seq: 1,
    timer: null
  });

  // Present only inside the Android APK (see android/). Gives real alarms that fire when the app is closed.
  const NATIVE = window.PilotNative || null;

  let S = load();
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const base = DEFAULT_STATE();
        const saved = JSON.parse(raw);
        return { ...base, ...saved, settings: { ...base.settings, ...saved.settings } };
      }
    } catch (e) { /* fall through to defaults */ }
    return DEFAULT_STATE();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Could not save — storage full?'); }
    if (NATIVE) { clearTimeout(save._t); save._t = setTimeout(syncNative, 400); }
  }

  // ---------- Helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  function todayKey(d = new Date()) {
    const z = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
  }
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const fmt = (min) => {
    min = ((min % 1440) + 1440) % 1440;
    const h = Math.floor(min / 60), m = min % 60, ap = h >= 12 ? 'pm' : 'am';
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${ap}`;
  };
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const dur = (min) => (min >= 60 ? `${Math.floor(min / 60)}h ${min % 60 ? (min % 60) + 'm' : ''}`.trim() : `${min}m`);
  const day = (k = todayKey()) => {
    if (!S.days[k]) S.days[k] = { water: 0, cigs: [], checks: {}, fired: {}, fianceMin: 0, personalMin: 0, focusMin: 0, sleptAt: '', wokeAt: '', notes: [], notion: {} };
    return S.days[k];
  };
  const firstName = (n) => n.split(' ')[0];
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast('Copied ✓'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta);
      ta.select(); document.execCommand('copy'); ta.remove(); toast('Copied ✓');
    }
  }
  async function share(text) {
    if (NATIVE) { NATIVE.shareText(text, ''); return; }
    if (navigator.share) { try { await navigator.share({ text }); return; } catch (e) { return; } }
    copy(text);
  }

  // ---------- Routine engine ----------
  // Sleep at 00:00 is treated as end-of-day (1440) so the evening maths works.
  function sleepMin() { const m = toMin(S.settings.sleep); return m < 6 * 60 ? m + 1440 : m; }
  function isWorkday(d = new Date()) { return S.settings.workdays.includes(d.getDay()); }

  function blocks(d = new Date()) {
    const s = S.settings;
    const out = [];
    const B = (id, start, end, icon, title, tip) => out.push({ id, start, end, icon, title, tip });
    const wake = toMin(s.wake), sleep = sleepMin();

    if (!isWorkday(d)) {
      const sunday = d.getDay() === 0;
      B('w-wake', wake, wake + 60, '🌤️', 'Slow morning', 'Water first, then breakfast without the phone. No work chats before 11.');
      B('w-move', wake + 60, wake + 100, '🚶', 'Move 30–40 min', 'Walk, gym or cricket — anything that makes you sweat a little.');
      B('w-free', wake + 100, 13 * 60, '🎨', 'Personal project (max 2h)', 'Only if you want to. Hard stop at 1pm — weekends recharge the week.');
      B('w-lunch', 13 * 60, 14 * 60, '🍛', 'Lunch with family', 'Eat slowly, no screens.');
      B('w-rest', 14 * 60, 18 * 60, '🛋️', 'Rest, family & errands', 'Nap 20 min if tired. Batch errands together.');
      if (sunday) B('w-review', 18 * 60, 18 * 60 + 30, '🗓️', 'Weekly review', 'Ask the bot "week". Pick next week\'s top 3 clients, check Notion boards, block meetings.');
      else B('w-walk', 18 * 60, 18 * 60 + 30, '🌇', 'Evening walk', 'Ideal time to call her or walk together.');
      B('w-fiance', 18 * 60 + 30, sleep - 30, '💛', 'Fiancée & family time', 'Be fully present. Work can wait until Monday.');
      B('w-wind', sleep - 30, sleep, '🌙', 'Wind-down', 'Dim screens, no reels. Lights out on time.');
      return out;
    }

    const leave = toMin(s.leave), arrive = toMin(s.arrive), start = toMin(s.start);
    const ls = toMin(s.lunchStart), le = toMin(s.lunchEnd), off = toMin(s.off);
    const home = off + 40, dinnerEnd = home + 60;
    // Protect fiancée time first, personal-client work gets what's left (up to the cap).
    const fianceStart = Math.max(dinnerEnd, Math.min(dinnerEnd + s.personalCap, sleep - 30 - s.fianceGoal));

    B('wake', wake, leave, '⏰', 'Wake, get ready & breakfast', 'Glass of water before touching the phone. Protein breakfast. Glance at today\'s top 3 in the bot.');
    B('commute', leave, arrive, '🚗', 'Commute to office', 'Voice-note yourself the 3 things that must ship today. No email yet.');
    B('settle', arrive, start, '☕', 'Settle in', 'Try swapping the first cigarette for a 5-min walk + water. If you do smoke, log it in Health.');
    B('notion', start, start + 35, '📋', 'Notion sweep — all client updates', 'Go client by client in Notion. Tick each one in Team › Clients so nothing slips.');
    B('assign', start + 35, start + 55, '👥', 'Assign the team', 'Team › Daily brief → copy each person\'s message and send. Mridul, Agha, Ahmad, Abdullah (not Wajahat).');
    B('deep', start + 55, ls, '🎯', 'Deep work — your design / Framer', 'Phone on DND. 50-min focus, 10-min break (stand + water). One task at a time.');
    B('lunch', ls, le, '🍛', 'Lunch break', 'Eat away from the screen. 10-min walk after — beats the 3pm slump.');
    B('afternoon', le, off - 75, '🤝', 'Reviews, team check & client meetings', 'Batch meetings here. Quick team check-in at ~3:30: anything blocked?');
    B('qa', off - 75, off - 30, '🔍', 'QA window', 'Run the QA checklist on everything going to a client today. Nothing ships unchecked.');
    B('wrap', off - 30, off, '✅', 'Wrap up & plan tomorrow', 'Update Notion statuses, note blockers, write tomorrow\'s top 3 (ask bot: "top3").');
    B('home', off, home, '🏠', 'Commute home', 'Decompress — music or podcast. No work calls.');
    B('dinner', home, dinnerEnd, '🍽️', 'Freshen up & dinner', 'Shower, eat with family. Phone face-down.');
    if (fianceStart > dinnerEnd) B('personal', dinnerEnd, fianceStart, '💻', 'Personal client work (capped)', `Hard cap ${dur(fianceStart - dinnerEnd)}. Start a focus timer; stop when it rings.`);
    B('fiance', fianceStart, sleep - 30, '💛', 'Fiancée time', 'Work notifications off. Be present — this is the most important block of the day.');
    B('wind', sleep - 30, sleep, '🌙', 'Wind-down', 'No screens, no work. Lights out at ' + fmt(sleep) + '.');
    return out;
  }

  function currentBlock() {
    let n = nowMin();
    const bs = blocks();
    if (n < toMin(S.settings.wake) && n < 6 * 60) n += 1440; // after-midnight counts as last night
    return { list: bs, cur: bs.find((b) => n >= b.start && n < b.end), next: bs.find((b) => b.start > n), n };
  }

  // ---------- Smoking ----------
  function cigGoal() {
    const weeks = Math.floor((Date.now() - new Date(S.settings.startedOn).getTime()) / (7 * 864e5));
    return Math.max(0, S.settings.cigBaseline - weeks);
  }
  function lastCig() {
    const keys = Object.keys(S.days).sort().reverse();
    for (const k of keys) { const c = S.days[k].cigs; if (c && c.length) return c[c.length - 1]; }
    return null;
  }

  // ---------- Tasks ----------
  const STATUSES = ['todo', 'doing', 'qa', 'ready', 'sent'];
  const STATUS_LABEL = { todo: 'To do', doing: 'In progress', qa: 'Needs QA', ready: 'Ready for client', sent: 'Sent / done' };
  const QA_LIST = [
    'Desktop, tablet & mobile breakpoints checked',
    'All links & buttons work (no 404s, correct targets)',
    'Forms submit and reach the right inbox',
    'Copy proofread — matches client doc, no typos',
    'Images sharp & optimized, nothing stretched',
    'SEO: titles, meta descriptions, OG image, favicon',
    'Animations smooth, no layout shift or jank',
    'Contrast & font sizes readable',
    'CMS / dynamic pages render correctly',
    'Page speed acceptable (PageSpeed check)',
    'Matches the approved Figma design',
    'Every client feedback point addressed'
  ];

  function owner(id) { return id === 'me' ? { id: 'me', name: 'Me' } : S.team.find((t) => t.id === id) || { id, name: id }; }
  function addTask({ title, ownerId = 'me', client = '', priority = 'normal' }) {
    const t = { id: S.seq++, title, owner: ownerId, client, priority, status: 'todo', created: Date.now(), qa: {} };
    S.tasks.push(t); save(); return t;
  }
  function openTasks(ownerId) {
    return S.tasks.filter((t) => t.status !== 'sent' && (!ownerId || t.owner === ownerId))
      .sort((a, b) => (b.priority === 'high') - (a.priority === 'high') || a.id - b.id);
  }
  function advance(t) {
    const i = STATUSES.indexOf(t.status);
    if (t.status === 'qa' && !qaPassed(t)) { openQA(t.id); toast('Finish QA before marking ready'); return; }
    if (i < STATUSES.length - 1) t.status = STATUSES[i + 1];
    save();
  }
  const qaPassed = (t) => QA_LIST.every((_, i) => t.qa[i]);

  function matchOwner(word) {
    const w = word.toLowerCase().trim();
    if (['me', 'i', 'myself', 'raheel'].includes(w)) return 'me';
    const hit = S.team.find((m) => m.name.toLowerCase().split(' ').some((p) => p.startsWith(w)) || m.id === w);
    return hit ? hit.id : null;
  }

  function briefFor(m) {
    const ts = openTasks(m.id);
    const s = S.settings;
    if (!ts.length) return null;
    const lines = ts.map((t, i) => `${i + 1}. ${t.priority === 'high' ? '🔴 ' : ''}${t.title}${t.client ? ` — ${t.client}` : ''}${t.status === 'qa' ? ' (send me for QA)' : ''}`);
    return `Assalam o Alaikum ${firstName(m.name)} 👋\n\nToday's priorities:\n${lines.join('\n')}\n\nPlease share progress by ${fmt(toMin(s.off) - 90)} so I can QA before it goes to the client. Ping me early if anything is blocked.\n\n— Raheel`;
  }

  // ---------- Bot ----------
  const HELP = `Here's what I understand (no internet, no credits):

• now — what to do right now
• plan — today's schedule
• top3 — set / see today's top 3
• mridul: fix hero on mobile for Acme !  → task (! = urgent)
• me: design pricing page for Zed
• tasks / tasks agha — open tasks
• start 4 · qa 4 · done 4 — move task #4
• brief — team messages ready to send
• client Acme — add a client
• meeting Acme 3pm — log a meeting
• water · cig — quick health logs
• slept 1am · woke 8:45 — sleep log
• fiancee 2h · personal 1h — time logs
• focus · break — start a timer
• note … — save a note
• stats · week — how you're doing
• stressed / tired / can't focus — get help`;

  function botReply(input) {
    const raw = input.trim();
    const q = raw.toLowerCase();
    const d = day();
    let m;

    if (!q) return 'Say something 🙂 Type "help" to see what I can do.';
    if (/^(help|\?|commands)$/.test(q)) return HELP;
    if (/^(hi|hello|salam|assalam|aoa|hey)/.test(q)) return `Wa alaikum assalam ${S.settings.name}! ` + nowText();
    if (/^(now|what now|what should i do|next)/.test(q)) return nowText();
    if (/^(plan|today|schedule)/.test(q)) return blocks().map((b) => `${fmt(b.start)}  ${b.icon} ${b.title}`).join('\n');

    if ((m = q.match(/^top ?3\s*[:\-]?\s*(.*)$/))) {
      const rest = raw.replace(/^top ?3\s*[:\-]?\s*/i, '');
      if (rest) { d.top3 = rest.split(/[,;\n]|\s\d\.\s/).map((x) => x.trim()).filter(Boolean).slice(0, 3); save(); return 'Locked in ✅\n' + d.top3.map((x, i) => `${i + 1}. ${x}`).join('\n'); }
      return d.top3 && d.top3.length ? "Today's top 3:\n" + d.top3.map((x, i) => `${i + 1}. ${x}`).join('\n') : 'No top 3 yet. Send: top3 homepage QA, Acme meeting, pricing design';
    }

    // "mridul: task text for Client !"
    if ((m = raw.match(/^([a-zA-Z]+)\s*:\s*(.+)$/)) || (m = raw.match(/^(?:task|assign)\s+([a-zA-Z]+)\s+(.+)$/i))) {
      const who = matchOwner(m[1]);
      if (who) {
        let text = m[2].trim(), priority = 'normal', client = '';
        if (/!\s*$/.test(text) || /\burgent\b/i.test(text)) { priority = 'high'; text = text.replace(/!+\s*$/, '').replace(/\burgent\b/i, '').trim(); }
        const cm = text.match(/\s(?:for|@)\s+([A-Z][\w&.\- ]{0,30})$/i);
        if (cm) { client = cm[1].trim(); text = text.slice(0, cm.index).trim(); ensureClient(client); }
        const t = addTask({ title: text, ownerId: who, client, priority });
        const o = owner(who);
        let extra = '';
        if (who === 'wajahat') extra = '\n(Note: Wajahat works independently — he\'s not in the daily brief.)';
        if (who !== 'me' && /framer/i.test(text) && who === 'ahmad') extra += '\n⚠️ Ahmad doesn\'t do Framer — maybe Mridul or Agha?';
        if (who !== 'me' && /(wordpress|wp|custom code|php|backend)/i.test(text) && (who === 'mridul' || who === 'agha')) extra += '\n💡 This sounds like Ahmad\'s area (WordPress/custom).';
        return `Added #${t.id} for ${o.name}${client ? ` (${client})` : ''}${priority === 'high' ? ' 🔴' : ''}.${extra}`;
      }
    }

    if ((m = q.match(/^tasks?\s*(\w*)$/))) {
      const who = m[1] ? matchOwner(m[1]) : null;
      if (m[1] && !who) return `I don't know "${m[1]}". Team: ${S.team.map((t) => firstName(t.name)).join(', ')}, me.`;
      const ts = openTasks(who);
      if (!ts.length) return 'No open tasks 🎉';
      return ts.map((t) => `#${t.id} ${t.priority === 'high' ? '🔴 ' : ''}${t.title}  · ${owner(t.owner).name}${t.client ? ' · ' + t.client : ''} · ${STATUS_LABEL[t.status]}`).join('\n');
    }

    if ((m = q.match(/^(start|doing|qa|ready|done|sent|delete)\s*#?(\d+)$/))) {
      const t = S.tasks.find((x) => x.id === +m[2]);
      if (!t) return `No task #${m[2]}.`;
      const verb = m[1];
      if (verb === 'delete') { S.tasks = S.tasks.filter((x) => x !== t); save(); return `Deleted #${t.id}.`; }
      if (verb === 'start' || verb === 'doing') t.status = 'doing';
      else if (verb === 'qa') { t.status = 'qa'; save(); setTimeout(() => openQA(t.id), 300); return `#${t.id} moved to QA — opening the checklist.`; }
      else if (verb === 'ready') { if (!qaPassed(t)) { t.status = 'qa'; save(); setTimeout(() => openQA(t.id), 300); return `Hold on — #${t.id} hasn't passed QA yet. Opening the checklist.`; } t.status = 'ready'; }
      else if (verb === 'done' || verb === 'sent') {
        if (t.owner !== 'me' && !qaPassed(t) && t.status !== 'ready') { t.status = 'qa'; save(); setTimeout(() => openQA(t.id), 300); return `#${t.id} is team work — QA it before it's done. Opening the checklist.`; }
        t.status = 'sent';
      }
      save();
      return `#${t.id} → ${STATUS_LABEL[t.status]} ✓`;
    }

    if (/^(brief|standup|assign|instructions)/.test(q)) { setTimeout(openBrief, 200); return 'Opening today\'s team brief — copy or share each message.'; }

    if ((m = raw.match(/^client\s+(.+)$/i))) { ensureClient(m[1].trim()); return `Client "${m[1].trim()}" added. It'll show up in your Notion sweep.`; }

    if ((m = raw.match(/^meeting\s+(.+?)(?:\s+(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?$/i))) {
      const mt = { id: Date.now(), client: m[1].trim(), date: todayKey(), time: m[2] || '', notes: '' };
      S.meetings.push(mt); save();
      return `Meeting with ${mt.client}${mt.time ? ' at ' + mt.time : ''} logged.\nPrep: open their Notion page, list 3 questions, decide what you need from them. After: write action items as tasks.`;
    }

    if (/^(water|drank|glass|💧)/.test(q)) { d.water++; save(); return `💧 ${d.water}/${S.settings.waterGoal} glasses. ${d.water >= S.settings.waterGoal ? 'Goal hit!' : 'Keep going.'}`; }
    if (/^(cig|smoke|smoked|🚬)/.test(q)) { d.cigs.push(Date.now()); save(); return cigText(true); }

    if ((m = q.match(/^slept\s+(?:at\s+)?(.+)$/))) { d.sleptAt = m[1]; save(); return `Logged: slept at ${m[1]}. ${/^[1-4](:\d\d)?\s*am/.test(m[1]) ? 'That\'s late — tonight aim for 12.' : 'Nice.'}`; }
    if ((m = q.match(/^woke\s+(?:up\s+)?(?:at\s+)?(.+)$/))) { d.wokeAt = m[1]; save(); return `Logged: woke at ${m[1]}.`; }

    if ((m = q.match(/^(fiance|fiancee|fiancé|fiancée|her)\s+(\d+(?:\.\d+)?)\s*(h|m|min|hr|hours?)?/))) {
      const mins = /^m/.test(m[3] || 'h') ? +m[2] : Math.round(+m[2] * 60);
      d.fianceMin += mins; save();
      return `💛 ${dur(d.fianceMin)} with her today. ${d.fianceMin >= 120 ? 'Great — that\'s the goal.' : `Goal is 2–3h; ${dur(120 - d.fianceMin)} to go.`}`;
    }
    if ((m = q.match(/^personal\s+(\d+(?:\.\d+)?)\s*(h|m|min|hr|hours?)?/))) {
      const mins = /^m/.test(m[2] || 'h') ? +m[1] : Math.round(+m[1] * 60);
      d.personalMin += mins; save();
      return `💻 Personal client work: ${dur(d.personalMin)} today.${d.personalMin > S.settings.personalCap ? ' ⚠️ Over your cap — wrap up, her time comes first.' : ''}`;
    }

    if (/^(focus|pomodoro|deep work)/.test(q)) { startTimer('focus'); return '🎯 50-min focus started. Phone on DND. I\'ll ping you.'; }
    if (/^(break|rest)$/.test(q)) { startTimer('break'); return '☕ 10-min break. Stand up, water, look far away.'; }
    if (/^(stop|cancel) ?(timer)?$/.test(q)) { S.timer = null; save(); return 'Timer stopped.'; }

    if ((m = raw.match(/^note\s+(.+)$/i))) { d.notes.push({ ts: Date.now(), text: m[1] }); save(); return '📝 Saved.'; }
    if (/^notes$/.test(q)) return d.notes.length ? d.notes.map((n) => '• ' + n.text).join('\n') : 'No notes today.';

    if (/^(stats|how am i doing|score)/.test(q)) return statsText();
    if (/^(week|weekly|review)/.test(q)) return weekText();

    if (/(stress|overwhelm|too much|pressure|anxious)/.test(q)) return 'Breathe: 4 in, 4 hold, 6 out — 5 rounds.\nThen: write everything on your mind as tasks here. Pick ONE. Delegate anything Mridul/Agha/Ahmad/Abdullah can do — your job is direction + QA, not doing it all.';
    if (/(tired|sleepy|exhausted|low energy)/.test(q)) return 'Quick reset: 500ml water, 5-min walk (no cig), 10 slow breaths at a window. If it\'s after 3pm skip caffeine. Tonight: lights out by 12.';
    if (/(can'?t focus|distracted|procrastinat)/.test(q)) return 'Shrink it: what\'s the 10-minute version of the task? Start that. Type "focus" for a 50-min timer, phone in another room.';
    if (/(craving|want (a|to) smoke|urge)/.test(q)) return 'Cravings peak ~3–5 min and pass. Drink a full glass of water, walk to the other end of the office and back, chew something. If you still smoke, log it — no guilt, just data.';
    if (/(angry|frustrat|annoyed)/.test(q)) return 'Don\'t reply to anyone for 10 min. Write what happened in a "note", walk, then respond with facts + next step.';

    return 'Not sure I got that. Try "now", "plan", "mridul: task for Client", "brief", "water", or "help".';
  }

  function nowText() {
    const { cur, next } = currentBlock();
    const d = day();
    let s = cur ? `${cur.icon} Now: ${cur.title} (until ${fmt(cur.end)})\n${cur.tip}` : `Nothing scheduled right now.${next ? ` Next: ${next.icon} ${next.title} at ${fmt(next.start)}.` : ' Get some sleep 😴'}`;
    if (cur && next) s += `\n\nNext: ${next.icon} ${next.title} at ${fmt(next.start)}`;
    if (d.water < expectedWater()) s += `\n\n💧 You're behind on water (${d.water}/${expectedWater()} by now).`;
    const mine = openTasks('me');
    if (cur && ['deep', 'afternoon', 'personal'].includes(cur.id) && mine.length) s += `\n\nYour top task: #${mine[0].id} ${mine[0].title}`;
    return s;
  }
  function expectedWater() {
    const n = nowMin(), w = toMin(S.settings.wake), sl = sleepMin();
    const p = Math.min(1, Math.max(0, (n - w) / (sl - 60 - w)));
    return Math.floor(p * S.settings.waterGoal);
  }
  function cigText(justLogged) {
    const d = day(), g = cigGoal(), n = d.cigs.length;
    let s = justLogged ? `Logged 🚬 #${n} today. Goal: ≤ ${g}.` : `🚬 ${n} today · goal ≤ ${g}`;
    if (n > g) s += '\nOver goal — no stress, tomorrow try pushing each one 15 minutes later.';
    else if (justLogged) s += '\nTry to make the next one 15 min later than usual.';
    return s;
  }
  function statsText() {
    const d = day();
    const done = S.tasks.filter((t) => t.status === 'sent' && t.created && todayKey(new Date(t.created)) <= todayKey()).length;
    const checks = Object.values(d.checks).filter(Boolean).length;
    return `Today\n💧 Water ${d.water}/${S.settings.waterGoal}\n🚬 Cigarettes ${d.cigs.length} (goal ≤ ${cigGoal()})\n🎯 Focus ${dur(d.focusMin)}\n💛 Fiancée ${dur(d.fianceMin)}\n💻 Personal clients ${dur(d.personalMin)}\n✅ Routine blocks done ${checks}/${blocks().length}\n📦 Open tasks ${openTasks().length} · completed all-time ${done}`;
  }
  function last7() {
    const out = [];
    for (let i = 6; i >= 0; i--) { const dt = new Date(); dt.setDate(dt.getDate() - i); const k = todayKey(dt); out.push({ k, dt, d: S.days[k] }); }
    return out;
  }
  function weekText() {
    const w = last7();
    const sum = (f) => w.reduce((a, x) => a + (x.d ? f(x.d) : 0), 0);
    const days = w.filter((x) => x.d).length || 1;
    const sent = S.tasks.filter((t) => t.status === 'sent').length;
    return `Last 7 days\n💧 Avg water ${(sum((d) => d.water) / days).toFixed(1)} glasses\n🚬 Cigarettes ${sum((d) => d.cigs.length)} total (avg ${(sum((d) => d.cigs.length) / days).toFixed(1)}/day)\n🎯 Focus ${dur(sum((d) => d.focusMin))}\n💛 Fiancée ${dur(sum((d) => d.fianceMin))}\n💻 Personal clients ${dur(sum((d) => d.personalMin))}\n📦 Tasks delivered (all-time) ${sent}\n\nReview: What slipped? Who on the team needs more support? What can you delegate next week?`;
  }

  function ensureClient(name) {
    if (!S.clients.some((c) => c.name.toLowerCase() === name.toLowerCase())) { S.clients.push({ id: Date.now() + Math.random(), name }); save(); }
  }

  // ---------- Timer ----------
  function startTimer(mode) {
    const mins = mode === 'focus' ? 50 : 10;
    S.timer = { mode, endsAt: Date.now() + mins * 60e3, mins }; save();
  }

  // ---------- Notifications ----------
  async function enableNotify() {
    if (NATIVE) {
      NATIVE.requestNotify(); S.settings.notify = true; save(); syncNative(); render();
      toast('Reminders on 🔔 — they work even when the app is closed'); return;
    }
    if (!('Notification' in window)) { toast('Reminders not supported on this browser'); return; }
    const p = await Notification.requestPermission();
    S.settings.notify = p === 'granted'; save(); render();
    toast(S.settings.notify ? 'Reminders on 🔔' : 'Reminders blocked in browser settings');
  }
  async function notify(title, body) {
    if (NATIVE) { if (S.settings.notify) NATIVE.notifyNow(title, body); else toast(title); return; }
    if (!S.settings.notify || Notification.permission !== 'granted') { toast(title); return; }
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: title });
      else new Notification(title, { body, icon: 'icons/icon-192.png' });
    } catch (e) { toast(title); }
  }
  // Native alarms for the next 7 days: every routine block, water & stretch nudges, focus timer end.
  function syncNative() {
    if (!NATIVE) return;
    const items = [];
    const now = Date.now();
    if (S.settings.notify) {
      for (let i = 0; i < 7; i++) {
        const dt = new Date(); dt.setHours(0, 0, 0, 0); dt.setDate(dt.getDate() + i);
        const base = dt.getTime();
        const add = (min, title, body) => { const at = base + min * 60e3; if (at > now) items.push({ at, title, body }); };
        for (const b of blocks(dt)) add(b.start, `${b.icon} ${b.title}`, b.tip);
        for (const h of [11, 15.5, 17, 20]) add(h * 60, '💧 Water check', 'One full glass now. Tap to log it.');
        if (isWorkday(dt)) for (const h of [12, 16]) add(h * 60, '🧘 Stand & stretch', 'Shoulders, neck, wrists. Look 20 ft away for 20 sec.');
      }
    }
    if (S.timer && S.timer.endsAt > now) {
      items.push({ at: S.timer.endsAt, title: S.timer.mode === 'focus' ? '🎯 Focus done!' : '☕ Break over', body: S.timer.mode === 'focus' ? 'Take 10. Stand up, water, eyes off the screen.' : 'Back to it — one task.' });
    }
    items.sort((a, b) => a.at - b.at);
    try { NATIVE.schedule(JSON.stringify(items.slice(0, 200))); } catch (e) { /* bridge unavailable */ }
  }

  function tick() {
    const d = day();
    const { list, n } = currentBlock();
    if (NATIVE) {
      // Alarms handle every reminder; here we only finish an expired timer.
      if (S.timer && Date.now() >= S.timer.endsAt) { if (S.timer.mode === 'focus') d.focusMin += S.timer.mins; S.timer = null; save(); if (tab === 'today' || tab === 'health') render(); }
      renderHeader();
      return;
    }
    for (const b of list) {
      if (n >= b.start && n < b.start + 5 && !d.fired[b.id]) { d.fired[b.id] = 1; save(); notify(`${b.icon} ${b.title}`, b.tip); }
    }
    // Water nudge every ~90 min if behind.
    const wk = 'water-' + Math.floor(n / 90);
    if (!d.fired[wk] && d.water < expectedWater() && n > toMin(S.settings.wake) + 60) { d.fired[wk] = 1; save(); notify('💧 Water time', `You're at ${d.water}/${S.settings.waterGoal}. One glass now.`); }
    // Stretch nudge on the hour during office time.
    const s = S.settings;
    if (isWorkday() && n > toMin(s.start) && n < toMin(s.off) && n % 60 < 2 && !d.fired['st' + Math.floor(n / 60)]) {
      d.fired['st' + Math.floor(n / 60)] = 1; save(); notify('🧘 Stand & stretch', 'Shoulders, neck, wrists. Look 20 ft away for 20 sec.');
    }
    if (S.timer && Date.now() >= S.timer.endsAt) {
      if (S.timer.mode === 'focus') d.focusMin += S.timer.mins;
      const was = S.timer.mode; S.timer = null; save();
      notify(was === 'focus' ? '🎯 Focus done!' : '☕ Break over', was === 'focus' ? 'Take 10. Stand up, water, eyes off the screen.' : 'Back to it — one task.');
    }
    renderHeader();
    if (tab === 'today' || tab === 'health') { const el = $('#timerText'); if (el) el.textContent = timerText(); }
  }
  function timerText() {
    if (!S.timer) return '';
    const left = Math.max(0, S.timer.endsAt - Date.now());
    return `${S.timer.mode === 'focus' ? 'Focus' : 'Break'} ${clockLeft()}`;
  }
  function clockLeft() {
    const left = S.timer ? Math.max(0, S.timer.endsAt - Date.now()) : 50 * 60e3;
    return `${Math.floor(left / 60e3)}:${String(Math.floor((left % 60e3) / 1000)).padStart(2, '0')}`;
  }

  // ---------- Icons (inline, offline) ----------
  const ICONS = {
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    car: '<rect x="3" y="10" width="18" height="7" rx="2"/><path d="M5 10l2-5h10l2 5"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/>',
    cup: '<path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4z"/><path d="M6 2v3M10 2v3M14 2v3"/>',
    doc: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    food: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="3"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    laptop: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z"/>',
    walk: '<circle cx="13" cy="4" r="2"/><path d="M9 22l3-7 3 3v4M7 12l3-4 4 1 3 3M10 8l-1 5"/>',
    bell: '<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    star: '<path fill="currentColor" stroke="none" d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    drop: '<path d="M12 2.7l5.7 5.6a8 8 0 1 1-11.4 0z"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.4-.5-2-1-3-1.1-2.1-.2-4 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.2.4-2.3 1-3.2.4 1.6 1.4 2.7 2.5 2.7z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    home: '<path d="M3 10l9-7 9 7v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
    sliders: '<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/>',
    share: '<path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    send: '<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    chev: '<path d="M9 18l6-6-6-6"/>',
    edit: '<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    pulse: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>'
  };
  const ic = (name, size = 22) => `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.sun}</svg>`;
  const BLOCK_ICON = {
    wake: 'sun', commute: 'car', settle: 'cup', notion: 'doc', assign: 'users', deep: 'target', lunch: 'food',
    afternoon: 'calendar', qa: 'search', wrap: 'check', home: 'car', dinner: 'food', personal: 'laptop',
    fiance: 'heart', wind: 'moon', 'w-wake': 'sun', 'w-move': 'walk', 'w-free': 'laptop', 'w-lunch': 'food',
    'w-rest': 'cup', 'w-review': 'calendar', 'w-walk': 'walk', 'w-fiance': 'heart', 'w-wind': 'moon'
  };
  const blockIcon = (b) => BLOCK_ICON[b.id] || 'sun';
  const AV_COLORS = ['#ffd84d', '#c85a2b', '#2b9be0', '#7b6cff', '#3ecf9a', '#ff8fb1'];
  const initials = (n) => n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  function avatar(m, i = 0, size = 40) {
    if (m.id === 'me') return `<span class="av grad" style="width:${size}px;height:${size}px">${initials(S.settings.name)}</span>`;
    const idx = Math.max(0, S.team.indexOf(m));
    return `<span class="av" style="width:${size}px;height:${size}px;background:${AV_COLORS[(idx + i) % AV_COLORS.length]}">${esc(initials(m.name))}</span>`;
  }
  const bubble = (text) => `<div class="talk"><span class="orb"></span><p class="bubbles"><span class="bub">${esc(text)}</span></p></div>`;

  // ---------- Views ----------
  let tab = 'today';
  let showAllDay = false;
  let addOwner = 'me';
  let addUrgent = false;
  const TITLES = { today: 'Today', team: 'Team', bot: 'Pilot', health: 'Health', more: 'Settings' };
  const NAV = [['today', 'home', 'Today'], ['team', 'users', 'Team'], ['bot', 'chat', 'Ask'], ['health', 'heart', 'Health'], ['more', 'sliders', 'Settings']];

  function renderHeader() {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    $('#title').textContent = TITLES[tab];
    $('#clock').textContent = `${g}, ${S.settings.name} · ` + new Date().toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const nb = $('#notifyBtn');
    nb.innerHTML = ic('bell', 20);
    nb.classList.toggle('on', !!S.settings.notify);
    $('#meAvatar').textContent = initials(S.settings.name);
  }
  function renderNav() {
    $('#nav').innerHTML = NAV.map(([id, icon, label]) => `<button data-tab="${id}" class="${tab === id ? 'active' : ''}" aria-label="${label}">${ic(icon, 20)}<span>${label}</span></button>`).join('');
  }

  function viewToday() {
    const { list, cur, next, n } = currentBlock();
    const d = day();
    const mine = openTasks('me').slice(0, 3);
    const todayMeet = S.meetings.filter((m) => m.date === todayKey());
    const upcoming = list.filter((b) => b.end > n);
    const shown = showAllDay ? list : upcoming.filter((b) => !cur || b.id !== cur.id).slice(0, 4);
    const left = cur ? cur.end - n : 0;
    const heroBlock = cur || next;
    return `
      <section class="hero">
        <div class="hero-top">
          <span class="gicon">${ic(heroBlock ? blockIcon(heroBlock) : 'moon', 26)}</span>
          <div class="hero-title">${heroBlock ? esc(heroBlock.title) : 'Time to sleep'}</div>
          ${cur ? `<button class="round dark ${d.checks[cur.id] ? 'lit' : ''}" data-act="checkCur" aria-label="Mark done">${ic(d.checks[cur.id] ? 'check' : 'star', 20)}</button>` : ''}
        </div>
        ${bubble(heroBlock ? heroBlock.tip : 'Lights out. Tomorrow starts at ' + fmt(toMin(S.settings.wake)) + '.')}
        <div class="hero-bottom">
          <span class="pill dark">${ic('clock', 18)} ${cur ? dur(left) + ' left' : next ? 'at ' + fmt(next.start) : 'rest'}</span>
          <span class="pill dark" id="timerPill">${S.timer ? ic('target', 18) + ' <span id="timerText">' + timerText() + '</span>' : ic('lock', 18) + ' ' + (cur ? 'until ' + fmt(cur.end) : 'Up next')}</span>
        </div>
      </section>

      <div class="quick3">
        <button class="tile" data-act="water"><span class="gicon sm">${ic('drop', 18)}</span><b>${d.water}<small>/${S.settings.waterGoal}</small></b><span>Water</span></button>
        <button class="tile" data-act="cig"><span class="gicon sm">${ic('flame', 18)}</span><b>${d.cigs.length}<small>/${cigGoal()}</small></b><span>Smoke</span></button>
        <button class="tile" data-act="focus"><span class="gicon sm">${ic('target', 18)}</span><b>${S.timer ? 'On' : '50'}<small>${S.timer ? '' : 'm'}</small></b><span>${S.timer ? 'Stop' : 'Focus'}</span></button>
      </div>

      <section class="card">
        <div class="card-head"><h3>Top 3 today</h3></div>
        ${[0, 1, 2].map((i) => `<label class="field"><span class="num">${i + 1}</span><input data-top="${i}" placeholder="${['Must ship today', 'Second priority', 'Nice to have'][i]}" value="${esc((d.top3 || [])[i] || '')}"></label>`).join('')}
      </section>

      ${todayMeet.map((m) => `
        <section class="card">
          <div class="item-row"><span class="gicon">${ic('calendar', 22)}</span><div class="grow"><div class="item-title">${esc(m.client)}</div><div class="meta">${ic('clock', 16)} ${esc(m.time || 'today')}</div></div></div>
          <textarea class="soft" data-meet="${m.id}" placeholder="Notes… one action per line (e.g. mridul: fix footer)">${esc(m.notes)}</textarea>
          <button class="pill light" data-act="meetTasks" data-id="${m.id}">${ic('plus', 16)} Make tasks from notes</button>
        </section>`).join('')}

      ${mine.length ? `<section class="card"><div class="card-head"><h3>My tasks</h3><button class="pill light" data-act="addMine">${ic('plus', 16)} Add</button></div>${mine.map(taskRow).join('')}</section>` : ''}

      <div class="section-label"><span>${showAllDay ? 'Full day' : 'Up next'}</span><button class="link" data-act="fullday">${showAllDay ? 'Show less' : 'Full day'}</button></div>
      ${shown.map((b, i) => `
        <section class="item ${!showAllDay && i > 1 ? 'faded' : ''} ${d.checks[b.id] ? 'done' : ''} ${cur && cur.id === b.id ? 'now' : ''}">
          <span class="gicon">${ic(blockIcon(b), 22)}</span>
          <div class="grow">
            <div class="item-title">${esc(b.title)}</div>
            <div class="meta">${ic('clock', 16)} ${fmt(b.start)} · ${dur(b.end - b.start)}</div>
          </div>
          <button class="round light ${d.checks[b.id] ? 'lit' : ''}" data-act="toggleBlock" data-id="${b.id}" aria-label="Done">${ic('check', 18)}</button>
        </section>`).join('') || '<div class="empty">Nothing else today. Rest well.</div>'}`;
  }

  function taskRow(t) {
    const o = owner(t.owner);
    const next = { todo: ['Start', 'adv'], doing: ['QA', 'qa'], qa: ['QA', 'qa'], ready: ['Sent', 'adv'] }[t.status];
    return `
      <div class="task">
        ${avatar(o, 0, 34)}
        <button class="grow task-main" data-act="edit" data-id="${t.id}">
          <span class="item-title sm">${t.priority === 'high' ? '<i class="dot red"></i>' : ''}${esc(t.title)}</span>
          <span class="meta">${esc(STATUS_LABEL[t.status])}${t.client ? ' · ' + esc(t.client) : ''} · #${t.id}</span>
        </button>
        ${next ? `<button class="pill ${t.status === 'qa' ? 'grad' : 'light'}" data-act="${next[1]}" data-id="${t.id}">${next[0]}</button>` : ''}
      </div>`;
  }

  function viewTeam() {
    const d = day();
    const briefed = S.team.filter((m) => m.brief);
    const ready = briefed.filter((m) => openTasks(m.id).length);
    const qaQueue = S.tasks.filter((t) => t.status === 'qa');
    const checked = S.clients.filter((c) => d.notion[c.id]).length;
    return `
      <section class="hero">
        <div class="hero-top">
          <span class="gicon">${ic('users', 26)}</span>
          <div class="hero-title">Today's brief</div>
          <button class="round dark" data-act="brief" aria-label="Open brief">${ic('send', 18)}</button>
        </div>
        ${bubble(ready.length ? `${ready.length} message${ready.length > 1 ? 's' : ''} ready for ${ready.map((m) => firstName(m.name)).join(', ')}. Tap send to copy or share.` : 'Add tasks for your team below, then send everyone their instructions in one tap.')}
        <div class="hero-bottom">
          <span class="pill dark stack">${briefed.map((m) => avatar(m, 0, 30).replace(/>[A-Z]{1,2}</, `>${esc(m.name[0])}<`)).join('')} ${openTasks().filter((t) => t.owner !== 'me').length}</span>
          <button class="pill dark" data-act="brief">${ic('share', 18)} Send</button>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>New task</h3></div>
        <input class="soft" id="tTitle" placeholder="What needs doing?">
        <div class="chips">
          ${[{ id: 'me', name: 'Me' }, ...S.team].map((m) => `<button class="chip ${addOwner === m.id ? 'active' : ''}" data-act="owner" data-id="${m.id}">${esc(firstName(m.name))}</button>`).join('')}
        </div>
        <div class="row">
          <input class="soft grow" id="tClient" list="clientList" placeholder="Client">
          <datalist id="clientList">${S.clients.map((c) => `<option value="${esc(c.name)}">`).join('')}</datalist>
          <button class="chip ${addUrgent ? 'active red' : ''}" data-act="urgent">Urgent</button>
          <button class="round black" data-act="addTask" aria-label="Add task">${ic('plus', 20)}</button>
        </div>
        <div class="hint" id="hint"></div>
      </section>

      ${qaQueue.length ? `<section class="card"><div class="card-head"><h3>Waiting for your QA</h3><span class="pill grad">${qaQueue.length}</span></div>${qaQueue.map(taskRow).join('')}</section>` : ''}

      <div class="section-label"><span>People</span></div>
      ${[{ id: 'me', name: 'Me', role: 'Lead · UI/UX · Framer' }, ...S.team].map((m) => {
        const c = openTasks(m.id).length;
        return `
        <button class="item" data-act="person" data-id="${m.id}">
          ${avatar(m, 0, 52)}
          <div class="grow">
            <div class="item-title">${esc(m.name)}</div>
            <div class="meta">${esc(m.role)}</div>
          </div>
          <span class="pill light">${c} ${c === 1 ? 'task' : 'tasks'}</span>
        </button>`;
      }).join('')}

      <div class="section-label"><span>Notion sweep · ${checked}/${S.clients.length}</span></div>
      <section class="card">
        ${S.clients.map((c) => `
          <div class="client">
            <button class="round light ${d.notion[c.id] ? 'lit' : ''}" data-act="notion" data-id="${c.id}" aria-label="Checked">${ic('check', 18)}</button>
            <span class="grow item-title sm">${esc(c.name)}</span>
            <span class="meta">${openTasks().filter((t) => t.client === c.name).length} open</span>
            <button class="round light sm" data-act="meet" data-name="${esc(c.name)}" aria-label="Log meeting">${ic('calendar', 16)}</button>
          </div>`).join('') || '<div class="empty">Add your clients — each morning you just tick them off as you check Notion.</div>'}
        <div class="row" style="margin-top:12px"><input class="soft grow" id="newClient" placeholder="Add client"><button class="round black" data-act="addClient" aria-label="Add client">${ic('plus', 20)}</button></div>
      </section>`;
  }

  function viewBot() {
    if (!S.chat.length) S.chat.push({ from: 'bot', text: `Salam ${S.settings.name}! I'm Pilot — I run fully on your phone, offline. ` + nowText() + '\n\nType "help" for everything I can do.', ts: Date.now() });
    const quick = ['now', 'plan', 'brief', 'tasks', 'stats', 'week', 'help'];
    return `
      <div class="chips quick">${quick.map((q) => `<button class="chip" data-say="${q}">${q}</button>`).join('')}</div>
      <div class="chat" id="chat">${S.chat.slice(-80).map((m) => m.from === 'bot'
        ? `<div class="msg-row"><span class="orb sm"></span><div class="msg bot">${esc(m.text)}</div></div>`
        : `<div class="msg me">${esc(m.text)}</div>`).join('')}</div>
      <form class="composer" id="composer">
        <input id="say" autocomplete="off" placeholder="Message Pilot…">
        <button class="round black" type="submit" aria-label="Send">${ic('send', 18)}</button>
      </form>`;
  }

  function viewHealth() {
    const d = day();
    const g = cigGoal();
    const lc = lastCig();
    const since = lc ? Math.round((Date.now() - lc) / 60e3) : null;
    const w = last7();
    const maxC = Math.max(1, ...w.map((x) => (x.d ? x.d.cigs.length : 0)));
    const sleepLen = toMin(S.settings.wake) + 1440 - sleepMin();
    return `
      <section class="hero">
        <div class="hero-top">
          <span class="gicon">${ic('flame', 26)}</span>
          <div class="hero-title">Smoking · ${d.cigs.length} of ${g}</div>
          <button class="round dark" data-act="cig" aria-label="Log a cigarette">${ic('plus', 20)}</button>
        </div>
        ${bubble(d.cigs.length > g ? 'Over today\'s limit — no guilt. Tomorrow, push each one 15 minutes later.' : 'Craving? It passes in 3–5 minutes. Water + a short walk, then tap "beat it".')}
        <div class="bars">${w.map((x) => { const c = x.d ? x.d.cigs.length : 0; return `<div><i style="height:${6 + (c / maxC) * 40}px"></i><span>${x.dt.toLocaleDateString(undefined, { weekday: 'narrow' })}</span></div>`; }).join('')}</div>
        <div class="hero-bottom">
          <span class="pill dark">${ic('clock', 18)} ${since === null ? 'none yet' : dur(since) + ' since last'}</span>
          <button class="pill dark" data-act="craving">${ic('check', 18)} Beat it${d.craves ? ' · ' + d.craves : ''}</button>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Water</h3><span class="meta">${d.water} of ${S.settings.waterGoal} · ~${expectedWater()} by now</span></div>
        <div class="drops">${Array.from({ length: S.settings.waterGoal }, (_, i) => `<button class="drop ${i < d.water ? 'full' : ''}" data-glass="${i}" aria-label="Glass ${i + 1}">${ic('drop', 18)}</button>`).join('')}</div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Focus</h3><span class="meta">${dur(d.focusMin)} today</span></div>
        <div class="big" id="timerBig">${clockLeft()}</div>
        <div class="row">
          <button class="pill ${S.timer ? 'light' : 'grad'} grow" data-act="focus">${S.timer ? 'Stop' : 'Start 50 min'}</button>
          <button class="pill light grow" data-act="break">Break 10 min</button>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Life balance</h3></div>
        <div class="item-row">
          <span class="gicon sm">${ic('heart', 18)}</span>
          <div class="grow"><div class="item-title sm">Fiancée · ${dur(d.fianceMin)}</div><div class="meter"><i style="width:${Math.min(100, (d.fianceMin / S.settings.fianceGoal) * 100)}%"></i></div></div>
          <button class="pill light" data-act="fiance" data-m="30">+30m</button>
        </div>
        <div class="item-row">
          <span class="gicon sm">${ic('laptop', 18)}</span>
          <div class="grow"><div class="item-title sm">Personal clients · ${dur(d.personalMin)} <span class="meta">/ ${dur(S.settings.personalCap)}</span></div><div class="meter ${d.personalMin > S.settings.personalCap ? 'over' : ''}"><i style="width:${Math.min(100, (d.personalMin / S.settings.personalCap) * 100)}%"></i></div></div>
          <button class="pill light" data-act="personal" data-m="30">+30m</button>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>Sleep</h3><span class="meta">${fmt(sleepMin())} → ${fmt(toMin(S.settings.wake))} · ${dur(sleepLen)}</span></div>
        <div class="row">
          <label class="time grow"><span>Slept</span><input type="time" data-sleep="sleptAt" value="${esc(d.sleptAt)}"></label>
          <label class="time grow"><span>Woke</span><input type="time" data-sleep="wokeAt" value="${esc(d.wokeAt)}"></label>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h3>2-min desk reset</h3></div>
        <div class="steps">${['Neck rolls ×5 each way', 'Shoulder shrugs ×10', 'Wrist stretch 20s each hand', 'Stand, reach up, side bends ×5', 'Look 20 ft away for 20 sec'].map((s, i) => `<div><span class="num">${i + 1}</span>${s}</div>`).join('')}</div>
      </section>`;
  }

  function viewMore() {
    const s = S.settings;
    const time = (k, l) => `<label class="set-row"><span>${l}</span><input type="time" data-set="${k}" value="${s[k]}"></label>`;
    const num = (k, l) => `<label class="set-row"><span>${l}</span><input type="number" min="0" data-set="${k}" value="${s[k]}"></label>`;
    const dn = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return `
      <div class="section-label"><span>Routine</span></div>
      <section class="card list">
        ${time('wake', 'Wake up')}${time('leave', 'Leave home')}${time('arrive', 'Reach office')}${time('start', 'Start work')}
        ${time('lunchStart', 'Lunch starts')}${time('lunchEnd', 'Lunch ends')}${time('off', 'Off work')}${time('sleep', 'Sleep')}
        <div class="set-row"><span>Workdays</span><div class="days">${dn.map((n, i) => `<button class="${s.workdays.includes(i) ? 'on' : ''}" data-wd="${i}">${n}</button>`).join('')}</div></div>
      </section>

      <div class="section-label"><span>Goals</span></div>
      <section class="card list">
        ${num('waterGoal', 'Water glasses')}${num('cigBaseline', 'Cigarettes/day at start')}${num('personalCap', 'Personal work cap (min)')}${num('fianceGoal', 'Fiancée time goal (min)')}
      </section>

      <div class="section-label"><span>Team</span></div>
      <section class="card list">
        ${S.team.map((m, i) => `
          <div class="set-row team-edit">
            ${avatar(m, 0, 36)}
            <div class="grow"><input data-team="${i}" data-k="name" value="${esc(m.name)}"><input class="meta-in" data-team="${i}" data-k="role" value="${esc(m.role)}"></div>
            <label class="switch" title="In daily brief"><input type="checkbox" data-teambrief="${i}" ${m.brief ? 'checked' : ''}><i></i></label>
          </div>`).join('')}
        <div class="meta" style="padding:10px 4px 0">Switch = included in the daily brief.</div>
      </section>

      <div class="section-label"><span>Backup</span></div>
      <section class="card">
        <div class="row">
          <button class="pill light grow" data-act="export">${ic('share', 16)} Export</button>
          <label class="pill light grow">${ic('copy', 16)} Import<input type="file" accept="application/json" id="importFile" hidden></label>
        </div>
        <button class="link danger" data-act="reset">Reset everything</button>
      </section>

      <section class="card note">
        ${NATIVE
          ? `<b>Reminders</b><p>Real alarms — they fire even when Pilot is closed. If they don't arrive: Settings → Apps → Pilot → Battery → Unrestricted.</p><p class="meta">Fully offline. No internet permission; can't read contacts, location, photos or files.</p>`
          : `<b>Install on your phone</b><p>Android: ⋮ → Install app. iPhone: Share → Add to Home Screen, then tap the bell.</p><p class="meta">Works offline. No sign-up, no AI credits, no access to anything on your phone.</p>`}
      </section>`;
  }

  // ---------- Sheets ----------
  function sheet(html) {
    closeSheet(true);
    const bg = document.createElement('div');
    bg.className = 'sheet-bg'; bg.id = 'sheet';
    bg.innerHTML = `<div class="sheet"><div class="grab"></div>${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.closest('[data-close]')) closeSheet(); });
    document.body.appendChild(bg);
    return bg;
  }
  function closeSheet(silent) { const s = $('#sheet'); if (s) s.remove(); if (!silent) render(); }

  function openBrief() {
    const msgs = S.team.filter((m) => m.brief).map((m) => ({ m, text: briefFor(m) }));
    const el = sheet(`
      <h2>Today's brief</h2>
      <p class="meta">Copy or share each one to WhatsApp or Slack.</p>
      ${msgs.map(({ m, text }, i) => `
        <div class="brief">
          <div class="item-row">${avatar(m, 0, 40)}<div class="grow"><div class="item-title sm">${esc(m.name)}</div><div class="meta">${esc(m.role)}</div></div></div>
          ${text ? `<pre>${esc(text)}</pre><div class="row"><button class="pill light grow" data-copy="${i}">${ic('copy', 16)} Copy</button><button class="pill grad grow" data-share="${i}">${ic('share', 16)} Share</button></div>` : `<div class="empty">No open tasks for ${esc(firstName(m.name))}.</div>`}
        </div>`).join('')}
      <button class="pill black block" data-close>Done</button>`);
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-copy],[data-share]'); if (!b) return;
      if (b.dataset.copy !== undefined) copy(msgs[+b.dataset.copy].text);
      if (b.dataset.share !== undefined) share(msgs[+b.dataset.share].text);
    });
  }

  function openPerson(id) {
    const m = id === 'me' ? { id: 'me', name: 'Me', role: 'Your own tasks' } : S.team.find((x) => x.id === id);
    if (!m) return;
    const ts = openTasks(m.id);
    const text = m.id === 'me' ? null : briefFor(m);
    const el = sheet(`
      <div class="item-row">${avatar(m, 0, 52)}<div class="grow"><h2 style="margin:0">${esc(m.name)}</h2><div class="meta">${esc(m.role)}</div></div></div>
      <div class="row" style="margin:14px 0"><input class="soft grow" id="pTitle" placeholder="New task for ${esc(firstName(m.name))}"><button class="round black" id="pAdd" aria-label="Add">${ic('plus', 20)}</button></div>
      ${ts.length ? ts.map(taskRow).join('') : '<div class="empty">No open tasks.</div>'}
      ${text ? `<div class="row" style="margin-top:14px"><button class="pill light grow" id="pCopy">${ic('copy', 16)} Copy brief</button><button class="pill grad grow" id="pShare">${ic('share', 16)} Share</button></div>` : ''}`);
    const add = () => {
      const v = $('#pTitle', el).value.trim(); if (!v) return;
      addTask({ title: v, ownerId: m.id }); toast('Added'); openPerson(id);
    };
    $('#pAdd', el).addEventListener('click', add);
    $('#pTitle', el).addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
    if (text) { $('#pCopy', el).addEventListener('click', () => copy(text)); $('#pShare', el).addEventListener('click', () => share(text)); }
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      const t = S.tasks.find((x) => x.id === +b.dataset.id);
      if (b.dataset.act === 'adv' && t) { advance(t); if ($('#sheet')) openPerson(id); }
      if (b.dataset.act === 'qa') openQA(b.dataset.id);
      if (b.dataset.act === 'edit') openEdit(b.dataset.id);
    });
  }

  function openQA(id) {
    const t = S.tasks.find((x) => x.id === +id);
    if (!t) return;
    if (t.status === 'todo' || t.status === 'doing') { t.status = 'qa'; save(); }
    const doneCount = () => QA_LIST.filter((_, i) => t.qa[i]).length;
    const el = sheet(`
      <h2>QA · ${esc(t.title)}</h2>
      <p class="meta">${esc(owner(t.owner).name)}${t.client ? ' · ' + esc(t.client) : ''} · nothing goes to the client until every box is ticked.</p>
      <div class="meter qa-meter"><i style="width:${(doneCount() / QA_LIST.length) * 100}%"></i></div>
      ${QA_LIST.map((q, i) => `<label class="qa-item"><input type="checkbox" data-qa="${i}" ${t.qa[i] ? 'checked' : ''}><span>${esc(q)}</span></label>`).join('')}
      <textarea class="soft" id="qaNote" placeholder="Feedback for ${esc(firstName(owner(t.owner).name))} (if anything failed)">${esc(t.qaNote || '')}</textarea>
      <div class="row">
        <button class="pill light grow" data-qaact="feedback">${ic('copy', 16)} Copy feedback</button>
        <button class="pill grad grow" data-qaact="pass">${ic('check', 16)} Passed</button>
      </div>`);
    el.addEventListener('change', (e) => {
      if (e.target.dataset.qa === undefined) return;
      t.qa[e.target.dataset.qa] = e.target.checked; save();
      $('.qa-meter i', el).style.width = (doneCount() / QA_LIST.length) * 100 + '%';
    });
    el.addEventListener('input', (e) => { if (e.target.id === 'qaNote') { t.qaNote = e.target.value; save(); } });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-qaact]'); if (!b) return;
      if (b.dataset.qaact === 'pass') {
        if (!qaPassed(t)) { toast(`${QA_LIST.length - doneCount()} checks left`); return; }
        t.status = 'ready'; save(); toast('Ready for client'); closeSheet();
      } else {
        const failed = QA_LIST.filter((_, i) => !t.qa[i]);
        copy(`QA feedback — ${t.title}${t.client ? ' (' + t.client + ')' : ''}\n\n${t.qaNote ? t.qaNote + '\n\n' : ''}Still to fix/check:\n${failed.map((f) => '• ' + f).join('\n')}\n\nPlease fix and send back for QA.`);
        t.status = 'doing'; save();
      }
    });
  }

  function openEdit(id) {
    const t = id ? S.tasks.find((x) => x.id === +id) : null;
    const el = sheet(`
      <h2>${t ? 'Edit task' : 'New task'}</h2>
      <input class="soft" id="eTitle" placeholder="Task" value="${esc(t ? t.title : '')}">
      <div class="set-row"><span>Owner</span><select id="eOwner"><option value="me">Me</option>${S.team.map((m) => `<option value="${m.id}" ${t && t.owner === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
      <div class="set-row"><span>Client</span><input id="eClient" list="clientList2" value="${esc(t ? t.client : '')}"><datalist id="clientList2">${S.clients.map((c) => `<option value="${esc(c.name)}">`).join('')}</datalist></div>
      <div class="set-row"><span>Status</span><select id="eStatus">${STATUSES.map((s) => `<option value="${s}" ${t && t.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select></div>
      <div class="set-row"><span>Priority</span><select id="ePrio"><option value="normal">Normal</option><option value="high" ${t && t.priority === 'high' ? 'selected' : ''}>Urgent</option></select></div>
      <div class="row" style="margin-top:14px">
        ${t ? `<button class="pill light" id="eDel">Delete</button>` : ''}
        <button class="pill black grow" id="eSave">Save</button>
      </div>`);
    $('#eSave', el).addEventListener('click', () => {
      const title = $('#eTitle', el).value.trim();
      if (!title) return toast('Give it a name');
      const data = { title, owner: $('#eOwner', el).value, client: $('#eClient', el).value.trim(), priority: $('#ePrio', el).value };
      let status = $('#eStatus', el).value;
      if (t) {
        if ((status === 'ready' || status === 'sent') && !qaPassed(t) && data.owner !== 'me') { status = 'qa'; toast('QA first — moved to Needs QA'); }
        Object.assign(t, data, { status });
      } else addTask({ ...data, ownerId: data.owner });
      if (data.client) ensureClient(data.client);
      save(); closeSheet();
    });
    if (t) $('#eDel', el).addEventListener('click', () => { if (confirm('Delete this task?')) { S.tasks = S.tasks.filter((x) => x !== t); save(); closeSheet(); } });
  }

  // ---------- Render & events ----------
  function render() {
    renderHeader();
    renderNav();
    document.body.dataset.tab = tab;
    $('#view').innerHTML = { today: viewToday, team: viewTeam, bot: viewBot, health: viewHealth, more: viewMore }[tab]();
    if (tab === 'bot') window.scrollTo(0, document.body.scrollHeight);
  }

  function say(text) {
    S.chat.push({ from: 'me', text, ts: Date.now() });
    S.chat.push({ from: 'bot', text: botReply(text), ts: Date.now() });
    if (S.chat.length > 300) S.chat = S.chat.slice(-200);
    save(); render();
  }

  document.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    tab = b.dataset.tab; render(); window.scrollTo(0, tab === 'bot' ? document.body.scrollHeight : 0);
  });
  $('#notifyBtn').addEventListener('click', enableNotify);

  const view = $('#view');
  view.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act],[data-say],[data-glass],[data-wd]');
    if (!el) return;
    const d = day();
    if (el.dataset.say) return say(el.dataset.say);
    if (el.dataset.glass !== undefined) { const i = +el.dataset.glass; d.water = d.water === i + 1 ? i : i + 1; save(); return render(); }
    if (el.dataset.wd !== undefined) {
      const i = +el.dataset.wd, w = S.settings.workdays;
      S.settings.workdays = w.includes(i) ? w.filter((x) => x !== i) : [...w, i].sort(); save(); return render();
    }
    const id = el.dataset.id;
    const t = id ? S.tasks.find((x) => x.id === +id) : null;
    switch (el.dataset.act) {
      case 'water': d.water++; save(); toast(`Water ${d.water}/${S.settings.waterGoal}`); break;
      case 'checkCur': { const c = currentBlock().cur; if (c) { d.checks[c.id] = !d.checks[c.id]; save(); } break; }
      case 'toggleBlock': d.checks[id] = !d.checks[id]; save(); break;
      case 'fullday': showAllDay = !showAllDay; break;
      case 'notion': d.notion[id] = !d.notion[id]; save(); break;
      case 'person': return openPerson(id);
      case 'owner': addOwner = id; { const v = $('#tTitle').value, c = $('#tClient').value; render(); $('#tTitle').value = v; $('#tClient').value = c; } return;
      case 'urgent': addUrgent = !addUrgent; el.classList.toggle('active', addUrgent); el.classList.toggle('red', addUrgent); return;
      case 'focus': if (S.timer) S.timer = null; else startTimer('focus'); save(); break;
      case 'break': startTimer('break'); break;
      case 'cig': d.cigs.push(Date.now()); save(); toast(cigText(true).split('\n')[0]); break;
      case 'craving': d.craves = (d.craves || 0) + 1; save(); toast(`Nice! ${d.craves} craving${d.craves > 1 ? 's' : ''} beaten today 💪`); break;
      case 'fiance': d.fianceMin += +el.dataset.m; save(); break;
      case 'personal': d.personalMin += +el.dataset.m; save(); if (d.personalMin > S.settings.personalCap) toast('Over your cap — her time now 💛'); break;
      case 'adv': if (t) advance(t); break;
      case 'qa': return openQA(id);
      case 'edit': return openEdit(id);
      case 'addMine': return openEdit(null);
      case 'del': if (t && confirm(`Delete #${t.id}?`)) { S.tasks = S.tasks.filter((x) => x !== t); save(); } break;
      case 'brief': return openBrief();
      case 'addTask': {
        const title = $('#tTitle').value.trim();
        if (!title) return toast('Write the task first');
        const client = $('#tClient').value.trim();
        if (client) ensureClient(client);
        const nt = addTask({ title, ownerId: addOwner, client, priority: addUrgent ? 'high' : 'normal' });
        addUrgent = false;
        toast(`Added for ${owner(nt.owner).name}`);
        break;
      }
      case 'addClient': { const n = $('#newClient').value.trim(); if (n) ensureClient(n); break; }
      case 'delClient': S.clients = S.clients.filter((c) => String(c.id) !== id); save(); break;
      case 'meet': { const time = prompt(`Meeting with ${el.dataset.name} — time? (e.g. 3pm)`) ; if (time !== null) { S.meetings.push({ id: Date.now(), client: el.dataset.name, date: todayKey(), time, notes: '' }); save(); toast('Meeting added to Today'); } break; }
      case 'meetTasks': {
        const mt = S.meetings.find((x) => x.id === +id);
        const lines = (mt?.notes || '').split('\n').map((l) => l.replace(/^[-•*\d.\s]+/, '').trim()).filter(Boolean);
        lines.forEach((l) => { const mm = l.match(/^([a-zA-Z]+)\s*:\s*(.+)$/); const who = mm && matchOwner(mm[1]); addTask({ title: who ? mm[2] : l, ownerId: who || 'me', client: mt.client }); });
        toast(`${lines.length} task${lines.length === 1 ? '' : 's'} created`); break;
      }
      case 'export': {
        if (NATIVE) { NATIVE.shareText(JSON.stringify(S), `pilot-backup-${todayKey()}.json`); break; }
        const blob = new Blob([JSON.stringify(S, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `pilot-backup-${todayKey()}.json`; a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000); break;
      }
      case 'reset': if (confirm('Erase everything on this phone? Export a backup first.')) { S = DEFAULT_STATE(); save(); } break;
    }
    render();
  });

  view.addEventListener('change', (e) => {
    const el = e.target, d = day();
    if (el.dataset.set) {
      const k = el.dataset.set;
      S.settings[k] = el.type === 'number' ? Math.max(0, +el.value || 0) : el.value; save(); toast('Saved');
    }
    else if (el.dataset.sleep) { d[el.dataset.sleep] = el.value; save(); }
    else if (el.dataset.teambrief !== undefined) { S.team[+el.dataset.teambrief].brief = el.checked; save(); }
    else if (el.dataset.team !== undefined) { S.team[+el.dataset.team][el.dataset.k] = el.value; save(); toast('Saved'); }
    else if (el.id === 'importFile' && el.files[0]) {
      const r = new FileReader();
      r.onload = () => {
        try { const data = JSON.parse(r.result); if (!data.settings || !data.tasks) throw 0; S = { ...DEFAULT_STATE(), ...data }; save(); toast('Backup restored'); render(); }
        catch (err) { toast('That file isn\'t a Pilot backup'); }
      };
      r.readAsText(el.files[0]);
    }
  });

  view.addEventListener('input', (e) => {
    const el = e.target, d = day();
    if (el.dataset.top !== undefined) { d.top3 = d.top3 || []; d.top3[+el.dataset.top] = el.value; save(); }
    if (el.dataset.meet) { const m = S.meetings.find((x) => x.id === +el.dataset.meet); if (m) { m.notes = el.value; save(); } }
    if (el.id === 'tTitle') {
      const v = el.value.toLowerCase(), o = addOwner, h = $('#hint');
      let msg = '';
      if (/framer/.test(v) && o === 'ahmad') msg = '⚠️ Ahmad doesn\'t do Framer — Mridul (senior) or Agha (junior)?';
      else if (/(wordpress|\bwp\b|php|custom code|backend|woocommerce)/.test(v) && o !== 'ahmad') msg = '💡 Sounds like Ahmad\'s area.';
      else if (/(seo|meta|keyword|backlink|ranking)/.test(v) && o !== 'wajahat') msg = '💡 Wajahat could own this (SEO).';
      else if (/(design|figma|mockup|banner|ui|landing page design)/.test(v) && o !== 'abdullah' && o !== 'me') msg = '💡 Design work — Abdullah?';
      h.textContent = msg;
    }
  });

  view.addEventListener('submit', (e) => {
    if (e.target.id !== 'composer') return;
    e.preventDefault();
    const inp = $('#say'); const v = inp.value; if (!v.trim()) return;
    say(v); setTimeout(() => $('#say')?.focus(), 50);
  });

  // Android back button: close a sheet, then go back to Today, then leave the app.
  window.pilotBack = () => {
    if ($('#sheet')) { closeSheet(); return true; }
    if (tab !== 'today') { tab = 'today'; render(); window.scrollTo(0, 0); return true; }
    return false;
  };
  window.pilotResume = () => { tick(); if (tab !== 'bot' && !$('#sheet')) render(); };

  // ---------- Boot ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  if (NATIVE) {
    // First launch of the APK: turn reminders on and ask Android for notification permission.
    if (!S.settings.nativeInit) { S.settings.nativeInit = true; S.settings.notify = true; NATIVE.requestNotify(); save(); }
    syncNative();
  }
  render();
  tick();
  setInterval(tick, 20e3);
  setInterval(() => {
    if (!S.timer) return;
    const a = $('#timerText'), b = $('#timerBig');
    if (a) a.textContent = timerText();
    if (b) b.textContent = clockLeft();
  }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); if (tab !== 'bot' && !$('#sheet')) render(); } });
})();
