function handleLogin(event) {
  event.preventDefault();
  const user     = document.getElementById('login-username').value.trim();
  const pass     = document.getElementById('login-password').value.trim();
  const errorMsg = document.getElementById('login-error-msg');

  if (user === 'admin' && pass === 'PartnerAdmin2026!') {
    sessionStorage.setItem('partner_admin_auth', 'true');
    errorMsg.style.display = 'none';

    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';

    showToast("התחברת בהצלחה כמנהל מערכת", "success");

    // Push any locally-stored field mappings to the server so other admins/users get them.
    // Runs silently in the background — does not block navigation.
    syncAllMappingsToServer();

    if (state.redirectTarget) {
      const tgt = state.redirectTarget;
      state.redirectTarget = null;
      if (tgt.view === 'mapper') {
        openMapper(tgt.key);
        return;
      } else if (tgt.view === 'form-filler') {
        openFormFiller(tgt.key, tgt.subId);
        return;
      }
    }

    switchView('dashboard');
  } else {
    errorMsg.style.display = 'block';
    showToast("פרטי התחברות שגויים", "error");
  }
}

function handleLogout() {
  sessionStorage.removeItem('partner_admin_auth');
  showToast("התנתקת בהצלחה מהמערכת", "info");
  switchView('dashboard');
}
