// ==UserScript==
// @name         Megamarket Cart Tools
// @namespace    https://github.com/xob0t/MM-tools
// @version      2023-12-23
// @description  Копирование, вставка и удаление корзин
// @author       xob0t
// @match        https://megamarket.ru/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=megamarket.ru
// @grant        GM_setClipboard
// @run-at       document-start
// @require      file:///C:/js/mm-cart-tools.user.js
// ==/UserScript==

(function () {
	'use strict';

	const createDeleteButton = () => {
		const button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.classList.add('btn', 'btn-block', 'btn-checkout', 'btn-delete');
		button.textContent = 'Удалить корзину';
		button.style.backgroundColor = "brown";

		button.addEventListener('click', () => {
			handleDeleteCartButtonClick(button);
		});

		return button;
	};

	const handleDeleteCartButtonClick = async (button) => {
		const parentCart = button.closest('.multicart-item.cart.multicart__item');
		let removeButtons = parentCart.querySelectorAll('.good__remove');

		button.style.transition = 'background-color 0.5s ease-in-out, color 0.5s ease-in-out';

		while (removeButtons.length > 0) {
			for (const removeButton of removeButtons) {
				await new Promise(resolve => {
					setTimeout(() => {
						button.textContent = 'Удаляем...'; // Change text while deletion is in progress
						button.style.backgroundColor = 'darkred'; // Change button background color
						button.style.transition = 'background-color 0.5s ease-in-out';
						removeButton.click(); // Trigger click on each element with class "good__remove"
						resolve();
					}, 100);
				});

				// Restore initial button appearance after deletion
			}
			removeButtons = parentCart.querySelectorAll('.good__remove'); // Update the NodeList
		}
	};

	const addDeleteButtonToCart = cartElement => {
		const summary = cartElement.querySelector('.cart-summary-redesign__inner');
		if (summary) {
			const checkoutButton = summary.querySelector('button.btn.btn-block.btn-checkout');
			if (checkoutButton) {
				const deleteButton = createDeleteButton();
				summary.insertBefore(deleteButton, checkoutButton.nextSibling);
			}
		}
	};



	const createInputFieldWithId = (id) => {
		const divElement = document.createElement('div');
		divElement.className = 'form-group';
		divElement.id = id;
		divElement.style.width = "65%"
		divElement.style.marginTop = "30px"
		divElement.style.marginBottom = "30px"

		const inputElement = document.createElement('input');
		inputElement.setAttribute('type', 'text');
		inputElement.className = 'text-input';
		inputElement.placeholder = 'Вставить корзину';

		divElement.appendChild(inputElement);

		inputElement.addEventListener('keydown', event => {
			if (event.key === 'Enter') {
				handleTextFieldSubmit(inputElement);
			}
		});
		return divElement
	};

	const handleTextFieldSubmit = async (inputField) => {
		const trimmedText = inputField.value.trim();
		if (trimmedText !== '') {
			try {
				const newCartData = JSON.parse(trimmedText);
				await addToCartRequest(newCartData.items, newCartData.cartInfo.type, newCartData.cartInfo.locationId);
				location.reload()
			} catch (error) {
				console.error('Error parsing JSON:', error);
				alert('Ошибка ввода корзины');
			}
		}
	};

	const removeInputFieldWithId = (id) => {
		const elementToRemove = document.getElementById(id);
		if (elementToRemove) {
			elementToRemove.remove();
		} else {
			console.log(`Element with ID ${id} not found.`);
		}
	};

	const extractItemsAndCartInfo = (data) => {
		const items = data.itemGroups.map(item => {
			return {
				offer: {
					merchantId: item.merchant.id ? parseInt(item.merchant.id) : null
				},
				goods: {
					goodsId: item.goods.goodsId
				},
				quantity: item.quantity
			};
		});

		const cartInfo = {
			type: data.type,
			locationId: data.locationId,
		};

		return {
			items,
			cartInfo
		};
	};

	const getCartData = async (cartId) => {
		return fetch("https://megamarket.ru/api/mobile/v2/cartService/cart/get", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			credentials: "include",
			body: JSON.stringify({
				"identification": {
					"id": cartId
				},
				"isCartStateValidationRequired": true,
				"isSelectedItemGroupsOnly": false,
				"loyaltyCalculationRequired": true,
				"isSkipPersonalDiscounts": true
			})
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok.');
				}
				return response.json();
			})
			.catch(error => {
				console.error('Error getCartData:', error);
				throw error;
			});
	};

	const getAllCarts = () => {
		return fetch("https://megamarket.ru/api/mobile/v2/cartService/cart/search", {
			method: "POST",
			mode: "cors",
			credentials: "include",
			headers: {
				"Content-Type": "application/json"
			},
			body: null
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok.');
				}
				return response.json();
			})
			.catch(error => {
				console.error('Error:', error);
				throw error;
			});
	}


	const addToCartRequest = async (items, cartType, locationId) => {
		const url = "https://megamarket.ru/api/mobile/v2/cartService/offers/add";
		const requestBody = {
			"identification": {
				"id": null
			},
			"items": items,
			"cartType": cartType,
			"clientAddress": {
				"address": "foo",
				"addressId": "bar",
				"geo": {
					"lat": "0",
					"lon": "0"
				}
			},
			"locationId": locationId
		};

		try {
			const response = await fetch(url, {
				method: "POST",
				headers: {
					"Content-Type": "application/json"
				},
				credentials: "include",
				body: JSON.stringify(requestBody)
			});

			if (!response.ok) {
				throw new Error("Network response was not ok");
			}

			const responseData = await response.json();
			console.log("Cart Data:", responseData);
			return responseData;
		} catch (error) {
			console.error("Error:", error.message);
			throw error;
		}
	};

	const createCopyButton = () => {
		const button = document.createElement('button');
		button.setAttribute('type', 'button');
		button.classList.add('btn', 'btn-block', 'btn-checkout');

		const spanElement = document.createElement('span');
		spanElement.textContent = 'Копировать корзину';

		button.appendChild(spanElement);

		// Applying styles
		button.style.backgroundColor = 'green';

		// Adding event listener to the created button
		button.addEventListener('click', async () => {
			await handleCopyButtonClick(button);
		});

		return button;
	};

	// Function to handle the button's click event
	const handleCopyButtonClick = async (button) => {
		const cartItem = button.closest('.multicart-item.cart.multicart__item');
		const parent = cartItem.parentElement;
		const position = Array.from(parent.children).indexOf(cartItem);

		try {
			const responseData = await getAllCarts();
			if (responseData && responseData.elements && responseData.elements.length > position) {
				const cartId = responseData.elements[position].identification.id;
				let cartData = await getCartData(cartId);
				cartData = extractItemsAndCartInfo(cartData);
				const cartDataStringified = JSON.stringify(cartData);
				await GM_setClipboard(cartDataStringified);
				handleButtonAnimation(button, 'orange', 'Скопировано!')
				console.log('Button clicked for item:', cartItem, 'Cart Content:', cartData);
			} else {
				console.log('Cart content not found for position:', position);
			}
		} catch (error) {
			console.error('Error fetching cart content:', error);
		}
	};

	const handleButtonAnimation = (button, color, text) => {
		const initialButtonText = button.textContent;
		const initialButtonColor = button.style.backgroundColor;

		button.textContent = text;
		button.style.backgroundColor = color;
		button.style.transition = 'background-color 0.5s ease-in-out'; // Adding fade-in effect

		setTimeout(() => {
			button.textContent = initialButtonText;
			button.style.backgroundColor = initialButtonColor;
			button.style.transition = 'background-color 0.5s ease-in-out'; // Adding fade-out effect
		}, 2000);
	};

	// Function to add buttons to the specified element
	const addCopyButtonToCart = cartElement => {
		const checkoutButton = cartElement.querySelector('button.btn.btn-block.btn-checkout');
		if (checkoutButton) {
			checkoutButton.parentNode.insertBefore(createCopyButton(), checkoutButton.nextSibling);
		}

	};

	const addFieldToEmptyCart = (emptyCart) => {
		const cartEmptyImage = emptyCart.querySelector(".cart-empty__image");
		const inputField = createInputFieldWithId("emptyCart");

		// Create a new div element to serve as the parent for the inputField
		const newParent = document.createElement('div');

		// Apply styles to the new parent if needed
		newParent.style.display = 'flex'; // Set the parent's display to flex
		newParent.style.justifyContent = 'center'; // Center content horizontally
		newParent.style.width = '100%'; // Ensure the new parent takes the full width available

		// Insert the inputField into the new parent
		newParent.appendChild(inputField);

		// Additional styles to position inputField at the horizontal center within the new parent
		inputField.style.display = 'block'; // Ensure the inputField is a block-level element for proper centering
		inputField.style.margin = 'auto'; // Set margin to auto to horizontally center
		inputField.style.maxWidth = '50%'; // Set a maximum width for the inputField
		inputField.style.width = '100%'; // Ensure the inputField takes up the available width within the new parent
		inputField.style.textAlign = 'center'; // Center text within the inputField

		// Insert the new parent with the inputField as the next sibling of cartEmptyImage
		cartEmptyImage.parentNode.insertBefore(newParent, cartEmptyImage.nextSibling);

	};

	const handleNewMultiCart = (node) => {
		const multicartList = node.querySelector('.multicart__list');
		if (multicartList && multicartList.children) {
			handleNewCartList(multicartList)
		}
	}

	const handleNewCartList = (node) => {
		for (const cartElement of node.children) {
			// for a cart in the multicart
			addButtonsToCart(cartElement);
		}
		const isCartExists = document.getElementById("cartField")
		if (!isCartExists) {
			node.parentNode.insertBefore(createInputFieldWithId("cartField"), node);
		}

	}

	const addButtonsToCart = (cartElement) => {
		addCopyButtonToCart(cartElement);
		addDeleteButtonToCart(cartElement);
	}


	const handleMutations = (mutationsList) => {
		mutationsList.forEach(mutation => {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach(node => {
					if (node && node.classList && node.classList.length === 1 && node.classList.contains('multicart')) {
						// new multicart added
						handleNewMultiCart(node);
					}
					if (node && node.classList && node.classList.length === 1 && node.classList.contains('multicart__list')) {
						// new multicart__list added
						handleNewCartList(node);
					}

					if (node.classList && node.classList.contains('cart-empty')) {
						// new empty cart added
						console.log('New cart-empty:', node);
						addFieldToEmptyCart(node)

					}
				});

				mutation.removedNodes.forEach(node => {
					if (node.classList && node.classList.contains('multicart__list')) {
						// multicart__list removed
						removeInputFieldWithId("cartField")
					}
				});
			}
		});
	}


	const observer = new MutationObserver(handleMutations);

	const observerConfig = { childList: true, subtree: true };

	observer.observe(document, observerConfig);
})();