const cheerio = require("cheerio");
const shortid = require("shortid");
const Url = require("../../../models/url.model");
const { getClientIP } = require("../../../helper/getIP");
const { callApiWithRetry } = require("../../../helper/retryApi");

module.exports.getAllShortenedLink = async (req, res) => {
  try {
    const urls = await Url.find({});
    res.status(200).json(urls);
  } catch (err) {
    res.status(500).send("Error: " + err.message);
  }
};

module.exports.createShortenedLink = async (req, res) => {
  try {
    const { userId } = req.params;
    const { originalUrl } = req.body;
    const shortId = shortid.generate();

    const html = await callApiWithRetry(originalUrl, "GET", null, 3, 2000);
    const $ = cheerio.load(html);
    const title = $("title").text() || null;
    const description = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || $('meta[name="twitter:description"]').attr("content") || null;
    const thumbnail = $('meta[property="og:image"]').attr("content") || null;

    const newUrl = new Url({
      userId: userId,
      originalUrl: originalUrl,
      shortId: shortId,
      title: title,
      description: description,
      thumbnail: thumbnail,
    });
    await newUrl.save();

    res.status(200).send({ message: "Created successfully" });
  } catch (err) {
    res.status(500).send("Error creating link: " + err.message);
  }
};

module.exports.handleGetIPAddress = async (req, res) => {
  try {
    const ip = getClientIP(req);
    
    res.status(200).json({ ip });
  } catch (err) {
    res.status(500).send("Error get IP: " + err.message);
  }
};

module.exports.handleSaveIPAddressAndLocation = async (req, res) => {
  try {
    const { shortId } = req.params;
    const ip = getClientIP(req);
    const base64Location = req.query.data;
    
    if (!base64Location) {
      return res.status(400).send("Location data is required.");
    }

    const decodedLocation = atob(base64Location);
    const locationData = JSON.parse(decodedLocation);
    const url = await Url.findOne({ shortId: shortId });

    if(url) {
      url.visits.push({
        ip: ip,
        location: locationData
      });
      await url.save();
    }

    res.setHeader("Content-Type", "image/png");
    res.status(200).send(Buffer.from([]));
  } catch (err) {
    res.status(500).send("Error save location: " + err.message);
  }
};

module.exports.getUserHistories = async (req, res) => {
  try {
    const { userId } = req.params;
    const urls = await Url.find({ userId: userId });
    
    res.status(200).send(urls);
  } catch (err) {
    res.status(500).send("Error get user histories: " + err.message);
  }
};

module.exports.handleRedirectShortenedLink = async (req, res) => {
  try {
    const { shortId } = req.params;
    const urlData = await Url.findOne({ shortId: shortId });

    if (!urlData) {
      return res.status(404).send("Shortened link not found.");
    }

    const userAgent = req.headers["user-agent"] || "";
    const isSocialMediaCrawler = /facebookexternalhit|Twitterbot|Slackbot/.test(userAgent);

    if (isSocialMediaCrawler) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta property="og:title" content="${urlData.title || 'No Title'}" />
            <meta property="og:description" content="${urlData.description || 'No Description'}" />
            <meta property="og:image" content="${urlData.thumbnail || 'default-thumbnail.jpg'}" />
            <meta property="og:url" content="${req.headers.host}/${urlData.shortId}" />
            <meta property="og:type" content="website" />
            <title>${urlData.title || 'No Title'}</title>
          </head>
          <body>
            <h1>${urlData.title || 'No Title'}</h1>
            <p>${urlData.description || 'No Description'}</p>
            <img src="${urlData.thumbnail || 'default-thumbnail.jpg'}" alt="Thumbnail" />
          </body>
        </html>
      `);
    } else {
      const userIP = getClientIP(req);
      const locationData = await callApiWithRetry(`https://get.geojs.io/v1/ip/geo/${userIP}.json`, "GET", null, 3, 2000);
      const hasVisited = urlData.visits.some(visit => visit.ip === userIP);
      const timeLimit = 5 * 60 * 1000;

      if (!hasVisited) {
        urlData.visits.push({
          ip: userIP,
          location: locationData,
          timestamp: new Date()
        });
        await urlData.save();
      } else {
        const lastVisit = urlData.visits.find(visit => visit.ip === userIP);
        const timeSinceLastVisit = new Date() - new Date(lastVisit.timestamp);

        if (timeSinceLastVisit > timeLimit) {
          urlData.visits.push({
            ip: userIP,
            location: locationData,
            timestamp: new Date()
          });
          await urlData.save();
        }
      }
      res.redirect(urlData.originalUrl);
    }
  } catch (err) {
    res.status(500).send("Error processing shortened link: " + err.message);
  }
};