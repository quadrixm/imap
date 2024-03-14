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

function openInbox(cb) {
  imap.openBox('INBOX', false, cb);
}

imap.once('ready', function() {
  openInbox(function(err, box) {
    if (err) throw err;
    imap.search(['UNSEEN'], function(err, results) {
      if (err || !results.length) {
        imap.end();
        return;
      }
      
      const fetchOptions = {
        bodies: '',
        markSeen: true
      };

      const f = imap.fetch(results, fetchOptions);
      f.on('message', function(msg, seqno) {
        msg.on('body', function(stream, info) {
          simpleParser(stream, (err, mail) => {
            console.log(mail.subject);
            console.log(mail.text);
          });
        });
      });
      f.once('error', function(err) {
        console.log('Fetch error: ' + err);
      });
      f.once('end', function() {
        console.log('Done fetching all messages!');
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
