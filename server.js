const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const twilio = require("twilio");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const accountSid = "YOUR_TWILIO_ACCOUNT_SID";
const authToken = "YOUR_TWILIO_AUTH_TOKEN";
const client = twilio(accountSid, authToken);

// Backend check route
app.get("/", (req, res) => {
  res.send("Backend Connected ✅");
});

// SMS sending route
app.post("/send-sms", (req, res) => {
  const { to, message } = req.body;
  client.messages
    .create({
      body: message,
      from: "YOUR_TWILIO_PHONE_NUMBER",
      to: to,
    })
    .then(() => res.send("SMS sent successfully!"))
    .catch((err) => res.status(500).send("Error: " + err.message));
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
