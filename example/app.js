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
  QuickBooks = require('../index'),
  config = require('../config')

// Generic Express config
app.set('port', port)
app.set('views', './views')
app.set('routes', './routes')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser('brad'))
//app.use(session({ resave: false, saveUninitialized: false, secret: 'smith' }));
app.use(cookieSession({name: 'session', keys: ['key1']}))

app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'))
})

// INSERT YOUR CONSUMER_KEY AND CONSUMER_SECRET HERE

var consumerKey = config.consumerKey,
    consumerSecret = config.consumerSecret

// Global Vars
var   sessionSet = false,
      customers, 
      items;

app.get('/', function (req, res) {
  res.redirect('/start');
})

app.get('/start', function (req, res) {
  if(sessionSet){
    //wait for requests to complete before rendering
    function renderPage() {        
      res.render('customer.ejs', { locals: {customers: customers, items: items} });
    }  
    setTimeout(renderPage, 3000);
    
  } else {
    res.render('intuit.ejs', { locals: { port: port, appCenter: QuickBooks.APP_CENTER_BASE } })
  }
  
})

// //a route which accepts a customer id
// app.get('/customer/:id', function (req, res) {
//   console.log(req.session);
//   console.log(sessionSaved);

//   var qbo = getQbo(sessionSaved);
//   qbo.getCustomer(req.params.id, function(err, customer) {
//     console.log(customer);
//     res.render('customer.ejs', { locals: { customer: customer }})
//   })
// })

//a route which accepts a item id
// app.get('/item/:id', function (req, res) {
//   console.log(req.session);
//   console.log(sessionSaved);

//   var qbo = getQbo(sessionSaved);
//   qbo.getItem(req.params.id, function(err, item) {
//     console.log(item);
//     res.render('item.ejs', { locals: { item: item }})
//   })
// })

// //a route which accepts a item id displays it
// app.get('/findItem', function (req, res) {
//   console.log(req.session);
//   console.log(sessionSaved);

//   var searchTerm = '%' + req.query.searchTerm + '%';

//   var qbo = getQbo(sessionSaved);
//   qbo.findItems([
//       { field: 'fetchAll', value: true },
//       { field: 'Name', value: searchTerm, operator: 'LIKE' }
//     ], function (e, searchResults) {
//       console.log(searchResults);
//       searchResults.QueryResponse.Item.forEach(function(item) {
//         console.log('-------')
//         console.log(item);
//       }, this);
//       res.render('findItem.ejs', { locals: { searchTerm: req.params.searchTerm, searchResults: searchResults, items: searchResults.QueryResponse.Item }})
//   })
// })

// //a route which accepts a item id item name and customer family name to search for the points needed for 
// app.get('/search', function (req, res) {
//   console.log(req.session);
//   console.log(sessionSaved);

//   var ItemId = req.query.ItemId,
//       ItemName = '%' + req.query.ItemName + '%',
//       CustomerSearch = '%' + req.query.CustomerSearch + '%';

//   var qbo = getQbo(sessionSaved);
  
//   qbo.findItems([
//       { field: 'fetchAll', value: true },
//       { field: 'Name', value: ItemName, operator: 'LIKE' }
//     ], function (e, searchResults) {
//       console.log(searchResults);
//       searchResults.QueryResponse.Item.forEach(function(item) {
//         console.log('-------')
//         console.log(item);
//       }, this);
//       //res.render('findItem.ejs', { locals: { searchTerm: req.params.searchTerm, searchResults: searchResults, items: searchResults.QueryResponse.Item }})
//   })

//   qbo.findCustomers([
//       { field: 'fetchAll', value: true },
//       { field: 'DisplayName', value: CustomerSearch, operator: 'LIKE' }
//     ], function (e, searchResults) {
//       console.log(searchResults);
//         if(searchResults){
//         searchResults.QueryResponse.Customer.forEach(function(Customer) {
//           console.log('-------')
//           console.log(Customer);
//         }, this);
//         res.render('searchResults.ejs', { locals: { searchTerm: req.params.searchTerm, searchResults: searchResults, items: searchResults.QueryResponse.Item }})
//       }
//  })
// })

// //a route which creates an item, the name is passed in
// app.get('/createItem/:name', function (req, res) {
//     console.log('im going to make an item now');

//     var qbo = getQbo(sessionSaved);
//     var randomName = "ServiceItem " + Date();

//     if (req.params.name) {
//        randomName = req.params.name;
//      }

//     qbo.createItem({
//       "Name": randomName,
//       "IncomeAccountRef": {
//         "value": "1",
//         "name": "Services"
//       },
//       "Type": "Service"
//     }, function(err, item) {
//       console.log(item);
//       res.render('createItem.ejs', { locals: { item: item }})
//     })
// })

// //a route which creates an invoice
// app.get('/createInvoice', function(req, res) {
//   var qbo = getQbo(sessionSaved);
//   var CustomerId = req.query.CustomerId;
//   var InvoiceQty = req.query.InvoiceQty;
//   var ItemRef = req.query.itemSelect.split('; ');
  
//   var ItemBeforeInvoice;

//   qbo.getItem(ItemRef[1], function(err, item) {
//       console.log(item);
//       ItemBeforeInvoice = item;
//   })

//   qbo.createInvoice({
//     "Line": [
//       {
//         "Amount": 100.00,
//         "DetailType": "SalesItemLineDetail",
//         "SalesItemLineDetail": {
//           "ItemRef": {
//             "value": ItemRef[1],
//             "name": ItemRef[0]
//           },
//           "Qty": InvoiceQty
//         }
//       }
//     ],
//     "CustomerRef": {
//       "value": CustomerId
//     }
//   }, function(err, invoice) {
//       var Item;

//       qbo.getItem(ItemRef[1], function(err, item) {
//         Item = item;
//       })

//       function renderPage() {
//         res.render('createInvoice.ejs', { locals: { ItemBeforeInvoice: ItemBeforeInvoice, Invoice: invoice , Item: Item }});
//       }  
//       setTimeout(renderPage, 2000);
      
//     })


// })

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

    req.session.qbo = {
      token: accessToken.oauth_token,
      secret: accessToken.oauth_token_secret,
      companyid: postBody.oauth.realmId
    };

    qbo = getQbo(req.session.qbo);
    response = initialCalls(qbo);
    var router = require('./routes/routes.js')(app, qbo);

  })

  res.send('<!DOCTYPE html><html lang="en"><head></head><body><script>window.opener.location.reload(); window.close();</script></body></html>')
  sessionSet = true;
})

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
        qbo.findCustomers([
          { field: 'fetchAll', value: true }
        ], function (e, searchResults) {
          customers = searchResults.QueryResponse.Customer.slice(0, 10);
        })

        qbo.findItems([
            { field: 'fetchAll', value: true }
          ], function (e, searchResults) {
            var TrackQtyOnHand = [];
            var i = 0;
            searchResults.QueryResponse.Item.forEach( function(item){
              if(item.QtyOnHand) {
                TrackQtyOnHand[i] = item;
                i++;
              }
            })
            items = TrackQtyOnHand.slice(0, 10);
            }, this)

    }
   
// Error Handling
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
});

module.exports = app;