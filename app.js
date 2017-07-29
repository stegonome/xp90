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

        if($(this).hasClass("btn-danger")){
          $(this).parent().parent().html("");//si c'est le bouton supprimer on efface la ligne
        }

        if ($(this).hasClass("btn-success")){//si c'est le bouton ajouter on ajouter le vol
          if(tkof || ldg){//on ajoute seulement s'il y a un mouvement
            var newFlight = new Flight(leg,date,tkof,ldg);
            flights.push(newFlight);
            $(this).parent().parent().html("");//on supprime la ligne.
            $("#cozy-events-status").text("");
            populateTable();
          } else {
            $("#cozy-events-status").text("Impossible d'ajouter un vol sans mouvement.");
            setTimeout(function(){$("#cozy-events-status").text("");}, 2000);
          }
        }
  });


  //////////////////////////////////////////////////////////////////
  //fonctions
  /////////////////////////////////////////////////////////////////


  function updateCozyFlights(){//mise à jour du data system
    $("#db_button").html("Enregistrement en cours...");
    //effacer tous les vols de la période donnée et les remplacer par les nouveaux

     cozysdk.destroyByView("XPFlight","all",{}, function(err){//destruction
       for (var i=0; i<flights.length; i++){//puis création
         cozysdk.create("XPFlight", flights[i], function(err, obj){
           if (err){
             console.log("impossible de créer l'objet: ", err);
           } else {
             console.log("Objet créé:", obj._id);
             $("#db_button").removeClass("btn-info");
             $("#db_button").addClass("btn-success");
             $("#db_button").html("Elements enregistrés dans Cozy...");
           }
         });
       }
     });
     setTimeout(function(){
       $("#db_button").html("Sauvegarder dans Cozy");
       $("#db_button").removeClass("btn-success");
       $("#db_button").addClass("btn-info");
     },3000);
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
    //les 6 derniers vols suffisent, puisque seuls les vols avec mouvements sont comptabilisés
    if (flights.length > 6)flights.length = 6 ;
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
    var oldLimit = moment().subtract(91,"days");
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

    if (leg.length > 35 || leg.length < 1){//test longueur du  nom
      $stat.text("Nom invalide");
      return;
    }

    if (!date.isValid()){//test validité moment.js
      $stat.text("Date invalide");
      return;
    }

    if (date.isBefore(moment().subtract(91,"days"))){//si vol > 91 jours, on ne l'affiche pas
      $stat.text("Vol trop ancien");
      return;
    }

    if (date.isAfter(moment.utc(),"day")){// si vol futur
      $stat.text("Vol futur");
      return;
    }

    if (!tkof && !ldg){//s'il n'y ni décollage, ni atterrissage, ce vol ne sert à rien.
      $stat.text("Vol inutile pour l'expérience récente");
      return;
    }

    $stat.text("");
    $("#add-flight-table input").val("");// reset des valeurs
    $("#add-flight-table input").prop("checked", false);
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
    //on se retrouve avec les 3 décollages et 3 atterrisages les plus récents du tableau global flights
    // var oldestTkof = tkofs[2],
    //     oldestLdg = ldgs[2];
    //
    // var limit = oldestTkof.clone().add(89,"days");//clone est nécessaire pour ne pas muter l'objet moment initial
    // var nextMove = "Un décollage";//on calcule la limite future d'xpr
    // if (oldestLdg.isBefore(oldestTkof)){//si c'est un atterrissage
    //   limit = oldestLdg.clone().add(89,"days");
    //   nextMove = "Un atterrissage";
    // } else if (oldestLdg.isSame(oldestTkof,"day")){//si c'est le même jour il faut une étape complète
    //   nextMove = "Une étape complète"
    // }

    //calcul des 3 prochains mouvements
    function computeNextMove(tkof,ldg){
      var limit = tkof.clone().add(89,"days");
      var nextMove = "Un décollage";//on calcule la limite future d'xpr
      if (ldg.isBefore(tkof)){//si c'est un atterrissage
        limit = ldg.clone().add(89,"days");
        nextMove = "Un atterrissage";
      } else if (ldg.isSame(tkof,"day")){//si c'est le même jour il faut une étape complète
        nextMove = "Une étape complète"
      }
      return {limit:limit,nextMove:nextMove};
    }


    if (computeNextMove(tkofs[2],ldgs[2]).limit.isBefore(moment(),"day")){//si la limite future est aujourd'hui...
      noxp();//perdu
      return;
    } else {
      var template = $("#xpr-template").html();
      var results = [null,null,null];
      for(var i=2;i>=0;i--){
        results[i] = computeNextMove(tkofs[i],ldgs[i]);
        console.log(results);
      }

      var rdr = Mustache.render(template,{mvt:results[2].nextMove,date:results[2].limit.format("DD/MM/YYYY"),
                                          mvt2:results[1].nextMove,date2:results[1].limit.format("DD/MM/YYYY"),
                                          mvt3:results[0].nextMove,date3:results[0].limit.format("DD/MM/YYYY")
                                        });
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
    $("#import-from-cozy").html("Importation...");
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
              var match = false;
              var vol = res[i].value;
              for(var j=0; j<flights.length; j++){
                if(vol.description.trim() === flights[j].leg.trim() && flights[j].date.isSame(vol.start, "day") ){
                  match = true;
                }
              }
              if(!match){//si l'event cozy correspond à un vol déjà dans le tableau global (même intitulé et même date)
                vols.push(res[i].value);//on ne l'ajoute pas.
              }
            }
            //console.log(vols);
            cozyEvents = vols;
            $cozyEventsTable.html("");
            var cozyFlights = cozyEvents;
            //console.log("vols",cozyFlights);

            if (cozyFlights.length >= 0){
              var template = $("#cozy-flight-template").html();//template Mustache
              for(var i=0; i<cozyFlights.length; i++){
                var vol = cozyFlights[i].description;// paramètres pour remplir
                var date = moment(cozyFlights[i].start).format("DD/MM/YYYY");//le template
                var rdr = Mustache.render(template,{nb:i,vol:vol,date:date});//rendering
                var $row = $(rdr);//jquerysation
                if (moment(cozyFlights[i].start).isAfter(moment.utc())){
                  $row.addClass("future");//si c'est un vol futur on peut le
                  $("input", $row).prop("disabled",true);//voir mais pas l'ajouter
                  $("button", $row).prop("disabled",true);//ni cliquer dessus
                }
                $cozyEventsTable.append($row);
              }
            }
          });
        }
      });
      $("#import-from-cozy").html("Importer");

  }

});
