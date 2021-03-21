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

const upvoteQuestion = (id, cb) => {

}

const upvoteAnswer = (id, cb) => {

}

const reportAnswer = (id, cb) => {

}
module.exports = {
  getQandA,
  postQuestion,
  postAnswer
}