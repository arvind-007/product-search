$(function () {
    const ES_API_URL = "http://localhost:3000/";
    //Get ES token 
    $.ajax({
        type: "POST",
        url: ES_API_URL + "generateAuthenticationToken",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify({
            "app_name": "products",
            "username": "elastic",
            "password": "admin123",
            "roles": ["user"]
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            console.log(res);
            sessionStorage.setItem("ES_ACCESS_TOKEN", res.access_token);
        },
        error: function (errMsg) {
            alert(errMsg);
        }
    });
    $.ajax({
        type: "POST",
        url: ES_API_URL + "generateAuthenticationToken",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify({
            "app_name": "suggesters",
            "username": "elastic",
            "password": "admin123",
            "roles": ["user"]
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            console.log(res);
            sessionStorage.setItem("ES_ACCESS_TOKEN1", res.access_token);
        },
        error: function (errMsg) {
            alert(errMsg);
        }
    });
    $.ajax({
        type: "POST",
        url: ES_API_URL + "generateAuthenticationToken",
        // The key needs to match your method's input parameter (case-sensitive).
        data: JSON.stringify({
            "app_name": "suggesters1",
            "username": "elastic",
            "password": "admin123",
            "roles": ["user"]
        }),
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        success: function (res) {
            console.log(res);
            sessionStorage.setItem("ES_ACCESS_TOKEN2", res.access_token);
        },
        error: function (errMsg) {
            alert(errMsg);
        }
    });

    $('#gsearch1').autocomplete({
        source: function (request, response) {
            getSearchSuggetions1(request, response);
        },
        select: function (event, ui) {
            searchProducts(ui.item.value);
        },
        minLength: 3
    });
    $('#gsearch2').autocomplete({
        source: function (request, response) {
            getSearchSuggetions2(request, response);
        },
        select: function (event, ui) {
            searchProducts(ui.item.value);
        },
        minLength: 3
    });
    $('#gsearch3').autocomplete({
        source: function (request, response) {
            getSearchSuggetions3(request, response);
        },
        select: function (event, ui) {
            searchProducts(ui.item.value);
        },
        minLength: 3
    });
    $('#gsearch4').autocomplete({
        source: function (request, response) {
            getSearchSuggetions4(request, response);
        },
        select: function (event, ui) {
            searchProducts(ui.item.value);
        },
        minLength: 3
    });
    /*
    
    $('#gsearch').on("input", function () {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(getSearchSuggetions(), 5000);
    });
        console.log("working");
    
    */
    function getSearchSuggetions1(request, response) {
        $.ajax({
            type: "POST",
            beforeSend: function (request) {
                request.setRequestHeader("access_token", sessionStorage.getItem("ES_ACCESS_TOKEN"));
            },
            url: ES_API_URL + "autocomplete",
            data: JSON.stringify({
                "size": 10,
                "prefix": request.term
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                response(res.data.suggest.suggestions[0] ? res.data.suggest.suggestions[0].options.map((itm) => {
                    return itm.text;
                }) : []);
            },
            error: function (errMsg) {
                alert(errMsg);
            }
        });
    }
    function getSearchSuggetions2(request, response) {
        $.ajax({
            type: "POST",
            beforeSend: function (request) {
                request.setRequestHeader("access_token", sessionStorage.getItem("ES_ACCESS_TOKEN1"));
            },
            url: ES_API_URL + "raw",
            data: JSON.stringify({
                "size": 10,
                "_source": ["search_term", "type"],
                "query": {
                    "multi_match": {
                        "query": request.term,
                        "type": "bool_prefix",
                        "fields": [
                            "search_term.sayt",
                            "search_term.sayt._2gram",
                            "search_term.sayt._3gram"
                        ]
                    }
                }
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                response(res.data.hits.hits.map((itm) => {
                    return itm._source.search_term;
                }));
            },
            error: function (errMsg) {
                alert(errMsg);
            }
        });
    }
    function getSearchSuggetions3(request, response) {
        $.ajax({
            type: "POST",
            beforeSend: function (request) {
                request.setRequestHeader("access_token", sessionStorage.getItem("ES_ACCESS_TOKEN1"));
            },
            url: ES_API_URL + "raw",
            data: JSON.stringify({
                "_source": ["search_term", "type"],
                "query": {
                    "match_phrase_prefix": {
                        "search_term.sayt": {
                            "query": request.term
                        }
                    }
                },
                "highlight": {
                    "fields": {
                        "content": {}
                    }
                }
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                response(res.data.hits.hits.map((itm) => {
                    return itm._source.search_term;
                }));
            },
            error: function (errMsg) {
                alert(errMsg);
            }
        });
    }


    function getSearchSuggetions4(request, response) {
        $.ajax({
            type: "POST",
            beforeSend: function (request) {
                request.setRequestHeader("access_token", sessionStorage.getItem("ES_ACCESS_TOKEN2"));
            },
            url: ES_API_URL + "raw",
            data: JSON.stringify({
                "size": 10,
                "_source": [
                    "search_term",
                    "rank"
                ],
                "query": {
                    "bool": {
                        "should": [
                            {
                                "function_score": {
                                    "query": {
                                        "multi_match": {
                                            "query": request.term,
                                            "type": "bool_prefix",
                                            "fields": [
                                                "search_term.sayt",
                                                "search_term.sayt._2gram",
                                                "search_term.sayt._3gram"
                                            ]
                                        }
                                    },
                                    "field_value_factor": {
                                        "field": "rank",
                                        "factor": 3,
                                        "modifier": "sqrt",
                                        "missing": 1
                                    }
                                }
                            },
                            {
                                "bool": {
                                    "filter": [
                                        {
                                            "term": {
                                                "type": {
                                                    "value": "itemcode"
                                                }
                                            }
                                        }
                                    ],
                                    "must": [
                                        {
                                            "match": {
                                                "search_term.5gram": {
                                                    "query": request.term,
                                                    "boost": 0.2
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                }
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                response(res.data.hits.hits.map((itm) => {
                    return `${itm._source.search_term} (${itm._source.rank | '0'})`;
                }));
            },
            error: function (errMsg) {
                alert(errMsg);
            }
        });
    }


    function searchProducts(searchTerm) {
        $.ajax({
            type: "POST",
            beforeSend: function (request) {
                request.setRequestHeader("access_token", sessionStorage.getItem("ES_ACCESS_TOKEN"));
            },
            url: ES_API_URL + "search",
            data: JSON.stringify({
                "size": 10,
                "prefix": searchTerm
            }),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (res) {
                console.log(res.data.hits.hits);
            },
            error: function (errMsg) {
                alert(errMsg);
            }
        });
    }
})