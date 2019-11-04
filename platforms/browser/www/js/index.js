// State Of Application
const state = {
  rentals: [],
  rental: null,
  data: null,
  inpuSearch: ""
};

// Global Variable
const forms = document.getElementsByClassName("needs-validation");
let db = null;

// Database Function
function createDb() {
  var db_name = "RentalZ";
  var db_version = "1.0";
  var db_describe = "Database for RentalZ application";
  var db_size = 2048;
  db = openDatabase(db_name, db_version, db_describe, db_size, function(
    result
  ) {
    console.log(
      "Database opened Successfully! Or created for the first time !"
    );
    createTable(db);
  });
}

function createTable(db) {
  db.transaction(
    function(tx) {
      tx.executeSql(
        "CREATE TABLE IF NOT EXISTS rentals (id unique primary key, property text, bedrooms text, time datetime, price float, furniture text, notes text, reporter text)",
        [],
        function(transaction, result) {
          console.log(result);
          console.log("Table created Successfully!");
        },
        function(transaction, error) {
          console.log(error);
        }
      );
    },
    transError,
    transSuccess
  );
}

function transError(t, e) {
  console.log(t);
  console.log(e);
  console.error("Error occured ! Code:" + e.code + " Message : " + e.message);
}

function transSuccess(t, r) {
  console.info("Transaction completed Successfully!");
  console.log(t);
  console.log(r);
}

function insertRecords(db, data, callback) {
  if (db) {
    db.transaction(
      function(tx) {
        tx.executeSql(
          "INSERT INTO rentals (id, property, bedrooms, time, price, furniture, notes, reporter) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          data,
          function(transaction, result) {
            console.log(result.insertId);
            console.log("Record inserted Successfully!");
            if (callback) callback();
          },
          function(transaction, error) {
            console.log(error);
          }
        );
      },
      transError,
      transSuccess
    );
  } else {
    console.log("No Database man! wait creating it for you!");
    createDb();
  }
}

function loadRecords(db) {
  db.transaction(function(tx) {
    tx.executeSql("SELECT * FROM rentals", [], function(tx, result) {
      let data = [];
      for (var i = 0, item = null; i < result.rows.length; i++) {
        item = result.rows.item(i);
        data.push(item);
      }
      state.rentals = data.reverse();
    });
  });
}

function getRecord(db, id, callback) {
  db.transaction(function(tx) {
    tx.executeSql("SELECT * FROM rentals WHERE id=?", [id], function(
      tx,
      result
    ) {
      state.rental = result.rows.item(0);
      if (callback) callback();
    });
  });
}

function updateRecord(db, data, callback) {
  db.transaction(
    function(tx) {
      tx.executeSql(
        "UPDATE rentals SET property=?, bedrooms=?, time=?, price=?, furniture=?, notes=?, reporter=? where id=?",
        data,
        function(transaction, result) {
          console.log(result);
          console.info("Record Updated Successfully!");
          if (callback) callback();
        },
        function(transaction, error) {
          console.log(error);
        }
      );
    },
    transError,
    transSuccess
  );
}

function deleteRecord(db, id, callback) {
  db.transaction(
    function(tx) {
      tx.executeSql(
        "DELETE FROM rentals WHERE id=?",
        [id],
        function(transaction, result) {
          console.log(result);
          console.info("Record Deleted Successfully!");
          if (callback) callback();
        },
        function(transaction, error) {
          console.log(error);
        }
      );
    },
    transError,
    transSuccess
  );
}

const app = {
  // Application Constructor
  initialize: function() {
    createDb();
    loadRecords(db);

    this.bindEvents();
  },

  //Setup Event Listener
  bindEvents: function() {
    $("#datetimepicker1").datetimepicker();

    $("input[data-type='currency']").on({
      keyup: function() {
        formatCurrency($(this));
      },
      blur: function() {
        formatCurrency($(this), "blur");
      }
    });

    $(forms[0]).on("submit", function(event) {
      event.preventDefault();
      event.stopPropagation();

      if (forms[0].checkValidity() === true) {
        let data = {};
        $("#myTabContent input").each(function(index, element) {
          data[element.getAttribute("id")] = element.value;
        });

        data["notes"] = $("#myTabContent .notes").val();

        let html = "";
        for (let property in data) {
          if (property === "notes") {
            html += `<strong>${property}</strong> : <span style="white-space: pre;"><br />${data[property]}</span><br />`;
          } else {
            html += `<strong>${property}</strong> : <span>${data[property]}</span><br />`;
          }
        }

        $(".modal.modal-confirm-add-data .modal-body").html(html);
        $(".modal.modal-confirm-add-data").modal("show");
        state.data = data;
      }

      forms[0].classList.add("was-validated");
    });

    $(forms[1]).on("submit", function(event) {
      event.preventDefault();
      event.stopPropagation();

      if (forms[1].checkValidity() === true) {
        let data = {};
        $(".modal.modal-confirm-edit-data input").each(function(
          index,
          element
        ) {
          data[element.getAttribute("id")] = element.value;
        });

        data["notes"] = $(".modal.modal-confirm-edit-data .notes").val();

        const dataInput = [
          data.property,
          data.bedrooms,
          data.time,
          data.price,
          data.furniture,
          data.notes,
          data.reporter,
          state.rental.id
        ];

        updateRecord(db, dataInput, () => {
          const index = state.rentals.findIndex(
            rental => rental.id === state.rental.id
          );
          state.rentals[index] = {
            ...state.rentals[index],
            ...data
          };
          state.rental = null;
          $(forms[1]).trigger("reset");
          displayRentals();
          $(".modal.modal-confirm-edit-data").modal("hide");
        });
      } else {
        forms[1].classList.add("was-validated");
      }
    });

    $(forms[0]).on("reset", function(event) {
      forms[0].classList.remove("was-validated");
    });

    $(".navigation-tab").click(onChangeTabPane);

    $(".modal.modal-confirm-add-data .confirm-btn").click(function() {
      const data = [
        Math.floor(Math.random() * 10000),
        state.data.property,
        state.data.bedrooms,
        state.data.time,
        state.data.price,
        state.data.furniture,
        state.data.notes,
        state.data.reporter
      ];

      insertRecords(db, data, () => {
        state.rentals.unshift({ ...state.data, id: data[0] });
        state.data = null;
        $(forms[0]).trigger("reset");
        $(".modal.modal-confirm-add-data").modal("hide");
      });
    });

    // Delay input search
    let idd = "";
    $("#search-input").on("input", function(e) {
      clearTimeout(idd);
      idd = setTimeout(() => {
        state.inpuSearch = e.target.value;
        displayRentals();
      }, 200);
    });
  }
};

function displayRentals() {
  let html = "";
  $(".rental-card button.trash-btn").off();

  $(".tab-pane.list-tab .rental-card").remove();

  state.rentals
    .filter(rental => {
      if (rental.property.includes(state.inpuSearch)) return true;
      return false;
    })
    .forEach(element => {
      html += `
    <div class="rental-card card mb-3">
      <div class="card-header">
          ${element.property}
      </div>
      <div class="card-body" style="text-align: justify;">
          <div class="row">
              <div class="col-6">
                  <strong style="font-size: 14px;">Bedrooms</strong>
                  <p class="info-detail info-detail-${
                    element.id
                  }" style="font-size: 12px;">${element.bedrooms}</p>
              </div>

              <div class="col-6">
                  <strong style="font-size: 14px;">Price</strong>
                  <p class="info-detail info-detail-${
                    element.id
                  }" style="font-size: 12px;">${element.price}</p>
              </div>

              <div class="col-6">
                  <strong style="font-size: 14px;">Furniture</strong>
                  <p class="info-detail info-detail-${
                    element.id
                  }" style="font-size: 12px;">${element.furniture ||
        "== NONE =="}</p>
              </div>

              <div class="col-6">
                  <strong style="font-size: 14px;">Notes</strong>
                  <p class="info-detail info-detail-${
                    element.id
                  }" style="font-size: 12px;white-space: pre;">${element.notes ||
        "== NONE =="}</p>
              </div>
          </div>

          <div class="btn-group float-right" role="group" aria-label="Basic example">
              <button data-id="${
                element.id
              }" type="button" class="edit-btn btn btn-primary">
                <i class="fa fa-pencil" aria-hidden="true"></i>
              </button>
              <button data-id="${
                element.id
              }" type="button" class="trash-btn btn btn-danger">
                  <i class="fa fa-trash"></i>
              </button>
          </div>
      </div>

      <div class="card-footer text-muted">
          ${element.time} by ${element.reporter}
      </div>
  </div>
    `;
    });

  $(".tab-pane.list-tab").append(html);

  bindDeleteEvent();
  bindEditEvent();
}

function bindEditEvent() {
  $(".rental-card button.edit-btn").click(function(e) {
    $(".modal.modal-confirm-edit-data .confirm-btn").off();

    const id = $(this).data("id");

    getRecord(db, id, () => {
      $(".modal.modal-confirm-edit-data #property").val(state.rental.property);
      $(".modal.modal-confirm-edit-data #bedrooms").val(state.rental.bedrooms);
      $(".modal.modal-confirm-edit-data #furniture").val(
        state.rental.furniture
      );
      $(".modal.modal-confirm-edit-data #notes").val(state.rental.notes);
      $(".modal.modal-confirm-edit-data #price").val(state.rental.price);
      $(".modal.modal-confirm-edit-data #reporter").val(state.rental.reporter);
      $(".modal.modal-confirm-edit-data #time").val(state.rental.time);

      $(".modal.modal-confirm-edit-data").modal("show");

      $(".modal.modal-confirm-edit-data .confirm-btn").click(function() {
        $(forms[1]).trigger("submit");
      });
    });
  });
  $("#datetimepicker2").datetimepicker();
}

function bindDeleteEvent() {
  $(".rental-card button.trash-btn").click(function(e) {
    $(".modal.modal-confirm-delete-data .confirm-btn").off();

    const id = $(this).data("id");

    $(".modal.modal-confirm-delete-data").modal("show");

    $(".modal.modal-confirm-delete-data .confirm-btn").click(function() {
      deleteRecord(db, id, () => {
        state.rentals = state.rentals.filter(rental => rental.id !== id);
        displayRentals();
        $(".modal.modal-confirm-delete-data").modal("hide");
      });
    });
  });
}

function bindViewEvent() {
  $(".rental-card button.show-btn").click(function(e) {
    const id = $(this).data("id");

    if ($(this).hasClass("shown")) {
      $(this).removeClass("shown");
      $(this).html('<i class="fa fa-eye-slash" aria-hidden="true"></i>');
      shave(`.info-detail-${id}`, 999999, { character: " ... " });
    } else {
      $(this).addClass("shown");
      console.log("okiiiii");
      $(this).html('<i class="fa fa-eye" aria-hidden="true"></i>');
      shave(`.info-detail-${id}`, 30, { character: " ... " });
    }
  });
}

function onChangeTabPane() {
  var actived = $(".navigation-tab.active").attr("id");
  if (actived === "home-tab") {
    displayRentals();
  }
}

function formatNumber(n) {
  // format number 1000000 to 1,234,567
  return n.replace(/\D/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatCurrency(input, blur) {
  // appends $ to value, validates decimal side
  // and puts cursor back in right position.

  // get input value
  var input_val = input.val();

  // don't validate empty input
  if (input_val === "") {
    return;
  }

  // original length
  var original_len = input_val.length;

  // initial caret position
  var caret_pos = input.prop("selectionStart");

  // check for decimal
  if (input_val.indexOf(".") >= 0) {
    // get position of first decimal
    // this prevents multiple decimals from
    // being entered
    var decimal_pos = input_val.indexOf(".");

    // split number by decimal point
    var left_side = input_val.substring(0, decimal_pos);
    var right_side = input_val.substring(decimal_pos);

    // add commas to left side of number
    left_side = formatNumber(left_side);

    // validate right side
    right_side = formatNumber(right_side);

    // On blur make sure 2 numbers after decimal
    // if (blur === "blur") {
    //   right_side += "00";
    // }

    // Limit decimal to only 2 digits
    right_side = right_side.substring(0, 2);

    // join number by .
    input_val = "$" + left_side + "." + right_side;
  } else {
    // no decimal entered
    // add commas to number
    // remove all non-digits
    input_val = formatNumber(input_val);
    input_val = "$" + input_val;

    // final formatting
    // if (blur === "blur") {
    //   input_val += ".00";
    // }
  }

  // send updated string to input
  input.val(input_val);

  // put caret back in the right position
  var updated_len = input_val.length;
  caret_pos = updated_len - original_len + caret_pos;
  input[0].setSelectionRange(caret_pos, caret_pos);
}
