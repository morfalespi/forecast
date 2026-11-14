const webApp = window.Telegram?.WebApp;
const statusDot = document.querySelector('#status-dot');
const statusTitle = document.querySelector('#status-title');
const statusDetail = document.querySelector('#status-detail');
const profileCard = document.querySelector('#profile-card');
const avatar = document.querySelector('#avatar');
const avatarFallback = document.querySelector('#avatar-fallback');
const displayName = document.querySelector('#display-name');
const username = document.querySelector('#username');
const userId = document.querySelector('#user-id');
const language = document.querySelector('#language');
const context = document.querySelector('#context');

const setStatus = (title, detail, state) => {
  statusTitle.textContent = title;
  statusDetail.textContent = detail;
  statusDot.className = `status-dot ${state}`.trim();
};

const renderProfile = (profile) => {
  const user = profile.user;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Telegram';
  const initial = fullName.slice(0, 1).toLocaleUpperCase() || 'F';

  displayName.textContent = fullName;
  username.textContent = user.username ? `@${user.username}` : 'Sem username público';
  userId.textContent = String(user.id);
  language.textContent = user.languageCode || 'Não informado';
  context.textContent = profile.chat?.type || 'Privado';
  avatarFallback.textContent = initial;

  if (user.photoUrl) {
    avatar.src = user.photoUrl;
    avatar.hidden = false;
    avatarFallback.hidden = true;
  }

  profileCard.hidden = false;
  setStatus('Conectado', 'O Telegram Serverless validou a identidade desta sessão.', '');
};

const showFailure = (error) => {
  const unauthorized = error?.type === 'UNAUTHORIZED';
  const detail = unauthorized
    ? 'Abra esta Mini App pelo Telegram para enviar dados de inicialização válidos.'
    : error?.message || 'O endpoint protegido não respondeu.';

  setStatus('Conexão indisponível', detail, 'error');
};

if (!webApp?.Serverless?.call) {
  showFailure({
    type: 'UNAUTHORIZED',
    message: 'Telegram WebApp Serverless indisponível'
  });
} else {
  webApp.ready();
  webApp.expand();
  webApp.Serverless.call('getProfile', {}, (error, profile) => {
    if (error) {
      showFailure(error);
      return;
    }

    renderProfile(profile);
  });
}

