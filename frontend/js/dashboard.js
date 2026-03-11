// Cybersecurity Roadmap dashboard
requireAuth();

const { PHASES, DAYS, getPhase, getDateForDay, getTodayDay } = window.CYBER_ROADMAP;

let selectedDay = getTodayDay();
let currentTab = 'read';
let expandedPhaseId = getPhase(selectedDay).id;
let progress = {};

// Load/save progress in localStorage
const PROGRESS_KEY = 'cyber_roadmap_progress';

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    progress = raw ? JSON.parse(raw) : {};
  } catch {
    progress = {};
  }
}

function saveProgress() {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function renderTopBar(container) {
  const top = createEl('div', 'roadmap-topbar');

  const left = document.createElement('div');
  const badge = createEl('div');
  badge.style.color = '#ff2d55';
  badge.style.fontSize = '8px';
  badge.style.letterSpacing = '0.3em';
  badge.textContent = '◈ REDTEAM ACADEMY';

  const title = createEl('div');
  title.style.color = '#fff';
  title.style.fontSize = '14px';
  title.style.letterSpacing = '0.05em';
  const phase = getPhase(selectedDay);
  title.innerHTML = `<span style="color:${phase.color}">295-DAY</span> DAILY PLAN`;

  left.appendChild(badge);
  left.appendChild(title);

  const spacer = document.createElement('div');
  spacer.style.flex = '1';

  // Simple jump + today controls (search omitted for now for simplicity)
  const controls = document.createElement('div');
  controls.style.display = 'flex';
  controls.style.gap = '4px';

  const jumpInput = document.createElement('input');
  jumpInput.placeholder = 'Day #';
  jumpInput.style.width = '60px';
  jumpInput.style.background = '#0f1020';
  jumpInput.style.border = '1px solid #181928';
  jumpInput.style.color = '#ccc';
  jumpInput.style.padding = '6px 8px';
  jumpInput.style.fontSize = '10px';
  jumpInput.style.borderRadius = '4px';
  jumpInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const n = parseInt(jumpInput.value, 10);
      if (n >= 1 && n <= 295 && DAYS[n]) {
        selectedDay = n;
        expandedPhaseId = getPhase(n).id;
        currentTab = 'read';
        renderApp();
      }
      jumpInput.value = '';
    }
  });

  const todayBtn = document.createElement('button');
  todayBtn.textContent = `TODAY D${getTodayDay()}`;
  todayBtn.style.background = `${getPhase(getTodayDay()).color}15`;
  todayBtn.style.border = `1px solid ${getPhase(getTodayDay()).color}`;
  todayBtn.style.color = getPhase(getTodayDay()).color;
  todayBtn.style.padding = '6px 10px';
  todayBtn.style.cursor = 'pointer';
  todayBtn.style.fontSize = '9px';
  todayBtn.style.borderRadius = '4px';
  todayBtn.style.letterSpacing = '0.08em';
  todayBtn.addEventListener('click', () => {
    selectedDay = getTodayDay();
    expandedPhaseId = getPhase(selectedDay).id;
    currentTab = 'read';
    renderApp();
  });

  controls.appendChild(jumpInput);
  controls.appendChild(todayBtn);

  top.appendChild(left);
  top.appendChild(spacer);
  top.appendChild(controls);

  container.appendChild(top);
}

function renderSidebar(container) {
  const sidebar = createEl('div', 'roadmap-sidebar');

  PHASES.forEach((p) => {
    const progInfo = phaseProgress(p);
    const isActive = expandedPhaseId === p.id;

    const phaseHeader = document.createElement('div');
    phaseHeader.style.padding = '8px 12px';
    phaseHeader.style.cursor = 'pointer';
    phaseHeader.style.borderLeft = `3px solid ${isActive ? p.color : 'transparent'}`;
    phaseHeader.style.background = isActive ? `${p.color}08` : 'transparent';

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.justifyContent = 'space-between';
    row.style.alignItems = 'center';

    const label = document.createElement('div');
    label.style.color = isActive ? p.color : '#444';
    label.style.fontSize = '10px';
    label.style.fontWeight = 'bold';
    label.textContent = p.label;

    const pct = document.createElement('div');
    pct.style.fontSize = '8px';
    pct.style.color = progInfo.pct > 0 ? p.color : '#2a2b3a';
    pct.textContent = `${progInfo.pct}%`;

    row.appendChild(label);
    row.appendChild(pct);

    const title = document.createElement('div');
    title.style.color = '#3a3b4a';
    title.style.fontSize = '9px';
    title.style.marginTop = '2px';
    title.textContent = p.title;

    const barOuter = document.createElement('div');
    barOuter.style.height = '2px';
    barOuter.style.background = '#111';
    barOuter.style.marginTop = '4px';
    barOuter.style.borderRadius = '1px';

    const barInner = document.createElement('div');
    barInner.style.height = '100%';
    barInner.style.width = `${progInfo.pct}%`;
    barInner.style.background = p.color;
    barInner.style.borderRadius = '1px';

    barOuter.appendChild(barInner);

    phaseHeader.appendChild(row);
    phaseHeader.appendChild(title);
    phaseHeader.appendChild(barOuter);

    phaseHeader.addEventListener('click', () => {
      expandedPhaseId = isActive ? null : p.id;
      renderApp();
    });

    sidebar.appendChild(phaseHeader);

    if (isActive) {
      const daysWrap = document.createElement('div');
      daysWrap.style.background = '#060710';

      for (let day = p.days[0]; day <= p.days[1]; day++) {
        const isSelected = day === selectedDay;
        const isDone = !!progress[day];
        const isToday = day === getTodayDay();

        const rowEl = document.createElement('div');
        rowEl.style.padding = '5px 10px 5px 18px';
        rowEl.style.cursor = 'pointer';
        rowEl.style.display = 'flex';
        rowEl.style.gap = '6px';
        rowEl.style.alignItems = 'center';
        rowEl.style.background = isSelected ? `${p.color}12` : 'transparent';
        rowEl.style.borderLeft = `2px solid ${
          isSelected ? p.color : isDone ? p.color + '40' : '#0d0e1a'
        }`;

        const indicator = document.createElement('span');
        indicator.style.fontSize = '8px';
        indicator.style.minWidth = '22px';
        indicator.style.color = isToday
          ? '#ff9f0a'
          : isSelected
          ? p.color
          : isDone
          ? p.color + 'aa'
          : '#2a2b3a';
        indicator.style.fontWeight = isToday ? 'bold' : 'normal';
        indicator.textContent = isDone ? '✓' : isToday ? '●' : String(day);

        const titleSpan = document.createElement('span');
        titleSpan.style.fontSize = '10px';
        titleSpan.style.color = isSelected ? '#ddd' : isDone ? '#555' : '#3a3b4a';
        const labelText = DAYS[day]?.title || `Day ${day}`;
        titleSpan.textContent = labelText.length > 22 ? labelText.slice(0, 22) : labelText;

        rowEl.appendChild(indicator);
        rowEl.appendChild(titleSpan);

        rowEl.addEventListener('click', () => {
          selectedDay = day;
          currentTab = 'read';
          renderApp();
        });

        daysWrap.appendChild(rowEl);
      }

      sidebar.appendChild(daysWrap);
    }
  });

  container.appendChild(sidebar);
}

function phaseProgress(phase) {
  const [s, e] = phase.days;
  let done = 0;
  for (let d = s; d <= e; d++) {
    if (progress[d]) done++;
  }
  const total = e - s + 1;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { done, total, pct };
}

function parseContentInto(container, text) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  parts.forEach((part) => {
    if (!part) return;
    if (part.startsWith('```')) {
      const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
      const wrap = document.createElement('div');
      wrap.style.background = '#030408';
      wrap.style.border = '1px solid #141520';
      wrap.style.borderRadius = '6px';
      wrap.style.overflow = 'hidden';
      wrap.style.margin = '10px 0';

      const header = document.createElement('div');
      header.style.background = '#0a0b12';
      header.style.borderBottom = '1px solid #141520';
      header.style.padding = '5px 12px';
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';

      const label = createEl('span');
      label.style.color = '#2a2b3a';
      label.style.fontSize = '9px';
      label.style.letterSpacing = '0.15em';
      label.textContent = 'TERMINAL';

      const btn = document.createElement('button');
      btn.textContent = 'COPY';
      btn.style.background = 'none';
      btn.style.border = 'none';
      btn.style.color = '#333';
      btn.style.cursor = 'pointer';
      btn.style.fontSize = '9px';
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(code);
        btn.textContent = '✓ COPIED';
        btn.style.color = '#69ff47';
        setTimeout(() => {
          btn.textContent = 'COPY';
          btn.style.color = '#333';
        }, 1500);
      });

      header.appendChild(label);
      header.appendChild(btn);

      const pre = document.createElement('pre');
      pre.style.margin = '0';
      pre.style.padding = '12px 14px';
      pre.style.color = '#69ff47';
      pre.style.fontSize = '11px';
      pre.style.lineHeight = '1.8';
      pre.style.overflowX = 'auto';
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.wordBreak = 'break-word';
      pre.textContent = code;

      wrap.appendChild(header);
      wrap.appendChild(pre);
      container.appendChild(wrap);
      return;
    }

    const lines = part.split('\n');
    lines.forEach((line) => {
      if (line.startsWith('## ')) {
        const h = document.createElement('h3');
        h.style.color = '#fff';
        h.style.fontSize = '15px';
        h.style.margin = '12px 0 6px';
        h.style.borderBottom = '1px solid #141520';
        h.style.paddingBottom = '4px';
        h.textContent = line.slice(3);
        container.appendChild(h);
        return;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        const div = document.createElement('div');
        div.style.color = '#e0e0e0';
        div.style.fontWeight = 'bold';
        div.style.margin = '6px 0 2px';
        div.style.fontSize = '13px';
        div.textContent = line.slice(2, -2);
        container.appendChild(div);
        return;
      }
      if (line.startsWith('- ') || line.startsWith('• ')) {
        const div = document.createElement('div');
        div.style.color = '#aaa';
        div.style.fontSize = '12px';
        div.style.lineHeight = '1.7';
        div.style.paddingLeft = '12px';
        div.textContent = '▸ ' + line.slice(2);
        container.appendChild(div);
        return;
      }
      if (line.trim() === '') {
        const spacer = document.createElement('div');
        spacer.style.height = '6px';
        container.appendChild(spacer);
        return;
      }
      const div = document.createElement('div');
      div.style.color = '#aaa';
      div.style.fontSize = '12px';
      div.style.lineHeight = '1.8';
      div.textContent = line;
      container.appendChild(div);
    });
  });
}

function renderReadTab(container, lesson, color) {
  const box = document.createElement('div');

  const header = document.createElement('div');
  header.style.background = `${color}08`;
  header.style.border = `1px solid ${color}20`;
  header.style.borderLeft = `3px solid ${color}`;
  header.style.borderRadius = '6px';
  header.style.padding = '10px 16px';
  header.style.marginBottom = '14px';

  const label = document.createElement('div');
  label.style.color = color;
  label.style.fontSize = '9px';
  label.style.letterSpacing = '0.2em';
  label.style.marginBottom = '2px';
  label.textContent = "TODAY'S READING";

  const desc = document.createElement('div');
  desc.style.color = '#999';
  desc.style.fontSize = '11px';
  desc.textContent =
    'Read everything below. Code blocks can be run in your terminal. All content applies directly to security testing.';

  header.appendChild(label);
  header.appendChild(desc);
  box.appendChild(header);

  parseContentInto(box, lesson.reading);

  container.appendChild(box);
}

function renderTutorialTab(container, lesson, color) {
  const header = document.createElement('div');
  header.style.background = 'rgba(255,159,10,0.06)';
  header.style.border = '1px solid rgba(255,159,10,0.2)';
  header.style.borderLeft = '3px solid #ff9f0a';
  header.style.borderRadius = '6px';
  header.style.padding = '10px 16px';
  header.style.marginBottom = '14px';

  const label = document.createElement('div');
  label.style.color = '#ff9f0a';
  label.style.fontSize = '9px';
  label.style.letterSpacing = '0.2em';
  label.style.marginBottom = '2px';
  label.textContent = 'ACTIVE RECALL METHOD';

  const desc = document.createElement('div');
  desc.style.color = '#888';
  desc.style.fontSize = '11px';
  desc.textContent =
    'Write your answer BEFORE revealing. Honesty with yourself is the only way this works.';

  header.appendChild(label);
  header.appendChild(desc);
  container.appendChild(header);

  lesson.tutorial.forEach((q, i) => {
    const card = document.createElement('div');
    card.style.background = '#0a0b14';
    card.style.border = '1px solid #141520';
    card.style.borderRadius = '8px';
    card.style.padding = '16px';
    card.style.marginBottom = '12px';

    const topRow = document.createElement('div');
    topRow.style.display = 'flex';
    topRow.style.gap = '10px';
    topRow.style.marginBottom = '10px';
    topRow.style.alignItems = 'flex-start';

    const badge = document.createElement('span');
    badge.style.background = `${color}18`;
    badge.style.color = color;
    badge.style.padding = '2px 9px';
    badge.style.borderRadius = '3px';
    badge.style.fontSize = '10px';
    badge.style.fontWeight = 'bold';
    badge.textContent = `Q${i + 1}`;

    const question = document.createElement('p');
    question.style.color = '#ddd';
    question.style.fontSize = '13px';
    question.style.margin = '0';
    question.style.lineHeight = '1.7';
    question.textContent = q.q;

    topRow.appendChild(badge);
    topRow.appendChild(question);

    const hintBox = document.createElement('div');
    hintBox.style.background = 'rgba(255,159,10,0.05)';
    hintBox.style.border = '1px solid rgba(255,159,10,0.12)';
    hintBox.style.borderRadius = '4px';
    hintBox.style.padding = '7px 12px';
    hintBox.style.marginBottom = '10px';

    const hintLabel = document.createElement('span');
    hintLabel.style.color = '#ff9f0a';
    hintLabel.style.fontSize = '9px';
    hintLabel.textContent = 'HINT  ';

    const hintText = document.createElement('span');
    hintText.style.color = '#777';
    hintText.style.fontSize = '11px';
    hintText.textContent = q.hint;

    hintBox.appendChild(hintLabel);
    hintBox.appendChild(hintText);

    const textarea = document.createElement('textarea');
    textarea.placeholder = 'Write your answer here first…';
    textarea.style.width = '100%';
    textarea.style.minHeight = '70px';
    textarea.style.background = '#060710';
    textarea.style.border = '1px solid #161720';
    textarea.style.borderRadius = '4px';
    textarea.style.color = '#bbb';
    textarea.style.fontSize = '12px';
    textarea.style.padding = '8px 12px';
    textarea.style.marginBottom = '8px';
    textarea.style.resize = 'vertical';

    const revealBtn = document.createElement('button');
    revealBtn.textContent = 'REVEAL ANSWER';
    revealBtn.style.background = `${color}12`;
    revealBtn.style.border = `1px solid ${color}`;
    revealBtn.style.color = color;
    revealBtn.style.padding = '6px 16px';
    revealBtn.style.cursor = 'pointer';
    revealBtn.style.fontSize = '10px';
    revealBtn.style.borderRadius = '4px';
    revealBtn.style.letterSpacing = '0.1em';

    const answerWrap = document.createElement('div');
    answerWrap.style.display = 'none';

    revealBtn.addEventListener('click', () => {
      revealBtn.style.display = 'none';
      textarea.readOnly = true;
      answerWrap.style.display = 'block';

      if (textarea.value.trim()) {
        const yourBox = document.createElement('div');
        yourBox.style.background = 'rgba(105,255,71,0.04)';
        yourBox.style.border = '1px solid rgba(105,255,71,0.12)';
        yourBox.style.borderRadius = '4px';
        yourBox.style.padding = '10px 14px';
        yourBox.style.marginBottom = '8px';

        const yourLabel = document.createElement('div');
        yourLabel.style.color = '#69ff47';
        yourLabel.style.fontSize = '9px';
        yourLabel.style.marginBottom = '3px';
        yourLabel.textContent = 'YOUR ANSWER';

        const yourText = document.createElement('div');
        yourText.style.color = '#777';
        yourText.style.fontSize = '11px';
        yourText.style.whiteSpace = 'pre-wrap';
        yourText.style.lineHeight = '1.7';
        yourText.textContent = textarea.value;

        yourBox.appendChild(yourLabel);
        yourBox.appendChild(yourText);
        answerWrap.appendChild(yourBox);
      }

      const modelBox = document.createElement('div');
      modelBox.style.background = `${color}07`;
      modelBox.style.border = `1px solid ${color}22`;
      modelBox.style.borderLeft = `3px solid ${color}`;
      modelBox.style.borderRadius = '4px';
      modelBox.style.padding = '12px 14px';

      const modelLabel = document.createElement('div');
      modelLabel.style.color = color;
      modelLabel.style.fontSize = '9px';
      modelLabel.style.marginBottom = '4px';
      modelLabel.textContent = 'MODEL ANSWER';

      const modelText = document.createElement('div');
      modelText.style.color = '#ccc';
      modelText.style.fontSize = '12px';
      modelText.style.whiteSpace = 'pre-wrap';
      modelText.style.lineHeight = '1.8';
      modelText.style.fontFamily = 'monospace';
      modelText.textContent = q.a;

      modelBox.appendChild(modelLabel);
      modelBox.appendChild(modelText);
      answerWrap.appendChild(modelBox);
    });

    card.appendChild(topRow);
    card.appendChild(hintBox);
    card.appendChild(textarea);
    card.appendChild(revealBtn);
    card.appendChild(answerWrap);
    container.appendChild(card);
  });
}

function renderPracticalTab(container, lesson) {
  const header = document.createElement('div');
  header.style.background = 'rgba(105,255,71,0.05)';
  header.style.border = '1px solid rgba(105,255,71,0.2)';
  header.style.borderLeft = '3px solid #69ff47';
  header.style.borderRadius = '6px';
  header.style.padding = '10px 16px';
  header.style.marginBottom = '14px';

  const label = document.createElement('div');
  label.style.color = '#69ff47';
  label.style.fontSize = '9px';
  label.style.letterSpacing = '0.2em';
  label.style.marginBottom = '2px';
  label.textContent = 'LAB INSTRUCTIONS';

  const desc = document.createElement('div');
  desc.style.color = '#888';
  desc.style.fontSize = '11px';
  desc.textContent =
    'Run every command on your local Kali Linux. Do not just read — type it out. Your Kali VM should be open now.';

  header.appendChild(label);
  header.appendChild(desc);
  container.appendChild(header);

  parseContentInto(container, lesson.practical);
}

function renderMainPanel(container) {
  const main = createEl('div', 'roadmap-main-panel');
  const lesson = DAYS[selectedDay];
  const phase = getPhase(selectedDay);

  if (!lesson) {
    const empty = document.createElement('div');
    empty.style.flex = '1';
    empty.style.display = 'flex';
    empty.style.alignItems = 'center';
    empty.style.justifyContent = 'center';
    empty.style.color = '#333';
    empty.textContent = 'Select a day from the sidebar.';
    main.appendChild(empty);
    container.appendChild(main);
    return;
  }

  // Header
  const header = createEl('div', 'roadmap-day-header');
  const top = document.createElement('div');
  top.style.display = 'flex';
  top.style.justifyContent = 'space-between';
  top.style.alignItems = 'flex-start';
  top.style.gap = '10px';
  top.style.flexWrap = 'wrap';

  const left = document.createElement('div');

  const chips = document.createElement('div');
  chips.style.display = 'flex';
  chips.style.gap = '6px';
  chips.style.marginBottom = '4px';
  chips.style.flexWrap = 'wrap';
  chips.style.alignItems = 'center';

  const dayChip = document.createElement('span');
  dayChip.style.background = `${phase.color}15`;
  dayChip.style.border = `1px solid ${phase.color}30`;
  dayChip.style.color = phase.color;
  dayChip.style.padding = '2px 8px';
  dayChip.style.fontSize = '8px';
  dayChip.style.borderRadius = '2px';
  dayChip.style.letterSpacing = '0.1em';
  dayChip.textContent = `DAY ${selectedDay}`;

  const dateChip = document.createElement('span');
  dateChip.style.background = '#0f1020';
  dateChip.style.border = '1px solid #181928';
  dateChip.style.color = '#444';
  dateChip.style.padding = '2px 8px';
  dateChip.style.fontSize = '8px';
  dateChip.style.borderRadius = '2px';
  dateChip.textContent = getDateForDay(selectedDay);

  const phaseChip = document.createElement('span');
  phaseChip.style.background = `${phase.color}10`;
  phaseChip.style.color = phase.color;
  phaseChip.style.padding = '2px 8px';
  phaseChip.style.fontSize = '8px';
  phaseChip.style.borderRadius = '2px';
  phaseChip.textContent = phase.title;

  chips.appendChild(dayChip);
  chips.appendChild(dateChip);
  chips.appendChild(phaseChip);

  const title = document.createElement('h2');
  title.style.color = '#fff';
  title.style.fontSize = '17px';
  title.style.margin = '0 0 2px';
  title.style.letterSpacing = '0.03em';
  title.textContent = lesson.title;

  const topic = document.createElement('div');
  topic.style.color = '#555';
  topic.style.fontSize = '11px';
  topic.textContent = lesson.topic;

  left.appendChild(chips);
  left.appendChild(title);
  left.appendChild(topic);

  const right = document.createElement('div');
  right.style.display = 'flex';
  right.style.gap = '8px';
  right.style.alignItems = 'center';

  if (!progress[selectedDay]) {
    const doneBtn = document.createElement('button');
    doneBtn.textContent = '✓ MARK DONE';
    doneBtn.style.background = 'rgba(105,255,71,0.08)';
    doneBtn.style.border = '1px solid rgba(105,255,71,0.25)';
    doneBtn.style.color = '#69ff47';
    doneBtn.style.padding = '6px 14px';
    doneBtn.style.cursor = 'pointer';
    doneBtn.style.fontSize = '10px';
    doneBtn.style.borderRadius = '4px';
    doneBtn.addEventListener('click', () => {
      progress[selectedDay] = true;
      saveProgress();
      renderApp();
    });
    right.appendChild(doneBtn);
  } else {
    const doneLabel = document.createElement('span');
    doneLabel.style.color = '#69ff47';
    doneLabel.style.fontSize = '11px';
    doneLabel.textContent = '✓ COMPLETED';
    right.appendChild(doneLabel);
  }

  if (selectedDay < 295) {
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'NEXT DAY →';
    nextBtn.style.background = `${phase.color}12`;
    nextBtn.style.border = `1px solid ${phase.color}`;
    nextBtn.style.color = phase.color;
    nextBtn.style.padding = '6px 14px';
    nextBtn.style.cursor = 'pointer';
    nextBtn.style.fontSize = '10px';
    nextBtn.style.borderRadius = '4px';
    nextBtn.addEventListener('click', () => {
      selectedDay += 1;
      expandedPhaseId = getPhase(selectedDay).id;
      currentTab = 'read';
      renderApp();
    });
    right.appendChild(nextBtn);
  }

  top.appendChild(left);
  top.appendChild(right);
  header.appendChild(top);

  const routine = document.createElement('div');
  routine.style.display = 'flex';
  routine.style.gap = '3px';
  routine.style.marginTop = '10px';
  [
    ['📖 20min', 'Theory'],
    ['💻 90min', 'Hands-on'],
    ['📝 30min', 'Notes'],
    ['🔄 10min', 'Review'],
  ].forEach(([t, s]) => {
    const box = document.createElement('div');
    box.style.flex = '1';
    box.style.background = '#0d0e1c';
    box.style.border = '1px solid #141520';
    box.style.borderRadius = '3px';
    box.style.padding = '4px 6px';
    box.style.textAlign = 'center';

    const topLine = document.createElement('div');
    topLine.style.color = '#888';
    topLine.style.fontSize = '9px';
    topLine.textContent = t;

    const bottomLine = document.createElement('div');
    bottomLine.style.color = '#444';
    bottomLine.style.fontSize = '8px';
    bottomLine.textContent = s;

    box.appendChild(topLine);
    box.appendChild(bottomLine);
    routine.appendChild(box);
  });

  header.appendChild(routine);
  main.appendChild(header);

  // Tabs
  const tabsWrap = createEl('div', 'roadmap-tabs');
  const tabs = [
    { id: 'read', label: 'READ', icon: '📖' },
    { id: 'tutorial', label: 'TUTORIAL', icon: '❓' },
    { id: 'practical', label: 'PRACTICAL', icon: '⚙️' },
  ];

  tabs.forEach((t) => {
    const btn = createEl('button', 'roadmap-tab-btn');
    if (currentTab === t.id) {
      btn.classList.add('active');
      btn.style.borderBottomColor = phase.color;
      btn.style.color = phase.color;
    }
    btn.textContent = `${t.icon} ${t.label}`;
    btn.addEventListener('click', () => {
      currentTab = t.id;
      renderApp();
    });
    tabsWrap.appendChild(btn);
  });

  main.appendChild(tabsWrap);

  // Content
  const content = createEl('div', 'roadmap-content');
  if (currentTab === 'read') {
    renderReadTab(content, lesson, phase.color);
  } else if (currentTab === 'tutorial') {
    renderTutorialTab(content, lesson, phase.color);
  } else if (currentTab === 'practical') {
    renderPracticalTab(content, lesson);
  }
  main.appendChild(content);

  container.appendChild(main);
}

function renderBottomBar(container) {
  const bar = createEl('div', 'roadmap-bottom-bar');
  const totalDone = Object.values(progress).filter(Boolean).length;

  const done = document.createElement('div');
  done.style.color = '#69ff47';
  done.textContent = `✓ ${totalDone} / 295 days done`;

  const dates = document.createElement('div');
  dates.style.color = '#444';
  dates.textContent = 'Started: 11 Mar 2026  ·  End: 31 Dec 2026';

  const spacer = document.createElement('div');
  spacer.style.flex = '1';

  const routine = document.createElement('div');
  routine.style.color = '#333';
  routine.textContent = 'Daily: 20min read · 90min lab · 30min notes · 10min review';

  bar.appendChild(done);
  bar.appendChild(dates);
  bar.appendChild(spacer);
  bar.appendChild(routine);

  container.appendChild(bar);
}

function renderApp() {
  const root = document.getElementById('roadmap-app');
  if (!root) return;
  root.innerHTML = '';

  renderTopBar(root);

  const layout = createEl('div', 'roadmap-layout');
  renderSidebar(layout);
  renderMainPanel(layout);
  root.appendChild(layout);

  renderBottomBar(root);
}

// Logout button (kept from original app)
document.getElementById('logout-btn').addEventListener('click', async () => {
  await api.logout();
  window.location.href = 'login.html';
});

// Init
loadProgress();
renderApp();

