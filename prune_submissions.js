#!/usr/bin/env node

const path = require('path')
const env = require('node-env-file')
const sqlite3 = require('sqlite3').verbose()

env(__dirname + '/.env')

const db = new sqlite3.Database(path.join(__dirname, 'database/db.sqlite'))

// Delete and recreate the submissions table
function clearSubmissions(db) {
  console.log('Emptying table `submissions`')
  db.serialize(function () {
    db.run(
      'DROP TABLE IF EXISTS submissions;'
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
  })
}

clearSubmissions(db)
