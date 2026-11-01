// Global state
let siteData = null;
let currentFilter = 'ALL';
let isAudioPlaying = false;
let footerClickCount = 0;
let footerClickTimer = null;
let lastVolume = 0.7;

// Typewriter state
let typewriterTimeout = null;
let currentTypewriterWord = '';

// DOM Elements
const bgStage = document.getElementById('bgStage');
const siteTagline = document.getElementById('siteTagline');
const siteWelcome = document.getElementById('siteWelcome');
const fanpageLink = document.getElementById('fanpageLink');
const footerCopyright = document.getElementById('footerCopyright');
const footerCredit = document.getElementById('footerCredit');
const modalAboutTitle = document.getElementById('modalAboutTitle');
const modalAboutText = document.getElementById('modalAboutText');
const membersGangSub = document.getElementById('membersGangSub');

// Audio elements
const bgAudio = document.getElementById('bgAudio');
const musicPlayerPill = document.getElementById('musicPlayerPill');
const playAudioBtn = document.getElementById('playAudioBtn');
const playIcon = document.getElementById('playIcon');
const soundWaves = document.getElementById('soundWaves');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');

// Volume elements
const volumeControlWrap = document.getElementById('volumeControlWrap');
const volumeBtn = document.getElementById('volumeBtn');
const volumeIcon = document.getElementById('volumeIcon');
const volumePopup = document.getElementById('volumePopup');
const volumeSlider = document.getElementById('volumeSlider');
const volumePct = document.getElementById('volumePct');
const volDownBtn = document.getElementById('volDownBtn');
const volUpBtn = document.getElementById('volUpBtn');
const volPresetBtns = document.querySelectorAll('.vol-preset-btn');

// Brightness elements
const brightnessPill = document.getElementById('brightnessPill');
const brightnessToggleBtn = document.getElementById('brightnessToggleBtn');
const brightnessPopup = document.getElementById('brightnessPopup');
const brightnessSlider = document.getElementById('brightnessSlider');
const brightnessPctDisplay = document.getElementById('brightnessPctDisplay');
const brightnessIcon = document.getElementById('brightnessIcon');
const presetBtns = document.querySelectorAll('.preset-pill-btn');

// Modals and Views
const aboutModal = document.getElementById('aboutModal');
const openAboutBtn = document.getElementById('openAboutBtn');
const closeAboutBtn = document.getElementById('closeAboutBtn');

const membersView = document.getElementById('membersView');
const openMembersBtn = document.getElementById('openMembersBtn');
const closeMembersBtn = document.getElementById('closeMembersBtn');
const membersGrid = document.getElementById('membersGrid');
const memberSearchInput = document.getElementById('memberSearchInput');
const filterBtns = document.querySelectorAll('.filter-btn');

// Secret Login Modal
const loginModal = document.getElementById('loginModal');
const secretBtn = document.getElementById('secretBtn');
const closeLoginBtn = document.getElementById('closeLoginBtn');
const loginForm = document.getElementById('loginForm');
const loginErrorMsg = document.getElementById('loginErrorMsg');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initBrightness();
  initVolume();
  loadPublicData();
  setupEventListeners();
  setupAudioListeners();
  setupBrightnessListeners();
});

// ================= 4. TYPEWRITER EFFECT WITH LOOP =================
function startTypewriter(word) {
  if (!word) word = 'GALLAGHER';
  if (currentTypewriterWord === word && typewriterTimeout) return;
  currentTypewriterWord = word;

  const textEl = document.getElementById('typewriterText');
  if (!textEl) return;

  clearTimeout(typewriterTimeout);
  let charIndex = 0;
  let isDeleting = false;
  textEl.textContent = '';

  function step() {
    if (!isDeleting) {
      charIndex++;
      textEl.textContent = currentTypewriterWord.substring(0, charIndex);

      if (charIndex === currentTypewriterWord.length) {
        isDeleting = true;
        // Pause for 2.6 seconds so people can read the full title
        typewriterTimeout = setTimeout(step, 2600);
        return;
      }
      typewriterTimeout = setTimeout(step, 90 + Math.random() * 40);
    } else {
      charIndex--;
      textEl.textContent = currentTypewriterWord.substring(0, charIndex);

      if (charIndex === 0) {
        isDeleting = false;
        // Brief pause before retyping
        typewriterTimeout = setTimeout(step, 650);
        return;
      }
      typewriterTimeout = setTimeout(step, 50);
    }
  }

  step();
}

// ================= 3. BRIGHTNESS CONTROLLER =================
function initBrightness() {
  const saved = localStorage.getItem('winland_brightness');
  const val = saved !== null ? parseInt(saved, 10) : 100;
  applyBrightness(val);
  if (brightnessSlider) brightnessSlider.value = val;
}

function applyBrightness(val) {
  const factor = val / 100;
  // Background brightness
  document.documentElement.style.setProperty('--bg-brightness', factor);
  // Modal cards brightness
  document.documentElement.style.setProperty('--modal-brightness', factor);

  if (brightnessPctDisplay) brightnessPctDisplay.textContent = `${val}%`;

  if (presetBtns) {
    presetBtns.forEach(btn => {
      const bVal = parseInt(btn.dataset.bright, 10);
      if (bVal === val) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  if (brightnessIcon) {
    if (val < 80) {
      brightnessIcon.style.color = '#94a3b8';
      brightnessIcon.style.filter = 'none';
    } else if (val <= 125) {
      brightnessIcon.style.color = '#ffb800';
      brightnessIcon.style.filter = 'none';
    } else {
      brightnessIcon.style.color = '#ffd000';
      brightnessIcon.style.filter = 'drop-shadow(0 0 6px #ffd000)';
    }
  }
}

function setupBrightnessListeners() {
  if (!brightnessSlider || !brightnessToggleBtn) return;

  // Toggle slider popup on click
  brightnessToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    brightnessPopup.classList.toggle('active');
  });

  // Slider change
  brightnessSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    applyBrightness(val);
    localStorage.setItem('winland_brightness', val);
  });

  // Preset buttons
  presetBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const val = parseInt(btn.dataset.bright, 10);
      brightnessSlider.value = val;
      applyBrightness(val);
      localStorage.setItem('winland_brightness', val);
    });
  });

  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!brightnessPill.contains(e.target)) {
      brightnessPopup.classList.remove('active');
    }
  });
}

// ================= VOLUME & AUDIO CONTROLS =================
function initVolume() {
  const savedVol = localStorage.getItem('winland_volume');
  if (savedVol !== null) {
    const val = parseFloat(savedVol);
    bgAudio.volume = val;
    volumeSlider.value = val;
    updateVolumeUI(val);
  } else {
    bgAudio.volume = 0.7;
    volumeSlider.value = 0.7;
    updateVolumeUI(0.7);
  }
}

// Fetch public settings & members
async function loadPublicData() {
  try {
    const res = await fetch('/api/public/data');
    if (!res.ok) throw new Error('Cannot load data');
    siteData = await res.json();
    renderSite(siteData);
  } catch (err) {
    console.error('Error loading public data:', err);
  }
}

// Render dynamic content
function renderSite(data) {
  const { siteSettings, members } = data;
  if (!siteSettings) return;

  // Background
  if (siteSettings.bgImage) {
    bgStage.style.backgroundImage = `url('${siteSettings.bgImage}')`;
  }

  // Texts
  siteTagline.textContent = siteSettings.tagline || 'BORN OF WARGANG';
  siteWelcome.textContent = siteSettings.welcomeText || 'Welcome To Winland Home';
  document.title = `${siteSettings.gangName || 'WINLAND'} | Official Home`;

  // Start Typewriter on Gang Name
  startTypewriter(siteSettings.gangName || 'GALLAGHER');

  // Links
  if (siteSettings.fanpageUrl) {
    fanpageLink.href = siteSettings.fanpageUrl;
  }

  // About modal
  modalAboutTitle.textContent = siteSettings.aboutTitle || `เกี่ยวกับ ${siteSettings.gangName || 'WINLAND'}`;
  modalAboutText.textContent = siteSettings.aboutText || '';

  // Footer
  footerCopyright.textContent = siteSettings.footerCopyright || `© 2026 ${siteSettings.gangName || 'WINLAND'}. All rights reserved.`;
  footerCredit.textContent = siteSettings.footerCredit || 'Created with ❤️ by Niranam Dev';
  membersGangSub.textContent = siteSettings.gangName || 'WINLAND';

  // Music Player Info & Source
  playerTitle.textContent = siteSettings.musicTitle || 'Soundtrack';
  playerArtist.textContent = siteSettings.musicArtist || 'Official Audio';

  if (siteSettings.musicUrl) {
    if (bgAudio.src !== siteSettings.musicUrl && !bgAudio.src.endsWith(siteSettings.musicUrl)) {
      bgAudio.src = siteSettings.musicUrl;
      bgAudio.load();
    }
    // Attempt Autoplay
    attemptAutoplay();
  }

  // Render members
  renderMembers(members);
}

// ================= AUDIO AUTOPLAY & CONTROLS =================
function attemptAutoplay() {
  bgAudio.loop = true;

  const playPromise = bgAudio.play();
  if (playPromise !== undefined) {
    playPromise.then(() => {
      onAudioStart();
    }).catch(() => {
      setupAutoplayOnInteraction();
    });
  }
}

function setupAutoplayOnInteraction() {
  const triggerAutoPlay = () => {
    if (!isAudioPlaying) {
      bgAudio.play().then(() => {
        onAudioStart();
      }).catch(e => console.warn('Play attempt on interaction:', e));
    }
    window.removeEventListener('click', triggerAutoPlay);
    window.removeEventListener('touchstart', triggerAutoPlay);
    window.removeEventListener('keydown', triggerAutoPlay);
    window.removeEventListener('scroll', triggerAutoPlay);
  };

  window.addEventListener('click', triggerAutoPlay, { once: true });
  window.addEventListener('touchstart', triggerAutoPlay, { once: true });
  window.addEventListener('keydown', triggerAutoPlay, { once: true });
  window.addEventListener('scroll', triggerAutoPlay, { once: true });
}

function onAudioStart() {
  isAudioPlaying = true;
  musicPlayerPill.classList.add('is-playing');
  playIcon.className = 'fa-solid fa-pause';
}

function onAudioPause() {
  isAudioPlaying = false;
  musicPlayerPill.classList.remove('is-playing');
  playIcon.className = 'fa-solid fa-play';
}

function toggleAudio() {
  if (!bgAudio.src) return;

  if (isAudioPlaying) {
    bgAudio.pause();
    onAudioPause();
  } else {
    bgAudio.play().then(() => {
      onAudioStart();
    }).catch(err => {
      console.error('Playback error:', err);
    });
  }
}

function setupAudioListeners() {
  playAudioBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleAudio();
  });

  bgAudio.addEventListener('play', onAudioStart);
  bgAudio.addEventListener('pause', onAudioPause);
  bgAudio.addEventListener('ended', () => {
    bgAudio.currentTime = 0;
    bgAudio.play();
  });

  // Slider input
  volumeSlider.addEventListener('input', (e) => {
    setVolume(e.target.value);
  });

  // Toggle volume popup on button click
  volumeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    volumePopup.classList.toggle('active');
  });

  // Step Down (-) Button
  if (volDownBtn) {
    volDownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setVolume((bgAudio.volume || 0) - 0.1);
    });
  }

  // Step Up (+) Button
  if (volUpBtn) {
    volUpBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setVolume((bgAudio.volume || 0) + 0.1);
    });
  }

  // Quick Preset Buttons
  if (volPresetBtns) {
    volPresetBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        setVolume(btn.dataset.vol);
      });
    });
  }

  // Close volume popup when clicking outside
  document.addEventListener('click', (e) => {
    if (volumeControlWrap && !volumeControlWrap.contains(e.target)) {
      volumePopup.classList.remove('active');
    }
  });

  // Mouse Wheel on volume control for instant effortless volume change
  if (volumeControlWrap) {
    volumeControlWrap.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.05 : -0.05;
      setVolume((bgAudio.volume || 0) + delta);
    }, { passive: false });
  }
}

function setVolume(val) {
  val = Math.max(0, Math.min(1, parseFloat(val)));
  // Round to 2 decimal places to avoid floating point jitter
  val = Math.round(val * 100) / 100;
  bgAudio.volume = val;
  volumeSlider.value = val;
  updateVolumeUI(val);
  localStorage.setItem('winland_volume', val);
  if (val > 0) lastVolume = val;
}

function updateVolumeUI(val) {
  const pct = Math.round(val * 100);
  volumePct.textContent = `${pct}%`;

  if (val === 0) {
    volumeIcon.className = 'fa-solid fa-volume-xmark';
    volumeIcon.style.color = '#ef4444';
  } else if (val < 0.5) {
    volumeIcon.className = 'fa-solid fa-volume-low';
    volumeIcon.style.color = '#94a3b8';
  } else {
    volumeIcon.className = 'fa-solid fa-volume-high';
    volumeIcon.style.color = '#00d4ff';
  }

  // Update preset buttons active state
  if (volPresetBtns) {
    volPresetBtns.forEach(btn => {
      const pVal = parseFloat(btn.dataset.vol);
      if (Math.abs(pVal - val) < 0.06) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // Fill gradient track visually
  volumeSlider.style.background = `linear-gradient(to right, #00d4ff 0%, #00d4ff ${pct}%, rgba(255,255,255,0.18) ${pct}%, rgba(255,255,255,0.18) 100%)`;
}

// ================= MEMBERS RENDERING =================
function renderMembers(members) {
  if (!members || !membersGrid) return;

  const searchQuery = (memberSearchInput.value || '').trim().toLowerCase();

  const filtered = members.filter(member => {
    if (currentFilter !== 'ALL' && member.role !== currentFilter) {
      return false;
    }
    if (searchQuery) {
      const matchName = (member.name || '').toLowerCase().includes(searchQuery);
      const matchRole = (member.role || '').toLowerCase().includes(searchQuery);
      const matchSub = (member.subTitle || '').toLowerCase().includes(searchQuery);
      const matchDesc = (member.description || '').toLowerCase().includes(searchQuery);
      if (!matchName && !matchRole && !matchSub && !matchDesc) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    membersGrid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #656c7a;">
        <i class="fa-solid fa-user-slash" style="font-size: 2.5rem; margin-bottom: 15px; display: block;"></i>
        <p style="font-size: 1.1rem; font-weight: 500;">ไม่พบรายชื่อสมาชิกที่ค้นหา</p>
      </div>
    `;
    return;
  }

  membersGrid.innerHTML = filtered.map(m => {
    let badgeClass = 'badge-member';
    let icon = '<i class="fa-solid fa-user"></i>';

    if (m.role === 'FOUNDER') {
      badgeClass = 'badge-founder';
      icon = '<i class="fa-solid fa-crown"></i>';
    } else if (m.role === 'LEADER') {
      badgeClass = 'badge-leader';
      icon = '<i class="fa-solid fa-star"></i>';
    }

    return `
      <div class="member-card">
        <div class="member-img-wrap">
          <img src="${m.avatar}" alt="${m.name}" class="member-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'">
          <div class="member-gradient-overlay"></div>
          <div class="member-role-badge-top ${badgeClass}">
            ${icon} <span>${m.role}</span>
          </div>
        </div>

        <div class="member-details">
          <h3 class="member-name">${m.name}</h3>
          <div class="member-subtitle">${m.subTitle || ''}</div>
          <p class="member-desc">${m.description || ''}</p>
          
          <div class="member-social-row">
            ${m.instagram ? `
              <a href="${m.instagram}" target="_blank" class="social-icon-btn" title="Instagram">
                <i class="fa-brands fa-instagram"></i>
              </a>
            ` : ''}
            ${m.facebook ? `
              <a href="${m.facebook}" target="_blank" class="social-icon-btn" title="Facebook">
                <i class="fa-brands fa-facebook-f"></i>
              </a>
            ` : ''}
            ${m.discord ? `
              <a href="${m.discord.startsWith('http') ? m.discord : 'https://' + m.discord}" target="_blank" class="social-icon-btn discord-btn" title="Discord">
                <i class="fa-brands fa-discord"></i>
              </a>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ================= GENERAL EVENT LISTENERS & MODAL CLOSING =================
function setupEventListeners() {
  // 1. About Modal Open & Close
  openAboutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginModal.classList.remove('active');
    aboutModal.classList.add('active');
  });

  closeAboutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    aboutModal.classList.remove('active');
  });

  aboutModal.addEventListener('click', (e) => {
    if (e.target === aboutModal) aboutModal.classList.remove('active');
  });

  // 2. Members View
  openMembersBtn.addEventListener('click', () => {
    membersView.classList.add('active');
    document.body.style.overflow = 'hidden';
  });
  closeMembersBtn.addEventListener('click', () => {
    membersView.classList.remove('active');
    document.body.style.overflow = 'auto';
  });

  // Filter Buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      if (siteData) renderMembers(siteData.members);
    });
  });

  // Search Input
  memberSearchInput.addEventListener('input', () => {
    if (siteData) renderMembers(siteData.members);
  });

  // Secret Admin triggers
  secretBtn.addEventListener('click', openLoginModal);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') || e.key === '`') {
      e.preventDefault();
      openLoginModal();
    }
  });

  footerCopyright.addEventListener('click', () => {
    footerClickCount++;
    clearTimeout(footerClickTimer);
    if (footerClickCount >= 3) {
      footerClickCount = 0;
      openLoginModal();
    } else {
      footerClickTimer = setTimeout(() => { footerClickCount = 0; }, 800);
    }
  });

  // Close Login Modal
  closeLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    loginModal.classList.remove('active');
  });

  loginModal.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.classList.remove('active');
  });

  // Global ESC key to close any modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      aboutModal.classList.remove('active');
      loginModal.classList.remove('active');
      membersView.classList.remove('active');
      document.body.style.overflow = 'auto';
      if (brightnessPopup) brightnessPopup.classList.remove('active');
    }
  });

  // Handle Login Form Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorMsg.style.display = 'none';

    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPass').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        window.location.href = '/admin';
      } else {
        loginErrorMsg.textContent = result.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        loginErrorMsg.style.display = 'block';
      }
    } catch (err) {
      loginErrorMsg.textContent = 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์';
      loginErrorMsg.style.display = 'block';
    }
  });
}

function openLoginModal() {
  aboutModal.classList.remove('active');
  loginModal.classList.add('active');
  document.getElementById('loginUser').focus();
}
