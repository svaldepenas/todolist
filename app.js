//jshint esversion:6

// Imports
const express = require("express");
const mongoose = require("mongoose");
const _ = require("lodash");
const date = require(__dirname + "/date.js");

const PORT = process.env.PORT || 3030;

let collectionItems = [];
let item1 = {};
let item2 = {};
let item3 = {};

// Create & Midllewares Express
const app = express();

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Connect Database
mongoose
  .connect(
    "mongodb+srv://svaldepenas:SuWaaUp6fRddFenX@cluster0.8nml880.mongodb.net/todolistDB"
  )
  .then((conect) => {
    console.log("Connected to DB!");

    // Item Schema & Model
    const itemSchema = {
      name: {
        type: String,
        required: true,
      },
    };

    const Item = mongoose.model("Item", itemSchema);

    // List Schema & Model
    const listSchema = {
      name: String,
      items: [itemSchema],
    };

    const List = mongoose.model("List", listSchema);

    // Routes
    app.get("/", function (req, res) {
      const day = date.getDate();
      Item.find({}).then((items) => {
        if (items.length == 0) {
          item1 = new Item({
            name: "Wellcome to your todolist!",
          });

          item2 = new Item({
            name: "Hit the button + to add a new item.",
          });

          item3 = new Item({
            name: "<-- Hit the to mark as checked item.",
          });

          collectionItems = [item1, item2, item3];

          Item.insertMany(collectionItems)
            .then((insertItems) => console.log("Insert default items."))
            .catch((err) => console.error(err));

          res.render("list", { listTitle: day, newListItems: collectionItems });
        } else {
          res.render("list", { listTitle: day, newListItems: items });
        }
      });
    });

    app.get("/:customListName", function (req, res) {
      const customListName = _.capitalize(req.params.customListName);

      List.findOne({ name: customListName })
        .then((list) => {
          if (!list) {
            console.log("Save default items customer tab");
            const list = new List({
              name: customListName,
              items: collectionItems,
            });
            list.save().then((saved) => res.redirect("/" + customListName));
          } else {
            res.render("list", {
              listTitle: customListName,
              newListItems: list.items,
            });
          }
        })
        .catch((err) => console.error(err));
    });

    app.post("/", function (req, res) {
      const item = req.body.newItem;
      const listName = req.body.list;

      const newItem = new Item({
        name: item,
      });

      newItem
        .save()
        .then((insertItem) => {
          console.log("Item insert : " + newItem.name);
          if (listName && !/\s/g.test(listName)) {
            List.findOne({ name: listName })
              .then((list) => {
                list.items.push(newItem);
                list.save();
                res.redirect("/" + listName);
              })
              .catch((err) => console.error(err));
          } else {
            res.redirect("/");
          }
        })
        .catch((err) => console.error(err));
    });

    app.post("/delete", function (req, res) {
      const id = req.body.checkbok;
      const list = req.body.list;

      List.findOneAndUpdate({}, { $pull: { items: { _id: id } } })
        .then((item) => {
          Item.findByIdAndDelete(id)
            .then((deletedCount) => {
              console.log("Item delete : " + id + ", from list : " + list);
              if (list && !/\s/g.test(list)) {
                res.redirect("/" + list);
              } else {
                res.redirect("/");
              }
            })
            .catch((err) => console.error(err));
        })
        .catch((err) => {
          Item.findByIdAndDelete(id)
            .then((deletedCount) => {
              console.log("Item delete : " + id);
              if (list && !/\s/g.test(list)) {
                res.redirect("/" + list);
              } else {
                res.redirect("/");
              }
            })
            .catch((err) => console.error(err));
        });
    });
  });

app.listen(PORT, function () {
  console.log("Server started on port " + PORT);
});
