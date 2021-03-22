//cont postgres = require('postgres');
const postgres = require('pg');
const connection = new postgres.Client({
  user: 'postgres',
  password: 'root',
  database: 'qanda'
});

connection.connect()
  .then(()=>{console.log('Postgres connection successful...');})
  .catch((err)=>{console.log('Connection error: ', err);})

const getQandA = (product, cb) => {
  //query for questions, query for answers
  const quesQuery = `SELECT * FROM questions WHERE product_id = ${product}`;
  connection.query(quesQuery, (err, res) => {
    if (err) {
      cb(err, null);
    } else {
      let questions = res;
      //FIX THE BELOW
      const ansQuery = 'SELECT * FROM answers'; //how do i filter for question IDs?? -> JOINS????
      connection.query(ansQuery, (error, result) => {
        if (error) {
          cb(error, null);
        } else {
          let answers = result;
          cb(null, {questions: questions, answers: answers});
        }
      });
    }
  })
};

const postQuestion = (question, cb) => {
  // question === {name, body, email, product_id}
  const query = `INSERT INTO questions (product_id, question_body, asker_name, question_helpfulness)
  VALUES (${question.product_id}, ${question.body}, ${question.name}, 0)`;
  connection.query(query, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null);
    }
  });
};

const postAnswer = (answer, question, cb) => {
  // answer === {name, body, email}
  const query = `INSERT INTO answers (question_id, answer_body, answerer_name, helpfulness)
  VALUES (${question}, ${answer.body}, ${answer.name}, 0)`;
  connection.query(query, (err, res) => {
    if (err) {
      cb(err);
    } else {
      cb(null);
    }
  });
};

const upvoteQuestion = (id, cb) => {
  const getHelp = `SELECT question_helpfulness FROM questions WHERE question_id = ${id}`;
  connection.query(getHelp, (error, data) => {
    if (error) {
      console.error(`Error fetching helpfulness value for question ${id}. Error: `, error);
      cb(err);
    } else {
      console.log('Current helpfulness: ', data);
      data++;
      const setHelp = `UPDATE questions SET question_helpfulness = ${data} WHERE question_id = ${id}`;
      connection.query(setHelp, (err, res) => {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      })
    }
  })
}

const upvoteAnswer = (id, cb) => {
  const getHelp = `SELECT answer_helpfulness FROM answers WHERE answer_id = ${id}`;
  connection.query(getHelp, (error, data) => {
    if (error) {
      console.error(`Error fetching helpfulness value for answer ${id}. Error: `, error);
      cb(err);
    } else {
      console.log('Current helpfulness: ', data);
      data++;
      const setHelp = `UPDATE answers SET answer_helpfulness = ${data} WHERE answer_id = ${id}`;
      connection.query(setHelp, (err, res) => {
        if (err) {
          cb(err);
        } else {
          cb(null);
        }
      })
    }
  })
}

const reportAnswer = (id, cb) => {
  const getAnswer = `SELECT * FROM answers WHERE answer_id = ${id}`;
  connection.query(getAnswer, (error, data) => {
    if (err) {
      cb(error);
    } else {
      console.log('fetched answer ', data);
      //insert into 'reportedanswers'
      const addReported = ``; //LOOK AT DATA && WRITE ME!!!
      connection.query(addReported, (err, res) => {
        if (err) {
          cb(err);
        } else {
          const removeAnswer = `DELETE FROM answers WHERE answer_id = ${id}`;
          connection.query(removeAnswer, (failure, success) => {
            if (failure) {
              cb(failure);
            } else {
              cb(null);
            }
          });
        }
      });
      //delete from 'answers'
    }
  });
}

module.exports = {
  getQandA,
  postQuestion,
  postAnswer,
  upvoteQuestion,
  upvoteAnswer,
  reportAnswer
}