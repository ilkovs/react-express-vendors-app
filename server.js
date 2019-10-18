const express = require('express');
const app = express();
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const cors = require('cors');
const Slack = require('slack-node');
const nodemailer = require('nodemailer');
const Nexmo = require('nexmo');
const port = 5000;
require('dotenv').config();

app.get("/statuses", cors(), (req, res) => {

    const URL = "https://status.atlassian.com/";
    puppeteer
        .launch()
        .then(browser => browser.newPage())
        .then(page => {
            return page.goto(URL, { "waitUntil": "networkidle0" }).then(() => {
                return page.content();
            });
        })
        .then(html => {
            const $ = cheerio.load(html);
            const statusInfo = [];

            $('.page-statuses-container .status-info').each(function () {
                statusInfo.push({
                    title: $(this).children(':first-child').text(),
                    status: $(this).children(':last-child').text(),
                    logo: $(this).prev().children().attr('src')
                });

            });

            Array.from(statusInfo).map(singleVendor => {
                // console.log('SINGLE VENDOR :' + singleVendor.status)
                if (singleVendor.status === 'Active Incident') {

                    /// NodeMailer Emailing
                    async function main() {
                        let transporter = nodemailer.createTransport({
                            host: 'outlook.office365.com',
                            port: 587,
                            auth: {
                                user: process.env.NODEMAILER_USERNAME,
                                pass: process.env.NODEMAILER_PASSWORD
                            }
                        });

                        let info = await transporter.sendMail({
                            from: '"Sam Ilkov" <samuil.ilkov@ajc.com>',
                            to: '"AJC", <samuil.ilkov@ajc.com>',
                            subject: 'Vendor Status',
                            text: `${singleVendor.title} has an active incident!`,
                            html: `<h2>${singleVendor.title} has an active incident!</h2>`
                        });

                        console.log('Message sent: %s', info.messageId);

                    }

                    main().catch(console.error);

                    /// Slack Bot Notifications
                    webhookUri = process.env.SLACK_WEBHOOK;
                    slack = new Slack();
                    slack.setWebhook(webhookUri);

                    slack.webhook({
                        channel: "#vendor-status",
                        username: "vendor-status-bot",
                        text: `Slack Bot Report: ${singleVendor.title} has an active incident!`
                    }, function (err, response) {
                        console.log(response);
                    });

                    /// Nexmo SMS service
                    const nexmo = new Nexmo({
                        apiKey: process.env.NEXMO_KEY,
                        apiSecret: process.env.NEXMO_SECRET,
                    });

                    const from = '17403040096';
                    const to = '14048600162';
                    const text = `${singleVendor.title} has an active incident!`;

                    nexmo.message.sendSms(from, to, text);
                }

            })
            // console.log('Status Info :' + statusInfo);
            res.send(statusInfo);
        })
        .catch(err => {
            console.log(err)
        });
})

app.listen(port, () => { console.log(`Server is running on port ${port}`) });
