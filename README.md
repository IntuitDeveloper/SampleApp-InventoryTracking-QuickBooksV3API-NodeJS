# SampleApp-InventoryTracking-QuickBooksV3API-NodeJS

<p>This is a sample application which illustrates a typical use case in QBO.  It is built on mcohen01's excellent open source NodeJS SDK for QuickBooks Online.  Please visit this <a href="https://github.com/mcohen01/node-quickbooks" target="_blank">repo</a> for more information.</p> 

<p>The use case being demonstrated by this sample is the following:  Login -> populate list of Customers and Items -> Select a customer and item, quantity, and amount -> Create the invoice<p>

<p>There is also an additional flow for creating an inventory item.<p>

<p>Several routes have been created for functions such as Item Search, Account Search, Invoice Creation, Item Creation.  </p>

<p>Please note that while these examples work, features not called out above are not intended to be taken and used in production business applications. In other words, this is not a seed project to be taken cart blanche and deployed to your production environment. Refer <a href="https://github.com/IntuitDeveloper/SampleApp-Webhooks-nodejs">https://github.com/IntuitDeveloper/SampleApp-Webhooks-nodejs</a></p>

## Table of Contents
* [Requirements](#requirements)
* [First Use Instructions](#first-use-instructions)
* [Project Structure](#project-structure)
* [Screenshots](#screenshots)

## Requirements

In order to successfully run this sample app you need a few things:

1. Node.js
2. A [developer.intuit.com](http://developer.intuit.com) account
3. An app on [developer.intuit.com](http://developer.intuit.com) and the associated app token, consumer key, and consumer secret.
4. Two sandbox companies, connect both companies with your app and generate the oauth tokens.

## First Time Use Instructions

1. Clone the GitHub repo to your computer
2. Fill in the [`conf.js`](conf.js) values (consumer key, consumer secret) by copying over from the keys section for your app.
3. Fill in the [`conf.js`](conf.js) values (companyId, access token, access token secret) with the oauth tokens generated while connecting with the company. 
4. In your terminal, navigate to the local repo folder and type 'npm install'
5. Goto the application folder in your local repo, and type node app.js (An alternative is to install and use nodemon)
6. In your browser, navigate to localhost:3000

## Project Structure

### Invoice Creation

<p>This flow works the following way.<br>

<p>1.  The view Customer.ejs, collects the data required for an invoice.  In order to get the data needed for this view, the Customers and Items need to be queried.  This happens in the intitialCalls function in the app.js file.  Since this is the first view after Oauth is complete, we do this in app.js</p>
       
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
            items = TrackQtyOnHand.slice(0, 10);
            }, this)

    }
    
    
<p>2.  Once the Customer.ejs view is rendered, and the user selects the Item, Customer, Quantity, and Amount for the invoice.  The route, /createInvoice is used to make the invoice create call.  Also in /createInvoice, GetItem is called twice, once before the invoice is created, and once afterwards.  This is done to get the data from QuickBooks to highlight that the inventory within the item has changed due to the invoice. </p>


        //a route which creates an invoice
    app.get('/createInvoice', function(req, res) {
        //Check to make sure the front end is sending an item selected, if it is null, render the error page
        if (!req.query.itemSelect) {
            res.render('errorPage.ejs', {locals: { errorMessage: { Message: 'No Item Selected', Detail: 'You Must Select an Item' } }})
        }
        else {
            var CustomerId = req.query.CustomerId;
            var InvoiceQty = req.query.InvoiceQty;
            var ItemRef = req.query.itemSelect.split('; ');
            var InvoiceAmount = req.query.InvoiceAmt;
            var ItemBeforeInvoice;

            //Make getItem request to get Item data
            qbo.getItem(ItemRef[1], function(err, item) {
                ItemBeforeInvoice = item;
            })

            //The post body for the Invoice create call
            qbo.createInvoice({
                "Line": [
                {
                    "Amount": InvoiceAmount,
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
                //If there is an err, render the errorPage with the errorMessage from the response
                if (err) {
                    res.render('errorPage.ejs', {locals: { errorMessage: err.Fault.Error[0] }})
                }
                else {
                    var Item;
                    //Make a getItem request to get Item data (to highlight difference before and after an invoice is created)
                    qbo.getItem(ItemRef[1], function(err, item) {
                        Item = item;
                    })
                    
                    function renderPage() {
                        res.render('createInvoice.ejs', { locals: { ItemBeforeInvoice: ItemBeforeInvoice, Invoice: invoice , Item: Item }});
                    }  
                    //Add a timeout of 2000 in order to allow the Invoice response to complete before rendering the page
                    setTimeout(renderPage, 2000);
                }

            })
        } 
    })


<p>3.  Once the requests are complete, we render createInvoice.ejs</p>
</p>

<h2>Item Creation</h2>
<p>The item creation flow follows a similar patter to invoice creation.  First view allows the user to enter in the parameters related to the item to be created.  In this case, we have the route /invoiceCreationForm which renders a view which allows the user to select the accounts, name, and quantity related to the item being created.  When the user submits within this view, the route /createItem will create a postbody based on the parameters selected by the user.  Once the response from the request is successful, the view /createItem will show the results of the item create call.</p>

    //a route which populates the Create Item Form with a list of Accounts
    app.get('/createItemForm', function (req, res) {
        //Retrieve all accounts to populate the createItemForm
        qbo.findAccounts(function(_, accounts) {
            res.render('createItemForm.ejs', {locals: {accounts: accounts.QueryResponse.Account}})
        })
    })
    //a route which creates an item, the name is passed in
    app.get('/createItem/', function (req, res) {
        //Checking to make sure that the fields for AssetAccountRef, ExpenseAccountRef, IncomeAccountRef are not null
        if(req.query.AssetAccountRef && req.query.ExpenseAccountRef && req.query.IncomeAccountRef){
            var ItemName = req.query.ItemName;
            var AssetAccountRef = req.query.AssetAccountRef.split('; ');
            var ExpenseAccountRef = req.query.ExpenseAccountRef.split('; ');
            var IncomeAccountRef = req.query.IncomeAccountRef.split('; ');
            var ItemQuantity = req.query.ItemQty;
            var CurrentDate = GetCurrentDate();    

            //qbo createItem Post Body
            qbo.createItem({
                "Name": ItemName,
                "IncomeAccountRef": {
                    "value": IncomeAccountRef[0],
                    "name": IncomeAccountRef[1]
                },
                "ExpenseAccountRef": {
                    "value": ExpenseAccountRef[0],
                    "name": ExpenseAccountRef[1]
                },
                "AssetAccountRef": {
                    "value": AssetAccountRef[0],
                    "name": AssetAccountRef[1]
                },
                "Type": "Inventory",
                "TrackQtyOnHand": true,
                "QtyOnHand": ItemQuantity,
                "InvStartDate": CurrentDate
            }, function(err, item) {
                //Render error page if err is returned
                if(err) {
                    res.render('errorPage.ejs', {locals: { errorMessage: err.Fault.Error[0] }})
                }
                //Render createItem on success
                else {
                    console.log(item);
                    res.render('createItem.ejs', { locals: { item: item }})
                }
            })
        }
        //Render an error page when AssetAccountRef, ExpenseAccountRef, IncomeAccountRef are null
        else {
            res.render('errorPage.ejs', {locals: { errorMessage: { Message: 'Missing parameter', Detail: 'You Must Select an Account' } }})
        }
    })
    

## Screenshots

When you start the application you will see this for the home page
![Start Login](/screenshots/start%20login%20screen.png)

This is the OAuth Athentication screenshot
![OAuth Auth](/screenshots/OAuth%20Flow.png)

This is the invoice creation view (customer.ejs)
![Home Page](/screenshots/customer%20view.png)

This is the invoice created view
![About Page](/screenshots/Invoice%20Created.png)
