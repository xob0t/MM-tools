// ==UserScript==
// @name         Megamarket Order Info
// @namespace    https://github.com/xob0t/MM-tools
// @version      2024-05-10
// @description  Показывает доп информацию у заказов
// @author       xob0t
// @match        https://megamarket.ru/*
// @icon         https://raw.githubusercontent.com/xob0t/MM-tools/main/media/orders-icon.png
// @grant        none
// @run-at       body
// ==/UserScript==

(function () {
  "use strict";

  const urlPattern = "api/mobile/v1/orderService/order/list";

  let orderData = [];

  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    if (args?.[0].endsWith(urlPattern)) {
      try {
        const response = await originalFetch(...args);
        const clonedResponse = response.clone();
        const data = await clonedResponse.text();
        saveData(data);
        return response;
      } catch (error) {
        console.error("[mmtools] Fetch error:", error);
        throw error;
      }
    }
    return originalFetch(...args);
  };

  function createContainer() {
    const container = document.createElement("div");
    container.className = "custom-info order-delivery-status_gray";
    container.style.marginBottom = "2rem";
    container.style.padding = "1rem";
    container.style.maxWidth = "fit-content";
    container.style.display = "flex";
    container.style.gap = "1rem";
    return container;
  }

  function createInfoEl(description, value) {
    const containerInner = document.createElement("div");
    containerInner.style.display = "flex";
    containerInner.style.zIndex = "100";
    const p = document.createElement("p");

    p.textContent = description;
    p.className = "order-delivery__title-text link-to-details";

    containerInner.appendChild(p);

    const amountEl = document.createElement("p");
    amountEl.className = "order-delivery-status_green order-delivery__title-status";
    amountEl.textContent = value;
    containerInner.appendChild(amountEl);
    return containerInner;
  }

  function saveData(data) {
    const parsedData = JSON.parse(data);
    orderData = [...orderData, ...parsedData.orders];
  }

  function ordersListAppendInfo() {
    // personal/order/
    if (!orderData) {
      console.error("[mmtools] no order data!");
      return;
    }
    try {
      const orderElements = document.querySelectorAll(".order-item");

      for (const orderElement of orderElements) {
        if (orderElement.querySelector(".custom-info")) continue;
        const order = orderData.find((order) => order.id === orderElement.getAttribute("id"));
        if (order) {
          const promoCode = order?.privileges?.used?.find((privilege) => privilege.type === "promoCode");
          const spasiboSpent = order?.totalSums?.spasiboTotalUsed;
          const spasiboObtained = order?.totalSums?.bonusRoublesTotalObtained;

          if (!promoCode && spasiboSpent === 0 && spasiboObtained === 0) continue;

          let container = createContainer();
          if (promoCode) container.appendChild(createInfoEl(`Промокод: ${promoCode.id}`, `-${promoCode.amount}`));
          if (spasiboSpent > 0) container.appendChild(createInfoEl(`Бонусов потрачено:`, `-${spasiboSpent}`));
          if (spasiboObtained > 0) container.appendChild(createInfoEl(`Бонусов получено:`, `+${spasiboObtained}`));

          orderElement.insertBefore(container, orderElement.querySelector(".order-item__deliveries"));
        }
      }
    } catch (error) {
      console.error("[mmtools] Error appending info:", error);
    }
  }
  function orderAppendInfo(orderElementDetailed) {
    // personal/order/view/*
    const extractNumbers = (str) =>
      str.split("").reduce((acc, char) => (!isNaN(parseInt(char)) ? acc + char : acc), "");

    if (!orderData) {
      console.error("[mmtools] no order data!");
      return;
    }
    try {
      if (orderElementDetailed.querySelector(".custom-info")) return;

      const deliveryIdString = orderElementDetailed.querySelector(".order-delivery-details__id").innerText;
      const deliveryId = extractNumbers(deliveryIdString);

      const order = orderData.find((order) => order.deliveries[0].id === deliveryId);
      if (order) {
        const promoCode = order?.privileges?.used?.find((privilege) => privilege.type === "promoCode");

        if (!promoCode) return;

        let container = createContainer();
        if (promoCode) container.appendChild(createInfoEl(`Промокод: ${promoCode.id}`, `-${promoCode.amount}`));

        const summaryLabels = orderElementDetailed
          .querySelector(".order-detailed__result-inner")
          .querySelectorAll(".order-precheck__item-label");

        for (const summaryLabel of summaryLabels) {
          if (summaryLabel.innerText === "Промокод") {
            summaryLabel.innerText += ` ${promoCode.id}`;
          }
        }
      }
    } catch (error) {
      console.error("[mmtools] Error appending info:", error);
    }
  }

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        for (const node of mutation.addedNodes) {
          if (
            node?.classList?.contains("order-page__items") ||
            node?.classList?.contains("order-page__personal") ||
            node?.classList?.contains("order-page")
          ) {
            console.log("[mmtools] orders added");
            ordersListAppendInfo();
          }
          if (node?.classList?.contains("order-detailed")) {
            console.log("[mmtools] orders-detailed added");
            orderAppendInfo(node);
          }
        }
      }
    }
  });

  const target = document.body;
  const config = { attributes: false, childList: true, subtree: true };
  observer.observe(target, config);
})();
