const express = require('express');
const db = require('../db/index.js');

const app = express();
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));

//routes
app.get('/qa/questions', (req, res) => {
  console.log('In API get route');
  db.connect(db.getQandA, req.query.product_id, (err, data) => {
    db.disconnect();
    if (err) {
      console.error('Error retrieving question & answer data. Error: ', err);
      res.sendStatus(404);
    } else {
      console.log('Successfully fetched question & answer data');
      console.log('answers data fetched: ', data.answers);
      //data === {questions: query-results, answers: query-results}
      //data.questions & data.answers are each [{}]

      var photos = {}
      for(let i = 0; i < data.photos.length; i++){
        let photo = data.photos[i];
        if(!photos[photo.answer_id]){
          photos[photo.answer_id] = [];
        }
        photos[photo.answer_id].push(data.photos.url);
      }

      //Client wants: {product_id: product_id, results: array of questions w/ answers {{}} inside}

      var answers = {}; //{question_id: {answer{data}, answer{data}}, question_id: {answer{data}}, etc}
      for(let i = 0; i < data.answers.length; i++) {
        let answer = data.answers[i];
        if(!answers[answer.question_id]){
          answers[answer.question_id] = {}
        }
        answers[answer.question_id][answer.answer_id] = {
          answerer_name: answer.answerer_name,
          body: answer.answer_body,
          date: answer.answer_date,
          helpfulness: answer.answer_helpfulness,
          id: answer.answer_id,
          reported: false,
          photos: photos[answer.answer_id] //fix me
        }
      }
      var results = [];
      for(let i = 0; i < data.questions.length; i++) {
        var question = data.questions[i];
        let data = {
          answers: answers[question.question_id], //fix me
          asker_name: question.asker_name,
          question_body: question.question_body,
          question_date: question.question_date,
          question_helpfulness: question.question_helpfulness,
          question_id: question.question_id,
          reported: false
        };
        results.push(data);
      }
      //iterate thru & format data as client expects it (answers go in questions, reported = false)
        //iterate data.answers, create a 'qIDs' obj w question_id keys & push answers to array
          //also give each answer a 'reported: false' attr
        //iterate data.questions & create an 'answers' attr in each, assigning it a value of qIDs[question_id]
          //also give each question a 'reported: false' attr
      res.writeHead(200);
      //res.write(REFORMATTED DATA); //FIX ME!
      res.write();
      res.end();
    }
  });
});

app.post('/qa/questions', (req, res) => {
  db.postQuestion(req.body, (err) => {
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
  db.upvoteAnswer(req.params.answer_id, (err) => {
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
  db.reportAnswer(req.params.answer_id, (err) => {
    if (err) {
      console.error(`Failed to report answer #${req.params.answer_id}. Error: `, err);
      res.sendStatus(400);
    } else {
      console.log('Successfully reported answer');
      res.sendStatus(200);
    }
  });
});