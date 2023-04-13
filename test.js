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
  (() => {
    //Checking if message contains any bad words:
    ((reply) => {
      reply = String(reply);
      badwordsArray.forEach((badWord, i, arr) => {
        if (reply.includes(badWord)) {
          console.log(`BadWord = ${badWord}, Reply = ${reply}`);
          return false;
        } else {
          console.log("no bad word");
          return true;
        }
      });
    })(reply);
    //reply.length>400 (not sent)
    ((reply) => {
      console.log("length = ", reply.trim().length);
      reply.trim().length > 400 ? false : true;
    })(reply);

    //replacing the method to check empty reply
    ((reply) => {
      if (reply.trim().length === 0) {
        console.log("Length = 0", reply.trim().length);
        return false;
      } else return true;
    })(reply);
  })();
};

client.on("message", (message) => {
  runCompletion(message.body).then((reply) => {
    //Checking for all kind of mistakes before reply
    if (check(reply)) {
      console.log("Condition from sove of the function might be true.");
      console.log(reply.trim() + "____its the reply and so not sent");

      //running the reply process incase if any unwanted condition is true from the check(reply) function.
      runCompletion(message.body);
      console.log("----------------------------");
    } else {
      console.log("check(reply) =", check(reply));
      message.reply(`${reply.trim()}\nAutomated reply from ChatBot`);
      console.log("SENT= ", reply.trim());
      console.log("----------------------------");
    }
  });
});

// Bugs that needs to be fixed
/* 1. reply containing classes won't be send as it is being takes as a bad word because classes includes 'ass' 
2. Find a way to tacke multiple return statements by check(reply) method. Here, all objects are returning their d/f replies */
