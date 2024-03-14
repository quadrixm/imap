const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

const imapConfig = {
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASS,
  host: process.env.IMAP_HOST,
  port: process.env.IMAP_PORT,
  tls: true
};

const imap = new Imap(imapConfig);


function extractNewMessageContent(emailBody) {
  // Pattern to detect the start of the quoted text in the email
  const quotedTextPattern = /\nOn.*wrote:/;

  // Find the index where the quoted message starts
  const quotedTextIndex = emailBody.search(quotedTextPattern);

  // If the pattern is found, extract the text before it as the new message content
  if (quotedTextIndex !== -1) {
    return emailBody.substring(0, quotedTextIndex).trim();
  }

  // If no quoted text is detected, return the whole message
  return emailBody.trim();
}

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

imap.once('ready', function() {
  openInbox(function(err) {
    if (err) throw err;
    const criteria = [
      ['FROM', 'quadrixm@gmail.com']
      /* ['HEADER', 'In-Reply-To', 'mohammad@trackflowbot.com'] */
    ];
    imap.search(criteria, function(err, results) {
      if (err) throw err;
      if (!results.length) {
        console.log('No replied emails found.');
        imap.end();
        return;
      }
      const f = imap.fetch(results, { bodies: '' });
      f.on('message', function(msg) {
        msg.on('body', function(stream) {
          simpleParser(stream, (err, mail) => {
            // Process each mail, for example, log the subject and text
            // console.log({mail});
            // console.log('Subject:', mail.subject);
            // console.log('Body:', extractNewMessageContent(mail.text));
            // Here you'd filter out or process the reply content as needed
            if (mail.references) {
              console.log('References:', mail.references);
            }
            if (mail.inReplyTo) {
              console.log('In-Reply-To:', mail.inReplyTo);
            }
            console.log('----------------------------------------------');
            console.log('----------------------------------------------');
          });
        });
      });
      f.once('end', function() {
        imap.end();
      });
    });
  });
});

imap.once('error', function(err) {
  console.log(err);
});

imap.once('end', function() {
  console.log('Connection ended');
});

imap.connect();
