const express = require('express');
const db = require('../../db/index.js');

const app = express();
const PORT = 3000;
app..listen(port, () => {
  console.log(`API server listening on port ${port}`);
});

app.use(express.static()); //??? client root
app.use(express.json());
app.use(express.urlencoded({extended:true}));

//routes
app.get('/qa/questions', (req, res) => {
  db.getQandA((err, data) => {
    if (err) {
      console.error('Error retrieving question & answer data');
      res.sendStatus(404);
    } else {
      //format data as client expects it (answers go in questions)
    }
  });
});

app.post('/qa/questions', (req, res) => {
  db.postQuestion(req.body, (err, result) => {
    if (err) {
      console.error('Failed to write question to database');
    } else {
      res.sendStatus(200);
    }
  });
});

app.post('/qa/questions/:question_id/answers', (req, res) => {
  db.postAnswer(req.body, (err, result) => {
    if (err) {
      console.log('Failed to write answer to database');
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});

app.put('/qa/questions/:question_id/helpful', (req, res) => {

});

app.put('/qa/answers/:answer_id/helpful', (req, res) => {

});

app.put('/qa/answers/:answer_id/report', (req, res) => {

});