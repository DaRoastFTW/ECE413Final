$(function(){
    $("#nav-placeholder").load("navbar.html");
  });

  $("#submitbtn").click(login);
  
  function login(){
/*
    Soft check to see if email and password are legit. {Done}
   
    send Package of Password and email to Server {done}

    Create Session???? I have no idea how to do this. {done} 
*/
var email = $("#email").val();
var pwd1 = $("#pwd").val();
var email_check = false;

    if(validateEmail(email)){
    email_check = true;

    }
    else{

      alert("Email is not a Valid Email, FIX IT!!!!");
      $("#email").val("");
      $("#pwd").val("");
      return;
    }

    //AJAX Send Package to Server
    const cust_info = {email: email, password: pwd1};
    $.ajax({
        url: 'login/login',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(cust_info),
        dataType: 'json'
  
  
  
      })
      .done(function (data, textStatus, jqXHR) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("particle-token", data.particleToken);
        window.location.replace("account.html");
  
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
  $("#sacrifice").hover(function(){
    $("body").css("background-image", "url('images/evil_ritual_1.jpg')");
    $("#Vampire").css('display', 'none');
  },function(){
    $("body").css("background-image", "none");   
    $("#Vampire").css("display" , "block");
  });