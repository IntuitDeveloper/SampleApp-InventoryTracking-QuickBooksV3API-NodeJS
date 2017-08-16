var miscFunctions = require("../miscFunctions.js")


module.exports = function (app, qbo, plotly) {


    //a route which creates a new customer object
    app.get('/createCustomer', function (req, res) {
        //using input from createCustomer form, creating the createCustomer POST body
        qbo.createCustomer({
            "BillAddr": {
                "Line1": req.query.Line1,
                "City": req.query.City,
                "Country": req.query.Country,
                "CountrySubDivisionCode": req.query.CountrySubDivisionCode,
                "PostalCode": req.query.PostalCode
            },
            "Notes": "Here are other details.",
            "DisplayName": req.query.CustomerName
        }, function (err, customer) {
            //if there is an error, render the error page with the error message, else render the createcustomer view
            if (err) {
                res.render('errorpage.ejs', { errorMessage: err.Fault.Error[0] })
            }
            else {
                res.render('createCustomer.ejs', { displayName: customer.DisplayName, billingAddr: customer.BillAddr, id: customer.Id });
            }
        })

    })

    //a route which renders the payment form
    app.get('/createPayment', function (req, res) {
        //using input from createPayment form, creating the createPayment POST body
        qbo.createPayment({
            "CustomerRef":
            {
                "value": req.query.CustomerRef
            },
            "TotalAmt": req.query.TotalAmt,
            "Line": [
                {
                    "Amount": req.query.LineAmt,
                    "LinkedTxn": [
                        {
                            "TxnId": req.query.InvoiceId,
                            "TxnType": "Invoice"
                        }]
                }]
        }, function (err, payment) {
            if (err) {
                res.render('errorPage.ejs', { locals: { errorMessage: err.Fault.Error[0] } })
            }
            else {
                res.render('paymentSuccess.ejs', { Payment: payment })
            }
        })
    })

    //a route which renders the create a customer form
    app.get('/createCustomerForm', function (req, res) {
        res.render('createCustomerForm.ejs');
    })

    //a route which renders the create a sales reciept form
    app.get('/createSalesReceiptForm', function (req, res) {
        miscFunctions.getCustomersItems(qbo);
        function renderPage() {
            res.render('createSalesReceiptForm.ejs', { locals: { customers: qbo.Customers, items: qbo.Items } });
        }
        //Add a timeout of 2000 in order to allow the customers and items response to complete before rendering the page
        setTimeout(renderPage, 2000);
    })

    //a route which calls CreateSalesReciept
    app.get('/createSalesReceipt', function (req, res) {
        //Check to make sure the front end is sending an item selected, if it is null, render the error page
        if (!req.query.itemSelect) {
            res.render('errorPage.ejs', { locals: { errorMessage: { Message: 'No Item Selected', Detail: 'You Must Select an Item' } } })
        }
        else {
            // [0]is the item name, [1]is the item id, [2] is the item unit price
            var ItemRef = req.query.itemSelect.split('; ');
            //building the createSalesReceipt post body
            qbo.createSalesReceipt({
                "Line": [
                    {
                        "Id": "1",
                        "LineNum": 1,
                        "Description": req.query.Description,
                        "Amount": ItemRef[2] * req.query.Qty,
                        "DetailType": "SalesItemLineDetail",
                        "SalesItemLineDetail": {
                            "ItemRef": {
                                "value": ItemRef[1],
                                "name": ItemRef[0]
                            },
                            "UnitPrice": ItemRef[2],
                            "Qty": req.query.Qty,
                            "TaxCodeRef": {
                                "value": "NON"
                            }
                        }
                    }
                ],
                "CustomerRef": {
                    "value": req.query.CustomerId
                }
            }, function (err, SalesReceipt) {
                //render the error page if an error is returned, else, render the salesReciept view
                if (err) {
                    res.render('errorPage.ejs', { locals: { errorMessage: err.Fault.Error[0] } })
                } else {
                    res.render('salesReceipt.ejs', { SalesReceipt: SalesReceipt })
                }
            })
        }
    })

    //a route which accepts a item id
    app.get('/item/:id', function (req, res) {
        qbo.getItem(req.params.id, function (err, item) {
            console.log(item);
            res.render('item.ejs', { locals: { item: item } })
        })
    })

    //a route which creates an inventory valuation summary report
    app.get('/getReport', function (req, res) {
        qbo.reportInventoryValuationSummary(function (err, report) {
            var colData = [];
            var rowData = [];
            var i = 0;

            report.Rows.Row.forEach(function (element) {
                if (element.ColData[2] && element.ColData[0]) {
                    colData[i] = element.ColData[0].value;
                    rowData[i] = element.ColData[2].value;
                    i++;
                }
            }, this);

            var data = [
                {
                    x: colData,
                    y: rowData,

                    type: "bar"
                }
            ];

            rowData.forEach(function (element) {
                console.log('column Data: ' + element )
            })
            //This is for Plot.ly - finish later
            var graphOptions = { filename: "basic-bar", fileopt: "overwrite" };
            plotly.plot(data, graphOptions, function (err, msg) {
                res.render('inventoryChart.ejs', { locals: { chartUrl: msg.url } });
            });
        })
    })

    //a route which populates the Create Item Form with a list of Accounts
    app.get('/createItemForm', function (req, res) {
        //Retrieve all accounts to populate the createItemForm
        qbo.findAccounts(function (_, accounts) {
            res.render('createItemForm.ejs', { locals: { accounts: accounts.QueryResponse.Account } })
        })
    })
    //a route which creates an item, the name is passed in
    app.get('/createItem/', function (req, res) {
        //Checking to make sure that the fields for AssetAccountRef, ExpenseAccountRef, IncomeAccountRef are not null
        if (req.query.AssetAccountRef && req.query.ExpenseAccountRef && req.query.IncomeAccountRef) {
            var ItemName = req.query.ItemName;
            var AssetAccountRef = req.query.AssetAccountRef.split('; ');
            var ExpenseAccountRef = req.query.ExpenseAccountRef.split('; ');
            var IncomeAccountRef = req.query.IncomeAccountRef.split('; ');
            var ItemQuantity = req.query.ItemQty;
            var UnitPrice = req.query.UnitPrice;
            var PurchaseCost = req.query.PurchaseCost;
            var CurrentDate = miscFunctions.GetCurrentDate();

            //qbo createItem Post Body
            qbo.createItem({
                "Name": ItemName,
                "UnitPrice": UnitPrice,
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
                "PurchaseCost": PurchaseCost,
                "Type": "Inventory",
                "TrackQtyOnHand": true,
                "QtyOnHand": ItemQuantity,
                "InvStartDate": CurrentDate
            }, function (err, item) {
                //Render error page if err is returned
                if (err) {
                    res.render('errorPage.ejs', { locals: { errorMessage: err.Fault.Error[0] } })
                }
                //Render createItem on success
                else {
                    console.log(item);
                    res.render('createItem.ejs', { locals: { item: item } })
                }
            })
        }
        //Render an error page when AssetAccountRef, ExpenseAccountRef, IncomeAccountRef are null
        else {
            res.render('errorPage.ejs', { locals: { errorMessage: { Message: 'Missing parameter', Detail: 'You Must Select an Account' } } })
        }
    })
    //a route which creates the invoice form
    app.get('/createInvoiceForm', function (req, res) {
        miscFunctions.getCustomersItems(qbo);
        function renderPage() {
            res.render('customer.ejs', { locals: { customers: qbo.Customers, items: qbo.Items } });
        }
        //Add a timeout of 2000 in order to allow the customers and items response to complete before rendering the page
        setTimeout(renderPage, 1500);
    })

    //a route which creates an invoice
    app.get('/createInvoice', function (req, res) {
        //Check to make sure the front end is sending an item selected, if it is null, render the error page
        if (!req.query.itemSelect) {
            res.render('errorPage.ejs', { locals: { errorMessage: { Message: 'No Item Selected', Detail: 'You Must Select an Item' } } })
        }
        else {
            var CustomerId = req.query.CustomerId;
            var InvoiceQty = req.query.InvoiceQty;
            var ItemRef = req.query.itemSelect.split('; ');
            var InvoiceAmount = req.query.InvoiceAmt;
            var ItemBeforeInvoice;

            //Make getItem request to get Item data
            qbo.getItem(ItemRef[1], function (err, item) {
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
            }, function (err, invoice) {
                //If there is an err, render the errorPage with the errorMessage from the response
                if (err) {
                    res.render('errorPage.ejs', { locals: { errorMessage: err.Fault.Error[0] } })
                }
                else {
                    var Item;
                    //Make a getItem request to get Item data (to highlight difference before and after an invoice is created)
                    qbo.getItem(ItemRef[1], function (err, item) {
                        Item = item;
                    })

                    function renderPage() {
                        res.render('createInvoice.ejs', { ItemBeforeInvoice: ItemBeforeInvoice, Invoice: invoice, Item: Item });
                    }
                    //Add a timeout of 2000 in order to allow the Invoice response to complete before rendering the page
                    setTimeout(renderPage, 2000);
                }

            })
        }
    })

    //a disconnect route to log out


}