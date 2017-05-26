module.exports = function(app, qbo) {
    
    //a route which accepts a customer id
    app.get('/customer/:id', function (req, res) {
        qbo.getCustomer(req.params.id, function(err, customer) {
                console.log(customer);
                res.render('searchResults.ejs', { locals: { customer: customer }})
            })
    })

    //a route which accepts a item id
    app.get('/item/:id', function (req, res) {
        qbo.getItem(req.params.id, function(err, item) {
            console.log(item);
            res.render('item.ejs', { locals: { item: item }})
        })
    })

    //a route which populates the Create Item Form with a list of Accounts
    app.get('/createItemForm', function (req, res) {
        qbo.findAccounts(function(_, accounts) {
            res.render('createItemForm.ejs', {locals: {accounts: accounts.QueryResponse.Account}})
        })
    })
    //a route which creates an item, the name is passed in
    app.get('/createItem/', function (req, res) {
        if(req.query.AssetAccountRef && req.query.ExpenseAccountRef && req.query.IncomeAccountRef){
            var ItemName = req.query.ItemName;
            var AssetAccountRef = req.query.AssetAccountRef.split('; ');
            var ExpenseAccountRef = req.query.ExpenseAccountRef.split('; ');
            var IncomeAccountRef = req.query.IncomeAccountRef.split('; ');
            var ItemQuantity = req.query.ItemQty;
            var CurrentDate = GetCurrentDate();    

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
                if(err) {
                    res.render('errorPage.ejs', {locals: { errorMessage: err.Fault.Error[0] }})
                }
                else {
                    console.log(item);
                    res.render('createItem.ejs', { locals: { item: item }})
                }
            })
        }
        res.render('errorPage.ejs', {locals: { errorMessage: { Message: 'Missing parameter', Detail: 'You Must Select an Account' } }})
    })

    //a route which creates an invoice
    app.get('/createInvoice', function(req, res) {
        if (!req.query.itemSelect) {
            res.render('errorPage.ejs', {locals: { errorMessage: { Message: 'No Item Selected', Detail: 'You Must Select an Item' } }})
        }
        else {
            var CustomerId = req.query.CustomerId;
            var InvoiceQty = req.query.InvoiceQty;
            var ItemRef = req.query.itemSelect.split('; ');
            var InvoiceAmount = req.query.InvoiceAmt;
            var ItemBeforeInvoice;

            qbo.getItem(ItemRef[1], function(err, item) {
                console.log(item);
                ItemBeforeInvoice = item;
            })

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
                if (err) {
                    res.render('errorPage.ejs', {locals: { errorMessage: err.Fault.Error[0] }})
                }
                else {
                        var Item;

                        qbo.getItem(ItemRef[1], function(err, item) {
                            Item = item;
                        })
                        function renderPage() {
                            res.render('createInvoice.ejs', { locals: { ItemBeforeInvoice: ItemBeforeInvoice, Invoice: invoice , Item: Item }});
                        }  
                        setTimeout(renderPage, 2000);
                    }

                })
        } 
})

    var GetCurrentDate = function () {
        var today = new Date();
        var dd = today.getDate();
        //The value returned by getMonth is an integer between 0 and 11, referring 0 to January, 1 to February, and so on.
        var mm = today.getMonth()+1; 
        var yyyy = today.getFullYear();
        if(dd<10) 
        {
            dd='0'+dd;
        } 

        if(mm<10) 
        {
            mm='0'+mm;
        } 
        today = yyyy+'-'+mm+'-'+dd;
    return today; 

    };
}