//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require("dotenv").config() 

const app = express();
const port = 3000;
const now = new Date();

const ATLUSER = process.env.USERNAME
const ATLPASS = process.env.PASSWORD

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));


// create a new database
mongoose.connect("mongodb+srv://"+ ATLUSER +":" + ATLPASS + "@cluster0.yuegq.mongodb.net/myFirstDatabase?retryWrites=true")

// mongoose.connect("mongodb+srv://"+ ATLUSER +":" + ATLPASS + "@cluster0.yuegq.mongodb.net/myFirstDatabase?retryWrites=true")
// mongoose.connect("mongodb+srv://"+ ATLUSER +":" + ATLPASS + "@cluster0.yuegq.mongodb.net/myFirstDatabase?retryWrites=true&w=majority/todolistDB");

// create a new schema called itemsSchema
const itemsSchema = {
  name: String
};

// create a new mongoose based on the schema
const Item = mongoose.model("item", itemsSchema);

// create document
const item1 = new Item({
  name: "Welcome to your todolist!"
});

// create document
const item2 = new Item({
  name: "hit the + button to add new item"
});

// create document
const item3 = new Item({
  name: "<--- hit this to delete an item"
});

// array to hold the documents
const defaultItems = [item1, item2, item3];

// create a new schema called listSchema
const listSchema = {
  name: String,
  items: [itemsSchema]
};

// create a new mongoose.model
const List = mongoose.model("List", listSchema);

// get
app.get("/", (req, res) => {
  // Find all the items inside items collection with mongoose .find({}, callback).
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      // insert the documents into the Item collection.
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err + " " + now.toUTCString());
        } else {
          console.log(
            "Successfully saved default items to Database on " +
              now.toUTCString()
          );
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

// create a custome express route
app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  // this was added to try to resolve the favicon.ico issue
  // if (req.params.customListName == "favicon.ico") return;

  // avoid duplicate list names and show list
  List.findOne({ name: customListName }, (err, foundList) => {
    
    if (!err) {
      if (!foundList) {
        // Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        // this was added to try to resolve the favicon.ico issue
        // list.save(function(){
        //   res.redirect("/"+customListName);
        //   });
          
        list.save();
        res.redirect("/" + customListName);
      } else {
        // Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
});

// this was added to try to resolve the favicon.ico issue
app.get('/favicon.ico', function(req, res) { 
  res.status(204);
  res.end();    
});

// Post to the root route
app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

// delete route that deletes an item from the database.
app.post("/delete", (req, res) => {
  // this provides the id of the checked item
  const checkedItemId = req.body.checkbox;

  // this provides the name of the list an item belongs to
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log(
          "Successfully deleted " +
            checkedItemId +
            " from the " + listName +  " Database on " +
              now.toUTCString()
        );
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      // find the name of the list
      { name: listName },
      // using the id of the items, update the items 
      // the key is the $pull.
      // the value is the field we want to pull from, which shoul be an array, "items".
      // the field needs a value, as in which item in that array of items do we want to pull,
      // the way we're going to find the item inside that array is through its ID, and then provide the value.
      { $pull: { items: { _id: checkedItemId } } },
      // show the results of what is found
      (err, foundList) => {
        if (!err) {
          console.log(
            "Successfully deleted " +
              checkedItemId +
              " from the " + listName +  " Database on " +
              now.toUTCString()
          );
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/work", (req, res) => {
  res.render("list", { listTitle: "Work List", newListItems: workItems });
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.listen(port, () => {
  console.log("Server started on port: " + port + " on " + now.toUTCString());
});
