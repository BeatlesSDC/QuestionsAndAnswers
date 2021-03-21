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

const getQandA = (cb) => {
  //query for questions, query for answers
};

const postQuestion = (question, cb) => {

};

const postAnswer = (answer, cb) => {

};

module.exports = {
  getQandA,
  postQuestion,
  postAnswer
}