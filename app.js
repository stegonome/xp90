/*global $*/
$(function(){

  // alert("bienvenue dans xp90!");
  var flights = [];
  window.flights = flights;
  var $flightsTable = $("#flights-table");

  testRun();

  $("#add-flight").click(function(){
    addFlight();
  });





/////////// tests
  // $("#flights-table").on("click", "button", function(e){
  //   e.preventDefault();
  //   $(this).parent().parent().remove();
  // });

//  $("#flights-table").append(createFlightHTMLRow("ORY-PTP","25/12/1999",true,true));
////////////////





  //testRun();



  function populateTable(){
    $flightsTable.html("");
    var sortedFlights = sortByDate(flights);
    for (var i=0;i<sortedFlights.length;i++){
      var leg = sortedFlights[i].leg,
          date = sortedFlights[i].date.format("DD/MM/YYYY"),
          tkof = sortedFlights[i].tkof,
          ldg = sortedFlights[i].ldg,
          nb = sortedFlights.length - i;
      var tRow = createFlightHTMLRow(nb,leg,date,tkof,ldg);
      $flightsTable.prepend(tRow);

    }
  }


  function createTestObjects() {
    flights.push(new Flight("CDG-JFK",moment.utc("2016-11-01"),true, false));
    flights.push(new Flight("CDG-ATL",moment.utc("2016-12-01"),true, true));
    flights.push(new Flight("ATL-CDG",moment.utc("2016-12-03"),true, false));
    flights.push(new Flight("MEX-CDG",moment.utc("2016-11-13"),false, true));
    flights.push(new Flight("JFK-CDG",moment.utc("2016-11-02"),true, true));
    flights.push(new Flight("CDG-MEX",moment.utc("2016-11-12"),true, true));
    flights.push(new Flight("ORY-DTC",moment.utc("2018-11-12"),true, true));

  }

  function sortByDate(flightlist){
    var list = flightlist;
    var swapped;
    do {
      swapped = false;
      for (var i=0; i<list.length-1;i++){
        if (list[i].date.isBefore(list[i+1].date)){
          var temp = list[i];
          list[i] = list[i+1];
          list[i+1] = temp;
          swapped = true;
        }
      }
    } while(swapped);

    return list;

  }


  function Flight(leg, date, tkof, ldg){
    this.date = date; //objet moment
    this.leg = leg; //String
    this.tkof = tkof; //boolean
    this.ldg = ldg; //boolean
  }


  function testRun(){
    createTestObjects();
    //console.log(flights);
    console.log(sortByDate(flights));
    populateTable();

  }

  function addFlight(){
    var inputs = document.querySelectorAll("#add-flight-table input"); //[]
    console.log(inputs);
    var leg = inputs[0].value,
        date = moment(inputs[1].value),
        tkof = inputs[2].checked,
        ldg = inputs[3].checked;

    flights.push(new Flight(leg,date,tkof,ldg));
    populateTable();

        //console.log(leg,date,tkof,ldg);
  }

  function createFlightHTMLRow(nb, leg, date, tkof, ldg){
    var str = "<tr><td>" + nb + "</td><td>" + leg + "</td><td>" + date + "</td>";
    if(tkof){
      str += '<td><span class="glyphicon glyphicon-ok"></span></td>';
    } else {
      str += '<td><span class="glyphicon glyphicon-remove"></span></td>';
    }
    if(ldg){
      str += '<td><span class="glyphicon glyphicon-ok"></span></td>';
    } else {
      str += '<td><span class="glyphicon glyphicon-remove"></span></td>';
    }
    str += '<td><button class="btn btn-danger">Supprimer</button></td></tr>';
    return str;

  }

});
