#!/usr/bin/env node

const path = require('path')
const env = require('node-env-file')
const sqlite3 = require('sqlite3').verbose()

env(__dirname + '/.env')

const db = new sqlite3.Database(path.join(__dirname, 'db.sqlite'))

function populateDatabase(db) {

  console.log('Populating table users')
  const users = [
    {
      id: 1,
      xlogin: 'kwame',
      score: 3,
      time: Date.now() - 3600000,
      lastAttempt: Date.now() - 3600000
    },
    {
      id: 2,
      xlogin: 'ns',
      score: 5,
      time: Date.now() * 2 - 60000,
      lastAttempt: Date.now()
    },
    {
      id: 3,
      xlogin: 'ol',
      score: 1,
      time: Date.now() + 360000,
      lastAttempt: Date.now() + 360000
    },
    {
      id: 4,
      xlogin: 'thor',
      score: 3,
      time: Date.now() - 60000,
      lastAttempt: Date.now() - 60000
    }
  ]
  const stmt = db.prepare('INSERT OR REPLACE INTO users(id, xlogin, score, time, last_attempt) VALUES (?, ?, ?, ?, ?)');
  users.forEach((user) => {stmt.run(user.id, user.xlogin, user.score, user.time, user.lastAttempt)})
  stmt.finalize();

  console.log('Populating table challenges')
  const challenges = [
    {
      id: 1,
      name: 'tangrams',
      url: 'https://example.com/chall/tangrams/',
      prize: 3,
      flag: 'flag1'
    },
    {
      id: 2,
      name: 'from paris',
      url: 'https://example.com/chall/fromparis/',
      prize: 3,
      flag: 'flag2'
    },
    {
      id: 3,
      name: 'sweet crypto',
      url: 'https://example.com/chall//sweetcrypto/',
      prize: 3,
      flag: 'flag3'
    },
    {
      id: 4,
      name: 'petit prince',
      url: 'https://example.com/chall/petitprince/',
      prize: 3,
      flag: 'flag4'
    },
    {
      id: 5,
      name: 'seringue',
      url: 'https://example.com/chall/seringue/',
      prize: 3,
      flag: 'flag5'
    },
    {
      id: 6,
      name: 'transversale',
      url: 'https://example.com/chall/transversale/',
      prize: 3,
      flag: '!@#$%^&*-_.{}"\'`\\/<>[]()éèàô1234asdf'
    }
  ]
  const stmt2 = db.prepare('INSERT OR REPLACE INTO challenges(id, name, url, prize, flag) VALUES (?, ?, ?, ?, ?)');
  challenges.forEach((challenge) => {stmt2.run(challenge.id, challenge.name, challenge.url, challenge.prize, challenge.flag)})
  stmt2.finalize();

  console.log('Populating table points')
  const points = [
    {
      id: 1,
      user_id: 1,
      challenge_id: 1,
      amount: 3
    },
    {
      id: 2,
      user_id: 2,
      challenge_id: 1,
      amount: 2
    },
    {
      id: 3,
      user_id: 3,
      challenge_id: 1,
      amount: 1
    },
    {
      id: 4,
      user_id: 4,
      challenge_id: 2,
      amount: 3
    },
    {
      id: 5,
      user_id: 2,
      challenge_id: 3,
      amount: 3
    }
  ]
  const stmt3 = db.prepare('INSERT OR REPLACE INTO points(id, user_id, challenge_id, amount) VALUES (?, ?, ?, ?)');
  points.forEach((point) => {stmt3.run(point.id, point.user_id, point.challenge_id, point.amount)})
  stmt3.finalize();

}

populateDatabase(db)
