const admin = require('firebase-admin');

// Initialize the Firebase Admin SDK with your service account credentials
const serviceAccount = require('./ggsipunotices-firebase-adminsdk-tevkc-0d3083f09f.json'); // Replace with the path to your service account key file
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://ggsipunotices-default-rtdb.asia-southeast1.firebasedatabase.app/' // Replace with your Firebase project's database URL
});

// Get a reference to the Firebase Realtime Database
const db = admin.database();
const noticesRef = db.ref('notices');

// Listen for child_added events on the 'notices' reference
noticesRef.on('child_added', (snapshot) => {
  // A new notice has been added
  const notice = snapshot.val();
  console.log('New Notice:', notice);
  // Perform any necessary actions with the new notice
});

// Start listening for changes
console.log('Listening for changes in the Firebase Realtime Database...');
