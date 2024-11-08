const axios = require("axios");
const puppeteer = require("puppeteer");

const callApiWithRetry = async (url, method, data, maxRetries = 3, retryDelay = 2000) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const response = await axios({
        method: method,
        url: url,
        data: data,
      });

      return response.data;
    } catch (error) {
      attempts++;

      if (attempts >= maxRetries) {
        console.error("API call failed after maximum retries.");
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};

const launchBrowserWithRetry = async (launchOptions, maxRetries = 3, retryDelay = 2000) => {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      const browser = await puppeteer.launch(launchOptions);
      return browser;
    } catch (error) {
      attempts++;
      console.log(`Failed to launch browser. Attempt ${attempts} of ${maxRetries}.`);

      if (attempts >= maxRetries) {
        console.error("Failed to launch browser after maximum retries.");
        throw error;
      }

      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
};


module.exports = { callApiWithRetry, launchBrowserWithRetry };