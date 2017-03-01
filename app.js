/*global $*/
$(function(){



  var flights = []; //tableau global des vols
  var cozyEvents = []; //objets Events du data-system cozy
  window.flights = flights;
  var $flightsTable = $("#flights-table"); //tableau du haut avec les vols
  var $cozyEventsTable = $("#cozy-flights-table"); //tableau du milieu avec les Events Cozy

  getCozyFlights(); //récupère les vols précédemment enregistrés (doctype XPFlight)

  $("#add-flight").click(function(){//bouton ajouter du formulaire manuel d'ajout de vol
    addFlight();
  });

  $("#import-from-cozy").click(function(){//bouton importer du calendrier cozy
    cozyEvents = [];// on reset le tableau
    getEventsFromCozy();//fonction récupérer les Events Cozy
  });

  $("#delete-cozy-flights").click(function(e){
    $cozyEventsTable.html("");
  });

  $("#db_button").click(function(){//bouton sauvegarder dans cozy
    updateCozyFlights();
  });

  $flightsTable.on("click","button",function(){//tous les boutons supprimer de la liste des vols (du haut)
    var nb = parseInt($(this).parent().siblings(":first").text());//le numéro à gauche q
    removeFlight(flights.length - nb);//suppression du vol
  });


  $cozyEventsTable.on("click","button",function(){//boutons sur la table des Events Cozy
    var nb = parseInt($(this).parent().siblings(":first").text());
    //le vol cozy[nb] correspond à celui de la ligne cliquée
    var leg = cozyEvents[nb].description,
        date = moment(cozyEvents[nb].start),
        tkof = $(this).parent().prev().prev().children(":first").is(":checked"),
        ldg = $(this).parent().prev().children(":first").is(":checked");

        $(this).parent().parent().html("");//si c'est le bouton supprimer on efface la ligne
        if ($(this).hasClass("btn-success")){//si c'est le bouton ajouter on ajouter le vol
          var newFlight = new Flight(leg,date,tkof,ldg);
          flights.push(newFlight);
          populateTable();
        }
  });


  //////////////////////////////////////////////////////////////////
  //fonctions
  /////////////////////////////////////////////////////////////////


  function updateCozyFlights(){//mise à jour du data system

    //effacer tous les vols de la période donnée et les remplacer par les nouveaux

     cozysdk.destroyByView("XPFlight","all",{}, function(err){//destruction
       for (var i=0; i<flights.length; i++){//puis création
         cozysdk.create("XPFlight", flights[i], function(err, obj){
           if (err){
             console.log("impossible de créer l'objet: ", err);
           } else {
             console.log("Objet créé:", obj._id);
           }
         });
       }
     });
  }

  function getCozyFlights(){// récupère les objets XPFLight dans le data-system
    var oldest = moment.utc().subtract(91, "days"),// ceux de moins de 90 j jusqu'a maintenant
        newest = moment.utc();

    var view = function(doc){
      emit(doc.date, doc);
    }

    cozysdk.defineView("XPFlight","all",view,function(err){
      if(!err){
        cozysdk.run("XPFlight",'all',{startkey:oldest,endkey:newest},function(err,res){
          if(!err){
            console.log("vols dans la DB: ", res);
            if (res.length > 0){
              for (var i=0; i<res.length; i++){
                var value = res[i].value;
                //on récupère tous les XPFlight et on les met dans le tableau global flights[]
                flights.push(new Flight(value.leg,moment(value.date),value.tkof,value.ldg));
              }
              populateTable();
            }
          }
        });
      }
    });


  }

  function populateTable(){// affichage des flights[] dans le tableau du haut
    $flightsTable.html("");//reset
    flights = sortByDate(flights);//tri par date décroissante (le plus récent est [0])
    //console.log(flights);
    for (var i=0;i<flights.length;i++){
      var leg = flights[i].leg,
          date = flights[i].date.format("DD/MM/YYYY"),
          tkof = flights[i].tkof,
          ldg = flights[i].ldg,
          nb = flights.length - i;
      var tRow = createFlightHTMLRow(nb,leg,date,tkof,ldg);//fonction qui créé la ligne html
      $flightsTable.prepend(tRow);//prepend pour mettre les plus ancien en haut

    }
    xpr();//calcul xp récente
  }

  function sortByDate(flightlist){//fonction de tri
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

    //suprimer les vols trop vieux
    var oldLimit = moment().subtract(150,"days");
    var l=list.length;
    for (var i=0; i<l;i++){
      if (list[i].date.isBefore(oldLimit)){
        list.splice(i,1);
        //console.log("vol trop ancien supprimé");
      }
    }

    return list;

  }


  function Flight(leg, date, tkof, ldg){// objet Flight
    this.date = date; //objet moment
    this.leg = leg; //String
    this.tkof = tkof; //boolean
    this.ldg = ldg; //boolean
  }


  function addFlight(){//ajout d'un vol par le formulaire manuel
    var inputs = document.querySelectorAll("#add-flight-table input"); //[]
    $stat = $("#add-flight-status");
    //console.log(inputs);
    var leg = inputs[0].value,
        date = moment(inputs[1].value),//date JS ---> objet moment
        tkof = inputs[2].checked,
        ldg = inputs[3].checked;

    $("#add-flight-table input").val("");// reset des valeurs

    if (leg.length > 35 || leg.length < 1){//test longueur du  nom
      $stat.text("Nom invalide");
      return;
    }

    if (!date.isValid()){//test validité moment.js
      $stat.text("Date invalide");
      return;
    }

    if (date.isBefore(moment().subtract(100,"days"))){//si vol > 100 jours, on ne l'affiche pas
      $stat.text("Vol trop ancien");
      return;
    }

    if (date.isAfter(moment.utc(),"day")){// si vol futur
      $stat.text("Vol futur");
      return;
    }

    $stat.text("");
    flights.push(new Flight(leg,date,tkof,ldg));//ajout du vol dans le tableau global
    populateTable();//m-a-j du tableau du haut

  }

  function removeFlight(nb){//suppression d'un vol du tableau global
    flights.splice(nb,1);
    populateTable();//m-a-j du tableau du haut
  }


  function xpr(){// calcul experience récente
    flights = sortByDate(flights);//tri
    var tkofs = [],
        ldgs = [];
    var $xpr = $("#xpr");

    if (flights.length < 3){//s'il y a moins de 3 vols
      noxp();//xp non valide
      return;
    }
    var i = 0;
    do {
      if (i >= flights.length){//si on parcouru tous les vols sans dépasser 3 déc et 3 atterrissage
        noxp();//xpr non valide
        return;//fin
      }
      if (flights[i].tkof){
        tkofs.push(flights[i].date)//ajoute date du décollage
      }
      if (flights[i].ldg){
        ldgs.push(flights[i].date)//ajoute date de l'atterrissage
      }
      i++;
    } while (tkofs.length < 3 || ldgs.length < 3);//rester dans la boucle tant qu'il y a moins de 3 decollages ou moins de 3 atteros
    //console.log(tkofs);
    //console.log(ldgs);
    //on se retrouve avec les 3 décollaes et 3 atterrisages les plus récents du tableau global flights
    var oldestTkof = tkofs[2],
        oldestLdg = ldgs[2],
        newestTkof = tkofs[0],
        newestLdg = ldgs[0];

    var limit = oldestTkof.clone().add(89,"days");//clone est nécessaire pour ne pas muter l'objet moment initial
    var nextMove = "Un décollage";//on calcule la limite future d'xpr
    if (oldestLdg.isBefore(oldestTkof)){//si c'est un atterrissage
      limit = oldestLdg.clone().add(89,"days");
      nextMove = "Un atterrissage";
    } else if (oldestLdg.isSame(oldestTkof,"day")){//si c'est le même jour il faut une étape complète
      nextMove = "Une étape complète"
    }

    if (limit.isBefore(moment(),"day")){//si la limite future est aujourd'hui...
      noxp();//perdi
      return;
    } else {
      var template = $("#xpr-template").html();
      var rdr = Mustache.render(template,{mvt:nextMove,date:limit.format("DD/MM/YYYY")});
      $xpr.html(rdr);
      $xpr.addClass("alert-success");
      $xpr.removeClass("alert-danger");
    }

    function noxp(){//fonction interne si xp récente non valide
      $xpr.removeClass("alert-success");
      $xpr.addClass("alert-danger");
      $xpr.html("Votre expérience récente n'est plus valide!");

    }

  }

  function createFlightHTMLRow(nb, leg, date, tkof, ldg){//création de l'html pour une ligne de vol tableau du haut
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

  function getEventsFromCozy(){//récupérer les objets Events dans le calendrier cozy
    var view = function(doc){//view qui renvoie les docs ayant le tag 'vol'
          if(doc.start && doc.tags && doc.tags.forEach){
              doc.tags.forEach(function(tag){
                  if(tag === "vol" && doc.start.length > 10){
                    //si start a plus de 10 caractères c'est une date+horaire
                    //précis. utilisé pour enlever les rotations qui on des
                    //dates en jour entier
                    emit(doc.start,doc);
                  }
              });
          }
      }//view

      var oldest = moment().subtract(91,"days").format("YYYY-MM-DD");//on ne récupère que les vols datant de moins
                                                                          //de 91 jours et les vols d'un future proche
      var newest = moment.utc().add(15,"days");
      //console.log(oldest);
      cozysdk.defineView("Event","all",view,function(err){
        if(!err){
          cozysdk.run("Event","all",{startkey:oldest, endkey:newest},function(err,res){
            //console.log("evenements",res);
            var vols = [];//tableau intermediaire
            for(var i=0; i<res.length; i++){
              vols.push(res[i].value);
            }
            //console.log(vols);
            cozyEvents = vols;
            $cozyEventsTable.html("");
            var cozyFlights = cozyEvents;
            //console.log("vols",cozyFlights);

            if (cozyFlights.length >= 0){
              var template = $("#cozy-flight-template").html();
              for(var i=0; i<cozyFlights.length; i++){
                var vol = cozyFlights[i].description;
                var date = moment(cozyFlights[i].start).format("DD/MM/YYYY");
                var rdr = Mustache.render(template,{nb:i,vol:vol,date:date});
                var $row = $(rdr);
                if (moment(cozyFlights[i].start).isAfter(moment.utc())){
                  $row.addClass("future");
                  $("input", $row).prop("disabled",true);
                  $("button", $row).prop("disabled",true);
                }
                $cozyEventsTable.append($row);
              }
            }
          });
        }
      });

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
//
// var testFlight = {
//   leg: "CDG-ORY",
//   date: moment.utc(),
//   takeoff: true,
//   landing: true
// };
//
// cozysdk.create("Flight", testFlight, function(err,obj){
//   if(err !== null){
//     console.log("erreur ", err);
//   } else {
//     console.log("objet créé ", obj._id);
//   }
//});

// function createTestObjects() {
//   flights.push(new Flight("CDG-JFK",moment.utc("2016-11-01"),true, false));
//   flights.push(new Flight("CDG-ATL",moment.utc("2016-12-01"),true, true));
//   flights.push(new Flight("ATL-CDG",moment.utc("2016-12-03"),true, false));
//   flights.push(new Flight("MEX-CDG",moment.utc("2016-11-13"),false, true));
//   flights.push(new Flight("JFK-CDG",moment.utc("2016-11-02"),true, true));
//   flights.push(new Flight("CDG-MEX",moment.utc("2016-11-12"),true, true));
//   flights.push(new Flight("ORY-DTC",moment.utc("2018-11-12"),true, true));
// }
