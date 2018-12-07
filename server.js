'use strict';
//+++++++++++++++dependencies+++++++++++++++++++
console.log('hi');
const express = require('express');
//const superagent = require('superagent');
const pg = require('pg');
const fetch = require('node-fetch');
//const util = require('util');
// const cors =  require('cors');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT;

//databse setup
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));
console.log('~~~~~~~~~~~~');
//set view engine for templating
app.set('view engine', 'ejs');

//showing app where to find resources
app.use(express.static('./public'));
app.use(express.urlencoded( {extended: true} ));

//+++++++++++++++routes+++++++++++++++++++

//route  for home view
app.get('/', getHome)
app.post('/results', getCompanyDomain);
app.get('new-search')
//
app.listen(PORT, () => console.log(`Listening on ${PORT}`));

//handler for POST request / searches

// //+++++++++++++++models++++++++++++++++
function Company(fullContact, clearBit) {
  this.tableName = 'lastSearched';
  this.companyName = fullContact.name;
  this.founded = fullContact.founded;
  this.size = fullContact.employees;
  this.leaders = fullContact.dataAddOns ? fullContact.dataAddOns.name : 'unknown leaders';
  this.product = 'products'
  this.clients = 'clients'
  this.mission = 'missions'
  this.contacts = 'contacts'
  this.location = 'location'
  this.domain = clearBit.domain
  this.logo = clearBit.logo
}

function saveCompany(company) {
  const SQL = `INSERT INTO ${company.tableName} (companyName, founded, size, leaders, product, clients, mission, contacts, location, domain, logo, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;
  const values = [company.companyName, company.founded, company.size, company.leaders, company.product, company.clients, company.mission, company.contacts, company.location, company.domain, company.logo];
  client.query(SQL,values);
}
// //++++++++++++++helpers+++++++++++++++
// //on page load
function getHome(request, response){
  let SQL = 'SELECT * from savedCompanies;';
  return client.query(SQL)
    .then( (results) => {
      response.render('index', {results: results.rows});
    })
    .catch( (error) => handleError(error) );

  //load savedComppanies
}

// //++++++++++++++++handlers+++++++++++++++++

// //error handler
function handleError(err, res){
  console.error(err);
  res.render('error.ejs', {error: 'Error recieved'});
}

function getCompanyInfo(request, response, json){ // we passed in trying to find the dmoain we will get
  fetch('https://api.fullcontact.com/v3/company.enrich',{
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.FULLCONTACT_API_KEY}` //add to .env
    },
    body: JSON.stringify({
      'domain': json.domain //we added, not sure where it lives yet
    })
  })
    .then(function(res) {
      return res.json();
    }) 
    .then(apiResponse => {
      //console.log(apiResponse)
      const newCompany = new Company(apiResponse, json)
      saveCompany(newCompany)
      return newCompany
    })
    .then(results => {
      return response.render('results', {searchResults: results})})

    .catch( (error) => handleError(error) );
}

function getCompanyDomain(request, response){
  // console.log(request.body.searchTerm);
  fetch(`https://company.clearbit.com/v1/domains/find?name=${request.body.searchTerm}`, { //need to get search results
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.CLEARBIT_API_KEY}` //add to .env
    }

  }).then(function(res) {
    return res.json();
  }).then(function(json) {
    console.log('json: (should return clearbit object)', json)
    getCompanyInfo(request, response, json);
  })
    .catch( (error) => handleError(error) );
}

// function getCompany(request, response){

// }

// //reference from book app
// function createSearch(request, response) {
//   let url = 'https://www.googleapis.com/books/v1/volumes?q=';
//   superagent.get(url)
//     .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult)))
//     .then(results => response.render('pages/searches/show', {searchResults: results}))
//     .catch(error => handleError(error, response))
// }
// // reference above


// //on page load
// function getHome(request, response){
//   let SQL = 'SELECT * from savedCompanies;';
//   return client.query(SQL)
//     .then( (results) => {
//       response.render('/', {showSavedCompanies: results.rows});
//     })
//     .catch( (error) => handleError(error) );
// }

// Company.prototype = {
//   save: function() {
//     const SQL = `INSERT INTO ${this.tableName} (companyName, founded, size, leaders, product, clients, mission, contacts, location, domain, logo, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12);`;
//     const values = [this.companyName, this.founded, this.size, this.leaders, this.product, this.clients, this.mission, this.contacts, this.location, this.domain, this.logo];

//     client.query(SQL,values);
//   }
// }
