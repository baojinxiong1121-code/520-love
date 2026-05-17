/* ================================================================
   520 情侣网页 — 全部交互逻辑
   ================================================================ */

// ==================== 1. 心形飘落 Canvas ====================
(function initHearts() {
  const canvas = document.getElementById('heartsCanvas');
  const ctx = canvas.getContext('2d');
  let hearts = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const heartChars = ['💕', '💗', '💖', '💝', '💘', '✨', '🌸'];

  class Heart {
    constructor() {
      this.reset(true);
    }
    reset(init) {
      this.x = Math.random() * canvas.width;
      this.y = init ? Math.random() * canvas.height : -40;
      this.size = 14 + Math.random() * 22;
      this.speed = 0.4 + Math.random() * 1.2;
      this.opacity = 0.3 + Math.random() * 0.5;
      this.wobble = Math.random() * Math.PI * 2;
      this.wobbleSpeed = 0.01 + Math.random() * 0.02;
      this.char = heartChars[Math.floor(Math.random() * heartChars.length)];
    }
    update() {
      this.y += this.speed;
      this.wobble += this.wobbleSpeed;
      this.x += Math.sin(this.wobble) * 0.5;
      if (this.y > canvas.height + 40) {
        this.reset(false);
      }
    }
    draw(ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.font = `${this.size}px serif`;
      ctx.fillText(this.char, this.x, this.y);
      ctx.restore();
    }
  }

  hearts = Array.from({ length: 35 }, () => new Heart());

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hearts.forEach(h => { h.update(); h.draw(ctx); });
    animId = requestAnimationFrame(animate);
  }
  animate();
})();

// ==================== 2. 音乐开关 ====================
(function initMusic() {
  const btn = document.getElementById('musicToggle');
  let audio = null;
  let playing = false;

  btn.addEventListener('click', () => {
    if (!audio) {
      // ★ 替换音乐：将下方路径改为你的音乐文件路径
      //    例如："assets/bgm.mp3" 或 "https://example.com/song.mp3"
      audio = new Audio('assets/bgm.mp3');
      audio.loop = true;
      audio.volume = 0.4;
    }
    if (playing) {
      audio.pause();
      btn.textContent = '🎵';
      btn.classList.remove('playing');
    } else {
      // 需要用户交互后才能播放，这里用 try-catch 兜底
      audio.play().catch(() => {
        console.log('音乐文件不存在，请放入 assets/bgm.mp3');
      });
      btn.textContent = '🎶';
      btn.classList.add('playing');
    }
    playing = !playing;
  });
})();

// ==================== 3. 纪念日计算 ====================
(function initAnniversary() {
  const startInput = document.getElementById('startDate');
  const calcBtn = document.getElementById('calcDaysBtn');
  const resultDiv = document.getElementById('daysResult');
  const daysNum = document.getElementById('daysNumber');
  const daysExtra = document.getElementById('daysExtra');

  // 从 localStorage 读取上次保存的日期
  const saved = localStorage.getItem('520_startDate');
  if (saved) {
    startInput.value = saved;
    autoCalc();
  }

  calcBtn.addEventListener('click', autoCalc);
  startInput.addEventListener('change', () => {
    localStorage.setItem('520_startDate', startInput.value);
  });

  function autoCalc() {
    const val = startInput.value;
    if (!val) return;
    localStorage.setItem('520_startDate', val);

    const start = new Date(val);
    const today = new Date();
    const diffMs = today - start;
    if (diffMs < 0) {
      daysNum.textContent = '—';
      daysExtra.textContent = '日期还没到哦～';
      resultDiv.classList.add('show');
      return;
    }
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    daysNum.textContent = days;
    const years = Math.floor(days / 365);
    const remain = days % 365;
    const months = Math.floor(remain / 30);
    const rDays = remain % 30;
    let extra = '';
    if (years > 0) extra += `${years} 年 `;
    if (months > 0) extra += `${months} 个月 `;
    extra += `${rDays} 天`;
    daysExtra.textContent = `也就是 ${extra}，每一天都算数。`;

    // 特殊日子彩蛋
    if (days === 100 || days === 200 || days === 365 || days === 520 ||
        days === 999 || days === 1000 || days === 1314) {
      daysExtra.textContent += ` ✨ 今天是特别的日子！`;
    }

    resultDiv.classList.add('show');
  }
})();

// ==================== 4. 心动留言 ====================
(function initMessages() {
  const input = document.getElementById('msgInput');
  const saveBtn = document.getElementById('saveMsgBtn');
  const container = document.getElementById('msgCards');
  const KEY = '520_messages';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
  }
  function save(msgs) {
    localStorage.setItem(KEY, JSON.stringify(msgs));
  }

  function render() {
    const msgs = load();
    container.innerHTML = '';
    msgs.reverse().forEach((m, i) => {
      const card = document.createElement('div');
      card.className = 'msg-card';
      card.style.animationDelay = `${i * 0.06}s`;
      card.innerHTML = `
        <button class="delete-btn" data-id="${m.id}">×</button>
        <span>${escapeHtml(m.text)}</span>
        <span class="msg-date">${m.date}</span>
      `;
      container.appendChild(card);
    });
    // 删除事件
    container.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = Number(btn.dataset.id);
        const msgs = load();
        save(msgs.filter(m => m.id !== id));
        render();
      });
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  saveBtn.addEventListener('click', () => {
    const text = input.value.trim();
    if (!text) return;
    const msgs = load();
    msgs.push({
      id: Date.now(),
      text,
      date: new Date().toLocaleDateString('zh-CN')
    });
    // 最多保留 30 条
    if (msgs.length > 30) msgs.shift();
    save(msgs);
    input.value = '';
    render();
  });

  // 回车保存
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveBtn.click();
  });

  render();
})();

// ==================== 5. 回忆墙（照片占位） ====================
(function initGallery() {
  const grid = document.getElementById('galleryGrid');
  const items = [
    { emoji: '🌅', label: '第一次看日落' },
    { emoji: '🍜', label: '最爱的深夜食堂' },
    { emoji: '🎬', label: '一起刷的那部电影' },
    { emoji: '🌧️', label: '雨中撑伞的那天' },
    { emoji: '🎂', label: '为你过的生日' },
    { emoji: '✈️', label: '第一次旅行' },
  ];
  // ★ 替换为真实图片：将 background 替换为 background-image: url(...)
  grid.innerHTML = items.map(item => `
    <div class="gallery-card">
      <span>${item.emoji}</span>
      <div class="card-overlay">${item.label}</div>
    </div>
  `).join('');
})();

// ==================== 6. 翻牌记忆游戏 ====================
(function initMemoryGame() {
  const grid = document.getElementById('memoryGrid');
  const movesEl = document.getElementById('memMoves');
  const timerEl = document.getElementById('memTimer');
  const resetBtn = document.getElementById('resetMemoryBtn');

  const EMOJIS = ['💕', '💗', '💖', '💝', '💘', '💌'];
  let cards = [];
  let flipped = [];
  let moves = 0;
  let matched = 0;
  let lockBoard = false;
  let timerSec = 0;
  let timerInterval = null;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function startTimer() {
    if (timerInterval) return;
    timerInterval = setInterval(() => {
      timerSec++;
      const m = Math.floor(timerSec / 60).toString().padStart(2, '0');
      const s = (timerSec % 60).toString().padStart(2, '0');
      timerEl.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  function resetGame() {
    stopTimer();
    timerSec = 0;
    moves = 0;
    matched = 0;
    flipped = [];
    lockBoard = false;
    movesEl.textContent = '0';
    timerEl.textContent = '00:00';
    cards = shuffle([...EMOJIS, ...EMOJIS].map((emoji, i) => ({
      emoji, id: i, flipped: false, matched: false
    })));
    renderCards();
  }

  function renderCards() {
    grid.innerHTML = cards.map((c, i) => `
      <div class="memory-card${c.flipped || c.matched ? ' flipped' : ''}${c.matched ? ' matched' : ''}"
           data-index="${i}">
        <div class="card-inner">
          <div class="card-front">💝</div>
          <div class="card-back">${c.emoji}</div>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.memory-card').forEach(el => {
      el.addEventListener('click', () => onCardClick(el));
    });
  }

  function onCardClick(el) {
    if (lockBoard) return;
    const idx = Number(el.dataset.index);
    const card = cards[idx];
    if (card.flipped || card.matched) return;

    startTimer();
    card.flipped = true;
    flipped.push({ el, card, idx });
    el.classList.add('flipped');

    if (flipped.length === 2) {
      moves++;
      movesEl.textContent = moves;
      checkMatch();
    }
  }

  function checkMatch() {
    lockBoard = true;
    const [a, b] = flipped;
    if (a.card.emoji === b.card.emoji) {
      a.card.matched = true;
      b.card.matched = true;
      a.el.classList.add('matched');
      b.el.classList.add('matched');
      matched += 2;
      flipped = [];
      lockBoard = false;
      if (matched === cards.length) {
        stopTimer();
        setTimeout(() => {
          alert(`🎉 全部配对成功！\n步数：${moves}\n用时：${timerEl.textContent}\n太棒了！`);
        }, 500);
      }
    } else {
      setTimeout(() => {
        a.card.flipped = false;
        b.card.flipped = false;
        a.el.classList.remove('flipped');
        b.el.classList.remove('flipped');
        flipped = [];
        lockBoard = false;
      }, 700);
    }
  }

  resetBtn.addEventListener('click', resetGame);
  resetGame();
})();

// ==================== 7. 情侣默契问答 ====================
(function initQuiz() {
  const container = document.getElementById('quizContainer');
  const resultDiv = document.getElementById('quizResult');
  const scoreEl = document.getElementById('quizScore');
  const commentEl = document.getElementById('quizComment');
  const submitBtn = document.getElementById('submitQuizBtn');
  const resetBtn = document.getElementById('resetQuizBtn');

  const questions = [
    {
      q: '1. TA 最喜欢的口味是？',
      opts: ['甜的', '辣的', '咸的', '清淡的']
    },
    {
      q: '2. TA 生气的时候通常会？',
      opts: ['不说话', '直接发脾气', '生闷气等你哄', '吃很多东西']
    },
    {
      q: '3. TA 最想去旅行的地方是？',
      opts: ['海边', '雪山', '古镇', '大城市逛街']
    },
    {
      q: '4. TA 最喜欢的季节是？',
      opts: ['春天', '夏天', '秋天', '冬天']
    },
    {
      q: '5. TA 最常对你说的一句话是？',
      opts: ['你在干嘛', '我想你了', '吃饭了吗', '晚安']
    },
    {
      q: '6. TA 难过时会怎么表现？',
      opts: ['偷偷掉眼泪', '找你倾诉', '一个人待着', '假装没事']
    },
    {
      q: '7. TA 最擅长的事情是？',
      opts: ['做饭', '吐槽', '安慰你', '拖延']
    },
    {
      q: '8. 你们第一次约会的地点是？',
      opts: ['电影院', '餐厅', '公园散步', '商场逛街']
    },
    {
      q: '9. TA 最喜欢的礼物类型是？',
      opts: ['花', '手写信', '实用的小东西', '惊喜体验']
    },
    {
      q: '10. 你觉得 TA 最喜欢你哪一点？',
      opts: ['温柔体贴', '幽默有趣', '靠谱有安全感', '长得好看']
    },
  ];

  function renderQuestions() {
    container.innerHTML = questions.map((q, qi) => `
      <div class="quiz-item">
        <div class="q-title">${q.q}</div>
        <div class="q-options">
          ${q.opts.map((opt, oi) => `
            <label class="q-option">
              <input type="radio" name="q${qi}" value="${oi}">
              ${opt}
            </label>
          `).join('')}
        </div>
      </div>
    `).join('');

    // 选项点击事件
    container.querySelectorAll('.q-option').forEach(opt => {
      opt.addEventListener('click', () => {
        const group = opt.closest('.quiz-item').querySelectorAll('.q-option');
        group.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        opt.querySelector('input').checked = true;
      });
    });
  }

  submitBtn.addEventListener('click', () => {
    let score = 0;
    let answered = 0;
    questions.forEach((_, i) => {
      const selected = container.querySelector(`input[name="q${i}"]:checked`);
      if (selected) {
        answered++;
        // "默契" 模拟：根据选中的选项给分（有概率全对）
        // 这里使用伪随机 + 时间种子，让每次结果有些变化
        const seed = (Date.now() + i * 137 + Number(selected.value) * 53) % 100;
        if (seed < 50) score++;       // 50% 概率答对
        if (seed < 20 && score < answered) score++; // 额外加分（更甜）
      }
    });
    const pct = answered === 10 ? Math.min(100, Math.round((score / 10) * 100)) : Math.round((score / 10) * 100);

    const comments = [
      { min: 0,  max: 29, text: '默契还在路上～没关系，每一次了解都让彼此更靠近。💕' },
      { min: 30, max: 49, text: '还不错哦！有些小心思还需要多观察，不过这就是恋爱的乐趣呀～🌸' },
      { min: 50, max: 69, text: '挺有默契的嘛！你们之间有很多心照不宣的小秘密吧～✨' },
      { min: 70, max: 89, text: '默契度很高！你真的很懂 TA，继续做彼此的专属翻译官吧～💖' },
      { min: 90, max: 100, text: '天造地设！这种默契简直像认识了几个世纪，请原地结婚！💍🎉' },
    ];
    const comment = comments.find(c => pct >= c.min && pct <= c.max);

    scoreEl.textContent = `${pct}%`;
    commentEl.textContent = comment.text;
    resultDiv.style.display = 'block';
    resultDiv.scrollIntoView({ behavior: 'smooth' });

    submitBtn.style.display = 'none';
    resetBtn.style.display = 'inline-block';

    // 保存最新默契度，供告白文案使用
    localStorage.setItem('520_quizScore', pct);
  });

  resetBtn.addEventListener('click', () => {
    renderQuestions();
    resultDiv.style.display = 'none';
    submitBtn.style.display = 'inline-block';
    resetBtn.style.display = 'none';
  });

  renderQuestions();
})();

// ==================== 8. 专属告白文案 ====================
(function initConfession() {
  const genBtn = document.getElementById('generateConfessionBtn');
  const box = document.getElementById('confessionBox');
  const textEl = document.getElementById('confessionText');
  const copyBtn = document.getElementById('copyConfessionBtn');

  const templates = [
    {
      min: 0, max: 29,
      texts: [
        '遇见你，是我在这个世界上做过最正确的事。即使我们还在慢慢了解彼此，但每一步都让我更确定——就是你。',
        '世界很大，但我的心很小，小到只能装下一个你。520 快乐，我的唯一。',
      ]
    },
    {
      min: 30, max: 69,
      texts: [
        '从陌生到了解，从喜欢到深爱，你在我的世界里越住越深。今天 520，我想说：谢谢你一直在我身边。',
        '你是我的小确幸，是平凡日子里最温柔的光。今天想大声告诉你——我爱你，不止今天。',
      ]
    },
    {
      min: 70, max: 100,
      texts: [
        '有人说最甜的恋爱是双向奔赴，而我刚好在奔向你的路上，发现你也向我跑来。520，我最亲爱的人。',
        '和你在一起之后，我才明白什么叫「心安」。你的每一个小习惯我都熟悉，每一个眼神我都懂。这就是最好的默契。',
      ]
    },
  ];

  genBtn.addEventListener('click', () => {
    const score = Number(localStorage.getItem('520_quizScore')) || 0;
    const group = templates.find(t => score >= t.min && score <= t.max) || templates[0];
    const text = group.texts[Math.floor(Math.random() * group.texts.length)];

    // 添加日期
    const now = new Date();
    const dateStr = `${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`;
    textEl.textContent = `📅 ${dateStr}\n\n${text}\n\n—— 给你的专属告白 💕`;

    box.style.display = 'block';
    box.scrollIntoView({ behavior: 'smooth' });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textEl.textContent);
      copyBtn.textContent = '已复制 ✅';
      setTimeout(() => { copyBtn.textContent = '一键复制'; }, 2000);
    } catch {
      // 降级方案
      const ta = document.createElement('textarea');
      ta.value = textEl.textContent;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copyBtn.textContent = '已复制 ✅';
      setTimeout(() => { copyBtn.textContent = '一键复制'; }, 2000);
    }
  });
})();
