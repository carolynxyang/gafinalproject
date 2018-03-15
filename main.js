"use strict";
var map;
function initMap() {
    var uluru = { lat: -25.363, lng: 131.044 };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 2,
        center: uluru
    });
}
// 
class newsItem {
    constructor(thumbnail, title, abstract, publisher, published_date, url, big_picture, geo) {
        this.thumbnail = thumbnail;
        this.title = title;
        this.abstract = abstract;
        this.publisher = publisher;
        this.published_date = published_date;
        this.url = url;
        this.big_picture = big_picture;
        this.geo = geo;
    }
}
// Main code
// Closure and IIFE
(function () {
    //Geo to country
    //Given a list of geo and country list, merge list into country count (ex: Sydney(Australia))

    var countrylist = {};
    var newsList = [];
    function geo2country(geo){
        var output = [];
        for(var i = 0; i < geo.length; i++){
            var item = geo[i];
            var regex = /\(([A-Za-z\s]+)\)/g;
            var myArray = regex.exec(item);
            if(myArray===null){
                output.push(item);
            }else{
                output.push(myArray[1]);
            }
        }
        return output;
    }

    //Convert news items object to html

    function returnHtml(item){
        var output = `<div class="newsitem"><div class="itemleft"><div class="itemimg"><img src="`+item.thumbnail+`"></div></div>`
                    + `<div class="itemright"><div class="itemtitle">`+item.title+`</div>`
                    +`<div class="itemabstract">`+item.abstract+`</div>`
                    +`<div class="itemdate">`+item.published_date+`</div>`
                    +`<div class="itemlink"><a target="_blank" href="`+item.url+`">Open in new tab</a></div></div></div>`
                    ;
        return output;
    }


    //Loading from NYT APi

    var url = "https://api.nytimes.com/svc/news/v3/content/all/world.json";
    url += '?' + $.param({
      'api-key': "409ce17a2ba0409da856ee9f6f817d57",
      'offset': 0,
      'limit': 50,
    });
    $.ajax({
      url: url,
      method: 'GET',
    }).done(function(data) { 
        console.dir(data);
        for (var i = 0; i < data.results.length; i++){
            var x = data.results[i];
            if(x.multimedia.length>0)
            {
                var item = new newsItem(x.multimedia[1].url, x.title, x.abstract, "New York Times", x.published_date, x.url, x.multimedia[x.multimedia.length-1].url, geo2country(x.geo_facet));	
            }else{
                var item = new newsItem("", x.title, x.abstract, "New York Times", x.published_date, x.url, "", geo2country(x.geo_facet));
            }
            newsList.push(item);
        }

        // Create a geo based index of news articles

        for (var i = 0; i < newsList.length; i++){
            var item = newsList[i];
            for(var y = 0; y < item.geo.length; y++){
                if(!(countrylist[item.geo[y]])){
                    countrylist[item.geo[y]]=1;
                }else{
                    countrylist[item.geo[y]]++;
                }
            }
        }
        
        //List to string, Google only accepts country as a string

        var countries="";
        for (var key in countrylist) {
            countries = countries + "'"+ key +"', ";
        }
        countries= countries.substring(0,countries.length - 2);

        console.log(countries);


        //Highlight contries

        var world_geometry = new google.maps.FusionTablesLayer({
            query: {
                select: 'geometry',
                from: '1N2LBk4JHwWpOY4d9fobIn27lfnZ5MDy-NoqqRpk'
            },
            
            styles: [
                {
                    polygonOptions: {
                        fillColor: '#FFFFFF',
                        fillOpacity: 0.001
                    }
                },
                {
                    where: "'Name' in ("+countries+")",
                    polygonOptions: {
                        fillColor: '#2196F3',
                        fillOpacity: 0.5
                    }
                },
                
            ]
            ,
            suppressInfoWindows: true
        });

        
        //News panel

        google.maps.event.addListener(world_geometry, 'click', function (e) {
            console.log(e.row.Name.value);
            var selectedcountry = e.row.Name.value;
            $("#newspanel").html("<div id=\"close\">X</div>");
            
            for (var i = 0; i < newsList.length; i++){
                var item = newsList[i];
                for(var y = 0; y < item.geo.length; y++){
                    if(selectedcountry === item.geo[y])
                    {
                        $("#newspanel").append(returnHtml(item));
                        break;
                    }
                }
            }
            $("#newspanel").show();
        });
        $(document).on("click","#close",function(){
            $("#newspanel").hide();
        });
        world_geometry.setMap(map);
        
        
        
    }).fail(function(err) {
      throw err;
    });
})();