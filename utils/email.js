/* eslint-disable import/no-extraneous-dependencies */
const nodemailer = require("nodemailer");
const htmlToText = require("html-to-text");

module.exports = class Email {
  constructor(user, url) {
    this.from = process.env.EMAIL_FROM;
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
  }
  newTransport() {
    if (process.env.NODE_ENV === "production") {
      //create a transporter for SENDGRID
      return nodemailer.createTransport({
        service: "SendGrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    //otherwise return a nodemailer->mailtrap transporter
    return nodemailer.createTransport({
      // service: 'Gmail',
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      // for gmail, activate in gmail "less secure app" option
    });
  }
  async send(template, subject) {
    //send the actual email
    // 1) render the HTML for the email based on Pug template
    // const html = pug.renderFile(
    //   `${__dirname}/../views/emails/${template}.pug`,
    //   {
    //     firstName: this.firstName,
    //     url: this.url,
    //     subject,
    //   }
    // );
    console.log("TEST TEST TEST", template, subject);
    const html =
      template === "passwordReset"
        ? `<span>${this.url}</span>`
        : "<span>welcome</span>";

    // 2) define the email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text: htmlToText.htmlToText(html),
    };

    // 3) create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }
  async sendWelcome() {
    await this.send("welcome", "Welcome to imgsuch!");
  }
  async sendPasswordReset() {
    await this.send("passwordReset", "Reset your password");
  }
};
