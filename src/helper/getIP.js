module.exports.getClientIP = (req) => {
  let ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress || req.ip;

  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }

  if (ip.includes("::ffff:")) {
    ip = ip.split("::ffff:")[1];
  }

  if (ip === "::1") {
    ip = "127.0.0.1";
  }

  return ip;
};
