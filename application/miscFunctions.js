module.exports = {

    //This function queries QBO to get a list of customers and items
    getCustomersItems: function (qbo) {
        //The first QBO request made in this app is a query to get a list of Customers in the user's company
        qbo.findCustomers({
            limit: 15
        },
            function (e, searchResults) {
                qbo.Customers = searchResults.QueryResponse.Customer;
            })

        //This request finds the first 10 items for which inventory tracking is enabled
        qbo.findItems(
            {
                type: 'Inventory',
                limit: 15
            },
            function (e, searchResults) {
                qbo.Items = searchResults.QueryResponse.Item;
            }, this)

    },
    //Simple function to return date in format yyyy-mm-dd
    GetCurrentDate: function () {
        var today = new Date();
        var dd = today.getDate();
        //The value returned by getMonth is an integer between 0 and 11, referring 0 to January, 1 to February, and so on.
        var mm = today.getMonth() + 1;
        var yyyy = today.getFullYear();
        if (dd < 10) {
            dd = '0' + dd;
        }

        if (mm < 10) {
            mm = '0' + mm;
        }
        today = yyyy + '-' + mm + '-' + dd;
        return today;

    },
    //Function to create the QBO object
    getQbo: function (QuickBooks, args) {
        return new QuickBooks(args.consumerkey,
            args.consumersecret,
            args.token,
            args.secret,
            args.companyid,
            true, // use the Sandbox
            true); // turn debugging on

    }

};