// ==UserScript==
// @name         Megamarket Bonus Date
// @namespace    https://github.com/xob0t/MM-tools
// @version      2024-02-12
// @description  Показывает дату начислений бонусов
// @author       xob0t
// @match        https://megamarket.ru/personal/loyalty
// @icon         https://raw.githubusercontent.com/xob0t/MM-tools/main/media/spasibo-bonus-icon.png
// @grant        none
// @run-at       body
// ==/UserScript==

(function () {
  "use strict";

  const urlPattern = "api/mobile/v1/loyaltyService/bonus/history";

  let bonusData = null;

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    if (args?.[0].endsWith(urlPattern)) {
      try {
        const response = await originalFetch(...args);
        const clonedResponse = response.clone();
        const data = await clonedResponse.text();
        parseData(data);
        return response;
      } catch (error) {
        console.error("Fetch error:", error);
        throw error;
      }
    }
    return originalFetch(...args);
  };

  function createNewElement(text) {
    const p = document.createElement("p");
    p.className =
      "custom-date bonus-transaction-item__transaction-spasibo-debit-date bonus-transaction-item__transaction-value_finished";
    p.textContent = text;
    return p;
  }

  function parseData(data) {
    const parsedData = JSON.parse(data);
    bonusData = parsedData.details;
  }

  function appendDate() {
    if (!bonusData) {
      console.error("no bonus data!");
      return;
    }
    try {
      const bonusHistoryElements = Array.from(document.querySelectorAll(".bonus-transaction-item"));

      for (const [index, bonusHistoryElement] of bonusHistoryElements.entries()) {
        const processed = bonusHistoryElement.querySelector(".bonus-transaction-item__right-side .custom-date");
        const preExistingDate = bonusHistoryElement.querySelector(
          ".bonus-transaction-item__right-side .bonus-transaction-item__transaction-spasibo-debit-date"
        );
        if (processed || preExistingDate) continue;
        const date = bonusData[index].date;
        const newElement = createNewElement(date);
        bonusHistoryElement.querySelector(".bonus-transaction-item__right-side").append(newElement);
      }
    } catch (error) {
      console.error("Error appending date:", error);
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (
            node?.classList?.contains("profile-loyalty-list") ||
            node?.classList?.contains("bonus-transaction-item")
          ) {
            appendDate();
          }
        }
      }
    }
  });

  const target = document.body;
  const config = { attributes: false, childList: true, subtree: true };

  observer.observe(target, config);
})();
