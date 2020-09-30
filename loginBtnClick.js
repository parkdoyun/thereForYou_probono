// loginBtnClick.js
// login 페이지에서 회원가입, 인증, 로그인 관련 js 담고 있음.  

 // 사용할 User Pool의 정보를 담고있는 변수입니다.
 var poolData  = {
     region: 'ap-northeast-2',
     UserPoolId: 'ap-northeast-2_XrucmlaJK',
     ClientId: '3965r37si0nrttfseujq9e1cr'
     
 };
 

 //require()은 nodeJS에서만 사용 가능.
 // ***앱 클라이언트 생성 시 클라이언트 보안키 생성 옵션 해제해야 쓸 수 있다!!
 // 입력한 poolData로 Cognito 변수 생성
 // 항상 필요한 데이터 모두 들어가야 한다.
 
var userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

// 나중에 dynamoDB 연결을 위해 전역 변수로 해준다.
 // Amazon Cognito 인증 공급자를 초기화합니다
        AWS.config.region = 'ap-northeast-2'; // 리전
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: 'ap-northeast-2:d6bb2785-1a1e-4599-875b-8a2d7ae90a34', // ***관련 자격 증명(cognito) 만들어서 코드 복붙하고 이거 관련 IAM 역할 들어가서 dynamoDBFullAccess 정책 연결 해줘야 한다!!!
        });

        
        var docClient = new AWS.DynamoDB.DocumentClient(); // 에러 해결, guardInfo table에 정보 넣는다.
        var params;

// 아래 변수는 회원가입을 하고 가입이 성공했을 때 사용자 정보를 반환받는 변수인데,
// 회원가입 함수와 인증 함수에서 같은 객체를 사용해야하기 때문에 전역변수로 뺐습니다.
var cognitoUser;

//가입
function submitSignUp() {
  // 가입할 때 사용자가 입력한 정보들을 저장할 배열입니다.
	  var attributeList = [];

	  var email = document.getElementById("signup_email").value;
	  var password = document.getElementById("signup_pwd").value;
	  var phone = '+82' + document.getElementById("signup_phone").value; // +8201094292169 이런 형식으로 저장돼야 함
	  var name = document.getElementById("signup_name").value;
	  
	  // 변수명은 자유롭게 사용가능하나, Name은 AWS Cognito에서 정해주는대로 써야합니다.
    // 목록 : address, birthdate, email, family_name, gender, given_name, locale
    //   , middle_name, name, nickname, phone_number, picture, preferred_username
    //   , profile, timezone, updated_at, website
    
	  var dataEmail = {
	    Name: 'email',
	    Value : email
	  };
	  
	 /* 
	  var dataName = { -> 이름 사용자풀에서 제외, db에만 push
	    Name : 'name',
	    Value : name
	  };
*/
// Attribute를 AWS Cognito가 알아들을 수 있는 객체로 만듭니다.
	  var attributeEmail = new AmazonCognitoIdentity.CognitoUserAttribute(dataEmail);
	 // var attributeName = new AmazonCognitoIdentity.CognitoUserAttribute(dataName);
	  
	  // 방금 위에서 만든 Attribute 객체를 Attribute List에 추가시킵니다.
    // 이렇게 배열에 다 추가시키고 한번에 Cognito에 넘길겁니다.
	  attributeList.push(attributeEmail);
	 // attributeList.push(attributeName);
	  
	  // 전역변수로 만들어 놓은 User Pool 객체에서는 signup 함수를 제공합니다.
	   userPool.signUp(phone, password, attributeList, null, function (err, result) {
        if (err) {
        	alert(err.message);
          return;
        }

        console.log('user name is ' + result.user.getUsername());
        console.log('call result: ' + result);
        
        // 가입이 성공하면 result에 가입된 User의 정보가 되돌아 옵니다.
        // 인증 함수에서 사용해야하기에 위에서 만든 전역변수인 cognitoUser에 넣어놓습니다.
        cognitoUser = result.user;
        //cognitoUser.getUsername() 이렇게 사용 가능!
        
        // dynamoDB guardInfo 테이블에 위의 정보 다 push.
        
        params = {
            TableName : 'guardInfo',
            Item : {
                'contact' : phone,
                'email' : email,
                'name' : name,
                'password' : password
            }
        };
        
       
        
        docClient.put(params, function(err, data){
            if(err) console.log(err);
            else console.log('put success', data.Item);
        });
        
        //guardNum에 contact 저장, weakTotalNum 0으로 초기화.
        params = {
            TableName : 'guardNum',
            Item : {
                'contact' : phone,
                'weakTotalNum' : 0
            }
        };
        
        docClient.put(params, function(err, data){
            if(err) console.log(err);
            else console.log('put success', data.Item);
        });
        
        alert("가입 성공! 이메일로 인증해 주세요.");
      });
	  
	}
	
	// 인증
	function submitVerify()
	{
	  // 회원가입을 하면 User Pool을 어떻게 만들었냐에 따라서 email 또는 phone으로 인증코드가 발송됩니다.
    // 사용자로부터 인증코드를 입력받아옵니다.
    var user_verifycode = document.getElementById("verify_code").value;
    
    //cognitoUser 변수에 정보 다 넣어준다.(이름, 전화번호, 비밀번호, 이메일) -> 안 된다. 가입하고 바로 인증하게 하자!
    /*
    cognitoUser.username = document.getElementById("signup_phone").value;
    cognitoUser.name = document.getElementById("signup_name").value;
    cognitoUser.email = document.getElementById("signup_email").value;
    cognitoUser.password = document.getElementById("signup_pwd").value;
    */
    
    // cognitoUser는 가입함수에서 가입 성공 후 되돌아온 사용자 정보가 담겨있습니다.
    // 이 변수에서 바로 confirmRegistration함수를 수행하면 AWS Cognito로 인증 요청을 합니다.
    // 인자는 인증코드, true(이것도 알아봐야합니다..ㅎㅎ), callback 함수 입니다.
    cognitoUser.confirmRegistration(user_verifycode, true, function(err, result){
      if(err) {
        alert(err);
        return;
      }
      // 인증이 성공하면 SUCCESS 문자가 되돌아 옵니다.
      console.log('call result : ' + result);
      alert("인증 완료");
    });
  	  
	}
	
	//로그인 함수
	function submitLogin()
	{
	  // 입력 폼에서 ID와 비밀번호를 입력받습니다.
    // 저는 phone number를 alias로 설정해서 ID 처럼 사용할 수 있게 했습니다.
    var user_PhoneNumber = '+82' + document.getElementById("login_phone").value;
    var user_Pw = document.getElementById("login_pwd").value;
  
    // ID와 Password를 정해진 속성명인 Username과 Password에 담습니다.
    var authenticationData = {
      Username : user_PhoneNumber,
      Password : user_Pw
    };
  
    // 여기에는 ID와 User Pool 정보를 담아 놓습니다.
    var userData = {
      Username : user_PhoneNumber, // your username here
      Pool : userPool
    };
  
    // 로그인을 위해 Cognito 객체 2개를 준비합니다.
    var authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);
    var cognitoSignedUser = new AmazonCognitoIdentity.CognitoUser(userData);
  
    // authenticateUser 함수로 로그인을 시도합니다.
    cognitoSignedUser.authenticateUser(authenticationDetails, {
      onSuccess: function (result) {
        // 로그인에 성공하면 Token이 반환되어 옵니다.
        console.log('access token + ' + result.getAccessToken().getJwtToken());
        // API Gateway로 만든 API에 Request를 보낼 때는 Authorization 헤더의 값으로 idToken을 넣어야합니다.
        console.log('idToken + ' + result.idToken.jwtToken);
        alert("로그인되었습니다.");
        
        //페이지 넘기기
        //넘기면서 전화번호 정보, 이름 같이 옮기기
        // 세션 이용(전화번호)
        var sessionData = user_PhoneNumber;
        sessionStorage.setItem("phoneNumber", sessionData);
        
        sessionStorage.setItem("accessToken", result.getAccessToken().getJwtToken()); // 회원 탈퇴에 필요한 토큰 세션에 넣기.
        
        //dynamoDB guardInfo에서 관련 이름 찾아서 세션에 넣기
        var user_Name; // 이름 넣을 변수
        
        params = {
        	TableName : 'guardInfo',
        	Key : {
        		'contact' : user_PhoneNumber // hash key와 range key 모두 사용해야 함.
        	}
        };
       
        docClient.get(params, function(err, data){
        	if(err)
        	{
        	  console.log(err);
        	}
        	else 
        	{
        	    console.log(data.Item);
        	    user_Name = data.Item.name;// data.name이 아니라 data.Item.name임!! 근데 넘어가면 undefined가 뜬다
        	    sessionStorage.setItem("name", user_Name); // 그래서 여기 안에서 바로 이름 넣는다
        	    //alert(user_Name);
        	    location.href = "http://15.165.115.252:8080/admin"; // 여기로 이동
        	}
        });
        
        
       // location.href = "http://15.165.115.252:8080/admin"; // 여기에서 하면 너무 빨리 이동해서 세션에 못 넣음
        
      },
      onFailure: function(err) {
        alert(err);
      }
    });
	  
	}

