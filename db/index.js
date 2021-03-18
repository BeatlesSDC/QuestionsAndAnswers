//cont postgres = require('postgres');
const postgres = require('pg');
const connection = new postgres.Client({
  user: 'postgres',
  password: 'root',
  database: 'qanda'
});

connection.connect()
.then(()=>{console.log('Postgres connection successful...');})
.then(()=>{
  importData();
})
.catch((err)=>{console.log('Connection error: ', err);})

var importData = function(){
  //let path = '/private/tmp/data/csv/';
  console.log('copying csv data......');
  // let query = `
  //   COPY importanswers(id, question_id, body, date_written, answerer_name, answerer_email, reported, helpful)
  //   FROM '/private/tmp/data/csv/answers.csv'
  //   DELIMITER ','
  //   CSV HEADER`;
  // let query = `
  //   COPY importquestions (id, product_id, body, date_written, asker_name, asker_email, reported, helpful)
  //   FROM '/private/tmp/data/csv/questions.csv'
  //   DELIMITER ','
  //   CSV HEADER`;
  let query = `
    COPY importphotos (id, answer_id, url)
    FROM '/private/tmp/data/csv/answers_photos.csv'
    DELIMITER ','
    CSV HEADER`;
  connection.query(query, (err, res) => {
    if (err) {
      console.error('Error importing data: ', err);
    } else {
      console.log('Successful csv copy: ');
      connection.query("SELECT * FROM importquestions");
    }
  });
}

module.exports = {

}