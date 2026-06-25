const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');

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

function setMessage(element, text, type = 'success') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message ${type}`;
}

function updateMemberStatus(member) {
  if (!memberStatus) return;
  if (!member) {
    memberStatus.innerHTML = '<span>尚未登入</span><small>送出申請後，即可用同一組 Email 與密碼登入。</small>';
    return;
  }
  memberStatus.innerHTML = `<span>${member.name}，歡迎回來</span><small>登入帳號：${member.email}<br>申請目的：${member.purpose || '未填寫'}</small><button class="member-logout" type="button">登出</button>`;
  memberStatus.querySelector('.member-logout').addEventListener('click', () => {
    localStorage.removeItem('shangbaoCurrentMember');
    updateMemberStatus(null);
    setMessage(loginMessage, '已登出會員。');
  });
}

if (applyForm) {
  applyForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(applyForm).entries());
    const email = String(data.email || '').trim().toLowerCase();
    const members = getMembers();
    if (members.some(member => member.email === email)) {
      setMessage(applyMessage, '此 Email 已申請過會員，請直接登入。', 'error');
      return;
    }
    const member = {
      name: String(data.name || '').trim(),
      email,
      phone: String(data.phone || '').trim(),
      password: String(data.password || ''),
      purpose: String(data.purpose || '').trim(),
      createdAt: new Date().toISOString()
    };
    members.push(member);
    saveMembers(members);
    localStorage.setItem('shangbaoCurrentMember', JSON.stringify(member));
    applyForm.reset();
    setMessage(applyMessage, '會員申請已建立，並已為您登入。');
    updateMemberStatus(member);
  });
}

if (loginForm) {
  loginForm.addEventListener('submit', event => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(loginForm).entries());
    const email = String(data.email || '').trim().toLowerCase();
    const password = String(data.password || '');
    const member = getMembers().find(item => item.email === email && item.password === password);
    if (!member) {
      setMessage(loginMessage, '登入失敗，請確認 Email 與密碼，或先送出會員申請。', 'error');
      return;
    }
    localStorage.setItem('shangbaoCurrentMember', JSON.stringify(member));
    loginForm.reset();
    setMessage(loginMessage, '登入成功。');
    updateMemberStatus(member);
  });
}

updateMemberStatus(JSON.parse(localStorage.getItem('shangbaoCurrentMember') || 'null'));
