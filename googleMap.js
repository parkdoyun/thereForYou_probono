// googleMap.js
// admin 페이지에서 구글 맵과 관련 함수 연결된 js

//google 지도 띄우는 코드.
/*
function initialize() { // 초기화
  var mapProp = {
    center : new google.maps.LatLng(37.450591, 126.657308),
    zoom:5,
    mapTypeId:google.maps.MapTypeId.ROADMAP
  };
  var map = new google.maps.Map(document.getElementById("googleMapDiv"),mapProp);
  
  var testlocation = {lat: 37.450591, lng: 126.657308}
  var marker = new google.maps.Marker({position: testlocation ,map: map})
    
}
*/

//google.maps.event.addDomListener(window, 'load', initialize);

// 초기화, 이 때 모든 위치 정보 띄우고 클릭할 때마다 그곳으로 집중, 색 바뀌도록 설정
function initMap()
{
    var curLocation = {lat : 37.450591, lng : 126.657308}; // 기본 위치는 원래 위경도로 설정.
    
    // create a map object.
    var map = new google.maps.Map(document.getElementById("googleMapDiv"),{
        center : curLocation,
        scrollwheel : false,
        zoom : 16
    });
    
    // create a marker on the map.
    var marker = new google.maps.Marker({
        position : curLocation,
        map : map,
        title : 'Hello World!',
        /*
        icon : {
            path : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale : 5,
            fillColor : "blue",
            fillOpacity : 0.8,
            strokeColor : 'black', // 테두리 색
            strokeWeight : 0.4 // 테두리 두께
        },
        */
        icon : iconRed,
        draggable : false // 이동 불가능
    });
    
    // create a info window of the marker, 여기에 시간이랑 위경도 넣으면 될 듯
    var infoWindow = new google.maps.InfoWindow({
        content: "인하대학교 하이테크센터"
    });
    
    // add a click listener
    marker.addListener('click', function(){ 
        infoWindow.open(map, marker);
    });
    
}

//initMap();



function showMap(tr) // google 지도에서 해당 위치 보여주기, 클릭할 때마다 그곳으로 집중, 색 바뀌도록 설정 & 정보 띄우기
{
    var tr_latitude = position_table.rows[tr.rowIndex].cells[1].innerHTML; // 해당 tr의 위도(0번째 열)
    var tr_longitude = position_table.rows[tr.rowIndex].cells[2].innerHTML; // 해당 tr의 경도(1번째 열)
    
    var tr_position  = new google.maps.LatLng(tr_latitude, tr_longitude);
    map.panTo(tr_position); // 새로운 중심으로 이동
    
    //해당 위치의 마커 색 변경, 정보 창 띄우기
    
    for(var i = 0; i < markers.length; i++)
    {
        //만약 위치 같은 마커 있으면 색상 변경해주고 나가기
        if(markers[i].getPosition().equals(tr_position))
        {
            /*
            markers[i].setIcon({
            path : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale : 5,
            fillColor : "lightCoral",
            fillOpacity : 0.8,
            strokeColor : 'white', // 테두리 색
            strokeWeight : 1.5 // 테두리 두께
            
        });*/
            markers[i].setIcon(iconRed);
        }
        else // 해당 마커 아니면 다 원래 색으로
        {
            /*
            markers[i].setIcon({
                
            path : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale : 5,
            fillColor : "blueViolet",
            fillOpacity : 0.8,
            strokeColor : 'white', // 테두리 색
            strokeWeight : 1.5 // 테두리 두께
             
        });
        */
            markers[i].setIcon(iconPurple);
        }
    }
}