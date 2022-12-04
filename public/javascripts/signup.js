
$(function(){
    $("#nav-placeholder").load("navbar.html");
  });
  $("#submitbtn").click(register);

  function register(){

    /*
    Store Email, Password1, Password2 as vars 

    check password1 === password2 Equal Type {Check}

    Check Email {Check}

    Package Email, (Means to JSON String)
    
    Post JSON String to SERVER

    RECIEVE  DATA FROM SERVER CHECK if email is in Server

    IF True:(Not in Server) Package Email: Password to send to store JSON String to Server

    Server is gonna send an ACK. 

    */


    var email = $("#email").val();
    var pwd1 = $("#pwd").val();
    var pwd2 = $("#pwd2").val();
    var pass_check = false; 
    var email_check = false;

    if(pwd1 === "" || pwd2 === ""){
      alert("I know this is super challenging, but you need to enter something into password field");
      return;
    }

    if (pwd1 === pwd2){
      pass_check = true;

    }
    else{
      alert("Passwords Do Not Match, FIX IT"); //maybe i should use better language
      $("#pwd").val("");
      $("#pwd2").val("");
      return;

    } 

  

    if(validateEmail(email)){
    email_check = true;

    }
    else{

      alert("Email is not a Valid Email, FIX IT!!!!");
      $("#email").val("");
      $("#pwd").val("");
      $("#pwd2").val("");
      return;
    }
    
    const cust_info = { email: email, password: pwd1};

    
    $.ajax({
      url: 'signup/signUp',
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(cust_info),
      dataType: 'json'



    })
    .done(function (data, textStatus, jqXHR) {
      if (data.success) {
      // after 1 second, move to "login.html"
      setTimeout(function () {
      window.location = "login.html";
      
      }, 1000);
      }

      })
      .fail(function(data, textStatus, errorThrown){
        alert(JSON.parse(data.responseText).msg);
        // fixed 

      })


  }


  const validateEmail = (email) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };