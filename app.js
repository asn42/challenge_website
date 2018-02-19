const path = require('path')
const env = require('node-env-file')
const express = require('express')
const logger = require('morgan')
const cookieParser = require('cookie-parser')
const session = require('express-session')
const bodyParser = require('body-parser')

const sqlite3 = require('sqlite3').verbose()

const passport = require('passport')
const FortyTwoStrategy = require('passport-42').Strategy
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn

env(__dirname + '/.env')

const app_root = process.env.APP_ROOT
const app_domain = process.env.APP_DOMAIN

passport.use(new FortyTwoStrategy(
  {
    clientID: process.env.FORTYTWO_CLIENT_ID,
    clientSecret: process.env.FORTYTWO_CLIENT_SECRET,
    callbackURL: app_domain + app_root + 'login/42/return'
  },
  function (accessToken, refreshToken, profile, cb) {
    return cb(null, profile)
  }
))

passport.serializeUser(function (user, cb) {
  cb(null, user)
})

passport.deserializeUser(function (obj, cb) {
  cb(null, obj)
})

// Create a new Express application.
const app = express()

// Configure view engine to render handlebars templates.
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'hbs')

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(logger('dev'))
app.use(cookieParser())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(session({ resave: false, saveUninitialized: false, secret: '!terceS' }))
//app.use(express.static(path.join(__dirname, 'public')))

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize())
app.use(passport.session())

// Routes

// 42 authentication
app.get(app_root + 'login',
  passport.authenticate('42'))

// Return from 42 authentication
app.get(app_root + 'login/42/return',
  passport.authenticate('42', { failureRedirect: app_root + 'login' }),
  function (req, res) {
    res.redirect(app_root)
  })

// Logout
app.get(app_root + 'logout', function (req, res){
  req.logout()
  res.redirect(app_root)
})

// Homepage
app.get(app_root,
  function (req, res) {
    res.render('home', { user: req.user })
  })

// Submitted more than one flag in a minute
app.get(app_root + 'wait',
  ensureLoggedIn(app_root + 'login'),
  function (req, res) {
    res.render('wait', { user: req.user })
  })

// Submitted a correct flag
app.get(app_root + 'correct',
  ensureLoggedIn(app_root + 'login'),
  function (req, res) {
    res.render('wait', { user: req.user, submitted: 'correct' })
  })

// Submitted an incorrect flag
app.get(app_root + 'incorrect',
  ensureLoggedIn(app_root + 'login'),
  function (req, res) {
    res.render('wait', { user: req.user, submitted: 'incorrect' })
  })


// Challenge list
app.get(app_root + 'submit',
  ensureLoggedIn(app_root + 'login'),
  function (req, res, next){
    const db = new sqlite3.Database(path.join(__dirname, 'database/db.sqlite'))
    // every challenge + points the user won (or null) + times they were flagged
    db.all(
      'SELECT ' +
      'c.id, c.name, c.url, p1.amount AS amount, COUNT(p2.amount) AS winners ' +
      'FROM challenges AS c ' +
      'LEFT JOIN points AS p1 ON p1.challenge_id = c.id AND p1.user_id = ? ' +
      'LEFT JOIN points AS p2 ON p2.challenge_id = c.id ' +
      'GROUP BY c.id ' +
      'ORDER BY c.id;',
      parseInt(req.user.id, 10),
      function (dbErr, challenges) {
        if (dbErr) {
          db.close()
          next(dbErr)
        } else if (challenges) {
          db.close()
          const challengesNormalized = challenges.map((challenge) => {
            if (challenge.amount === null) {
              challenge.amount = 0
            }
            return challenge
          })
          res.render('submit', { user: req.user, challenges: challengesNormalized})
        } else {
          db.close()
          res.render('submit', { user: req.user, challenges: [] })
        }
      }
    )
  }
)

// Flag submission
app.post(app_root + 'submit',
  ensureLoggedIn(app_root + 'login'),
  function (req, res){
    const now = Date.now()
    const db = new sqlite3.Database(path.join(__dirname, 'database/db.sqlite'))
    // the user's score, cumulated time, and last flag submission time
    db.get('SELECT score, time, last_attempt FROM users WHERE id = ?;',
      parseInt(req.user.id, 10),
      function (dbErr, user) {
        if (dbErr) {
          db.close()
          next(dbErr)
        } else if (user && user.last_attempt > now - 60000) {
          db.close()
          res.redirect(app_root + 'wait')
        } else {
          db.serialize(function () {
            db.parallelize(function () {
              // archive the user submitted flag (for information only)
              db.run('INSERT OR IGNORE ' +
                'INTO submissions(user_id, challenge_id, time, flag) ' +
                'VALUES (?, ?, ?, ?);', [
                  parseInt(req.user.id, 10),
                  parseInt(req.body.challenge, 10),
                  now,
                  req.body.flag
                ])
            })
            // get challege flag, if the user flagged, and times already flagged
            db.get('SELECT ' +
              'c.flag, ' +
              'COUNT(p2.amount) AS already_flagged, ' +
              'COUNT(p1.amount) AS winners ' +
              'FROM challenges AS c ' +
              'LEFT JOIN points AS p1 ON p1.challenge_id = c.id ' +
              'LEFT JOIN points AS p2 ON p2.challenge_id = c.id AND p2.user_id = ? ' +
              'WHERE c.id = ?;',
              parseInt(req.user.id, 10),
              parseInt(req.body.challenge, 10),
              function (dbErr, challenge) {
                if (dbErr) {
                  db.close()
                  next(dbErr)
                  // first time flagging and flag match
                } else if (challenge && challenge.already_flagged === 0) {
                  // add or update user with last_attempt = now
                  const userTime = user ? user.time : 0
                  const userScore = user ? user.score : 0
                  db.run('INSERT OR REPLACE ' +
                    'INTO users (id, xlogin, score, time, last_attempt)' +
                    'VALUES (?, ?, ?, ?, ?);', [
                      parseInt(req.user.id, 10),
                      req.user.username,
                      userScore,
                      userTime,
                      now,
                    ])
                  //console.log(challenge.flag, req.body.flag.replace(/\s/g, '').toLowerCase())
                  if (challenge.flag === req.body.flag.replace(/\s/g, '').toLowerCase()) {
                    const winners = (challenge.winners === null) ? 0 : challenge.winners
                    // points = 3, 2, 1, 1, 1…
                    const points = (challenge.winners >= 2) ? 1 : 3 - challenge.winners
                    // add points to the user
                    db.run('INSERT OR IGNORE ' +
                      'INTO points(user_id, challenge_id, amount) ' +
                      'VALUES (?, ?, ?);', [
                        parseInt(req.user.id, 10),
                        parseInt(req.body.challenge, 10),
                        points
                      ])
                    db.run('UPDATE users ' +
                      'SET score = ?, time = ? ' +
                      'WHERE id = ?;', [
                        userScore + points,
                        userTime + now,
                        parseInt(req.user.id, 10)
                      ])
                    db.close()
                    res.redirect(app_root + 'correct')
                  } else {
                    db.close()
                    res.redirect(app_root + 'incorrect')
                  }
                } else {
                  db.close()
                  res.redirect(app_root + 'submit')
                }
              }
            )
          })
        }
      }
    )
  }
)

// Leader board
app.get(app_root + 'leaderboard',
  ensureLoggedIn(app_root + 'login'),
  function (req, res, next){
    const db = new sqlite3.Database(path.join(__dirname, 'database/db.sqlite'))
    db.all('SELECT ' +
      'xlogin, score, time ' +
      'FROM users ' +
      'ORDER BY score DESC, time ASC;',
      function (dbErr, winners) {
        if (dbErr) {
          db.close()
          next(dbErr)
        }
        else if (winners) {
          db.close()
          res.render('leaderboard', { user: req.user, winners: winners })
        } else {
          db.close()
          res.render('leaderboard', { user: req.user, error: 'No challenge solved yet.' })
        }
      })
  }
)

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = app
