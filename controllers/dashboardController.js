const userModel = require("../models/user");
const storeAdminModel = require("../models/store_admin");
const storeAssistantModel = require("../models/storeAssistant");
const storeModel = require("../models/store");
const customerModel = require("../models/customer");

exports.storeAdminDashboard = async (req, res) => {
  const identifier = req.user.phone_number;

  const storeAdmin = await storeAdminModel.findOne({ identifier });
  if (!storeAdmin) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: {
        statusCode: 404,
        message: "User not found"
      }
    });
  }

  try {
    const data = {};
    const stores = storeAdmin.stores;
    const assistants = storeAdmin.assistants;
    //get number of stores
    data.storeCount = stores.length;
    //get number of assisstants
    data.assistantCount = assistants.length;
    //initialize customer count, new customers and transactions
    data.customerCount = 0;
    data.newCustomers = [];
    data.transactions = [];

    stores.forEach(store => {
      //increment customer count by number of customers in each store
      data.customerCount = data.customerCount + store.customers.length;

      const customers = store.customers;
      let date = new Date();
      //filter customers array to get all new customers
      const newCustomers = customers.filter(element => {
        return element.createdAt.toDateString() == date.toDateString();
      });
      if (newCustomers.length > 0) {
        //push in customer details into new customers array
        newCustomers.forEach(element =>
          data.newCustomers.push({
            name: element.name,
            phone_number: element.phone_number,
            email: element.email
          })
        );
      }

      customers.forEach(customer => {
        //push in transaction details for each customer
        if (customer.transactions.length != 0) {
          let obj = {};
          obj.storeName = store.store_name;
          obj.customerName = customer.name;
          obj.transactions = customer.transactions;

          data.transactions.push(obj);
        }
      });
    });

    function compare(a, b) {
      if (
        a.transactions.createdAt.getTime() > b.transactions.createdAt.getTime()
      )
        return -1;
      if (
        b.transactions.createdAt.getTime() < a.transactions.createdAt.getTime()
      )
        return 1;

      return 0;
    }
    // sort transactions by date in descending order
    data.transactions.sort(compare);

    return res.status(200).json({
      success: true,
      message: "Store Admin dashboard data",
      data: data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: {
        statusCode: 500,
        message: error
      }
    });
  }
};

exports.superAdminDashboard = async (req, res) => {
  const id = req.user.phone_number;

  const User = await storeAdminModel.findOne({ identifier: id });

  //   check if user exists
  if (!User) {
    return res.status(404).json({
      success: false,
      message: "User not found",
      error: {
        statusCode: 404,
        message: "User not found"
      }
    });
  }

  //   check if user is a super admin
  if (User.local.user_role !== "super_admin") {
    return res.status(401).json({
      success: false,
      message: "Unauthorised request",
      error: {
        statusCode: 401,
        message: "Unauthorised request"
      }
    });
  }
  try {
    let users = await storeAdminModel.find({});

    let data = {};
    data.storeAdminCount = users.length;
    data.storesCount = 0;
    data.assistantsCount = 0;
    data.customerCount = 0;

    data.usersCount = 0;

    users.forEach(user => {
      let stores = user.stores;
      data.storesCount += stores.length;
      data.assistantsCount += user.assistants.length;
      stores.forEach(store => {
        let customers = store.customers;
        data.customerCount += customers.length;
      });
    });

    // the total number of users should be = storeAdmin + customers + storeAssistants
    data.usersCount =
      data.storeAdminCount + data.customerCount + data.assistantsCount;
    res.status(200).json({
      success: true,
      message: "Dashboard data",
      data
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: {
        statusCode: 500,
        message: error
      }
    });
  }
};
//utility functions
