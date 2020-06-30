const puppeteer = require("puppeteer");
const { performance } = require('perf_hooks');

const link = (() => {
	const args = process.argv;
	const linkArgIndex = args.findIndex((value) => value === "--link");
	if (linkArgIndex !== -1 && args[linkArgIndex + 1]) {
		return args[linkArgIndex + 1];
	} else return null;
})();

if (link !== null) {
	(async () => {
        const t1 = performance.now();
		const browser = await puppeteer.launch();
		const page = await browser.newPage();

		await page.goto(link);

		const pageCount = await page.evaluate(() => {
			const elements = document.querySelectorAll(".pagination-item-1WyVp");
			const lastPageElement = elements[elements.length - 2];
			if (!lastPageElement) {
				return 0;
			}

			return parseInt(lastPageElement.innerText);
		});

		console.log("Всего страниц", pageCount);

		if (pageCount > 0) {
			let currentPage = 1;
			const allPrices = [];
			while (currentPage <= pageCount) {
                await page.waitFor(2000);
                console.log("Переходим на страницу", currentPage);
				if (currentPage > 1) {
					await page.goto(`${link}&p=${currentPage}`);
				}
				const prices = await page.evaluate(() => {
					const elements = document.querySelectorAll(".item.item_table");
					const priceInPage = [];
					for (const element of elements) {
						const priceElement = element.querySelector('[data-marker="item-price"]');
						if (!priceElement) {
							continue;
						}
						priceInPage.push(parseFloat(priceElement.innerText.split(" ").join("")));
					}
					return priceInPage;
				});
				allPrices.push(...prices);
                currentPage++;
			}
			const countOfAllPrices = allPrices.reduce((prevValue, currentValue) => {
				return prevValue + currentValue;
			}, 0);
			console.log("Средняя цена по России", Math.round(countOfAllPrices / allPrices.length));
		}

        browser.close();
        const t2 = performance.now();
        console.log(`Время поиска: ${Math.round((t2 - t1) / 1000)} секунд`)
	})();
}
