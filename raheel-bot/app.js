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
    if (!('Notification' in window)) { toast('Reminders not supported on this browser'); return; }
    const p = await Notification.requestPermission();
    S.settings.notify = p === 'granted'; save(); render();
    toast(S.settings.notify ? 'Reminders on 🔔' : 'Reminders blocked in browser settings');
  }
  async function notify(title, body) {
    if (!S.settings.notify || Notification.permission !== 'granted') { toast(title); return; }
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      if (reg) reg.showNotification(title, { body, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: title });
      else new Notification(title, { body, icon: 'icons/icon-192.png' });
    } catch (e) { toast(title); }
  }
  function tick() {
    const d = day();
    const { list, n } = currentBlock();
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
    return `${S.timer.mode === 'focus' ? '🎯 Focus' : '☕ Break'} · ${Math.floor(left / 60e3)}:${String(Math.floor((left % 60e3) / 1000)).padStart(2, '0')} left`;
  }

  // ---------- Views ----------
  let tab = 'today';
  let teamFilter = 'all';

  function renderHeader() {
    const h = new Date().getHours();
    const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
    $('#hello').textContent = `${g}, ${S.settings.name}`;
    $('#clock').textContent = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }) + ' · ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    $('#notifyBtn').classList.toggle('on', !!S.settings.notify);
  }

  function viewToday() {
    const { list, cur, next, n } = currentBlock();
    const d = day();
    const pct = cur ? Math.round(((n - cur.start) / (cur.end - cur.start)) * 100) : 0;
    const mine = openTasks('me').slice(0, 4);
    const todayMeet = S.meetings.filter((m) => m.date === todayKey());
    return `
      <section class="card now">
        <div class="label">${cur ? 'Right now · until ' + fmt(cur.end) : 'Free time'}</div>
        <div class="title">${cur ? cur.icon + ' ' + esc(cur.title) : next ? 'Next: ' + next.icon + ' ' + esc(next.title) : 'Sleep 😴'}</div>
        <div class="tip">${esc(cur ? cur.tip : next ? 'Starts at ' + fmt(next.start) : 'Lights out. Tomorrow starts at ' + fmt(toMin(S.settings.wake)))}</div>
        ${cur ? `<div class="bar"><i style="width:${pct}%"></i></div>` : ''}
        <div class="spacer"></div>
        <div class="row wrap">
          <button class="btn sm" data-act="water">💧 ${d.water}/${S.settings.waterGoal}</button>
          <button class="btn sm" data-act="focus">${S.timer ? '⏹ Stop timer' : '🎯 Focus 50'}</button>
          <span class="small" id="timerText">${timerText()}</span>
        </div>
      </section>

      <section class="card">
        <h3>Today's top 3 <small>${isWorkday() ? 'Workday' : 'Weekend'}</small></h3>
        ${[0, 1, 2].map((i) => `<div class="row" style="margin-bottom:6px"><b class="muted">${i + 1}</b><input class="input" data-top="${i}" placeholder="${['The thing that must ship today', 'Second priority', 'Nice to have'][i]}" value="${esc((d.top3 || [])[i] || '')}"></div>`).join('')}
      </section>

      ${todayMeet.length ? `<section class="card"><h3>Meetings today</h3>${todayMeet.map((m) => `<div class="task"><div class="ttl">🤝 ${esc(m.client)} ${m.time ? '· ' + esc(m.time) : ''}</div><textarea class="input" data-meet="${m.id}" placeholder="Notes & action items…">${esc(m.notes)}</textarea><div class="row" style="margin-top:6px"><button class="btn sm" data-act="meetTasks" data-id="${m.id}">Turn lines into my tasks</button></div></div>`).join('')}</section>` : ''}

      <section class="card">
        <h3>My tasks <small><button class="btn sm" data-act="addMine">+ Add</button></small></h3>
        ${mine.length ? mine.map(taskRow).join('') : '<div class="muted small">Nothing assigned to you. Add one or tell the bot "me: …"</div>'}
      </section>

      <section class="card">
        <h3>Schedule <small>${list.filter((b) => d.checks[b.id]).length}/${list.length} done</small></h3>
        <ul class="timeline">
          ${list.map((b) => `
            <li class="${cur && cur.id === b.id ? 'current' : ''} ${d.checks[b.id] ? 'done' : ''}">
              <span class="t">${fmt(b.start)}</span>
              <input type="checkbox" data-check="${b.id}" ${d.checks[b.id] ? 'checked' : ''} aria-label="Done">
              <div><div class="ttl">${b.icon} ${esc(b.title)}</div><div class="d">${esc(b.tip)}</div></div>
            </li>`).join('')}
        </ul>
      </section>`;
  }

  function taskRow(t) {
    const o = owner(t.owner);
    const nextLabel = { todo: 'Start', doing: 'Send to QA', qa: 'Run QA', ready: 'Mark sent', sent: '' }[t.status];
    return `
      <div class="task">
        <div class="row">
          <div class="grow">
            <div class="ttl">${t.priority === 'high' ? '🔴 ' : ''}${esc(t.title)}</div>
            <div class="small muted">#${t.id} · ${esc(o.name)}${t.client ? ' · ' + esc(t.client) : ''}</div>
          </div>
          <span class="pill ${t.status}">${STATUS_LABEL[t.status]}</span>
        </div>
        <div class="row" style="margin-top:6px">
          ${nextLabel ? `<button class="btn sm ${t.status === 'qa' ? 'primary' : ''}" data-act="${t.status === 'qa' ? 'qa' : 'adv'}" data-id="${t.id}">${nextLabel}</button>` : ''}
          ${t.status !== 'qa' && t.status !== 'sent' ? `<button class="btn sm" data-act="qa" data-id="${t.id}">QA</button>` : ''}
          <button class="btn sm" data-act="edit" data-id="${t.id}">Edit</button>
          <button class="btn sm warn" data-act="del" data-id="${t.id}">✕</button>
        </div>
      </div>`;
  }

  function viewTeam() {
    const d = day();
    const people = [{ id: 'all', name: 'All' }, { id: 'me', name: 'Me' }, ...S.team];
    const list = teamFilter === 'all' ? openTasks() : openTasks(teamFilter);
    const qaQueue = S.tasks.filter((t) => t.status === 'qa');
    const checked = S.clients.filter((c) => d.notion[c.id]).length;
    return `
      <section class="card">
        <h3>Daily brief <small>${S.team.filter((m) => m.brief).map((m) => firstName(m.name)).join(', ')}</small></h3>
        <div class="muted small">Add tasks below, then send everyone their instructions in one go.</div>
        <div class="spacer"></div>
        <button class="btn primary block" data-act="brief">📨 Build today's team messages</button>
      </section>

      ${qaQueue.length ? `<section class="card"><h3>🔍 QA queue <small>${qaQueue.length} waiting</small></h3>${qaQueue.map(taskRow).join('')}</section>` : ''}

      <section class="card">
        <h3>Add task</h3>
        <div class="row">
          <select class="input" id="tOwner" style="max-width:40%">
            <option value="me">Me</option>
            ${S.team.map((m) => `<option value="${m.id}">${esc(firstName(m.name))}</option>`).join('')}
          </select>
          <select class="input" id="tPrio" style="max-width:30%"><option value="normal">Normal</option><option value="high">🔴 Urgent</option></select>
        </div>
        <div class="spacer"></div>
        <input class="input" id="tTitle" placeholder="What needs doing?">
        <div class="spacer"></div>
        <div class="row">
          <input class="input grow" id="tClient" list="clientList" placeholder="Client (optional)">
          <datalist id="clientList">${S.clients.map((c) => `<option value="${esc(c.name)}">`).join('')}</datalist>
          <button class="btn primary" data-act="addTask">Add</button>
        </div>
        <div class="small muted" id="hint" style="margin-top:6px"></div>
      </section>

      <div class="chips">${people.map((p) => `<button class="chip ${teamFilter === p.id ? 'active' : ''}" data-filter="${p.id}">${esc(firstName(p.name))} ${p.id !== 'all' ? `· ${openTasks(p.id).length}` : ''}</button>`).join('')}</div>
      <div class="spacer"></div>
      <section class="card">
        <h3>Open tasks <small>${list.length}</small></h3>
        ${list.length ? list.map(taskRow).join('') : '<div class="muted small">All clear.</div>'}
      </section>

      <section class="card">
        <h3>Notion sweep — clients <small>${checked}/${S.clients.length} checked today</small></h3>
        ${S.clients.map((c) => `
          <div class="row" style="padding:6px 0">
            <input type="checkbox" data-notion="${c.id}" ${d.notion[c.id] ? 'checked' : ''}>
            <span class="grow">${esc(c.name)}</span>
            <span class="small muted">${openTasks().filter((t) => t.client === c.name).length} open</span>
            <button class="btn sm" data-act="meet" data-name="${esc(c.name)}">🤝</button>
            <button class="btn sm warn" data-act="delClient" data-id="${c.id}">✕</button>
          </div>`).join('') || '<div class="muted small">Add your active clients so the morning sweep becomes a checklist.</div>'}
        <div class="spacer"></div>
        <div class="row"><input class="input grow" id="newClient" placeholder="New client name"><button class="btn" data-act="addClient">Add</button></div>
      </section>

      <section class="card">
        <h3>Who does what</h3>
        ${S.team.map((m) => `<div class="small" style="padding:3px 0"><b>${esc(m.name)}</b> — <span class="muted">${esc(m.role)}${m.brief ? '' : ' · not in daily brief'}</span></div>`).join('')}
      </section>`;
  }

  function viewBot() {
    if (!S.chat.length) S.chat.push({ from: 'bot', text: `Salam ${S.settings.name}! I'm Pilot — I run fully on your phone, offline. ` + nowText() + '\n\nType "help" for everything I can do.', ts: Date.now() });
    const quick = ['now', 'plan', 'brief', 'tasks', 'water', 'cig', 'focus', 'stats', 'week', 'help'];
    return `
      <div class="quick">${quick.map((q) => `<button class="chip" data-say="${q}">${q}</button>`).join('')}</div>
      <div class="chat" id="chat">${S.chat.slice(-80).map((m) => `<div class="msg ${m.from}">${esc(m.text)}</div>`).join('')}</div>
      <form class="composer" id="composer">
        <input class="input grow" id="say" autocomplete="off" placeholder='Try "mridul: fix navbar for Acme !"'>
        <button class="btn primary" type="submit">Send</button>
      </form>`;
  }

  function viewHealth() {
    const d = day();
    const g = cigGoal();
    const lc = lastCig();
    const since = lc ? Math.round((Date.now() - lc) / 60e3) : null;
    const w = last7();
    const maxC = Math.max(1, ...w.map((x) => (x.d ? x.d.cigs.length : 0)));
    return `
      <section class="card">
        <h3>💧 Water <small>${d.water}/${S.settings.waterGoal} · should be ~${expectedWater()} by now</small></h3>
        <div class="glasses">${Array.from({ length: S.settings.waterGoal }, (_, i) => `<button class="glass ${i < d.water ? 'full' : ''}" data-glass="${i}" aria-label="Glass ${i + 1}"></button>`).join('')}</div>
      </section>

      <section class="card">
        <h3>🚬 Smoking <small>goal ≤ ${g}/day, drops 1 each week</small></h3>
        <div class="stats">
          <div class="stat"><b style="color:${d.cigs.length > g ? 'var(--red)' : 'var(--green)'}">${d.cigs.length}</b><span>today</span></div>
          <div class="stat"><b>${since === null ? '—' : dur(since)}</b><span>since last</span></div>
          <div class="stat"><b>${g}</b><span>today's limit</span></div>
        </div>
        <div class="spacer"></div>
        <div class="row" style="align-items:flex-end;height:50px;gap:4px">
          ${w.map((x) => { const c = x.d ? x.d.cigs.length : 0; return `<div class="grow" style="text-align:center"><div style="height:${(c / maxC) * 36}px;background:var(--amber);border-radius:4px 4px 0 0;opacity:.8"></div><div class="small muted">${x.dt.toLocaleDateString(undefined, { weekday: 'narrow' })}</div></div>`; }).join('')}
        </div>
        <div class="spacer"></div>
        <div class="row"><button class="btn grow" data-act="cig">Log a cigarette</button><button class="btn good grow" data-act="craving">I beat a craving 💪</button></div>
        <div class="small muted" style="margin-top:8px">Tip: the 9:20 arrival cig is habit, not need. Replace it with water + a lap around the block for one week and see.</div>
      </section>

      <section class="card">
        <h3>🎯 Focus timer <small>${dur(d.focusMin)} today</small></h3>
        <div class="row"><button class="btn primary grow" data-act="focus">${S.timer ? '⏹ Stop' : 'Start 50 min'}</button><button class="btn grow" data-act="break">10 min break</button></div>
        <div class="small" id="timerText" style="margin-top:8px">${timerText()}</div>
      </section>

      <section class="card">
        <h3>💛 Life balance <small>today</small></h3>
        <div class="row" style="margin-bottom:8px"><span class="grow">Fiancée time <b>${dur(d.fianceMin)}</b> <span class="muted small">/ 2–3h</span></span><button class="btn sm" data-act="fiance" data-m="30">+30m</button><button class="btn sm" data-act="fiance" data-m="60">+1h</button></div>
        <div class="bar"><i style="width:${Math.min(100, (d.fianceMin / 150) * 100)}%;background:#ff7eb6"></i></div>
        <div class="spacer"></div>
        <div class="row" style="margin-bottom:8px"><span class="grow">Personal clients <b>${dur(d.personalMin)}</b> <span class="muted small">/ cap ${dur(S.settings.personalCap)}</span></span><button class="btn sm" data-act="personal" data-m="30">+30m</button><button class="btn sm" data-act="personal" data-m="60">+1h</button></div>
        <div class="bar"><i style="width:${Math.min(100, (d.personalMin / S.settings.personalCap) * 100)}%;background:${d.personalMin > S.settings.personalCap ? 'var(--red)' : 'var(--blue)'}"></i></div>
      </section>

      <section class="card">
        <h3>😴 Sleep <small>target ${fmt(sleepMin())} → ${fmt(toMin(S.settings.wake))} (${dur(toMin(S.settings.wake) + 1440 - sleepMin())})</small></h3>
        <div class="row"><label class="grow"><span class="small muted">Slept at (last night)</span><input class="input" type="time" data-sleep="sleptAt" value="${esc(d.sleptAt)}"></label><label class="grow"><span class="small muted">Woke at</span><input class="input" type="time" data-sleep="wokeAt" value="${esc(d.wokeAt)}"></label></div>
        <div class="small muted" style="margin-top:8px">Last 30 min before bed: no reels, no work chat. Phone charges outside reach.</div>
      </section>

      <section class="card">
        <h3>🧘 Desk reset (2 min)</h3>
        <div class="small">1. Neck rolls ×5 each way<br>2. Shoulder shrugs ×10<br>3. Wrist stretch 20s each hand (Figma/Framer hands!)<br>4. Stand, reach up, side bends ×5<br>5. 20-20-20: look 20 ft away for 20 sec</div>
      </section>`;
  }

  function viewMore() {
    const s = S.settings;
    const time = (k, l) => `<label class="grow"><span class="f">${l}</span><input class="input" type="time" data-set="${k}" value="${s[k]}"></label>`;
    const num = (k, l) => `<label class="grow"><span class="f">${l}</span><input class="input" type="number" min="0" data-set="${k}" value="${s[k]}"></label>`;
    const dn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `
      <section class="card">
        <h3>My routine</h3>
        <div class="row">${time('wake', 'Wake')}${time('leave', 'Leave home')}</div>
        <div class="row">${time('arrive', 'Reach office')}${time('start', 'Start work')}</div>
        <div class="row">${time('lunchStart', 'Lunch start')}${time('lunchEnd', 'Lunch end')}</div>
        <div class="row">${time('off', 'Off work')}${time('sleep', 'Sleep')}</div>
        <span class="f">Workdays</span>
        <div class="chips">${dn.map((n, i) => `<button class="chip ${s.workdays.includes(i) ? 'active' : ''}" data-wd="${i}">${n}</button>`).join('')}</div>
      </section>

      <section class="card">
        <h3>Goals</h3>
        <div class="row">${num('waterGoal', 'Water glasses / day')}${num('cigBaseline', 'Cigs/day when you started')}</div>
        <div class="row">${num('personalCap', 'Personal work cap (min)')}${num('fianceGoal', 'Fiancée time goal (min)')}</div>
      </section>

      <section class="card">
        <h3>Team</h3>
        ${S.team.map((m, i) => `
          <div class="row" style="margin-bottom:6px">
            <input class="input grow" data-team="${i}" data-k="name" value="${esc(m.name)}">
            <input class="input grow" data-team="${i}" data-k="role" value="${esc(m.role)}">
            <label class="small row" title="Include in daily brief"><input type="checkbox" data-teambrief="${i}" ${m.brief ? 'checked' : ''}>brief</label>
          </div>`).join('')}
      </section>

      <section class="card">
        <h3>Backup <small>your data never leaves this phone</small></h3>
        <div class="row wrap">
          <button class="btn" data-act="export">⬇️ Export backup</button>
          <label class="btn">⬆️ Import<input type="file" accept="application/json" id="importFile" hidden></label>
          <button class="btn warn" data-act="reset">Reset all</button>
        </div>
      </section>

      <section class="card">
        <h3>Install on your phone</h3>
        <div class="small">
          <b>Android (Chrome):</b> open the app link → ⋮ menu → <i>Install app</i> / <i>Add to Home screen</i>.<br>
          <b>iPhone (Safari):</b> open the link → Share → <i>Add to Home Screen</i>. Open it from the icon, then tap 🔔 to allow reminders (iOS 16.4+).<br><br>
          <span class="muted">Works fully offline. No sign-up, no AI credits, no access to contacts, location, photos or anything else on your phone. Reminders fire while the app is open or recently used — keep it pinned for best results.</span>
        </div>
      </section>`;
  }

  // ---------- Sheets ----------
  function sheet(html) {
    closeSheet();
    const bg = document.createElement('div');
    bg.className = 'sheet-bg'; bg.id = 'sheet';
    bg.innerHTML = `<div class="sheet">${html}</div>`;
    bg.addEventListener('click', (e) => { if (e.target === bg || e.target.dataset.close !== undefined) closeSheet(); });
    document.body.appendChild(bg);
    return bg;
  }
  function closeSheet() { const s = $('#sheet'); if (s) s.remove(); render(); }

  function openBrief() {
    const msgs = S.team.filter((m) => m.brief).map((m) => ({ m, text: briefFor(m) }));
    const el = sheet(`
      <h2>📨 Today's team brief</h2>
      <div class="small muted">Copy or share each one to WhatsApp / Slack. Wajahat is excluded by default.</div>
      ${msgs.map(({ m, text }, i) => `
        <div class="card" style="margin-top:10px">
          <h3>${esc(m.name)} <small>${esc(m.role)}</small></h3>
          ${text ? `<pre class="copy">${esc(text)}</pre><div class="row"><button class="btn sm" data-copy="${i}">Copy</button><button class="btn sm primary" data-share="${i}">Share</button></div>` : `<div class="small muted">No open tasks for ${esc(firstName(m.name))}. Add some in Team.</div>`}
        </div>`).join('')}
      <button class="btn block" data-close>Close</button>`);
    el.addEventListener('click', (e) => {
      const c = e.target.dataset.copy, sh = e.target.dataset.share;
      if (c !== undefined) copy(msgs[+c].text);
      if (sh !== undefined) share(msgs[+sh].text);
    });
  }

  function openQA(id) {
    const t = S.tasks.find((x) => x.id === +id);
    if (!t) return;
    if (t.status === 'todo' || t.status === 'doing') { t.status = 'qa'; save(); }
    const el = sheet(`
      <h2>🔍 QA · #${t.id} ${esc(t.title)}</h2>
      <div class="small muted">${esc(owner(t.owner).name)}${t.client ? ' · ' + esc(t.client) : ''} — nothing goes to the client until every box is ticked.</div>
      <div class="spacer"></div>
      ${QA_LIST.map((q, i) => `<label class="qa-item"><input type="checkbox" data-qa="${i}" ${t.qa[i] ? 'checked' : ''}><span>${esc(q)}</span></label>`).join('')}
      <div class="spacer"></div>
      <label class="f">Feedback for ${esc(firstName(owner(t.owner).name))} (if anything failed)</label>
      <textarea class="input" id="qaNote" placeholder="e.g. Mobile nav overlaps logo at 390px">${esc(t.qaNote || '')}</textarea>
      <div class="spacer"></div>
      <div class="row">
        <button class="btn grow" data-qaact="feedback">Copy feedback</button>
        <button class="btn primary grow" data-qaact="pass">Passed → Ready</button>
      </div>`);
    el.addEventListener('change', (e) => { if (e.target.dataset.qa !== undefined) { t.qa[e.target.dataset.qa] = e.target.checked; save(); } });
    el.addEventListener('input', (e) => { if (e.target.id === 'qaNote') { t.qaNote = e.target.value; save(); } });
    el.addEventListener('click', (e) => {
      const a = e.target.dataset.qaact;
      if (a === 'pass') {
        if (!qaPassed(t)) { toast(`${QA_LIST.filter((_, i) => !t.qa[i]).length} checks left`); return; }
        t.status = 'ready'; save(); toast('Ready for client ✅'); closeSheet();
      }
      if (a === 'feedback') {
        const failed = QA_LIST.filter((_, i) => !t.qa[i]);
        copy(`QA feedback — ${t.title}${t.client ? ' (' + t.client + ')' : ''}\n\n${t.qaNote ? t.qaNote + '\n\n' : ''}Still to fix/check:\n${failed.map((f) => '• ' + f).join('\n')}\n\nPlease fix and send back for QA.`);
        t.status = 'doing'; save();
      }
    });
  }

  function openEdit(id) {
    const t = id ? S.tasks.find((x) => x.id === +id) : null;
    const el = sheet(`
      <h2>${t ? 'Edit task #' + t.id : 'New task for me'}</h2>
      <label class="f">Task</label><input class="input" id="eTitle" value="${esc(t ? t.title : '')}">
      <label class="f">Owner</label>
      <select class="input" id="eOwner"><option value="me">Me</option>${S.team.map((m) => `<option value="${m.id}" ${t && t.owner === m.id ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select>
      <label class="f">Client</label><input class="input" id="eClient" value="${esc(t ? t.client : '')}">
      <label class="f">Status</label>
      <select class="input" id="eStatus">${STATUSES.map((s) => `<option value="${s}" ${t && t.status === s ? 'selected' : ''}>${STATUS_LABEL[s]}</option>`).join('')}</select>
      <label class="f">Priority</label>
      <select class="input" id="ePrio"><option value="normal">Normal</option><option value="high" ${t && t.priority === 'high' ? 'selected' : ''}>🔴 Urgent</option></select>
      <div class="spacer"></div>
      <button class="btn primary block" id="eSave">Save</button>`);
    $('#eSave', el).addEventListener('click', () => {
      const title = $('#eTitle', el).value.trim();
      if (!title) return toast('Give it a name');
      const data = { title, owner: $('#eOwner', el).value, client: $('#eClient', el).value.trim(), priority: $('#ePrio', el).value };
      let status = $('#eStatus', el).value;
      if (t) {
        if ((status === 'ready' || status === 'sent') && !qaPassed(t) && t.owner !== 'me') { status = 'qa'; toast('QA first — moved to Needs QA'); }
        Object.assign(t, data, { status });
      } else addTask({ ...data, ownerId: data.owner });
      if (data.client) ensureClient(data.client);
      save(); closeSheet();
    });
  }

  // ---------- Render & events ----------
  function render() {
    renderHeader();
    const v = $('#view');
    v.innerHTML = { today: viewToday, team: viewTeam, bot: viewBot, health: viewHealth, more: viewMore }[tab]();
    document.querySelectorAll('.tabs button').forEach((b) => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'bot') { const c = $('#chat'); window.scrollTo(0, document.body.scrollHeight); c && c.lastElementChild && c.lastElementChild.scrollIntoView(); }
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
    const el = e.target.closest('[data-act],[data-filter],[data-say],[data-glass],[data-wd]');
    if (!el) return;
    const d = day();
    if (el.dataset.filter) { teamFilter = el.dataset.filter; return render(); }
    if (el.dataset.say) return say(el.dataset.say);
    if (el.dataset.glass !== undefined) { const i = +el.dataset.glass; d.water = d.water === i + 1 ? i : i + 1; save(); return render(); }
    if (el.dataset.wd !== undefined) {
      const i = +el.dataset.wd, w = S.settings.workdays;
      S.settings.workdays = w.includes(i) ? w.filter((x) => x !== i) : [...w, i].sort(); save(); return render();
    }
    const id = el.dataset.id;
    const t = id ? S.tasks.find((x) => x.id === +id) : null;
    switch (el.dataset.act) {
      case 'water': d.water++; save(); toast(`💧 ${d.water}/${S.settings.waterGoal}`); break;
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
        const nt = addTask({ title, ownerId: $('#tOwner').value, client, priority: $('#tPrio').value });
        toast(`Added #${nt.id} for ${owner(nt.owner).name}`);
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
    if (el.dataset.check) { d.checks[el.dataset.check] = el.checked; save(); render(); }
    else if (el.dataset.notion) { d.notion[el.dataset.notion] = el.checked; save(); render(); }
    else if (el.dataset.set) {
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
      const v = el.value.toLowerCase(), o = $('#tOwner').value, h = $('#hint');
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

  // ---------- Boot ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
  render();
  tick();
  setInterval(tick, 20e3);
  setInterval(() => { const el = $('#timerText'); if (el && S.timer) el.textContent = timerText(); }, 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { tick(); if (tab !== 'bot' && !$('#sheet')) render(); } });
})();
