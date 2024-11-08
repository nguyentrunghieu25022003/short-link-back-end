const fs = require("fs");
const path = require("path");
const { sleep } = require("../../../helper/sleep");
const SocialSnapshot = require("../../../models/social-snapshot.model");
const { launchBrowserWithRetry } = require("../../../helper/retryApi");
const configPath = path.join(__dirname, "../../../../config.json");
const rawConfig = fs.readFileSync(configPath, "utf-8");

const config = JSON.parse(
  rawConfig.replace(/\$\{(.*?)\}/g, (match, varName) => process.env[varName])
);

module.exports.getAllResult = async (req, res) => {
  try {
    const result = await SocialSnapshot.find({});

    res.status(200).json(result);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};

module.exports.handleCrawlDataByUsername = async (req, res) => {
  let browser = null;
  try {
    const { userInput } = req.body;

    browser = await launchBrowserWithRetry({
      headless: true,
      /* executablePath: "/usr/bin/google-chrome", */
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
        `--proxy-server=${config.proxy.http}`,
      ],
    });

    const page = await browser.newPage();
    if (config.proxy.username && config.proxy.password) {
      await page.authenticate({
        username: config.proxy.username,
        password: config.proxy.password,
      });
    }

    const url = `${process.env.FACEBOOK_URL}/login/identify/?ctx=recover&from_login_screen=0`;
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await sleep(1000);
    await page.type("#identify_email", userInput);

    await sleep(2000);
    await page.click("button[name='did_submit']");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    await sleep(1000);
    const tryAnotherWayLink = await page.$("a[name='tryanotherway']");
    if (tryAnotherWayLink) {
      await tryAnotherWayLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle2" });
    }

    await sleep(1000);
    const email = await page.evaluate(() => {
      const emailElements =
        document.querySelector("div._9o1y") ||
        document.querySelector("div._aklx");
      if (emailElements) {
        const emailArray = emailElements
          ? emailElements.innerText
              .trim()
              .split("\n")
              .map((email) => email.trim())
          : [];
        const validEmailArray = emailArray.filter((email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        });
        return Array.from(new Set(validEmailArray));
      }
      return [];
    });

    const phone = await page.evaluate(() => {
      const phoneElements = Array.from(
        document.querySelectorAll("div[dir='ltr']")
      );
      if (phoneElements) {
        const phoneArray = phoneElements
          ? phoneElements.map((phoneElement) => phoneElement.innerText.trim())
          : [];
        return Array.from(new Set(phoneArray));
      }
      return [];
    });

    const socialSnapshot = new SocialSnapshot({
      userInfo: userInput,
      email: email,
      phoneNumber: phone,
    });
    await socialSnapshot.save();

    const client = await page.createCDPSession();
    await client.send("Network.clearBrowserCookies");
    await client.send("Network.clearBrowserCache");
    await client.send("Storage.clearDataForOrigin", {
      origin: url,
      storageTypes: "all",
    });
    await browser.close();

    res.status(200).json({
      email: email,
      phone: phone,
    });
  } catch (err) {
    if (browser) {
      await browser.close();
    }
    res.status(500).send("Can't crawl data: " + err.message);
  }
};

module.exports.handleCrawlDataByUserId = async (req, res) => {
  let browser = null;
  try {
    const { userInput } = req.body;
    browser = await launchBrowserWithRetry({
      headless: true,
      /* executablePath: "/usr/bin/google-chrome", */
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-zygote",
        "--single-process",
        `--proxy-server=${config.proxy.http}`,
      ],
    });

    const page = await browser.newPage();
    if (config.proxy.username && config.proxy.password) {
      await page.authenticate({
        username: config.proxy.username,
        password: config.proxy.password,
      });
    }
    const url = `${process.env.FACEBOOK_URL}/login`;
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    await sleep(1000);
    await page.type("#email", userInput);

    await sleep(2000);
    await page.click("button[name='login']");
    await page.waitForNavigation({ waitUntil: "networkidle2" });

    await sleep(1000);
    const tryAnotherWayLink = await page.$("a[name='tryanotherway']");
    if (tryAnotherWayLink) {
      await tryAnotherWayLink.click();
      await page.waitForNavigation({ waitUntil: "networkidle2" });
    }

    await sleep(1000);
    const email = await page.evaluate(() => {
      const emailElements =
        document.querySelector("div._9o1y") ||
        document.querySelector("div._aklx");
      if (emailElements) {
        const emailArray = emailElements
          ? emailElements.innerText
              .trim()
              .split("\n")
              .map((email) => email.trim())
          : [];
        const validEmailArray = emailArray.filter((email) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        });

        return Array.from(new Set(validEmailArray));
      }
      return [];
    });

    const phone = await page.evaluate(() => {
      const phoneElements = Array.from(
        document.querySelectorAll("div[dir='ltr']")
      );
      if (phoneElements) {
        const phoneArray = phoneElements
          ? phoneElements.map((phoneElement) => phoneElement.innerText.trim())
          : [];
        return Array.from(new Set(phoneArray));
      }
      return [];
    });

    const socialSnapshot = new SocialSnapshot({
      userInfo: userInput,
      email: email,
      phoneNumber: phone,
    });
    await socialSnapshot.save();

    const client = await page.createCDPSession();
    await client.send("Network.clearBrowserCookies");
    await client.send("Network.clearBrowserCache");
    await client.send("Storage.clearDataForOrigin", {
      origin: url,
      storageTypes: "all",
    });
    await browser.close();

    res.status(200).send({
      email: email,
      phone: phone,
    });
  } catch (err) {
    if (browser) {
      await browser.close();
    }
    res.status(500).send("Can't crawl data: " + err.message);
  }
};
