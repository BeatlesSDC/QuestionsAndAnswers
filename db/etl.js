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
  //formatQuestions(formatAnswers);
  console.log('No transformations specified');
})
.catch((err)=>{console.log('Connection error: ', err);})

const fixedTransformations = function(cb){
  let query = `SELECT question_id FROM reportedquestions`;
  //returns [{question_id: 2}, {question_id: 6}, {question_id: 8}, etc.]
  // console.log('true? ', res.rows[0].question_id === 2);
  //console.log('thus, this returns true: ', res.rows[0].question_id === 2);

  //copy reported answers from import table
  query = `INSERT INTO reportedanswers
  SELECT id, question_id, body, date_written, answerer_name, helpful
  FROM importanswers
  WHERE reported = true
  ORDER BY question_id;`;
  //delete reported answers from import table
  query = `DELETE FROM importanswersbackup WHERE reported = true;`

  //this inner join allows you to pull all pertinent 'answers' data from imports for answers related to reported questions
  query = `SELECT importanswers.id, importanswers.question_id, importanswers.body, importanswers.date_written, importanswers.answerer_name, importanswers.helpful FROM importanswers JOIN reportedquestions ON importanswers.question_id = reportedquestions.question_id;`

  //this takes that inner join and successfully inserts the data into reportedanswers
  query = `INSERT INTO reportedanswers SELECT importanswers.id, importanswers.question_id, importanswers.body, importanswers.date_written, importanswers.answerer_name, importanswers.helpful FROM importanswers JOIN reportedquestions ON importanswers.question_id = reportedquestions.question_id;`
  //now, to delete the above data from importanswers we do
  query = `DELETE FROM importanswersbackup WHERE question_id IN (SELECT question_id FROM reportedquestions)`;

  //finally, we can simply insert into answers all non-deleted answers from imports
  query = `INSERT INTO answers
  SELECT id, question_id, body, date_written, answerer_name, helpful
  FROM importanswers
  WHERE reported = false
  ORDER BY question_id;`;

  //copy photos associated with reported answers to reportedphotos
  query = `INSERT INTO reportedphotos SELECT importphotos.id, importphotos.answer_id, importphotos.url FROM importphotos JOIN reportedanswers ON importphotos.answer_id = reportedanswers.answer_id;`
  //copy photos to be rendered into photos
  query = `INSERT INTO photos SELECT importphotos.id, importphotos.answer_id, importphotos.url FROM importphotos JOIN answers ON importphotos.answer_id = answers.answer_id;`

  //trash queries:
  query = `SELECT * FROM importanswers WHERE reported = true LIMIT 5;`;
  query = `INSERT INTO reportedanswers
  SELECT id, question_id, body, date_written, answerer_name, helpful
  FROM importanswers
  WHERE reported = true
  ORDER BY question_id;`
  query = `SELECT question_id FROM reportedanswers`;
  connection.query(query, (err, res) => {
    if(err){
      console.log('Error hit: ', err);
    }else{
      console.log('Success! res: ', res);
    }
  });
}

const importData = function(cb){
  //let path = '/private/tmp/data/csv/';
  console.log('copying csv data......');
  let ansQuery = `
    COPY importanswersbackup(id, question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
    FROM '/private/tmp/data/csv/answers.csv'
    DELIMITER ','
    CSV HEADER;`;
  let quesQuery = `
    COPY importquestions (id, product_id, body, date_written, asker_name, asker_email, reported, helpful)
    FROM '/private/tmp/data/csv/questions.csv'
    DELIMITER ','
    CSV HEADER;`;
  let photoQuery = `
    COPY importphotos (id, answer_id, url)
    FROM '/private/tmp/data/csv/answers_photos.csv'
    DELIMITER ','
    CSV HEADER;`;
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
  SELECT id, product_id, body, date_written, asker_name, helpful
  FROM importquestions
  WHERE reported = false
  ORDER BY product_id;
  `;
  const reportedQues = `
    INSERT INTO reportedquestions
    SELECT id, product_id, body, date_written, asker_name, helpful
    FROM importquestions
    WHERE reported = true
    ORDER BY product_id;
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
    ORDER BY question_id;
  `;
  const reportedAns = `
    INSERT INTO reportedanswers
    SELECT id, question_id, body, date_written, answerer_name, helpful
    FROM importanswers
    WHERE reported = true
    ORDER BY question_id;
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
          //select question_id from reportedquestions, for each remove * from answers & insert into reportedanswers
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
    ORDER BY answer_id;
  `;
  //select answer_id from reportedanswers, for each remove * from photos & insert into reported photos
  connection.query(photoQuery, (err, res) => {
    if (err) {
      console.error('Error transfering photos data: ', err);
    } else {
      console.log('Successful transfer of photos data');
      console.log('All data transformation complete');
    }
  });
}