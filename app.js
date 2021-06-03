const puppeteer = require("puppeteer");
const fs = require("fs");
const axios = require('axios');
const Path = require('path');

let data = [];
var count;
var baseUrl = "https://www.pinterest.com/";
var userName = "************ ENTER USERNAME HERE ************"; // Replace with user name
var boardName = "*********** ENTER BOARD NAME HERE *************"; // Replace with board name
const url = baseUrl +"/"+userName+"/"+boardName;

function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time)
    });
}

async function pintresturlscrape(browser) {
    const page = await browser.newPage();
    await page.setViewport({
        width: 1440,
        height: 744
    });
    await page.goto(url, {
        waitUntil: "networkidle2"
    })
    try {
        count = await page.$eval('header div div div[data-test-id="board-count-info"] div div div', el => el.innerHTML);
        count = count.replace("<!-- -->&nbsp;", "");
        count = parseInt(count);
        console.log(count);
    } catch (e) {
        console.error(e);
        count = 5;
        count = parseInt(count);
    } finally {
        console.log('count = ' + count);
    }

    do {

        preCount = await page.$$eval('div[class="PinGridInner__brioPin GrowthUnauthPin_brioPinLego"]', el => el.length);
        console.log(preCount);

        await delay(3000);
        await page.$eval('div[class="Collection"]:last-child', el => el.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'end'
        }));
        await delay(3000);
        postCount = await page.$$eval('div[class="PinGridInner__brioPin GrowthUnauthPin_brioPinLego"]', el => el.length);
        console.log(postCount);
    }while (postCount > preCount);

    for (let i = 1; i <= count; i++) {
        try {
            data[i - 1] = await page.$eval('div[class="Collection"]>div:nth-child(' + i + ') a img', el => el.src);
            data[i - 1] = data[i - 1].replace("236x", "originals");
            console.log(data[i - 1]);
        } catch (err) {
            console.log(err);
        }
    }
    console.log(data.length);
    await page.close();
}

async function imgdownloader(index) {
    try {
        const url = data[index];
        console.log(index);
        console.log(data[index]);
        const path = Path.resolve(__dirname, 'images', 'Image-' + index + '.jpg')
    
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(path);
        response.data.pipe(writer)
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve)
            writer.on('error', reject)
        })

    } catch (err) {
        console.log(err);
    }

}

try {
    (async () => {

        const browser = await puppeteer.launch({
            headless: true,
            args:[
                '--ignore-certificate-errors',
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-gpu'
              ]
            
        });

        await pintresturlscrape(browser);
        await browser.close();

        for (let index = 0; index < data.length; index++) {

            await imgdownloader(index);

        }
    })();
} catch (err) {

    console.log(err);

}