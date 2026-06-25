const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
const dropdown = document.querySelector('.nav-dropdown');
const siteLoginForm = document.querySelector('#siteLoginForm');
const siteLoginMessage = document.querySelector('#siteLoginMessage');
const loginGate = document.querySelector('#loginGate');
const logoutLinks = document.querySelectorAll('[data-logout]');

if (header) {
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 140), { passive: true });
}

if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.classList.toggle('active');
    nav.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  });

  document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', () => {
    toggle.classList.remove('active');
    nav.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
}

if (dropdownToggle && dropdown) {
  dropdownToggle.addEventListener('click', event => {
    event.stopPropagation();
    const open = dropdown.classList.toggle('open');
    dropdownToggle.setAttribute('aria-expanded', String(open));
  });

  document.addEventListener('click', event => {
    if (!dropdown.contains(event.target)) {
      dropdown.classList.remove('open');
      dropdownToggle.setAttribute('aria-expanded', 'false');
    }
  });

  dropdown.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    dropdown.classList.remove('open');
    dropdownToggle.setAttribute('aria-expanded', 'false');
  }));
}

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

const visitCount = document.querySelector('#visitCount');
if (visitCount) {
  const nextCount = Number(localStorage.getItem('shangbaoVisitCount') || '0') + 1;
  localStorage.setItem('shangbaoVisitCount', String(nextCount));
  visitCount.textContent = String(nextCount).padStart(6, '0');
}

const applyForm = document.querySelector('#memberApplyForm');
const loginForm = document.querySelector('#memberLoginForm');
const applyMessage = document.querySelector('#applyMessage');
const loginMessage = document.querySelector('#loginMessage');
const memberStatus = document.querySelector('#memberStatus');

const getMembers = () => JSON.parse(localStorage.getItem('shangbaoMembers') || '[]');
const saveMembers = members => localStorage.setItem('shangbaoMembers', JSON.stringify(members));
const getPendingMembers = () => JSON.parse(localStorage.getItem('shangbaoPendingMembers') || '[]');
const savePendingMembers = members => localStorage.setItem('shangbaoPendingMembers', JSON.stringify(members));
const reviewEmail = 'tylin@nkust.edu.tw';
const defaultMember = {
  name: '商堡會員',
  email: 'test@gmail.com',
  password: '07111111',
  status: 'approved',
  purpose: '預設會員登入'
};

function setMessage(element, text, type = 'success') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`;
}

function updateMemberStatus(member) {
  if (!memberStatus) return;
  if (!member) {
    memberStatus.innerHTML = '<span>尚未登入</span><small>申請會員經 email 審查核准後，才可使用 Email 與密碼登入。</small>';
    return;
  }
  memberStatus.innerHTML = `<span>${member.name}，歡迎回來</span><small>登入帳號：${member.email}<br>申請目的：${member.purpose || '未填寫'}</small><button class="member-logout" type="button">登出</button>`;
  memberStatus.querySelector('.member-logout').addEventListener('click', () => {
    localStorage.removeItem('shangbaoCurrentMember');
    updateMemberStatus(null);
    lockSite();
    setMessage(loginMessage, '已登出會員。');
  });
}

function authenticateMember(email, password) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedPassword = String(password || '');
  const storedMember = getMembers().find(item => item.email === normalizedEmail && item.password === normalizedPassword && (item.status || 'approved') === 'approved');
  if (storedMember) return storedMember;
  if (normalizedEmail === defaultMember.email && normalizedPassword === defaultMember.password) return defaultMember;
  return null;
}

function buildReviewMail(member) {
  const subject = `商堡家辦會員申請審查：${member.name}`;
  const body = [
    '您好，以下為商堡家辦會員申請資料，請協助審查：',
    '',
    `姓名：${member.name}`,
    `Email：${member.email}`,
    `電話：${member.phone || '未填寫'}`,
    `申請目的：${member.purpose || '未填寫'}`,
    `申請時間：${new Date(member.createdAt).toLocaleString('zh-TW')}`,
    '',
    '審查方式：請回到「會員核准頁」，確認資料後按「核准會員」。',
    '',
    '會員核准頁連結：',
    'https://tylinian.github.io/SHANGBAO/member-approval.html'
  ].join('\n');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(reviewEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildApprovalNoticeMail(member) {
  const subject = '商堡家辦會員申請已核准';
  const body = [
    `${member.name} 您好：`,
    '',
    '您的商堡家辦會員申請已核准。',
    '請使用申請時填寫的 Email 與密碼登入會員專區。',
    '',
    '登入網址：https://tylinian.github.io/SHANGBAO/',
    '',
    '商堡家辦'
  ].join('\n');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(member.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function unlockSite(member) {
  if (!document.body.classList.contains('member-locked')) return;
  document.body.classList.remove('member-locked');
  document.body.classList.add('member-unlocked');
  if (loginGate) loginGate.setAttribute('hidden', '');
  updateMemberStatus(member);
}

function lockSite() {
  if (!loginGate) return;
  document.body.classList.add('member-locked');
  document.body.classList.remove('member-unlocked');
  loginGate.removeAttribute('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

if (siteLoginForm) {
  siteLoginForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(siteLoginForm).entries());
    const member = authenticateMember(data.email, data.password);
    if (!member) {
      setMessage(siteLoginMessage, '登入失敗，請確認 Email 與密碼。', 'error');
      return;
    }
    localStorage.setItem('shangbaoCurrentMember', JSON.stringify(member));
    siteLoginForm.reset();
    setMessage(siteLoginMessage, '登入成功。');
    unlockSite(member);
    window.location.href = 'member-dashboard.html';
  });
}

logoutLinks.forEach(link => link.addEventListener('click', event => {
  event.preventDefault();
  localStorage.removeItem('shangbaoCurrentMember');
  window.location.href = 'index.html';
}));

if (applyForm) {
  applyForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(applyForm).entries());
    const email = String(data.email || '').trim().toLowerCase();
    const members = getMembers();
    const pendingMembers = getPendingMembers();
    if (members.some(member => member.email === email)) {
      setMessage(applyMessage, '此 Email 已核准為會員，請直接登入。', 'error');
      return;
    }
    if (pendingMembers.some(member => member.email === email)) {
      setMessage(applyMessage, '此 Email 已在審核中，請等待 email 審查結果。', 'error');
      return;
    }
    const member = {
      id: `SB-${Date.now()}`,
      name: String(data.name || '').trim(),
      email,
      phone: String(data.phone || '').trim(),
      password: String(data.password || ''),
      purpose: String(data.purpose || '').trim(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    pendingMembers.push(member);
    savePendingMembers(pendingMembers);
    applyForm.reset();
    setMessage(applyMessage, '會員申請已建立，資料已存放在本機待審核，並已開啟 email 審查信。');
    window.open(buildReviewMail(member), '_blank', 'noopener,noreferrer');
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const member = authenticateMember(email, password);
    if (!member) {
      setMessage(loginMessage, '登入失敗，請確認 Email 與密碼，或等待會員申請核准。', 'error');
      return;
    }
    localStorage.setItem('shangbaoCurrentMember', JSON.stringify(member));
    loginForm.reset();
    setMessage(loginMessage, '登入成功。');
    updateMemberStatus(member);
  });
}

updateMemberStatus(JSON.parse(localStorage.getItem('shangbaoCurrentMember') || 'null'));

const currentMember = JSON.parse(localStorage.getItem('shangbaoCurrentMember') || 'null');
if (document.body.classList.contains('member-only-page') && !currentMember) {
  window.location.href = 'index.html';
}
if (currentMember && siteLoginForm) {
  unlockSite(currentMember);
}

const approvalList = document.querySelector('#approvalList');
const approvalEmpty = document.querySelector('#approvalEmpty');
const approvedList = document.querySelector('#approvedList');
const approvedEmpty = document.querySelector('#approvedEmpty');
const approvalClear = document.querySelector('#approvalClear');

function renderApprovalList() {
  if (!approvalList) return;
  const pendingMembers = getPendingMembers();
  approvalList.innerHTML = '';
  if (approvalEmpty) approvalEmpty.hidden = pendingMembers.length > 0;
  pendingMembers.forEach(member => {
    const card = document.createElement('article');
    card.className = 'approval-card';
    card.innerHTML = `
      <div>
        <span class="panel-kicker">${member.id || 'PENDING'}</span>
        <h3>${member.name}</h3>
        <p>Email：${member.email}</p>
        <p>電話：${member.phone || '未填寫'}</p>
        <p>申請目的：${member.purpose || '未填寫'}</p>
        <small>申請時間：${new Date(member.createdAt).toLocaleString('zh-TW')}</small>
      </div>
      <div class="approval-actions">
        <button class="btn btn-gold" type="button" data-approve="${member.id}">核准會員</button>
        <button class="btn btn-outline" type="button" data-reject="${member.id}">退回申請</button>
        <a class="text-link" href="${buildReviewMail(member)}" target="_blank" rel="noopener noreferrer">寄出審查 Email</a>
      </div>
    `;
    approvalList.appendChild(card);
  });
}

function renderApprovedList() {
  if (!approvedList) return;
  const approvedMembers = getMembers();
  approvedList.innerHTML = '';
  if (approvedEmpty) approvedEmpty.hidden = approvedMembers.length > 0;
  approvedMembers.forEach(member => {
    const card = document.createElement('article');
    card.className = 'approval-card approved-card';
    card.innerHTML = `
      <div>
        <span class="panel-kicker">${member.id || 'APPROVED'}</span>
        <h3>${member.name}</h3>
      </div>
    `;
    approvedList.appendChild(card);
  });
}

if (approvalList) {
  approvalList.addEventListener('click', event => {
    const approveId = event.target.closest('[data-approve]')?.dataset.approve;
    const rejectId = event.target.closest('[data-reject]')?.dataset.reject;
    if (!approveId && !rejectId) return;
    const pendingMembers = getPendingMembers();
    const selected = pendingMembers.find(member => member.id === (approveId || rejectId));
    if (!selected) return;
    savePendingMembers(pendingMembers.filter(member => member.id !== selected.id));
    if (approveId) {
      const members = getMembers().filter(member => member.email !== selected.email);
      const approvedMember = {
        ...selected,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        reviewerEmail: reviewEmail
      };
      members.push(approvedMember);
      saveMembers(members);
      window.open(buildApprovalNoticeMail(approvedMember), '_blank', 'noopener,noreferrer');
    }
    renderApprovalList();
    renderApprovedList();
  });
  renderApprovalList();
  renderApprovedList();
}

if (approvalClear) {
  approvalClear.addEventListener('click', () => {
    if (!confirm('確定要清除本機所有待審核申請資料？')) return;
    savePendingMembers([]);
    renderApprovalList();
  });
}
