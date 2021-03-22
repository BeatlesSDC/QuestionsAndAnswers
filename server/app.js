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
  db.getQandA(req.params.product_id, (err, data) => {
    if (err) {
      console.error('Error retrieving question & answer data. Error: ', err);
      res.sendStatus(404);
    } else {
      console.log('Successfully fetched question & answer data');
      //data === {questions: query-results, answers: query-results}
      //iterate thru & format data as client expects it (answers go in questions, reported = false)
        //iterate data.answers, create a 'qIDs' obj w question_id keys & push answers to array
          //also give each answer a 'reported: false' attr
        //iterate data.questions & create an 'answers' attr in each, assigning it a value of qIDs[question_id]
          //also give each question a 'reported: false' attr
    }
  });
});

app.post('/qa/questions', (req, res) => {
  db.postQuestion(req.body, (err, result) => {
    if (err) {
      console.error('Failed to write question to database. Error: ', err);
    } else {
      console.log('Successfully posted question');
      res.sendStatus(200);
    }
  });
});

app.post('/qa/questions/:question_id/answers', (req, res) => {
  db.postAnswer(req.body, req.params.question_id, (err) => {
    if (err) {
      console.log('Failed to write answer to database. Error: ', err);
      res.sendStatus(400);
    } else {
      console.log('Successfully posted answer');
      res.sendStatus(200);
    }
  });
});

app.put('/qa/questions/:question_id/helpful', (req, res) => {
  db.upvoteQuestion(req.params.question_id, (err) => {
    if (err) {
      console.error(`Failed to update question #${req.params.question_id}'s helpfulness. Error: `, err);
      res.sendStatus(400);
    } else {
      console.log('Successfully updated question helpfulness');
      res.sendStatus(200);
    }
  });
});

app.put('/qa/answers/:answer_id/helpful', (req, res) => {
  db.upvoteAnswer(req.params.answer_id, (err, result) => {
    if (err) {
      console.error(`Failed to update answer #${req.params.answer_id}'s helpfulness. Error: `, err);
      res.sendStatus(400);
    } else {
      console.log('Successfully updated answer helpfulness');
      res.sendStatus(200);
    }
  })
});

app.put('/qa/answers/:answer_id/report', (req, res) => {
  db.reportAnswer(req.params.answer_id, (err, result) => {
    if (err) {
      console.error(`Failed to report answer #${req.params.answer_id}. Error: `, err);
      res.sendStatus(400);
    } else {
      console.log('Successfully reported answer');
      res.sendStatus(200);
    }
  });
});