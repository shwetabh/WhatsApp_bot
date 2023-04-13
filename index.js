"use strict";

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

/* Function sending messages to chatGPT and returning repy */
async function runCompletion(message) {
  const completion = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: message,
    max_tokens: 1000,
  });
  return completion.data.choices[0].text;
}
/* Function Checking for all mistakes in reply */
const check = (reply) => {
  const performCheck = {
    //Checking reply for bad words
    badWordCheck: (reply) => {
      reply = String(reply);
      const trialWork = [];
      badwordsArray.forEach((badWord, i, arr) => {
        if (reply.includes(badWord)) {
          console.log(`BadWord = ${badWord}, Reply = ${reply}`);
          trialWork.push(false);
        } else {
          trialWork.push(true);
        }
      });
      const badWordCheckResult = trialWork.reduce(
        (accumulator, booleanValue) => accumulator && booleanValue,
        true
      );
      console.log(`badWordCheckResult = ${badWordCheckResult}`);
      return badWordCheckResult;
    },

    //Checking reply length
    lengthCheck: (reply) => {
      console.log("length = ", reply.trim().length);
      return reply.trim().length > 400 ? false : true;
    },

    //Checking for empty reply
    emptyReplyCheck: (reply) => {
      if (reply.trim().length === 0) {
        console.log("Length = 0", reply.trim().length);
        return false;
      } else return true;
    },
  };

  console.log(
    "my reply",
    performCheck.badWordCheck(reply) &&
      performCheck.lengthCheck(reply) &&
      performCheck.emptyReplyCheck(reply)
  );
  return (
    performCheck.badWordCheck(reply) &&
    performCheck.lengthCheck(reply) &&
    performCheck.emptyReplyCheck(reply)
  );
};

client.on("message", (message) => {
  runCompletion(message.body).then((reply) => {
    //Checking for all kind of mistakes before reply
    if (check(reply)) {
      console.log(reply.trim() + "__reply from true");
      console.log("----------------------------");
    } else if (!check(reply)) {
      console.log("it is false");
      console.log("----------------------------");
    } else {
      console.log(
        "Their might be some bugs as the check(reply) may be returned a undefined"
      );
      console.log("Reply = ", reply.trim());
      console.log("----------------------------");
    }
  });
});

// Bugs that needs to be fixed
/* 1. reply containing classes won't be send as it is being takes as a bad word because classes includes 'ass' */
