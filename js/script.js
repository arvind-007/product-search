var products;
$(function () {
  const ES_API_URL = "http://localhost:3000/";
  //Get ES token
  $.ajax({
    type: "POST",
    url: ES_API_URL + "generateAuthenticationToken",
    // The key needs to match your method's input parameter (case-sensitive).
    data: JSON.stringify({
      app_name: "products",
      username: "elastic",
      password: "admin123",
      roles: ["user"],
    }),
    contentType: "application/json; charset=utf-8",
    dataType: "json",
    success: function (res) {
      console.log(res);
      sessionStorage.setItem("ES_ACCESS_TOKEN", res.access_token);
    },
    error: function (errMsg) {
      alert(errMsg);
    },
  });

  $("#gsearch").autocomplete({
    source: function (request, response) {
      products.getSearchSuggetions(request, response);
    },
    select: function (event, ui) {
      products.searchProducts(ui.item.value);
    },
    minLength: 3,
  });

  $("#btn-gsearch").click(function () {
    products.searchProducts($("#gsearch").val());
  });

  $(document).on("change", "#product-filter [type=checkbox]", function (ele) {
    $("#btn-gsearch").trigger("click");
  });

  products = {
    filterSelected: false,
    getSearchSuggetions: (request, response) => {
      $.ajax({
        type: "POST",
        beforeSend: function (request) {
          request.setRequestHeader(
            "access_token",
            sessionStorage.getItem("ES_ACCESS_TOKEN")
          );
        },
        url: ES_API_URL + "autocomplete",
        data: JSON.stringify({
          size: 50,
          prefix: request.term,
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
          response(
            res.data.suggest.suggestions[0].options.map((itm) => {
              return itm.text;
            })
          );
        },
        error: function (errMsg) {
          alert(errMsg);
        },
      });
    },
    searchProducts(searchTerm) {
      if ($("#gsearch").length) {
        $("#gsearch").val(searchTerm);
      }
      let aggregations = this.createAggregation();
      let refined_by = this.createRefinedBy();
      $.ajax({
        type: "POST",
        beforeSend: function (request) {
          request.setRequestHeader(
            "access_token",
            sessionStorage.getItem("ES_ACCESS_TOKEN")
          );
        },
        url: ES_API_URL + "search",
        data: JSON.stringify({
          size: 48,
          search_keyword: searchTerm,
          refined_by: refined_by,
          aggs: aggregations,
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: (res) => {
          $("#product-count").text(res.data.hits.total.value);
          this.renderProducts(res.data);
          if (!this.filterSelected) {
            this.renderRefineByFilters(res.data);
            products.filterSelected = false;
          }
        },
        error: (errMsg) => {
          alert(errMsg);
        },
      });
    },
    renderProducts(data) {
      $("#product-list").html("");
      data.hits.hits.map((p) => {
        var src = p._source;
        $("#product-list").append(`
                <div class="col-lg-4 col-md-6 col-sm-6" id="${p._id}">
                    <div class="product__item">
                        <div class="product__item__pic set-bg" data-setbg="${
                          src.imagecode
                            ? src.imagecode
                            : "img/product/default.jpg"
                        }"></div>
                        <div class="product__item__text">
                            <h6><a href="#">${src.invdesc}</a></h6>
                            <h5>$${src.unitsalesprice}</h5>
                        </div>
                    </div>
                </div>
                `);
      });
      $(".set-bg").each(function () {
        var bg = $(this).data("setbg");
        $(this).css("background-image", "url(" + bg + ")");
      });
    },
    renderRefineByFilters(data) {
      $("#product-filter").html("");
      data.aggregations.attributes.key.buckets.map((f) => {
        $("#product-filter").append();
        let filters = "";
        f.value.buckets.map((v) => {
          filters += `<li>
                        <input class="form-check-input" type="checkbox" value="" id="${v.key}" data-val="${v.key}" data-label="${f.key}">
                        <label class="form-check-label" for="${v.key}">
                            ${v.key} (${v.doc_count})
                        </label>
                    </li>`;
        });
        $("#product-filter").append(
          `<div class="sidebar__item"><h4>${f.key} </h4><ul>${filters}</ul></div>`
        );
      });
    },
    createAggregation() {
      return [
        {
          attributes: {
            nested: {
              path: "attributes",
            },
            aggs: {
              key: {
                terms: {
                  field: "attributes.label.keyword",
                },
                aggs: {
                  value: {
                    terms: {
                      field: "attributes.val.keyword",
                    },
                  },
                },
              },
            },
          },
        },
      ];
    },
    createRefinedBy() {
      let refinedByFilters = {
        and: [
          {
            listnames: ["C10_PC"],
          },
        ],
      };

      const obj = {};
      products.filterSelected = false;
      $("#product-filter [type=checkbox]").each(function () {
        let label = $(this).attr("data-label");
        let value = $(this).attr("data-val");

        if ($(this).prop("checked")) {
          if (obj[label]) {
            obj[label].push(value);
          } else {
            obj[label] = [value];
          }
          products.filterSelected = true;
        }
      });

      Object.keys(obj).forEach((label) => {
        refinedByFilters.and.push({
          nested: {
            attributes: {
              "attributes.label.keyword": label,
              "attributes.val.keyword": obj[label],
            },
          },
        });
      });
      return refinedByFilters;
    },
  };
});
