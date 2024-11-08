const express = require("express");
const morgan = require("morgan");
const path = require("path");
const methodOverride = require("method-override");
const cookieParser = require("cookie-parser");
const cors = require("cors");
require("dotenv").config();
const mongodb = require("../config/index");
const routes = require("./api/v1/routes/index.route");
const app = express();
const port = process.env.PORT;
const allowedOrigins = [process.env.CLIENT_URL];
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "x-forwarded-for"],
};

mongodb.connect();
app.set("trust proxy", true);
app.use(morgan("combined"));
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(methodOverride("_method"));
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

routes(app);

app.listen(port, () => {
  console.log(`Secure server is running on port ${port}`);
});