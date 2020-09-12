// server.js
// nodeJS file.
// 콘솔에 node server.js라고 치면 서버가 켜진다.

var http = require('http');
var express = require('express');

var app = module.exports.app = express();
var server = http.createServer(app); // server

var fs = require('fs'); // 파일 로드 사용

var io = require('socket.io').listen(server); // socket 사용하는 건데 여기선 필요 없음.

app.locals.pretty = true;

app.use('/', express.static(__dirname)); // 이거 해줘야 html에서 외부 js 파일 연결 가능

//index.html
/*
app.use(express.static('public'));
app.get('/index', function(req, res){
 fs.readFile("index.html", function(err, data){
 	if(err) 
 	{
 		console.log(err);
 		res.writeHead(500);
 		return res.end('Error loading index.html');
 	}
 	else
 	{
 		res.writeHead(200, {'Content-Type' : 'text/html'}); // head type 설정
 		res.end(data); // 로드 html response
 	}
 });
});
*/

//login.html 열기
app.get('/login', function(req, res){
 fs.readFile("login.html", function(err, data){
 	if(err) 
 	{
 		console.log(err);
 		res.writeHead(500);
 		return res.end('Error loading login.html');
 	}
 	else
 	{
 		res.writeHead(200, {'Content-Type' : 'text/html'}); // head type 설정
 		res.end(data); // 로드 html response
 	}
 });
});

//admin.html 열기
app.get('/admin', function(req, res){
 fs.readFile("admin.html", function(err, data){
 	if(err) 
 	{
 		console.log(err);
 		res.writeHead(500);
 		return res.end('Error loading index.html');
 	}
 	else
 	{
 		res.writeHead(200, {'Content-Type' : 'text/html'}); // head type 설정
 		res.end(data); // 로드 html response
 	}
 });
});

var port = process.env.PORT || 8080;

server.listen(port, () => {
	console.log("connect server " + port);
}); // 8080번 포트 사용(default)




/*
function handler (req, res) {
	fs.readFile('index.html', function (err, data) {
		if (err) {
		    console.log(err);
			res.writeHead(500);
			return res.end('Error loading index.html');
		}
		res.writeHead(200);
		res.end(data);
	});
}
*/
// dynamoDB 연결해서 그거 socket 이용해서 js에서 클라이언트로
// 넘겨서 띄우기가 목표

// dynamoDB 연동
// dynamoDB 테이블 값 가져와서 클라이언트에 전송(weakInfo)

var aws = require('aws-sdk');
aws.config.update({region : "ap-northeast-2"});

var dynamodb = new aws.DynamoDB();

var params = {Limit : 100}; // 나열 개수 10개로 제한.

// 현재 계정 및 리전에 있는 테이블 나열
/*
dynamodb.listTables(params, function(err, data){ 
	if(err) console.log(err);
	else console.log(data);
});
*/

//tableTest 테이블 생성
/*
params = {
	TableName : 'tableTest',
	KeySchema : [
		{//required
			AttributeName : 'id',
			KeyType : 'HASH',
			
		},
		{//optional
			AttributeName : 'rank',
			KeyType : 'RANGE',
		}
		],
	AttributeDefinitions : [
		{
			AttributeName : 'id',
			AttributeType : 'S', // S / N / B for string, number, binary
		},
			{
			AttributeName : 'rank',
			AttributeType : 'N', // S / N / B for string, number, binary
		}
	],
	ProvisionedThroughput : { // required provisioned throughput for the table
		ReadCapacityUnits : 1,
		WriteCapacityUnits : 1,
	}
};
dynamodb.createTable(params, function(err, data){
	if(err) console.log(err);
	else console.log(data);
})
*/

var docClient = new aws.DynamoDB.DocumentClient({apiVersion : '2019-02-12'}); // create the dynamoDB service object

// 새로운 항목 생성, 이 때 파티션 키, 정렬 키와 일치하는 값 있을 경우 기존 항목 갱신.
/*
params = {
	TableName : 'tableTest',
	Item : {
		'id' : 'parkdoyun1',
		'rank' : 1,
		'attr' : '새로운 속성 추가' // 두개 중(파티션 키, 정렬 키)에 아니더라도 들어갈 수 있다!
	}
};



docClient.put(params, function(err, data){
	if(err) console.log(err);
	else console.log("put success", data.Item);
})
*/

// 항목 읽기 (id가 'parkdoyun1'인 항목 불러오기)
/*
params = {
	TableName : 'tableTest',
	Key : {
		'id' : "parkdoyun1", // hash key와 range key 모두 사용해야 함.
		'rank' : 1
	}
};

docClient.get(params, function(err, data){
	if(err) console.log(err);
	else console.log(data.Item);
});
*/

//weakInfo read
/*
params = {
	TableName : 'weakInfo',
	Key : {
		'weakID' : "parkdoyun" // hash key와 range key 모두 사용해야 함.
		
	}
};

docClient.get(params, function(err, data){
	if(err) console.log(err);
	else console.log(data.Item);
});
*/

// socket 부분(클라이언트랑 통신)

io.sockets.on('connection', function (socket) {  // 1
	socket.emit('news', { serverData : "서버 작동" });
	
	socket.on('client login', function (data) {  // 2
		console.log(data);
	});
	
	socket.on('pass test', function(data){ // data 받기(form에 있는 data)
		console.log(data.passData);
	});
	
	socket.on('send name', function(data) // 클라이언트로부터 약자 이름 받기
	{
		var name = data.sendData;
		//dynamoDB로 관련 정보 클라이언트에 전부 보내기
		params = {
			TableName : 'weakInfo',
			Key : {
				'weakID' : name // hash key와 range key 모두 사용해야 함.
			}
		};
		// 나중에는 이렇게 말고 배열로 만들어서 하나씩 집어넣어야 할 듯(for문 이용)
		docClient.get(params, function(err, data){
			if(err) console.log(err);
			else // 관련 정보 있다면
			{
				console.log("name : " + data.Item.name + ", age : " + data.Item.age + ", sex : " + data.Item.sex + ", res : (" + data.Item.res_latitude + ", " + data.Item.res_longitude + "), detail : " + data.Item.res_detail
				 + ", feature : " + data.Item.feature);
				//name1 = data.Item.name; // 이렇게도 된다!
				socket.emit('resend name', {name : data.Item.name, age : data.Item.age, feature : data.Item.feature,
					res_lat : data.Item.res_latitude, res_lon : data.Item.res_longitude, sex : data.Item.sex, detail : data.Item.res_detail}); // 꼭 여기에다 넣어야 함!!! 다른 것도 해보자.
			}
		});
		// socket.emit('resend name', {wname : name1}); // 클라이언트로부터 데이터를 받고 다시 전송해야 하는데 너무 빨리 보내버린다.
		
	});
	
	socket.emit('server send test', {uid : socket.id, msg : '서버 접속'}); // 클라이언트로 데이터 전송.
		
	socket.on('disconnect', function(){  // 3
		console.log('접속이 종료되었습니다.');
	});

});