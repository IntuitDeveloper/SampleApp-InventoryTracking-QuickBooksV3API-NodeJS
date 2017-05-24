// const routes = require('express').Router();
var request = require('request'),
    express = require('express')
    


module.exports = function(app, session, QuickBooks, consumerKey, consumerSecret) {
 //var session = session;
    //a route which accepts a customer id
    app.get('/customer/:id', function (req, res) {
    console.log(req.session);
    //console.log(sessionSaved);

    var qbo = getQbo(session);
    qbo.getCustomer(req.params.id, function(err, customer) {
            console.log(customer);
            res.render('customer.ejs', { locals: { customer: customer }})
        })
    })

    //a route which accepts a item id
    app.get('/item/:id', function (req, res) {
    console.log(req.session);
    console.log(sessionSaved);

    var qbo = getQbo(sessionSaved);
    qbo.getItem(req.params.id, function(err, item) {
            console.log(item);
            res.render('item.ejs', { locals: { item: item }})
        })
    })

    //a route which accepts a item id displays it
    app.get('/findItem/:searchTerm', function (req, res) {
    console.log(req.session);
    console.log(sessionSaved);

    var searchTerm = '%' + req.params.searchTerm + '%';

    var qbo = getQbo(sessionSaved);
    qbo.findItems([
            { field: 'fetchAll', value: true },
            { field: 'Name', value: searchTerm, operator: 'LIKE' }
            ], function (e, searchResults) {
            console.log(searchResults);
            searchResults.QueryResponse.Item.forEach(function(item) {
                console.log('-------')
                console.log(item);
            }, this);
            res.render('findItem.ejs', { locals: { searchTerm: req.params.searchTerm, searchResults: searchResults, items: searchResults.QueryResponse.Item }})
        })
    })

    //a route which creates an item, the name is passed in
    app.get('/createItem/:name', function (req, res) {
        console.log('im going to make an item now');

        var qbo = getQbo(sessionSaved);
        var randomName = "ServiceItem " + Date();

        if (req.params.name) {
        randomName = req.params.name;
        }

        qbo.createItem({
        "Name": randomName,
        "IncomeAccountRef": {
            "value": "1",
            "name": "Services"
        },
        "Type": "Service"
        }, function(err, item) {
        console.log(item);
        res.render('createItem.ejs', { locals: { item: item }})
        })
    })

    //a route which creates an invoice
    app.get('/createInvoice', function(req, res) {
    var qbo = getQbo(session);
    var CustomerId = req.query.CustomerId;
    var InvoiceQty = req.query.InvoiceQty;
    var ItemRef = req.query.itemSelect.split('; ');
    
    var ItemBeforeInvoice;

    qbo.getItem(ItemRef[1], function(err, item) {
        console.log(item);
        ItemBeforeInvoice = item;
    })

    qbo.createInvoice({
        "Line": [
        {
            "Amount": 100.00,
            "DetailType": "SalesItemLineDetail",
            "SalesItemLineDetail": {
            "ItemRef": {
                "value": ItemRef[1],
                "name": ItemRef[0]
            },
            "Qty": InvoiceQty
            }
        }
        ],
        "CustomerRef": {
        "value": CustomerId
        }
    }, function(err, invoice) {
        var Item;

        qbo.getItem(ItemRef[1], function(err, item) {
            Item = item;
        })

        function renderPage() {
            res.render('createInvoice.ejs', { locals: { ItemBeforeInvoice: ItemBeforeInvoice, Invoice: invoice , Item: Item }});
        }  
        setTimeout(renderPage, 2000);
        })
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
}