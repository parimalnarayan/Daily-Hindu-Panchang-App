// Public Firebase web configuration is supplied by the site owner at deployment.
// No service-account key, purchase token, local entitlement or production test override belongs here.
const translations = {
  en: {
    formTitle: "Confirm account deletion",
    email: "Email",
    password: "Password",
    confirm:
      "I understand this deletes my account permanently and does not cancel my Google Play subscription.",
    delete: "Delete my account",
    reset: "Reset password",
    secure:
      "Only the authenticated account can be deleted. Do not share your password with support.",
    working: "Connecting securely…",
    unavailable:
      "Online deletion is not configured on this website yet. Use Account → Delete in the app. Please contact the maintainer if you need help; do not post your password or personal details.",
    failed:
      "The request could not be completed. Check your email/password and connection, then try again. No successful deletion has been confirmed.",
    deleted:
      "Your account has been deleted. Google Play subscriptions are not canceled by deletion; manage them separately in Play. Reconnect or clear app storage on your phones to remove local copies.",
    resetSent:
      "If this address has an account, a password-reset email will be sent. Check your inbox and spam folder.",
    confirmation: "Tick the confirmation before deleting your account.",
    invalid: "Enter a valid email and password.",
    rate: "Too many attempts. Please wait before trying again.",
  },
  hi: {
    formTitle: "अकाउंट डिलीट करने की पुष्टि करें",
    email: "ईमेल",
    password: "पासवर्ड",
    confirm:
      "मैं समझता/समझती हूँ कि अकाउंट हमेशा के लिए डिलीट होगा। इससे Google Play सब्सक्रिप्शन कैंसिल नहीं होता।",
    delete: "मेरा अकाउंट डिलीट करें",
    reset: "पासवर्ड रीसेट करें",
    secure:
      "सिर्फ लॉगिन किए हुए अकाउंट को डिलीट किया जा सकता है। सहायता के लिए भी पासवर्ड शेयर न करें।",
    working: "सुरक्षित कनेक्शन बन रहा है…",
    unavailable:
      "इस वेबसाइट पर ऑनलाइन डिलीट अभी कॉन्फिगर नहीं है। ऐप में अकाउंट → डिलीट इस्तेमाल करें। मदद के लिए मेंटेनर से संपर्क करें; पासवर्ड या निजी जानकारी पब्लिक में न डालें।",
    failed:
      "रिक्वेस्ट पूरी नहीं हुई। ईमेल/पासवर्ड और इंटरनेट जाँचकर फिर कोशिश करें। अकाउंट डिलीट होने की पुष्टि नहीं हुई है।",
    deleted:
      "आपका अकाउंट डिलीट हो गया है। Google Play सब्सक्रिप्शन अलग से मैनेज या कैंसिल करें। फोन का लोकल डेटा हटाने के लिए ऐप ऑनलाइन खोलें या उसका स्टोरेज साफ करें।",
    resetSent:
      "इस ईमेल से अकाउंट है तो पासवर्ड रीसेट ईमेल भेजा जाएगा। इनबॉक्स और स्पैम फोल्डर देखें।",
    confirmation: "अकाउंट डिलीट करने से पहले पुष्टि का बॉक्स सेलेक्ट करें।",
    invalid: "सही ईमेल और पासवर्ड डालें।",
    rate: "बहुत बार कोशिश हुई है। थोड़ी देर बाद फिर कोशिश करें।",
  },
};
let messageKey = "",
  busy = false,
  completed = false,
  servicesPromise;
const form = document.getElementById("delete-form"),
  status = document.getElementById("delete-status");
function text(key) {
  return translations[window.policyLanguage || "en"][key];
}
function translate() {
  document
    .querySelectorAll("[data-i18n]")
    .forEach((el) => (el.textContent = text(el.dataset.i18n)));
  if (messageKey) status.textContent = text(messageKey);
}
function message(key) {
  messageKey = key;
  status.textContent = text(key);
}
function setBusy(value) {
  busy = value;
  form
    .querySelectorAll("button,input")
    .forEach((el) => (el.disabled = value || completed));
  form.setAttribute("aria-busy", String(value));
}
document.addEventListener("policy-language", translate);
translate();
class ConfigurationError extends Error {}
async function services() {
  if (!servicesPromise)
    servicesPromise = (async () => {
      let config;
      try {
        const response = await fetch("firebase-config.json", {
          cache: "no-store",
          signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) throw new ConfigurationError();
        config = await response.json();
        if (
          !config.firebase?.apiKey ||
          !config.firebase?.projectId ||
          !config.firebase?.appId ||
          !config.appCheckSiteKey ||
          config.appCheckSiteKey.includes("REPLACE")
        )
          throw new ConfigurationError();
      } catch {
        throw new ConfigurationError();
      }
      const version = "12.19.0",
        base = `https://www.gstatic.com/firebasejs/${version}/`;
      const [appModule, authModule, functionsModule, checkModule] =
        await Promise.all([
          import(base + "firebase-app.js"),
          import(base + "firebase-auth.js"),
          import(base + "firebase-functions.js"),
          import(base + "firebase-app-check.js"),
        ]);
      const app = appModule.initializeApp(config.firebase, "account-deletion");
      checkModule.initializeAppCheck(app, {
        provider: new checkModule.ReCaptchaEnterpriseProvider(
          config.appCheckSiteKey,
        ),
        isTokenAutoRefreshEnabled: true,
      });
      const auth = authModule.initializeAuth(app, {
        persistence: authModule.inMemoryPersistence,
      });
      return {
        auth,
        authModule,
        call: functionsModule.httpsCallable(
          functionsModule.getFunctions(app, "asia-south1"),
          "deleteOwnAccount",
          { timeout: 120000 },
        ),
      };
    })().catch((error) => {
      servicesPromise = undefined;
      throw error;
    });
  return servicesPromise;
}
async function request(deleting) {
  if (busy || completed) return;
  const email = document.getElementById("email"),
    password = document.getElementById("password");
  if (!email.reportValidity() || (deleting && !password.reportValidity())) {
    message("invalid");
    return;
  }
  if (deleting && !document.getElementById("confirm").checked) {
    message("confirmation");
    return;
  }
  setBusy(true);
  message("working");
  let service;
  try {
    service = await services();
    if (!deleting) {
      await service.authModule.sendPasswordResetEmail(
        service.auth,
        email.value.trim(),
      );
      message("resetSent");
      return;
    }
    // A fresh password login provides a recent Firebase auth_time. The backend chooses the UID from the verified ID token.
    await service.authModule.signInWithEmailAndPassword(
      service.auth,
      email.value.trim(),
      password.value,
    );
    password.value = "";
    const result = await service.call({});
    if (result.data?.deleted !== true)
      throw new Error("Deletion not confirmed");
    completed = true;
    message("deleted");
  } catch (error) {
    message(
      error instanceof ConfigurationError
        ? "unavailable"
        : error.code === "auth/too-many-requests"
          ? "rate"
          : "failed",
    );
  } finally {
    password.value = "";
    if (service) await service.authModule.signOut(service.auth).catch(() => {});
    setBusy(false);
  }
}
form.addEventListener("submit", (event) => {
  event.preventDefault();
  request(true);
});
document
  .getElementById("reset-password")
  .addEventListener("click", () => request(false));
