var http = require('http'),
  port = process.env.PORT || 3000,
  request = require('request'),
  qs = require('querystring'),
  util = require('util'),
  bodyParser = require('body-parser'),
  cookieParser = require('cookie-parser'),
  session = require('express-session'),
  cookieSession = require('cookie-session'),  //creating a cookie session to persist the oauth information
  express = require('express'),
  app = express(),
  QuickBooks = require('node-quickbooks'),
  config = require('../config')

// Generic Express config
app.set('port', port)
app.set('views', './views')
app.set('routes', './routes')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser('brad'))
app.use(cookieSession({name: 'session', keys: ['key1']}))

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

// INSERT YOUR CONSUMER_KEY AND CONSUMER_SECRET HERE

var consumerKey = config.consumerKey,
    consumerSecret = config.consumerSecret

// Global Vars
var sessionSet = false,
    customers, 
    items;

//Simple route which redirects / to /start
app.get('/', function (req, res) {
  res.redirect('/start');
})

//This route is the start of the application, it checks to see if there is a session, if no session set, it will render the login page
app.get('/start', function (req, res) {
  if(sessionSet){
    //If a session has been set, this identifies that the user has logged in, will render the customer.ejs view
    function renderPage() {        
      res.render('customer.ejs', { locals: {customers: customers, items: items} });
    } 
    //Wait for requests to complete before rendering 
    setTimeout(renderPage, 3000);
    
  } else {
    //If no session has been set, will render the start page to initiate login
    res.render('intuit.ejs', { locals: { port: port, appCenter: QuickBooks.APP_CENTER_BASE } })
  }
  
})

//This route will take the Request Token and Initiate the User Authentication
app.get('/requestToken', function (req, res) {
  var postBody = {
    url: QuickBooks.REQUEST_TOKEN_URL,
    oauth: {
      callback: 'http://localhost:' + port + '/callback/',
      consumer_key: consumerKey,
      consumer_secret: consumerSecret
    }
  }
  request.post(postBody, function (e, r, data) {
    var requestToken = qs.parse(data)
    req.session.oauth_token_secret = requestToken.oauth_token_secret
    console.log(requestToken)
    res.redirect(QuickBooks.APP_CENTER_URL + requestToken.oauth_token)
  })
})

//Access Token request followed by the Access Token response
app.get('/callback', function (req, res) {
  var postBody = {
    url: QuickBooks.ACCESS_TOKEN_URL,
    oauth: {
      consumer_key: consumerKey,
      consumer_secret: consumerSecret,
      token: req.query.oauth_token,
      token_secret: req.session.oauth_token_secret,
      verifier: req.query.oauth_verifier,
      realmId: req.query.realmId
    }
  }
  request.post(postBody, function (e, r, data) {
    var accessToken = qs.parse(data)
    console.log(accessToken)
    console.log(postBody.oauth.realmId)

    //The Access Token is stored in req.session.qbo
    req.session.qbo = {
      token: accessToken.oauth_token,
      secret: accessToken.oauth_token_secret,
      companyid: postBody.oauth.realmId
    };

    //Call getQbo to create a QBO object in order to make QBO requests
    qbo = getQbo(req.session.qbo);

    //Call function InitialCalls, which gathers data required for the customer.ejs view
    response = initialCalls(qbo);

    //Include the routes.js file, the qbo object is passed into the this file
    var router = require('./routes/routes.js')(app, qbo);

  })

  res.send('<!DOCTYPE html><html lang="en"><head></head><body><script>window.opener.location.reload(); window.close();</script></body></html>')
  sessionSet = true;
})

//Function to create the QBO object
var getQbo = function (args) {
  return new QuickBooks(consumerKey,
                       consumerSecret,
                       args.token,
                       args.secret,
                       args.companyid,
                       true, // use the Sandbox
                       true); // turn debugging on

};

// Calls to get some customers and items when rendering initial page 
var initialCalls = function (qbo) {
        //The first QBO request made in this app is a query to get a list of Customers in the user's company
        qbo.findCustomers(function (e, searchResults) {
          customers = searchResults.QueryResponse.Customer.slice(0, 10);
        })

        //This request finds the first 10 items for which inventory tracking is enabled
        qbo.findItems(function (e, searchResults) {
            var TrackQtyOnHand = [];
            var i = 0;
            searchResults.QueryResponse.Item.forEach( function(item){
              if(item.QtyOnHand) {
                TrackQtyOnHand[i] = item;
                i++;
              }
            })
            items = TrackQtyOnHand;//.slice(0, 10);
            }, this)

    }
   
// Error Handling
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
});

module.exports = app;