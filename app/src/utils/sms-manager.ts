//AccountSID and Auth Token from console.twilio.com
import twilio from "twilio";
import dayjs from 'dayjs';


const accountSid = process.env.SMS_SID;
const authToken = process.env.SMS_TOKEN;
const client = twilio(accountSid, authToken);

export const sendSMS = async function (phone: string, message: string) {
  return new Promise(async (resolve, reject) => {
    try {
      client.messages
        .create({
          body: message,
          to: phone,
          from: process.env.TWILIO_NUMBER,
        })
        .then((data) => resolve(data))
        .catch((error) => {
          let error_data = { date: dayjs().format("DD/MM/YYYY HH:mm"), receiver: phone, data: message, error: error }
          fs.appendFile('./logs/sms-logs.txt', JSON.stringify(error_data) + "\n", (error: any) => { if (error) console.log(error); });
          reject(error);
        });
    }
    catch (error) {
      console.log(error);
      reject(false);
    }
  })
};