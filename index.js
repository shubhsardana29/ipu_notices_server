const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');

const notices = [];

function _scrapNoticeTr(tr) {
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

function onlyNewNoticeTr(_, el) {
  return !el.attribs.id && !el.attribs.style;
}

function checkCollege(title) {
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

function fetchNotices() {
  axios.get('http://www.ipu.ac.in/notices.php')
    .then(response => {
      const html = response.data;
      const $ = cheerio.load(html);

      $('tbody').find('tr').filter(onlyNewNoticeTr).each((_, tr) => {
        const notice = _scrapNoticeTr($(tr));
        if (notice) {
          notices.push(notice);
        }
      });

      console.log('Fetched Notices');
      console.log('Notices:', notices); // Add this console.log statement
    })
    .catch(error => {
      console.log('Error:', error.message);
    });
}

// Fetch notices initially
fetchNotices();

// Schedule fetching notices every 20 seconds
setInterval(fetchNotices, 20000);

app.get('/', (req, res) => {
  res.send('Welcome, Services are running! Latest Notices -> ' + JSON.stringify(notices));
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});