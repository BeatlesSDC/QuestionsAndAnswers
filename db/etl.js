const postgres = require('pg');
const connection = new postgres.Client({
  user: 'postgres',
  password: 'root',
  database: 'qanda'
});

connection.connect()
.then(()=>{console.log('Postgres connection successful...');})
.then(()=>{
  // importData(formatQuestions);
  formatQuestions(formatAnswers);
})
.catch((err)=>{console.log('Connection error: ', err);})

const importData = function(cb){
  //let path = '/private/tmp/data/csv/';
  console.log('copying csv data......');
  let ansQuery = `
    COPY importanswers(id, question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
    FROM '/private/tmp/data/csv/answers.csv'
    DELIMITER ','
    CSV HEADER`;
  let quesQuery = `
    COPY importquestions (id, product_id, body, date_written, asker_name, asker_email, reported, helpful)
    FROM '/private/tmp/data/csv/questions.csv'
    DELIMITER ','
    CSV HEADER`;
  let photoQuery = `
    COPY importphotos (id, answer_id, url)
    FROM '/private/tmp/data/csv/answers_photos.csv'
    DELIMITER ','
    CSV HEADER`;
  connection.query(ansQuery, (err, res) => {
    if (err) {
      console.error('Error importing answers data: ', err);
    } else {
      console.log('Success copying answers');
      connection.query(quesQuery, (err, res) => {
        if (err) {
          console.error('Error importing questions data: ', err);
        } else {
          connection.query(photoQuery, (err, res) => {
            if (err) {
              console.error('Error importing photos data: ', err);
            } else {
              console.log('All data successfully imported');
              cb(formatQuestions);
            }
          })
        }
      });
    }
  });
}

const formatQuestions = function(cb){
  const quesQuery = `
    INSERT INTO questions
    SELECT
    FROM importquestions
    WHERE reported = false
    ORDER BY product_id
  `;
  const reportedQues = `
    INSERT INTO questions
    SELECT
    FROM importquestions
    WHERE reported = true
    ORDER BY product_id
  `;
  connection.query(quesQuery, (err, res) => {
    if (err) {
      console.error('Error formatting questions: ', err);
    } else {
      console.log('Successful transfer to questions db');
      connection.query(reportedQues, (error, result) => {
        if (err) {
          console.error('Error formatting reported questions: ', error);
        } else {
          console.log('All questions data successfully transformed');
          cb(formatPhotos);
        }
      });
    }
  });
};

const formatAnswers = function(cb){
  console.log('copying imported data...');
  const ansQuery = `
    INSERT INTO answers
    SELECT id, question_id, body, date_written, answerer_name, helpful
    FROM importanswers
    WHERE reported = false
    ORDER BY question_id
  `;
  const reportedAns = `
    INSERT INTO answers
    SELECT id, question_id, body, date_written, answerer_name, helpful
    FROM importanswers
    WHERE reported = true
    ORDER BY question_id
  `;
  connection.query(ansQuery, (err, res) => {
    if (err) {
      console.error('error transfering answers data: ', err);
    } else {
      console.log('successful transfer into answers db');
      connection.query(reportedAns, (error, result) => {
        if (error) {
          console.error('error transfering reported answers data: ', error)
        } else {
          console.log('All answers data successfully transformed')
          cb();
        }
      });
    }
  });
}

const formatPhotos = function(){
  const photoQuery = `
    INSERT INTO photos
    SELECT * FROM importphotos
    ORDER BY answer_id
  `;
  connection.query(photoQuery, (err, res) => {
    if (err) {
      console.error('Error transfering photos data: ', err);
    } else {
      console.log('Successful transfer of photos data');
      console.log('All data transformation complete');
    }
  });
}