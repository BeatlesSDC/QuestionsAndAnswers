const postgres = require('pg');
const connection = new postgres.Client({
  user: 'postgres',
  password: 'root',
  database: 'qanda'
});

connection.connect()
.then(()=>{console.log('Postgres connection successful...');})
.then(()=>{
  // to import data from csv, then format
  importData(formatQuestions);

  //to only import data
  // importData(connection.end);

  //to format imported data
  //formatQuestions(formatAnswers);

  // console.log('No transformations specified');
})
.catch((err)=>{console.log('Connection error: ', err);})

const importData = function(cb){
  //let path = '/private/tmp/data/csv/';
  console.log('copying csv data......');
  let ansQuery = `
    COPY importanswers(id, question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
    FROM '/Users/Phillip/Documents/SDC-HackReactor/data/answers.csv'
    DELIMITER ','
    CSV HEADER;`;
  let quesQuery = `
    COPY importquestions (id, product_id, body, date_written, asker_name, asker_email, reported, helpful)
    FROM '/Users/Phillip/Documents/SDC-HackReactor/data/questions.csv'
    DELIMITER ','
    CSV HEADER;`;
  let photoQuery = `
    COPY importphotos (id, answer_id, url)
    FROM '/Users/Phillip/Documents/SDC-HackReactor/data/answers_photos.csv'
    DELIMITER ','
    CSV HEADER;`;
  connection.query(ansQuery, (err) => {
    if (err) {
      console.error('Error importing answers data: ', err);
    } else {
      console.log('Success copying answers');
      connection.query(quesQuery, (err2) => {
        if (err2) {
          console.error('Error importing questions data: ', err2);
        } else {
          connection.query(photoQuery, (err3) => {
            if (err3) {
              console.error('Error importing photos data: ', err3);
            } else {
              console.log('All data successfully imported');
              cb(formatAnswers);
            }
          })
        }
      });
    }
  });
}

const formatQuestions = function(cb){
  console.log('Formatting data...');
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
  connection.query(quesQuery, (err) => {
    if (err) {
      console.error('Error formatting questions: ', err);
    } else {
      console.log('Successful transfer to questions db');
      connection.query(reportedQues, (error) => {
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
  const reportedQuery = `INSERT INTO reportedanswers
  SELECT id, question_id, body, date_written, answerer_name, helpful
  FROM importanswers
  WHERE reported = true
  ORDER BY question_id;`;

  const deleteReportedQuery = `DELETE FROM importanswers WHERE reported = true;`

  const reportedQuesAnsQuery = `INSERT INTO reportedanswers SELECT importanswers.id, importanswers.question_id, importanswers.body, importanswers.date_written, importanswers.answerer_name, importanswers.helpful FROM importanswers JOIN reportedquestions ON importanswers.question_id = reportedquestions.question_id;`

  const deleteReportedQuesAnsQuery = `DELETE FROM importanswers WHERE question_id IN (SELECT question_id FROM reportedquestions)`;

  const ansQuery = `INSERT INTO answers
  SELECT id, question_id, body, date_written, answerer_name, helpful
  FROM importanswers
  WHERE reported = false
  ORDER BY question_id;`;

  connection.query(reportedQuery, (err) => {
    if(err){
      console.log('Error transfering reported answers');
    } else {
      connection.query(deleteReportedQuery, (err2) => {
        if(err2){
          console.log('Error deleting reported answers: ', err2);
        } else {
          connection.query(reportedQuesAnsQuery, (err3) => {
            if(err3){
              console.log('Error transfering non-reported answers for reported ques: ', err3);
            } else {
              connection.query(deleteReportedQuesAnsQuery, (err4) => {
                if(err4){
                  console.log('Error deleting non-reported answers for reported questions: ', err4);
                } else {
                  connection.query(ansQuery, (err5) => {
                    if(err5){
                      console.log('Error transfering answers: ', err5);
                    } else {
                      console.log('Successfully transfered all answer data');
                      cb(disconnect);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  });
}

const formatPhotos = function(cb){
  const reportedPhotoQuery = `INSERT INTO reportedphotos SELECT importphotos.id, importphotos.answer_id, importphotos.url FROM importphotos JOIN reportedanswers ON importphotos.answer_id = reportedanswers.answer_id;`
  //copy photos to be rendered into photos
  const photoQuery = `INSERT INTO photos SELECT importphotos.id, importphotos.answer_id, importphotos.url FROM importphotos JOIN answers ON importphotos.answer_id = answers.answer_id;`

  //select answer_id from reportedanswers, for each remove * from photos & insert into reported photos
  connection.query(reportedPhotoQuery, (err) => {
    if (err) {
      console.error('Error transfering photos of reported answers: ', err);
    } else {
      connection.query(photoQuery, (error) => {
        if (error) {
          console.error('Error transfering photos data: ', error);
        } else {
          console.log('Successful transfer of photos data');
          console.log('All data transformation complete');
          cb();
        }
      });
    }
  });
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

// const fixedTransformations = function(cb){
//   let query = `SELECT question_id FROM reportedquestions`;
//   //returns [{question_id: 2}, {question_id: 6}, {question_id: 8}, etc.]
//   // console.log('true? ', res.rows[0].question_id === 2);
//   //console.log('thus, this returns true: ', res.rows[0].question_id === 2);

//   //copy reported answers from import table
//   query = `INSERT INTO reportedanswers
//   SELECT id, question_id, body, date_written, answerer_name, helpful
//   FROM importanswers
//   WHERE reported = true
//   ORDER BY question_id;`;
//   //delete reported answers from import table
//   query = `DELETE FROM importanswers WHERE reported = true;`

//   //this inner join allows you to pull all pertinent 'answers' data from imports for answers related to reported questions
//   query = `SELECT importanswers.id, importanswers.question_id, importanswers.body, importanswers.date_written, importanswers.answerer_name, importanswers.helpful FROM importanswers JOIN reportedquestions ON importanswers.question_id = reportedquestions.question_id;`

//   //this takes that inner join and successfully inserts the data into reportedanswers
//   query = `INSERT INTO reportedanswers SELECT importanswers.id, importanswers.question_id, importanswers.body, importanswers.date_written, importanswers.answerer_name, importanswers.helpful FROM importanswers JOIN reportedquestions ON importanswers.question_id = reportedquestions.question_id;`
//   //now, to delete the above data from importanswers we do
//   query = `DELETE FROM importanswers WHERE question_id IN (SELECT question_id FROM reportedquestions)`;

//   //finally, we can simply insert into answers all non-deleted answers from imports
//   query = `INSERT INTO answers
//   SELECT id, question_id, body, date_written, answerer_name, helpful
//   FROM importanswers
//   WHERE reported = false
//   ORDER BY question_id;`;

//   //copy photos associated with reported answers to reportedphotos
//   query = `INSERT INTO reportedphotos SELECT importphotos.id, importphotos.answer_id, importphotos.url FROM importphotos JOIN reportedanswers ON importphotos.answer_id = reportedanswers.answer_id;`
//   //copy photos to be rendered into photos
//   query = `INSERT INTO photos SELECT importphotos.id, importphotos.answer_id, importphotos.url FROM importphotos JOIN answers ON importphotos.answer_id = answers.answer_id;`

//   //trash queries:
//   query = `SELECT * FROM importanswers WHERE reported = true LIMIT 5;`;
//   query = `INSERT INTO reportedanswers
//   SELECT id, question_id, body, date_written, answerer_name, helpful
//   FROM importanswers
//   WHERE reported = true
//   ORDER BY question_id;`
//   query = `SELECT question_id FROM reportedanswers`;
//   connection.query(query, (err, res) => {
//     if(err){
//       console.log('Error hit: ', err);
//     }else{
//       console.log('Success! res: ', res);
//     }
//   });
// }