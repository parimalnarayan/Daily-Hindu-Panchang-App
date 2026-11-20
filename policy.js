"use strict";
const languageButtons = document.querySelectorAll("[data-language]");
window.policyLanguage = "en";
function setLanguage(language) {
  window.policyLanguage = language;
  document.documentElement.lang = language;
  document.querySelectorAll("[data-lang]").forEach((el) => {
    el.hidden = el.dataset.lang !== language;
  });
  languageButtons.forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.language === language),
    ),
  );
  document.dispatchEvent(
    new CustomEvent("policy-language", { detail: language }),
  );
}
languageButtons.forEach((button) =>
  button.addEventListener("click", () => setLanguage(button.dataset.language)),
);
const navigationText = {
  en: {
    home: "Home",
    privacy: "Privacy",
    subscription: "Subscription",
    deletion: "Delete account",
    contact: "Contact maintainer",
    skip: "Skip to content",
  },
  hi: {
    home: "होम",
    privacy: "प्राइवेसी",
    subscription: "सब्सक्रिप्शन",
    deletion: "अकाउंट डिलीट करें",
    contact: "मेंटेनर से संपर्क करें",
    skip: "मुख्य जानकारी पर जाएँ",
  },
};
document.addEventListener("policy-language", (event) =>
  document
    .querySelectorAll("[data-policy-text]")
    .forEach(
      (el) =>
        (el.textContent = navigationText[event.detail][el.dataset.policyText]),
    ),
);
