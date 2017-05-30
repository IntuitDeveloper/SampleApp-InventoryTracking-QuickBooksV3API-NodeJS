# SampleApp-InventoryTracking-QuickBooksV3API-NodeJS

<p>This is a sample application which illustrates a typical use case in QBO.  It is built on mcohen01's excellent open source NodeJS SDK for QuickBooks Online.  Please visit this <a herf="https://github.com/mcohen01/node-quickbooks#findAccounts">repo</a> for more information.</p> 

<p>The use case being demonstrated by this sample is the following:  Login -> populate list of Customers and Items -> Select a customer and item, quantity, and amount -> Create the invoice<p>

<p>There is also an additional flow for creating an inventory item.<p>

<p>Several routes have been created for functions such as Item Search, Account Search, Invoice Creation, Item Creation.  </p>

<h2>Invoice Creation</h2>

<p>This flow works the following way.<br>

   <ol>
   <li> The view Customer.ejs, collects the data required for an invoice.  In order to get the data needed for this view, the Customers and Items need to be queried.  This happens in the intitialCalls function in the app.js file.  Since this is the first view after Oauth is complete, we do this in app.js
       
       ```var initialCalls = function (qbo) {
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
    ```
    </li>
    
    
    <li>Once the Customer.ejs view is rendered, and the user selects the Item, Customer, Quantity, and Amount for the invoice.  The route, /createInvoice is used to make the invoice create call.  Also in /createInvoice, GetItem is called twice, once before the invoice is created, and once afterwards.  This is done to get the data from QuickBooks to highlight that the inventory within the item has changed due to the invoice.

    ```nodejs
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
    ```
    </li>


<li>Once the requests are complete, we render createInvoice.ejs</li>
</p>
