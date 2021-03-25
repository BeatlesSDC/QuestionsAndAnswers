//cont postgres = require('postgres');
const postgres = require('pg');
const connection = new postgres.Client({
  user: 'postgres',
  password: 'root',
  database: 'qanda'
});

// connection.connect()
//   .then(()=>{console.log('Postgres connection successful...');})
//   .then(connection.end())
//   .catch((err)=>{console.log('Connection error: ', err);})

const connect = (queryCB, params, resultCB) => {
  console.log('Connecting...')
  connection.connect()
  .then(()=>{console.log('Postgres connection successful...');})
  .then(() => {
    console.log('params:', params);
    queryCB(params, resultCB);
  })
  .catch((err)=>{console.error('Connection error: ', err);})
}

const disconnect = () => {
  connection.end(err => {
    if (err) {
      console.error('Could not disconnect from database...', err);
    } else {
      console.log('Disconnected from database');
    }
  });
}

const getQandA = (product, cb) => {
  //query for questions, query for answers
  const quesQuery = `SELECT * FROM questions WHERE product_id = ${product}`;
  console.log('product:', product);
  console.log('querying db for questions data...');
  connection.query(quesQuery, (err, res) => {
    if (err) {
      console.log('errored');
      cb(err, null);
    } else {
      console.log('querying db for answers data...');
      //FIX THE BELOW
      //const ansQuery = `SELECT answers.answer_id, answers.question_id, answers.answer_body, answers.answer_date, answers.answerer_name, answers.answer_helpfulness FROM answers JOIN questions ON answers.question_id = questions.question_id;`;
      console.log('ques:', res.rows);
      const ansQuery = `SELECT * FROM answers WHERE question_id IN (SELECT question_id FROM questions WHERE product_id = ${product});`;
      const dummyQuery = `SELECT * FROM answers WHERE question_id = 69640;`;
      // const ansQuery = `SELECT * FROM answers WHERE question_id IN (SELECT question_id FROM ${res.rows})`;
      // const ansQuery = `SELECT * FROM answers WHERE question_id IN (${res.rows[0].question_id}, ${res.rows[1].question_id})`;
      connection.query(dummyQuery, (error, result) => {
        if (error) {
          cb(error, null);
        } else {
          cb(null, {questions: res.rows, answers: result.rows});
        }
      });
    }
  })
};

const postQuestion = (question, cb) => {
  // question === {name, body, email, product_id}
  const query = `INSERT INTO questions (product_id, question_body, asker_name, question_helpfulness)
  VALUES (${question.product_id}, ${question.body}, ${question.name}, 0)`;
  connection.query(query, (err) => {
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
  connection.query(query, (err) => {
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
      //insert into 'reportedanswers', then delete from 'answers'
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
    }
  });
}

module.exports = {
  connect,
  disconnect,
  getQandA,
  postQuestion,
  postAnswer,
  upvoteQuestion,
  upvoteAnswer,
  reportAnswer
}