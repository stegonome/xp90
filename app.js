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

  $("#flights-table").on("click","button",function(){
    var nb = parseInt($(this).parent().siblings(":first").text());
    removeFlight(flights.length - nb);
  });


  function populateTable(){
    $flightsTable.html("");
    flights = sortByDate(flights);
    console.log(flights);
    for (var i=0;i<flights.length;i++){
      var leg = flights[i].leg,
          date = flights[i].date.format("DD/MM/YYYY"),
          tkof = flights[i].tkof,
          ldg = flights[i].ldg,
          nb = flights.length - i;
      var tRow = createFlightHTMLRow(nb,leg,date,tkof,ldg);
      $flightsTable.prepend(tRow);

    }
    xpr();
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
    //trier la liste du plus récent au plus ancien
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

    //suprrimer les vols trop vieux
    var oldLimit = moment().subtract(150,"days");
    var l=list.length;
    for (var i=0; i<l;i++){
      if (list[i].date.isBefore(oldLimit)){
        list.splice(i,1);
        console.log("vol trop ancien supprimé");
      }
    }

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
    populateTable();
  }

  function addFlight(){
    var inputs = document.querySelectorAll("#add-flight-table input"); //[]
    //var inputs = $("#add-flight-table input");
    $stat = $("#add-flight-status");
    console.log(inputs);
    var leg = inputs[0].value,
        date = moment(inputs[1].value),
        tkof = inputs[2].checked,
        ldg = inputs[3].checked;

    $("#add-flight-table input").val("");

    if (leg.length > 20 || leg.length < 1){
      $stat.text("Nom invalide");
      return;
    }

    if (!date.isValid()){
      $stat.text("Date invalide");
      return;
    }

    if (date.isBefore(moment().subtract(150,"days"))){
      $stat.text("Vol trop ancien");
      return;
    }

    if (date.isAfter(moment.utc(),"day")){
      $stat.text("Vol futur");
      return;
    }

    $stat.text("");
    flights.push(new Flight(leg,date,tkof,ldg));
    populateTable();

        //console.log(leg,date,tkof,ldg);
  }

  function removeFlight(nb){
    flights.splice(nb,1);
    populateTable();
  }


  function xpr(){
    flights = sortByDate(flights);
    var tkofs = [],
        ldgs = [];
    var $xpr = $("#xpr");

    if (flights.length < 3){
      noxp();
      return;
    }
    var i = 0;
    do {
      if (i >= flights.length){
        noxp();
        return;
      }
      if (flights[i].tkof){
        tkofs.push(flights[i].date)
      }
      if (flights[i].ldg){
        ldgs.push(flights[i].date)
      }
      i++;
    } while (tkofs.length < 3 || ldgs.length < 3);
    //console.log(tkofs);
    //console.log(ldgs);
    var oldestTkof = tkofs[2],
        oldestLdg = ldgs[2],
        newestTkof = tkofs[0],
        newestLdg = ldgs[0];

    var limit = oldestTkof.clone().add(89,"days");
    var nextMove = "Un décollage";
    if (oldestLdg.isBefore(oldestTkof)){
      limit = oldestLdg.clone().add(89,"days");
      nextMove = "Un atterrissage";
    } else if (oldestLdg.isSame(oldestTkof,"day")){
      nextMove = "Une étape complète"
    }

    if (limit.isBefore(moment(),"day")){
      noxp();
      return;
    } else {
      var template = $("#xpr-template").html();
      var rdr = Mustache.render(template,{mvt:nextMove,date:limit.format("DD/MM/YYYY")});
      $xpr.html(rdr);
      $xpr.addClass("alert-success");
      $xpr.removeClass("alert-danger");
    }

    function noxp(){
      $xpr.removeClass("alert-success");
      $xpr.addClass("alert-danger");
      $xpr.html("Votre expérience récente n'est plus valide!");

    }

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


//debug
//
// var cozyrot = {
//     docType         : "event",
//     start           : "2017-01-25",
//     end             : "2017-01-26",
//     place           : "DTC",
//     details         : "rien de bien passionnant",
//     description     : "Un évènement",
//     rrule           : "",
//     tags            : ["vol"],
//     attendees       : [],
//     related         : "",
//     timezone        : "UTC",
//     alarms          : [],
//     created         : new Date().toDateString(),
//     lastModification: "",
// };
//
// cozysdk.create("Event",cozyrot,function(err,res){
//   console.log(res.id);
// });
