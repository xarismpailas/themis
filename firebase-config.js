// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCs2bDbKgixgRsUmNAe0MXhXNZuQokRC5A",
  authDomain: "themis-a6199.firebaseapp.com",
  databaseURL: "https://themis-a6199-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "themis-a6199",
  storageBucket: "themis-a6199.firebasestorage.app",
  messagingSenderId: "253291850829",
  appId: "1:253291850829:web:ae67309c722c89ab788004",
  measurementId: "G-MSQPR5DR32"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Function to save score to Firebase
function saveScore(playerName, score) {
  const timestamp = Date.now();
  return database.ref('scores').push({
    playerName,
    score,
    timestamp
  });
}

// Function to get top scores
function getTopScores(callback) {
  database.ref('scores')
    .orderByChild('score')
    .limitToLast(10)
    .on('value', (snapshot) => {
      const scores = [];
      snapshot.forEach((childSnapshot) => {
        scores.push(childSnapshot.val());
      });
      scores.reverse(); // Reverse to get highest scores first
      callback(scores);
    });
} 