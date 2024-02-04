// ==UserScript==
// @name         Megamarket Ref Date
// @namespace    https://github.com/xob0t/MM-tools
// @version      2024-02-04
// @description  Добваляет дату начисления реферальных бонусов
// @author       xob0t
// @match        https://megamarket.ru/personal/loyalty
// @icon         https://www.google.com/s2/favicons?sz=64&domain=megamarket.ru
// @grant        none
// @run-at       body
// ==/UserScript==

(function () {
    'use strict';

    const urlPattern = 'api/mobile/v1/loyaltyService/bonus/history';

    let refDateData = null;

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
                console.error('Fetch error:', error);
                throw error;
            }
        }
        return originalFetch(...args);
    };

    function createElement(text) {
        const p = document.createElement('p');
        p.className = 'bonus-transaction-item__transaction-spasibo-debit-date bonus-transaction-item__transaction-value_finished';
        p.textContent = text;
        return p;
    }

    function parseData(data) {
        const parsedData = JSON.parse(data);
        refDateData = parsedData.details.filter(item => item.name === "Начисление за заказ вашего друга");
    }

    function appendDate() {
        if (!refDateData) {
            console.error("no date data!")
            return
        }
        try {
            const bonusHistoryElements = Array.from(document.querySelectorAll("div.bonus-transaction-item"));
            const refElements = bonusHistoryElements.filter(item => item.innerText.includes("Начисление за заказ вашего друга"));

            for (const [index, refElement] of refElements.entries()) {
                const date = refDateData[index].date;
                const newElement = createElement(date);
                refElement.querySelector(".bonus-transaction-item__right-side").append(newElement);
            }

        } catch (error) {
            console.error('Error appending date:', error);
        }
    }

    const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node?.classList.contains('profile-loyalty-list')) {
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
