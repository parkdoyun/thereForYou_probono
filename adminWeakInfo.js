// adminWeakInfo.js
// admin 페이지에서 약자 정보 확인 탭과 연결된 js 

// dynamoDB 연결
// Amazon Cognito 인증 공급자를 초기화합니다
AWS.config.region = 'ap-northeast-2'; // 리전
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-northeast-2:d6bb2785-1a1e-4599-875b-8a2d7ae90a34', // ***관련 자격 증명(cognito) 만들어서 코드 복붙하고 이거 관련 IAM 역할 들어가서 dynamoDBFullAccess 정책 연결 해줘야 한다!!!
});

        
var docClient = new AWS.DynamoDB.DocumentClient();
var docClient1 = new AWS.DynamoDB.DocumentClient();
var params;
var params1;


//var socket = io.connect('http://15.165.115.252:8080/'); // 뒤에 main 이런 거 붙이면 안 됨.

//처음에 관련 약자 정보 다 load 하기(테이블에)
//guardNum에서 먼저 다 읽어옴.(weakNum을 몇명인지)


        
var weakNum; // 보호자와 몇명의 약자가 매칭되어 있는지.
var weakInfoArr = new Array(); // 정보 넣을 배열 생성(weakNum만큼 생성)

var weak_table = document.getElementById("weak_table"); // table 변수
var position_table = document.getElementById("position_table"); // position table 변수

weak_init();

function weak_init()
{
    params = {
        	TableName : 'guardNum',
        	Key : {
        		'contact' : login_phone, // hash key와 range key 모두 사용해야 함.
        	}
        };
        
    docClient.get(params, function(err, data){
    if(err) console.log(err);
    else
    {
        weakNum = data.Item.weakTotalNum;
        var read_check = 0; // 몇명 읽었는지.
        //그만큼 읽어오기(weakInfo 테이블에서)
        for(var i = 0; i < 100; i++)
        {
            if(read_check == weakNum) break;
            params1 = {
                TableName : 'weakInfo',
                Key : {
                    'contact' : login_phone,
                    'weakNum' : i
                }
                
            };
            docClient1.get(params1, function(err, data){
                if(err) console.log(err); // 오류 찍는 게 안 먹는다.
                else if(data.Item == undefined) {} // 안 읽히는 건 이렇게 해줘야 됨
                else
                {
                    read_check++;
                    weakInfoArr[i] = data.Item;
                    //weak table에 새로운 행 추가
                    var new_tr = document.createElement("tr");
                    
                    var td_num = document.createElement("td");
                    td_num.innerHTML = data.Item.weakNum;
                    new_tr.appendChild(td_num);
                    
                    var td_id = document.createElement("td");
                    td_id.innerHTML = data.Item.weakID;
                    new_tr.appendChild(td_id);
                    
                    var td_name = document.createElement("td");
                    td_name.innerHTML = data.Item.name;
                    new_tr.appendChild(td_name);
                    
                    var td_sex = document.createElement("td");
                    if(data.Item.sex == false) td_sex.innerHTML = "여성";
                    else td_sex.innerHTML = "남성";
                    new_tr.appendChild(td_sex);
                    
                    var td_age = document.createElement("td");
                    td_age.innerHTML = data.Item.age;
                    new_tr.appendChild(td_age);
                    
                    var td_lat = document.createElement("td");
                    td_lat.innerHTML = data.Item.res_latitude;
                    new_tr.appendChild(td_lat);
                    
                    var td_lon = document.createElement("td");
                    td_lon.innerHTML = data.Item.res_longitude;
                    new_tr.appendChild(td_lon);
                    
                    var td_detail = document.createElement("td");
                    td_detail.innerHTML = data.Item.res_detail;
                    new_tr.appendChild(td_detail);
                    
                    var td_feature = document.createElement("td");
                	td_feature.innerHTML = data.Item.feature;
                	new_tr.appendChild(td_feature);
                	
                	//btn은 눌릴 때 자기 weakNum을 인자로 해서 찾기로 ex function btnClick(weakNum)
                	
                	
                	var td_del1 = document.createElement("td");
                	var td_del = document.createElement("input");
                	td_del.setAttribute("type", "button");
                	td_del.setAttribute("value", "삭제");
                	td_del.setAttribute("onclick", "delWeak(this)");
                	td_del1.appendChild(td_del);
                	new_tr.appendChild(td_del1);
                	
                	//테이블 행 클릭 시 밑 정보 수정으로 정보 넘어가도록 하자
                	new_tr.setAttribute("onclick", "modClickTr(this)"); // 밑 폼으로 정보 넘어가기
                	new_tr.setAttribute("onmouseover", "colorChangeTr(this)"); // 마우스 올릴 때마다 색 변경
                	new_tr.setAttribute("onmouseout", "colorChangeTrOut(this)"); // 마우스 벗어날 때 
                	
                	weak_table.appendChild(new_tr);
                }
            
            });
            
        }
    }
});
    
}




function colorChangeTr(tr)
{
    tr.style.background = "#afb6e0"; // 배경색 바꾸기
}
function colorChangeTrOut(tr)
{
    tr.style.background = "#ffffff"; // 배경색 바꾸기
}

var weakIDNow; // 현재 띄워놓고 있는 약자의 id 무엇인지

var map; //google map 변수 초기화.
map = new google.maps.Map(document.getElementById("googleMapDiv"),{
                center : {lat : 37.450591, lng : 126.657308}, // 인하대학교 하이테크센터 중심
                scrollwheel : true,
                zoom : 10
            });
var markers = new Array(); // 마커 보관할 배열, 마커 위치랑 비교해서 찾기 위해

var iconPurple = new google.maps.MarkerImage('/image/marker_purple2.png', null, null, null, new google.maps.Size(40,40));
var iconRed = new google.maps.MarkerImage('/image/marker_red2.png', null, null, null, new google.maps.Size(40,40));
var iconStar = new google.maps.MarkerImage('/image/marker_star3.png', null, null, null, new google.maps.Size(40,40));

function modClickTr(tr) // 정보 수정하는 폼으로 정보 넘기기
{
    //alert(weak_table.rows[tr.rowIndex].cells[0].innerHTML); // 이렇게 하면 자기자신 값 얻어올 수 있음
    
    document.getElementById("modify_num").value = weak_table.rows[tr.rowIndex].cells[0].innerHTML;
    document.getElementById("modify_name").value = weak_table.rows[tr.rowIndex].cells[2].innerHTML;
    if(weak_table.rows[tr.rowIndex].cells[3].innerHTML == "여성") document.getElementById("modify_sex").options[1].selected = true;
    else document.getElementById("modify_sex").options[0].selected = true; // 남성
    document.getElementById("modify_age").value = weak_table.rows[tr.rowIndex].cells[4].innerHTML;
    document.getElementById("modify_latitude").value = weak_table.rows[tr.rowIndex].cells[5].innerHTML;
    document.getElementById("modify_longitude").value = weak_table.rows[tr.rowIndex].cells[6].innerHTML;
    document.getElementById("modify_detail").value = weak_table.rows[tr.rowIndex].cells[7].innerHTML;
    document.getElementById("modify_feature").value = weak_table.rows[tr.rowIndex].cells[8].innerHTML;
    
    //위치 정보 테이블에도 위치 정보들 추가
    //추가하기 전에 position table 다 비우기
    while(position_table.rows.length > 1)
    {
        position_table.deleteRow(position_table.rows.length - 1);
    }
    
    
    //누구누구님의 위치정보인지
    document.getElementById("position_name").innerHTML = weak_table.rows[tr.rowIndex].cells[2].innerHTML;
    //positionInfo에서 해당하는 weakID의 모든 정보들 가져와서 테이블에 넣는다.
    weakIDNow = weak_table.rows[tr.rowIndex].cells[1].innerHTML; // 현재 약자 id
    //이 id 가진 약자의 정보들 positionInfo에서 불러오기
    params = {
        	TableName : 'positionInfo',
        	KeyConditionExpression : "#w = :n",
        	ExpressionAttributeNames : {
        	    "#w" : "weakID"
        	},
        	ExpressionAttributeValues : {
        	    ":n" : weakIDNow
        	}
        };
        
    docClient.query(params, function (err, data) {
        if(err) console.log(err);
        else
        {
            var res_latitude = Number(weak_table.rows[tr.rowIndex].cells[5].innerHTML);
            var res_longitude = Number(weak_table.rows[tr.rowIndex].cells[6].innerHTML);
            var res_detail = weak_table.rows[tr.rowIndex].cells[7].innerHTML;
            
            // 새로운 map 생성.
            map = new google.maps.Map(document.getElementById("googleMapDiv"),{
                center : {lat : res_latitude, lng : res_longitude}, // 원래 거주지 중심
                scrollwheel : true,
                zoom : 11
            });
            
            //원래 거주지 마커 추가
            var res_marker = new google.maps.Marker({
                    position :  {lat : res_latitude, lng : res_longitude},
                    map : map,
                    title : 'Hello World!',
                    /*
                    icon : {
                        path : google.maps.SymbolPath.CIRCLE,
                        scale : 5,
                        fillColor : "yellow",
                        fillOpacity : 0.8,
                        strokeColor : 'red', // 테두리 색
                        strokeWeight : 1.5 // 테두리 두께
                    },
                    */
                    icon : iconStar,
                    draggable : false // 이동 불가능
                });
                
                // create a info window of the marker, 여기에 시간이랑 위경도 넣으면 될 듯
                var infoWindow = new google.maps.InfoWindow({
                    content: "원래 거주지" + "<br>[" + res_latitude + ", " + res_longitude + "]<br>" + res_detail
                });
                
                // add a click listener
                res_marker.addListener('click', function(){ 
                    infoWindow.open(map, res_marker);
                });
            
            //마커 넣을 배열 초기화.
            markers.length = 0;
            
            //position table에 추가 & 지도에 마커 추가
            data.Items.forEach(function(item){
                
                var new_tr = document.createElement("tr");
                
                var td_time = document.createElement("td");
                td_time.innerHTML = item.time;
                new_tr.appendChild(td_time);
                    
                var td_lat = document.createElement("td");
                td_lat.innerHTML = item.latitude;
                new_tr.appendChild(td_lat);
                
                var td_lon = document.createElement("td");
                td_lon.innerHTML = item.longitude;
                new_tr.appendChild(td_lon);
                
                var td_del1 = document.createElement("td");
                var td_del = document.createElement("input");
                td_del.setAttribute("type", "button");
                td_del.setAttribute("value", "삭제");
                td_del.setAttribute("onclick", "delPos(this)"); // 삭제 버튼 누르면 해당 위치정보 삭제
                td_del1.appendChild(td_del);
                new_tr.appendChild(td_del1);
                
                new_tr.setAttribute("onclick", "showMap(this)"); // 지도 위치 보여주기
                new_tr.setAttribute("onmouseover", "colorChangeTr(this)"); // 마우스 올릴 때마다 색 변경
                new_tr.setAttribute("onmouseout", "colorChangeTrOut(this)"); // 마우스 벗어날 때 
                
                position_table.appendChild(new_tr);
                
                //지도에 마커 추가
                var curLocation = {lat : item.latitude, lng : item.longitude};
                    
                // create a marker on the map.
                
                var marker = new google.maps.Marker({
                    position : curLocation,
                    map : map,
                    title : 'Hello World!',
                    /*
                    icon : {
                        path : google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        scale : 5,
                        fillColor : "blueViolet",
                        fillOpacity : 0.8,
                        strokeColor : 'white', // 테두리 색
                        strokeWeight : 1.5 // 테두리 두께
                    },
                    */
                    icon : iconPurple,
                    draggable : false // 이동 불가능
                });
                
                // create a info window of the marker, 여기에 시간이랑 위경도 넣으면 될 듯
                var infoWindow = new google.maps.InfoWindow({
                    content: item.time + "<br>[" + item.latitude + ", " + item.longitude + "]"
                });
                
                // add a click listener
                marker.addListener('click', function(){ 
                    infoWindow.open(map, marker);
                });
                
                markers.push(marker); // 마커 배열에 넣기.
    
            })
        }
    });
   
}

function delPos(btn) //해당 위치정보 삭제 함수(positionInfo 테이블에서)
{
    // 삭제하시겠습니까? 대화상자
    if(confirm("삭제하시겠습니까?") == true) // 확인
    {
         // db 테이블에서 해당 정보 삭제
        // weakIDNow로 지금 약자 아이디 가짐
        // 해당 버튼이 position_table에서 어디 열에 있는지 찾자.
        // 이 버튼의 부모(td 객체)의 부모(tr 객체) 찾기
        var parent_tr = btn.parentNode.parentNode; // 부모의 부모 찾기
        var del_time = position_table.rows[parent_tr.rowIndex].cells[0].innerHTML;
        
        
        params = {
            TableName : "positionInfo",
            Key:{
              "weakID" : weakIDNow,
              "time" : del_time
            }
        };
        
        docClient.delete(params, function(err, data){
           if(err) console.log(err);
           else
           {
               console.log("delete success");
               // 표에서 지우기
               position_table.deleteRow(parent_tr.rowIndex);
               
               alert("[" + del_time + "] 정보가 삭제되었습니다.");
           }
        });
        
        
        
    }
    else // 취소
    {
        alert("삭제가 취소되었습니다.");
        return;
    }
   
}

function delWeak(btn) // 약자 정보 지우는 버튼
{
    // 삭제하시겠습니까? 대화상자
    if(confirm("삭제하시겠습니까?") == true) // 확인
    {
        //해당 열을 누르지 않고 삭제할 수도 있으니 weakID 다시 구하자
        var weak_del_tr = btn.parentNode.parentNode; // 삭제 누른 버튼이 있는 tr 객체.
        var delWeakID = weak_del_tr.cells[1].innerHTML; // 이런 식으로 쓰는 게 더 간단.
       
        
        //positionInfo에서 관련 정보 다 지우고
        
        for(var i = 1; i < position_table.rows.length; i++) // 첫번째 열 지우면 안 되므로
        {
            var del_time = position_table.rows[i].cells[0].innerHTML;
            params = {
            TableName : "positionInfo",
            Key:{
              "weakID" : delWeakID,
              "time" : del_time
            }
        };
        
        docClient.delete(params, function(err, data){
           if(err) console.log(err);
           else
           {
               console.log("delete success");
           }
        });
        
        }
        
        //position table 비운다
        while(position_table.rows.length > 1)
        {
            position_table.deleteRow(position_table.rows.length - 1);
        }
        
        
        //weakInfo도 지우기
        var delWeakName = weak_del_tr.cells[2].innerHTML; // 이름 얻어오기
        var delWeakNum = weak_del_tr.cells[0].innerHTML;
        delWeakNum = Number(delWeakNum); // 숫자로 형변환.
        
        params = {
            TableName : "weakInfo",
            Key:{
              "contact" : login_phone,
              "weakNum" : delWeakNum
            }
        };
        
        docClient.delete(params, function(err, data){
           if(err) console.log(err);
           else
           {
               console.log("delete success");
           }
        });
        
        // 나머지 weakInfo 애들 weakNum 갱신시키기.(그 뒤 애들만 1 줄임) -> 불가능.(정렬키 수정 불가능하다)
        // 우선 total weak 몇명인지 찾기.
        var totalWeakNum;
        params = {
        	TableName : 'guardNum',
        	Key : {
        		'contact' : login_phone, // hash key와 range key 모두 사용해야 함.
        	}
        };
        
        docClient.get(params, function(err, data){
        if(err) console.log(err);
        else
        {
            totalWeakNum = data.Item.weakTotalNum;
            totalWeakNum = Number(totalWeakNum) - 1; // 하나 줄임
             //guardNum weakTotalNum 하나 줄이고
             params = {
                TableName : 'guardNum',
                Key : {
                    'contact' : login_phone,
                },
                ExpressionAttributeNames : { // 이렇게 지정해줘야 한다(예약어)
                    "#n" : 'weakTotalNum',
                },
                UpdateExpression : "set #n =:n", // 그냥 name은 예약어라 안 된다! 바꿔야 함.
                ExpressionAttributeValues : {
                    ':n' : totalWeakNum
                },
                ReturnValues : 'NONE', // optional (NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW)
                ReturnItemCollectionMetrics : 'NONE', // optional (NONE | SIZE)
                
            };
            
            docClient.update(params, function(err, data){
                if(err) console.log(err);
                else console.log("modify guardNum success");
            });
            
            
            //weak table 지우고 다시 불러오기.
            while(weak_table.rows.length > 1)
            {
                weak_table.deleteRow(weak_table.rows.length - 1);
            }
            weak_init();
        }
        });
        alert(delWeakName + "님의 정보가 전부 삭제되었습니다.");
    }
    else // 취소
    {
        alert("삭제가 취소되었습니다.");
        return;
    }
}

function searchBtnClick() // 약자 정보 중에서 이름 검색하는 버튼
{
    // 일단 다 지운다
    while(weak_table.rows.length > 1)
    {
        weak_table.deleteRow(weak_table.rows.length - 1);
    }
    // 만약에 이름 검색 칸 비어있는데 클릭했다면 다 로드한다
    // 비어있지 않다면 그 이름만 출력하도록
    if(document.getElementById("search_name").value == "") // 비었다면
    {
        weak_init();
    }
    else
    {
        var search_name = document.getElementById("search_name").value;
        params = {
        	TableName : 'weakInfo',
        	ProjectionExpression : "#c, #n, weakNum, age, feature, res_latitude, res_longitude, res_detail, sex, weakID",
        	FilterExpression : "#c = :c and #n = :n",
        	ExpressionAttributeNames : {
        	    "#c" : "contact",
        	    "#n" : "name"
        	   
        	},
        	ExpressionAttributeValues : {
        	    ":c" : login_phone, 
        	    ":n" : search_name
        	    
        	}
        };
        
        docClient.scan(params, function(err, data){ // 해당하는 것들만 테이블에 집어넣음. 이건 query()가 안 먹어서 scan했더니 된다.
            if(err) console.log(err);
            else{
                data.Items.forEach(function(item){
                    var new_tr = document.createElement("tr");
                    
                    var td_num = document.createElement("td");
                    td_num.innerHTML = item.weakNum;
                    new_tr.appendChild(td_num);
                    
                    var td_id = document.createElement("td");
                    td_id.innerHTML = item.weakID;
                    new_tr.appendChild(td_id);
                    
                    var td_name = document.createElement("td");
                    td_name.innerHTML = item.name;
                    new_tr.appendChild(td_name);
                    
                    var td_sex = document.createElement("td");
                    if(item.sex == false) td_sex.innerHTML = "여성";
                    else td_sex.innerHTML = "남성";
                    new_tr.appendChild(td_sex);
                    
                    var td_age = document.createElement("td");
                    td_age.innerHTML = item.age;
                    new_tr.appendChild(td_age);
                    
                    var td_lat = document.createElement("td");
                    td_lat.innerHTML = item.res_latitude;
                    new_tr.appendChild(td_lat);
                    
                    var td_lon = document.createElement("td");
                    td_lon.innerHTML = item.res_longitude;
                    new_tr.appendChild(td_lon);
                    
                    var td_detail = document.createElement("td");
                    td_detail.innerHTML = item.res_detail;
                    new_tr.appendChild(td_detail);
                    
                    var td_feature = document.createElement("td");
                	td_feature.innerHTML = item.feature;
                	new_tr.appendChild(td_feature);
                	
                	//btn은 눌릴 때 자기 weakNum을 인자로 해서 찾기로 ex function btnClick(weakNum)
                	
                	
                	var td_del1 = document.createElement("td");
                	var td_del = document.createElement("input");
                	td_del.setAttribute("type", "button");
                	td_del.setAttribute("value", "삭제");
                	td_del1.appendChild(td_del);
                	new_tr.appendChild(td_del1);
                	
                	//테이블 행 클릭 시 밑 정보 수정으로 정보 넘어가도록 하자
                	new_tr.setAttribute("onclick", "modClickTr(this)"); // 밑 폼으로 정보 넘어가기
                	new_tr.setAttribute("onmouseover", "colorChangeTr(this)"); // 마우스 올릴 때마다 색 변경
                	new_tr.setAttribute("onmouseout", "colorChangeTrOut(this)"); // 마우스 벗어날 때 
                	
                	weak_table.appendChild(new_tr);
                });
            }
        });
    }
}

function weakInfoModBtn() // 약자 정보 dynamoDB에 연결해서 수정하는 버튼
{
    var sex;
    if(document.getElementById("modify_sex").options[0].selected == true) sex = true;
    else sex = false;
    //console.log(typeof document.getElementById("modify_num").value); // string이므로 형변환 필요!!
    params = {
                TableName : 'weakInfo',
                Key : {
                    'contact' : login_phone,
                    'weakNum' : Number(document.getElementById("modify_num").value),
                },
                ExpressionAttributeNames : { // 이렇게 지정해줘야 한다(예약어)
                    "#n" : 'name',
                },
                UpdateExpression : "set #n =:n, age = :a, feature = :f, res_latitude = :rlat, res_longitude = :rlon, res_detail = :rd, sex = :s", // 그냥 name은 예약어라 안 된다! 바꿔야 함.
                ExpressionAttributeValues : {
                    ':n' : document.getElementById("modify_name").value,
                    ":a" : document.getElementById("modify_age").value,
                    ":f" : document.getElementById("modify_feature").value,
                    ":rlat" : document.getElementById("modify_latitude").value,
                    ":rlon" : document.getElementById("modify_longitude").value,
                    ":rd" : document.getElementById("modify_detail").value,
                    ":s" : sex,
                },
                ReturnValues : 'NONE', // optional (NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW)
                ReturnItemCollectionMetrics : 'NONE', // optional (NONE | SIZE)
                
            };
            
            docClient.update(params, function(err, data){
                if(err) console.log(err);
                else 
                {
                    console.log("modify weakInfo success");
                    alert("수정되었습니다.");
                }
            });
            
}

        /* batchGetItem 인식 x, 이렇게 하는 게 아닌 듯.
params = {
    RequestItems:{
        'weakInfo' : {
            Keys : [
                {'contact' : login_phone}
                ],
                ProjectionExpression : 'contact, age'
        }
    }
};

docClient.batchGetItem(params, function(err, data){
    if(err) console.log(err);
    else{
        data.Responses.weakInfo.forEach(function(element, index, array)
        {
            console.log(element);
        });
    }
});
*/

     /*       
            function searchBtnClick() // 이름 검색해서 나오는 관련 정보 다 load하기.(테이블 보고 관련 정보만 load하기)
            {
                // 기존에 있던 테이블 다 지우고 새로 업데이트
                
                var weak_table = document.getElementById("weak_table");
                while(weak_table.rows.length > 1)
                {
                    weak_table.deleteRow(weak_table.rows.length - 1);
                }
                
                var name = document.getElementById("search_name").value;
                //이 이름인 사람들의 정보 다 테이블에 로드하기.
                //서버에 이름 보내고 정보 다시 받기
                socket.emit('send name', {sendData : name}); // id 보내기
                
                
            }
            socket.on('resend name', function(data) // 서버에서 받은 정보 띄우기.(나중에 배열로 한방에 띄울거임)
                {
                    //원래는 밑에 table에 띄워야 함! 임시로 폼에 띄움.
                    document.getElementById("modify_name").value = data.name; // div가 innerHTML이고 input은 value 
                	document.getElementById("modify_age").value = data.age;
                	document.getElementById("modify_latitude").value = data.res_lat;
                	document.getElementById("modify_longitude").value = data.res_lon;
                	document.getElementById("modify_feature").value = data.feature;
                	document.getElementById("modify_detail").value = data.detail;
                	if(data.sex == false) document.getElementById("modify_sex").options[1].selected = true; // 여성이면
                	else document.getElementById("modify_sex").options[0].selected = true; // 남성
                	
                	//table에 띄워보기.
                	
                	var weak_table = document.getElementById("weak_table");
                	
                	var new_tr = document.createElement("tr");
                	
                	var td_name = document.createElement("td");
                	td_name.innerHTML = data.name;
                	new_tr.appendChild(td_name);
                	
                	var td_sex = document.createElement("td");
                	if(data.sex == false) td_sex.innerHTML = "여성" // 여성이면
                	else td_sex.innerHTML = "남성" // 남성
                	new_tr.appendChild(td_sex);
                	
                	var td_age = document.createElement("td");
                	td_age.innerHTML = data.age;
                	new_tr.appendChild(td_age);
                	
                	var td_latitude = document.createElement("td");
                	td_latitude.innerHTML = data.res_lat;
                	new_tr.appendChild(td_latitude);
                	
                	var td_longitude = document.createElement("td");
                	td_longitude.innerHTML = data.res_lon;
                	new_tr.appendChild(td_longitude);
                	
                	var td_detail = document.createElement("td");
                	td_detail.innerHTML = data.detail;
                	new_tr.appendChild(td_detail);
                	
                	var td_feature = document.createElement("td");
                	td_feature.innerHTML = data.feature;
                	new_tr.appendChild(td_feature);
                	
                	var td_mod1 = document.createElement("td"); // td 안에 버튼 넣어야함
                	var td_mod = document.createElement("input");
                	td_mod.setAttribute("type", "button");
                	td_mod.setAttribute("value", "수정");
                	td_mod1.appendChild(td_mod);
                	new_tr.appendChild(td_mod1);
                	
                	var td_del1 = document.createElement("td");
                	var td_del = document.createElement("input");
                	td_del.setAttribute("type", "button");
                	td_del.setAttribute("value", "삭제");
                	td_del1.appendChild(td_del);
                	new_tr.appendChild(td_del1);
                	
                	
                	weak_table.appendChild(new_tr);
                	
                });
                
                */