const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// Load your service account key
let serviceAccount = require("./ggsipunotices-firebase-adminsdk-tevkc-0d3083f09f.json");

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

var db = admin.firestore();

async function _scrapNoticeTr(tr) {
  const tds = tr.find('td');
  if (tds.length !== 2) {
    return null;
  }

  const noticeA = tds.eq(0).find('a');
  if (noticeA.length === 0) {
    return null;
  }

  const noticeTxt = noticeA.text().trim();
  const dwdUrl = noticeA.attr('href');
  if (!dwdUrl || !noticeTxt) {
    return null;
  }

  const noticeDate = tds.eq(1).text().trim();
  if (!noticeDate) {
    return null;
  }

  const title = noticeTxt.split(' ').join(' ');
  const encodedUrl = encodeURIComponent(dwdUrl.trim());

  return { date: noticeDate, title, url: encodedUrl };
}

function checkCollege(title) {
  if (!title) {
    return '';
  }

  const colleges = [
    'usict', 'usit', 'usct', 'usms', 'uslls',
    'usbt', 'usmc', 'usap', 'msit', 'usar',
    'usdi', 'bvce', 'gtbit'
  ];

  for (const college of colleges) {
    if (title.toLowerCase().includes(college)) {
      return college;
    }
  }

  return '';
}

function checkTags(title) {
  if (!title) {
    return [];
  }

  const tags = new Set();
  const checks = [
    'ph.d', 'b.tech', 'b.sc', 'm.sc', 'm.tech',
    'cet', 'theory', 'result', 'merit', 'scholar',
    'research', 'revised', 'annual', 'practical',
    'hackathon', 'counselling', 'date', 'datesheet',
    'final', 'exam', 'examination', 'time', 'last',
    'calendar', 'schedule', 'proposed'
  ];

  for (const check of checks) {
    if (title.toLowerCase().includes(check)) {
      tags.add(check);
    }
  }

  return Array.from(tags);
}

function onlyNewNoticeTr(_, el) {
  return !el.attribs.id && !el.attribs.style;
}

async function storeNotice(notice) {
  try {
    const docRef = await db.collection('notices').add(notice);
    console.log(`Notice stored with ID: ${docRef.id}`);
  } catch (error) {
    console.error("Error adding document: ", error);
  };
}

async function fetchNotices() {
  try {
    const response = await axios.get('http://www.ipu.ac.in/notices.php');
    const html = response.data;
    const $ = cheerio.load(html);
    const notices = [];
    $('tbody').find('tr').filter(onlyNewNoticeTr).each((_, tr) => {
      const notice = _scrapNoticeTr($(tr));
      if (notice && notice.title) {
        notice.college = checkCollege(notice.title);
        notice.tags = checkTags(notice.title);
        notices.push(notice);
        storeNotice(notice);
      }
    });
    console.log('Fetched Notices');
    console.log('Notices:', notices); 
  } catch (error) {
    console.log('Error:', error.message);
  };
}

// Fetch notices initially
fetchNotices();

// Schedule fetching notices every 20 seconds
setInterval(fetchNotices, 20000);

app.get('/', async (req, res) => {
  try {
    const snapshot = await db.collection('notices').get();
    const fetchedNotices = [];
    snapshot.forEach(doc => {
      fetchedNotices.push(doc.data());
    });
    res.send('Welcome, Services are running! Latest Notices -> ' + JSON.stringify(fetchedNotices));
  } catch (error) {
    console.log('Error getting documents: ', error);
  };
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
