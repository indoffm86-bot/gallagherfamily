// State
let adminData = null;

// Auth Gateway elements
const authGateway = document.getElementById('authGateway');
const adminLayout = document.getElementById('adminLayout');
const gateLoginForm = document.getElementById('gateLoginForm');
const gateUser = document.getElementById('gateUser');
const gatePass = document.getElementById('gatePass');
const gateErrorMsg = document.getElementById('gateErrorMsg');
const logoutBtn = document.getElementById('logoutBtn');

// Nav Tabs
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

// General Settings Form Elements
const settingGangName = document.getElementById('settingGangName');
const settingTagline = document.getElementById('settingTagline');
const settingWelcome = document.getElementById('settingWelcome');
const settingAboutTitle = document.getElementById('settingAboutTitle');
const settingAboutText = document.getElementById('settingAboutText');
const settingFanpage = document.getElementById('settingFanpage');
const settingDiscord = document.getElementById('settingDiscord');
const settingCopyright = document.getElementById('settingCopyright');
const settingCredit = document.getElementById('settingCredit');
const saveGeneralSettingsBtn = document.getElementById('saveGeneralSettingsBtn');

// Media Form Elements
const settingBgImage = document.getElementById('settingBgImage');
const bgPreviewThumb = document.getElementById('bgPreviewThumb');
const bgFileInput = document.getElementById('bgFileInput');
const settingMusicTitle = document.getElementById('settingMusicTitle');
const settingMusicArtist = document.getElementById('settingMusicArtist');
const settingMusicUrl = document.getElementById('settingMusicUrl');
const musicFileInput = document.getElementById('musicFileInput');
const saveMediaSettingsBtn = document.getElementById('saveMediaSettingsBtn');

// Member Elements
const adminMembersList = document.getElementById('adminMembersList');
const openAddMemberBtn = document.getElementById('openAddMemberBtn');
const memberModal = document.getElementById('memberModal');
const closeMemberModalBtn = document.getElementById('closeMemberModalBtn');
const memberForm = document.getElementById('memberForm');
const memberModalTitle = document.getElementById('memberModalTitle');
const editMemberId = document.getElementById('editMemberId');
const memName = document.getElementById('memName');
const memRole = document.getElementById('memRole');
const memSubtitle = document.getElementById('memSubtitle');
const memAvatar = document.getElementById('memAvatar');
const avatarPreviewThumb = document.getElementById('avatarPreviewThumb');
const avatarFileInput = document.getElementById('avatarFileInput');
const memDesc = document.getElementById('memDesc');
const memInstagram = document.getElementById('memInstagram');
const memFacebook = document.getElementById('memFacebook');
const memDiscord = document.getElementById('memDiscord');

// Security Form Elements
const changePasswordForm = document.getElementById('changePasswordForm');
const newAdminUser = document.getElementById('newAdminUser');
const currentPass = document.getElementById('currentPass');
const newPass = document.getElementById('newPass');

// Toast
const toastNotice = document.getElementById('toastNotice');
const toastMsg = document.getElementById('toastMsg');
const toastIcon = document.getElementById('toastIcon');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEvents();
});

// Check Auth Status
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/status');
    const data = await res.json();
    if (data.isAdmin) {
      authGateway.style.display = 'none';
      adminLayout.style.display = 'flex';
      loadAdminData();
    } else {
      authGateway.style.display = 'flex';
      adminLayout.style.display = 'none';
    }
  } catch (err) {
    console.error('Auth check error:', err);
  }
}

// Load Full Admin Data
async function loadAdminData() {
  try {
    const res = await fetch('/api/admin/data');
    if (!res.ok) {
      authGateway.style.display = 'flex';
      adminLayout.style.display = 'none';
      return;
    }
    adminData = await res.json();
    populateData(adminData);
  } catch (err) {
    console.error('Error loading admin data:', err);
    showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
  }
}

// Populate Inputs
function populateData(data) {
  const { siteSettings, members, adminUsername } = data;

  // Sidebar
  document.getElementById('sidebarGangName').textContent = siteSettings.gangName || 'WINLAND';
  document.getElementById('sidebarLogoIcon').textContent = (siteSettings.gangName || 'W').charAt(0).toUpperCase();

  // Tab 1: General
  settingGangName.value = siteSettings.gangName || '';
  settingTagline.value = siteSettings.tagline || '';
  settingWelcome.value = siteSettings.welcomeText || '';
  settingAboutTitle.value = siteSettings.aboutTitle || '';
  settingAboutText.value = siteSettings.aboutText || '';
  settingFanpage.value = siteSettings.fanpageUrl || '';
  settingDiscord.value = siteSettings.discordUrl || '';
  settingCopyright.value = siteSettings.footerCopyright || '';
  settingCredit.value = siteSettings.footerCredit || '';

  // Tab 3: Media
  settingBgImage.value = siteSettings.bgImage || '';
  bgPreviewThumb.src = siteSettings.bgImage || '';
  settingMusicTitle.value = siteSettings.musicTitle || '';
  settingMusicArtist.value = siteSettings.musicArtist || '';
  settingMusicUrl.value = siteSettings.musicUrl || '';

  // Tab 4: Security
  newAdminUser.value = adminUsername || 'admin';

  // Tab 2: Members
  renderAdminMembers(members);
}

// Render Members List in Admin
function renderAdminMembers(members) {
  if (!members || members.length === 0) {
    adminMembersList.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-dim);">
        <i class="fa-solid fa-users" style="font-size: 2rem; margin-bottom: 10px; display: block;"></i>
        ยังไม่มีรายชื่อสมาชิก กดปุ่ม "เพิ่มสมาชิกใหม่" ด้านบนเพื่อเพิ่มได้เลย
      </div>
    `;
    return;
  }

  adminMembersList.innerHTML = members.map((m, index) => {
    let badgeClass = 'badge-adm-member';
    if (m.role === 'FOUNDER') badgeClass = 'badge-adm-founder';
    else if (m.role === 'LEADER') badgeClass = 'badge-adm-leader';

    return `
      <div class="member-item-admin" data-id="${m.id}">
        <div class="member-info-group">
          <img src="${m.avatar}" class="member-avatar-admin" alt="${m.name}" onerror="this.src='https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=800&q=80'">
          <div>
            <div class="member-name-admin">${m.name}</div>
            <div style="display: flex; gap: 8px; align-items: center;">
              <span class="member-role-badge-admin ${badgeClass}">${m.role}</span>
              ${m.subTitle ? `<span style="font-size: 0.8rem; color: var(--text-sub);">${m.subTitle}</span>` : ''}
            </div>
          </div>
        </div>

        <div class="member-actions-admin">
          ${index > 0 ? `
            <button class="btn-icon-admin btn-move-up" onclick="moveMember('${m.id}', -1)" title="เลื่อนขึ้น">
              <i class="fa-solid fa-chevron-up"></i>
            </button>
          ` : ''}
          ${index < members.length - 1 ? `
            <button class="btn-icon-admin btn-move-down" onclick="moveMember('${m.id}', 1)" title="เลื่อนลง">
              <i class="fa-solid fa-chevron-down"></i>
            </button>
          ` : ''}
          <button class="btn-icon-admin" onclick="openEditMemberModal('${m.id}')" title="แก้ไข">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon-admin btn-icon-delete" onclick="deleteMember('${m.id}')" title="ลบ">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Move Member Order
async function moveMember(id, delta) {
  if (!adminData || !adminData.members) return;
  const list = [...adminData.members];
  const idx = list.findIndex(m => m.id === id);
  if (idx === -1) return;

  const targetIdx = idx + delta;
  if (targetIdx < 0 || targetIdx >= list.length) return;

  // Swap
  const temp = list[idx];
  list[idx] = list[targetIdx];
  list[targetIdx] = temp;

  const memberIds = list.map(m => m.id);

  try {
    const res = await fetch('/api/admin/members/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberIds })
    });
    if (res.ok) {
      adminData.members = list;
      renderAdminMembers(list);
      showToast('ปรับลำดับเรียบร้อย', 'success');
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการเปลี่ยนลำดับ', 'error');
  }
}

// Open Edit Member Modal
function openEditMemberModal(id) {
  const mem = adminData.members.find(m => m.id === id);
  if (!mem) return;

  memberModalTitle.textContent = `แก้ไขข้อมูล: ${mem.name}`;
  editMemberId.value = mem.id;
  memName.value = mem.name;
  memRole.value = mem.role;
  memSubtitle.value = mem.subTitle || '';
  memAvatar.value = mem.avatar || '';
  avatarPreviewThumb.src = mem.avatar || '';
  memDesc.value = mem.description || '';
  memInstagram.value = mem.instagram || '';
  memFacebook.value = mem.facebook || '';
  memDiscord.value = mem.discord || '';

  memberModal.classList.add('active');
}

// Delete Member
async function deleteMember(id) {
  const mem = adminData.members.find(m => m.id === id);
  const name = mem ? mem.name : 'สมาชิกนี้';

  if (!confirm(`ยืนยันการลบ "${name}" ออกจากระบบ?`)) return;

  try {
    const res = await fetch(`/api/admin/members/${id}`, { method: 'DELETE' });
    const result = await res.json();
    if (res.ok && result.success) {
      showToast('ลบสมาชิกเรียบร้อยแล้ว', 'success');
      loadAdminData();
    } else {
      showToast(result.error || 'ลบไม่สำเร็จ', 'error');
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการลบสมาชิก', 'error');
  }
}

// Events Setup
function setupEvents() {
  // Gate Login Form
  gateLoginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    gateErrorMsg.style.display = 'none';

    const username = gateUser.value.trim();
    const password = gatePass.value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const result = await res.json();

      if (res.ok && result.success) {
        authGateway.style.display = 'none';
        adminLayout.style.display = 'flex';
        loadAdminData();
        showToast('เข้าสู่ระบบหลังบ้านสำเร็จ!', 'success');
      } else {
        gateErrorMsg.textContent = result.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        gateErrorMsg.style.display = 'block';
      }
    } catch (err) {
      gateErrorMsg.textContent = 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้';
      gateErrorMsg.style.display = 'block';
    }
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  });

  // Tab Switch
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      item.classList.add('active');
      const targetTab = document.getElementById(item.dataset.tab);
      if (targetTab) targetTab.classList.add('active');
    });
  });

  // Save General Settings
  saveGeneralSettingsBtn.addEventListener('click', async () => {
    const payload = {
      gangName: settingGangName.value.trim(),
      tagline: settingTagline.value.trim(),
      welcomeText: settingWelcome.value.trim(),
      aboutTitle: settingAboutTitle.value.trim(),
      aboutText: settingAboutText.value.trim(),
      fanpageUrl: settingFanpage.value.trim(),
      discordUrl: settingDiscord.value.trim(),
      footerCopyright: settingCopyright.value.trim(),
      footerCredit: settingCredit.value.trim()
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast('บันทึกการตั้งค่าเว็บไซต์เรียบร้อยแล้ว!', 'success');
        document.getElementById('sidebarGangName').textContent = payload.gangName || 'WINLAND';
        document.getElementById('sidebarLogoIcon').textContent = (payload.gangName || 'W').charAt(0).toUpperCase();
      } else {
        showToast(result.error || 'บันทึกไม่สำเร็จ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  });

  // Save Media Settings
  saveMediaSettingsBtn.addEventListener('click', async () => {
    const payload = {
      bgImage: settingBgImage.value.trim(),
      musicTitle: settingMusicTitle.value.trim(),
      musicArtist: settingMusicArtist.value.trim(),
      musicUrl: settingMusicUrl.value.trim()
    };

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (res.ok && result.success) {
        showToast('บันทึกรูปภาพและเพลงเรียบร้อยแล้ว!', 'success');
      } else {
        showToast(result.error || 'บันทึกไม่สำเร็จ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึก', 'error');
    }
  });

  // Background Image Upload
  bgFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadedUrl = await uploadFile(file);
    if (uploadedUrl) {
      settingBgImage.value = uploadedUrl;
      bgPreviewThumb.src = uploadedUrl;
      showToast('อัปโหลดรูปพื้นหลังสำเร็จ! อย่าลืมกดบันทึก', 'success');
    }
  });

  settingBgImage.addEventListener('input', () => {
    bgPreviewThumb.src = settingBgImage.value;
  });

  // Music File Upload
  musicFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadedUrl = await uploadFile(file);
    if (uploadedUrl) {
      settingMusicUrl.value = uploadedUrl;
      showToast('อัปโหลดไฟล์เพลงสำเร็จ! อย่าลืมกดบันทึก', 'success');
    }
  });

  // Avatar Upload in Member Modal
  avatarFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadedUrl = await uploadFile(file);
    if (uploadedUrl) {
      memAvatar.value = uploadedUrl;
      avatarPreviewThumb.src = uploadedUrl;
      showToast('อัปโหลดรูปโปรไฟล์สำเร็จ!', 'success');
    }
  });

  memAvatar.addEventListener('input', () => {
    avatarPreviewThumb.src = memAvatar.value;
  });

  // Open Add Member Modal
  openAddMemberBtn.addEventListener('click', () => {
    memberModalTitle.textContent = 'เพิ่มสมาชิกใหม่';
    memberForm.reset();
    editMemberId.value = '';
    avatarPreviewThumb.src = '';
    if (memDiscord) memDiscord.value = '';
    memberModal.classList.add('active');
  });

  // Close Member Modal
  closeMemberModalBtn.addEventListener('click', () => memberModal.classList.remove('active'));
  memberModal.addEventListener('click', (e) => {
    if (e.target === memberModal) memberModal.classList.remove('active');
  });

  // Member Form Submit (Add or Edit)
  memberForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = editMemberId.value;
    const payload = {
      name: memName.value.trim(),
      role: memRole.value,
      subTitle: memSubtitle.value.trim(),
      avatar: memAvatar.value.trim(),
      description: memDesc.value.trim(),
      instagram: memInstagram.value.trim(),
      facebook: memFacebook.value.trim(),
      discord: memDiscord ? memDiscord.value.trim() : ''
    };

    try {
      let res;
      if (id) {
        // Edit
        res = await fetch(`/api/admin/members/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        // Add
        res = await fetch('/api/admin/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const result = await res.json();
      if (res.ok && result.success) {
        showToast(id ? 'แก้ไขสมาชิกสำเร็จ!' : 'เพิ่มสมาชิกใหม่สำเร็จ!', 'success');
        memberModal.classList.remove('active');
        loadAdminData();
      } else {
        showToast(result.error || 'ดำเนินการไม่สำเร็จ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล', 'error');
    }
  });

  // Change Password Form
  changePasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      newUsername: newAdminUser.value.trim(),
      currentPassword: currentPass.value,
      newPassword: newPass.value.trim()
    };

    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok && result.success) {
        showToast('เปลี่ยนรหัสผ่านและชื่อผู้ใช้สำเร็จ!', 'success');
        currentPass.value = '';
        newPass.value = '';
      } else {
        showToast(result.error || 'เปลี่ยนรหัสผ่านไม่สำเร็จ', 'error');
      }
    } catch (err) {
      showToast('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน', 'error');
    }
  });
}

// File Upload Helper
async function uploadFile(file) {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });
    const result = await res.json();
    if (res.ok && result.success) {
      return result.fileUrl;
    } else {
      showToast(result.error || 'อัปโหลดไฟล์ไม่สำเร็จ', 'error');
      return null;
    }
  } catch (err) {
    showToast('เกิดข้อผิดพลาดในการอัปโหลดไฟล์', 'error');
    return null;
  }
}

// Toast Helper
let toastTimer = null;
function showToast(message, type = 'success') {
  clearTimeout(toastTimer);
  toastMsg.textContent = message;
  toastNotice.className = `toast-notice show ${type}`;

  if (type === 'success') {
    toastIcon.className = 'fa-solid fa-circle-check';
    toastIcon.style.color = '#10b981';
  } else {
    toastIcon.className = 'fa-solid fa-circle-xmark';
    toastIcon.style.color = '#ef4444';
  }

  toastTimer = setTimeout(() => {
    toastNotice.classList.remove('show');
  }, 3500);
}
