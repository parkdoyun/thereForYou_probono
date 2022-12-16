// adminMyPage.js
// admin 페이지에서 My Page 탭과 연결된 js 

// 일단 보호자 정보 다 띄우고 수정 버튼 누르면 그거 db에서 갱신되도록 만들자

// 폼에 우선 기존 정보 다 띄워놓자.

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

//login_phone 이용해서 정보 찾기 (guardInfo에서)

params = {
	TableName : 'guardInfo',
	Key : {
		'contact' : login_phone // hash key와 range key 모두 사용해야 함.
	}
};
var login_phone_split = login_phone.substring(3, login_phone.length); // length() 이렇게 쓰면 안 됨

document.getElementById("modify_guard_contact").value = login_phone_split;

docClient.get(params, function(err, data){
	if(err) console.log(err);
	else 
	{
	    document.getElementById("modify_guard_name").value = data.Item.name;
	    document.getElementById("modify_guard_email").value = data.Item.email;
	    document.getElementById("modify_guard_pwd").value = data.Item.password;
	}
});



function guardModifyBtn()
{
    var mod_name = document.getElementById("modify_guard_name").value;
    var mod_contact = '+82' + document.getElementById("modify_guard_contact").value;
    var password = document.getElementById("modify_guard_pwd").value;
    
    // guardInfo 갱신(name)
    // 사용자 풀 속성도 갱신해야 함. -> 이름만 변경 가능, 표준 사용자 속성 갱신 불가.
    
    params = {
        TableName : 'guardInfo',
        Key : {
            'contact' : mod_contact,
        },
        ExpressionAttributeNames : { // 이렇게 지정해줘야 한다(예약어)
            "#n" : 'name',
        },
        UpdateExpression : "set #n =:n", // 그냥 name은 예약어라 안 된다! 바꿔야 함.
        ExpressionAttributeValues : {
            ':n' : mod_name
        },
        ReturnValues : 'NONE', // optional (NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW)
        ReturnItemCollectionMetrics : 'NONE', // optional (NONE | SIZE)
        
    };
    
    docClient.update(params, function(err, data){
        if(err) console.log(err);
        else console.log("modify guardInfo success");
    });
    
    //사용자 풀 속성 갱신 -> amplify 이용? password 갱신 가능할 듯
    /* 그냥 사용자 풀에 이름 안 넣기로 함...어떻게 하는지 모르겠다.
     var poolData  = {
     region: 'ap-northeast-2',
     UserPoolId: 'ap-northeast-2_XrucmlaJK',
     ClientId: '544kgd4f8log2j0u7so0ucv5u9'
     };
     
     // 입력한 poolData로 Cognito 변수 생성
     var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
     
     userPool.signIn(mod_contact, password, function(err, result){
       if(err) console.log(err.message);
       else{
           userPool.completeNewPassword(result.user, password, {name : mod_name}, function(err, result){
               if(err) console.log(err);
               else console.log(result.user.getUsername());
           });
       }
     });
 */
   
   alert("수정되었습니다.");
}

function makeRndString() // 랜덤으로 임의의 아이디 생성하는 함수. (15자리)
{
    var total_str =  "abcdefghijklmnopqrstupwxyzABCDEFGHIJKLMNOPQRSTUPWXYZ0123456789";
    var string_len = 15;
    var rndStr = "";
    for(var i = 0; i < string_len; i++)
    {
        rndStr += total_str.charAt(Math.floor(Math.random() * total_str.length));
    }
    return rndStr;
}

function weakSignUpBtn() // 약자 정보 새로 등록하는 곳 -> 한 보호자당 100명이 최대가 되도록 설정.
{
    // 삭제할 때 weakNum 변경되지 않기 때문에 등록할 때 weakNum을 guardNum에서 얻어오는 게 아니라
    // weakInfo에서 제일 높은 숫자 혹은 삭제되어서 비어있는 숫자로 얻어와야 함.
    
    //우선 guardNum에서 weakTotalNum 읽어와서 테이블에 넣기.
    var weakTotalNum; // 넣을 변수
    params = {
    	TableName : 'guardNum',
    	Key : {
    		'contact' : login_phone // hash key와 range key 모두 사용해야 함.
    	}
    };
    
    docClient.get(params, function(err, data){
    	if(err) console.log(err);
    	else
    	{ 
        	weakTotalNum = data.Item.weakTotalNum;
        	weakTotalNum = Number(weakTotalNum); // 숫자로 형변환
        	if(weakTotalNum >= 100)
        	{
        	    alert("현재 등록되어 있는 약자의 수가 " + weakTotalNum +"명입니다. 더 이상 등록할 수 없습니다.");
        	}
        	else
        	{
        	    var weakTotalNum_mod = weakTotalNum + 1;
        	
            	//console.log(weakTotalNum_mod);
            	
            	//guardNum에서 weakTotalNum 갱신
            	
                params1 = {
                    TableName : 'guardNum',
                    Key : {
                        'contact' : login_phone,
                    },
                    ExpressionAttributeNames : { // 이렇게 지정해줘야 한다(예약어)
                        "#n" : 'weakTotalNum',
                    },
                    UpdateExpression : "set #n =:n", // 그냥 name은 예약어라 안 된다! 바꿔야 함.
                    ExpressionAttributeValues : {
                        ':n' : weakTotalNum_mod
                    },
                    ReturnValues : 'NONE', // optional (NONE | ALL_OLD | UPDATED_OLD | ALL_NEW | UPDATED_NEW)
                    ReturnItemCollectionMetrics : 'NONE', // optional (NONE | SIZE)
                    
                };
                
                docClient1.update(params1, function(err, data){
                    if(err) console.log(err);
                    else console.log("modify guardNum success");
                });
                
                
            	//0부터 100까지 쓸 수 있는 signup_weakNum 구하기
            	var signup_weakNum = -1;
            	var arrNum = new Array();
            
            	
            	    params1 = {
                	    TableName : "weakInfo",
                	    KeyConditionExpression : "#c = :c",
                	    ExpressionAttributeNames : {
                	        "#c" : "contact"
                	       
                	    },
                	    ExpressionAttributeValues : {
                	        ":c" : login_phone
                	       
                	    }
                	};
                	docClient1.query(params1, function(err,data){
                	    if(err) console.log(err);
                	    else
                	    {
                	        for(var i = 0; i < 100; i++)
                	        {
                	            arrNum[i] = 0;
                	        }
                	        data.Items.forEach(function(item){
                	            arrNum[item.weakNum] = 1;
                	        })
                	        for(var i = 0; i < 100; i++)
                	        {
                	            //제일 처음으로 0인 것 번호로 함.
                	            if(arrNum[i] == 0)
                	            {
                	                signup_weakNum = i;
                	                console.log(i);
                	                //weakID 임의의 문자열로 생성하기.
                                    var signup_weakID = makeRndString();
                                    var signup_sex;
                                     //여성 : sex - false, 남성 - true
                                    if(document.getElementById("weak_signup_sex").options[0].selected == true) signup_sex = true;
                                    else signup_sex = false;
                                    
                                    //weakInfo에 정보 넣기
                                    //console.log(signup_weakNum + ' ' + document.getElementById("weak_signup_age").value + ' ');
                                    params1 = {
                                    	TableName : 'weakInfo',
                                    	Item : {
                                    		'contact' : login_phone,
                                    		'weakNum' : signup_weakNum,
                                    		'age' : document.getElementById("weak_signup_age").value,
                                    		'feature' : document.getElementById("weak_signup_feature").value,
                                    		'name' : document.getElementById("weak_signup_name").value,
                                    		'res_detail' : document.getElementById("weak_signup_detail").value,
                                    		'res_latitude' : document.getElementById("weak_signup_lat").value,
                                    		'res_longitude' : document.getElementById("weak_signup_lng").value,
                                    		'weakID' : signup_weakID,
                                    		'sex' : signup_sex
                                    	}
                                    };
                                    
                                    
                                    
                                    docClient1.put(params1, function(err, data){
                                    	if(err) console.log(err);
                                    	else console.log("put success", data.Item);
                                    });
                                
                                	alert("등록되었습니다.");
                	                break;
                	            }
                	        }
                	            
                	        
                	        
                	    
                	    }
                	});
                
            
            	
        	}
    	}
    });
}