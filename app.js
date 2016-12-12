/*global $*/
$(function(){

  // alert("bienvenue dans xp90!");
  var flights = [];
  window.flights = flights;
  var $flightsTable = $("#flights-table");





/////////// tests
  // $("#flights-table").on("click", "button", function(e){
  //   e.preventDefault();
  //   $(this).parent().parent().remove();
  // });

//  $("#flights-table").append(createFlightHTMLRow("ORY-PTP","25/12/1999",true,true));
////////////////





  testRun();

//  $("#test").datepicker({orientation:"right"});



  function populateTable(){
    $header = $("#header-row");
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
    flights.push(new Flight(moment.utc("2016-11-01"),"CDG-JFK",true, false));
    flights.push(new Flight(moment.utc("2016-12-01"),"CDG-ATL",true, true));
    flights.push(new Flight(moment.utc("2016-12-03"),"ATL-CDG",true, false));
    flights.push(new Flight(moment.utc("2016-11-13"),"MEX-CDG",false, true));
    flights.push(new Flight(moment.utc("2016-11-02"),"JFK-CDG",true, true));
    flights.push(new Flight(moment.utc("2016-11-12"),"CDG-MEX",true, true));
    flights.push(new Flight(moment.utc("2018-11-12"),"ORY-DTC",true, true));

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


  function Flight(date, leg, tkof, ldg){
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
