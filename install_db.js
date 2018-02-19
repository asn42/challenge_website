#!/usr/bin/env node

const path = require('path')
const env = require('node-env-file')
const sqlite3 = require('sqlite3').verbose()

env(__dirname + '/.env')

const db = new sqlite3.Database(path.join(__dirname, 'database/db.sqlite'))

function createDatabase(db) {
  console.log('Creating tables `users`, `challenges`, `points` and `submissions`')
  //db.parallelize(function() {
    db.run(
      'CREATE TABLE IF NOT EXISTS users(' +
      'id INTEGER PRIMARY KEY, ' +
      'xlogin VARCHAR UNIQUE, ' +
      'score INTEGER, ' +
      'time INTEGER, ' +
      'last_attempt INTEGER' +
      ');'
    )
    db.run(
      'CREATE TABLE IF NOT EXISTS challenges(' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'name VARCHAR UNIQUE, ' +
      'url VARCHAR, ' +
      'prize INTEGER, ' +
      'flag VARCHAR' +
      ');'
    )
    db.run(
      'CREATE TABLE IF NOT EXISTS points(' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'user_id INTEGER, ' +
      'challenge_id INTEGER, ' +
      'amount INTEGER, ' +
      'UNIQUE(user_id, challenge_id) ON CONFLICT IGNORE' +
      ');'
    )
    db.run(
      'CREATE TABLE IF NOT EXISTS submissions(' +
      'id INTEGER PRIMARY KEY AUTOINCREMENT, ' +
      'user_id INTEGER, ' +
      'challenge_id INTEGER, ' +
      'time INTEGER, ' +
      'flag VARCHAR' +
      ');'
    )
  //})
}

// Delete the database if it exists
function deleteDatabase(db) {
  console.log('Deleting tables `users`, `challenges`, `points` and `submissions`')
  //db.parallelize(function() {
    db.run(
      'DROP TABLE IF EXISTS users;'
    )
    db.run(
      'DROP TABLE IF EXISTS challenges;'
    )
    db.run(
      'DROP TABLE IF EXISTS points;'
    )
    db.run(
      'DROP TABLE IF EXISTS submissions;'
    )
  //})
}

// Delete and recreate the database
function recreateDatabase(db) {
  db.serialize(function () {
    deleteDatabase(db)
    createDatabase(db)
  })
}

recreateDatabase(db)
