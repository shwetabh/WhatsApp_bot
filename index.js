const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const { Configuration, OpenAIApi } = require("openai");
require("dotenv").config();

//for badword filteration
const badwordsArray = require("badwords/array");

// const client = new Client();
const client = new Client({
  authStrategy: new LocalAuth(),
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on("ready", () => {
  console.log("You are ready to go");
});

client.initialize();

const configuration = new Configuration({
  apiKey: process.env.SECRET_KEY,
});
const openai = new OpenAIApi(configuration);

async function runCompletion(message) {
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: message,
    max_tokens: 1000,
  });
  return completion.data.choices[0].text;
}
const check = (reply) => {
  //Cheking for extra spaces using trim
  ((reply) => {
    if (reply.trim() === "" && reply.trim() === " ") {
      return false;
    }
  })(reply);
  //Checking if message contains any bad words:
  ((reply) => {
    reply = String(reply);
    badwordsArray.forEach((badWord, i, arr) => {
      if (reply.includes(badWord)) {
        console.log(`BadWord = ${badWord}, Reply = ${reply}`);
        return false;
      } else return true;
    });
  })(reply);
  //reply.length>400 (not sent)
  ((reply) => {
    console.log("length = ", reply.trim().length);
    reply.trim().length > 400 ? false : true;
  })(reply);
};
client.on("message", (message) => {
  runCompletion(message.body).then((reply) => {
    //Checking for all kind of mistakes before reply
    if (check(reply)) {
      console.log("EMPTY orHas BADWORDS");
      console.log(reply.trim() + "____its the reply and so not sent");
    } else {
      message.reply(`${reply.trim()}\nAutomated reply from ChatBot`);
      console.log("SENT= ", reply.trim());
    }
  });
});
